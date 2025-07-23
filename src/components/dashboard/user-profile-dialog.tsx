"use client";

import React from 'react';
import type { User, UserStatus, PointLog, Character } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Anchor, Sparkles, Star } from 'lucide-react';
import { cn, formatTimeLeft } from '@/lib/utils';
import FamiliarCardDisplay from './familiar-card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { DialogHeader, DialogTitle } from '../ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const CharacterDisplay = ({ character }: { character: Character }) => {
    const familiarCards = character.familiarCards || [];
    const isBlessed = character.blessingExpires && new Date(character.blessingExpires) > new Date();

    return (
        <TooltipProvider>
            <AccordionItem value={character.id} className="border-b">
                <AccordionTrigger className="hover:no-underline">
                     <div className="text-left flex items-center gap-2">
                        <p className="font-bold text-base">{character.name}</p>
                        {isBlessed && (
                           <Tooltip>
                                <TooltipTrigger asChild><Sparkles className="h-4 w-4 text-yellow-500" /></TooltipTrigger>
                                <TooltipContent><p>{formatTimeLeft(character.blessingExpires)}. Повышен шанс гачи.</p></TooltipContent>
                           </Tooltip>
                        )}
                        {character.hasLeviathanFriendship && (
                             <Tooltip>
                                <TooltipTrigger asChild><Anchor className="h-4 w-4 text-blue-500" /></TooltipTrigger>
                                <TooltipContent><p>Дружба с Левиафаном</p></TooltipContent>
                           </Tooltip>
                        )}
                        <p className="text-sm text-muted-foreground ml-2 truncate">({character.activity})</p>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="text-sm space-y-1 pl-2 pb-2">
                        <p><span className="font-semibold">Навык:</span> {character.skillLevel}</p>
                        <p><span className="font-semibold">Известность:</span> {character.currentFameLevel}</p>
                        {character.workLocation && <p><span className="font-semibold">Место работы:</span> {character.workLocation}</p>}
                    </div>

                    <Accordion type="single" collapsible className="w-full mt-2">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="text-sm">Показать фамильяров ({familiarCards.length})</AccordionTrigger>
                            <AccordionContent>
                                {familiarCards.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {familiarCards.map(card => (
                                            <FamiliarCardDisplay key={card.id} cardId={card.id} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">У этого персонажа нет фамильяров.</p>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </AccordionContent>
            </AccordionItem>
        </TooltipProvider>
    );
};

export default function UserProfileDialog({ user }: { user: User }) {
  if (!user) return null;

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

  return (
    <>
    <DialogHeader>
        <DialogTitle className="text-2xl">Профиль игрока: {user.name}</DialogTitle>
    </DialogHeader>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
      <div className="md:col-span-1 space-y-6">
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
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Роль</span>
              <Badge variant="outline">{user.role}</Badge>
            </div>
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
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>История баллов</CardTitle>
            <CardDescription>Журнал заработанных и потраченных баллов.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[60vh] overflow-y-auto">
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
      </div>
    </div>
    </>
  );
}
