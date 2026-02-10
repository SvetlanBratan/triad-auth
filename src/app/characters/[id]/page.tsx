

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { User, Character, FamiliarCard, FamiliarRank, Moodlet, Relationship, RelationshipType, WealthLevel, BankAccount, Accomplishment, BankTransaction, OwnedFamiliarCard, InventoryCategory, InventoryItem, CitizenshipStatus, TaxpayerStatus, PopularityLog, GalleryImage, Shop, Magic } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FAMILIARS_BY_ID, MOODLETS_DATA, TRAINING_OPTIONS, CRIME_LEVELS, INVENTORY_CATEGORIES, POPULARITY_LEVELS } from '@/lib/data';
import FamiliarCardDisplay from '@/components/dashboard/familiar-card';
import { ArrowLeft, BookOpen, Edit, Heart, PersonStanding, RussianRuble, Shield, Swords, Warehouse, Gem, BrainCircuit, ShieldAlert, Star, Dices, Home, CarFront, Sparkles, Anchor, KeyRound, Users, HeartHandshake, Wallet, Coins, Award, Zap, ShieldOff, History, Info, PlusCircle, BookUser, Gavel, Group, Building, Package, LandPlot, ShieldCheck, FileQuestion, BadgeCheck, BadgeAlert, Landmark, Eye, Lock, Cat, Handshake, FileText, ChevronDown, Camera, Search, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import CharacterForm, { type EditableSection, type EditingState } from '@/components/dashboard/character-form';
import { useToast } from '@/hooks/use-toast';
import { cn, formatTimeLeft, calculateAge, formatCurrency, calculateRelationshipLevel } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import * as LucideIcons from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import RelationshipActions from '@/components/dashboard/relationship-actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FormattedTextRenderer from '@/components/dashboard/formatted-text-renderer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import CharacterPageSkeleton from '@/components/dashboard/character-page-skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/providers/user-provider';
import AuthPage from '@/components/auth/auth-page';


const CustomIcon = ({ src, className }: { src: string, className?: string }) => (
  <div
    className={cn("w-full h-full", className)}
    style={{
      maskImage: `url(${src})`,
      maskSize: 'contain',
      maskRepeat: 'no-repeat',
      maskPosition: 'center',
    }}
  />
);


const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    // If the name starts with 'ach-', assume it's a custom achievement icon
    if (name.startsWith('ach-')) {
        return (
            <CustomIcon src={`/icons/${name}.svg`} className={cn("icon-primary", className)} />
        );
    }
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
    'уважение': 'bg-teal-500',
    'страсть': 'bg-orange-600',
    'заинтересованность': 'bg-indigo-500',
    'сотрудничество': 'bg-sky-600',
};
const relationshipLabels: Record<RelationshipType, string> = {
    'романтика': 'Романтика',
    'дружба': 'Дружба',
    'вражда': 'Вражда',
    'конкуренция': 'Конкуренция',
    'нейтралитет': 'Нейтралитет',
    'любовь': 'Любовь',
    'семья': 'Семья',
    'уважение': 'Уважение',
    'страсть': 'Страсть',
    'заинтересованность': 'Заинтересованность',
    'сотрудничество': 'Сотрудничество',
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
            { key: 'доспехи', label: 'Доспехи', icon: Shield },
            { key: 'артефакты', label: 'Артефакты', icon: Gem },
            { key: 'зелья', label: 'Зелья/лекарства', icon: BrainCircuit },
            { key: 'гардероб', label: 'Гардероб', icon: RussianRuble },
            { key: 'драгоценности', label: 'Драгоценности', icon: Sparkles },
            { key: 'книгиИСвитки', label: 'Книги и свитки', icon: BookOpen },
            { key: 'документы', label: 'Документы', icon: FileText },
            { key: 'ключи', label: 'Ключи', icon: KeyRound },
            { key: 'ингредиенты', label: 'Ингредиенты', icon: BrainCircuit },
            { key: 'еда', label: 'Еда', icon: Star },
            { key: 'инструменты', label: 'Инструменты', icon: Gavel },
            { key: 'питомцы', label: 'Питомцы', icon: Cat },
            { key: 'услуги', label: 'Услуги', icon: Handshake },
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
    const { familiarsById } = useUser();
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
    const params = useParams();
    const { currentUser, updateCharacterInUser, gameDate, consumeInventoryItem, setCurrentUser, fetchCharacterById, fetchUsersForAdmin, fetchAllShops } = useUser();
    const { loading } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const [editingState, setEditingState] = useState<EditingState | null>(null);
    const [selectedItem, setSelectedItem] = useState<(InventoryItem & { category: InventoryCategory }) | null>(null);
    const [isConsuming, setIsConsuming] = useState(false);
    const [consumeQuantity, setConsumeQuantity] = useState<number | ''>(1);
    const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryImage | null>(null);
    const [inventorySearch, setInventorySearch] = useState('');
    
    const id = params.id;
    const charId = Array.isArray(id) ? id[0] : id;

    const { data: allUsers = [], isLoading: areUsersLoading } = useQuery<User[]>({
        queryKey: ['adminUsers'],
        queryFn: fetchUsersForAdmin,
    });
    
    const { data: allShops = [] } = useQuery({
        queryKey: ['allShops'],
        queryFn: fetchAllShops,
    });
    
    const { data: characterData, isLoading: isCharacterLoading, refetch } = useQuery({
        queryKey: ['character', charId],
        queryFn: () => charId ? fetchCharacterById(charId) : Promise.resolve(null),
        enabled: !!charId,
    });
    
    const character = characterData?.character;
    const owner = characterData?.owner;

    const mutation = useMutation({
        mutationFn: (characterData: Character) => {
            if (!owner) throw new Error("Владелец персонажа не найден.");
            return updateCharacterInUser(owner.id, characterData);
        },
        onMutate: async (newCharacter) => {
            await queryClient.cancelQueries({ queryKey: ['character', charId] });
            const previousCharacterData = queryClient.getQueryData(['character', charId]);
            queryClient.setQueryData(['character', charId], { character: newCharacter, owner });
            return { previousCharacterData };
        },
        onError: (err, newCharacter, context) => {
            if (context?.previousCharacterData) {
                queryClient.setQueryData(['character', charId], context.previousCharacterData);
            }
            const message = err instanceof Error ? err.message : "Произошла неизвестная ошибка.";
            toast({ variant: 'destructive', title: "Ошибка", description: message });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['character', charId] });
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
        },
        onSuccess: () => {
            toast({ title: "Анкета обновлена", description: "Данные персонажа успешно сохранены." });
            setEditingState(null);
        }
    });

    useEffect(() => {
        if (selectedItem) {
            setConsumeQuantity(1);
        }
    }, [selectedItem]);

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

    const popularityLevel = useMemo(() => {
        if (character?.popularity === undefined) return POPULARITY_LEVELS[0];
        return POPULARITY_LEVELS.find(level => character.popularity >= level.min && character.popularity <= level.max) || POPULARITY_LEVELS[0];
    }, [character]);
    
    const sortedPopularityHistory = useMemo(() => {
        if (!character || !character.popularityHistory) return [];
        return [...character.popularityHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [character]);
    
    const combinedGallery = useMemo(() => {
        if (!character) return [];
        const ownImages = character.galleryImages || [];
        const taggedImages: GalleryImage[] = [];
        allUsers.forEach(user => {
            user.characters.forEach(otherChar => {
                if (otherChar.id === character.id) return;
                (otherChar.galleryImages || []).forEach(img => {
                    if ((img.taggedCharacterIds || []).includes(character.id)) {
                        taggedImages.push(img);
                    }
                });
            });
        });
        const allImages = [...ownImages, ...taggedImages];
        // Sort by ID (timestamp) descending to show newest first
        const uniqueImages = Array.from(new Map(allImages.map(item => [item.id, item])).values())
            .sort((a, b) => b.id.localeCompare(a.id));
        return uniqueImages;
    }, [character, allUsers]);

    if (loading || isCharacterLoading || areUsersLoading) {
        return <CharacterPageSkeleton />;
    }

    if (!currentUser) {
        return <AuthPage />;
    }
    
    if (!characterData || !character || !owner) {
        return notFound();
    }

    const handleFormSubmit = (characterData: Character) => {
        mutation.mutate(characterData);
    };
    
    const closeDialog = () => {
        setEditingState(null);
    }
    
    const handleConsumeItem = async () => {
        if (!selectedItem || !character || !owner) return;
        
        if (selectedItem.quantity > 1 && (!consumeQuantity || consumeQuantity <= 0)) {
            toast({
                variant: 'destructive',
                title: 'Неверное количество',
                description: 'Пожалуйста, введите корректное количество для использования.'
            });
            return;
        }

        setIsConsuming(true);
        try {
            const quantityToRemove = selectedItem.quantity > 1 ? Number(consumeQuantity) : 1;
            await consumeInventoryItem(owner.id, character.id, selectedItem.id, selectedItem.category, quantityToRemove);
            toast({ title: "Предмет использован", description: `"${selectedItem.name}" (x${quantityToRemove}) был удален из инвентаря.` });
            
            const { data: refreshedCharacterData } = await refetch();

            if (currentUser?.id === owner.id && refreshedCharacterData) {
                const updatedCurrentUser = { ...currentUser };
                const charIndex = updatedCurrentUser.characters.findIndex(c => c.id === character.id);
                if (charIndex > -1) {
                    updatedCurrentUser.characters[charIndex] = refreshedCharacterData.character;
                    setCurrentUser(updatedCurrentUser);
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

    const citizenshipStatus = character.citizenshipStatus || 'non-citizen';
    const CitizenshipIcon = citizenshipIcons[citizenshipStatus];
    const taxpayerStatus = character.taxpayerStatus || 'taxable';
    const TaxpayerIcon = taxpayerIcons[taxpayerStatus];

    const isOwnerOrAdmin = currentUser?.id === owner.id || currentUser?.role === 'admin';
    const isAdmin = currentUser?.role === 'admin';
    
    const inventory = {
      оружие: [], доспехи: [], артефакты: [], зелья: [], гардероб: [],
      драгоценности: [], книгиИСвитки: [], еда: [], инструменты: [],
      питомцы: [], прочее: [], недвижимость: [], души: [], мебель: [],
      транспорт: [], предприятия: [], услуги: [], документы: [], ингредиенты: [], ключи: [],
      ...(character.inventory ?? {})
    } as Character['inventory'];
    
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
    const isBiographyVisible = !character.biographyIsHidden || isOwnerOrAdmin;
    const areAbilitiesVisible = !character.abilitiesAreHidden || isOwnerOrAdmin;
    const areWeaknessesVisible = !character.weaknessesAreHidden || isOwnerOrAdmin;
    
    const backLink = currentUser?.id === owner.id ? '/' : `/users/${owner.id}`;
    const backLinkText = currentUser?.id === owner.id ? 'Вернуться в профиль' : 'Вернуться в профиль игрока';

    const SectionTrigger = ({ title, icon, section }: { title: string; icon: React.ReactNode; section: EditableSection }) => (
        <div className="flex justify-between items-center w-full p-4">
            <AccordionTrigger className="flex-1 hover:no-underline p-0">
                <CardTitle className="flex items-center gap-2 text-lg">{icon} {title}</CardTitle>
            </AccordionTrigger>
            {isOwnerOrAdmin && (
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingState({ type: 'section', section })}} className="shrink-0 h-8 w-8 ml-2">
                    <Edit className="w-4 h-4" />
                </Button>
            )}
        </div>
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
                {!isEmpty ? content : <p className="text-sm">Информация отсутствует.</p>}
            </div>
        );
     };
    
     const InfoRow = ({ label, value, field, section, isVisible = true, icon, children }: { label: string, value?: React.ReactNode, field: keyof Character, section: EditableSection | 'mainInfo', isVisible?: boolean, icon?: React.ReactNode, children?: React.ReactNode }) => {
        if (!isVisible && !isOwnerOrAdmin) return null;
        const finalValue = children || value;
        const isEmpty = !finalValue;
        return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 group items-start">
                <span className="text-muted-foreground col-span-1 flex items-center gap-1.5">{icon}{label}:</span>
                <div className="flex items-center justify-between col-span-1 sm:col-span-2">
                    <div className="flex-1 text-left">
                        {isEmpty && isOwnerOrAdmin ? <span className="italic">Не указано</span> : finalValue}
                    </div>
                     {isOwnerOrAdmin && (field !== 'race' || (field === 'race' && (isAdmin || !character.raceIsConfirmed))) && (
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
        if (category === 'питомцы' || category === 'души') {
            return { text: 'Отпустить', variant: 'outline' as const };
        }
        return { text: 'Удалить', variant: 'destructive' as const };
    };

    const handleRaceConfirm = () => {
        if (!isAdmin || !character) return;
        mutation.mutate({ ...character, raceIsConfirmed: true });
    }

    const renderMainInfo = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Info /> Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <InfoRow label="Имя" value={character.name} field="name" section="mainInfo" />
                <InfoRow label="Деятельность" value={character.activity} field="activity" section="mainInfo" />
                <InfoRow label="Раса" field="race" section="mainInfo">
                    <div className="flex items-center gap-2">
                        <span>{character.race}</span>
                        {character.raceIsConfirmed ? (
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger><ShieldCheck className="w-4 h-4 text-green-600" /></TooltipTrigger>
                                    <TooltipContent><p>Раса подтверждена</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ) : (
                            isAdmin && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRaceConfirm}>
                                                <ShieldAlert className="w-4 h-4 text-yellow-600"/>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Подтвердить расу</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )
                        )}
                    </div>
                </InfoRow>
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
                <InfoRow label="Место проживания" value={character.residenceLocation} field="residenceLocation" section="mainInfo" isVisible={!!character.residenceLocation || isOwnerOrAdmin} icon={<Home className="w-4 h-4" />} />
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 items-start">
                    <span className="text-muted-foreground col-span-1 flex items-center gap-1.5"><Eye className="w-4 h-4" />Популярность:</span>
                    <div className="col-span-1 sm:col-span-2 text-left">
                        <span className="font-semibold">{popularityLevel.label}</span>
                        <span className="text-muted-foreground ml-1.5">({character.popularity})</span>
                    </div>
                </div>
                <InfoRow label="Место работы" value={character.workLocation} field="workLocation" section="mainInfo" isVisible={!!character.workLocation}/>
                <InfoRow label="Фракции/гильдии" value={character.factions} field="factions" section="mainInfo" isVisible={!!character.factions || isOwnerOrAdmin} icon={<Group className="w-4 h-4" />} />
            </CardContent>
        </Card>
    );

    const renderAnketa = () => (
         <div className="space-y-6">
            <Accordion type="multiple" className="w-full space-y-6">
                <AccordionItem value="appearance" className="border-b-0 rounded-lg bg-card shadow-sm">
                    <SectionTrigger title="Внешность" icon={<PersonStanding />} section="appearance" />
                    <AccordionContent className="p-6 pt-0">
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
                                    <div className="pr-4"><FormattedTextRenderer text={character.appearance || 'Описание отсутствует.'} /></div>
                                </ScrollArea>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                    <AccordionItem value="personality" className="border-b-0 rounded-lg bg-card shadow-sm">
                    <SectionTrigger title="Характер" icon={<Heart />} section="personality" />
                    <AccordionContent className="p-6 pt-0">
                        <ScrollArea className="h-40 w-full">
                            <div className="pr-4"><FormattedTextRenderer text={character.personality || 'Описание отсутствует.'} /></div>
                        </ScrollArea>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="biography" className="border-b-0 rounded-lg bg-card shadow-sm">
                    <SectionTrigger title="Биография" icon={<BookOpen />} section="biography" />
                    <AccordionContent className="p-6 pt-0">
                        {isBiographyVisible ? (
                            <ScrollArea className="h-64 w-full">
                                <div className="pr-4"><FormattedTextRenderer text={character.biography || 'Описание отсутствует.'} /></div>
                            </ScrollArea>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground bg-muted/50 rounded-md">
                                <Lock className="w-8 h-8 mb-2" />
                                <p className="font-semibold">Биография скрыта</p>
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="abilities" className="border-b-0 rounded-lg bg-card shadow-sm">
                    <SectionTrigger title="Способности" icon={<Zap />} section="abilities" />
                    <AccordionContent className="p-6 pt-0 text-sm">
                        {areAbilitiesVisible ? (
                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-semibold text-muted-foreground mb-2">Магические способности</h4>
                                    {(character.magic && (character.magic.perception?.length || character.magic.elements?.length || character.magic.teachings?.length || character.magic.reserveLevel || character.magic.faithLevel)) ? (
                                        <div className="space-y-4 pl-2">
                                            {character.magic.perception && character.magic.perception.length > 0 && (
                                            <div>
                                                <h5 className="font-medium">Восприятие магии:</h5>
                                                <p>{character.magic.perception.join(', ')}</p>
                                            </div>
                                            )}
                                            {character.magic.elements && character.magic.elements.length > 0 && (
                                            <div>
                                                <h5 className="font-medium">Стихийная магия:</h5>
                                                <p>{character.magic.elements.join(', ')}</p>
                                            </div>
                                            )}
                                            {character.magic.teachings && character.magic.teachings.length > 0 && (
                                            <div>
                                                <h5 className="font-medium">Учения:</h5>
                                                <p>{character.magic.teachings.join(', ')}</p>
                                            </div>
                                            )}
                                            {character.magic.reserveLevel && (
                                            <div>
                                                <h5 className="font-medium">Уровень резерва:</h5>
                                                <p>{character.magic.reserveLevel}</p>
                                            </div>
                                            )}
                                            {character.magic.faithLevel && (
                                            <div>
                                                <h5 className="font-medium">Уровень веры:</h5>
                                                <p>{character.magic.faithLevel}</p>
                                            </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="pl-2">Магические способности не указаны.</p>
                                    )}
                                </div>
                                
                                 {(character.magic?.magicClarifications || (isOwnerOrAdmin && areAbilitiesVisible)) && (
                                    <div>
                                        <h4 className="font-semibold text-muted-foreground mb-2">Уточнения по магии</h4>
                                        {character.magic?.magicClarifications ? (
                                            <div className="pl-2">
                                                <FormattedTextRenderer text={character.magic.magicClarifications} />
                                            </div>
                                        ) : (
                                            isOwnerOrAdmin && <p className="pl-2">Описание отсутствует.</p>
                                        )}
                                    </div>
                                )}


                                {(character.abilities || (isOwnerOrAdmin && areAbilitiesVisible)) && (
                                    <div>
                                        <h4 className="font-semibold text-muted-foreground mb-2">Немагические навыки</h4>
                                        {character.abilities ? (
                                            <div className="pl-2">
                                                <FormattedTextRenderer text={character.abilities} />
                                            </div>
                                        ) : (
                                            isOwnerOrAdmin && <p className="pl-2">Описание отсутствует.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                         ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground bg-muted/50 rounded-md">
                                <Lock className="w-8 h-8 mb-2" />
                                <p className="font-semibold">Способности скрыты</p>
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="weaknesses" className="border-b-0 rounded-lg bg-card shadow-sm">
                    <SectionTrigger title="Слабости" icon={<ShieldOff />} section="weaknesses" />
                    <AccordionContent className="p-6 pt-0">
                        {areWeaknessesVisible ? (
                           character.weaknesses ? (
                                <ScrollArea className="h-40 w-full">
                                    <div className="pr-4"><FormattedTextRenderer text={character.weaknesses} /></div>
                                </ScrollArea>
                           ) : (
                               <p className="text-sm">Информация отсутствует.</p>
                           )
                        ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground bg-muted/50 rounded-md">
                                <Lock className="w-8 h-8 mb-2" />
                                <p className="font-semibold">Слабости скрыты</p>
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="additional" className="border-b-0 rounded-lg bg-card shadow-sm">
                    <AccordionTrigger className="w-full p-4 hover:no-underline">
                        <CardTitle className="flex items-center gap-2 text-lg"><BookUser /> Дополнительно</CardTitle>
                    </AccordionTrigger>
                    <AccordionContent className="p-6 pt-0 divide-y">
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
                            title="Личный дневник"
                            section="diary"
                            isVisible={!!character.diary}
                            isEmpty={!character.diary}
                            content={<p className="whitespace-pre-wrap text-sm pt-2">{character.diary}</p>}
                        />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            
            {(combinedGallery.length > 0 || isAdmin) && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2"><Camera /> Колдоснимки</CardTitle>
                        {isAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => setEditingState({ type: 'section', section: 'gallery' })} className="shrink-0 h-8 w-8 self-center">
                                <PlusCircle className="w-4 h-4" />
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                         {combinedGallery.length > 0 ? (
                            <ScrollArea className={cn(combinedGallery.length > 6 && "h-96")}>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pr-4">
                                    {combinedGallery.map((img, index) => {
                                        if (!img || !img.url) return null;
                                        return (
                                            <button key={img.id || index} className="relative aspect-square bg-muted/50 rounded-lg" onClick={() => setSelectedGalleryItem(img)}>
                                                <Image
                                                    src={img.url}
                                                    alt={`Gallery image ${img.id}`}
                                                    fill
                                                    style={{ objectFit: 'contain' }}
                                                    className="rounded-lg"
                                                />
                                            </button>
                                        )
                                    })}
                                </div>
                            </ScrollArea>
                        ) : (
                             <p className="text-sm text-muted-foreground text-center py-4">В галерее пока нет изображений.</p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );

    const renderRelationships = () => (
         <Accordion type="multiple" className="w-full space-y-6">
                <AccordionItem value="relationships" className="border-b-0 rounded-lg bg-card shadow-sm">
                <div className="flex justify-between items-center w-full p-4">
                    <AccordionTrigger className="flex-1 hover:no-underline p-0">
                        <CardTitle className="flex items-center gap-2 text-lg"><HeartHandshake /> Отношения</CardTitle>
                    </AccordionTrigger>
                    {isOwnerOrAdmin && (
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingState({ type: 'relationship', mode: 'add' })}} className="shrink-0 self-center ml-2 h-8 w-8">
                            <PlusCircle className="h-4 h-4" />
                        </Button>
                    )}
                </div>
                <AccordionContent className="p-6 pt-0">
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
                </AccordionContent>
            </AccordionItem>
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="flex items-center gap-2"><Users /> Семейное положение</CardTitle>
                    {isOwnerOrAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => setEditingState({ type: 'section', section: 'marriage' })} className="shrink-0 h-8 w-8 self-start sm:self-center">
                            <Edit className="w-4 h-4" />
                        </Button>
                    )}
                </CardHeader>
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

            {currentUser && currentUser.id !== owner.id && <RelationshipActions targetCharacter={character} />}
        </Accordion>
    );

    const renderInventory = () => {
        const lowercasedSearch = inventorySearch.toLowerCase();
    
        return (
            <div className="space-y-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Поиск в инвентаре..."
                        className="pl-9"
                        value={inventorySearch}
                        onChange={(e) => setInventorySearch(e.target.value)}
                    />
                </div>
                {inventoryLayout.map(section => {
                    const filteredCategories = section.categories
                        .map(cat => {
                            if (cat.key === 'ключи' && !isOwnerOrAdmin) {
                                return { cat, items: [], hasContent: false };
                            }
                            if (cat.key === 'предприятия') {
                                const filteredShops = ownedShops.filter(shop => shop.title.toLowerCase().includes(lowercasedSearch));
                                return { cat, items: filteredShops, hasContent: filteredShops.length > 0 };
                            }
    
                            if (!isAdmin && cat.key === 'услуги') {
                                return { cat, items: [], hasContent: false };
                            }
    
                            const items = (inventory[cat.key as keyof typeof inventory] || []) as InventoryItem[];
                            let visibleItems = cat.key === 'питомцы' ? items.filter(i => !FAMILIARS_BY_ID[i.id as keyof typeof FAMILIARS_BY_ID]) : items;
    
                            if (lowercasedSearch) {
                                visibleItems = visibleItems.filter(item => item.name.toLowerCase().includes(lowercasedSearch));
                            }
    
                            return { cat, items: visibleItems, hasContent: visibleItems.length > 0 };
                        })
                        .filter(c => c.hasContent);
    
                    const hasFamiliars = section.title === 'Инвентарь' && character.familiarCards?.length > 0;
                    
                    const shouldRenderSection = filteredCategories.length > 0 || hasFamiliars;

                    if (!shouldRenderSection) {
                        return null;
                    }
    
                    return (
                        <Card key={section.title}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <section.icon className="w-5 h-5" /> {section.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="multiple" className="w-full" defaultValue={inventorySearch ? filteredCategories.map(c => c.cat.key) : undefined}>
                                    {hasFamiliars && (
                                        <AccordionItem value="familiars">
                                            <AccordionTrigger><ShieldAlert className="mr-2 w-4 h-4" />Фамильяры ({character.familiarCards.length})</AccordionTrigger>
                                            <AccordionContent>
                                                <FamiliarsSection character={character} />
                                            </AccordionContent>
                                        </AccordionItem>
                                    )}
                                    {filteredCategories.map(({ cat, items }) => {
                                        if (cat.key === 'предприятия') {
                                            return (
                                                <AccordionItem key={cat.key} value={cat.key}>
                                                    <AccordionTrigger>
                                                        <Building className="mr-2 w-4 h-4" />
                                                        {cat.label} ({(items as Shop[]).length})
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <ul className="space-y-1 text-sm pt-2">
                                                            {(items as Shop[]).map(shop => (
                                                                <li key={shop.id}>
                                                                    <Link href={`/market/${shop.id}`} className="hover:underline">{shop.title}</Link>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            );
                                        }
    
                                        return (
                                            <AccordionItem key={cat.key} value={cat.key}>
                                                <AccordionTrigger>
                                                    <cat.icon className="mr-2 w-4 h-4" />{cat.label} ({(items as InventoryItem[]).length})
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <ul className="sm:columns-2 gap-x-6 text-[13px] pt-2">
                                                        {(items as InventoryItem[]).map(item => (
                                                            <li key={item.id} className="break-inside-avoid-column pb-1">
                                                                <button 
                                                                    className="w-full text-left p-1.5 rounded-md hover:bg-muted/50 transition-colors"
                                                                    onClick={() => setSelectedItem({ ...item, category: cat.key as InventoryCategory })}
                                                                >
                                                                    <span className="break-words">
                                                                        {item.name}
                                                                        {item.quantity > 1 && <span className="whitespace-nowrap">{` (${item.quantity})`}</span>}
                                                                    </span>
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
        );
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
                    <p className="text-muted-foreground">{character.activity}</p>
                    <p className="text-sm text-muted-foreground">Владелец: {owner.name}</p>
                </div>
            </header>
            
            <div className="max-w-5xl mx-auto">
                 {character.bannerImage && (
                    <div className="relative w-full h-48 sm:h-56 md:h-64 rounded-lg overflow-hidden group mb-6">
                        <Image
                            src={character.bannerImage}
                            alt={`${character.name} banner`}
                            fill
                            priority
                            style={{ objectFit: 'cover' }}
                            className="bg-muted/30"
                            data-ai-hint="character banner"
                        />
                         {isAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => setEditingState({ type: 'section', section: 'gallery' })} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 hover:bg-background/80">
                                <Edit className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                )}
                 
                {isMobile ? (
                    <Tabs defaultValue="main" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="main">Основное</TabsTrigger>
                            <TabsTrigger value="anketa">Анкета</TabsTrigger>
                            <TabsTrigger value="relationships">Отношения</TabsTrigger>
                            <TabsTrigger value="inventory">Инвентарь</TabsTrigger>
                        </TabsList>
                        <TabsContent value="main" className="mt-6 space-y-6">
                            {renderMainInfo()}
                             <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="achievements" className="border-b-0 rounded-lg bg-card shadow-sm">
                                    <div className="flex justify-between items-center w-full p-4">
                                        <AccordionTrigger className="flex-1 hover:no-underline p-0">
                                            <CardTitle className="flex items-center gap-2 text-lg"><Award /> Достижения</CardTitle>
                                        </AccordionTrigger>
                                        {isOwnerOrAdmin && (
                                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingState({ type: 'accomplishment', mode: 'add' })}} className="shrink-0 self-center ml-2 h-8 w-8">
                                                <PlusCircle className="h-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <AccordionContent className="p-6 pt-0">
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
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
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
                        </TabsContent>
                        <TabsContent value="anketa" className="mt-6">
                            {renderAnketa()}
                        </TabsContent>
                        <TabsContent value="relationships" className="mt-6">
                            {renderRelationships()}
                        </TabsContent>
                        <TabsContent value="inventory" className="mt-6">
                            {renderInventory()}
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Main Content Column (Left on Large Screens) */}
                        <div className="w-full lg:w-2/3 space-y-6 order-2 lg:order-1">
                            {renderAnketa()}
                             <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><History /> История популярности</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-48 pr-3">
                                        <div className="space-y-3">
                                        {sortedPopularityHistory.map((log: PopularityLog) => (
                                            <div key={log.id} className="text-xs p-2 bg-muted/50 rounded-md">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-semibold flex-1 pr-2">{log.reason}</p>
                                                    <p className={cn("font-mono font-semibold", log.amount > 0 ? 'text-green-600' : 'text-destructive')}>
                                                        {log.amount > 0 ? '+' : ''}{log.amount.toLocaleString()}
                                                    </p>
                                                </div>
                                                <p className="text-muted-foreground">{new Date(log.date).toLocaleString()}</p>
                                            </div>
                                        ))}
                                            {sortedPopularityHistory.length === 0 && <p className="text-sm text-muted-foreground text-center">Истории пока нет.</p>}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>
                        {/* Sidebar Column (Right on Large Screens) */}
                        <div className="w-full lg:w-1/3 flex flex-col space-y-6 order-1 lg:order-2">
                            {renderMainInfo()}
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="achievements" className="border-b-0 rounded-lg bg-card shadow-sm">
                                    <div className="flex justify-between items-center w-full p-4">
                                        <AccordionTrigger className="flex-1 hover:no-underline p-0">
                                            <CardTitle className="flex items-center gap-2 text-lg"><Award /> Достижения</CardTitle>
                                        </AccordionTrigger>
                                        {isOwnerOrAdmin && (
                                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingState({ type: 'accomplishment', mode: 'add' })}} className="shrink-0 self-center ml-2 h-8 w-8">
                                                <PlusCircle className="h-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <AccordionContent className="p-6 pt-0">
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
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
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
                           {renderRelationships()}
                           {renderInventory()}
                        </div>
                    </div>
                )}
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
                    <DialogContent className="max-w-md sm:max-w-2xl p-0">
                        <div className="sm:grid sm:grid-cols-2 sm:items-start">
                            {selectedItem.image && (
                                <div className="relative w-full aspect-square sm:h-full bg-muted rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none overflow-hidden">
                                    <Image src={selectedItem.image} alt={selectedItem.name} fill style={{objectFit: "contain"}} data-ai-hint="inventory item" />
                                </div>
                            )}
                            <div className={cn("flex flex-col h-full p-6", !selectedItem.image && "sm:col-span-2")}>
                                <DialogHeader className="flex-grow">
                                    <DialogTitle>{selectedItem.name}</DialogTitle>
                                    <ScrollArea className="max-h-64 pr-4 mt-2">
                                        <div className="text-sm text-muted-foreground">
                                           <FormattedTextRenderer text={selectedItem.description || 'Описание отсутствует.'} />
                                        </div>
                                    </ScrollArea>
                                </DialogHeader>

                                {isOwnerOrAdmin && selectedItem.quantity > 1 && (
                                  <div className="mt-4 space-y-2">
                                    <Label htmlFor="consume-quantity">Количество</Label>
                                    <Input
                                      id="consume-quantity"
                                      type="number"
                                      value={consumeQuantity}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '') {
                                          setConsumeQuantity('');
                                        } else {
                                          const val = parseInt(value, 10);
                                          if (!isNaN(val)) {
                                            if (val > selectedItem.quantity) {
                                              setConsumeQuantity(selectedItem.quantity);
                                            } else {
                                              setConsumeQuantity(val);
                                            }
                                          }
                                        }
                                      }}
                                      min={1}
                                      max={selectedItem.quantity}
                                    />
                                  </div>
                                )}

                                {isOwnerOrAdmin && (
                                    <DialogFooter className="mt-4">
                                        <Button 
                                            onClick={handleConsumeItem} 
                                            disabled={isConsuming || !consumeQuantity || consumeQuantity <= 0}
                                            variant={getItemActionProps(selectedItem.category).variant}
                                            className="w-full"
                                        >
                                            {isConsuming ? 'Обработка...' : `${getItemActionProps(selectedItem.category).text}${selectedItem.quantity > 1 ? ` (x${consumeQuantity || 0})` : ''}`}
                                        </Button>
                                    </DialogFooter>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
            
             <Dialog open={!!selectedGalleryItem} onOpenChange={() => setSelectedGalleryItem(null)}>
                <DialogContent className="max-w-4xl w-[90vw] h-[90vh] bg-transparent border-none shadow-none p-0 flex items-center justify-center">
                    <DialogTitle className="sr-only">Просмотр</DialogTitle>
                    {selectedGalleryItem?.url && (
                        <div className="relative w-full h-full">
                            <Image 
                                src={selectedGalleryItem.url} 
                                alt="Увеличенное изображение из галереи" 
                                fill
                                className="rounded-lg object-contain"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>


        </div>
    );
}
