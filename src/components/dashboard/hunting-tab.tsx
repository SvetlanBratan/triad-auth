'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Compass, Send, Hourglass, CheckCircle, Bone, X } from 'lucide-react';
import type { Character, FamiliarCard, FamiliarRank, HuntingLocation, OngoingHunt, InventoryItem } from '@/lib/types';
import Image from 'next/image';
import { SearchableSelect } from '../ui/searchable-select';
import { formatHuntTimeLeft, cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DEFAULT_GAME_SETTINGS } from '@/lib/data';
import { ScrollArea } from '../ui/scroll-area';


const rankOrder: FamiliarRank[] = ['мифический', 'легендарный', 'редкий', 'обычный'];

const rankNames: Record<FamiliarRank, string> = {
    'мифический': 'Мифический',
    'легендарный': 'Легендарный',
    'редкий': 'Редкий',
    'обычный': 'Обычный',
    'ивентовый': 'Ивентовый',
};

const LocationCard = ({ location, onSelect, currentHunts = 0, limit = 10 }: { location: HuntingLocation, onSelect: (location: HuntingLocation) => void, currentHunts?: number, limit?: number }) => {
    const isFull = currentHunts >= limit;
    return (
        <Card className={cn("overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer flex flex-col sm:flex-row", isFull && "opacity-60 cursor-not-allowed")} onClick={() => !isFull && onSelect(location)}>
            {location.image && (
                <div className="relative aspect-video sm:aspect-square sm:w-1/3 shrink-0 bg-muted">
                    <Image src={location.image} alt={location.name} fill style={{objectFit:"cover"}} data-ai-hint="fantasy landscape" />
                    {isFull && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <p className="text-white font-bold text-lg">Заполнено</p>
                        </div>
                    )}
                </div>
            )}
            <div className="flex flex-col flex-1 p-4 justify-between">
                <div>
                    <CardTitle className="text-lg">{location.name}</CardTitle>
                    <ScrollArea className="h-20 mt-2">
                        <p className="text-xs text-muted-foreground pr-4">{location.description}</p>
                    </ScrollArea>
                </div>
                <div className="text-xs text-muted-foreground flex justify-between items-center mt-2">
                    <span>{location.durationMinutes} мин. / Ранг: {rankNames[location.requiredRank]}</span>
                    <span className="font-semibold text-foreground">{currentHunts} / {limit}</span>
                </div>
            </div>
        </Card>
    )
}

