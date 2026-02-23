'use client';

import { useUser } from '@/hooks/use-user';
import { rewards } from '@/lib/data';
import type { Reward, RewardRequest, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import * as LucideIcons from 'lucide-react';
import { Star, Gift, User as UserIcon } from 'lucide-react';
import React, { useMemo, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SearchableSelect } from '../ui/searchable-select';
import { CustomIcon } from '../ui/custom-icon';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '../ui/scroll-area';


const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    const IconComponent = (LucideIcons as any)[name] as React.ComponentType<{ className?: string }>;

    if (!IconComponent) {
        return <Star className={className} />;
    }

    return <IconComponent className={className} />;
};


export default function RewardsTab() {
  const { currentUser, createRewardRequest, fetchUsersForAdmin } = useUser();
  const { toast } = useToast();
  const [selectedReward, setSelectedReward] = React.useState<Reward | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = React.useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [statusEmoji, setStatusEmoji] = React.useState('');
  const [statusText, setStatusText] = React.useState('');
  
  // Gift functionality states
  const [recipientType, setRecipientType] = useState<'self' | 'gift'>('self');
  const [targetUserId, setTargetUserId] = useState<string>('');

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['allUsersForRewards'],
    queryFn: fetchUsersForAdmin,
  });

  const favoritePlayers = useMemo(() => {
    if (!currentUser?.favoritePlayerIds || !allUsers.length) return [];
    return allUsers.filter(u => currentUser.favoritePlayerIds?.includes(u.id));
  }, [currentUser?.favoritePlayerIds, allUsers]);

  const targetUser = useMemo(() => {
    if (recipientType === 'self') return currentUser;
    return favoritePlayers.find(u => u.id === targetUserId);
  }, [recipientType, currentUser, favoritePlayers, targetUserId]);

  const characterOptions = useMemo(() => {
    return (targetUser?.characters || []).map(char => ({
      value: char.id,
      label: char.name,
    }));
  }, [targetUser]);

  const favoritePlayerOptions = useMemo(() => {
    return favoritePlayers.map(u => ({
        value: u.id,
        label: u.name
    }));
  }, [favoritePlayers]);

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
    setRecipientType('self');
    setTargetUserId('');
    setSelectedCharacterId('');
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
    
    const character = targetUser?.characters.find(c => c.id === selectedCharacterId);

    try {
        const rewardRequestData: Omit<RewardRequest, 'id' | 'status' | 'createdAt'> = {
            userId: currentUser.id,
            userName: currentUser.name,
            rewardId: selectedReward.id,
            rewardTitle: selectedReward.title,
            rewardCost: selectedReward.cost,
            characterId: character?.id || '',
            characterName: character?.name || '',
        };

        if (recipientType === 'gift' && targetUser && selectedReward.id !== 'r-custom-status') {
            rewardRequestData.targetUserId = targetUser.id;
            rewardRequestData.targetUserName = targetUser.name;
        }

        if (selectedReward.id === 'r-custom-status') {
            rewardRequestData.statusEmoji = statusEmoji;
            rewardRequestData.statusText = statusText;
        }
        
        await createRewardRequest(rewardRequestData);
        
        toast({
            title: recipientType === 'gift' ? "Запрос на подарок отправлен!" : "Запрос отправлен!",
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
        setTargetUserId('');
        setRecipientType('self');
        setStatusEmoji('');
        setStatusText('');
    }
  }

  return (
    <div>
        <Card className="mb-6 bg-muted/50 border-muted/30">
            <CardHeader className="flex flex-row items-center gap-4">
                <CustomIcon src="/icons/points.svg" className="w-8 h-8 icon-primary" />
                <div>
                    <CardTitle className="text-lg sm:text-xl">Ваши баллы</CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                        У вас есть <span className="font-bold text-base sm:text-lg text-foreground">{currentUser?.points.toLocaleString()}</span> баллов для траты.
                    </CardDescription>
                </div>
            </CardHeader>
        </Card>
      
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
        {rewards.map(reward => (
          <Card key={reward.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex-row gap-2 sm:gap-4 items-start p-3 sm:p-6 pb-2 sm:pb-6">
              <div className="bg-primary/10 p-2 sm:p-3 rounded-lg shrink-0">
                <DynamicIcon name={reward.iconName} className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-[13px] sm:text-lg font-headline leading-tight whitespace-normal">{reward.title}</CardTitle>
                <ScrollArea className="h-14 sm:h-20 mt-1">
                    <div className="text-[10px] sm:text-xs text-muted-foreground pr-3 whitespace-normal">
                        {reward.description}
                    </div>
                </ScrollArea>
              </div>
            </CardHeader>
            <CardContent className="flex-grow px-3 sm:px-6 py-0">
              {reward.type === 'temporary' && <p className="text-[10px] sm:text-xs text-accent font-semibold uppercase tracking-wider">Временная</p>}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-muted/50 p-2 sm:p-4 mt-auto gap-2">
              <div className="font-bold text-sm sm:text-lg text-primary flex items-center gap-1 sm:gap-1.5 justify-center sm:justify-start">
                <CustomIcon src="/icons/points.svg" className="w-4 h-4 sm:w-5 sm:h-5 icon-primary" /> {reward.cost.toLocaleString()}
              </div>
              <Button size="sm" onClick={() => handleRedeemClick(reward)} disabled={(currentUser?.points ?? 0) < reward.cost || isLoading} className="h-7 sm:h-9 text-[10px] sm:text-sm">
                {isLoading ? '...' : 'Запросить'}
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
                            {selectedReward.id === 'r-custom-status' 
                                ? 'Настройте свой статус. Эта награда доступна только для вашего личного профиля.' 
                                : 'Выберите получателя и персонажа для этой награды.'}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4 space-y-6">
                        {selectedReward.id !== 'r-custom-status' && (
                            <RadioGroup value={recipientType} onValueChange={(v) => { setRecipientType(v as any); setTargetUserId(''); setSelectedCharacterId(''); }} className="grid grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted/50">
                                    <RadioGroupItem value="self" id="self" />
                                    <Label htmlFor="self" className="flex items-center gap-2 cursor-pointer">
                                        <UserIcon className="w-4 h-4" /> Для себя
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted/50">
                                    <RadioGroupItem value="gift" id="gift" />
                                    <Label htmlFor="gift" className="flex items-center gap-2 cursor-pointer">
                                        <Gift className="w-4 h-4" /> В подарок
                                    </Label>
                                </div>
                            </RadioGroup>
                        )}

                        {recipientType === 'gift' && selectedReward.id !== 'r-custom-status' && (
                            <div className="space-y-2">
                                <Label>Выберите игрока из избранных:</Label>
                                {favoritePlayerOptions.length > 0 ? (
                                    <SearchableSelect
                                        options={favoritePlayerOptions}
                                        value={targetUserId}
                                        onValueChange={(val) => { setTargetUserId(val); setSelectedCharacterId(''); }}
                                        placeholder="Выберите друга..."
                                    />
                                ) : (
                                    <p className="text-sm text-destructive">У вас нет избранных игроков. Добавьте их во вкладке "Игроки".</p>
                                )}
                            </div>
                        )}

                        {selectedReward.id === 'r-custom-status' ? (
                            <div className="space-y-4">
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
                            <div className="space-y-2">
                                <Label>Выберите персонажа:</Label>
                                <SearchableSelect
                                    options={characterOptions}
                                    value={selectedCharacterId}
                                    onValueChange={setSelectedCharacterId}
                                    placeholder="Выберите персонажа..."
                                    disabled={recipientType === 'gift' && !targetUserId}
                                />
                            </div>
                        )}
                    </div>

                    <Button 
                        onClick={handleConfirmRequest} 
                        disabled={
                            isLoading || 
                            (selectedReward.id !== 'r-custom-status' && !selectedCharacterId) || 
                            (selectedReward.id === 'r-custom-status' && !statusEmoji.trim()) ||
                            (recipientType === 'gift' && !targetUserId)
                        }
                    >
                        {isLoading ? 'Отправка...' : `Оплатить ${selectedReward.cost.toLocaleString()} баллов`}
                    </Button>
                </DialogContent>
            </Dialog>
        )}
    </div>
  );
}
