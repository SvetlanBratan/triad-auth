'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import type { User, UserStatus, PointLog, Character, FamiliarCard, FamiliarRank, Moodlet, PlayerStatus, PlayPlatform, SocialLink } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Anchor, KeyRound, Sparkles, Pencil, Gamepad2, Link as LinkIcon, PlusCircle, X, Heart, Users } from 'lucide-react';
import { cn, formatTimeLeft } from '@/lib/utils';
import FamiliarCardDisplay from './familiar-card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ACHIEVEMENTS_BY_ID } from '@/lib/data';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { useUser } from '@/hooks/use-user';
import Link from 'next/link';
import { CustomIcon } from '../ui/custom-icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { SearchableSelect } from '../ui/searchable-select';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useQuery } from '@tanstack/react-query';

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

const CharacterDisplay = ({ character }: { character: Character }) => {
    const { familiarsById } = useUser();
    const familiarCards = character.familiarCards || [];
    const isBlessed = character.blessingExpires && new Date(character.blessingExpires) > new Date();
    const activeMoodlets = (character.moodlets || []).filter(m => new Date(m.expiresAt) > new Date());


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

    const accomplishments = character.accomplishments || [];


    return (
        <AccordionItem value={character.id} className="border-b">
            <div className="flex justify-between items-center w-full hover:bg-muted/50 rounded-md">
            <AccordionTrigger className="flex-1 py-4 px-2 hover:no-underline">
                 <div className="text-left flex items-start gap-2 flex-wrap">
                    <Link href={`/characters/${character.id}`} className="font-bold text-base hover:underline" onClick={(e) => e.stopPropagation()}>
                        {character.name}
                    </Link>
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
                            <PopoverTrigger asChild>
                                <button>
                                    <CustomIcon src="/icons/ach-mafiosi.svg" className="h-6 w-6 icon-black cursor-pointer" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto text-sm"><p>Связи в преступном мире</p></PopoverContent>
                        </Popover>
                    )}
                </div>
            </div>
            <AccordionContent>
            <div className="text-sm space-y-2 pl-2 pb-2">
                 {accomplishments.length > 0 ? (
                    <div className="space-y-1">
                        <p className="font-semibold">Достижения:</p>
                        <ul className="list-disc pl-5">
                        {accomplishments.map(acc => (
                            <li key={acc.id} className="text-muted-foreground">
                                <span className="font-semibold text-foreground">{acc.fameLevel}</span> <span className="text-primary font-semibold">{acc.skillLevel}</span> <span>{acc.description}</span>
                            </li>
                        ))}
                        </ul>
                    </div>
                ) : (
                    <p className="italic text-muted-foreground">Достижений пока нет.</p>
                )}
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


