

"use client";

import React from 'react';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Search } from 'lucide-react';
import type { User, UserStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { CustomIcon } from '../ui/custom-icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


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

const LeaderboardTable = () => {
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

    if (isLeaderboardLoading) {
        return <div className="flex justify-center items-center h-64"><p>Загрузка...</p></div>
    }

    return (
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
    );
};

const CoPlayerSearch = () => {
    const { fetchUsersForAdmin } = useUser();
    const { data: users = [], isLoading, isError } = useQuery<User[], Error>({
        queryKey: ['allUsersForSearch'],
        queryFn: fetchUsersForAdmin,
    });

    const activePlayers = React.useMemo(() => {
        return users.filter(user => user.status === 'активный' && user.playerStatus !== 'Не играю');
    }, [users]);
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><p>Загрузка игроков...</p></div>
    }

    if(isError) {
        return <p className="text-center text-destructive">Не удалось загрузить список игроков.</p>
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Игрок</TableHead>
                    <TableHead>Игровой статус</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {activePlayers.map((user) => (
                    <TableRow key={user.id} className="cursor-pointer">
                        <TableCell>
                            <Link href={`/users/${user.id}`} className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                                </Avatar>
                                <p className="font-medium">{user.name}</p>
                            </Link>
                        </TableCell>
                         <TableCell>
                             <Link href={`/users/${user.id}`} className="block w-full h-full">
                                <Badge variant={'outline'}>
                                    {user.playerStatus}
                                </Badge>
                             </Link>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export default function LeaderboardTab() {
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CustomIcon src="/icons/leaderboard.svg" className="w-5 h-5 icon-primary" /> Игроки
        </CardTitle>
        <CardDescription>
            Просматривайте рейтинг игроков или ищите соигроков.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="leaderboard" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
                <TabsTrigger value="leaderboard"><Trophy className="mr-2 h-4 w-4"/>Таблица лидеров</TabsTrigger>
                <TabsTrigger value="search"><Search className="mr-2 h-4 w-4"/>Поиск соигроков</TabsTrigger>
            </TabsList>
            <TabsContent value="leaderboard" className="mt-4">
                <LeaderboardTable />
            </TabsContent>
            <TabsContent value="search" className="mt-4">
                <CoPlayerSearch />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
