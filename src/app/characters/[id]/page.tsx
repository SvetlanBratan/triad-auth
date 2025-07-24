
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { User, Character, FamiliarCard, FamiliarRank, Moodlet, Relationship, RelationshipType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FAMILIARS_BY_ID, MOODLETS_DATA, TRAINING_OPTIONS } from '@/lib/data';
import FamiliarCardDisplay from '@/components/dashboard/familiar-card';
import { ArrowLeft, BookOpen, Edit, Heart, PersonStanding, RussianRuble, Shield, Swords, Warehouse, Gem, BrainCircuit, ShieldAlert, Star, Dices, Home, CarFront, Sparkles, Anchor, KeyRound, Users, HeartHandshake } from 'lucide-react';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CharacterForm from '@/components/dashboard/character-form';
import { useToast } from '@/hooks/use-toast';
import { cn, formatTimeLeft, calculateAge, calculateRelationshipLevel } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import * as LucideIcons from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import RelationshipActions from '@/components/dashboard/relationship-actions';


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

const FamiliarsSection = ({ character }: { character: Character }) => {
    const familiarCards = character.inventory?.familiarCards || [];

    const groupedFamiliars = familiarCards.reduce((acc, ownedCard) => {
        const cardDetails = FAMILIARS_BY_ID[ownedCard.id];
        if (cardDetails) {
            const rank = cardDetails.rank;
            if (!acc[rank]) {
                acc[rank] = [];
            }
            acc[rank].push(cardDetails);
        }
        return acc;
    }, {} as Record<FamiliarRank, FamiliarCard[]>);

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
                                            <FamiliarCardDisplay key={card.id} cardId={card.id} />
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
    const [isFormOpen, setIsFormOpen] = useState(false);
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
                    // If the currently viewed character belongs to the current user,
                    // we might need to update the currentUser's context as well
                    // to ensure relationship data is in sync.
                     if (currentUser && user.id === currentUser.id) {
                        const charInContext = currentUser.characters.find(c => c.id === id);
                        // Deep comparison is tricky, so we do a simpler check.
                        // A more robust way might be needed if there are frequent sync issues.
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
    }, [id, fetchUsersForAdmin, currentUser, setCurrentUser]); 

    const handleFormSubmit = (characterData: Character) => {
        if (!owner) return;
        updateCharacterInUser(owner.id, characterData);
        setCharacter(characterData); // Optimistic update
        toast({ title: "Анкета обновлена", description: "Данные персонажа успешно сохранены." });
        setIsFormOpen(false);
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

    if (isLoading) {
        return <div className="container mx-auto p-4 md:p-8"><p>Загрузка данных персонажа...</p></div>;
    }

    if (!character || !owner) {
        return notFound();
    }

    const canEdit = currentUser?.id === owner.id || currentUser?.role === 'admin';
    const inventory = character.inventory || { оружие: [], гардероб: [], еда: [], подарки: [], артефакты: [], зелья: [], недвижимость: [], транспорт: [], familiarCards: [] };

    const fameLevelText = Array.isArray(character.currentFameLevel)
        ? character.currentFameLevel.join(', ')
        : character.currentFameLevel;

    const skillLevelText = Array.isArray(character.skillLevel)
        ? character.skillLevel.join(', ')
        : character.skillLevel;
    
    const trainingValues = Array.isArray(character.training) ? character.training : [];
    const uniqueTrainingValues = [...new Set(trainingValues)];
    const trainingLabels = uniqueTrainingValues.map(value => {
        const option = TRAINING_OPTIONS.find(opt => opt.value === value);
        return option ? option.label : value;
    });
    
    const isBlessed = character.blessingExpires && new Date(character.blessingExpires) > new Date();
    const activeMoodlets = (character.moodlets || []).filter(m => new Date(m.expiresAt) > new Date());
    const age = gameDate ? calculateAge(character.birthDate, gameDate) : null;
    const isViewingOwnProfile = currentUser?.id === owner.id;


    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="w-4 h-4" />
                Вернуться в профиль
            </Link>

            <header className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
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
                {canEdit && <Button onClick={() => setIsFormOpen(true)} className="mt-2 md:mt-0"><Edit className="mr-2"/>Редактировать анкету</Button>}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><PersonStanding /> Внешность</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-40 w-full">
                                <p className="whitespace-pre-wrap pr-4">{character.appearance || 'Описание отсутствует.'}</p>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Heart /> Характер</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-40 w-full">
                                <p className="whitespace-pre-wrap pr-4">{character.personality || 'Описание отсутствует.'}</p>
                             </ScrollArea>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BookOpen /> Биография</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-64 w-full">
                                <p className="whitespace-pre-wrap pr-4">{character.biography || 'Описание отсутствует.'}</p>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><HeartHandshake /> Отношения</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(character.relationships && character.relationships.length > 0) ? (
                                <div className="space-y-4">
                                    {character.relationships.map(rel => {
                                        const { level, progressToNextLevel, maxPointsForCurrentLevel } = calculateRelationshipLevel(rel.points);
                                        const pointsInCurrentLevel = rel.points - (level * 100);
                                        return (
                                        <div key={rel.targetCharacterId}>
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
                            <CardTitle>Основная информация</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Раса:</span> <span className="text-right">{character.race || 'N/A'}</span></div>
                             <div className="flex justify-between">
                                <span>Дата рождения:</span> 
                                <span className="text-right">
                                    {character.birthDate || 'N/A'}
                                    {age !== null && <span className="text-muted-foreground ml-1">({age} лет)</span>}
                                </span>
                            </div>
                            <div className="flex justify-between"><span>Известность:</span> <Badge variant="secondary">{fameLevelText || 'N/A'}</Badge></div>
                             <div className="flex justify-between items-start">
                                <span>Уровень навыка:</span> 
                                <div className="text-right">
                                    <Badge variant="secondary">{skillLevelText || 'N/A'}</Badge>
                                    {character.skillDescription && <p className="text-muted-foreground text-xs mt-1">{character.skillDescription}</p>}
                                </div>
                            </div>
                             {character.workLocation && <div className="flex justify-between"><span>Место работы:</span> <span className="text-right">{character.workLocation}</span></div>}
                             {character.abilities && <div className="flex justify-between"><span>Способности:</span> <span className="text-right">{character.abilities}</span></div>}
                             {character.weaknesses && <div className="flex justify-between"><span>Слабости:</span> <span className="text-right">{character.weaknesses}</span></div>}
                        </CardContent>
                    </Card>
                    
                    {!isViewingOwnProfile && currentUser && <RelationshipActions targetCharacter={character} />}

                    {spouses.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Users /> Семейное положение</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1">
                                    <span className="text-sm">В браке с:</span>
                                    {spouses.map(spouse => (
                                        <Link key={spouse.id} href={`/characters/${spouse.id}`} className="block text-sm font-semibold text-primary hover:underline">
                                            {spouse.name}
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}


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
                            <CardTitle>Дополнительно</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Accordion type="multiple" className="w-full">
                                <AccordionItem value="training">
                                    <AccordionTrigger>Обучение</AccordionTrigger>
                                    <AccordionContent>
                                         {trainingLabels.length > 0 ? (
                                            <ul className="list-disc pl-5 space-y-1">
                                                {trainingLabels.map((label, index) => <li key={`${label}-${index}`}>{label}</li>)}
                                            </ul>
                                        ) : (
                                            <p className="whitespace-pre-wrap">Описание отсутствует.</p>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                                {character.lifeGoal && (
                                 <AccordionItem value="lifeGoal">
                                    <AccordionTrigger>Жизненная цель</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="whitespace-pre-wrap">{character.lifeGoal}</p>
                                    </AccordionContent>
                                </AccordionItem>
                                )}
                                {character.pets && (
                                 <AccordionItem value="pets">
                                    <AccordionTrigger>Питомцы</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="whitespace-pre-wrap">{character.pets}</p>
                                    </AccordionContent>
                                </AccordionItem>
                                )}
                                {character.diary && (
                                 <AccordionItem value="diary">
                                    <AccordionTrigger>Личный дневник</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="whitespace-pre-wrap">{character.diary}</p>
                                    </AccordionContent>
                                </AccordionItem>
                                )}
                             </Accordion>
                        </CardContent>
                    </Card>

                </div>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Редактировать анкету: {character.name}</DialogTitle>
                        <DialogDescription>
                            Внесите изменения в анкету персонажа. Все изменения сохраняются автоматически.
                        </DialogDescription>
                    </DialogHeader>
                    <CharacterForm
                        character={character}
                        allUsers={allUsers}
                        onSubmit={handleFormSubmit}
                        closeDialog={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>

        </div>
    );
}
