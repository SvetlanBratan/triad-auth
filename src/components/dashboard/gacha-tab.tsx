
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dices, Star, Sprout, Gift, ShieldAlert } from 'lucide-react';
import type { FamiliarCard } from '@/lib/types';
import FamiliarCardDisplay from './familiar-card';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ALL_FAMILIARS } from '@/lib/data';

const ROULETTE_COST = 5000;
const DUPLICATE_REFUND = 1000;

const totalMythicCount = ALL_FAMILIARS.filter(f => f.rank === 'мифический').length;

interface PullResult {
    newCard: FamiliarCard;
    isDuplicate: boolean;
}

export default function RouletteTab() {
  const { currentUser, pullGachaForCharacter, fetchAvailableMythicCardsCount, setCurrentUser } = useUser();
  const { toast } = useToast();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [pullResult, setPullResult] = useState<PullResult | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [availableMythicCount, setAvailableMythicCount] = useState<number | null>(null);
  
  useEffect(() => {
    fetchAvailableMythicCardsCount().then(setAvailableMythicCount);
  }, [fetchAvailableMythicCardsCount]);

  const isFirstSpinForChar = useMemo(() => {
    if (!currentUser || !selectedCharacterId) return false;
    const character = currentUser.characters.find(c => c.id === selectedCharacterId);
    if (!character) return false;
    
    // Check if the character has any familiar cards yet
    const hasCards = character.inventory?.familiarCards && character.inventory.familiarCards.length > 0;
    
    // Check if there is any roulette log for this character
    const hasHistory = currentUser.pointHistory.some(log => 
        log.characterId === character.id && log.reason.includes('Рулетка')
    );
    
    return !hasCards && !hasHistory;
  }, [currentUser, selectedCharacterId]);

  const currentCost = isFirstSpinForChar ? 0 : ROULETTE_COST;


  const handlePull = async () => {
    if (!currentUser || !selectedCharacterId) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Пожалуйста, выберите персонажа.',
      });
      return;
    }

    if (currentUser.points < currentCost) {
      toast({
        variant: 'destructive',
        title: 'Недостаточно баллов',
        description: `Вам нужно ${currentCost.toLocaleString()} баллов.`,
      });
      return;
    }

    setIsLoading(true);
    setPullResult(null); 
    setIsFlipping(false);

    try {
      const { updatedUser, ...result } = await pullGachaForCharacter(
        currentUser.id,
        selectedCharacterId
      );
      
      setPullResult(result);
      setCurrentUser(updatedUser); // Immediately update user state

    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Произошла неизвестная ошибка.';
      toast({
        variant: 'destructive',
        title: 'Ошибка рулетки',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = () => {
    if (!pullResult || isFlipping) return;

    setIsFlipping(true);

    setTimeout(() => {
        const { newCard, isDuplicate } = pullResult;
        if (isDuplicate) {
            toast({
                title: 'Дубликат!',
                description: `У вас уже есть карта "${newCard.name}". Вам возвращено ${DUPLICATE_REFUND.toLocaleString()} баллов.`,
            });
        } else {
            toast({
                title: 'Успех!',
                description: `Вы получили новую карту: ${newCard.name}!`,
            });
        }

        // Refetch mythic count if a new mythic card was pulled
        if (newCard.rank === 'мифический' && !isDuplicate) {
            fetchAvailableMythicCardsCount().then(setAvailableMythicCount);
        }
    }, 700); // Corresponds to animation duration
  };
  

  return (
    <div className="flex flex-col items-center gap-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dices /> Рулетка Фамильяров
          </CardTitle>
          <CardDescription>
            Испытайте свою удачу! Получите случайную карту фамильяра для одного
            из ваших персонажей. Дубликат вернет вам 1000 баллов.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10">
            <span className="font-semibold">Стоимость одной прокрутки:</span>
            <span className={cn(
                "font-bold text-lg text-primary flex items-center gap-1",
                isFirstSpinForChar && "text-green-600"
            )}>
              {isFirstSpinForChar ? <Gift className="w-4 h-4" /> : <Star className="w-4 h-4" />}
              {isFirstSpinForChar ? 'Бесплатно' : `${ROULETTE_COST.toLocaleString()}`}
            </span>
          </div>

          {availableMythicCount !== null && (
            <div className="flex justify-between items-center p-3 rounded-lg bg-amber-500/10 text-amber-800 text-sm">
                 <span className="font-semibold flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Мифические карты:</span>
                 <span className="font-bold">{availableMythicCount} / {totalMythicCount} доступно</span>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">
              Выберите персонажа:
            </label>
            <Select
              onValueChange={setSelectedCharacterId}
              value={selectedCharacterId}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите персонажа..." />
              </SelectTrigger>
              <SelectContent>
                {currentUser?.characters.map((char) => (
                  <SelectItem key={char.id} value={char.id}>
                    {char.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
             {currentUser?.characters.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">У вас нет персонажей. Добавьте одного во вкладке "Мой профиль".</p>
            )}
          </div>
          <Button
            onClick={handlePull}
            disabled={
              !selectedCharacterId ||
              isLoading ||
              (currentUser?.points ?? 0) < currentCost ||
              currentUser?.characters.length === 0
            }
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Прокрутка...' : (isFirstSpinForChar ? 'Крутить бесплатно!' : 'Крутить!')}
          </Button>
        </CardContent>
      </Card>

      <div className="w-full max-w-md min-h-[480px] flex items-center justify-center">
        {pullResult ? (
           <div className="flex flex-col items-center gap-4">
               <div className="w-[300px] h-[420px] perspective-1000" onClick={handleCardClick}>
                 <div
                   className={cn(
                       'relative w-full h-full preserve-3d transition-transform duration-700',
                       isFlipping && 'rotate-y-180'
                   )}
                 >
                    {/* Card Back */}
                    <div className="absolute w-full h-full backface-hidden">
                       <Image 
                           src="https://res.cloudinary.com/dxac8lq4f/image/upload/v1753198005/ChatGPT_Image_22_%D0%B8%D1%8E%D0%BB._2025_%D0%B3._18_26_28_isdxt3.png"
                           alt="Рубашка карты"
                           width={300}
                           height={420}
                           className="rounded-xl object-cover shadow-2xl"
                        />
                    </div>
                    {/* Card Front */}
                    <div className="absolute w-full h-full backface-hidden rotate-y-180">
                        <FamiliarCardDisplay cardId={pullResult.newCard.id} isRevealed />
                    </div>
                 </div>
               </div>
           </div>
        ) : (
             <div className="text-center text-muted-foreground">
                <p>Здесь появится ваша карта.</p>
             </div>
        )}
      </div>
    </div>
  );
}
