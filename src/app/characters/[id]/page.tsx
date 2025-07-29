
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { User, Character, FamiliarCard, FamiliarRank, Moodlet, Relationship, RelationshipType, WealthLevel, BankAccount, Accomplishment, BankTransaction, OwnedFamiliarCard, InventoryCategory, InventoryItem, CitizenshipStatus, TaxpayerStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FAMILIARS_BY_ID, MOODLETS_DATA, TRAINING_OPTIONS, CRIME_LEVELS, INVENTORY_CATEGORIES } from '@/lib/data';
import FamiliarCardDisplay from '@/components/dashboard/familiar-card';
import { ArrowLeft, BookOpen, Edit, Heart, PersonStanding, RussianRuble, Shield, Swords, Warehouse, Gem, BrainCircuit, ShieldAlert, Star, Dices, Home, CarFront, Sparkles, Anchor, KeyRound, Users, HeartHandshake, Wallet, Coins, Award, Zap, ShieldOff, History, Info, PlusCircle, BookUser, Gavel, Group, Building, Package, LandPlot, ShieldCheck, FileQuestion, BadgeCheck, BadgeAlert, Landmark } from 'lucide-react';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import CharacterForm, { type EditableSection, type EditingState } from '@/components/dashboard/character-form';
import { useToast } from '@/hooks/use-toast';
import { cn, formatTimeLeft, calculateAge, calculateRelationshipLevel, formatCurrency } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import * as LucideIcons from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import RelationshipActions from '@/components/dashboard/relationship-actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';


const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    const IconComponent = (LucideIcons as any)[name] as React.ComponentType<{ className?: string }>;
    
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

const citizenshipIcons: Record<CitizenshipStatus, React.ElementType> = {
    'citizen': ShieldCheck,
    'non-citizen': ShieldAlert,
    'refugee': FileQuestion,
};

const citizenshipLabels: Record<CitizenshipStatus, string> = {
    'citizen': 'Гражданин',
    'non-citizen': 'Не гражданин',
    'refugee': 'Беженец',
}

const taxpayerIcons: Record<TaxpayerStatus, React.ElementType> = {
    'taxable': BadgeCheck,
    'exempt': BadgeAlert,
};
const taxpayerLabels: Record<TaxpayerStatus, string> = {
    'taxable': 'Облагается налогами',
    'exempt': 'Освобожден от налогов',
}

