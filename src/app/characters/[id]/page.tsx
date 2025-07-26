
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { User, Character, FamiliarCard, FamiliarRank, Moodlet, Relationship, RelationshipType, WealthLevel, BankAccount, Accomplishment, BankTransaction, OwnedFamiliarCard } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FAMILIARS_BY_ID, MOODLETS_DATA, TRAINING_OPTIONS, CRIME_LEVELS } from '@/lib/data';
import FamiliarCardDisplay from '@/components/dashboard/familiar-card';
import { ArrowLeft, BookOpen, Edit, Heart, PersonStanding, RussianRuble, Shield, Swords, Warehouse, Gem, BrainCircuit, ShieldAlert, Star, Dices, Home, CarFront, Sparkles, Anchor, KeyRound, Users, HeartHandshake, Wallet, Coins, Award, Zap, ShieldOff, History, Info, PlusCircle, BookUser } from 'lucide-react';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import CharacterForm, { type EditableSection, type EditingState } from '@/components/dashboard/character-form';
import { useToast } from '@/hooks/use-toast';
import { cn, formatTimeLeft, calculateAge, calculateRelationshipLevel, formatCurrency } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import * as LucideIcons from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import RelationshipActions from '@/components/dashboard/relationship-actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


type IconName = keyof typeof LucideIcons;

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
    const IconComponent = LucideIcons[name as IconName];

    if (!IconComponent) {
        return <Star className={className} />;
    }

    return <IconComponent className={className} />;
};


const rankOrder: FamiliarRank[] = ['мифический', 'ивентовый', 'легендарный', 'редкий', 'обычный'];
const rankNames: Record<FamiliarRank, string> = {
    'мифический': 'Мифические',
    'ивентовый': 'Ивентовые',
    'легендарный': 'Легендарные',
    'редкий': 'Редкие',
    'обычный': 'Обычные'
};

const relationshipColors: Record<RelationshipType, string> = {
    'романтика': 'bg-pink-500',
    'дружба': 'bg-green-500',
    'вражда': 'bg-red-500',
    'конкуренция': 'bg-yellow-500',
    'нейтралитет': 'bg-gray-500',
    'любовь': 'bg-red-700',
    'семья': 'bg-blue-700',
};
const relationshipLabels: Record<RelationshipType, string> = {
    'романтика': 'Романтика',
    'дружба': 'Дружба',
    'вражда': 'Вражда',
    'конкуренция': 'Конкуренция',
    'нейтралитет': 'Нейтралитет',
    'любовь': 'Любовь',
    'семья': 'Семья',
}

const currencyNames: Record<string, string> = {
    platinum: 'платины',
    gold: 'золота',
    silver: 'серебра',
    copper: 'меди'
};

const FamiliarsSection = ({ character }: { character: Character }) => {
    const familiarCards = character.inventory?.familiarCards || [];

    const groupedFamiliars = familiarCards.reduce((acc, ownedCard, index) => {
        const cardDetails = FAMILIARS_BY_ID[ownedCard.id];
        if (cardDetails) {
            const rank = cardDetails.rank;
            if (!acc[rank]) {
                acc[rank] = [];
            }
            acc[rank].push({ ...cardDetails, uniqueKey: `${cardDetails.id}-${index}` });
        }
        return acc;
    }, {} as Record<FamiliarRank, (FamiliarCard & { uniqueKey: string })[]>);


    return (
        <div className="pt-2">
            {familiarCards.length > 0 ? (
                <div className="space-y-4">
                    {rankOrder.map(rank => {
                        if (groupedFamiliars[rank] && groupedFamiliars[rank].length > 0) {
                            return (
                                <div key={rank}>
                                    <h4 className="font-semibold capitalize text-muted-foreground mb-2">{rankNames[rank]}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {groupedFamiliars[rank].map(card => (
                                            <FamiliarCardDisplay key={card.uniqueKey} cardId={card.id} />
                                        ))}
                                    </div>
                                </div>
                            )
                        }
                        return null;
                    })}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">У этого персонажа нет фамильяров.</p>
            )}
        </div>
    );
};


