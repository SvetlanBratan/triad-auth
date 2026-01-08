

'use client';

import React from 'react';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Search, Send, Trash2 } from 'lucide-react';
import type { User, UserStatus, PlayerPing } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { CustomIcon } from '../ui/custom-icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '../ui/button';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';


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
    const { fetchUsersForAdmin, currentUser, sendPlayerPing, deletePlayerPing } = useUser();
    const { toast } = useToast();
    const { data: users = [], isLoading, isError, refetch } = useQuery<User[], Error>({
        queryKey: ['allUsersForSearch'],
        queryFn: fetchUsersForAdmin,
    });

    const [processingId, setProcessingId] = React.useState<string | null>(null);

    const lookingForGamePlayers = React.useMemo(() => {
        if (!users || !currentUser) return [];
        return users.filter(user => user.status === 'активный' && user.playerStatus === 'Ищу соигрока' && user.id !== currentUser.id);
    }, [users, currentUser]);

    const myPings = React.useMemo(() => {
        return currentUser?.playerPings || [];
    }, [currentUser]);

    const pingsToMe = React.useMemo(() => {
        const pings: (PlayerPing & { fromUser: User | undefined })[] = [];
        users.forEach(user => {
            (user.playerPings || []).forEach(ping => {
                if (ping.toUserId === currentUser?.id) {
                    pings.push({ ...ping, fromUser: users.find(u => u.id === ping.fromUserId) });
                }
            });
        });
        return pings;
    }, [users, currentUser]);

    const handlePing = async (targetUserId: string) => {
        if (!currentUser) return;
        setProcessingId(targetUserId);
        try {
            await sendPlayerPing(targetUserId);
            toast({ title: 'Отклик отправлен!', description: 'Игрок получит уведомление.' });
            refetch();
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Не удалось отправить отклик.";
            toast({ variant: 'destructive', title: 'Ошибка', description: msg });
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (pingId: string, isMyPing: boolean) => {
        if (!currentUser) return;
        setProcessingId(pingId);
        try {
            await deletePlayerPing(pingId, isMyPing);
            toast({ title: 'Отклик удален.' });
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Не удалось удалить отклик.";
            toast({ variant: 'destructive', title: 'Ошибка', description: msg });
        } finally {
            setProcessingId(null);
        }
    };
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><p>Загрузка игроков...</p></div>
    }

    if(isError) {
        return <p className="text-center text-destructive">Не удалось загрузить список игроков.</p>
    }
    
    const sentPingUserIds = new Set(myPings.map(p => p.toUserId));

    return (
        <div className="space-y-8">
            {(pingsToMe.length > 0 || myPings.length > 0) && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold mb-2">Вам откликнулись:</h3>
                        {pingsToMe.length > 0 ? (
                            <div className="space-y-2">
                                {pingsToMe.map(ping => (
                                    <Alert key={ping.id}>
                                        <div className="flex items-center justify-between">
                                            <Link href={`/users/${ping.fromUserId}`} className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={ping.fromUser?.avatar} alt={ping.fromUser?.name} />
                                                    <AvatarFallback>{ping.fromUser?.name.slice(0, 2)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{ping.fromUser?.name}</span>
                                            </Link>
                                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(ping.id, false)} disabled={processingId === ping.id}>
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </Alert>
                                ))}
                            </div>
                        ) : <p className="text-sm text-muted-foreground">Пока нет новых откликов.</p>}
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Ваши отклики:</h3>
                        {myPings.length > 0 ? (
                            <div className="space-y-2">
                                {myPings.map(ping => {
                                    const targetUser = users.find(u => u.id === ping.toUserId);
                                    return (
                                        <Alert key={ping.id}>
                                            <div className="flex items-center justify-between">
                                                <Link href={`/users/${ping.toUserId}`} className="flex items-center gap-2">
                                                     <Avatar className="h-8 w-8">
                                                        <AvatarImage src={targetUser?.avatar} alt={targetUser?.name} />
                                                        <AvatarFallback>{targetUser?.name.slice(0, 2)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{targetUser?.name}</span>
                                                </Link>
                                                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(ping.id, true)} disabled={processingId === ping.id}>
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </Alert>
                                    );
                                })}
                            </div>
                        ) : <p className="text-sm text-muted-foreground">Вы еще никому не откликались.</p>}
                    </div>
                </div>
            )}

            <div>
                 <h3 className="font-semibold mb-4">Игроки в поиске:</h3>
                 {lookingForGamePlayers.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Игрок</TableHead>
                                <TableHead className="w-[120px]">Действие</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lookingForGamePlayers.map((user) => (
                                <TableRow key={user.id}>
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
                                        <Button 
                                            size="sm"
                                            onClick={() => handlePing(user.id)}
                                            disabled={processingId === user.id || sentPingUserIds.has(user.id)}
                                        >
                                            <Send className="mr-2 h-4 w-4"/> 
                                            {sentPingUserIds.has(user.id) ? 'Отправлено' : 'Откликнуться'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground py-8">Сейчас нет игроков со статусом "Ищу соигрока".</p>
                )}
            </div>
        </div>
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
            Список <span className="line-through">Forbes</span> Тыквенного Переполоха. Нажмите на пользователя, чтобы просмотреть детали.
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
