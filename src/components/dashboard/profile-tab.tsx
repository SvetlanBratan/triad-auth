
'use client';

import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Star, Trash2, Pencil, UserSquare, Sparkles, Anchor, KeyRound } from 'lucide-react';
import type { PointLog, UserStatus, Character, User } from '@/lib/types';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ACHIEVEMENTS_BY_ID } from '@/lib/data';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { TooltipProvider } from '../ui/tooltip';
import * as LucideIcons from 'lucide-react';
import CharacterForm from './character-form';


type IconName = keyof typeof LucideIcons;

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
    const IconComponent = LucideIcons[name as IconName];

    if (!IconComponent) {
        return <Star className={className} />;
    }

    return <IconComponent className={className} />;
};


const CharacterDisplay = ({ character, onDelete }: { character: Character, onDelete: (characterId: string) => void }) => {
    const isBlessed = character.blessingExpires && new Date(character.blessingExpires) > new Date();

    return (
       <Card className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
                <UserSquare className="w-8 h-8 text-primary" />
                <div>
                    <div className="flex items-center gap-2">
                        <Link href={`/characters/${character.id}`} className="font-bold text-base hover:underline">{character.name}</Link>
                         {isBlessed && (
                           <Sparkles className="h-4 w-4 text-yellow-500" />
                         )}
                         {character.hasLeviathanFriendship && (
                             <Anchor className="h-4 w-4 text-blue-500" />
                         )}
                         {character.hasCrimeConnections && (
                            <KeyRound className="h-4 w-4 text-gray-500" />
                         )}
                    </div>
                    <p className="text-sm text-muted-foreground">{character.activity}</p>
                </div>
            </div>
            <div className="flex items-center gap-1.5">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0 hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Это действие невозможно отменить. Это навсегда удалит вашего персонажа
                                <span className="font-bold"> {character.name} </span>
                                и все его данные, включая анкету и инвентарь.
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
        </Card>
    );
};


export default function ProfileTab() {
  const { currentUser, updateCharacterInUser, deleteCharacterFromUser, fetchUsersForAdmin, checkExtraCharacterSlots, setCurrentUser } = useUser();
  const [isFormDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingCharacter, setEditingCharacter] = React.useState<Character | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const { toast } = useToast();

  const freeSlots = 6;
  const totalSlots = freeSlots + (currentUser?.extraCharacterSlots || 0);
  const canAddCharacter = currentUser ? currentUser.characters.length < totalSlots : false;

   useEffect(() => {
    if (isFormDialogOpen) {
      fetchUsersForAdmin().then(setAllUsers);
    }
  }, [isFormDialogOpen, fetchUsersForAdmin]);

  useEffect(() => {
    // Check and update extra slots when component mounts or currentUser changes
    const updateUserSlots = async () => {
        if (currentUser) {
            const slots = await checkExtraCharacterSlots(currentUser.id);
            if(currentUser.extraCharacterSlots !== slots) {
                setCurrentUser({...currentUser, extraCharacterSlots: slots});
            }
        }
    };
    updateUserSlots();
  }, [currentUser, checkExtraCharacterSlots, setCurrentUser]);


  if (!currentUser) return null;
  
  const handleAddClick = () => {
    if (!canAddCharacter) {
        toast({
            variant: "destructive",
            title: "Достигнут лимит персонажей",
            description: "Чтобы добавить больше персонажей, приобретите награду 'Дополнительный персонаж' в магазине.",
        });
        return;
    }
    setEditingCharacter(null);
    setFormDialogOpen(true);
  };

  const handleDeleteCharacter = (characterId: string) => {
    if (!currentUser) return;
    deleteCharacterFromUser(currentUser.id, characterId);
    toast({ variant: 'destructive', title: "Персонаж удален", description: "Персонаж и все его данные были удалены." });
  };

  const handleFormSubmit = (characterData: Character) => {
      if (!currentUser) return;

      updateCharacterInUser(currentUser.id, characterData);
      
      if (editingCharacter) {
        toast({ title: "Успешно", description: "Данные персонажа обновлены." });
      } else {
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
                    <CardDescription>
                        ({currentUser.characters.length} / {totalSlots})
                    </CardDescription>
                </div>
                <TooltipProvider>
                    <Popover open={!canAddCharacter ? undefined : false}>
                        <PopoverTrigger asChild>
                             <Button variant="outline" size="sm" onClick={handleAddClick} disabled={!canAddCharacter}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Добавить
                            </Button>
                        </PopoverTrigger>
                         <PopoverContent className="w-auto max-w-xs text-sm" side="top">
                             Чтобы добавить больше персонажей, приобретите награду 'Дополнительный персонаж' в магазине.
                         </PopoverContent>
                    </Popover>
                </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            {currentUser.characters.length > 0 ? (
                <div className="space-y-2">
                    {currentUser.characters.map(char => (
                        <CharacterDisplay key={char.id} character={char} onDelete={handleDeleteCharacter} />
                    ))}
                </div>
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
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                <DialogTitle>{editingCharacter ? 'Редактировать персонажа' : 'Добавить нового персонажа'}</DialogTitle>
                <DialogDescription>
                    {editingCharacter ? 'Измените данные вашего персонажа.' : 'Заполните данные для вашего нового персонажа.'}
                </DialogDescription>
                </DialogHeader>
                <CharacterForm 
                    onSubmit={handleFormSubmit as (data: Character) => void}
                    character={editingCharacter}
                    allUsers={allUsers}
                    closeDialog={() => setFormDialogOpen(false)} 
                />
            </DialogContent>
        </Dialog>
    </div>
  );
}
