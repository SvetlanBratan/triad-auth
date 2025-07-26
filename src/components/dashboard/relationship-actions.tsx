

'use client';

import React, { useState, useMemo } from 'react';
import type { Character, RelationshipActionType } from '@/lib/types';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '../ui/dialog';
import { Gift, Mail, MessageSquarePlus, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { differenceInHours, differenceInDays } from 'date-fns';
import { SearchableSelect } from '../ui/searchable-select';


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
    const [isLoading, setIsLoading] = useState(false);
    
    // Check if there's any relationship between any of the current user's characters and the target character
    const hasAnyRelationship = useMemo(() => {
        if (!currentUser) return false;
        return currentUser.characters.some(sourceChar => 
            (sourceChar.relationships || []).some(rel => rel.targetCharacterId === targetCharacter.id)
        );
    }, [currentUser, targetCharacter.id]);


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


    const handleSimpleAction = async (actionType: 'подарок' | 'письмо') => {
        if (!currentUser || !sourceCharacterId) return;

        // Check if a relationship exists. If not, this action cannot be performed yet.
        if (!relationship) {
            toast({
                variant: "destructive",
                title: "Отношения не установлены",
                description: "Сначала администратор должен установить базовые отношения между персонажами."
            });
            return;
        }

        setIsLoading(true);
        try {
            await performRelationshipAction(currentUser.id, sourceCharacterId, targetCharacter.id, actionType, `Отправлен ${actionType === 'подарок' ? 'подарок' : 'письмо'}`);
            toast({ title: 'Успех!', description: 'Действие выполнено, отношения обновлены.' });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Произошла неизвестная ошибка.';
            toast({ variant: 'destructive', title: 'Ошибка', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };
    
    // Do not render the component at all if there's no relationship established.
    if (!hasAnyRelationship) {
        return null;
    }

    const sourceCharacterOptions = (currentUser?.characters || [])
        .filter(char => (char.relationships || []).some(r => r.targetCharacterId === targetCharacter.id))
        .map(char => ({ value: char.id, label: char.name }));


    return (
        <Card>
            <CardHeader>
                <CardTitle>Действия</CardTitle>
                <CardDescription>Взаимодействуйте с этим персонажем от лица одного из ваших.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="source-char-select">От лица:</Label>
                    <SearchableSelect
                        options={sourceCharacterOptions}
                        value={sourceCharacterId}
                        onValueChange={setSourceCharacterId}
                        placeholder="Выберите персонажа..."
                    />
                </div>
                {sourceCharacterId && (
                    <>
                        <TooltipProvider delayDuration={100}>
                            <div className="grid grid-cols-2 gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span>
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => handleSimpleAction('подарок')}
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
                                                onClick={() => handleSimpleAction('письмо')}
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
                            </div>
                        </TooltipProvider>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
