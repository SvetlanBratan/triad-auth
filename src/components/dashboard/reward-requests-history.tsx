
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { RewardRequest, RewardRequestStatus } from '@/lib/types';
import { CheckCircle, XCircle, Clock, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

export default function RewardRequestsHistory() {
    const { fetchRewardRequestsForUser, currentUser } = useUser();
    const [requests, setRequests] = useState<RewardRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const loadRequests = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const fetchedRequests = await fetchRewardRequestsForUser(currentUser.id);
            setRequests(fetchedRequests);
        } catch (error) {
            console.error("Failed to load reward requests history", error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить историю запросов.' });
        } finally {
            setIsLoading(false);
        }
    }, [fetchRewardRequestsForUser, currentUser, toast]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests, currentUser?.pointHistory]); // Re-fetch if point history changes (new request)

    const getStatusProps = (status: RewardRequestStatus) => {
        switch (status) {
            case 'в ожидании':
                return {
                    icon: <Clock className="w-3 h-3" />,
                    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
                    text: 'В ожидании'
                };
            case 'одобрено':
                return {
                    icon: <CheckCircle className="w-3 h-3" />,
                    badgeClass: 'bg-green-100 text-green-800 border-green-200',
                    text: 'Одобрено'
                };
            case 'отклонено':
                return {
                    icon: <XCircle className="w-3 h-3" />,
                    badgeClass: 'bg-red-100 text-red-800 border-red-200',
                    text: 'Отклонено'
                };
            default:
                return { icon: null, badgeClass: '', text: '' };
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    История запросов
                </CardTitle>
                <CardDescription>Статусы ваших запросов на награды.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-64 pr-3">
                    {isLoading ? (
                        <p className="text-sm text-muted-foreground">Загрузка истории...</p>
                    ) : requests.length > 0 ? (
                        <div className="space-y-3">
                            {requests.map(request => {
                                const statusProps = getStatusProps(request.status);
                                return (
                                    <div key={request.id} className="p-3 bg-muted/50 rounded-md">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-sm">{request.rewardTitle}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(request.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className={cn("text-xs gap-1.5", statusProps.badgeClass)}>
                                                {statusProps.icon}
                                                {statusProps.text}
                                            </Badge>
                                        </div>
                                         <p className="text-xs text-muted-foreground mt-1">
                                            {request.characterName 
                                                ? <>Для персонажа: <span className="font-medium">{request.characterName}</span></>
                                                : <>Для игрока: <span className="font-medium">{request.userName}</span></>
                                            }
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Вы еще не делали запросов.</p>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
