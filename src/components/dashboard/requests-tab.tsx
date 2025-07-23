
"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { RewardRequest, RewardRequestStatus } from '@/lib/types';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
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


export default function RequestsTab() {
    const { fetchAllRewardRequests, updateRewardRequestStatus, addPointsToUser, currentUser } = useUser();
    const [rewardRequests, setRewardRequests] = useState<RewardRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const loadRequests = async () => {
            setIsLoading(true);
            try {
                const requests = await fetchAllRewardRequests();
                setRewardRequests(requests);
            } catch (error) {
                console.error("Failed to load requests", error);
                toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить запросы' });
            } finally {
                setIsLoading(false);
            }
        };
        loadRequests();
    }, [fetchAllRewardRequests, toast]);

    const handleUpdateRequest = async (request: RewardRequest, newStatus: RewardRequestStatus) => {
        setProcessingRequestId(request.id);
        try {
            const updatedRequest = await updateRewardRequestStatus(request, newStatus);
            if(updatedRequest) {
                setRewardRequests(prev => prev.map(r => r.id === request.id ? updatedRequest : r));
                toast({
                    title: 'Запрос обновлен!',
                    description: `Статус запроса от ${request.userName} изменен на "${newStatus}".`
                });

                if (newStatus === 'отклонено') {
                    // Points refund is now handled within updateRewardRequestStatus,
                    // but we need to update the local currentUser if it's the one affected.
                    if (currentUser && currentUser.id === request.userId) {
                        // Optimistically update, or refetch user
                    }
                    toast({
                        title: 'Баллы возвращены',
                        description: `Пользователю ${request.userName} возвращено ${request.rewardCost} баллов.`
                    });
                }
            }

        } catch (error) {
            console.error("Error updating request:", error);
            toast({
                variant: 'destructive',
                title: 'Ошибка',
                description: 'Не удалось обновить запрос.'
            });
        } finally {
            setProcessingRequestId(null);
        }
    };

    const getStatusProps = (status: RewardRequestStatus) => {
        switch (status) {
            case 'в ожидании':
                return {
                    icon: <Clock className="w-4 h-4 text-orange-500" />,
                    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
                    text: 'В ожидании'
                };
            case 'одобрено':
                return {
                    icon: <CheckCircle className="w-4 h-4 text-green-500" />,
                    badgeClass: 'bg-green-100 text-green-800 border-green-200',
                    text: 'Одобрено'
                };
            case 'отклонено':
                return {
                    icon: <XCircle className="w-4 h-4 text-red-500" />,
                    badgeClass: 'bg-red-100 text-red-800 border-red-200',
                    text: 'Отклонено'
                };
            default:
                return {
                    icon: <Clock className="w-4 h-4" />,
                    badgeClass: '',
                    text: ''
                };
        }
    };

    const pendingRequests = rewardRequests.filter(r => r.status === 'в ожидании');
    const processedRequests = rewardRequests.filter(r => r.status !== 'в ожидании');

    const RequestList = ({ requests }: { requests: RewardRequest[] }) => (
        <div className="space-y-4">
            {requests.map(request => {
                const statusProps = getStatusProps(request.status);
                const isProcessing = processingRequestId === request.id;
                return (
                    <Card key={request.id}>
                        <CardHeader>
                             <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{request.rewardTitle}</CardTitle>
                                    <CardDescription>
                                        От: <strong>{request.userName}</strong> | Стоимость: {request.rewardCost.toLocaleString()} баллов
                                    </CardDescription>
                                    {request.characterName && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Для персонажа: <strong>{request.characterName}</strong>
                                        </p>
                                    )}
                                </div>
                                <Badge variant="outline" className={cn("flex items-center gap-2", statusProps.badgeClass)}>
                                    {statusProps.icon}
                                    {statusProps.text}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardFooter className="flex justify-between items-center">
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
                                            <AlertDialogAction onClick={() => handleUpdateRequest(request, 'отклонено')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                Да, отклонить
                                            </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>

                                    <Button size="sm" onClick={() => handleUpdateRequest(request, 'одобрено')} disabled={isProcessing}>
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

    if (isLoading) {
        return <p>Загрузка запросов...</p>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <h2 className="text-2xl font-bold mb-4">Ожидают решения</h2>
                {pendingRequests.length > 0 ? (
                    <RequestList requests={pendingRequests} />
                ) : (
                    <p className="text-muted-foreground">Новых запросов нет.</p>
                )}
            </div>
             <div>
                <h2 className="text-2xl font-bold mb-4">История запросов</h2>
                {processedRequests.length > 0 ? (
                    <RequestList requests={processedRequests} />
                ) : (
                    <p className="text-muted-foreground">Обработанных запросов нет.</p>
                )}
            </div>
        </div>
    );
}
