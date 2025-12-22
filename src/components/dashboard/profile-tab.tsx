

'use client';

import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Pencil, UserSquare, Sparkles, Anchor, KeyRound, ChevronDown } from 'lucide-react';
import type { PointLog, UserStatus, Character, User, FamiliarCard, FamiliarRank } from '@/lib/types';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import React, { useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn, formatTimeLeft } from '@/lib/utils';
import { ACHIEVEMENTS_BY_ID } from '@/lib/data';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import CharacterForm, { type EditingState } from './character-form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import FamiliarCardDisplay from './familiar-card';
import RewardRequestsHistory from './reward-requests-history';
import AvatarUploader from './avatar-uploader';
import Image from 'next/image';
import { CustomIcon } from '../ui/custom-icon';


const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    // If the name starts with 'ach-', assume it's a custom achievement icon
    if (name.startsWith('ach-')) {
        return (
            <CustomIcon src={`/icons/${name}.svg`} className={cn("icon-primary", className)} />
        );
    }
    // Fallback to Lucide icons for other cases
    const IconComponent = (import('lucide-react') as any)[name];
    if (!IconComponent) {
        return <CustomIcon src="/icons/points.svg" className={className} />;
    }
    return <IconComponent className={className} />;
};


const rankOrder: FamiliarRank[] = ['мифический', 'ивентовый', 'легендарный', 'редкий', 'обычный'];
const rankNames: Record<FamiliarRank, string> = {
    'мифический': 'Мифические',
    'ивентовый': 'Ивентовые',
    'легендарный': 'Легендарные',
    'редкий': 'Редкие',
    'обычный': 'Обычные'
};


