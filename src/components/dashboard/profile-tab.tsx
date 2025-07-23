
'use client';

import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Star, Trash2, Sparkles, Anchor, KeyRound, Pencil } from 'lucide-react';
import type { PointLog, UserStatus, Character } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn, formatTimeLeft } from '@/lib/utils';
import { ACHIEVEMENTS_BY_ID } from '@/lib/data';
import FamiliarCardDisplay from './familiar-card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import * as LucideIcons from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import CharacterForm from './character-form';


type IconName = keyof typeof LucideIcons;

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
    const IconComponent = LucideIcons[name as IconName];

    if (!IconComponent) {
        return <Star className={className} />;
    }

    return <IconComponent className={className} />;
};


const CharacterDisplay = ({ character, onEdit, onDelete }: { character: Character, onEdit: (character: Character) => void, onDelete: (characterId: string) => void }) => {
    const familiarCards = character.familiarCards || [];
    const isBlessed = character.blessingExpires && new Date(character.blessingExpires) > new Date();

    return (
      <TooltipProvider>
        <AccordionItem value={character.id} className="border-b">
             <div className="flex justify-between items-center w-full hover:bg-muted/50 rounded-md">
                <AccordionTrigger className="flex-1 py-4 px-2 hover:no-underline">
                    <div className="text-left flex items-start gap-2 flex-wrap">
                        <p className="font-bold text-base">{character.name}</p>
                         <div className="flex items-center gap-1.5">
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
                            {character.hasCrimeConnections && (
                                 <Tooltip>
                                    <TooltipTrigger asChild><KeyRound className="h-4 w-4 text-gray-500" /></TooltipTrigger>
                                    <TooltipContent><p>Связи в преступном мире</p></TooltipContent>
                               </Tooltip>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">({character.activity})</p>
                    </div>
                </AccordionTrigger>
                <div className="flex items-center pr-2">
                     <Button variant="ghost" size="icon" className="shrink-0 hover:bg-muted" onClick={() => onEdit(character)}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0 hover:bg-destructive/10" onClick={(e) => e.stopPropagation()}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Это действие невозможно отменить. Это навсегда удалит вашего персонажа
                                <span className="font-bold"> {character.name} </span>
                                и все его данные, включая фамильяров.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(character.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Да, удалить
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
            <AccordionContent>
                <div className="text-sm space-y-1 pl-4 pb-2">
                    <p><span className="font-semibold">Навык:</span> {character.skillLevel}</p>
                    <p><span className="font-semibold">Известность:</span> {character.currentFameLevel}</p>
                    {character.workLocation && <p><span className="font-semibold">Место работы:</span> {character.workLocation}</p>}
                </div>

                <Accordion type="single" collapsible className="w-full mt-2 px-2">
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


export default function ProfileTab() {
  const { currentUser, addCharacterToUser, updateCharacterInUser, deleteCharacterFromUser } = useUser();
  const [isFormDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingCharacter, setEditingCharacter] = React.useState<Character | null>(null);
  const { toast } = useToast();

  if (!currentUser) return null;
  
  const handleAddClick = () => {
    setEditingCharacter(null);
    setFormDialogOpen(true);
  };

  const handleEditClick = (character: Character) => {
    setEditingCharacter(character);
    setFormDialogOpen(true);
  };

  const handleDeleteCharacter = (characterId: string) => {
    if (!currentUser) return;
    deleteCharacterFromUser(currentUser.id, characterId);
    toast({ variant: 'destructive', title: "Персонаж удален", description: "Персонаж и все его данные были удалены." });
  };

  const handleFormSubmit = (characterData: Omit<Character, 'id' | 'familiarCards'> | Character) => {
      if (!currentUser) return;

      if ('id' in characterData) {
        // Editing existing character
        updateCharacterInUser(currentUser.id, characterData);
        toast({ title: "Успешно", description: "Данные персонажа обновлены." });
      } else {
        // Adding new character
        addCharacterToUser(currentUser.id, characterData);
        toast({ title: "Успешно", description: "Персонаж добавлен. Теперь он может получать награды." });
      }
      setFormDialogOpen(false);
      setEditingCharacter(null);
  };

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
  
  const sortedPointHistory = currentUser.pointHistory.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const userAchievements = (currentUser.achievementIds || []).map(id => ACHIEVEMENTS_BY_ID[id]).filter(Boolean);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
             <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                <AvatarFallback>{currentUser.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                <CardTitle className="text-2xl font-headline">{currentUser.name}</CardTitle>
                <CardDescription>{currentUser.email}</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Баллы</span>
              <span className="font-bold text-lg text-primary flex items-center gap-1">
                <Star className="w-4 h-4" /> {currentUser.points.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Статус</span>
              <Badge variant={'outline'} className={cn("capitalize", getStatusClass(currentUser.status))}>
                {currentUser.status}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Роль</span>
              <Badge variant="outline">{currentUser.role}</Badge>
            </div>
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
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Персонажи</CardTitle>
                    <CardDescription>Ваш список персонажей-ремесленников</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddClick}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Добавить
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            {currentUser.characters.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {currentUser.characters.map(char => (
                        <CharacterDisplay key={char.id} character={char} onEdit={handleEditClick} onDelete={handleDeleteCharacter} />
                    ))}
                </Accordion>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Персонажей пока нет.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>История баллов</CardTitle>
            <CardDescription>Журнал ваших заработанных и потраченных баллов.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[80vh] overflow-y-auto">
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

       <Dialog open={isFormDialogOpen} onOpenChange={setFormDialogOpen}>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>{editingCharacter ? 'Редактировать персонажа' : 'Добавить нового персонажа'}</DialogTitle>
                <DialogDescription>
                    {editingCharacter ? 'Измените данные вашего персонажа.' : 'Заполните данные для вашего нового персонажа.'}
                </DialogDescription>
                </DialogHeader>
                <CharacterForm 
                    onSubmit={handleFormSubmit}
                    character={editingCharacter}
                    closeDialog={() => setFormDialogOpen(false)} 
                />
            </DialogContent>
        </Dialog>
    </div>
  );
}

    