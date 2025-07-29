

'use client';

import React, { useState, useMemo } from 'react';
import type { Character, RelationshipActionType, InventoryCategory, InventoryItem, PerformRelationshipActionParams } from '@/lib/types';
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
import { INVENTORY_CATEGORIES } from '@/lib/data';


interface RelationshipActionsProps {
    targetCharacter: Character;
}

const Cooldowns = {
    подарок: 24, // hours
    письмо: 7 * 24, // hours
}

const giftableCategories: InventoryCategory[] = ['подарки', 'драгоценности', 'еда', 'книгиИСвитки', 'артефакты', 'зелья', 'прочее'];


export default function RelationshipActions({ targetCharacter }: RelationshipActionsProps) {
    const { currentUser, performRelationshipAction } = useUser();
    const { toast } = useToast();

    const [sourceCharacterId, setSourceCharacterId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGiftDialogOpen, setIsGiftDialogOpen] = useState(false);
    const [isLetterDialogOpen, setIsLetterDialogOpen] = useState(false);
    const [selectedGift, setSelectedGift] = useState<{ itemId: string; category: InventoryCategory; name: string } | null>(null);
    const [letterContent, setLetterContent] = useState('');
    
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


    const handleAction = async (params: Omit<PerformRelationshipActionParams, 'sourceUserId'>) => {
         if (!currentUser || !sourceCharacterId) return;

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
            await performRelationshipAction({
                sourceUserId: currentUser.id, 
                ...params
            });
            toast({ title: 'Успех!', description: 'Действие выполнено, отношения обновлены.' });

            if (params.actionType === 'письмо') {
                setIsLetterDialogOpen(false);
                setLetterContent('');
            }
             if (params.actionType === 'подарок') {
                setIsGiftDialogOpen(false);
                setSelectedGift(null);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Произошла неизвестная ошибка.';
            toast({ variant: 'destructive', title: 'Ошибка', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleGiftAction = () => {
        if (!selectedGift) return;
        handleAction({
            sourceCharacterId,
            targetCharacterId: targetCharacter.id,
            actionType: 'подарок',
            description: `Подарен предмет: ${selectedGift.name}`,
            itemId: selectedGift.itemId,
            itemCategory: selectedGift.category
        })
    };

    const handleLetterAction = () => {
        if (!letterContent.trim()) {
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Письмо не может быть пустым.' });
            return;
        }
        handleAction({
            sourceCharacterId,
            targetCharacterId: targetCharacter.id,
            actionType: 'письмо',
            description: `Отправлено письмо`,
            content: letterContent,
        })
    };

    const sourceCharacter = useMemo(() => {
        return currentUser?.characters.find(c => c.id === sourceCharacterId);
    }, [currentUser, sourceCharacterId]);

    const giftableItemsOptions = useMemo(() => {
        if (!sourceCharacter?.inventory) return [];
        
        return giftableCategories.flatMap(categoryKey => {
            const categoryLabel = INVENTORY_CATEGORIES.find(c => c.value === categoryKey)?.label || categoryKey;
            const items = (sourceCharacter.inventory[categoryKey] as InventoryItem[] | undefined) || [];
            
            if (items.length === 0) return [];

            return {
                label: categoryLabel,
                options: items.map(item => ({
                    label: `${item.name}${item.quantity > 1 ? ` (x${item.quantity})` : ''}`,
                    value: JSON.stringify({ itemId: item.id, category: categoryKey, name: item.name })
                }))
            };
        }).filter(group => group && group.options.length > 0);

    }, [sourceCharacter]);

    
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
                        onValueChange={(val) => { setSourceCharacterId(val); setSelectedGift(null); }}
                        placeholder="Выберите персонажа..."
                    />
                </div>
                {sourceCharacterId && (
                    <>
                        <TooltipProvider delayDuration={100}>
                            <div className="grid grid-cols-2 gap-2">
                                <Dialog open={isGiftDialogOpen} onOpenChange={setIsGiftDialogOpen}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                             <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                    disabled={!canSendGift || isLoading}
                                                >
                                                    <Gift className="w-4 h-4" />
                                                </Button>
                                             </DialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Отправить подарок (+25)</p>
                                            {!canSendGift && <p className="text-xs text-muted-foreground">{giftTimeLeft}</p>}
                                        </TooltipContent>
                                    </Tooltip>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Отправить подарок</DialogTitle>
                                            <DialogDescription>
                                                Выберите предмет из инвентаря персонажа {sourceCharacter?.name}, чтобы подарить его {targetCharacter.name}.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4 space-y-2">
                                            <Label htmlFor="gift-select">Предмет</Label>
                                            <SearchableSelect
                                                options={giftableItemsOptions}
                                                value={selectedGift ? JSON.stringify(selectedGift) : ''}
                                                onValueChange={(val) => setSelectedGift(JSON.parse(val))}
                                                placeholder="Выберите предмет для подарка..."
                                            />
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild><Button variant="ghost">Отмена</Button></DialogClose>
                                            <Button onClick={handleGiftAction} disabled={isLoading || !selectedGift}>
                                                {isLoading ? 'Отправка...' : 'Подарить'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                <Dialog open={isLetterDialogOpen} onOpenChange={setIsLetterDialogOpen}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                    disabled={!canSendLetter || isLoading}
                                                >
                                                    <Mail className="w-4 h-4" />
                                                </Button>
                                            </DialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Отправить письмо (+10)</p>
                                            {!canSendLetter && <p className="text-xs text-muted-foreground">{letterTimeLeft}</p>}
                                        </TooltipContent>
                                    </Tooltip>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Написать письмо</DialogTitle>
                                            <DialogDescription>
                                                Напишите письмо для {targetCharacter.name} от имени {sourceCharacter?.name}.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
                                            <Textarea
                                                value={letterContent}
                                                onChange={(e) => setLetterContent(e.target.value)}
                                                placeholder="Ваше письмо..."
                                                rows={10}
                                            />
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild><Button variant="ghost">Отмена</Button></DialogClose>
                                            <Button onClick={handleLetterAction} disabled={isLoading || !letterContent.trim()}>
                                                {isLoading ? 'Отправка...' : 'Отправить письмо'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </TooltipProvider>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