export default function HuntingTab() {
  const { currentUser, gameSettings = DEFAULT_GAME_SETTINGS, startHunt, claimHuntReward, recallHunt, familiarsById, claimAllHuntRewards } = useUser();
  const { toast } = useToast();
  
  const [selectedLocation, setSelectedLocation] = useState<HuntingLocation | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [selectedFamiliarId, setSelectedFamiliarId] = useState<string>('');

  const [isSending, setIsSending] = useState(false);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [isClaimingAll, setIsClaimingAll] = useState(false);
  
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const character = useMemo(() => currentUser?.characters.find(c => c.id === selectedCharacterId), [currentUser, selectedCharacterId]);

  const availableFamiliars = useMemo(() => {
    if (!character || !selectedLocation) return [];
    
    const busyFamiliarIds = new Set((character.ongoingHunts || []).map(hunt => hunt.familiarId));
    const requiredRankIndex = rankOrder.indexOf(selectedLocation.requiredRank);

    return (character.familiarCards || [])
        .map(owned => familiarsById[owned.id])
        .filter((fam): fam is FamiliarCard => {
            if (!fam || busyFamiliarIds.has(fam.id)) return false;
            const famRankIndex = rankOrder.indexOf(fam.rank);
            return famRankIndex !== -1 && famRankIndex <= requiredRankIndex;
        })
        .map(fam => ({ value: fam.id, label: `${fam.name} (${rankNames[fam.rank]})`}));
  }, [character, selectedLocation, familiarsById]);

  const huntsByLocation = useMemo(() => {
    if (!character) return {};
    return (character.ongoingHunts || []).reduce((acc, hunt) => {
        acc[hunt.locationId] = (acc[hunt.locationId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
  }, [character]);

  const handleStartHunt = async () => {
    if (!selectedCharacterId || !selectedFamiliarId || !selectedLocation) return;
    setIsSending(true);
    try {
        await startHunt(selectedCharacterId, selectedFamiliarId, selectedLocation.id);
        toast({ title: 'Охота началась!', description: 'Ваш фамильяр отправился на добычу ингредиентов.' });
        setSelectedLocation(null);
        setSelectedFamiliarId('');
    } catch(e) {
        const msg = e instanceof Error ? e.message : 'Произошла ошибка';
        toast({ variant: 'destructive', title: 'Ошибка', description: msg });
    } finally {
        setIsSending(false);
    }
  }

  const handleClaimReward = async (hunt: OngoingHunt) => {
    if (!character) return;
    setIsProcessingId(hunt.huntId);
    try {
        const rewards = await claimHuntReward(character.id, hunt.huntId);
        if (rewards.length > 0) {
            const rewardList = rewards.map(r => `${r.name} (x${r.quantity})`).join(', ');
            toast({ 
                title: 'Добыча собрана!', 
                description: `Получено: ${rewardList}`
            });
        } else {
            toast({
                title: 'Охота завершена',
                description: 'К сожалению, фамильяр вернулся с пустыми лапами.',
            });
        }
    } catch(e) {
        const msg = e instanceof Error ? e.message : 'Произошла ошибка';
        toast({ variant: 'destructive', title: 'Ошибка', description: msg });
    } finally {
        setIsProcessingId(null);
    }
  }

  const handleRecall = async (hunt: OngoingHunt) => {
    if (!character) return;
    setIsProcessingId(hunt.huntId);
    try {
        await recallHunt(character.id, hunt.huntId);
        toast({ title: 'Фамильяр отозван', description: 'Экспедиция отменена, добыча не получена.' });
    } catch(e) {
        const msg = e instanceof Error ? e.message : 'Произошла ошибка';
        toast({ variant: 'destructive', title: 'Ошибка', description: msg });
    } finally {
        setIsProcessingId(null);
    }
  }

  const ongoingHunts = useMemo(() => {
    if (!character) return [];
    return character.ongoingHunts || [];
  }, [character]);
  
  const finishedHunts = useMemo(() => {
      return ongoingHunts.filter(hunt => new Date(hunt.endsAt) <= now);
  }, [ongoingHunts, now]);

  const handleClaimAll = async () => {
      if (!character || finishedHunts.length === 0) return;

      setIsClaimingAll(true);
      
      try {
          const allRewards = await claimAllHuntRewards(character.id);
          
          if (allRewards.length > 0) {
              const rewardSummary = allRewards
                  .map(r => `${r.name} (x${r.quantity})`)
                  .join(', ');
              
              toast({
                  title: `Добыча собрана с ${finishedHunts.length} экспедиций!`,
                  description: `Получено: ${rewardSummary}`
              });
          } else {
              toast({
                  title: `Экспедиции завершены`,
                  description: `${finishedHunts.length} фамильяров вернулись с пустыми лапами.`
              });
          }
      } catch (e) {
          const msg = e instanceof Error ? e.message : 'Произошла ошибка при сборе всей добычи.';
          toast({ variant: 'destructive', title: 'Ошибка', description: msg });
      } finally {
          setIsClaimingAll(false);
      }
  }
  
  return (
    <div className="space-y-8">
        {ongoingHunts.length > 0 && (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Текущие экспедиции</CardTitle>
                    {finishedHunts.length > 0 && (
                        <Button onClick={handleClaimAll} disabled={isClaimingAll}>
                           {isClaimingAll ? "Сбор..." : <><Bone className="mr-2 h-4 w-4" /> Забрать всё</>}
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    {ongoingHunts.map(hunt => {
                        const location = gameSettings.huntingLocations?.find(l => l.id === hunt.locationId);
                        const familiar = familiarsById[hunt.familiarId];
                        const isFinished = new Date(hunt.endsAt) <= now;
                        
                        return (
                            <Dialog key={hunt.huntId}>
                                <DialogTrigger asChild>
                                    <div className="relative w-28 h-40 cursor-pointer group transition-all duration-300 hover:scale-105">
                                        <Image src={familiar.imageUrl} alt={familiar.name} layout="fill" className="rounded-lg object-cover" />
                                        {isFinished ? (
                                            <div className="absolute inset-0 bg-green-800/60 flex items-center justify-center rounded-lg backdrop-blur-sm">
                                                <Bone className="w-8 h-8 text-white animate-pulse" />
                                            </div>
                                        ) : (
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs text-center p-1 rounded-b-lg">
                                                <span>{formatHuntTimeLeft(hunt.endsAt)}</span>
                                            </div>
                                        )}
                                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-1 rounded-t-lg">
                                            <p className="text-white text-xs font-bold truncate">{familiar.name}</p>
                                        </div>
                                    </div>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{familiar.name}</DialogTitle>
                                        <DialogDescription>Охота в локации: {location?.name}</DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4 text-center">
                                        <div className="text-2xl font-mono font-bold text-primary">
                                            {isFinished ? 'Завершено!' : <span>{formatHuntTimeLeft(hunt.endsAt)}</span>}
                                        </div>
                                         <p className="text-sm text-muted-foreground">{isFinished ? 'Можно забрать добычу.' : 'Осталось времени.'}</p>
                                    </div>
                                    <DialogFooter className="grid grid-cols-2 gap-2">
                                        {!isFinished && (
                                            <Button
                                                variant="outline"
                                                onClick={() => handleRecall(hunt)}
                                                disabled={isProcessingId === hunt.huntId}
                                            >
                                               <X className="mr-2 h-4 w-4" />Отозвать
                                            </Button>
                                        )}
                                        <Button 
                                            onClick={() => handleClaimReward(hunt)} 
                                            disabled={!isFinished || isProcessingId === hunt.huntId}
                                            className={cn(!isFinished && "col-span-2")}
                                        >
                                            {isProcessingId === hunt.huntId ? 'Сбор...' : <><Bone className="mr-2 h-4 w-4"/>Забрать добычу</>}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )
                    })}
                </CardContent>
            </Card>
        )}

        <Card>
            <CardHeader>
                <CardTitle>Отправить на охоту</CardTitle>
                 <CardDescription>Выберите персонажа, затем локацию для охоты.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                     <SearchableSelect
                        options={(currentUser?.characters || []).map(c => ({ value: c.id, label: c.name }))}
                        value={selectedCharacterId}
                        onValueChange={(val) => {
                            setSelectedCharacterId(val);
                            setSelectedLocation(null);
                            setSelectedFamiliarId('');
                        }}
                        placeholder="Выберите персонажа..."
                     />
                    
                    {selectedCharacterId && (
                        <>
                            {selectedLocation ? (
                                <div className="p-4 border rounded-lg space-y-4">
                                    <h3 className="font-semibold">Выбрана локация: {selectedLocation.name}</h3>
                                    <SearchableSelect
                                        options={availableFamiliars}
                                        value={selectedFamiliarId}
                                        onValueChange={setSelectedFamiliarId}
                                        placeholder="Выберите фамильяра..."
                                    />
                                    <div className="flex gap-2">
                                        <Button variant="ghost" onClick={() => setSelectedLocation(null)}>Назад к локациям</Button>
                                        <Button onClick={handleStartHunt} disabled={!selectedFamiliarId || isSending}>
                                            <Send className="mr-2 h-4 w-4"/>{isSending ? 'Отправка...' : 'Отправить'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="font-semibold mb-2">Доступные локации:</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(gameSettings.huntingLocations || []).map(loc => {
                                             const currentHunts = huntsByLocation[loc.id] || 0;
                                             return <LocationCard key={loc.id} location={loc} onSelect={setSelectedLocation} currentHunts={currentHunts} limit={10} />
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
