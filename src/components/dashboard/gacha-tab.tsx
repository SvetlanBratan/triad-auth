'use client';

import React, { useState } from 'react';
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
import { Dices, Star } from 'lucide-react';
import type { FamiliarCard } from '@/lib/types';
import FamiliarCardDisplay from './familiar-card';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ALL_FAMILIARS } from '@/lib/data';

const GACHA_COST = 5000;

export default function GachaTab() {
  const { currentUser, pullGachaForCharacter } = useUser();
  const { toast } = useToast();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [revealedCard, setRevealedCard] = useState<FamiliarCard | null>(null);

  const handlePullGacha = async () => {
    if (!currentUser || !selectedCharacterId) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Пожалуйста, выберите персонажа.',
      });
      return;
    }

    if (currentUser.points < GACHA_COST) {
      toast({
        variant: 'destructive',
        title: 'Недостаточно баллов',
        description: `Вам нужно ${GACHA_COST.toLocaleString()} баллов.`,
      });
      return;
    }

    const character = currentUser.characters.find(c => c.id === selectedCharacterId);
    const ownedCardIds = new Set((character?.familiarCards || []).map(c => c.id));
    const availableCards = ALL_FAMILIARS.filter(c => !ownedCardIds.has(c.id));

    if (availableCards.length === 0) {
        toast({
            variant: "destructive",
            title: "Все карты собраны!",
            description: "Поздравляем! Этот персонаж уже собрал всех доступных фамильяров.",
        });
        return;
    }

    setIsLoading(true);
    setRevealedCard(null);

    // Start animation
    setIsFlipping(true);

    try {
      const newCard = await pullGachaForCharacter(
        currentUser.id,
        selectedCharacterId,
        GACHA_COST
      );

      // Wait for flip animation to progress before showing the card
      setTimeout(() => {
        setRevealedCard(newCard);
      }, 300); // half of the animation duration

      toast({
        title: 'Успех!',
        description: `Вы получили карту: ${newCard.name}!`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Произошла неизвестная ошибка.';
      toast({
        variant: 'destructive',
        title: 'Ошибка гачи',
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
  
  const resetGacha = () => {
    setIsFlipping(false);
    setRevealedCard(null);
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dices /> Гача Фамильяров
          </CardTitle>
          <CardDescription>
            Испытайте свою удачу! Получите случайную карту фамильяра для одного
            из ваших персонажей.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10">
            <span className="font-semibold">Стоимость одной прокрутки:</span>
            <span className="font-bold text-lg text-primary flex items-center gap-1">
              <Star className="w-4 h-4" /> {GACHA_COST.toLocaleString()}
            </span>
          </div>

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
            onClick={handlePullGacha}
            disabled={
              !selectedCharacterId ||
              isLoading ||
              (currentUser?.points ?? 0) < GACHA_COST ||
              currentUser?.characters.length === 0
            }
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Прокрутка...' : 'Крутить!'}
          </Button>
        </CardContent>
      </Card>

      <div className="w-full max-w-md h-[450px] flex items-center justify-center">
        {isFlipping ? (
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
             {revealedCard && (
                <div className="text-center mt-4">
                    <Button onClick={resetGacha} variant="outline">Крутить еще раз</Button>
                </div>
             )}
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
