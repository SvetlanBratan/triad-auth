
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { RewardRequest, RewardRequestStatus, PostRequest, PostRequestStatus } from '@/lib/types';
import { CheckCircle, XCircle, Clock, Trash2, MessageSquare, Users, GitPullRequest } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';


const RewardRequestsList = ({ requests, onUpdate }: { requests: RewardRequest[], onUpdate: (req: RewardRequest, status: RewardRequestStatus) => void }) => {
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

    const getStatusProps = (status: RewardRequestStatus) => ({
        'в ожидании': { icon: <Clock className="w-4 h-4 text-orange-500" />, badgeClass: 'bg-orange-100 text-orange-800 border-orange-200', text: 'В ожидании' },
        'одобрено': { icon: <CheckCircle className="w-4 h-4 text-green-500" />, badgeClass: 'bg-green-100 text-green-800 border-green-200', text: 'Одобрено' },
        'отклонено': { icon: <XCircle className="w-4 h-4 text-red-500" />, badgeClass: 'bg-red-100 text-red-800 border-red-200', text: 'Отклонено' }
    }[status] || { icon: <Clock className="w-4 h-4" />, badgeClass: '', text: '' });

    const handleUpdate = async (request: RewardRequest, status: RewardRequestStatus) => {
        setProcessingRequestId(request.id);
        await onUpdate(request, status);
        setProcessingRequestId(null);
    }

    return (
        <div className="space-y-3">
            {requests.map(request => {
                const statusProps = getStatusProps(request.status);
                const isProcessing = processingRequestId === request.id;
                return (
                    <Card key={request.id}>
                        <CardHeader className="p-4">
                             <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-base">{request.rewardTitle}</CardTitle>
                                    <CardDescription className="text-xs">
                                        От: <strong>{request.userName}</strong> | Стоимость: {request.rewardCost.toLocaleString()} баллов
                                    </CardDescription>
                                    {request.characterName && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Для персонажа: <strong>{request.characterName}</strong>
                                        </p>
                                    )}
                                </div>
                                <Badge variant="outline" className={cn("flex items-center gap-2 text-xs", statusProps.badgeClass)}>
                                    {statusProps.icon}
                                    {statusProps.text}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardFooter className="flex justify-between items-center p-4 pt-0">
                             <p className="text-xs text-muted-foreground">
                                Запрошено: {new Date(request.createdAt).toLocaleString()}
                             </p>
                             {request.status === 'в ожидании' && (
                                <div className="flex gap-2">
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button variant="outline" size="sm" disabled={isProcessing}>
                                                <XCircle className="mr-2 h-4 w-4" /> Отклонить
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Запрос будет отклонен, и {request.rewardCost.toLocaleString()} баллов будут возвращены пользователю {request.userName}.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleUpdate(request, 'отклонено')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                Да, отклонить
                                            </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>

                                    <Button size="sm" onClick={() => handleUpdate(request, 'одобрено')} disabled={isProcessing}>
                                        {isProcessing ? 'Обработка...' : <><CheckCircle className="mr-2 h-4 w-4" />Одобрить</>}
                                    </Button>
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
    );
};


const PostRequestsList = ({ requests, onUpdate, currentUserId }: { requests: PostRequest[], onUpdate: (req: PostRequest, status: PostRequestStatus) => void, currentUserId?: string }) => {
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

    const getStatusProps = (status: PostRequestStatus) => ({
        'в ожидании': { icon: <Clock className="w-4 h-4 text-orange-500" />, badgeClass: 'bg-orange-100 text-orange-800 border-orange-200', text: 'В ожидании' },
        'подтверждено': { icon: <CheckCircle className="w-4 h-4 text-green-500" />, badgeClass: 'bg-green-100 text-green-800 border-green-200', text: 'Подтверждено' },
        'отклонено': { icon: <XCircle className="w-4 h-4 text-red-500" />, badgeClass: 'bg-red-100 text-red-800 border-red-200', text: 'Отклонено' }
    }[status] || { icon: <Clock className="w-4 h-4" />, badgeClass: '', text: '' });

    const handleUpdate = async (request: PostRequest, status: PostRequestStatus) => {
        setProcessingRequestId(request.id);
        await onUpdate(request, status);
        setProcessingRequestId(null);
    };

    return (
        <div className="space-y-3">
            {requests.map(request => {
                const statusProps = getStatusProps(request.status);
                const isProcessing = processingRequestId === request.id;
                const isTargetUser = currentUserId === request.targetUserId;
                return (
                    <Card key={request.id}>
                        <CardHeader className="p-4 space-y-2">
                             <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-base">Запрос на пост</CardTitle>
                                    <CardDescription className="text-xs">
                                        От: <strong>{request.sourceCharacterName}</strong> ({request.sourceUserName})
                                        <br/>
                                        Кому: <strong>{request.targetCharacterName}</strong> ({request.targetUserName})
                                    </CardDescription>
                                </div>
                                <Badge variant="outline" className={cn("flex items-center gap-2 text-xs", statusProps.badgeClass)}>
                                    {statusProps.icon}
                                    {statusProps.text}
                                </Badge>
                            </div>
                            <p className="text-sm p-2 bg-muted rounded-md">Локация: {request.location}</p>
                        </CardHeader>
                        <CardFooter className="flex justify-between items-center p-4 pt-0">
                             <p className="text-xs text-muted-foreground">
                                Запрошено: {new Date(request.createdAt).toLocaleString()}
                             </p>
                             {request.status === 'в ожидании' && isTargetUser && (
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" disabled={isProcessing} onClick={() => handleUpdate(request, 'отклонено')}>
                                        <XCircle className="mr-2 h-4 w-4" /> Отклонить
                                    </Button>
                                    <Button size="sm" onClick={() => handleUpdate(request, 'подтверждено')} disabled={isProcessing}>
                                        {isProcessing ? 'Обработка...' : <><CheckCircle className="mr-2 h-4 w-4" />Подтвердить</>}
                                    </Button>
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
    );
};


export default function RequestsTab() {
    const { fetchAllRewardRequests, updateRewardRequestStatus, currentUser, fetchAllPostRequests, updatePostRequest } = useUser();
    const [rewardRequests, setRewardRequests] = useState<RewardRequest[]>([]);
    const [postRequests, setPostRequests] = useState<PostRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const loadRequests = useCallback(async () => {
        setIsLoading(true);
        try {
            const [rewards, posts] = await Promise.all([
                fetchAllRewardRequests(),
                fetchAllPostRequests(),
            ]);
            setRewardRequests(rewards);
            setPostRequests(posts);
        } catch (error) {
            console.error("Failed to load requests", error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить запросы' });
        } finally {
            setIsLoading(false);
        }
    }, [fetchAllRewardRequests, fetchAllPostRequests, toast]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleUpdateReward = async (request: RewardRequest, newStatus: RewardRequestStatus) => {
        try {
            const updatedRequest = await updateRewardRequestStatus(request, newStatus);
            if(updatedRequest) {
                setRewardRequests(prev => prev.map(r => r.id === request.id ? updatedRequest : r));
                toast({
                    title: 'Запрос на награду обновлен!',
                    description: `Статус изменен на "${newStatus}".`
                });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось обновить запрос на награду.' });
        }
    };

    const handleUpdatePost = async (request: PostRequest, newStatus: PostRequestStatus) => {
        try {
            await updatePostRequest(request, newStatus);
            setPostRequests(prev => prev.map(r => r.id === request.id ? {...r, status: newStatus} : r));
             toast({
                title: 'Запрос на пост обновлен!',
                description: `Статус изменен на "${newStatus}".`
            });
        } catch (error) {
             toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось обновить запрос на пост.' });
        }
    };


    const pendingRewardRequests = rewardRequests.filter(r => r.status === 'в ожидании');
    const processedRewardRequests = rewardRequests.filter(r => r.status !== 'в ожидании').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const pendingPostRequests = postRequests.filter(r => r.status === 'в ожидании');
    const userPostRequests = postRequests.filter(r => r.status === 'в ожидании' && r.targetUserId === currentUser?.id);


    if (isLoading) {
        return <p>Загрузка запросов...</p>;
    }

    return (
        <Tabs defaultValue="rewards">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="rewards"><GitPullRequest className="mr-2" />Награды</TabsTrigger>
                <TabsTrigger value="posts"><MessageSquare className="mr-2" />Посты</TabsTrigger>
            </TabsList>
            <TabsContent value="rewards" className="mt-4">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Ожидают решения ({pendingRewardRequests.length})</h2>
                        {pendingRewardRequests.length > 0 ? (
                            <RewardRequestsList requests={pendingRewardRequests} onUpdate={handleUpdateReward} />
                        ) : (
                            <p className="text-muted-foreground">Новых запросов на награды нет.</p>
                        )}
                    </div>
                    <div className="flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">История запросов</h2>
                        </div>
                        {processedRewardRequests.length > 0 ? (
                            <ScrollArea className="h-[75vh] pr-4">
                                <RewardRequestsList requests={processedRewardRequests} onUpdate={handleUpdateReward} />
                            </ScrollArea>
                        ) : (
                            <p className="text-muted-foreground">Обработанных запросов нет.</p>
                        )}
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="posts" className="mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                     <div>
                        <h2 className="text-2xl font-bold mb-4">Ваши запросы на подтверждение ({userPostRequests.length})</h2>
                        {userPostRequests.length > 0 ? (
                            <PostRequestsList requests={userPostRequests} onUpdate={handleUpdatePost} currentUserId={currentUser?.id} />
                        ) : (
                            <p className="text-muted-foreground">У вас нет запросов на подтверждение.</p>
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Все активные запросы ({pendingPostRequests.length})</h2>
                        {pendingPostRequests.length > 0 ? (
                             <ScrollArea className="h-[75vh] pr-4">
                                <PostRequestsList requests={pendingPostRequests} onUpdate={handleUpdatePost} currentUserId={currentUser?.id}/>
                             </ScrollArea>
                        ) : (
                            <p className="text-muted-foreground">Нет активных запросов от игроков.</p>
                        )}
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    );
}
