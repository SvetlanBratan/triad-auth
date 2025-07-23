
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { DollarSign, Clock, Users, ShieldAlert, UserCog, Trophy, Gift, Star, MinusCircle, Trash2, Wand2, PlusCircle, VenetianMask, CalendarClock } from 'lucide-react';
import type { UserStatus, UserRole, User, FamiliarCard } from '@/lib/types';
import { FAME_LEVELS_POINTS, EVENT_FAMILIARS, ALL_ACHIEVEMENTS, MOODLETS_DATA, FAMILIARS_BY_ID } from '@/lib/data';
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


export default function AdminTab() {
  const { 
    addPointsToUser, 
    updateUserStatus, 
    updateUserRole, 
    giveEventFamiliarToCharacter, 
    grantAchievementToUser, 
    fetchUsersForAdmin, 
    clearPointHistoryForUser, 
    addMoodletToCharacter, 
    removeMoodletFromCharacter, 
    removeFamiliarFromCharacter,
    updateGameDate,
    gameDateString: initialGameDate,
  } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [awardSelectedUserId, setAwardSelectedUserId] = useState<string>('');
  const [statusSelectedUserId, setStatusSelectedUserId] = useState<string>('');
  const [roleSelectedUserId, setRoleSelectedUserId] = useState<string>('');
  const [clearHistoryUserId, setClearHistoryUserId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | ''>('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  
  const [eventAwardUserId, setEventAwardUserId] = useState<string>('');
  const [eventAwardCharacterId, setEventAwardCharacterId] = useState<string>('');
  const [eventAwardFamiliarId, setEventAwardFamiliarId] = useState<string>('');

  const [achieveUserId, setAchieveUserId] = useState<string>('');
  const [achieveId, setAchieveId] = useState<string>('');

  const [points, setPoints] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const [deductSelectedUserId, setDeductSelectedUserId] = useState<string>('');
  const [deductPoints, setDeductPoints] = useState<string>('');
  const [deductReason, setDeductReason] = useState<string>('');

  // Moodlet state
  const [moodletUserId, setMoodletUserId] = useState<string>('');
  const [moodletCharId, setMoodletCharId] = useState<string>('');
  const [moodletId, setMoodletId] = useState<string>('');
  const [moodletDuration, setMoodletDuration] = useState<number>(7);
  const [moodletSource, setMoodletSource] = useState('');

  // Familiar removal state
  const [removeFamiliarUserId, setRemoveFamiliarUserId] = useState<string>('');
  const [removeFamiliarCharId, setRemoveFamiliarCharId] = useState<string>('');
  const [removeFamiliarCardId, setRemoveFamiliarCardId] = useState<string>('');
  
  // Game date state
  const [newGameDateString, setNewGameDateString] = useState(initialGameDate || '');
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);


  const { toast } = useToast();

  const refetchUsers = useCallback(async () => {
    try {
        const fetchedUsers = await fetchUsersForAdmin();
        setUsers(fetchedUsers);
    } catch (error) {
        console.error("Failed to refetch users", error);
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось обновить список пользователей.' });
    }
  }, [fetchUsersForAdmin, toast]);

  useEffect(() => {
    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const fetchedUsers = await fetchUsersForAdmin();
            setUsers(fetchedUsers);
        } catch (error) {
            console.error("Failed to fetch users", error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить пользователей.' });
        } finally {
            setIsLoading(false);
        }
    };
    loadUsers();
  }, [fetchUsersForAdmin, toast]);

  useEffect(() => {
      setNewGameDateString(initialGameDate || '');
  }, [initialGameDate]);

  const handleUpdateGameDate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingDate(true);
    try {
        await updateGameDate(newGameDateString);
        toast({ title: 'Игровая дата обновлена', description: `Новая дата: ${newGameDateString}` });
    } catch(error) {
        console.error('Failed to update game date', error);
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось обновить игровую дату.' });
    } finally {
        setIsUpdatingDate(false);
    }
  };

  const handleAwardPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    const pointsToAward = parseInt(points, 10);

    if (!awardSelectedUserId || !pointsToAward || !reason) {
      toast({
        variant: "destructive",
        title: "Отсутствует информация",
        description: "Пожалуйста, выберите пользователя, введите баллы и причину.",
      });
      return;
    }
    
    await addPointsToUser(awardSelectedUserId, pointsToAward, reason);
    await refetchUsers();
    
    toast({
        title: "Баллы начислены!",
        description: `Начислено ${pointsToAward} баллов.`,
    });

    setAwardSelectedUserId('');
    setPoints('');
    setReason('');
  };

   const handleDeductPoints = async (e: React.FormEvent) => {
    e.preventDefault();
     const pointsToDeductNum = parseInt(deductPoints, 10);

    if (!deductSelectedUserId || !pointsToDeductNum || !deductReason) {
      toast({
        variant: 'destructive',
        title: 'Отсутствует информация',
        description: 'Пожалуйста, выберите пользователя, введите баллы для списания и причину.',
      });
      return;
    }

    const pointsToDeduct = -Math.abs(pointsToDeductNum);
    await addPointsToUser(deductSelectedUserId, pointsToDeduct, deductReason);
    await refetchUsers();
    
    toast({
      title: 'Баллы списаны!',
      description: `Списано ${Math.abs(pointsToDeduct)} баллов.`,
      variant: 'destructive',
    });

    setDeductSelectedUserId('');
    setDeductPoints('');
    setDeductReason('');
  };

  const handleChangeStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusSelectedUserId || !selectedStatus) {
        toast({
            variant: "destructive",
            title: "Отсутствует информация",
            description: "Пожалуйста, выберите пользователя и статус.",
        });
        return;
    }
    await updateUserStatus(statusSelectedUserId, selectedStatus);
    await refetchUsers();
    toast({
        title: "Статус обновлен!",
        description: `Статус пользователя изменен на "${selectedStatus}".`,
    });
    setStatusSelectedUserId('');
    setSelectedStatus('');
  };

   const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleSelectedUserId || !selectedRole) {
      toast({
        variant: "destructive",
        title: "Отсутствует информация",
        description: "Пожалуйста, выберите пользователя и роль.",
      });
      return;
    }
    await updateUserRole(roleSelectedUserId, selectedRole);
    await refetchUsers();
    toast({
      title: "Роль обновлена!",
      description: `Роль пользователя изменена на "${selectedRole}".`,
    });
    setRoleSelectedUserId('');
    setSelectedRole('');
  };

  const handleWeeklyCalculations = async () => {
    const activeUsers = users.filter(u => u.status === 'активный');
    for(const user of activeUsers) {
        await addPointsToUser(user.id, 800, 'Еженедельный бонус за активность');
    }
    await refetchUsers();
    toast({
        title: "Еженедельные расчеты завершены",
        description: `Бонусы за активность начислены ${activeUsers.length} активным пользователям.`,
    });
  };

  const handleInactivityPenalty = async () => {
    const inactiveUsers = users.filter(u => u.status === 'неактивный');
    for(const user of inactiveUsers) {
        await addPointsToUser(user.id, -1000, 'Еженедельный штраф за неактивность');
    }
     await refetchUsers();
    toast({
        title: "Применен штраф за неактивность",
        description: `Штраф применен к ${inactiveUsers.length} неактивным пользователям.`,
    });
  };

  const handleFameAwards = async () => {
    let usersAwardedCount = 0;
    let totalPointsAwarded = 0;

    for (const user of users) {
      if (user.characters && user.characters.length > 0) {
        let pointsForUser = 0;
        user.characters.forEach(character => {
          const fameLevel = Array.isArray(character.currentFameLevel) ? character.currentFameLevel[0] : character.currentFameLevel as (keyof typeof FAME_LEVELS_POINTS);
          if (FAME_LEVELS_POINTS[fameLevel]) {
            pointsForUser += FAME_LEVELS_POINTS[fameLevel];
          }
        });

        if (pointsForUser > 0) {
          await addPointsToUser(user.id, pointsForUser, 'Награда за известность персонажей');
          usersAwardedCount++;
          totalPointsAwarded += pointsForUser;
        }
      }
    }
    
    await refetchUsers();

    if (usersAwardedCount > 0) {
      toast({
        title: "Награды за известность начислены",
        description: `Начислено ${totalPointsAwarded} баллов для ${usersAwardedCount} пользователей.`,
      });
    } else {
      toast({
        title: "Награды за известность",
        description: "Не найдено персонажей с подходящим уровнем известности.",
      });
    }
  };

  const handleAwardEventFamiliar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventAwardUserId || !eventAwardCharacterId || !eventAwardFamiliarId) {
      toast({
        variant: "destructive",
        title: "Отсутствует информация",
        description: "Пожалуйста, выберите пользователя, персонажа и фамильяра.",
      });
      return;
    }
    
    await giveEventFamiliarToCharacter(eventAwardUserId, eventAwardCharacterId, eventAwardFamiliarId);
    await refetchUsers();

    const familiarName = EVENT_FAMILIARS.find(f => f.id === eventAwardFamiliarId)?.name;

    toast({
      title: "Ивентовый фамильяр выдан!",
      description: `Фамильяр "${familiarName}" выдан.`,
    });
    
    setEventAwardUserId('');
    setEventAwardCharacterId('');
    setEventAwardFamiliarId('');
  }

  const handleGrantAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achieveUserId || !achieveId) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Пожалуйста, выберите пользователя и ачивку.' });
      return;
    }
    
    await grantAchievementToUser(achieveUserId, achieveId);
    await refetchUsers();

    const achievementName = ALL_ACHIEVEMENTS.find(a => a.id === achieveId)?.name;
    
    toast({ title: 'Ачивка выдана!', description: `Ачивка "${achievementName}" выдана.` });

    setAchieveUserId('');
    setAchieveId('');
  };

  const handleClearHistory = async () => {
    if (!clearHistoryUserId) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Пожалуйста, выберите пользователя.' });
      return;
    }
    
    await clearPointHistoryForUser(clearHistoryUserId);
    await refetchUsers();

    toast({ title: 'История очищена!', description: `Журнал баллов был успешно очищен.` });
    
    setClearHistoryUserId('');
  };

  const handleAddMoodlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moodletUserId || !moodletCharId || !moodletId || moodletDuration <= 0) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Пожалуйста, заполните все поля для мудлета.' });
      return;
    }
    await addMoodletToCharacter(moodletUserId, moodletCharId, moodletId, moodletDuration, moodletSource);
    
    const moodletName = MOODLETS_DATA[moodletId as keyof typeof MOODLETS_DATA].name;
    toast({ title: 'Мудлет добавлен!', description: `Мудлет "${moodletName}" добавлен персонажу на ${moodletDuration} дней.` });
    
    await refetchUsers();
    
    setMoodletUserId('');
    setMoodletCharId('');
    setMoodletId('');
    setMoodletDuration(7);
    setMoodletSource('');
  };

  const handleRemoveMoodlet = async (userId: string, charId: string, moodletId: string) => {
      await removeMoodletFromCharacter(userId, charId, moodletId);
      const moodletName = MOODLETS_DATA[moodletId as keyof typeof MOODLETS_DATA].name;
      toast({ title: 'Мудлет удален!', description: `Мудлет "${moodletName}" удален у персонажа.`, variant: 'destructive' });
      await refetchUsers();
  };

   const handleRemoveFamiliar = async () => {
    if (!removeFamiliarUserId || !removeFamiliarCharId || !removeFamiliarCardId) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Пожалуйста, выберите пользователя, персонажа и карту.' });
      return;
    }

    try {
      await removeFamiliarFromCharacter(removeFamiliarUserId, removeFamiliarCharId, removeFamiliarCardId);
      const cardName = FAMILIARS_BY_ID[removeFamiliarCardId]?.name || 'Карта';
      toast({ title: 'Карта удалена!', description: `${cardName} была удалена у персонажа.` });
      await refetchUsers();
      
      setRemoveFamiliarUserId('');
      setRemoveFamiliarCharId('');
      setRemoveFamiliarCardId('');
    } catch (error) {
      console.error('Failed to remove familiar card:', error);
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось удалить карту.' });
    }
  };


  const charactersForSelectedUser = useMemo(() => {
    if (!eventAwardUserId) return [];
    return users.find(u => u.id === eventAwardUserId)?.characters || [];
  }, [eventAwardUserId, users]);

  const charactersForMoodletUser = useMemo(() => {
    if (!moodletUserId) return [];
    return users.find(u => u.id === moodletUserId)?.characters || [];
  }, [moodletUserId, users]);

  const charactersForFamiliarRemoval = useMemo(() => {
    if (!removeFamiliarUserId) return [];
    return users.find(u => u.id === removeFamiliarUserId)?.characters || [];
  }, [removeFamiliarUserId, users]);

  const familiarsForSelectedCharacter = useMemo((): (FamiliarCard & { ownedId: string })[] => {
    if (!removeFamiliarUserId || !removeFamiliarCharId) return [];
    const user = users.find(u => u.id === removeFamiliarUserId);
    const character = user?.characters.find(c => c.id === removeFamiliarCharId);
    if (!character || !character.inventory?.familiarCards) return [];
    return character.inventory.familiarCards.map((ownedCard, index) => {
      const cardDetails = FAMILIARS_BY_ID[ownedCard.id];
      // Ensure we don't return undefined if cardDetails isn't found
      if (!cardDetails) return null;
      return { ...cardDetails, ownedId: `${ownedCard.id}-${index}` }; // Create a unique ID for the list key
    }).filter((card): card is FamiliarCard & { ownedId: string } => card !== null);
  }, [removeFamiliarUserId, removeFamiliarCharId, users]);


  const selectedCharacterForMoodlet = useMemo(() => {
      if (!moodletUserId || !moodletCharId) return null;
      const user = users.find(u => u.id === moodletUserId);
      return user?.characters.find(c => c.id === moodletCharId) || null;
  }, [moodletUserId, moodletCharId, users]);

  const moodletSourceOptions = useMemo(() => {
    const characterNames = users.flatMap(u => u.characters.map(c => c.name));
    const divineBeings = ["Светлый Бог", "Тёмный Бог", "Неизвестная Богиня"];
    return [...new Set([...divineBeings, ...characterNames])];
  }, [users]);


  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><p>Загрузка данных...</p></div>
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign /> Начислить баллы</CardTitle>
            <CardDescription>Вручную начислите баллы пользователю за определенные действия.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAwardPoints} className="space-y-4">
              <div>
                <Label htmlFor="user-select-award">Пользователь</Label>
                <Select value={awardSelectedUserId} onValueChange={setAwardSelectedUserId}>
                  <SelectTrigger id="user-select-award">
                    <SelectValue placeholder="Выберите пользователя" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="points-input">Баллы</Label>
                <Input
                  id="points-input"
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="Введите количество"
                />
              </div>
              <div>
                <Label htmlFor="reason-input">Причина</Label>
                <Textarea
                  id="reason-input"
                  placeholder="например, Участие в мини-ивенте"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>
              <Button type="submit">Начислить баллы</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive"><MinusCircle /> Списать баллы</CardTitle>
            <CardDescription>Вручную спишите баллы с пользователя за нарушения.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDeductPoints} className="space-y-4">
              <div>
                <Label htmlFor="user-select-deduct">Пользователь</Label>
                <Select value={deductSelectedUserId} onValueChange={setDeductSelectedUserId}>
                  <SelectTrigger id="user-select-deduct">
                    <SelectValue placeholder="Выберите пользователя" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="points-input-deduct">Баллы</Label>
                <Input
                  id="points-input-deduct"
                  type="number"
                  value={deductPoints}
                  onChange={(e) => setDeductPoints(e.target.value)}
                  placeholder="Введите количество"
                />
              </div>
              <div>
                <Label htmlFor="reason-input-deduct">Причина</Label>
                <Textarea
                  id="reason-input-deduct"
                  placeholder="например, Нарушение правил"
                  value={deductReason}
                  onChange={e => setDeductReason(e.target.value)}
                />
              </div>
              <Button type="submit" variant="destructive">Списать баллы</Button>
            </form>
          </CardContent>
        </Card>
        <Card className="border-destructive/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive"><ShieldAlert /> Опасная зона</CardTitle>
                <CardDescription>Действия в этой секции необратимы.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="user-select-clear-history">Пользователь</Label>
                     <Select value={clearHistoryUserId} onValueChange={setClearHistoryUserId}>
                        <SelectTrigger id="user-select-clear-history" className="border-destructive/50 text-destructive focus:ring-destructive">
                            <SelectValue placeholder="Выберите пользователя для очистки" />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={!clearHistoryUserId}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Очистить историю баллов
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Это действие необратимо. Вся история начисления и списания баллов для пользователя 
                            <span className="font-bold"> {users.find(u => u.id === clearHistoryUserId)?.name} </span>
                            будет навсегда удалена.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearHistory} className="bg-destructive hover:bg-destructive/90">
                           Да, я понимаю, очистить
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarClock /> Управление игровой датой</CardTitle>
                <CardDescription>Измените текущую дату в игровом мире.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleUpdateGameDate} className="space-y-4">
                    <div>
                        <Label htmlFor="game-date-input">Текущая дата</Label>
                        <Input
                        id="game-date-input"
                        type="text"
                        value={newGameDateString}
                        onChange={(e) => setNewGameDateString(e.target.value)}
                        placeholder="например, 21 марта 2709 год"
                        disabled={isUpdatingDate}
                        />
                    </div>
                    <Button type="submit" disabled={isUpdatingDate || newGameDateString === initialGameDate}>
                        {isUpdatingDate ? 'Сохранение...' : 'Сохранить дату'}
                    </Button>
                </form>
            </CardContent>
        </Card>
       <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserCog /> Изменить статус</CardTitle>
            <CardDescription>Измените статус активности пользователя.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangeStatus} className="space-y-4">
              <div>
                <Label htmlFor="user-select-status">Пользователь</Label>
                <Select value={statusSelectedUserId} onValueChange={setStatusSelectedUserId}>
                  <SelectTrigger id="user-select-status">
                    <SelectValue placeholder="Выберите пользователя" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status-select">Новый статус</Label>
                <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as UserStatus)}>
                  <SelectTrigger id="status-select">
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="активный">активный</SelectItem>
                    <SelectItem value="неактивный">неактивный</SelectItem>
                    <SelectItem value="отпуск">отпуск</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Изменить статус</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserCog /> Управление ролями</CardTitle>
            <CardDescription>Назначайте или снимайте права администратора.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangeRole} className="space-y-4">
              <div>
                <Label htmlFor="user-select-role">Пользователь</Label>
                <Select value={roleSelectedUserId} onValueChange={setRoleSelectedUserId}>
                  <SelectTrigger id="user-select-role">
                    <SelectValue placeholder="Выберите пользователя" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role-select">Новая роль</Label>
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                  <SelectTrigger id="role-select">
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Администратор</SelectItem>
                    <SelectItem value="user">Пользователь</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Изменить роль</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gift /> Выдать ивентового фамильяра</CardTitle>
            <CardDescription>Наградите игрока эксклюзивным фамильяром.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAwardEventFamiliar} className="space-y-4">
              <div>
                <Label htmlFor="user-select-event">Пользователь</Label>
                <Select value={eventAwardUserId} onValueChange={uid => { setEventAwardUserId(uid); setEventAwardCharacterId(''); }}>
                  <SelectTrigger id="user-select-event">
                    <SelectValue placeholder="Выберите пользователя" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="character-select-event">Персонаж</Label>
                <Select value={eventAwardCharacterId} onValueChange={setEventAwardCharacterId} disabled={!eventAwardUserId}>
                  <SelectTrigger id="character-select-event">
                    <SelectValue placeholder="Выберите персонажа" />
                  </SelectTrigger>
                  <SelectContent>
                    {charactersForSelectedUser.map(character => (
                      <SelectItem key={character.id} value={character.id}>{character.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="familiar-select-event">Фамильяр</Label>
                <Select value={eventAwardFamiliarId} onValueChange={setEventAwardFamiliarId}>
                  <SelectTrigger id="familiar-select-event">
                    <SelectValue placeholder="Выберите фамильяра" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_FAMILIARS.map(familiar => (
                      <SelectItem key={familiar.id} value={familiar.id}>{familiar.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Выдать фамильяра</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock /> Автоматические действия</CardTitle>
            <CardDescription>Симулируйте автоматические расчеты баллов.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2"><Users /> Еженедельный бонус за активность</h3>
                  <p className="text-sm text-muted-foreground mb-3">Начисляет 800 баллов всем 'активным' игрокам.</p>
                  <Button onClick={handleWeeklyCalculations} variant="outline">Запустить еженедельный расчет</Button>
              </div>
              <Separator />
              <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2"><Trophy /> Награда за известность</h3>
                  <p className="text-sm text-muted-foreground mb-3">Начисляет баллы всем игрокам в зависимости от известности их персонажей.</p>
                  <Button onClick={handleFameAwards} variant="outline">Начислить награды</Button>
              </div>
              <Separator />
              <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2"><Users /> Еженедельный штраф за неактивность</h3>
                  <p className="text-sm text-muted-foreground mb-3">Списывает 1000 баллов со всех 'неактивных' игроков.</p>
                  <Button onClick={handleInactivityPenalty} variant="destructive">Применить штраф</Button>
              </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy /> Выдать ачивку</CardTitle>
            <CardDescription>Наградите игрока уникальным достижением.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGrantAchievement} className="space-y-4">
              <div>
                <Label htmlFor="user-select-achieve">Пользователь</Label>
                <Select value={achieveUserId} onValueChange={setAchieveUserId}>
                  <SelectTrigger id="user-select-achieve">
                    <SelectValue placeholder="Выберите пользователя" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="achieve-select">Ачивка</Label>
                <Select value={achieveId} onValueChange={setAchieveId}>
                    <SelectTrigger id="achieve-select" className="w-full">
                        <SelectValue placeholder="Выберите ачивку..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] w-[var(--radix-select-trigger-width)]">
                        {ALL_ACHIEVEMENTS.map((ach) => (
                            <SelectItem key={ach.id} value={ach.id} className="whitespace-normal">
                                <div className="flex flex-col items-start py-1">
                                  <p className="font-semibold">{ach.name}</p>
                                  <p className="text-xs text-muted-foreground">{ach.description}</p>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <Button type="submit">Выдать ачивку</Button>
            </form>
          </CardContent>
        </Card>
                
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wand2 /> Управление мудлетами</CardTitle>
                <CardDescription>Наложите временные эффекты на персонажей.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAddMoodlet} className="space-y-4">
                     <div>
                        <Label htmlFor="moodlet-user">Пользователь</Label>
                        <Select value={moodletUserId} onValueChange={uid => { setMoodletUserId(uid); setMoodletCharId(''); }}>
                          <SelectTrigger id="moodlet-user">
                            <SelectValue placeholder="Выберите пользователя" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map(user => (
                              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="moodlet-char">Персонаж</Label>
                        <Select value={moodletCharId} onValueChange={setMoodletCharId} disabled={!moodletUserId}>
                          <SelectTrigger id="moodlet-char">
                            <SelectValue placeholder="Выберите персонажа" />
                          </SelectTrigger>
                          <SelectContent>
                            {charactersForMoodletUser.map(character => (
                              <SelectItem key={character.id} value={character.id}>{character.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="moodlet-type">Мудлет</Label>
                         <Select value={moodletId} onValueChange={setMoodletId}>
                          <SelectTrigger id="moodlet-type">
                            <SelectValue placeholder="Выберите мудлет" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(MOODLETS_DATA).map(([id, data]) => (
                              <SelectItem key={id} value={id}>{data.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="moodlet-duration">Длительность (в днях)</Label>
                        <Input id="moodlet-duration" type="number" value={moodletDuration} onChange={(e) => setMoodletDuration(Number(e.target.value))} />
                      </div>
                      <div>
                        <Label htmlFor="moodlet-source">Источник эффекта (необязательно)</Label>
                        <Input id="moodlet-source" list="moodlet-sources" value={moodletSource} onChange={e => setMoodletSource(e.target.value)} placeholder="Имя персонажа или божество..." />
                        <datalist id="moodlet-sources">
                            {moodletSourceOptions.map(name => <option key={name} value={name} />)}
                        </datalist>
                      </div>
                      <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" />Добавить мудлет</Button>
                </form>
                {selectedCharacterForMoodlet && (selectedCharacterForMoodlet.moodlets || []).filter(m => new Date(m.expiresAt) > new Date()).length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                        <h4 className="font-semibold text-sm mb-2">Активные мудлеты:</h4>
                        <div className="space-y-2">
                           {(selectedCharacterForMoodlet.moodlets || []).filter(m => new Date(m.expiresAt) > new Date()).map(moodlet => (
                                <div key={moodlet.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                                    <div>
                                      <span>{moodlet.name}</span>
                                      {moodlet.source && <span className="text-xs text-muted-foreground italic ml-2">(от {moodlet.source})</span>}
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleRemoveMoodlet(moodletUserId, moodletCharId, moodlet.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                           ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><VenetianMask /> Управление Фамильярами</CardTitle>
                <CardDescription>Удалить карту фамильяра у персонажа.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                     <div>
                        <Label htmlFor="remove-fam-user">Пользователь</Label>
                        <Select value={removeFamiliarUserId} onValueChange={uid => { setRemoveFamiliarUserId(uid); setRemoveFamiliarCharId(''); setRemoveFamiliarCardId(''); }}>
                          <SelectTrigger id="remove-fam-user">
                            <SelectValue placeholder="Выберите пользователя" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map(user => (
                              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="remove-fam-char">Персонаж</Label>
                        <Select value={removeFamiliarCharId} onValueChange={cid => { setRemoveFamiliarCharId(cid); setRemoveFamiliarCardId(''); }} disabled={!removeFamiliarUserId}>
                          <SelectTrigger id="remove-fam-char">
                            <SelectValue placeholder="Выберите персонажа" />
                          </SelectTrigger>
                          <SelectContent>
                            {charactersForFamiliarRemoval.map(character => (
                              <SelectItem key={character.id} value={character.id}>{character.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="remove-fam-card">Карта для удаления</Label>
                         <Select value={removeFamiliarCardId} onValueChange={setRemoveFamiliarCardId} disabled={!removeFamiliarCharId}>
                          <SelectTrigger id="remove-fam-card">
                            <SelectValue placeholder="Выберите карту" />
                          </SelectTrigger>
                          <SelectContent>
                            {familiarsForSelectedCharacter.map((card) => (
                              <SelectItem key={card.ownedId} value={card.id}>{card.name} ({card.rank})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button 
                              variant="destructive" 
                              disabled={!removeFamiliarCardId}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Удалить карту
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Это действие удалит карту 
                                <span className="font-bold"> {FAMILIARS_BY_ID[removeFamiliarCardId]?.name} </span> 
                                у персонажа. Если карта мифическая, она вернется в рулетку. Это действие необратимо.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRemoveFamiliar} className="bg-destructive hover:bg-destructive/90">
                                Да, удалить
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