const CharacterDisplay = ({ character, onDelete }: { character: Character, onDelete: (characterId: string) => void }) => {
    const { familiarsById } = useUser();
    const isBlessed = character.blessingExpires && new Date(character.blessingExpires) > new Date();
    const activeMoodlets = (character.moodlets || []).filter(m => new Date(m.expiresAt) > new Date());
    const familiarCards = character.familiarCards || [];

    const groupedFamiliars = familiarCards.reduce((acc, ownedCard, index) => {
        const cardDetails = familiarsById[ownedCard.id];
        if (cardDetails) {
            const rank = cardDetails.rank;
            if (!acc[rank]) {
                acc[rank] = [];
            }
            acc[rank].push({ ...cardDetails, uniqueKey: `${cardDetails.id}-${index}` });
        }
        return acc;
    }, {} as Record<FamiliarRank, (FamiliarCard & { uniqueKey: string })[]>);


    return (
        <AccordionItem value={character.id} className="border rounded-md px-2 mb-2">
             <div className="flex justify-between items-center w-full">
                 <AccordionTrigger className="flex-1 py-3 hover:no-underline group">
                   <div className="flex items-center gap-3">
                        <UserSquare className="w-8 h-8 text-primary" />
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Link href={`/characters/${character.id}`} className="font-bold text-base hover:underline" onClick={e => e.stopPropagation()}>{character.name}</Link>
                                 {isBlessed && (
                                   <Sparkles className="h-4 w-4 text-yellow-500" />
                                 )}
                                 {character.hasLeviathanFriendship && (
                                     <Anchor className="h-4 w-4 text-blue-500" />
                                 )}
                                 {character.hasCrimeConnections && (
                                    <CustomIcon src="/icons/ach-mafiosi.svg" className="h-6 w-6 icon-black" />
                                 )}
                            </div>
                            <p className="text-sm text-muted-foreground text-left">{character.activity}</p>
                        </div>
                    </div>
                </AccordionTrigger>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0 hover:bg-destructive/10" onClick={e => e.stopPropagation()}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Это действие невозможно отменить. Это навсегда удалит вашего персонажа
                                <span className="font-bold"> {character.name} </span>
                                и все его данные, включая анкету и инвентарь.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(character.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Да, удалить
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            <AccordionContent>
                 {activeMoodlets.length > 0 && (
                    <div className="px-2 pb-2">
                        <h4 className="text-sm font-semibold mb-2">Мудлеты:</h4>
                        <div className="flex flex-wrap gap-2">
                            {activeMoodlets.map(moodlet => (
                                <Popover key={moodlet.id}>
                                    <PopoverTrigger asChild>
                                        <Badge variant="outline" className="cursor-pointer">
                                            <DynamicIcon name={moodlet.iconName} className="w-3.5 h-3.5 mr-1.5" />
                                            {moodlet.name}
                                        </Badge>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto max-w-xs text-sm">
                                        <p className="font-bold">{moodlet.name}</p>
                                        <p className="text-xs mb-2">{moodlet.description}</p>
                                        {moodlet.source && <p className="text-xs mb-2">Источник: <span className="font-semibold">{moodlet.source}</span></p>}
                                        <p className="text-xs text-muted-foreground">{formatTimeLeft(moodlet.expiresAt)}</p>
                                    </PopoverContent>
                                </Popover>
                            ))}
                        </div>
                    </div>
                )}
                 <Accordion type="single" collapsible className="w-full mt-2">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="text-sm">Показать фамильяров ({familiarCards.length})</AccordionTrigger>
                        <AccordionContent>
                            {familiarCards.length > 0 ? (
                                <div className="space-y-4 pt-2">
                                    {rankOrder.map(rank => {
                                        if (groupedFamiliars[rank] && groupedFamiliars[rank].length > 0) {
                                        return (
                                            <div key={rank}>
                                            <h4 className="font-semibold capitalize text-muted-foreground mb-2">{rankNames[rank]}</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {groupedFamiliars[rank].map(card => (
                                                    <FamiliarCardDisplay key={card.uniqueKey} cardId={card.id} />
                                                ))}
                                            </div>
                                            </div>
                                        )
                                        }
                                        return null;
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">У этого персонажа нет фамильяров.</p>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </AccordionContent>
       </AccordionItem>
    );
};


export default function ProfileTab() {
  const { currentUser, updateCharacterInUser, deleteCharacterFromUser, fetchUsersForAdmin, checkExtraCharacterSlots, setCurrentUser } = useUser();
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [isAvatarDialogOpen, setAvatarDialogOpen] = React.useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const { toast } = useToast();

  const freeSlots = 6;
  const totalSlots = freeSlots + (currentUser?.extraCharacterSlots || 0);
  const canAddCharacter = currentUser ? currentUser.characters.length < totalSlots : false;

   useEffect(() => {
    if (editingState) {
      fetchUsersForAdmin().then(setAllUsers);
    }
  }, [editingState, fetchUsersForAdmin]);

  useEffect(() => {
    // Check and update extra slots when component mounts or currentUser changes
    const updateUserSlots = async () => {
        if (currentUser) {
            const slots = await checkExtraCharacterSlots(currentUser.id);
            if(currentUser.extraCharacterSlots !== slots) {
                setCurrentUser({...currentUser, extraCharacterSlots: slots});
            }
        }
    };
    updateUserSlots();
  }, [currentUser, checkExtraCharacterSlots, setCurrentUser]);


  if (!currentUser) return null;
  
  const handleAddClick = () => {
    if (!canAddCharacter) {
        toast({
            variant: "destructive",
            title: "Достигнут лимит персонажей",
            description: "Чтобы добавить больше персонажей, приобретите награду 'Дополнительный персонаж' в магазине.",
        });
        return;
    }
    setEditingState({ type: 'createCharacter' });
  };

  const handleDeleteCharacter = (characterId: string) => {
    if (!currentUser) return;
    deleteCharacterFromUser(currentUser.id, characterId);
    toast({ variant: 'destructive', title: "Персонаж удален", description: "Персонаж и все его данные были удалены." });
  };

  const handleFormSubmit = (characterData: Character) => {
      if (!currentUser) return;

      updateCharacterInUser(currentUser.id, characterData);
      
      toast({ title: "Успешно", description: "Данные персонажа сохранены." });

      setEditingState(null);
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const getStatusClass = (status: UserStatus) => {
    switch (status) {
      case 'активный':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'неактивный':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'отпуск':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      default:
        return '';
    }
  };
  
  const sortedPointHistory = currentUser.pointHistory.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const userAchievements = (currentUser.achievementIds || []).map(id => ACHIEVEMENTS_BY_ID[id]).filter(Boolean);

  const characterMap = useMemo(() => {
    const map = new Map<string, string>();
    currentUser.characters.forEach(c => map.set(c.id, c.name));
    return map;
  }, [currentUser.characters]);

  const characterToEdit = useMemo(() => {
    if (!editingState || editingState.type !== 'createCharacter') return null;
    // This logic might need to be expanded if we edit existing characters from this component.
    // For now, it only handles creation.
    return null;
  }, [editingState]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
             <div className="flex items-center gap-4">
                <div 
                    className="relative group cursor-pointer"
                    onClick={() => setAvatarDialogOpen(true)}
                >
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                        <AvatarFallback>{currentUser.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pencil className="w-6 h-6 text-white" />
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <CardTitle className="text-xl sm:text-2xl font-headline truncate">{currentUser.name}</CardTitle>
                    <CardDescription className="truncate text-sm sm:text-base">{currentUser.email}</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Баллы</span>
              <span className="font-bold text-lg text-primary flex items-center gap-1">
                <CustomIcon src="/icons/points.svg" className="w-5 h-5 icon-primary" /> {currentUser.points.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Статус</span>
              <Badge variant={'outline'} className={cn("capitalize", getStatusClass(currentUser.status))}>
                {currentUser.status}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Роль</span>
              <Badge variant="outline">{currentUser.role}</Badge>
            </div>
             {userAchievements.length > 0 && (
                <div className="pt-4">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Достижения</h4>
                    <div className="flex flex-wrap gap-2">
                        {userAchievements.map(ach => (
                            <Popover key={ach.id}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="icon" className="w-8 h-8 bg-muted hover:bg-primary/10">
                                        <DynamicIcon name={ach.id} />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto max-w-xs">
                                    <p className="font-bold">{ach.name}</p>
                                    <p className="text-xs">{ach.description}</p>
                                </PopoverContent>
                            </Popover>
                        ))}
                    </div>
                </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Персонажи</CardTitle>
                    <CardDescription>
                        ({currentUser.characters.length} / {totalSlots})
                    </CardDescription>
                </div>
                <TooltipProvider>
                    <Popover open={!canAddCharacter ? undefined : false}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={handleAddClick}>
                                <PlusCircle className="h-5 h-5" />
                                <span className="sr-only">Добавить персонажа</span>
                            </Button>
                        </PopoverTrigger>
                         <PopoverContent className="w-auto max-w-xs text-sm" side="top">
                             Чтобы добавить больше персонажей, приобретите награду 'Дополнительный персонаж' в магазине.
                         </PopoverContent>
                    </Popover>
                </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            {currentUser.characters.length > 0 ? (
                <Accordion type="single" collapsible className="w-full space-y-2">
                    {currentUser.characters.map(char => (
                        <CharacterDisplay key={char.id} character={char} onDelete={handleDeleteCharacter} />
                    ))}
                </Accordion>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Персонажей пока нет.</p>
            )}
          </CardContent>
        </Card>
        <RewardRequestsHistory />
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>История баллов</CardTitle>
            <CardDescription>Журнал ваших заработанных и потраченных баллов.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[80vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Причина</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPointHistory.length > 0 ? sortedPointHistory.map((log: PointLog) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">{formatDate(log.date)}</TableCell>
                    <TableCell>
                      <p>{log.reason}</p>
                      {log.characterId && <p className="text-xs text-muted-foreground">Персонаж: {characterMap.get(log.characterId) || 'Неизвестно'}</p>}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${log.amount > 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {log.amount > 0 ? '+' : ''}{log.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      Истории баллов пока нет.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

       <Dialog open={!!editingState} onOpenChange={(isOpen) => !isOpen && setEditingState(null)}>
            <DialogContent>
                <CharacterForm 
                    onSubmit={handleFormSubmit as (data: Character) => void}
                    character={characterToEdit}
                    allUsers={allUsers}
                    closeDialog={() => setEditingState(null)}
                    editingState={editingState}
                />
            </DialogContent>
        </Dialog>
        
        <Dialog open={isAvatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Обновить аватар</DialogTitle>
                    <DialogDescription>
                        Выберите новое изображение для вашего профиля.
                    </DialogDescription>
                </DialogHeader>
                <AvatarUploader closeDialog={() => setAvatarDialogOpen(false)} />
            </DialogContent>
        </Dialog>
    </div>
  );
}








