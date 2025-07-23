
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { DollarSign, Clock, Users, ShieldAlert, UserCog, Trophy, Gift, Star } from 'lucide-react';
import type { UserStatus, UserRole, User } from '@/lib/types';
import { FAME_LEVELS_POINTS, EVENT_FAMILIARS, ALL_ACHIEVEMENTS } from '@/lib/data';

export default function AdminTab() {
  const { addPointsToUser, updateUserStatus, updateUserRole, giveEventFamiliarToCharacter, grantAchievementToUser, fetchAllUsers } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [awardSelectedUserId, setAwardSelectedUserId] = useState<string>('');
  const [statusSelectedUserId, setStatusSelectedUserId] = useState<string>('');
  const [roleSelectedUserId, setRoleSelectedUserId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | ''>('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  
  const [eventAwardUserId, setEventAwardUserId] = useState<string>('');
  const [eventAwardCharacterId, setEventAwardCharacterId] = useState<string>('');
  const [eventAwardFamiliarId, setEventAwardFamiliarId] = useState<string>('');

  const [achieveUserId, setAchieveUserId] = useState<string>('');
  const [achieveId, setAchieveId] = useState<string>('');


  const [points, setPoints] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const fetchedUsers = await fetchAllUsers();
            setUsers(fetchedUsers);
        } catch (error) {
            console.error("Failed to fetch users", error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить пользователей.' });
        } finally {
            setIsLoading(false);
        }
    };
    loadUsers();
  }, [fetchAllUsers, toast]);

  const handleAwardPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!awardSelectedUserId || points === 0 || !reason) {
      toast({
        variant: "destructive",
        title: "Отсутствует информация",
        description: "Пожалуйста, выберите пользователя, введите баллы и причину.",
      });
      return;
    }
    
    const updatedUser = await addPointsToUser(awardSelectedUserId, points, reason);
    if (updatedUser) {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        toast({
            title: "Баллы начислены!",
            description: `Начислено ${points} баллов пользователю ${updatedUser.name}.`,
        });
    }

    setAwardSelectedUserId('');
    setPoints(0);
    setReason('');
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
    setUsers(prev => prev.map(u => u.id === statusSelectedUserId ? {...u, status: selectedStatus} : u));
    toast({
        title: "Статус обновлен!",
        description: `Статус пользователя ${users.find(u => u.id === statusSelectedUserId)?.name} изменен на "${selectedStatus}".`,
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
    setUsers(prev => prev.map(u => u.id === roleSelectedUserId ? {...u, role: selectedRole} : u));
    toast({
      title: "Роль обновлена!",
      description: `Роль пользователя ${users.find(u => u.id === roleSelectedUserId)?.name} изменен на "${selectedRole}".`,
    });
    setRoleSelectedUserId('');
    setSelectedRole('');
  };

  const handleWeeklyCalculations = () => {
    const activeUsers = users.filter(u => u.status === 'активный');
    activeUsers.forEach(user => {
        addPointsToUser(user.id, 800, 'Еженедельный бонус за активность');
    });
    toast({
        title: "Еженедельные расчеты завершены",
        description: `Бонусы за активность начислены ${activeUsers.length} активным пользователям.`,
    });
  };

  const handleInactivityPenalty = () => {
    const inactiveUsers = users.filter(u => u.status === 'неактивный');
    inactiveUsers.forEach(user => {
        addPointsToUser(user.id, -1000, 'Еженедельный штраф за неактивность');
    });
    toast({
        title: "Применен штраф за неактивность",
        description: `Штраф применен к ${inactiveUsers.length} неактивным пользователям.`,
    });
  };

  const handleFameAwards = () => {
    let usersAwardedCount = 0;
    let totalPointsAwarded = 0;

    users.forEach(user => {
      if (user.characters && user.characters.length > 0) {
        let pointsForUser = 0;
        user.characters.forEach(character => {
          const fameLevel = character.currentFameLevel as keyof typeof FAME_LEVELS_POINTS;
          if (FAME_LEVELS_POINTS[fameLevel]) {
            pointsForUser += FAME_LEVELS_POINTS[fameLevel];
          }
        });

        if (pointsForUser > 0) {
          addPointsToUser(user.id, pointsForUser, 'Награда за известность персонажей');
          usersAwardedCount++;
          totalPointsAwarded += pointsForUser;
        }
      }
    });

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

    const userName = users.find(u => u.id === eventAwardUserId)?.name;
    const familiarName = EVENT_FAMILIARS.find(f => f.id === eventAwardFamiliarId)?.name;

    toast({
      title: "Ивентовый фамильяр выдан!",
      description: `Фамильяр "${familiarName}" выдан пользователю ${userName}.`,
    });
    
    // Manually update the user in the local state to reflect the change immediately
    setUsers(prevUsers => {
        return prevUsers.map(user => {
            if (user.id === eventAwardUserId) {
                const updatedCharacters = user.characters.map(char => {
                    if (char.id === eventAwardCharacterId) {
                        return {
                            ...char,
                            familiarCards: [...(char.familiarCards || []), { id: eventAwardFamiliarId }]
                        };
                    }
                    return char;
                });
                return { ...user, characters: updatedCharacters };
            }
            return user;
        });
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

    const userName = users.find(u => u.id === achieveUserId)?.name;
    const achievementName = ALL_ACHIEVEMENTS.find(a => a.id === achieveId)?.name;
    
    toast({ title: 'Ачивка выдана!', description: `Ачивка "${achievementName}" выдана пользователю ${userName}.` });

    setUsers(prev => prev.map(u => {
        if (u.id === achieveUserId) {
            const newAchievementIds = [...(u.achievementIds || []), achieveId];
            return { ...u, achievementIds: Array.from(new Set(newAchievementIds)) };
        }
        return u;
    }));
    
    setAchieveUserId('');
    setAchieveId('');
  };

  const charactersForSelectedUser = useMemo(() => {
    if (!eventAwardUserId) return [];
    return users.find(u => u.id === eventAwardUserId)?.characters || [];
  }, [eventAwardUserId, users]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><p>Загрузка данных...</p></div>
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                onChange={e => setPoints(parseInt(e.target.value, 10) || 0)}
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
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldAlert /> Изменить статус</CardTitle>
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
                  <SelectTrigger id="achieve-select">
                    <SelectValue placeholder="Выберите ачивку" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ACHIEVEMENTS.map(ach => (
                      <SelectItem key={ach.id} value={ach.id}>
                        <div>
                          <span className="font-semibold">{ach.name}</span>
                          <p className="text-xs text-muted-foreground whitespace-normal">{ach.description}</p>
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
    </div>
  );
}
