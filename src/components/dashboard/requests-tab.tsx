
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { RewardRequest, RewardRequestStatus } from '@/lib/types';
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
                                     <p className="text-xs text-muted-foreground mt-1">
                                        {request.characterName 
                                            ? <>Для персонажа: <strong>{request.characterName}</strong></>
                                            : <>Для игрока: <strong>{request.userName}</strong></>
                                        }
                                    </p>
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


export default function RequestsTab() {
    const { fetchAllRewardRequests, updateRewardRequestStatus } = useUser();
    const [rewardRequests, setRewardRequests] = useState<RewardRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const loadRequests = useCallback(async () => {
        setIsLoading(true);
        try {
            const rewards = await fetchAllRewardRequests();
            setRewardRequests(rewards);
        } catch (error) {
            console.error("Failed to load requests", error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить запросы' });
        } finally {
            setIsLoading(false);
        }
    }, [fetchAllRewardRequests, toast]);

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

    const pendingRewardRequests = rewardRequests.filter(r => r.status === 'в ожидании');
    const processedRewardRequests = rewardRequests.filter(r => r.status !== 'в ожидании').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


    if (isLoading) {
        return <p>Загрузка запросов...</p>;
    }

    return (
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
    );
}
