'use client';

import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Pencil, UserSquare, Sparkles, Anchor, KeyRound, Link as LinkIcon, Gamepad2, X, Heart, Users, History, Award } from 'lucide-react';
import type { PointLog, UserStatus, Character, User, FamiliarCard, FamiliarRank, Moodlet, PlayerStatus, PlayPlatform, SocialLink } from '@/lib/types';
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
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn, formatTimeLeft } from '@/lib/utils';
import { ACHIEVEMENTS_BY_ID, ALL_ACHIEVEMENTS } from '@/lib/data';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import CharacterForm, { type EditingState } from './character-form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import FamiliarCardDisplay from './familiar-card';
import RewardRequestsHistory from './reward-requests-history';
import AvatarUploader from './avatar-uploader';
import { CustomIcon } from '../ui/custom-icon';
import { SearchableSelect } from '../ui/searchable-select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useQuery } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '../ui/scroll-area';


const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    // If the name starts with 'ach-', assume it's a custom achievement icon
    if (name.startsWith('ach-')) {
        return (
            <CustomIcon src={`/icons/${name}.svg`} className={cn("icon-achievement", className)} />
        );
    }
    // Fallback to Lucide icons for other cases
    const IconComponent = (import('lucide-react') as any)[name];
    if (!IconComponent) {
        return <CustomIcon src="/icons/points.svg" className={className} />;
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


const CharacterDisplay = ({ character, onDelete }: { character: Character, onDelete: (characterId: string) => void }) => {
    const { familiarsById } = useUser();
    const isBlessed = character.blessingExpires && new Date(character.blessingExpires) > new Date();
    const activeMoodlets = (character.moodlets || []).filter(m => new Date(m.expiresAt) > new Date());
    const familiarCards = character.familiarCards || [];

    const groupedFamiliars = familiarCards.reduce((acc, ownedCard, index) => {
        const cardDetails = familiarsById[ownedCard.id];
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
        <AccordionItem value={character.id} className="border rounded-md px-2 mb-2 hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors duration-200">
             <div className="flex justify-between items-center w-full">
                 <AccordionTrigger className="flex-1 py-3 hover:no-underline group">
                   <div className="flex items-center gap-3">
                        <CustomIcon src="/icons/character.svg" className="w-10 h-10 icon-primary shrink-0" />
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Link href={`/characters/${character.id}`} className="font-bold text-base hover:underline" onClick={e => e.stopPropagation()}>{character.name}</Link>
                                 {isBlessed && (
                                   <Sparkles className="h-4 w-4 text-yellow-500" />
                                 )}
                                 {character.hasLeviathanFriendship && (
                                     <Anchor className="h-4 w-4 text-blue-500" />
                                 )}
                                 {character.hasCrimeConnections && (
                                    <CustomIcon src="/icons/ach-mafiosi.svg" className="h-6 w-6 icon-black" />
                                 )}
                            </div>
                            <p className="text-sm text-muted-foreground text-left">{character.activity}</p>
                        </div>
                    </div>
                </AccordionTrigger>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0 hover:bg-destructive/10" onClick={e => e.stopPropagation()}>
                            <Trash2 className="h-4 h-4 text-destructive" />
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
            <AccordionContent>
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
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </AccordionContent>
       </AccordionItem>
    );
};


export default function ProfileTab() {
  const { currentUser, updateCharacterInUser, deleteCharacterFromUser, fetchUsersForAdmin, checkExtraCharacterSlots, setCurrentUser, updateUser, addFavoritePlayer, removeFavoritePlayer } = useUser();
  const isMobile = useIsMobile();
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [isAvatarDialogOpen, setAvatarDialogOpen] = React.useState(false);
  const [isPlayerStatusDialogOpen, setPlayerStatusDialogOpen] = React.useState(false);
  const [isSocialsDialogOpen, setSocialsDialogOpen] = React.useState(false);
  const [socials, setSocials] = React.useState<SocialLink[]>([]);
  const [isSavingSocials, setIsSavingSocials] = React.useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);

  const { data: allUsers = [], refetch } = useQuery<User[]>({
    queryKey: ['allUsersForProfile'],
    queryFn: fetchUsersForAdmin,
  });

  const { toast } = useToast();

  const freeSlots = 6;
  const totalSlots = freeSlots + (currentUser?.extraCharacterSlots || 0);
  const canAddCharacter = currentUser ? currentUser.characters.length < totalSlots : false;

   useEffect(() => {
    if(currentUser) {
        setSocials(currentUser.socials || []);
    }
  }, [currentUser]);

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
  
  const isAdmin = currentUser.role === 'admin';

  const handleAddClick = () => {
    if (!canAddCharacter) {
        toast({
            variant: "destructive",
            title: "Достигнут лимит персонажей",
            description: "Чтобы добавить больше персонажей, приобретите награду 'Дополнительный персонаж' в магазине.",
        });
        return;
    }
    setEditingState({ type: 'createCharacter' });
  };

  const handleDeleteCharacter = (characterId: string) => {
    if (!currentUser) return;
    deleteCharacterFromUser(currentUser.id, characterId);
    toast({ variant: 'destructive', title: "Персонаж удален", description: "Персонаж и все его данные были удалены." });
  };

  const handleFormSubmit = (characterData: Character) => {
      if (!currentUser) return;

      updateCharacterInUser(currentUser.id, characterData);
      
      toast({ title: "Успешно", description: "Данные персонажа сохранены." });

      setEditingState(null);
  };

  const handlePlayerStatusChange = async (newStatus: PlayerStatus) => {
      if (!currentUser) return;
      await updateUser(currentUser.id, { playerStatus: newStatus });
      toast({ title: "Игровой статус обновлен" });
      setPlayerStatusDialogOpen(false);
  };
  
  const handleSocialsSave = async () => {
    if (!currentUser) return;
    setIsSavingSocials(true);
    try {
        const validSocials = socials.filter(s => s.link.trim() !== '');
        await updateUser(currentUser.id, { socials: validSocials });
        toast({ title: 'Данные обновлены' });
        setSocialsDialogOpen(false);
    } catch(e) {
        const msg = e instanceof Error ? e.message : 'Не удалось сохранить данные.';
        toast({ variant: 'destructive', title: 'Ошибка', description: msg });
    } finally {
        setIsSavingSocials(false);
    }
  }

  const handlePlatformClick = () => {
    setSocials(currentUser.socials || []);
    setSocialsDialogOpen(true);
  };
  
  const handleSocialChange = (index: number, field: keyof SocialLink, value: string) => {
    const newSocials = [...socials];
    (newSocials[index] as any)[field] = value;
    setSocials(newSocials);
  };

  const addSocialField = () => {
    setSocials([...socials, { id: `new-${Date.now()}`, platform: 'Discord', link: '' }]);
  };

  const removeSocialField = (id: string) => {
    setSocials(socials.filter(s => s.id !== id));
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

    const allAchievementsSorted = useMemo(() => {
    const userAchievementIds = new Set(currentUser.achievementIds || []);
    return [...ALL_ACHIEVEMENTS].sort((a, b) => {
        const aUnlocked = userAchievementIds.has(a.id);
        const bUnlocked = userAchievementIds.has(b.id);
        if (aUnlocked && !bUnlocked) return -1;
        if (!aUnlocked && bUnlocked) return 1;
        return a.name.localeCompare(b.name);
    });
  }, [currentUser.achievementIds]);

  const characterMap = useMemo(() => {
    const map = new Map<string, string>();
    currentUser.characters.forEach(c => map.set(c.id, c.name));
    return map;
  }, [currentUser.characters]);

  const characterToEdit = useMemo(() => {
    if (!editingState || editingState.type !== 'createCharacter') return null;
    // This logic might need to be expanded if we edit existing characters from this component.
    // For now, it only handles creation.
    return null;
  }, [editingState]);
  
  const playerStatusOptions: { value: PlayerStatus, label: string }[] = [
    { value: 'Должен пост', label: 'Должен пост' },
    { value: 'Жду пост', label: 'Жду пост' },
    { value: 'Ищу соигрока', label: 'Ищу соигрока' },
    { value: 'Регулярные посты', label: 'Регулярные посты' },
    { value: 'Средний темп', label: 'Средний темп' },
    { value: 'Медленный темп', label: 'Медленный темп' },
    { value: 'Не играю', label: 'Не играю' },
  ];
  
  const playPlatformOptions: { value: PlayPlatform, label: string }[] = [
    { value: 'Discord', label: 'Discord' },
    { value: 'Вконтакте', label: 'Вконтакте' },
    { value: 'Telegram', label: 'Telegram' },
    { value: 'Не указана', label: 'Не указана' },
  ];

  const favoritePlayers = useMemo(() => {
    if (!currentUser?.favoritePlayerIds || !allUsers.length) return [];
    const favs = currentUser.favoritePlayerIds.map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[];
    return favs;
  }, [currentUser?.favoritePlayerIds, allUsers]);

  const renderProfileCard = () => (
     <Card className="lg:self-start">
        <CardHeader>
            <div className="flex items-center gap-4">
            <div 
                className="relative group cursor-pointer"
                onClick={() => setAvatarDialogOpen(true)}
            >
                <Avatar className="h-16 w-16">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                    <AvatarFallback>{currentUser.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="w-6 h-6 text-white" />
                </div>
            </div>
            <div className="flex-1 overflow-hidden min-w-0">
                <CardTitle className="text-xl sm:text-2xl font-headline truncate">{currentUser.name}</CardTitle>
                <CardDescription className="truncate text-sm sm:text-base">{currentUser.email}</CardDescription>
            </div>
        </div>
        </CardHeader>
        <CardContent className="space-y-2">
        <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Баллы</span>
            <div className="font-bold text-lg text-primary flex items-center gap-1">
            <CustomIcon src="/icons/points.svg" className="w-5 h-5 icon-primary" /> {currentUser.points.toLocaleString()}
            </div>
        </div>
        <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Статус активности</span>
            <Badge variant={'outline'} className={cn("capitalize", getStatusClass(currentUser.status))}>
            {currentUser.status}
            </Badge>
        </div>
            <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Игровой статус</span>
            <button onClick={() => setPlayerStatusDialogOpen(true)} className="rounded-md -m-1 p-1 hover:bg-accent transition-colors">
                <Badge variant={'outline'}>
                    {currentUser.playerStatus || 'Не играю'}
                </Badge>
            </button>
            </div>
            <div className="flex justify-between items-start">
            <span className="text-muted-foreground">Платформы</span>
                <div className="flex flex-wrap gap-1 justify-end">
                {(currentUser.socials && currentUser.socials.length > 0) ? (
                    currentUser.socials.map(social => (
                        <button key={social.id} onClick={handlePlatformClick} className="rounded-md -m-1 p-1 hover:bg-accent transition-colors">
                            <Badge variant={'outline'}>
                            <Gamepad2 className="mr-1.5 h-3.5 w-3.5" />
                            {social.platform}
                            </Badge>
                        </button>
                    ))
                ) : (
                    <button onClick={handlePlatformClick} className="rounded-md -m-1 p-1 hover:bg-accent transition-colors">
                        <Badge variant={'outline'}>Не указаны</Badge>
                    </button>
                )}
                </div>
            </div>
        {isAdmin && (
            <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Роль</span>
            <Badge variant="outline">{currentUser.role}</Badge>
            </div>
        )}
            {userAchievements.length > 0 && (
            <div className="pt-4 space-y-2">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Достижения</h4>
                    <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => setIsAchievementsOpen(true)}>
                       Получено: {userAchievements.length} / {ALL_ACHIEVEMENTS.length}
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {userAchievements.map(ach => (
                        <Popover key={ach.id}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="icon" className="w-8 h-8 bg-muted hover:bg-primary/10">
                                    <DynamicIcon name={ach.id} />
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
  );

  const renderFavoritesCard = () => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users /> Избранные соигроки</CardTitle>
            <CardDescription>Список игроков, которых вы добавили в избранное.</CardDescription>
        </CardHeader>
        <CardContent>
            {favoritePlayers.length > 0 ? (
                <div className="flex flex-wrap gap-x-1 gap-y-4">
                    {favoritePlayers.map(player => (
                        <Link href={`/users/${player.id}`} key={player.id} className="flex flex-col items-center gap-1.5 group px-2">
                            <Avatar className={cn("w-12 h-12 transition-transform group-hover:scale-105", isMobile && "w-10 h-10")}>
                                <AvatarImage src={player.avatar} alt={player.name} />
                                <AvatarFallback>{player.name.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <p className="text-xs font-medium text-center truncate w-full group-hover:text-primary">{player.name}</p>
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground py-4">Вы еще не добавили никого в избранное.</p>
            )}
        </CardContent>
    </Card>
  );
  
  const renderCharactersCard = () => (
      <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Персонажи</CardTitle>
                    <CardDescription>
                        ({currentUser.characters.length} / {totalSlots})
                    </CardDescription>
                </div>
                <Popover open={!canAddCharacter ? undefined : false}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleAddClick}>
                            <PlusCircle className="h-5 h-5" />
                            <span className="sr-only">Добавить персонажа</span>
                        </Button>
                    </PopoverTrigger>
                     <PopoverContent className="w-auto max-w-xs text-sm" side="top">
                         Чтобы добавить больше персонажей, приобретите награду 'Дополнительный персонаж' в магазине.
                     </PopoverContent>
                </Popover>
            </div>
          </CardHeader>
          <CardContent>
            {currentUser.characters.length > 0 ? (
                <Accordion type="single" collapsible className="w-full space-y-2">
                    {currentUser.characters.map(char => (
                        <CharacterDisplay key={char.id} character={char} onDelete={handleDeleteCharacter} />
                    ))}
                </Accordion>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Персонажей пока нет.</p>
            )}
          </CardContent>
        </Card>
  );
  
   const renderHistoryCards = () => (
     <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>История баллов</CardTitle>
            <CardDescription>Журнал ваших заработанных и потраченных баллов.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[40vh] overflow-y-auto">
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
                      {log.characterId && <p className="text-xs text-muted-foreground">Персонаж: {characterMap.get(log.characterId) || 'Неизвестно'}</p>}
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
        <RewardRequestsHistory />
     </div>
   );


  return (
    <>
      {isMobile ? (
        <div className="space-y-6">
          {renderProfileCard()}
          {renderFavoritesCard()}
          <Tabs defaultValue="characters" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="characters">Персонажи</TabsTrigger>
              <TabsTrigger value="history">История</TabsTrigger>
            </TabsList>
            <TabsContent value="characters" className="mt-4">
              {renderCharactersCard()}
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              {renderHistoryCards()}
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            {renderProfileCard()}
            {renderCharactersCard()}
          </div>
          <div className="lg:col-span-2 space-y-6">
            {renderFavoritesCard()}
            {renderHistoryCards()}
          </div>
        </div>
      )}

      <Dialog open={!!editingState} onOpenChange={(isOpen) => !isOpen && setEditingState(null)}>
            <DialogContent>
                <CharacterForm 
                    onSubmit={handleFormSubmit as (data: Character) => void}
                    character={characterToEdit}
                    allUsers={allUsers}
                    closeDialog={() => setEditingState(null)}
                    editingState={editingState}
                />
            </DialogContent>
        </Dialog>
        
        <Dialog open={isAvatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Обновить аватар</DialogTitle>
                    <DialogDescription>
                        Выберите новое изображение для вашего профиля.
                    </DialogDescription>
                </DialogHeader>
                <AvatarUploader closeDialog={() => setAvatarDialogOpen(false)} />
            </DialogContent>
        </Dialog>

        <Dialog open={isAchievementsOpen} onOpenChange={setIsAchievementsOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Все достижения</DialogTitle>
                    <DialogDescription>
                       Получено: {userAchievements.length} / {ALL_ACHIEVEMENTS.length}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] -mx-6 px-6">
                    <div className="space-y-4">
                        {allAchievementsSorted.map(ach => {
                            const isUnlocked = (currentUser.achievementIds || []).includes(ach.id);
                            return (
                                <div key={ach.id} className={cn("flex items-start gap-4 p-3 rounded-md", isUnlocked ? 'bg-primary/10' : 'bg-muted/50 opacity-60')}>
                                    <div className={cn("p-2 rounded-md", isUnlocked ? 'bg-primary/20' : 'bg-muted')}>
                                       <DynamicIcon name={ach.id} className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className={cn("font-semibold", isUnlocked && 'text-primary')}>{ach.name}</p>
                                        <p className="text-xs text-muted-foreground">{ach.description}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>

        <Dialog open={isPlayerStatusDialogOpen} onOpenChange={setPlayerStatusDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Изменить игровой статус</DialogTitle>
                    <DialogDescription>
                        Выберите ваш текущий статус, чтобы другие игроки знали, готовы ли вы к игре.
                    </DialogDescription>
                </DialogHeader>
                 <div className="py-4 space-y-2">
                    <Label>Ваш статус</Label>
                    <SearchableSelect
                        options={playerStatusOptions}
                        value={currentUser.playerStatus || 'Не играю'}
                        onValueChange={(val) => handlePlayerStatusChange(val as PlayerStatus)}
                        placeholder="Выберите статус..."
                    />
                </div>
            </DialogContent>
        </Dialog>
        
        <Dialog open={isSocialsDialogOpen} onOpenChange={setSocialsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Обновить игровые данные</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    {socials.map((social, index) => (
                        <div key={social.id} className="flex items-end gap-2 p-3 border rounded-md relative">
                           <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute -top-3 -right-3 h-6 w-6"
                                onClick={() => removeSocialField(social.id)}
                            >
                                <X className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <div className="flex-1 grid gap-2">
                                <div>
                                    <Label htmlFor={`platform-${index}`}>Платформа</Label>
                                    <SearchableSelect
                                        options={playPlatformOptions}
                                        value={social.platform}
                                        onValueChange={(val) => handleSocialChange(index, 'platform', val as PlayPlatform)}
                                        placeholder="Выберите платформу..."
                                    />
                                </div>
                                <div>
                                    <Label htmlFor={`link-${index}`}>Ссылка</Label>
                                    <Input id={`link-${index}`} value={social.link} onChange={e => handleSocialChange(index, 'link', e.target.value)} placeholder="https://..."/>
                                </div>
                            </div>
                        </div>
                    ))}
                    <Button variant="outline" onClick={addSocialField}>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Добавить платформу
                    </Button>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setSocialsDialogOpen(false)}>Отмена</Button>
                    <Button onClick={handleSocialsSave} disabled={isSavingSocials}>
                        {isSavingSocials ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </>
  );
}
