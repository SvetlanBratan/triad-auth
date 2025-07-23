"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import type { User, UserStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import UserProfileDialog from './user-profile-dialog';
import { useToast } from '@/hooks/use-toast';


export default function LeaderboardTab() {
  const { currentUser, fetchAllUsers } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
      const loadUsers = async () => {
          setIsLoading(true);
          try {
              const fetchedUsers = await fetchAllUsers();
              const sorted = fetchedUsers.sort((a, b) => b.points - a.points);
              setUsers(sorted);
          } catch (error) {
              console.error("Failed to fetch users", error);
              toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить таблицу лидеров.' });
          } finally {
              setIsLoading(false);
          }
      };
      loadUsers();
  }, [fetchAllUsers, toast]);

  const isAdmin = currentUser?.role === 'admin';

  const getStatusClass = (status: UserStatus) => {
    switch (status) {
      case 'активный':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'неактивный':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'отпуск':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const handleUserClick = (user: User) => {
    if (isAdmin) {
      setSelectedUser(user);
    }
  };

  if (isLoading) {
      return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <Trophy className="text-yellow-500" /> Таблица лидеров
                </CardTitle>
                <CardDescription>
                    Загрузка данных...
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-center items-center h-64"><p>Загрузка...</p></div>
            </CardContent>
        </Card>
      );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="text-yellow-500" /> Таблица лидеров
        </CardTitle>
        <CardDescription>
            Список <s>Forbes</s> Тыквенного Переполоха. {isAdmin && "Нажмите на пользователя, чтобы просмотреть детали."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={!!selectedUser} onOpenChange={(isOpen) => !isOpen && setSelectedUser(null)}>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[80px]">Ранг</TableHead>
                <TableHead>Игрок</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Баллы</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user, index) => (
                <TableRow key={user.id} onClick={() => handleUserClick(user)} className={cn(isAdmin && "cursor-pointer")}>
                    <TableCell className="font-bold text-lg text-muted-foreground">
                    {index === 0 && <Trophy className="w-6 h-6 text-yellow-400 inline-block" />}
                    {index === 1 && <Trophy className="w-6 h-6 text-slate-400 inline-block" />}
                    {index === 2 && <Trophy className="w-6 h-6 text-amber-700 inline-block" />}
                    {index > 2 && index + 1}
                    </TableCell>
                    <TableCell>
                      <DialogTrigger asChild>
                        <div className="flex items-center gap-3">
                          <Avatar>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                      </div>
                      </DialogTrigger>
                    </TableCell>
                    <TableCell>
                    <Badge variant={'outline'} className={cn("capitalize", getStatusClass(user.status))}>
                        {user.status}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">{user.points.toLocaleString()}</TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
             {selectedUser && (
                <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto">
                    <UserProfileDialog user={selectedUser} />
                </DialogContent>
            )}
        </Dialog>
      </CardContent>
    </Card>
  );
}