export default function CharacterPage() {
    const { id } = useParams();
    const { currentUser, fetchUsersForAdmin, updateCharacterInUser, gameDate, setCurrentUser } = useUser();
    const [character, setCharacter] = useState<Character | null>(null);
    const [owner, setOwner] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingState, setEditingState] = useState<EditingState | null>(null);

    const { toast } = useToast();

    useEffect(() => {
        const findCharacterAndUsers = async () => {
            setIsLoading(true);
            const fetchedUsers = await fetchUsersForAdmin();
            setAllUsers(fetchedUsers);
            let found = false;
            for (const user of fetchedUsers) {
                const foundChar = user.characters.find(c => c.id === id);
                if (foundChar) {
                    setCharacter(foundChar);
                    setOwner(user);
                    found = true;
                     if (currentUser && user.id === currentUser.id) {
                        const charInContext = currentUser.characters.find(c => c.id === id);
                        if (JSON.stringify(charInContext) !== JSON.stringify(foundChar)) {
                           setCurrentUser({ ...currentUser, characters: currentUser.characters.map(c => c.id === id ? foundChar : c) });
                        }
                    }
                    break;
                }
            }
            setIsLoading(false);
        };

        if(id) {
          findCharacterAndUsers();
        }
    }, [id, fetchUsersForAdmin, setCurrentUser, gameDate]); 

    const handleFormSubmit = (characterData: Character) => {
        if (!owner) return;
        updateCharacterInUser(owner.id, characterData);
        setCharacter(characterData); // Optimistic update
        toast({ title: "Анкета обновлена", description: "Данные персонажа успешно сохранены." });
        setEditingState(null);
    };
    
    const closeDialog = () => {
        setEditingState(null);
    }

    const spouses = useMemo(() => {
        if (!character?.marriedTo || allUsers.length === 0) return [];
        const spouseChars: {id: string, name: string}[] = [];
        for (const spouseId of character.marriedTo) {
            for (const user of allUsers) {
                const foundSpouse = user.characters.find(c => c.id === spouseId);
                if (foundSpouse) {
                    spouseChars.push({ id: foundSpouse.id, name: foundSpouse.name });
                    break;
                }
            }
        }
        return spouseChars;
    }, [character, allUsers]);

    const formattedCurrency = useMemo(() => {
        if (!character || !character.bankAccount) return [];
        const result = formatCurrency(character.bankAccount, true);
        return typeof result === 'string' ? [[result, '']] : result;
    }, [character]);
    
    const sortedBankHistory = useMemo(() => {
        if (!character || !character.bankAccount?.history) return [];
        return [...character.bankAccount.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [character]);

    const crimeLevelInfo = useMemo(() => {
        if (!character?.crimeLevel) return null;
        return CRIME_LEVELS.find(cl => cl.level === character.crimeLevel);
    }, [character]);


    if (isLoading) {
        return <div className="container mx-auto p-4 md:p-8"><p>Загрузка данных персонажа...</p></div>;
    }

    if (!character || !owner) {
        return notFound();
    }

    const isOwnerOrAdmin = currentUser?.id === owner.id || currentUser?.role === 'admin';
    const inventory = character.inventory || { оружие: [], гардероб: [], еда: [], подарки: [], артефакты: [], зелья: [], недвижимость: [], транспорт: [], familiarCards: [] };
    
    const trainingValues = Array.isArray(character.training) ? character.training : [];
    const uniqueTrainingValues = [...new Set(trainingValues)];
    const trainingLabels = uniqueTrainingValues.map(value => {
        const option = TRAINING_OPTIONS.find(opt => opt.value === value);
        return option ? option.label : value;
    });
    
    const isBlessed = character.blessingExpires && new Date(character.blessingExpires) > new Date();
    const activeMoodlets = (character.moodlets || []).filter(m => new Date(m.expiresAt) > new Date());
    const age = gameDate ? calculateAge(character.birthDate, gameDate) : null;
    const canViewHistory = isOwnerOrAdmin;
    const accomplishments = character.accomplishments || [];
    
    const SectionHeader = ({ title, icon, section }: { title: string; icon: React.ReactNode; section: EditableSection }) => (
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">{icon} {title}</CardTitle>
            {isOwnerOrAdmin && (
                <Button variant="ghost" size="icon" onClick={() => setEditingState({ type: 'section', section })} className="shrink-0 self-start sm:self-center">
                    <Edit className="w-4 h-4" />
                </Button>
            )}
        </CardHeader>
    );

    const SubSection = ({ title, content, section, isVisible, isEmpty }: { title: string; content: React.ReactNode; section: EditableSection; isVisible: boolean; isEmpty: boolean; }) => {
        if (!isVisible) return null;
        return (
             <div className="py-2">
                <div className="flex justify-between items-center mb-1">
                    <h4 className="font-semibold text-muted-foreground">{title}</h4>
                    {isOwnerOrAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => setEditingState({ type: 'section', section })} className="h-7 w-7">
                            {isEmpty ? <PlusCircle className="w-4 h-4 text-muted-foreground" /> : <Edit className="w-4 h-4" />}
                        </Button>
                    )}
                </div>
                {!isEmpty ? content : <p className="text-sm text-muted-foreground italic">Информация отсутствует.</p>}
            </div>
        );
    };
    
     const InfoRow = ({ label, value, field, section, isVisible = true, icon }: { label: string, value: React.ReactNode, field: keyof Character, section: EditableSection, isVisible?: boolean, icon?: React.ReactNode }) => {
        if (!isVisible && !isOwnerOrAdmin) return null;
        const isEmpty = !value;
        return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 group items-center">
                <span className="text-muted-foreground col-span-1 flex items-center gap-1.5">{icon}{label}:</span>
                <div className="flex items-center justify-between col-span-1 sm:col-span-2">
                    <div className="flex-1 text-left">
                        {isEmpty && isOwnerOrAdmin ? <span className="italic text-muted-foreground/80">Не указано</span> : value}
                    </div>
                    {isOwnerOrAdmin && (
                         <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={() => setEditingState({ type: 'field', section, field })}
                        >
                            {isEmpty ? <PlusCircle className="w-4 h-4 text-muted-foreground" /> : <Edit className="w-4 h-4" />}
                        </Button>
                    )}
                </div>
            </div>
        );
     };


    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="w-4 h-4" />
                Вернуться в профиль
            </Link>

            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-xl md:text-2xl font-bold font-headline text-primary">{character.name}</h1>
                        <div className="flex items-center gap-1.5">
                            {isBlessed && (
                                <Popover>
                                    <PopoverTrigger asChild><button><Sparkles className="h-5 w-5 text-yellow-500 cursor-pointer" /></button></PopoverTrigger>
                                    <PopoverContent className="w-auto text-sm"><p>{formatTimeLeft(character.blessingExpires)}. Повышен шанс в рулетке.</p></PopoverContent>
                                </Popover>
                            )}
                            {character.hasLeviathanFriendship && (
                                <Popover>
                                    <PopoverTrigger asChild><button><Anchor className="h-5 w-5 text-blue-500 cursor-pointer" /></button></PopoverTrigger>
                                    <PopoverContent className="w-auto text-sm"><p>Дружба с Левиафаном</p></PopoverContent>
                                </Popover>
                            )}
                            {character.hasCrimeConnections && (
                                <Popover>
                                    <PopoverTrigger asChild><button><KeyRound className="h-5 w-5 text-gray-500 cursor-pointer" /></button></PopoverTrigger>
                                    <PopoverContent className="w-auto text-sm"><p>Связи в преступном мире</p></PopoverContent>
                                </Popover>
                            )}
                        </div>
                    </div>
                    <p className="text-muted-foreground">{character.activity}</p>
                    <p className="text-sm text-muted-foreground">Владелец: {owner.name}</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <SectionHeader title="Внешность" icon={<PersonStanding />} section="appearance" />
                        <CardContent>
                            <ScrollArea className="h-40 w-full">
                                <p className="whitespace-pre-wrap pr-4">{character.appearance || 'Описание отсутствует.'}</p>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                     <Card>
                        <SectionHeader title="Характер" icon={<Heart />} section="personality" />
                        <CardContent>
                            <ScrollArea className="h-40 w-full">
                                <p className="whitespace-pre-wrap pr-4">{character.personality || 'Описание отсутствует.'}</p>
                             </ScrollArea>
                        </CardContent>
                    </Card>
                     <Card>
                        <SectionHeader title="Биография" icon={<BookOpen />} section="biography" />
                        <CardContent>
                            <ScrollArea className="h-64 w-full">
                                <p className="whitespace-pre-wrap pr-4">{character.biography || 'Описание отсутствует.'}</p>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                    
                    {(character.abilities || isOwnerOrAdmin) && (
                        <Card>
                             <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <CardTitle className="flex items-center gap-2"><Zap /> Способности</CardTitle>
                                {isOwnerOrAdmin && (
                                    <Button variant={character.abilities ? "ghost" : "outline-dashed"} size={character.abilities ? "icon" : "sm"} onClick={() => setEditingState({type: 'section', section: "abilities"})} className="shrink-0 self-start sm:self-auto">
                                        {character.abilities ? <Edit className="w-4 h-4" /> : <><PlusCircle className="mr-2 h-4 w-4" /> Добавить</>}
                                    </Button>
                                )}
                            </CardHeader>
                            {character.abilities && (
                                <CardContent>
                                    <ScrollArea className="h-40 w-full">
                                        <p className="whitespace-pre-wrap pr-4">{character.abilities}</p>
                                    </ScrollArea>
                                </CardContent>
                            )}
                        </Card>
                    )}
                    
                    {(character.weaknesses || isOwnerOrAdmin) && (
                         <Card>
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <CardTitle className="flex items-center gap-2"><ShieldOff /> Слабости</CardTitle>
                                {isOwnerOrAdmin && (
                                     <Button variant={character.weaknesses ? "ghost" : "outline-dashed"} size={character.weaknesses ? "icon" : "sm"} onClick={() => setEditingState({ type: 'section', section: "weaknesses"})} className="shrink-0 self-start sm:self-auto">
                                        {character.weaknesses ? <Edit className="w-4 h-4" /> : <><PlusCircle className="mr-2 h-4 w-4" /> Добавить</>}
                                    </Button>
                                )}
                            </CardHeader>
                            {character.weaknesses && (
                                <CardContent>
                                    <ScrollArea className="h-40 w-full">
                                        <p className="whitespace-pre-wrap pr-4">{character.weaknesses}</p>
                                    </ScrollArea>
                                </CardContent>
                            )}
                        </Card>
                    )}
                    
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <CardTitle className="flex items-center gap-2"><HeartHandshake /> Отношения</CardTitle>
                             {isOwnerOrAdmin && (
                                <Button variant="outline-dashed" size="sm" onClick={() => setEditingState({ type: 'relationship', mode: 'add' })} className="shrink-0 self-start sm:self-auto">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Добавить отношение
                                </Button>
                             )}
                        </CardHeader>
                        <CardContent>
                            {(character.relationships && character.relationships.length > 0) ? (
                                <div className="space-y-4">
                                    {character.relationships.map((rel, index) => {
                                        const { level, progressToNextLevel, maxPointsForCurrentLevel } = calculateRelationshipLevel(rel.points);
                                        const pointsInCurrentLevel = rel.points - (level * 100);
                                        return (
                                        <div key={rel.id || `${rel.targetCharacterId}-${rel.type}-${index}`} className="relative group">
                                            {isOwnerOrAdmin && (
                                                <Button variant="ghost" size="icon" onClick={() => setEditingState({ type: 'relationship', mode: 'edit', relationship: rel })} className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <div className="flex justify-between items-center mb-1">
                                                <Link href={`/characters/${rel.targetCharacterId}`} className="font-semibold hover:underline">{rel.targetCharacterName}</Link>
                                                <Badge variant="secondary" className={cn('capitalize', relationshipColors[rel.type], 'text-white')}>{relationshipLabels[rel.type]}</Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{pointsInCurrentLevel}/{maxPointsForCurrentLevel}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Progress value={progressToNextLevel} className={cn("w-full h-2")} indicatorClassName={relationshipColors[rel.type]}/>
                                                <span className="text-xs font-bold w-8 text-right">{level}/10</span>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">Отношений пока нет.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Info /> Основная информация</CardTitle>
                         </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <InfoRow label="Имя" value={character.name} field="name" section="mainInfo" />
                            <InfoRow label="Деятельность" value={character.activity} field="activity" section="mainInfo" />
                            <InfoRow label="Раса" value={character.race} field="race" section="mainInfo" />
                            <InfoRow
                                label="Дата рождения"
                                value={
                                    <span className="flex items-center justify-end gap-1.5 flex-wrap">
                                        <span>{character.birthDate || ''}</span>
                                        {age !== null && <span className="text-muted-foreground">({age} лет)</span>}
                                    </span>
                                }
                                field="birthDate"
                                section="mainInfo"
                            />
                             <InfoRow 
                                label="Уровень преступности" 
                                value={crimeLevelInfo ? crimeLevelInfo.title : ''} 
                                field="crimeLevel" 
                                section="mainInfo" 
                                isVisible={!!crimeLevelInfo}
                                icon={
                                    crimeLevelInfo ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild><ShieldAlert className="w-4 h-4 text-destructive" /></TooltipTrigger>
                                            <TooltipContent className="max-w-xs"><p>{crimeLevelInfo.description}</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    ) : undefined
                                }
                            />
                            <InfoRow label="Место работы" value={character.workLocation} field="workLocation" section="mainInfo" isVisible={!!character.workLocation}/>
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <CardTitle className="flex items-center gap-2"><Award /> Достижения</CardTitle>
                             {isOwnerOrAdmin && (
                                <Button variant="outline-dashed" size="sm" onClick={() => setEditingState({ type: 'accomplishment', mode: 'add' })} className="shrink-0 self-start sm:self-auto">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Добавить
                                </Button>
                             )}
                        </CardHeader>
                        <CardContent>
                            {accomplishments.length > 0 ? (
                                <div className="space-y-2">
                                    {accomplishments.map(acc => (
                                        <div key={acc.id} className="text-sm p-2 bg-muted/50 rounded-md group relative">
                                             {isOwnerOrAdmin && (
                                                <Button variant="ghost" size="icon" onClick={() => setEditingState({ type: 'accomplishment', mode: 'edit', accomplishment: acc })} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <p><span className="font-semibold">{acc.fameLevel}</span> <span className="text-primary font-semibold">{acc.skillLevel}</span></p>
                                            <p className="text-muted-foreground">{acc.description}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">Достижений пока нет.</p>
                            )}
                        </CardContent>
                    </Card>
                     {isOwnerOrAdmin && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2"><Wallet /> Финансы</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span>Уровень достатка:</span>
                                    <Badge variant="outline">{character.wealthLevel || 'Бедный'}</Badge>
                                </div>
                                <div className="flex justify-between items-start pt-2">
                                    <span>Счет в банке:</span>
                                    <div className="text-right font-medium text-primary">
                                        {formattedCurrency.length > 0 ? (
                                            formattedCurrency.map(([amount, name]) => (
                                                <div key={name} className="flex justify-end items-baseline gap-1.5">
                                                    <span>{amount}</span>
                                                    <span className="text-xs text-muted-foreground font-normal">{name}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <span>0 тыквин</span>
                                        )}
                                    </div>
                                </div>
                                {canViewHistory && sortedBankHistory.length > 0 && (
                                    <Accordion type="single" collapsible className="w-full pt-2">
                                        <AccordionItem value="history">
                                            <AccordionTrigger className="text-xs text-muted-foreground hover:no-underline">
                                            <div className="flex items-center gap-2">
                                                    <History className="w-4 h-4" />
                                                    <span>История счёта</span>
                                            </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <ScrollArea className="h-48 pr-3">
                                                    <div className="space-y-3">
                                                    {sortedBankHistory.map(tx => {
                                                        if (!tx.amount) return null;
                                                        const amounts = Object.entries(tx.amount).filter(([, val]) => val !== 0);
                                                        const isCredit = Object.values(tx.amount).some(v => v > 0);
                                                        const isDebit = Object.values(tx.amount).some(v => v < 0);
                                                        let colorClass = '';
                                                        if(isCredit && !isDebit) colorClass = 'text-green-600';
                                                        if(isDebit && !isCredit) colorClass = 'text-destructive';

                                                        return (
                                                            <div key={tx.id} className="text-xs p-2 bg-muted/50 rounded-md">
                                                                <p className="font-semibold">{tx.reason}</p>
                                                                <p className="text-muted-foreground">{new Date(tx.date).toLocaleString()}</p>
                                                                <div className={cn("font-mono font-semibold", colorClass)}>
                                                                    {amounts.map(([currency, value]) => (
                                                                        <div key={currency}>
                                                                            {value > 0 ? '+' : ''}{value.toLocaleString()} {currencyNames[currency] || currency}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                    </div>
                                                </ScrollArea>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                )}
                            </CardContent>
                        </Card>
                    )}
                    
                    {currentUser && currentUser.id !== owner.id && <RelationshipActions targetCharacter={character} />}

                    <Card>
                        <SectionHeader title="Семейное положение" icon={<Users />} section="marriage" />
                        <CardContent>
                            <div className="space-y-1">
                                <span className="text-sm">В браке с:</span>
                                {spouses.length > 0 ? spouses.map(spouse => (
                                    <Link key={spouse.id} href={`/characters/${spouse.id}`} className="block text-sm font-semibold text-primary hover:underline">
                                        {spouse.name}
                                    </Link>
                                )) : <p className="text-sm text-muted-foreground">Не в браке</p>}
                            </div>
                        </CardContent>
                    </Card>


                     {activeMoodlets.length > 0 && (
                        <Card>
                             <CardHeader>
                                <CardTitle>Активные эффекты</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {activeMoodlets.map(moodlet => (
                                    <Popover key={moodlet.id}>
                                        <PopoverTrigger asChild>
                                            <div className="flex items-center justify-between w-full cursor-pointer text-sm p-2 rounded-md hover:bg-muted">
                                                <div className="flex items-center gap-2">
                                                    <DynamicIcon name={moodlet.iconName} className="w-4 h-4" />
                                                    <span>{moodlet.name}</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">{formatTimeLeft(moodlet.expiresAt)}</span>
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto max-w-xs text-sm">
                                            <p className="font-bold">{moodlet.name}</p>
                                            <p className="text-xs mb-2">{moodlet.description}</p>
                                            {moodlet.source && <p className="text-xs mb-2">Источник: <span className="font-semibold">{moodlet.source}</span></p>}
                                            <p className="text-xs text-muted-foreground">{formatTimeLeft(moodlet.expiresAt)}</p>
                                        </PopoverContent>
                                    </Popover>
                                ))}
                            </CardContent>
                        </Card>
                     )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Warehouse /> Инвентарь</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Accordion type="multiple" className="w-full">
                                <AccordionItem value="familiars">
                                    <AccordionTrigger><ShieldAlert className="mr-2 w-4 h-4"/>Фамильяры ({inventory.familiarCards.length})</AccordionTrigger>
                                    <AccordionContent>
                                        <FamiliarsSection character={character} />
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="weapons">
                                    <AccordionTrigger><Swords className="mr-2 w-4 h-4"/>Оружие ({inventory.оружие.length})</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground text-sm">Здесь будет список оружия.</p>
                                    </AccordionContent>
                                </AccordionItem>
                                 <AccordionItem value="wardrobe">
                                    <AccordionTrigger><RussianRuble className="mr-2 w-4 h-4"/>Гардероб ({inventory.гардероб.length})</AccordionTrigger>
                                    <AccordionContent>
                                         <p className="text-muted-foreground text-sm">Здесь будет список одежды.</p>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="artifacts">
                                    <AccordionTrigger><Gem className="mr-2 w-4 h-4"/>Артефакты ({inventory.артефакты.length})</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground text-sm">Здесь будет список артефактов.</p>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="potions">
                                    <AccordionTrigger><BrainCircuit className="mr-2 w-4 h-4"/>Зелья ({inventory.зелья.length})</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground text-sm">Здесь будет список зелий.</p>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="food">
                                    <AccordionTrigger><Star className="mr-2 w-4 h-4"/>Еда ({inventory.еда.length})</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground text-sm">Здесь будет список еды.</p>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="gifts">
                                    <AccordionTrigger><Dices className="mr-2 w-4 h-4"/>Подарки ({inventory.подарки.length})</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground text-sm">Здесь будет список подарков.</p>
                                    </AccordionContent>
                                </AccordionItem>
                                {(inventory.недвижимость && inventory.недвижимость.length > 0) && (
                                <AccordionItem value="real-estate">
                                    <AccordionTrigger><Home className="mr-2 w-4 h-4"/>Недвижимость ({inventory.недвижимость.length})</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground text-sm">Здесь будет список недвижимости.</p>
                                    </AccordionContent>
                                </AccordionItem>
                                )}
                                {(inventory.транспорт && inventory.транспорт.length > 0) && (
                                <AccordionItem value="transport">
                                    <AccordionTrigger><CarFront className="mr-2 w-4 h-4"/>Транспорт ({inventory.транспорт.length})</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground text-sm">Здесь будет список транспорта.</p>
                                    </AccordionContent>
                                </AccordionItem>
                                )}
                             </Accordion>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BookUser /> Дополнительно</CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y">
                             <SubSection 
                                title="Обучение"
                                section="training"
                                isVisible={true}
                                isEmpty={!character.training || character.training.length === 0}
                                content={
                                     <ul className="list-disc pl-5 space-y-1 text-sm pt-2">
                                        {trainingLabels.map((label, index) => <li key={`${label}-${index}`}>{label}</li>)}
                                    </ul>
                                }
                            />
                            <SubSection 
                                title="Жизненная цель"
                                section="lifeGoal"
                                isVisible={!!character.lifeGoal || isOwnerOrAdmin}
                                isEmpty={!character.lifeGoal}
                                content={<p className="whitespace-pre-wrap text-sm pt-2">{character.lifeGoal}</p>}
                            />
                            <SubSection 
                                title="Питомцы"
                                section="pets"
                                isVisible={!!character.pets || isOwnerOrAdmin}
                                isEmpty={!character.pets}
                                content={<p className="whitespace-pre-wrap text-sm pt-2">{character.pets}</p>}
                            />
                             <SubSection 
                                title="Личный дневник"
                                section="diary"
                                isVisible={!!character.diary}
                                isEmpty={!character.diary}
                                content={<p className="whitespace-pre-wrap text-sm pt-2">{character.diary}</p>}
                            />
                        </CardContent>
                    </Card>

                </div>
            </div>

            <Dialog open={!!editingState} onOpenChange={(isOpen) => !isOpen && closeDialog()}>
                <DialogContent>
                    <CharacterForm
                        character={character}
                        allUsers={allUsers}
                        onSubmit={handleFormSubmit}
                        closeDialog={closeDialog}
                        editingState={editingState}
                    />
                </DialogContent>
            </Dialog>

        </div>
    );
}

    
