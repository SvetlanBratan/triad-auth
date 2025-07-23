
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { User, Character, FamiliarCard, FamiliarRank } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FAMILIARS_BY_ID } from '@/lib/data';
import FamiliarCardDisplay from '@/components/dashboard/familiar-card';
import { ArrowLeft, BookOpen, Edit, Heart, PersonStanding, RussianRuble, Shield, Swords, Warehouse } from 'lucide-react';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const rankOrder: FamiliarRank[] = ['мифический', 'ивентовый', 'легендарный', 'редкий', 'обычный'];
const rankNames: Record<FamiliarRank, string> = {
    'мифический': 'Мифические',
    'ивентовый': 'Ивентовые',
    'легендарный': 'Легендарные',
    'редкий': 'Редкие',
    'обычный': 'Обычные'
};

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
    const { currentUser, fetchAllUsers } = useUser();
    const [character, setCharacter] = useState<Character | null>(null);
    const [owner, setOwner] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const findCharacter = async () => {
            setIsLoading(true);
            const allUsers = await fetchAllUsers();
            for (const user of allUsers) {
                const foundChar = user.characters.find(c => c.id === id);
                if (foundChar) {
                    setCharacter(foundChar);
                    setOwner(user);
                    break;
                }
            }
            setIsLoading(false);
        };

        findCharacter();
    }, [id, fetchAllUsers]);

    if (isLoading) {
        return <div className="container mx-auto p-8"><p>Загрузка данных персонажа...</p></div>;
    }

    if (!character || !owner) {
        return notFound();
    }

    const canEdit = currentUser?.id === owner.id || currentUser?.role === 'admin';
    const inventory = character.inventory || { оружие: [], гардероб: [], еда: [], подарки: [], familiarCards: [] };

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="w-4 h-4" />
                Вернуться в профиль
            </Link>

            <header className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary">{character.name}</h1>
                    <p className="text-muted-foreground">{character.activity}</p>
                    <p className="text-sm text-muted-foreground">Владелец: {owner.name}</p>
                </div>
                {canEdit && <Button><Edit className="mr-2"/>Редактировать анкету</Button>}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><PersonStanding /> Внешность</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap">{character.appearance || 'Описание отсутствует.'}</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Heart /> Характер</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="whitespace-pre-wrap">{character.personality || 'Описание отсутствует.'}</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BookOpen /> Биография</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap">{character.biography || 'Описание отсутствует.'}</p>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Основная информация</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Уровень навыка:</span> <Badge variant="secondary">{character.skillLevel}</Badge></div>
                            <div className="flex justify-between"><span>Известность:</span> <Badge variant="secondary">{character.currentFameLevel}</Badge></div>
                             {character.workLocation && <div className="flex justify-between"><span>Место работы:</span> <span className="text-right">{character.workLocation}</span></div>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Warehouse /> Инвентарь</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Accordion type="multiple" className="w-full">
                                <AccordionItem value="familiars">
                                    <AccordionTrigger>Фамильяры ({inventory.familiarCards.length})</AccordionTrigger>
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
                                        <p className="whitespace-pre-wrap">{character.training || 'Описание отсутствует.'}</p>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="relationships">
                                    <AccordionTrigger>Отношения</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="whitespace-pre-wrap">{character.relationships || 'Описание отсутствует.'}</p>
                                    </AccordionContent>
                                </AccordionItem>
                                 <AccordionItem value="diary">
                                    <AccordionTrigger>Личный дневник</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="whitespace-pre-wrap">{character.diary || 'Записей нет.'}</p>
                                    </AccordionContent>
                                </AccordionItem>
                             </Accordion>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