export default function UserProfileDialog({ user }: { user: User }) {
  const { currentUser, updateUser, addFavoritePlayer, removeFavoritePlayer, fetchUsersForAdmin } = useUser();
  const { toast } = useToast();
  const [isPlayerStatusDialogOpen, setPlayerStatusDialogOpen] = useState(false);
  const [isSocialsDialogOpen, setSocialsDialogOpen] = useState(false);
  const [socials, setSocials] = React.useState<SocialLink[]>([]);
  const [isSavingSocials, setIsSavingSocials] = React.useState(false);

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['allUsersForProfileDialog'],
    queryFn: fetchUsersForAdmin,
  });

  if (!user) return null;
  
  React.useEffect(() => {
    if(user) {
        setSocials(user.socials || []);
    }
  }, [user]);

  const isAdmin = currentUser?.role === 'admin';
  const isOwner = currentUser?.id === user.id;

  const isFavorite = useMemo(() => {
    if (!currentUser?.favoritePlayerIds) return false;
    return currentUser.favoritePlayerIds.includes(user.id);
  }, [currentUser?.favoritePlayerIds, user.id]);

  const handleToggleFavorite = useCallback(async () => {
    if (!currentUser) return;
    try {
        if (isFavorite) {
            await removeFavoritePlayer(user.id);
            toast({ title: 'Удалено из избранного', description: `${user.name} удален(а) из вашего списка соигроков.` });
        } else {
            await addFavoritePlayer(user.id);
            toast({ title: 'Добавлено в избранное', description: `${user.name} добавлен(а) в ваш список соигроков.` });
        }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Произошла ошибка.';
        toast({ variant: 'destructive', title: 'Ошибка', description: message });
    }
}, [currentUser, isFavorite, removeFavoritePlayer, addFavoritePlayer, user.id, user.name, toast]);

  const handlePlayerStatusChange = async (newStatus: PlayerStatus) => {
      await updateUser(user.id, { playerStatus: newStatus });
      toast({ title: "Игровой статус обновлен" });
      setPlayerStatusDialogOpen(false);
  };
  
  const handleSocialsSave = async () => {
    if (!currentUser) return;
    setIsSavingSocials(true);
    try {
        const validSocials = socials.filter(s => s.link.trim() !== '');
        await updateUser(user.id, { socials: validSocials });
        toast({ title: 'Данные обновлены' });
        setSocialsDialogOpen(false);
    } catch(e) {
        const msg = e instanceof Error ? e.message : 'Не удалось сохранить данные.';
        toast({ variant: 'destructive', title: 'Ошибка', description: msg });
    } finally {
        setIsSavingSocials(false);
    }
  }

  const handlePlatformClick = (link?: string) => {
    if (isOwner || isAdmin) {
        setSocials(user.socials || []);
        setSocialsDialogOpen(true);
    } else if (link) {
        window.open(link, '_blank', 'noopener,noreferrer');
    }
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
  
  const sortedPointHistory = [...(user.pointHistory || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const userAchievements = (user.achievementIds || []).map(id => ACHIEVEMENTS_BY_ID[id]).filter(Boolean);

  const characterMap = useMemo(() => {
    const map = new Map<string, string>();
    user.characters.forEach(c => map.set(c.id, c.name));
    return map;
  }, [user.characters]);

    const favoritePlayers = useMemo(() => {
        if (!user?.favoritePlayerIds || !allUsers.length) return [];
        const favs = user.favoritePlayerIds.map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[];
        return favs;
    }, [user?.favoritePlayerIds, allUsers]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
           <div className="space-y-6">
            <Card className="lg:self-start">
                <CardHeader>
                <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden min-w-0">
                    <CardTitle className="text-xl sm:text-2xl font-headline truncate">{user.name}</CardTitle>
                    <CardDescription className="truncate">{user.email}</CardDescription>
                    </div>
                    {!isOwner && currentUser && (
                    <Button variant="ghost" size="icon" onClick={handleToggleFavorite}>
                        <Heart className={cn("w-5 h-5 text-muted-foreground", isFavorite && "fill-destructive text-destructive")} />
                    </Button>
                    )}
                </div>
                </CardHeader>
                <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Баллы</span>
                    <div className="font-bold text-lg text-primary flex items-center gap-1">
                    <CustomIcon src="/icons/points.svg" className="w-5 h-5 icon-primary" /> {user.points.toLocaleString()}
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Статус активности</span>
                    <Badge variant={'outline'} className={cn("capitalize", getStatusClass(user.status))}>
                    {user.status}
                    </Badge>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Игровой статус</span>
                    <button 
                    onClick={() => (isOwner || isAdmin) && setPlayerStatusDialogOpen(true)} 
                    disabled={!(isOwner || isAdmin)}
                    className="rounded-md -m-1 p-1 hover:bg-accent transition-colors disabled:cursor-default disabled:hover:bg-transparent"
                    >
                        <Badge variant={'outline'}>
                            {user.playerStatus || 'Не играю'}
                        </Badge>
                    </button>
                </div>
                <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Платформы</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                        {(user.socials && user.socials.length > 0) ? (
                            user.socials.map(social => (
                                <button key={social.id} onClick={() => handlePlatformClick(social.link)} className="rounded-md -m-1 p-1 hover:bg-accent transition-colors">
                                    <Badge variant={'outline'}>
                                    <Gamepad2 className="mr-1.5 h-3.5 w-3.5" />
                                    {social.platform}
                                    {social.link && <LinkIcon className="ml-1.5 h-3 w-3" />}
                                    </Badge>
                                </button>
                            ))
                        ) : (
                            <button onClick={() => handlePlatformClick()} className="rounded-md -m-1 p-1 hover:bg-accent transition-colors" disabled={!(isOwner || isAdmin)}>
                                <Badge variant={'outline'}>Не указаны</Badge>
                            </button>
                        )}
                    </div>
                </div>
                {isAdmin && (
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users /> Избранные соигроки</CardTitle>
                    <CardDescription>Список игроков, которых {user.name} добавил(а) в избранное.</CardDescription>
                </CardHeader>
                <CardContent>
                    {favoritePlayers.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-y-4 gap-x-1">
                            {favoritePlayers.map(player => (
                                <Link href={`/users/${player.id}`} key={player.id} className="flex flex-col items-center gap-1.5 group">
                                    <Avatar className="w-12 h-12 lg:w-16 lg:h-16 transition-transform group-hover:scale-105">
                                        <AvatarImage src={player.avatar} alt={player.name} />
                                        <AvatarFallback>{player.name.slice(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <p className="text-xs font-medium text-center truncate w-full group-hover:text-primary">{player.name}</p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-4">{user.name} еще не добавил(а) никого в избранное.</p>
                    )}
                </CardContent>
            </Card>
           </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
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
        
            {(isOwner || isAdmin) && (
                <Card>
                    <CardHeader>
                        <CardTitle>История баллов</CardTitle>
                        <CardDescription>Журнал заработанных и потраченных баллов.</CardDescription>
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
            )}
        </div>
    </div>
    
     <Dialog open={isPlayerStatusDialogOpen} onOpenChange={setPlayerStatusDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Изменить игровой статус для {user.name}</DialogTitle>
                <DialogDescription>
                    Выберите новый статус.
                </DialogDescription>
            </DialogHeader>
             <div className="py-4 space-y-2">
                <Label>Игровой статус</Label>
                <SearchableSelect
                    options={playerStatusOptions}
                    value={user.playerStatus || 'Не играю'}
                    onValueChange={(val) => handlePlayerStatusChange(val as PlayerStatus)}
                    placeholder="Выберите статус..."
                />
            </div>
        </DialogContent>
    </Dialog>
     <Dialog open={isSocialsDialogOpen} onOpenChange={setSocialsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Обновить игровые данные для {user.name}</DialogTitle>
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
