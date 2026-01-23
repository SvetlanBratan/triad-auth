

"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { RewardRequest, RewardRequestStatus } from '@/lib/types';
import { CheckCircle, XCircle, Clock, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';

export default function RewardRequestsHistory() {
    const { fetchRewardRequestsForUser, currentUser } = useUser();
    const [requests, setRequests] = useState<RewardRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const loadInitialRequests = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        setHasMore(false);
        try {
            const fetchedRequests = await fetchRewardRequestsForUser(currentUser.id, 6);
            if (fetchedRequests.length > 5) {
                setHasMore(true);
                setRequests(fetchedRequests.slice(0, 5));
            } else {
                setHasMore(false);
                setRequests(fetchedRequests);
            }
        } catch (error) {
            console.error("Failed to load reward requests history", error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить историю запросов.' });
        } finally {
            setIsLoading(false);
        }
    }, [fetchRewardRequestsForUser, currentUser, toast]);

    useEffect(() => {
        loadInitialRequests();
    }, [loadInitialRequests]);

    const handleShowAll = async () => {
        if (!currentUser) return;
        setIsLoadingMore(true);
        try {
            const allRequests = await fetchRewardRequestsForUser(currentUser.id);
            setRequests(allRequests);
            setHasMore(false);
        } catch (error) {
            console.error("Failed to load all reward requests", error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить всю историю.' });
        } finally {
            setIsLoadingMore(false);
        }
    };
    
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
            {hasMore && (
                <CardFooter>
                    <Button variant="link" onClick={handleShowAll} disabled={isLoadingMore} className="p-0 h-auto text-xs">
                        {isLoadingMore ? 'Загрузка...' : 'Показать все'}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
