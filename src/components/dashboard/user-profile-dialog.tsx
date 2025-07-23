
"use client";

import React from 'react';
import type { User, UserStatus, PointLog, Character, FamiliarCard, FamiliarRank, Moodlet } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Anchor, KeyRound, Sparkles, Star, X } from 'lucide-react';
import { cn, formatTimeLeft } from '@/lib/utils';
import FamiliarCardDisplay from './familiar-card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { DialogHeader, DialogTitle } from '../ui/dialog';
import { ACHIEVEMENTS_BY_ID, FAMILIARS_BY_ID } from '@/lib/data';
import * as LucideIcons from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { useUser } from '@/hooks/use-user';

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

const CharacterDisplay = ({ character }: { character: Character }) => {
    const familiarCards = character.inventory?.familiarCards || [];
    const isBlessed = character.blessingExpires && new Date(character.blessingExpires) > new Date();
    const activeMoodlets = (character.moodlets || []).filter(m => new Date(m.expiresAt) > new Date());


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
        <AccordionItem value={character.id} className="border-b">
            <div className="flex justify-between items-center w-full hover:bg-muted/50 rounded-md">
            <AccordionTrigger className="flex-1 py-4 px-2 hover:no-underline">
                <div className="text-left flex items-start gap-2 flex-wrap">
                    <p className="font-bold text-base">{character.name}</p>
                    <p className="text-sm text-muted-foreground">({character.activity})</p>
                </div>
            </AccordionTrigger>
             <div className="flex items-center gap-1.5 pr-4">
                    {isBlessed && (
                    <Popover>
                        <PopoverTrigger asChild><button><Sparkles className="h-4 w-4 text-yellow-500 cursor-pointer" /></button></PopoverTrigger>
                        <PopoverContent className="w-auto text-sm"><p>{formatTimeLeft(character.blessingExpires)}. Повышен шанс в рулетке.</p></PopoverContent>
                    </Popover>
                    )}
                    {character.hasLeviathanFriendship && (
                        <Popover>
                            <PopoverTrigger asChild><button><Anchor className="h-4 w-4 text-blue-500 cursor-pointer" /></button></PopoverTrigger>
                            <PopoverContent className="w-auto text-sm"><p>Дружба с Левиафаном</p></PopoverContent>
                        </Popover>
                    )}
                    {character.hasCrimeConnections && (
                        <Popover>
                            <PopoverTrigger asChild><button><KeyRound className="h-4 w-4 text-gray-500 cursor-pointer" /></button></PopoverTrigger>
                            <PopoverContent className="w-auto text-sm"><p>Связи в преступном мире</p></PopoverContent>
                        </Popover>
                    )}
                </div>
            </div>
            <AccordionContent>
            <div className="text-sm space-y-1 pl-2 pb-2">
                <p><span className="font-semibold">Навык:</span> {character.skillLevel}</p>
                <p><span className="font-semibold">Известность:</span> {character.currentFameLevel}</p>
                {character.workLocation && <p><span className="font-semibold">Место работы:</span> {character.workLocation}</p>}
            </div>

            {activeMoodlets.length > 0 && (
                <div className="px-2 pb-2">
                    <h4 className="text-sm font-semibold mb-2">Мудлеты:</h4>
                    <div className="flex flex-wrap gap-2">
                        {activeMoodlets.map(moodlet => (
                            <Popover key={moodlet.id}>
                                <PopoverTrigger asChild>
                                    <Badge variant="outline" className="cursor-pointer">
                                        <DynamicIcon name={moodlet.iconName} className="w-3.5 h-3.5 mr-1.5" />
                                        {moodlet.name}
                                    </Badge>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto max-w-xs text-sm">
                                    <p className="font-bold">{moodlet.name}</p>
                                    <p className="text-xs mb-2">{moodlet.description}</p>
                                    {moodlet.source && <p className="text-xs mb-2">Источник: <span className="font-semibold">{moodlet.source}</span></p>}
                                    <p className="text-xs text-muted-foreground">{formatTimeLeft(moodlet.expiresAt)}</p>
                                </PopoverContent>
                            </Popover>
                        ))}
                    </div>
                </div>
            )}

            <Accordion type="single" collapsible className="w-full mt-2">
                <AccordionItem value="item-1">
                    <AccordionTrigger className="text-sm">Показать фамильяров ({familiarCards.length})</AccordionTrigger>
                    <AccordionContent>
                        {familiarCards.length > 0 ? (
                            <div className="space-y-4 pt-2">
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
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            </AccordionContent>
        </AccordionItem>
    );
};

export default function UserProfileDialog({ user }: { user: User }) {
  const { currentUser } = useUser();
  if (!user) return null;

  const isAdminViewer = currentUser?.role === 'admin';

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const getStatusClass = (status: UserStatus) => {
    switch (status) {
      case 'активный':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'неактивный':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'отпуск':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      default:
        return '';
    }
  };
  
  const sortedPointHistory = [...user.pointHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const userAchievements = (user.achievementIds || []).map(id => ACHIEVEMENTS_BY_ID[id]).filter(Boolean);

  return (
    <>
      <DialogHeader>
          <DialogTitle className="text-2xl pr-8">Профиль игрока: {user.name}</DialogTitle>
      </DialogHeader>

      <ScrollArea className="max-h-[80vh] w-full">
        <div className="pr-6 mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Column */}
            <div className={cn("space-y-6", !isAdminViewer && "md:col-span-2")}>
                <Card>
                    <CardHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                        <CardTitle className="text-2xl font-headline">{user.name}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                        </div>
                    </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Баллы</span>
                        <span className="font-bold text-lg text-primary flex items-center gap-1">
                        <Star className="w-4 h-4" /> {user.points.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Статус</span>
                        <Badge variant={'outline'} className={cn("capitalize", getStatusClass(user.status))}>
                        {user.status}
                        </Badge>
                    </div>
                     {isAdminViewer && (
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Роль</span>
                            <Badge variant="outline">{user.role}</Badge>
                        </div>
                    )}
                    {userAchievements.length > 0 && (
                        <div className="pt-4">
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Достижения</h4>
                                <div className="flex flex-wrap gap-2">
                                    {userAchievements.map(ach => (
                                    <Popover key={ach.id}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="icon" className="w-10 h-10 p-2 bg-muted hover:bg-primary/10">
                                                <DynamicIcon name={ach.iconName} className="w-5 h-5 text-primary" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto max-w-xs">
                                            <p className="font-bold">{ach.name}</p>
                                            <p className="text-xs">{ach.description}</p>
                                        </PopoverContent>
                                    </Popover>
                                    ))}
                                </div>
                        </div>
                    )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Персонажи</CardTitle>
                        <CardDescription>Список персонажей игрока</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {user.characters.length > 0 ? (
                            <Accordion type="single" collapsible className="w-full">
                                {user.characters.map(char => (
                                    <CharacterDisplay key={char.id} character={char} />
                                ))}
                            </Accordion>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">У этого игрока нет персонажей.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Right Column */}
            {isAdminViewer && (
                <Card>
                    <CardHeader>
                        <CardTitle>История баллов</CardTitle>
                        <CardDescription>Журнал заработанных и потраченных баллов.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Дата</TableHead>
                                <TableHead>Причина</TableHead>
                                <TableHead className="text-right">Сумма</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {sortedPointHistory.length > 0 ? sortedPointHistory.map((log: PointLog) => (
                                <TableRow key={log.id}>
                                <TableCell className="text-muted-foreground">{formatDate(log.date)}</TableCell>
                                <TableCell>
                                    <p>{log.reason}</p>
                                    {log.characterName && <p className="text-xs text-muted-foreground">Персонаж: {log.characterName}</p>}
                                </TableCell>
                                <TableCell className={`text-right font-semibold ${log.amount > 0 ? 'text-green-600' : 'text-destructive'}`}>
                                    {log.amount > 0 ? '+' : ''}{log.amount.toLocaleString()}
                                </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                    Истории баллов пока нет.
                                </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
      </ScrollArea>
    </>
  );
}
