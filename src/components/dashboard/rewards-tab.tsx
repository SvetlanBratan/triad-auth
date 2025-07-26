
"use client";

import { useUser } from '@/hooks/use-user';
import { rewards } from '@/lib/data';
import type { Reward } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import * as LucideIcons from 'lucide-react';
import { Star } from 'lucide-react';
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type IconName = keyof typeof LucideIcons;

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
    const IconComponent = LucideIcons[name as IconName];

    if (!IconComponent) {
        // Fallback icon
        return <Star className={className} />;
    }

    return <IconComponent className={className} />;
};


export default function RewardsTab() {
  const { currentUser, createRewardRequest } = useUser();
  const { toast } = useToast();
  const [selectedReward, setSelectedReward] = React.useState<Reward | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = React.useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleRedeemClick = (reward: Reward) => {
    if (!currentUser) return;

    if (currentUser.points < reward.cost) {
      toast({
        variant: "destructive",
        title: "Недостаточно баллов",
        description: `Вам нужно ${reward.cost.toLocaleString()} баллов, чтобы получить эту награду.`,
      });
      return;
    }
    
    setSelectedReward(reward);
    setIsDialogOpen(true);
  };

  const handleConfirmRequest = async () => {
    if (!currentUser || !selectedReward || !selectedCharacterId) return;
    setIsLoading(true);

    const character = currentUser.characters.find(c => c.id === selectedCharacterId);
    
    if (!character) {
        toast({ variant: "destructive", title: "Ошибка", description: "Выбранный персонаж не найден." });
        setIsLoading(false);
        return;
    }

    try {
        await createRewardRequest({
            userId: currentUser.id,
            userName: currentUser.name,
            rewardId: selectedReward.id,
            rewardTitle: selectedReward.title,
            rewardCost: selectedReward.cost,
            characterId: character.id,
            characterName: character.name,
        });
        toast({
            title: "Запрос отправлен!",
            description: `Ваш запрос на "${selectedReward.title}" отправлен на рассмотрение. Баллы списаны.`,
        });
    } catch (error) {
        console.error("Failed to create reward request:", error);
        toast({
            variant: "destructive",
            title: "Ошибка",
            description: "Не удалось отправить запрос. Попробуйте снова.",
        });
    } finally {
        setIsLoading(false);
        setIsDialogOpen(false);
        setSelectedReward(null);
        setSelectedCharacterId('');
    }
  }

  return (
    <div>
        <Card className="mb-6 bg-primary/10 border-primary/20">
            <CardHeader className="flex flex-row items-center gap-4">
                <Star className="w-8 h-8 text-primary"/>
                <div>
                    <CardTitle>Ваши баллы</CardTitle>
                    <CardDescription className="text-primary/80">У вас есть <span className="font-bold text-xl text-primary">{currentUser?.points.toLocaleString()}</span> баллов для траты.</CardDescription>
                </div>
            </CardHeader>
        </Card>
      
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rewards.map(reward => (
          <Card key={reward.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex-row gap-4 items-start">
              <div className="bg-primary/10 p-3 rounded-lg">
                <DynamicIcon name={reward.iconName} className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-headline leading-tight">{reward.title}</CardTitle>
                <CardDescription className="text-xs mt-1">{reward.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              {reward.type === 'temporary' && <p className="text-xs text-accent font-semibold uppercase tracking-wider">Временная</p>}
            </CardContent>
            <CardFooter className="flex justify-between items-center bg-muted/50 p-4 mt-auto">
              <p className="font-bold text-lg text-primary flex items-center gap-1.5">
                <Star className="w-5 h-5" /> {reward.cost.toLocaleString()}
              </p>
              <Button size="sm" onClick={() => handleRedeemClick(reward)} disabled={(currentUser?.points ?? 0) < reward.cost || isLoading}>
                {isLoading ? 'Обработка...' : 'Запросить'}
              </Button>
            </CardFooter>
          </Card>
        ))}
        </div>

        {selectedReward && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Запросить "{selectedReward.title}"</DialogTitle>
                        <DialogDescription>
                            Выберите персонажа для этой награды. После подтверждения запрос будет отправлен администраторам.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p>Для какого персонажа вы хотите запросить награду?</p>
                        <Select onValueChange={setSelectedCharacterId} value={selectedCharacterId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Выберите персонажа..." />
                            </SelectTrigger>
                            <SelectContent>
                                {currentUser?.characters.map(char => (
                                    <SelectItem key={char.id} value={char.id}>{char.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleConfirmRequest} disabled={!selectedCharacterId || isLoading}>
                        {isLoading ? 'Отправка...' : `Отправить запрос за ${selectedReward.cost.toLocaleString()} баллов`}
                    </Button>
                </DialogContent>
            </Dialog>
        )}
    </div>
  );
}
