
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


export default function RouletteTab() {
  const { currentUser, pullGachaForCharacter, fetchAvailableMythicCardsCount } = useUser();
  const { toast } = useToast();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [revealedCard, setRevealedCard] = useState<FamiliarCard | null>(null);
  const [availableMythicCount, setAvailableMythicCount] = useState<number | null>(null);
  
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchAvailableMythicCardsCount().then(setAvailableMythicCount);
    }
  }, [fetchAvailableMythicCardsCount, currentUser?.role]);

  const isFirstSpinForChar = useMemo(() => {
    if (!currentUser || !selectedCharacterId) return false;
    const character = currentUser.characters.find(c => c.id === selectedCharacterId);
    if (!character || (character.familiarCards && character.familiarCards.length > 0)) {
        return false;
    }
    // Check if there's any gacha history for this character
    return !currentUser.pointHistory.some(log => 
        log.characterName === character.name && log.reason.includes('Рулетка')
    );
  }, [currentUser, selectedCharacterId]);

  const currentCost = isFirstSpinForChar ? 0 : ROULETTE_COST;

  const resetRoulette = () => {
    setIsFlipping(false);
    setRevealedCard(null);
  }

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (revealedCard && !isLoading) {
      // Automatically reset the roulette after a delay
      timer = setTimeout(() => {
        resetRoulette();
      }, 4000); // 4 seconds delay
    }
    return () => clearTimeout(timer);
  }, [revealedCard, isLoading]);


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
    setRevealedCard(null);

    // Start animation
    setIsFlipping(true);

    try {
      const { newCard, isDuplicate } = await pullGachaForCharacter(
        currentUser.id,
        selectedCharacterId
      );

      // Wait for flip animation to progress before showing the card
      setTimeout(() => {
        setRevealedCard(newCard);
      }, 300); // half of the animation duration

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

      // Refetch mythic count if admin
      if (currentUser.role === 'admin' && newCard.rank === 'мифический' && !isDuplicate) {
        fetchAvailableMythicCardsCount().then(setAvailableMythicCount);
      }

    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Произошла неизвестная ошибка.';
      toast({
        variant: 'destructive',
        title: 'Ошибка рулетки',
        description: errorMessage,
      });
      setIsFlipping(false);
    } finally {
      // Let the animation finish
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
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

          {currentUser?.role === 'admin' && availableMythicCount !== null && (
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
              disabled={isLoading || isFlipping}
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
              isFlipping ||
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
        {isFlipping ? (
           <div className="flex flex-col items-center gap-4">
               <div className="w-[300px] h-[420px] perspective-1000">
                 <div
                   className={cn(
                     'relative w-full h-full preserve-3d transition-transform duration-700',
                     revealedCard ? 'rotate-y-180' : ''
                   )}
                 >
                    {/* Card Back */}
                   <div className="absolute w-full h-full backface-hidden">
                     <Image
                       src="https://res.cloudinary.com/dxac8lq4f/image/upload/v1753198005/ChatGPT_Image_22_%D0%B8%D1%8E%D0%BB._2025_%D0%B3._18_26_28_isdxt3.png"
                       alt="Card Back"
                       width={300}
                       height={420}
                       className="rounded-xl object-cover shadow-2xl"
                     />
                   </div>
                    {/* Card Front */}
                    <div className="absolute w-full h-full backface-hidden rotate-y-180">
                       {revealedCard ? (
                           <FamiliarCardDisplay cardId={revealedCard.id} isRevealed />
                       ) : (
                        // Preload the back of the card here as well to avoid flashing
                         <div className="w-full h-full bg-background rounded-xl"></div>
                       )}
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