const inventoryLayout: {
    title: string;
    icon: React.ElementType;
    categories: { key: keyof Character['inventory']; label: string; icon: React.ElementType }[];
}[] = [
    {
        title: 'Инвентарь',
        icon: Package,
        categories: [
            { key: 'оружие', label: 'Оружие', icon: Swords },
            { key: 'артефакты', label: 'Артефакты', icon: Gem },
            { key: 'зелья', label: 'Зелья/лекарства', icon: BrainCircuit },
            { key: 'гардероб', label: 'Гардероб', icon: RussianRuble },
            { key: 'драгоценности', label: 'Драгоценности', icon: Sparkles },
            { key: 'книгиИСвитки', label: 'Книги и свитки', icon: BookOpen },
            { key: 'еда', label: 'Еда', icon: Star },
            { key: 'прочее', label: 'Прочее', icon: Dices },
        ]
    },
    {
        title: 'Имущество',
        icon: LandPlot,
        categories: [
            { key: 'предприятия', label: 'Предприятия', icon: Building },
            { key: 'недвижимость', label: 'Недвижимость', icon: Home },
            { key: 'души', label: 'Души (рабочая сила)', icon: Users },
            { key: 'мебель', label: 'Мебель', icon: CarFront },
            { key: 'транспорт', label: 'Транспорт', icon: CarFront },
        ]
    }
];

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
    const { currentUser, updateCharacterInUser, gameDate, consumeInventoryItem, setCurrentUser, fetchCharacterAndOwner, fetchUsersForAdmin, fetchCharacterById } = useUser();
    const [character, setCharacter] = useState<Character | null>(null);
    const [owner, setOwner] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [editingState, setEditingState] = useState<EditingState | null>(null);
    const [selectedItem, setSelectedItem] = useState<(InventoryItem & { category: InventoryCategory }) | null>(null);
    const [isConsuming, setIsConsuming] = useState(false);

    const { toast } = useToast();

    const charId = Array.isArray(id) ? id[0] : id;

    const { data: characterData, isLoading } = useQuery({
        queryKey: ['character', charId],
        queryFn: () => charId ? fetchCharacterById(charId) : Promise.resolve(null),
        enabled: !!charId,
    });
    
    useEffect(() => {
        if (characterData) {
            setCharacter(characterData.character);
            setOwner(characterData.owner);
        }
    }, [characterData]);
    
     useEffect(() => {
        // Fetch all users only when needed for forms
        if (editingState) {
            fetchUsersForAdmin().then(setAllUsers);
        }
    }, [editingState, fetchUsersForAdmin]);

    const { data: allShops = [] } = useQuery({
        queryKey: ['allShops'],
        queryFn: useUser().fetchAllShops
    });

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
    
    const handleConsumeItem = async () => {
        if (!selectedItem || !character || !owner) return;
        setIsConsuming(true);
        try {
            await consumeInventoryItem(owner.id, character.id, selectedItem.id, selectedItem.category);
            toast({ title: "Предмет использован", description: `"${selectedItem.name}" был удален из инвентаря.` });
            
            // Optimistic UI update
            const updatedCharacter = { ...character };
            const inventory = { ...updatedCharacter.inventory };
            const categoryItems = [...(inventory[selectedItem.category] || [])];
            const itemIndex = categoryItems.findIndex(i => i.id === selectedItem.id);

            if (itemIndex > -1) {
                if (categoryItems[itemIndex].quantity > 1) {
                    categoryItems[itemIndex] = { ...categoryItems[itemIndex], quantity: categoryItems[itemIndex].quantity - 1 };
                } else {
                    categoryItems.splice(itemIndex, 1);
                }
                inventory[selectedItem.category] = categoryItems;
                updatedCharacter.inventory = inventory;
                setCharacter(updatedCharacter);
                
                // Update owner user in state for consistency if needed
                 if (currentUser?.id === owner.id) {
                    const updatedCurrentUser = { ...currentUser };
                    const charIndex = updatedCurrentUser.characters.findIndex(c => c.id === character.id);
                    if (charIndex > -1) {
                        updatedCurrentUser.characters[charIndex] = updatedCharacter;
                        setCurrentUser(updatedCurrentUser);
                    }
                }
            }
            setSelectedItem(null);
        } catch (e) {
            const message = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
            toast({ variant: 'destructive', title: "Ошибка", description: message });
        } finally {
            setIsConsuming(false);
        }
    };


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

    const ownedShops = useMemo(() => {
        if (!character) return [];
        return allShops.filter(shop => shop.ownerCharacterId === character.id);
    }, [character, allShops]);

    const formattedCurrency = useMemo(() => {
        if (!character || !character.bankAccount) return [];
        const result = formatCurrency(character.bankAccount, true);
        return Array.isArray(result) ? result : [];
    }, [character]);
    
    const sortedBankHistory = useMemo(() => {
        if (!character || !character.bankAccount?.history) return [];
        return [...character.bankAccount.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [character]);

    const crimeLevelInfo = useMemo(() => {
        if (!character?.crimeLevel) return null;
        return CRIME_LEVELS.find(cl => cl.level === character.crimeLevel);
    }, [character]);

    const citizenshipStatus = character?.citizenshipStatus || 'non-citizen';
    const CitizenshipIcon = citizenshipIcons[citizenshipStatus];
    const taxpayerStatus = character?.taxpayerStatus || 'taxable';
    const TaxpayerIcon = taxpayerIcons[taxpayerStatus];


    if (isLoading) {
        return <div className="container mx-auto p-4 md:p-8"><p>Загрузка данных персонажа...</p></div>;
    }

    if (!character || !owner) {
        return notFound();
    }

    const isOwnerOrAdmin = currentUser?.id === owner.id || currentUser?.role === 'admin';
    const inventory = character.inventory;
    
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
    
    const backLink = currentUser?.id === owner.id ? '/' : `/users/${owner.id}`;
    const backLinkText = currentUser?.id === owner.id ? 'Вернуться в профиль' : 'Вернуться в профиль игрока';

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
    
     const InfoRow = ({ label, value, field, section, isVisible = true, icon }: { label: string, value: React.ReactNode, field: keyof Character, section: EditableSection | 'mainInfo', isVisible?: boolean, icon?: React.ReactNode }) => {
        if (!isVisible && !isOwnerOrAdmin) return null;
        const isEmpty = !value;
        return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 group items-start">
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

    const getItemActionProps = (category: InventoryCategory) => {
        if (category === 'еда') {
            return { text: 'Съесть', variant: 'default' as const };
        }
        if (category === 'зелья') {
            return { text: 'Использовать', variant: 'secondary' as const };
        }
        return { text: 'Удалить', variant: 'destructive' as const };
    };


    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <Link href={backLink} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="w-4 h-4" />
                {backLinkText}
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
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main Content Column (Left on Large Screens) */}
                    <div className="w-full lg:w-2/3 space-y-6 order-2 lg:order-1">
                        <Card>
                            <SectionHeader title="Внешность" icon={<PersonStanding />} section="appearance" />
                            <CardContent>
                                <div className={cn("grid grid-cols-1 gap-6", character.appearanceImage && "md:grid-cols-3")}>
                                    {character.appearanceImage && (
                                        <div className="md:col-span-1">
                                            <div className="relative aspect-[2/3] w-full">
                                                <Image
                                                    src={character.appearanceImage}
                                                    alt={`Внешность ${character.name}`}
                                                    fill
                                                    style={{objectFit: "contain"}}
                                                    className="rounded-lg"
                                                    data-ai-hint="character portrait"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className={cn(character.appearanceImage ? "md:col-span-2" : "md:col-span-3")}>
                                        <ScrollArea className="h-96 w-full">
                                            <p className="whitespace-pre-wrap pr-4">{character.appearance || 'Описание отсутствует.'}</p>
                                        </ScrollArea>
                                    </div>
                                </div>
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
                                    title="Судимости"
                                    section="criminalRecords"
                                    isVisible={!!character.criminalRecords || isOwnerOrAdmin}
                                    isEmpty={!character.criminalRecords}
                                    content={<p className="whitespace-pre-wrap text-sm pt-2">{character.criminalRecords}</p>}
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
                    {/* Sidebar Column (Right on Large Screens) */}
                    <div className="w-full lg:w-1/3 flex flex-col space-y-6 order-1 lg:order-2">
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
                                        <span className="flex items-center gap-1.5 flex-wrap">
                                            <span>{character.birthDate || ''}</span>
                                            {age !== null && <span className="text-muted-foreground">({age} лет)</span>}
                                        </span>
                                    }
                                    field="birthDate"
                                    section="mainInfo"
                                />
                                <InfoRow 
                                    label="Страна проживания"
                                    value={
                                        <span className="flex items-center gap-1.5">
                                            <span>{character.countryOfResidence}</span>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild><CitizenshipIcon className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                                                    <TooltipContent><p>{citizenshipLabels[citizenshipStatus]}</p></TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </span>
                                    } 
                                    field="countryOfResidence" 
                                    section="mainInfo" 
                                    isVisible={!!character.countryOfResidence || isOwnerOrAdmin} 
                                    icon={<Landmark className="w-4 h-4" />}
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
                                <InfoRow label="Фракции/гильдии" value={character.factions} field="factions" section="mainInfo" isVisible={!!character.factions || isOwnerOrAdmin} icon={<Group className="w-4 h-4" />} />
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
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild><TaxpayerIcon className="w-5 h-5 text-muted-foreground" /></TooltipTrigger>
                                            <TooltipContent><p>{taxpayerLabels[taxpayerStatus]}</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
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
                        
                        {inventoryLayout.map(section => {
                            const hasContent = section.categories.some(cat => {
                                if (cat.key === 'предприятия') return ownedShops.length > 0;
                                const items = inventory[cat.key as keyof typeof inventory] as InventoryItem[];
                                return items && items.length > 0;
                            }) || (section.title === 'Инвентарь' && inventory.familiarCards?.length > 0);

                            if (!hasContent) return null;

                            return (
                                <Card key={section.title}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <section.icon className="w-5 h-5" /> {section.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Accordion type="multiple" className="w-full">
                                            {section.title === 'Инвентарь' && inventory.familiarCards?.length > 0 && (
                                                <AccordionItem value="familiars">
                                                    <AccordionTrigger><ShieldAlert className="mr-2 w-4 h-4" />Фамильяры ({inventory.familiarCards.length})</AccordionTrigger>
                                                    <AccordionContent>
                                                        <FamiliarsSection character={character} />
                                                    </AccordionContent>
                                                </AccordionItem>
                                            )}
                                            {ownedShops.length > 0 && section.categories.some(c => c.key === 'предприятия') && (
                                                <AccordionItem value="businesses">
                                                    <AccordionTrigger><Building className="mr-2 w-4 h-4" />Предприятия ({ownedShops.length})</AccordionTrigger>
                                                    <AccordionContent>
                                                        <ul className="space-y-1 text-sm pt-2">
                                                            {ownedShops.map(shop => (
                                                                <li key={shop.id}>
                                                                    <Link href={`/market/${shop.id}`} className="hover:underline">{shop.title}</Link>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            )}
                                            {section.categories.map(cat => {
                                                if (cat.key === 'предприятия') return null;
                                                const items = (inventory[cat.key as keyof typeof inventory] || []) as InventoryItem[];
                                                if (items.length === 0) return null;
                                                return (
                                                    <AccordionItem key={cat.key} value={cat.key}>
                                                        <AccordionTrigger>
                                                            <cat.icon className="mr-2 w-4 h-4" />{cat.label} ({items.length})
                                                        </AccordionTrigger>
                                                        <AccordionContent>
                                                            <ul className="space-y-1 text-sm pt-2">
                                                                {items.map(item => (
                                                                    <li key={item.id}>
                                                                        <button className="text-left hover:underline" onClick={() => setSelectedItem({ ...item, category: cat.key as InventoryCategory })}>
                                                                            {item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                );
                                            })}
                                        </Accordion>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
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
            
            <Dialog open={!!selectedItem} onOpenChange={(isOpen) => !isOpen && setSelectedItem(null)}>
                {selectedItem && (
                    <DialogContent className="max-w-xl">
                        <div className="grid md:grid-cols-2 gap-6 items-start">
                            {selectedItem.image && (
                                <div className="relative w-full h-80 bg-muted rounded-md overflow-hidden">
                                    <Image src={selectedItem.image} alt={selectedItem.name} fill style={{objectFit: "contain"}} />
                                </div>
                            )}
                            <div className={cn("flex flex-col h-full", !selectedItem.image && "md:col-span-2")}>
                                <DialogHeader className="flex-grow">
                                    <DialogTitle>{selectedItem.name}</DialogTitle>
                                    <ScrollArea className="h-64 pr-4 mt-2">
                                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {selectedItem.description || 'Описание отсутствует.'}
                                        </div>
                                    </ScrollArea>
                                </DialogHeader>
                                {isOwnerOrAdmin && (
                                    <DialogFooter className="mt-4">
                                        <Button 
                                            onClick={handleConsumeItem} 
                                            disabled={isConsuming}
                                            variant={getItemActionProps(selectedItem.category).variant}
                                            className="w-full"
                                        >
                                            {isConsuming ? 'Обработка...' : getItemActionProps(selectedItem.category).text}
                                        </Button>
                                    </DialogFooter>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                )}
            </Dialog>


        </div>
    );
}
