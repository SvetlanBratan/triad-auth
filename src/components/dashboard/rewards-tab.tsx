

'use client';

import { useUser } from '@/hooks/use-user';
import { rewards } from '@/lib/data';
import type { Reward } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import * as LucideIcons from 'lucide-react';
import { Star } from 'lucide-react';
import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SearchableSelect } from '../ui/searchable-select';
import Image from 'next/image';
import { CustomIcon } from '../ui/custom-icon';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Input } from '../ui/input';


const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    const IconComponent = (LucideIcons as any)[name] as React.ComponentType<{ className?: string }>;

    if (!IconComponent) {
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
  const [statusEmoji, setStatusEmoji] = React.useState('');
  const [statusText, setStatusText] = React.useState('');


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
    setStatusEmoji(currentUser.statusEmoji || '');
    setStatusText(currentUser.statusText || '');
    setIsDialogOpen(true);
  };

  const handleConfirmRequest = async () => {
    if (!currentUser || !selectedReward) return;

    if (selectedReward.id !== 'r-custom-status' && !selectedCharacterId) {
        toast({ variant: "destructive", title: "Ошибка", description: "Пожалуйста, выберите персонажа." });
        return;
    }

    if (selectedReward.id === 'r-custom-status' && !statusEmoji.trim()) {
      toast({ variant: "destructive", title: "Ошибка", description: "Пожалуйста, введите эмодзи." });
      return;
    }
    
    setIsLoading(true);
    
    const character = currentUser.characters.find(c => c.id === selectedCharacterId);

    try {
        await createRewardRequest({
            userId: currentUser.id,
            userName: currentUser.name,
            rewardId: selectedReward.id,
            rewardTitle: selectedReward.title,
            rewardCost: selectedReward.cost,
            characterId: character?.id || '',
            characterName: character?.name || '',
            statusEmoji: selectedReward.id === 'r-custom-status' ? statusEmoji : undefined,
            statusText: selectedReward.id === 'r-custom-status' ? statusText : undefined,
        });
        toast({
            title: "Запрос отправлен!",
            description: `Ваш запрос на "${selectedReward.title}" отправлен на рассмотрение. Баллы списаны.`,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Не удалось отправить запрос.";
        console.error("Failed to create reward request:", error);
        toast({
            variant: "destructive",
            title: "Ошибка",
            description: message,
        });
    } finally {
        setIsLoading(false);
        setIsDialogOpen(false);
        setSelectedReward(null);
        setSelectedCharacterId('');
        setStatusEmoji('');
        setStatusText('');
    }
  }
  
  const characterOptions = useMemo(() => {
    return (currentUser?.characters || []).map(char => ({
      value: char.id,
      label: char.name,
    }));
  }, [currentUser]);


  return (
    <div>
        <Card className="mb-6 bg-muted/50 border-muted/30">
            <CardHeader className="flex flex-row items-center gap-4">
                <CustomIcon src="/icons/points.svg" className="w-8 h-8 icon-primary" />
                <div>
                    <CardTitle>Ваши баллы</CardTitle>
                    <CardDescription className="text-muted-foreground/80">У вас есть <span className="font-bold text-xl text-foreground">{currentUser?.points.toLocaleString()}</span> баллов для траты.</CardDescription>
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
              <div className="font-bold text-lg text-primary flex items-center gap-1.5">
                <CustomIcon src="/icons/points.svg" className="w-5 h-5 icon-primary" /> {reward.cost.toLocaleString()}
              </div>
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
                            {selectedReward.id !== 'r-custom-status'
                                ? 'Выберите персонажа для этой награды. После подтверждения запрос будет отправлен администраторам.'
                                : 'Установите новый статус. После подтверждения запрос будет отправлен администраторам.'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    {selectedReward.id === 'r-custom-status' ? (
                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label>Эмодзи</Label>
                                <Input
                                    value={statusEmoji}
                                    onChange={(e) => setStatusEmoji(e.target.value)}
                                    placeholder="✨"
                                    className="w-20 text-center text-lg"
                                    maxLength={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Короткая фраза (до 50 симв.)</Label>
                                <Input
                                    value={statusText}
                                    onChange={(e) => setStatusText(e.target.value)}
                                    placeholder="Ваш статус..."
                                    maxLength={50}
                                />
                            </div>
                        </div>
                    ) : (
                      <div className="py-4 space-y-4">
                          <p>Для какого персонажа вы хотите запросить награду?</p>
                          <SearchableSelect
                              options={characterOptions}
                              value={selectedCharacterId}
                              onValueChange={setSelectedCharacterId}
                              placeholder="Выберите персонажа..."
                          />
                      </div>
                    )}
                    <Button 
                        onClick={handleConfirmRequest} 
                        disabled={isLoading || (selectedReward.id !== 'r-custom-status' && !selectedCharacterId) || (selectedReward.id === 'r-custom-status' && !statusEmoji.trim())}
                    >
                        {isLoading ? 'Отправка...' : `Отправить запрос за ${selectedReward.cost.toLocaleString()} баллов`}
                    </Button>
                </DialogContent>
            </Dialog>
        )}
    </div>
  );
}
