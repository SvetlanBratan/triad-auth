
'use client';

import React, { useState, useMemo } from 'react';
import type { Character, RelationshipActionType } from '@/lib/types';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '../ui/dialog';
import { Gift, Mail, MessageSquarePlus, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { differenceInHours, differenceInDays } from 'date-fns';


interface RelationshipActionsProps {
    targetCharacter: Character;
}

const Cooldowns = {
    подарок: 24, // hours
    письмо: 7 * 24, // hours
}

export default function RelationshipActions({ targetCharacter }: RelationshipActionsProps) {
    const { currentUser, performRelationshipAction } = useUser();
    const { toast } = useToast();

    const [sourceCharacterId, setSourceCharacterId] = useState('');
    const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
    const [postLocation, setPostLocation] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const relationship = useMemo(() => {
        if (!currentUser || !sourceCharacterId) return null;
        const sourceChar = currentUser.characters.find(c => c.id === sourceCharacterId);
        return sourceChar?.relationships.find(r => r.targetCharacterId === targetCharacter.id) || null;
    }, [currentUser, sourceCharacterId, targetCharacter.id]);

    const canSendGift = useMemo(() => {
        if (!relationship?.lastGiftSentAt) return true;
        return differenceInHours(new Date(), new Date(relationship.lastGiftSentAt)) >= Cooldowns.подарок;
    }, [relationship]);

    const canSendLetter = useMemo(() => {
        if (!relationship?.lastLetterSentAt) return true;
        return differenceInHours(new Date(), new Date(relationship.lastLetterSentAt)) >= Cooldowns.письмо;
    }, [relationship]);
    
    const giftTimeLeft = useMemo(() => {
        if (canSendGift || !relationship?.lastGiftSentAt) return '';
        const hoursLeft = Cooldowns.подарок - differenceInHours(new Date(), new Date(relationship.lastGiftSentAt));
        return `Осталось: ${hoursLeft} ч.`;
    }, [relationship, canSendGift]);

     const letterTimeLeft = useMemo(() => {
        if (canSendLetter || !relationship?.lastLetterSentAt) return '';
        const hoursLeft = Cooldowns.письмо - differenceInHours(new Date(), new Date(relationship.lastLetterSentAt));
        const daysLeft = Math.ceil(hoursLeft / 24);
        return `Осталось: ${daysLeft} д.`;
    }, [relationship, canSendLetter]);


    const handleAction = async (actionType: RelationshipActionType, description: string) => {
        if (!currentUser || !sourceCharacterId) {
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не выбран исходный персонаж.' });
            return;
        }

        setIsLoading(true);
        try {
            await performRelationshipAction(currentUser.id, sourceCharacterId, targetCharacter.id, actionType, description);
            toast({ title: 'Успех!', description: `Действие "${actionType}" выполнено. Отношения обновлены.` });
            if (actionType === 'пост') {
                setIsPostDialogOpen(false);
                setPostLocation('');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Произошла неизвестная ошибка.';
            toast({ variant: 'destructive', title: 'Ошибка', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!currentUser?.characters.some(c => c.relationships.some(r => r.targetCharacterId === targetCharacter.id))) {
        return null;
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>Действия</CardTitle>
                <CardDescription>Взаимодействуйте с этим персонажем от лица одного из ваших.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="source-char-select">От лица:</Label>
                    <Select value={sourceCharacterId} onValueChange={setSourceCharacterId}>
                        <SelectTrigger id="source-char-select">
                            <SelectValue placeholder="Выберите персонажа..." />
                        </SelectTrigger>
                        <SelectContent>
                            {currentUser.characters
                                .filter(c => c.relationships.some(r => r.targetCharacterId === targetCharacter.id))
                                .map(char => (
                                    <SelectItem key={char.id} value={char.id}>
                                        {char.name}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
                {sourceCharacterId && relationship && (
                    <TooltipProvider delayDuration={100}>
                        <div className="grid grid-cols-3 gap-2">
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    {/* Wrapping button in a span is required for Tooltip when button is disabled */}
                                    <span>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => handleAction('подарок', 'Отправлен подарок')}
                                            disabled={!canSendGift || isLoading}
                                        >
                                            <Gift className="w-4 h-4" />
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Отправить подарок (+25)</p>
                                    {!canSendGift && <p className="text-xs text-muted-foreground">{giftTimeLeft}</p>}
                                </TooltipContent>
                            </Tooltip>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                     <span>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => handleAction('письмо', 'Отправлено письмо')}
                                            disabled={!canSendLetter || isLoading}
                                        >
                                            <Mail className="w-4 h-4" />
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Отправить письмо (+10)</p>
                                    {!canSendLetter && <p className="text-xs text-muted-foreground">{letterTimeLeft}</p>}
                                </TooltipContent>
                            </Tooltip>
                            
                             <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                         <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full" disabled={isLoading}>
                                                <MessageSquarePlus className="w-4 h-4" />
                                            </Button>
                                        </DialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Написать пост (+2)</p>
                                    </TooltipContent>
                                </Tooltip>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Подтверждение поста</DialogTitle>
                                        <DialogDescription>
                                           Чтобы подтвердить написание поста для персонажа {targetCharacter.name}, укажите локацию, где он был написан. Это действие не имеет кулдауна, но дает меньше очков.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-2 py-4">
                                        <Label htmlFor="post-location">Локация поста</Label>
                                        <Textarea 
                                            id="post-location" 
                                            value={postLocation} 
                                            onChange={e => setPostLocation(e.target.value)} 
                                            placeholder='например, "Площадь города", "Таверна «Пьяный лис»"'
                                        />
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button type="button" variant="ghost">Отмена</Button>
                                        </DialogClose>
                                        <Button 
                                            type="button" 
                                            onClick={() => handleAction('пост', `Написан пост в локации: ${postLocation}`)}
                                            disabled={!postLocation || isLoading}
                                        >
                                            {isLoading ? 'Подтверждение...' : 'Подтвердить'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </TooltipProvider>
                )}
            </CardContent>
        </Card>
    );
}
