

"use client";

import React from 'react';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import type { User, UserStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { CustomIcon } from '../ui/custom-icon';


export default function LeaderboardTab() {
  const { fetchLeaderboardUsers } = useUser();
  const { toast } = useToast();

  const { data: users = [], isLoading: isLeaderboardLoading, isError: isLeaderboardError } = useQuery<User[], Error>({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboardUsers,
  });
  
  React.useEffect(() => {
    if (isLeaderboardError) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось загрузить таблицу лидеров. Возможно, требуется создать индекс в Firestore. Ссылка для создания должна быть в консоли браузера (F12).'
      });
    }
  }, [isLeaderboardError, toast]);
  

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


  if (isLeaderboardLoading) {
      return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <CustomIcon src="/icons/leaderboard.svg" className="w-5 h-5 icon-primary" /> Таблица лидеров
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
          <CustomIcon src="/icons/leaderboard.svg" className="w-5 h-5 icon-primary" /> Таблица лидеров
        </CardTitle>
        <CardDescription>
            Список <s>Forbes</s> Тыквенного Переполоха. Нажмите на пользователя, чтобы просмотреть детали.
        </CardDescription>
      </CardHeader>
      <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[60px] sm:w-[80px]">Ранг</TableHead>
                <TableHead>Игрок</TableHead>
                <TableHead className="hidden sm:table-cell">Статус</TableHead>
                <TableHead className="text-right">Баллы</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user, index) => (
                <TableRow key={user.id} className="cursor-pointer">
                    <TableCell className="font-bold text-lg text-muted-foreground">
                    <Link href={`/users/${user.id}`} className="block w-full h-full">
                        {index === 0 && <Trophy className="w-6 h-6 text-yellow-400 inline-block" />}
                        {index === 1 && <Trophy className="w-6 h-6 text-slate-400 inline-block" />}
                        {index === 2 && <Trophy className="w-6 h-6 text-amber-700 inline-block" />}
                        {index > 2 && index + 1}
                    </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/users/${user.id}`} className="flex items-center gap-3">
                          <Avatar>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden capitalize">{user.status}</p>
                          </div>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                     <Link href={`/users/${user.id}`} className="block w-full h-full">
                        <Badge variant={'outline'} className={cn("capitalize", getStatusClass(user.status))}>
                            {user.status}
                        </Badge>
                     </Link>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                        <Link href={`/users/${user.id}`} className="block w-full h-full">
                            {user.points.toLocaleString()}
                        </Link>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
      </CardContent>
    </Card>
  );
}
