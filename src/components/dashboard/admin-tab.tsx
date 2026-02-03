
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { DollarSign, Clock, Users, ShieldAlert, UserCog, Trophy, Gift, Star, MinusCircle, Trash2, Wand2, PlusCircle, VenetianMask, CalendarClock, History, DatabaseZap, Banknote, Landmark, Cat, PieChart, Info, AlertTriangle, Bell, CheckCircle, Store, PackagePlus, Edit, BadgeCheck, FileText, Send, Gavel, Eye, UserMinus, FlaskConical, Compass, Save, Merge } from 'lucide-react';
import type { UserStatus, UserRole, User, FamiliarCard, BankAccount, WealthLevel, FamiliarRank, Shop, InventoryCategory, AdminGiveItemForm, InventoryItem, CitizenshipStatus, TaxpayerStatus, CharacterPopularityUpdate, AlchemyRecipe, GameSettings, HuntingLocation, HuntReward, Potion, AlchemyIngredient, ShopItem } from '@/lib/types';
import { ALL_ACHIEVEMENTS, MOODLETS_DATA, WEALTH_LEVELS, STARTING_CAPITAL_LEVELS, INVENTORY_CATEGORIES, POPULARITY_EVENTS } from '@/lib/data';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { SearchableSelect } from '../ui/searchable-select';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { differenceInDays } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import { Switch } from '../ui/switch';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ImageKitUploader from './imagekit-uploader';
import { SearchableMultiSelect } from '../ui/searchable-multi-select';
import AdminFamiliarsTab from './admin-familiars-tab';
import { ALL_ITEMS_FOR_ALCHEMY, ALCHEMY_POTIONS, ALCHEMY_INGREDIENTS } from '@/lib/alchemy-data';
import { ScrollArea } from '../ui/scroll-area';

const rankNames: Record<FamiliarRank, string> = {
    'мифический': 'Мифический',
    'ивентовый': 'Ивентовый',
    'легендарный': 'Легендарный',
    'редкий': 'Редкий',
    'обычный': 'Обычный'
};

const rankOrder: FamiliarRank[] = ['мифический', 'легендарный', 'редкий', 'обычный'];

const rankOptions: { value: FamiliarRank, label: string }[] = [
    { value: 'обычный', label: 'Обычный' },
    { value: 'редкий', label: 'Редкий' },
    { value: 'легендарный', label: 'Легендарный' },
    { value: 'мифический', label: 'Мифический' },
    { value: 'ивентовый', label: 'Ивентовый' },
];

const citizenshipStatusOptions: { value: CitizenshipStatus, label: string }[] = [
    { value: 'citizen', label: 'Гражданин' },
    { value: 'non-citizen', label: 'Не гражданин' },
    { value: 'refugee', label: 'Беженец' },
];

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


export default function AdminTab() {
  const { 
    addPointsToUser, 
    addPointsToAllUsers,
    updateUserStatus, 
    updateUserRole, 
    grantAchievementToUser, 
    fetchUsersForAdmin, 
    clearPointHistoryForUser,
    clearAllPointHistories,
    addMoodletToCharacter, 
    removeMoodletFromCharacter, 
    removeFamiliarFromCharacter,
    lastWeeklyBonusAwardedAt,
    processWeeklyBonus,
    recoverFamiliarsFromHistory,
    recoverAllFamiliars,
    addBankPointsToCharacter,
    processMonthlySalary,
    updateCharacterWealthLevel,
    giveAnyFamiliarToCharacter,
    updateShopOwner,
    removeShopOwner,
    fetchAllShops,
    adminGiveItemToCharacter,
    adminUpdateItemInCharacter,
    adminDeleteItemFromCharacter,
    adminUpdateCharacterStatus,
    adminUpdateShopLicense,
    processAnnualTaxes,
    sendMassMail,
    clearAllMailboxes,
    updatePopularity,
    clearAllPopularityHistories,
    addAlchemyRecipe,
    fetchAlchemyRecipes,
    updateAlchemyRecipe,
    deleteAlchemyRecipe,
    familiarsById,
    allFamiliars,
    gameSettings,
    updateGameSettings,
    mergeUserData,
    adminAddShop,
  } = useUser();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: isUsersLoading, refetch: refetchAdminUsers } = useQuery<User[]>({
    queryKey: ['adminUsers'],
    queryFn: fetchUsersForAdmin,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  const { data: allShops = [], isLoading: isShopsLoading } = useQuery<Shop[]>({
    queryKey: ['allShops'],
    queryFn: fetchAllShops,
  });

  const { data: allRecipes = [], refetch: refetchRecipes } = useQuery<AlchemyRecipe[]>({
      queryKey: ['alchemyRecipes'],
      queryFn: fetchAlchemyRecipes,
  });

  const allItemsMap = useMemo(() => {
    const map = new Map<string, ShopItem | AlchemyIngredient | Potion>();
    if (isShopsLoading) return map;
    const allItems = [
        ...(allShops.flatMap(shop => shop.items || [])),
        ...ALL_ITEMS_FOR_ALCHEMY,
    ];
    allItems.forEach(item => {
        if (item) map.set(item.id, item);
    });
    return map;
}, [allShops, isShopsLoading]);
  
  // Recovery state
  const [recoveryUserId, setRecoveryUserId] = useState('');
  const [recoveryCharId, setRecoveryCharId] = useState('');
  const [recoveryOldName, setRecoveryOldName] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [isRecoveringAll, setIsRecoveringAll] = useState(false);

  // Points state
  const [awardSelectedUserId, setAwardSelectedUserId] = useState<string>('');
  const [statusSelectedUserId, setStatusSelectedUserId] = useState<string>('');
  const [roleSelectedUserId, setRoleSelectedUserId] = useState<string>('');
  const [clearHistoryUserId, setClearHistoryUserId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | ''>('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  
  // Familiar state
  const [giveFamiliarUserId, setGiveFamiliarUserId] = useState('');
  const [giveFamiliarCharId, setGiveFamiliarCharId] = useState('');
  const [giveFamiliarId, setGiveFamiliarId] = useState('');
  const [gachaChances, setGachaChances] = useState(gameSettings.gachaChances);


  // Achievement state
  const [achieveUserId, setAchieveUserId] = useState<string>('');
  const [achieveId, setAchieveId] = useState<string>('');

  const [points, setPoints] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const [deductSelectedUserId, setDeductSelectedUserId] = useState<string>('');
  const [deductPoints, setDeductPoints] = useState<string>('');
  const [deductReason, setDeductReason] = useState<string>('');

  // Moodlet state
  const [moodletUserId, setMoodletUserId] = useState<string>('');
  const [moodletCharId, setMoodletCharId] = useState<string>('');
  const [moodletId, setMoodletId] = useState<string>('');
  const [moodletDuration, setMoodletDuration] = useState<number>(7);
  const [moodletSource, setMoodletSource] = useState('');

  // Familiar removal state
  const [removeFamiliarUserId, setRemoveFamiliarUserId] = useState<string>('');
  const [removeFamiliarCharId, setRemoveFamiliarCharId] = useState<string>('');
  const [removeFamiliarCardId, setRemoveFamiliarCardId] = useState<string>('');
  
  // Economy state
  const [ecoUserId, setEcoUserId] = useState('');
  const [ecoCharId, setEcoCharId] = useState('');
  const [isDeductingEco, setIsDeductingEco] = useState(false);
  const [ecoAmount, setEcoAmount] = useState<Partial<Omit<BankAccount, 'history'>>>({ platinum: 0, gold: 0, silver: 0, copper: 0});
  const [ecoReason, setEcoReason] = useState('');
  const [ecoWealthLevel, setEcoWealthLevel] = useState<WealthLevel | ''>('');
  const [charStatus, setCharStatus] = useState<{ taxpayerStatus: TaxpayerStatus }>({ taxpayerStatus: 'taxable' });
  
  // Starting capital state
  const [capitalUserId, setCapitalUserId] = useState('');
  const [capitalCharId, setCapitalCharId] = useState('');
  const [capitalLevel, setCapitalLevel] = useState('');

  // Weekly bonus state
  const [isProcessingTaxes, setIsProcessingTaxes] = useState(false);
  const [testBonusResult, setTestBonusResult] = useState<string | null>(null);
  const [isTestingBonus, setIsTestingBonus] = useState(false);

  // Shop management state
  const [shopId, setShopId] = useState('');
  const [shopOwnerUserId, setShopOwnerUserId] = useState('');
  const [shopOwnerCharId, setShopOwnerCharId] = useState('');
  const [licenseShopId, setLicenseShopId] = useState('');
  const [shopHasLicense, setShopHasLicense] = useState(false);
  const [newShop, setNewShop] = useState({ title: '', description: '', image: '', aiHint: '' });
  const [isAddingShop, setIsAddingShop] = useState(false);

  
  // Item management state
  const [itemUserId, setItemUserId] = useState('');
  const [itemCharId, setItemCharId] = useState('');
  const [isGivingNewItem, setIsGivingNewItem] = useState(false);
  const [selectedShopItemId, setSelectedShopItemId] = useState('');
  const [newItemData, setNewItemData] = useState<AdminGiveItemForm>({ name: '', description: '', inventoryTag: 'прочее', quantity: 1, image: '' });
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<{ id: string, category: InventoryCategory } | null>(null);
  const [editItemData, setEditItemData] = useState<InventoryItem | null>(null);
  const [existingItemQuantity, setExistingItemQuantity] = useState(1);
  
  // Mass mail state
  const [mailSubject, setMailSubject] = useState('');
  const [mailContent, setMailContent] = useState('');
  const [mailSender, setMailSender] = useState('Администрация');
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [sendToAll, setSendToAll] = useState(true);
  const [mailRecipients, setMailRecipients] = useState<string[]>([]);
  
  // Popularity state
  const [popularityCharIds, setPopularityCharIds] = useState<string[]>([]);
  const [popularityUpdates, setPopularityUpdates] = useState<Record<string, { events: string[] }>>({});
  const [popularityDescription, setPopularityDescription] = useState('');
  const [isProcessingPopularity, setIsProcessingPopularity] = useState(false);
  
  // Alchemy State
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [newRecipe, setNewRecipe] = useState<Omit<AlchemyRecipe, 'id' | 'createdAt'>>({ name: '', components: [], resultPotionId: '', outputQty: 1, difficulty: 1 });
  const [isSubmittingRecipe, setIsSubmittingRecipe] = useState(false);
  
   // Hunting state
  const [editingHuntLocation, setEditingHuntLocation] = useState<Partial<HuntingLocation> | null>(null);

  // Merge state
  const [sourceMergeUserId, setSourceMergeUserId] = useState('');
  const [targetMergeUserId, setTargetMergeUserId] = useState('');
  const [isMerging, setIsMerging] = useState(false);


  useEffect(() => {
    if (editingRecipeId) {
        const recipeToEdit = allRecipes.find(r => r.id === editingRecipeId);
        if (recipeToEdit) {
            setNewRecipe({
                name: recipeToEdit.name || '',
                components: recipeToEdit.components || [],
                resultPotionId: recipeToEdit.resultPotionId,
                outputQty: recipeToEdit.outputQty || 1,
                difficulty: recipeToEdit.difficulty || 1,
            });
        }
    } else {
        if (newRecipe.name !== '' || newRecipe.components.length > 0 || newRecipe.resultPotionId !== '' || newRecipe.outputQty !== 1 || newRecipe.difficulty !== 1) {
            setNewRecipe({ name: '', components: [], resultPotionId: '', outputQty: 1, difficulty: 1 });
        }
    }
  }, [editingRecipeId, allRecipes]);

  useEffect(() => {
    const newUpdates: Record<string, { events: string[] }> = {};
    popularityCharIds.forEach(id => {
        newUpdates[id] = popularityUpdates[id] || { events: [] };
    });
    setPopularityUpdates(newUpdates);
  }, [popularityCharIds]);


  const { toast } = useToast();

  const refetchUsers = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
  }, [queryClient]);
  

  useEffect(() => {
    if (selectedInventoryItem) {
        const user = users.find(u => u.id === itemUserId);
        const character = user?.characters.find(c => c.id === itemCharId);
        if (character && character.inventory) {
            const item = (character.inventory[selectedInventoryItem.category] || []).find(i => i.id === selectedInventoryItem.id);
            if (item) {
                setEditItemData(item);
            } else {
                setEditItemData(null);
            }
        } else {
            setEditItemData(null);
        }
    } else {
        setEditItemData(null);
    }
}, [selectedInventoryItem, itemUserId, itemCharId, users]);

  const selectedCharacterForStatus = useMemo(() => {
    if (!ecoUserId || !ecoCharId) return null;
    const user = users.find(u => u.id === ecoUserId);
    return user?.characters.find(c => c.id === ecoCharId) || null;
  }, [ecoUserId, ecoCharId, users]);
  
  useEffect(() => {
      if (selectedCharacterForStatus) {
          setCharStatus({
              taxpayerStatus: selectedCharacterForStatus.taxpayerStatus || 'taxable',
          });
      }
  }, [selectedCharacterForStatus]);

  const selectedShopForLicense = useMemo(() => {
      if (!licenseShopId) return null;
      return allShops.find(s => s.id === licenseShopId);
  }, [licenseShopId, allShops]);

  useEffect(() => {
      if (selectedShopForLicense) {
          setShopHasLicense(selectedShopForLicense.hasLicense || false);
      }
  }, [selectedShopForLicense]);

    const allShopItems = useMemo(() => {
        return allShops.flatMap(shop =>
            (shop.items || []).map(item => {
                const name = item.inventoryItemName || item.name;
                const description = item.inventoryItemDescription || item.description || '';
                const image = item.inventoryItemImage || item.image || '';

                return {
                    label: `${name} (${shop.title})`,
                    value: JSON.stringify({ 
                        name: name,
                        description: description,
                        inventoryTag: item.inventoryTag, 
                        quantity: 1, 
                        image: image 
                    })
                };
            })
        );
    }, [allShops]);

  const handleRecovery = async () => {
    if (!recoveryUserId || !recoveryCharId) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Выберите пользователя и персонажа.' });
        return;
    }
    setIsRecovering(true);
    try {
        const recoveredCount = await recoverFamiliarsFromHistory(recoveryUserId, recoveryCharId, recoveryOldName || undefined);
        toast({
            title: 'Восстановление завершено',
            description: `Восстановлено ${recoveredCount} фамильяров.`
        });
        await refetchUsers();
        setRecoveryUserId('');
        setRecoveryCharId('');
        setRecoveryOldName('');
    } catch (error) {
        console.error("Recovery failed:", error);
        toast({ variant: 'destructive', title: 'Ошибка восстановления', description: 'Не удалось завершить процесс.' });
    } finally {
        setIsRecovering(false);
    }
  };

  const handleRecoverAll = async () => {
    setIsRecoveringAll(true);
    try {
        const { totalRecovered, usersAffected } = await recoverAllFamiliars();
        toast({
            title: 'Массовое восстановление завершено',
            description: `Всего восстановлено ${totalRecovered} фамильяров у ${usersAffected} игроков.`
        });
        await refetchUsers();
    } catch (error) {
        console.error("Mass recovery failed:", error);
        toast({ variant: 'destructive', title: 'Ошибка восстановления', description: 'Не удалось завершить процесс.' });
    } finally {
        setIsRecoveringAll(false);
    }
  }

  const handleAwardPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    const pointsToAward = parseInt(points, 10);

    if (!awardSelectedUserId || !pointsToAward || !reason) {
      toast({
        variant: "destructive",
        title: "Отсутствует информация",
        description: "Пожалуйста, выберите пользователя, введите баллы и причину.",
      });
      return;
    }
    
    if (awardSelectedUserId === 'all') {
        await addPointsToAllUsers(pointsToAward, reason);
        toast({
            title: "Баллы начислены всем!",
            description: `Начислено по ${pointsToAward} баллов каждому игроку.`,
        });
    } else {
        await addPointsToUser(awardSelectedUserId, pointsToAward, reason);
        toast({
            title: "Баллы начислены!",
            description: `Начислено ${pointsToAward} баллов.`,
        });
    }
    
    await refetchUsers();

    setAwardSelectedUserId('');
    setPoints('');
    setReason('');
  };

   const handleDeductPoints = async (e: React.FormEvent) => {
    e.preventDefault();
     const pointsToDeductNum = parseInt(deductPoints, 10);

    if (!deductSelectedUserId || !pointsToDeductNum || !deductReason) {
      toast({
        variant: 'destructive',
        title: 'Отсутствует информация',
        description: 'Пожалуйста, выберите пользователя, введите баллы для списания и причину.',
      });
      return;
    }

    const pointsToDeduct = -Math.abs(pointsToDeductNum);
    await addPointsToUser(deductSelectedUserId, pointsToDeduct, deductReason);
    await refetchUsers();
    
    toast({
      title: 'Баллы списаны!',
      description: `Списано ${Math.abs(pointsToDeduct)} баллов.`,
      variant: 'destructive',
    });

    setDeductSelectedUserId('');
    setDeductPoints('');
    setDeductReason('');
  };

  const handleChangeStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusSelectedUserId || !selectedStatus) {
        toast({
            variant: "destructive",
            title: "Отсутствует информация",
            description: "Пожалуйста, выберите пользователя и статус.",
        });
        return;
    }
    await updateUserStatus(statusSelectedUserId, selectedStatus);
    await refetchUsers();
    toast({
        title: "Статус обновлен!",
        description: `Статус пользователя изменен на "${selectedStatus}".`,
    });
    setStatusSelectedUserId('');
    setSelectedStatus('');
  };

   const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleSelectedUserId || !selectedRole) {
      toast({
        variant: "destructive",
        title: "Отсутствует информация",
        description: "Пожалуйста, выберите пользователя и роль.",
      });
      return;
    }
    await updateUserRole(roleSelectedUserId, selectedRole);
    await refetchUsers();
    toast({
      title: "Роль обновлена!",
      description: `Роль пользователя изменен на "${selectedRole}".`,
    });
    setRoleSelectedUserId('');
    setSelectedRole('');
  };

  const weeklyBonusStatus = useMemo(() => {
    if (!lastWeeklyBonusAwardedAt || new Date(lastWeeklyBonusAwardedAt).getFullYear() < 2000) {
        return { canAward: true, daysSinceLast: 7, daysUntilNext: 0 };
    }
    const daysSinceLast = differenceInDays(new Date(), new Date(lastWeeklyBonusAwardedAt));
    const canAward = daysSinceLast >= 7;
    const daysUntilNext = canAward ? 0 : 7 - daysSinceLast;
    return { canAward, daysSinceLast, daysUntilNext };
  }, [lastWeeklyBonusAwardedAt]);

  const handleTestBonus = async () => {
    setIsTestingBonus(true);
    setTestBonusResult(null);
    try {
        const activeUsers = users.filter(u => u.status === 'активный');
        const results = activeUsers.map(user => {
            const popularityPoints = (user.characters || []).reduce((acc, char) => acc + (char.popularity ?? 0), 0);
            const totalBonus = 800 + popularityPoints;
            return `${user.name}: ${totalBonus} баллов`;
        });
        
        if (results.length > 0) {
            setTestBonusResult(`Результаты тестового начисления:\n- ${results.join('\n- ')}`);
        } else {
            setTestBonusResult("Нет активных пользователей для начисления бонуса.");
        }

    } catch (e) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось рассчитать тестовый бонус.' });
    } finally {
        setIsTestingBonus(false);
    }
  };

  const handleInactivityPenalty = async () => {
    const inactiveUsers = users.filter(u => u.status === 'неактивный');
    for(const user of inactiveUsers) {
        await addPointsToUser(user.id, -1000, 'Еженедельный штраф за неактивность');
    }
     await refetchUsers();
    toast({
        title: "Применен штраф за неактивность",
        description: `Штраф применен к ${inactiveUsers.length} неактивным пользователям.`,
    });
  };


  const handleGiveFamiliar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giveFamiliarUserId || !giveFamiliarCharId || !giveFamiliarId) {
      toast({
        variant: "destructive",
        title: "Отсутствует информация",
        description: "Пожалуйста, выберите пользователя, персонажа и фамильяра.",
      });
      return;
    }
    
    await giveAnyFamiliarToCharacter(giveFamiliarUserId, giveFamiliarCharId, giveFamiliarId);
    await refetchUsers();

    const familiarName = familiarsById[giveFamiliarId]?.name;

    toast({
      title: "Фамильяр выдан!",
      description: `Фамильяр "${familiarName}" выдан персонажу.`,
    });
    
    setGiveFamiliarUserId('');
    setGiveFamiliarCharId('');
    setGiveFamiliarId('');
  }

  const handleGrantAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achieveUserId || !achieveId) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Пожалуйста, выберите пользователя и ачивку.' });
      return;
    }
    
    await grantAchievementToUser(achieveUserId, achieveId);
    await refetchUsers();

    const achievementName = ALL_ACHIEVEMENTS.find(a => a.id === achieveId)?.name;
    
    toast({ title: 'Ачивка выдана!', description: `Ачивка "${achievementName}" выдана.` });

    setAchieveUserId('');
    setAchieveId('');
  };

  const handleClearHistory = async () => {
    if (!clearHistoryUserId) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Пожалуйста, выберите пользователя.' });
      return;
    }
    
    await clearPointHistoryForUser(clearHistoryUserId);
    await refetchUsers();

    toast({ title: 'История очищена!', description: `Журнал баллов был успешно очищен.` });
    
    setClearHistoryUserId('');
  };
  
  const handleClearAllHistories = async () => {
    await clearAllPointHistories();
    await refetchUsers();
    toast({ title: 'Все истории очищены!', description: `Журналы баллов всех пользователей были успешно очищены.` });
  };
  
   const handleClearAllPopularityHistories = async () => {
    try {
        await clearAllPopularityHistories();
        await refetchUsers();
        toast({ title: "История популярности очищена" });
    } catch(e) {
        const msg = e instanceof Error ? e.message : 'Произошла неизвестная ошибка.';
        toast({ variant: 'destructive', title: 'Ошибка', description: msg });
    }
  };


  const handleClearAllMailboxes = async () => {
    try {
        await clearAllMailboxes();
        await refetchUsers();
        toast({ title: "Все почтовые ящики очищены" });
    } catch(e) {
        const msg = e instanceof Error ? e.message : 'Произошла неизвестная ошибка.';
        toast({ variant: 'destructive', title: 'Ошибка', description: msg });
    }
  };


  const handleAddMoodlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moodletUserId || !moodletCharId || !moodletId || moodletDuration <= 0) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Пожалуйста, заполните все поля для мудлета.' });
      return;
    }
    await addMoodletToCharacter(moodletUserId, moodletCharId, moodletId, moodletDuration, moodletSource);
    
    const moodletName = MOODLETS_DATA[moodletId as keyof typeof MOODLETS_DATA].name;
    toast({ title: 'Мудлет добавлен!', description: `Мудлет "${moodletName}" добавлен персонажу на ${moodletDuration} дней.` });
    
    await refetchUsers();
    
    setMoodletUserId('');
    setMoodletCharId('');
    setMoodletId('');
    setMoodletDuration(7);
    setMoodletSource('');
  };

  const handleRemoveMoodlet = async (userId: string, charId: string, moodletId: string) => {
      await removeMoodletFromCharacter(userId, charId, moodletId);
      const moodletName = MOODLETS_DATA[moodletId as keyof typeof MOODLETS_DATA].name;
      toast({ title: 'Мудлет удален!', description: `Мудлет "${moodletName}" удален у персонажа.`, variant: 'destructive' });
      await refetchUsers();
  };

   const handleRemoveFamiliar = async () => {
    if (!removeFamiliarUserId || !removeFamiliarCharId || !removeFamiliarCardId) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Пожалуйста, выберите пользователя, персонажа и карту.' });
      return;
    }

    try {
      await removeFamiliarFromCharacter(removeFamiliarUserId, removeFamiliarCharId, removeFamiliarCardId);
      const cardName = familiarsById[removeFamiliarCardId]?.name || 'Карта';
      toast({ title: 'Карта удалена!', description: `${cardName} была удалена у персонажа.` });
      await refetchUsers();
      
      setRemoveFamiliarUserId('');
      setRemoveFamiliarCharId('');
      setRemoveFamiliarCardId('');
    } catch (error) {
      console.error('Failed to remove familiar card:', error);
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось удалить карту.' });
    }
  };

  // --- Economy Handlers ---

  const handleEcoAmountChange = (currency: keyof Omit<BankAccount, 'history'>, value: string) => {
      const numValue = parseInt(value, 10) || 0;
      setEcoAmount(prev => ({ ...prev, [currency]: numValue }));
  };

  const handleEconomySubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!ecoUserId || !ecoCharId || !ecoReason) {
          toast({ variant: 'destructive', title: 'Ошибка', description: 'Выберите пользователя, персонажа и укажите причину.' });
          return;
      }
      
      const finalAmount: Partial<Omit<BankAccount, 'history'>> = { ...ecoAmount };
      if (isDeductingEco) {
          finalAmount.platinum = -Math.abs(finalAmount.platinum || 0);
          finalAmount.gold = -Math.abs(finalAmount.gold || 0);
          finalAmount.silver = -Math.abs(finalAmount.silver || 0);
          finalAmount.copper = -Math.abs(finalAmount.copper || 0);
      }
      
      await addBankPointsToCharacter(ecoUserId, ecoCharId, finalAmount, ecoReason);
      await refetchUsers();
      toast({ title: 'Успешно!', description: `Счет персонажа обновлен.` });

      // Reset form
      setEcoAmount({ platinum: 0, gold: 0, silver: 0, copper: 0});
      setEcoReason('');
  };

  const handleSalaryPayout = async () => {
      await processMonthlySalary();
      await refetchUsers();
      toast({ title: 'Зарплаты начислены!', description: 'Ежемесячные выплаты были произведены всем персонажам.' });
  };
  
  const handleWealthLevelUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ecoUserId || !ecoCharId || !ecoWealthLevel) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Выберите пользователя, персонажа и уровень достатка.' });
        return;
    }

    await updateCharacterWealthLevel(ecoUserId, ecoCharId, ecoWealthLevel);
    await refetchUsers();
    toast({ title: 'Уровень достатка обновлен!', description: `Новый уровень: ${ecoWealthLevel}.` });

    setEcoWealthLevel('');
  };

  const handleCharacterStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
     if (!ecoUserId || !ecoCharId) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Выберите пользователя и персонажа.' });
        return;
    }
    await adminUpdateCharacterStatus(ecoUserId, ecoCharId, { taxpayerStatus: charStatus.taxpayerStatus });
    await refetchUsers();
    toast({ title: 'Статус персонажа обновлен!' });
  };
  
  const handleTaxCollection = async () => {
    setIsProcessingTaxes(true);
    try {
        const result = await processAnnualTaxes();
        await refetchUsers();
        toast({
            title: 'Налоги собраны!',
            description: `Собрано налогов с ${result.taxedCharactersCount} персонажей на общую сумму ${formatCurrency(result.totalTaxesCollected)}.`,
        });
    } catch (error) {
         const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
        toast({ variant: 'destructive', title: 'Ошибка при сборе налогов', description: errorMessage });
    } finally {
        setIsProcessingTaxes(false);
    }
};

  const handleLicenseUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!licenseShopId) {
          toast({ variant: 'destructive', title: 'Ошибка', description: 'Выберите магазин.' });
          return;
      }
      await adminUpdateShopLicense(licenseShopId, shopHasLicense);
      await queryClient.invalidateQueries({ queryKey: ['allShops'] });
      toast({ title: 'Статус лицензии обновлен!' });
  };

  const handleStartingCapitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capitalUserId || !capitalCharId || !capitalLevel) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Выберите пользователя, персонажа и уровень капитала.' });
        return;
    }

    const selectedLevel = STARTING_CAPITAL_LEVELS.find(level => level.name === capitalLevel);
    if (!selectedLevel) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Выбранный уровень капитала не найден.' });
        return;
    }

    await addBankPointsToCharacter(capitalUserId, capitalCharId, selectedLevel.amount, 'Начисление стартового капитала');
    await refetchUsers();
    toast({ title: 'Стартовый капитал начислен!', description: `Счет персонажа пополнен.` });

    // Reset only the level
    setCapitalLevel('');
  };
  
  const handleAssignShopOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId || !shopOwnerUserId || !shopOwnerCharId) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Пожалуйста, выберите магазин, пользователя и персонажа.' });
        return;
    }

    const user = users.find(u => u.id === shopOwnerUserId);
    const character = user?.characters.find(c => c.id === shopOwnerCharId);
    if (!character) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Выбранный персонаж не найден.' });
        return;
    }
    
    await updateShopOwner(shopId, shopOwnerUserId, shopOwnerCharId, character.name);
    await queryClient.invalidateQueries({ queryKey: ['allShops'] });
    toast({ title: 'Владелец назначен!', description: `Владелец магазина успешно изменен.` });
    
    setShopId('');
    setShopOwnerUserId('');
    setShopOwnerCharId('');
  };

  const handleRemoveShopOwner = async () => {
    if (!shopId) return;
    try {
        await removeShopOwner(shopId);
        toast({ title: 'Владелец снят', description: 'Магазин теперь не имеет владельца.' });
        await queryClient.invalidateQueries({ queryKey: ['allShops'] });
        setShopId('');
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Произошла ошибка";
        toast({ variant: 'destructive', title: "Ошибка", description: msg });
    }
};

  const handleGiveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemUserId || !itemCharId) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Выберите пользователя и персонажа.' });
        return;
    }

    let itemData: AdminGiveItemForm;
    if (isGivingNewItem) {
        if (!newItemData.name || !newItemData.inventoryTag) {
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Для нового предмета укажите название и категорию.' });
            return;
        }
        itemData = newItemData;
    } else {
        if (!selectedShopItemId) {
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Выберите существующий предмет.' });
            return;
        }
        itemData = JSON.parse(selectedShopItemId);
    }
    
    await adminGiveItemToCharacter(itemUserId, itemCharId, itemData);
    await refetchUsers();
    toast({ title: 'Предмет выдан!', description: `"${itemData.name}" добавлен в инвентарь персонажа.` });
    
    // Reset form but keep user and character selected
    setSelectedShopItemId('');
    setNewItemData({ name: '', description: '', inventoryTag: 'прочее', quantity: 1, image: '' });
  };
  
  const handleUpdateItem = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!itemUserId || !itemCharId || !editItemData || !selectedInventoryItem) {
          toast({ variant: 'destructive', title: 'Ошибка', description: 'Не все данные для обновления предмета выбраны.' });
          return;
      }
      await adminUpdateItemInCharacter(itemUserId, itemCharId, editItemData, selectedInventoryItem.category);
      await refetchUsers();
      toast({ title: 'Предмет обновлен!', description: `Данные для "${editItemData.name}" сохранены.` });
      // Reset
      setSelectedInventoryItem(null);
  };
  
  const handleDeleteItem = async () => {
       if (!itemUserId || !itemCharId || !editItemData || !selectedInventoryItem) {
          toast({ variant: 'destructive', title: 'Ошибка', description: 'Не все данные для удаления предмета выбраны.' });
          return;
      }
      await adminDeleteItemFromCharacter(itemUserId, itemCharId, editItemData.id, selectedInventoryItem.category);
      await refetchUsers();
      toast({ title: 'Предмет удален!', description: `"${editItemData.name}" удален из инвентаря.` });
      // Reset
      setSelectedInventoryItem(null);
  };
  
  const handleSendMassMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailSubject.trim() || !mailContent.trim() || !mailSender.trim()) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Заполните все поля для рассылки.' });
        return;
    }
    if (!sendToAll && mailRecipients.length === 0) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Выберите хотя бы одного получателя.' });
        return;
    }

    setIsSendingMail(true);
    try {
        const recipients = sendToAll ? undefined : mailRecipients;
        await sendMassMail(mailSubject, mailContent, mailSender, recipients);
        toast({ title: 'Рассылка отправлена!', description: 'Письмо было успешно отправлено.' });
        setMailSubject('');
        setMailContent('');
        setMailRecipients([]);
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Произошла неизвестная ошибка.';
        toast({ variant: 'destructive', title: 'Ошибка при отправке', description: msg });
    } finally {
        setIsSendingMail(false);
    }
  };
  
   const handlePopularityUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const updates: CharacterPopularityUpdate[] = Object.entries(popularityUpdates)
        .filter(([_, data]) => data.events.length > 0)
        .map(([characterId, data]) => ({
            characterId,
            eventIds: data.events,
            description: popularityDescription,
        }));
    
    if (updates.length === 0) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Выберите хотя бы одно событие для одного персонажа.' });
        return;
    }
    
    setIsProcessingPopularity(true);
    try {
        await updatePopularity(updates);
        toast({ title: 'Популярность обновлена', description: `Изменения применены к выбранным персонажам, у остальных популярность понижена.` });
        setPopularityCharIds([]);
        setPopularityUpdates({});
        setPopularityDescription('');
    } catch(err) {
        const msg = err instanceof Error ? err.message : 'Произошла неизвестная ошибка.';
        toast({ variant: 'destructive', title: 'Ошибка при обновлении популярности', description: msg });
    } finally {
        setIsProcessingPopularity(false);
    }
   };

   const handlePopularityEventChange = (charId: string, events: string[]) => {
        setPopularityUpdates(prev => ({
            ...prev,
            [charId]: { ...prev[charId], events }
        }));
   };

    const handleMergeUsers = async () => {
    if (!sourceMergeUserId || !targetMergeUserId) {
        toast({
            variant: "destructive",
            title: "Ошибка",
            description: "Пожалуйста, выберите оба аккаунта для объединения.",
        });
        return;
    }
    setIsMerging(true);
    try {
        await mergeUserData(sourceMergeUserId, targetMergeUserId);
        toast({
            title: "Объединение успешно",
            description: "Данные были перенесены. Теперь вы можете удалить исходный аккаунт, если это необходимо.",
        });
        setSourceMergeUserId('');
        setTargetMergeUserId('');
        await refetchAdminUsers();
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Произошла ошибка при объединении.";
        toast({
            variant: "destructive",
            title: "Ошибка объединения",
            description: msg,
        });
    } finally {
        setIsMerging(false);
    }
  };

  const handleRecipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipe.resultPotionId || newRecipe.components.length === 0) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Выберите итоговое зелье и хотя бы один ингредиент.' });
        return;
    }
    setIsSubmittingRecipe(true);
    try {
        if (editingRecipeId) {
            await updateAlchemyRecipe(editingRecipeId, newRecipe);
            toast({ title: 'Рецепт обновлен!' });
        } else {
            await addAlchemyRecipe(newRecipe);
            toast({ title: 'Рецепт добавлен!' });
        }
        setNewRecipe({ name: '', components: [], resultPotionId: '', outputQty: 1, difficulty: 1 });
        setEditingRecipeId(null);
        refetchRecipes();
    } catch (error) {
        const message = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
        toast({ variant: 'destructive', title: 'Ошибка', description: message });
    } finally {
        setIsSubmittingRecipe(false);
    }
};

const handleDeleteRecipe = async (recipeId: string) => {
    try {
        await deleteAlchemyRecipe(recipeId);
        toast({ title: 'Рецепт удален' });
        refetchRecipes();
        if (editingRecipeId === recipeId) {
            setEditingRecipeId(null);
            setNewRecipe({ name: '', components: [], resultPotionId: '', outputQty: 1, difficulty: 1 });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
        toast({ variant: 'destructive', title: 'Ошибка удаления', description: message });
    }
};

const handleSaveChances = async () => {
    try {
      await updateGameSettings({ gachaChances });
      toast({ title: "Шансы рулетки сохранены!" });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Не удалось сохранить шансы.";
      toast({ variant: "destructive", title: "Ошибка", description: msg });
    }
};

const handleChanceChange = (type: 'normal' | 'blessed', rank: 'мифический' | 'легендарный' | 'редкий', value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setGachaChances(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          [rank]: numValue
        }
      }));
    }
};

    const handleNewRecipeComponentChange = (index: number, field: 'ingredientId' | 'qty', value: string | number) => {
      setNewRecipe(prev => ({
          ...prev,
          components: prev.components.map((c, i) =>
              i === index ? { ...c, [field]: value } : c
          )
      }));
    };

    const addRecipeComponent = () => {
        setNewRecipe(prev => ({ ...prev, components: [...prev.components, { ingredientId: '', qty: 1 }] }));
    };

    const removeRecipeComponent = (index: number) => {
        setNewRecipe(prev => ({
            ...prev,
            components: prev.components.filter((_, i) => i !== index)
        }));
    };


  // --- Memos ---
   const userOptions = useMemo(() => {
    const options = users.map(user => ({ value: user.id, label: user.name }));
    if(options.length > 0) {
        options.unshift({ value: 'all', label: '*** Всем пользователям ***' });
    }
    return options;
  }, [users]);
  
  const userOnlyOptions = useMemo(() => users.map(user => ({ value: user.id, label: user.name })), [users]);
  
  const charactersForRecovery = useMemo(() => {
    if (!recoveryUserId) return [];
    const user = users.find(u => u.id === recoveryUserId);
    return (user?.characters || []).map(c => ({ value: c.id, label: c.name }));
  }, [recoveryUserId, users]);

  const charactersForGiveFamiliar = useMemo(() => {
    if (!giveFamiliarUserId) return [];
    return (users.find(u => u.id === giveFamiliarUserId)?.characters || []).map(c => ({ value: c.id, label: c.name }));
  }, [giveFamiliarUserId, users]);

  const charactersForMoodletUser = useMemo(() => {
    if (!moodletUserId) return [];
    return (users.find(u => u.id === moodletUserId)?.characters || []).map(c => ({ value: c.id, label: c.name }));
  }, [moodletUserId, users]);

  const charactersForFamiliarRemoval = useMemo(() => {
    if (!removeFamiliarUserId) return [];
    return (users.find(u => u.id === removeFamiliarUserId)?.characters || []).map(c => ({ value: c.id, label: c.name }));
  }, [removeFamiliarUserId, users]);

  const charactersForEconomy = useMemo(() => {
    if (!ecoUserId) return [];
    return (users.find(u => u.id === ecoUserId)?.characters || []).map(c => ({ value: c.id, label: c.name }));
  }, [ecoUserId, users]);

  const selectedCharacterForEconomy = useMemo(() => {
    if (!ecoUserId || !ecoCharId) return null;
    const user = users.find(u => u.id === ecoUserId);
    return user?.characters.find(c => c.id === ecoCharId) || null;
  }, [ecoUserId, ecoCharId, users]);
  
  const charactersForCapital = useMemo(() => {
    if (!capitalUserId) return [];
    return (users.find(u => u.id === capitalUserId)?.characters || []).map(c => ({ value: c.id, label: c.name }));
  }, [capitalUserId, users]);
  
  const charactersForShopOwner = useMemo(() => {
    if (!shopOwnerUserId) return [];
    const user = users.find(u => u.id === shopOwnerUserId);
    return (user?.characters || []).map(c => ({ 
        value: c.id, 
        label: `${c.name} (${formatCurrency(c.bankAccount)})`
    }));
  }, [shopOwnerUserId, users]);

  const charactersForItem = useMemo(() => {
    if (!itemUserId) return [];
    const user = users.find(u => u.id === itemUserId);
    return (user?.characters || []).map(c => ({ value: c.id, label: c.name }));
  }, [itemUserId, users]);
  
  const inventoryItemsForSelectedChar = useMemo(() => {
    if (!itemUserId || !itemCharId) return [];
    const user = users.find(u => u.id === itemUserId);
    const character = user?.characters.find(c => c.id === itemCharId);
    if (!character || !character.inventory) return [];

    const groupedOptions = INVENTORY_CATEGORIES.map(category => {
        const items = (character.inventory[category.value as keyof typeof character.inventory] || []) as InventoryItem[];
        if (items.length === 0) return null;
        return {
            label: category.label,
            options: items.map(item => ({
                label: `${item.name} (x${item.quantity})`,
                value: JSON.stringify({ id: item.id, category: category.value })
            }))
        };
    }).filter((group): group is { label: string; options: { label: string; value: string; }[] } => group !== null);
    
    return groupedOptions;
  }, [itemUserId, itemCharId, users]);

  const allCharactersForSelection = useMemo(() => {
    return users.flatMap(user => 
        user.characters.map(char => ({
            value: char.id,
            label: `${char.name} (${user.name})`
        }))
    );
  }, [users]);

  const familiarsForSelectedCharacterOptions = useMemo((): {value: string, label: string}[] => {
    if (!removeFamiliarUserId || !removeFamiliarCharId) return [];
    const user = users.find(u => u.id === removeFamiliarUserId);
    const character = user?.characters.find(c => c.id === removeFamiliarCharId);
    if (!character || !character.familiarCards) return [];
    
    const cardCount = new Map<string, number>();
    character.familiarCards.forEach(ownedCard => {
        cardCount.set(ownedCard.id, (cardCount.get(ownedCard.id) || 0) + 1);
    });

    const uniqueOwnedCards = Array.from(new Set(character.familiarCards.map(c => c.id)))
        .map(id => familiarsById[id])
        .filter((card): card is FamiliarCard => !!card);

    return uniqueOwnedCards.map(cardDetails => {
        const count = cardCount.get(cardDetails.id) || 0;
        const label = count > 1 
            ? `${cardDetails.name} (${rankNames[cardDetails.rank]}) (x${count})` 
            : `${cardDetails.name} (${rankNames[cardDetails.rank]})`;
        return { value: cardDetails.id, label };
    });
  }, [removeFamiliarUserId, removeFamiliarCharId, users, familiarsById]);

  const allFamiliarsGroupedOptions = useMemo(() => {
    const grouped: { [key in FamiliarRank]?: { value: string, label: string }[] } = {};

    allFamiliars.forEach(fam => {
      if (!grouped[fam.rank]) {
        grouped[fam.rank] = [];
      }
      grouped[fam.rank]?.push({ value: fam.id, label: fam.name });
    });
    
    return rankOrder
        .filter(rank => grouped[rank])
        .map(rank => ({
            label: rankNames[rank],
            options: grouped[rank]!,
        }));
  }, [allFamiliars]);

  const familiarStats = useMemo(() => {
    const stats = {
      total: allFamiliars.length,
      мифический: allFamiliars.filter(c => c.rank === 'мифический').length,
      ивентовый: allFamiliars.filter(c => c.rank === 'ивентовый').length,
      легендарный: allFamiliars.filter(c => c.rank === 'легендарный').length,
      редкий: allFamiliars.filter(c => c.rank === 'редкий').length,
      обычный: allFamiliars.filter(c => c.rank === 'обычный').length,
    };
    return stats;
  }, [allFamiliars]);


  const selectedCharacterForMoodlet = useMemo(() => {
      if (!moodletUserId || !moodletCharId) return null;
      const user = users.find(u => u.id === moodletUserId);
      return user?.characters.find(c => c.id === moodletCharId) || null;
  }, [moodletUserId, moodletCharId, users]);

  const moodletSourceOptions = useMemo(() => {
    const characterNames = users.flatMap(u => u.characters.map(c => c.name));
    const divineBeings = ["Светлый Бог", "Тёмный Бог", "Неизвестная Богиня"];
    return [...new Set([...divineBeings, ...characterNames])];
  }, [users]);
  
  const achievementOptions = useMemo(() => ALL_ACHIEVEMENTS.map(ach => ({
      value: ach.id,
      label: ach.name,
  })), []);
  
  const moodletOptions = useMemo(() => Object.entries(MOODLETS_DATA).map(([id, data]) => ({
      value: id,
      label: data.name,
  })), []);
  
  const wealthLevelOptions = useMemo(() => WEALTH_LEVELS.map(level => ({
      value: level.name,
      label: `${level.name} (${level.description})`,
  })), []);

  const startingCapitalOptions = useMemo(() => STARTING_CAPITAL_LEVELS.map(level => ({
      value: level.name,
      label: level.name,
  })), []);

  const shopOptions = useMemo(() => allShops.map(shop => ({
      value: shop.id,
      label: shop.title,
  })), [allShops]);
  
  const selectedShop = useMemo(() => {
    return allShops.find(s => s.id === shopId);
  }, [allShops, shopId]);
  
   const popularityEventOptions = useMemo(() => POPULARITY_EVENTS.map(event => ({
        value: event.label,
        label: `${event.label} (+${event.value})`,
    })), []);
    
    const alchemyResultOptions = useMemo(() => ALCHEMY_POTIONS.map(p => ({ value: p.id, label: p.name })), []);
    const alchemyIngredientOptions = useMemo(() => ALCHEMY_INGREDIENTS.map(i => ({ value: i.id, label: i.name })), []);


  if (isUsersLoading || isShopsLoading) {
    return <div className="flex justify-center items-center h-64"><p>Загрузка данных...</p></div>
  }
  
  return (
    <Tabs defaultValue="points" className="w-full">
      <TabsList className="flex flex-wrap h-auto justify-center">
        <TabsTrigger value="points" className="text-xs sm:text-sm">Баллы</TabsTrigger>
        <TabsTrigger value="general" className="text-xs sm:text-sm">Общее</TabsTrigger>
        <TabsTrigger value="popularity" className="text-xs sm:text-sm">Популярность</TabsTrigger>
        <TabsTrigger value="alchemy" className="text-xs sm:text-sm">Алхимия</TabsTrigger>
        <TabsTrigger value="familiars" className="text-xs sm:text-sm">Фамильяры</TabsTrigger>
        <TabsTrigger value="economy" className="text-xs sm:text-sm">Экономика</TabsTrigger>
        <TabsTrigger value="shops" className="text-xs sm:text-sm">Магазины</TabsTrigger>
        <TabsTrigger value="mail" className="text-xs sm:text-sm">Рассылка</TabsTrigger>
      </TabsList>

      <TabsContent value="points" className="mt-4">
        <div className="gap-6 column-1 md:column-2 lg:column-3">
          <div className="break-inside-avoid mb-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign /> Начислить баллы</CardTitle>
                    <CardDescription>Вручную начислите баллы пользователю за определенные действия.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAwardPoints} className="space-y-4">
                    <div>
                        <Label htmlFor="user-select-award">Пользователь</Label>
                        <SearchableSelect
                            options={userOptions}
                            value={awardSelectedUserId}
                            onValueChange={setAwardSelectedUserId}
                            placeholder="Выберите пользователя"
                        />
                    </div>
                    <div>
                        <Label htmlFor="points-input">Баллы</Label>
                        <Input
                        id="points-input"
                        type="number"
                        value={points}
                        onChange={(e) => setPoints(e.target.value)}
                        placeholder="Введите количество"
                        />
                    </div>
                    <div>
                        <Label htmlFor="reason-input">Причина</Label>
                        <Textarea
                        id="reason-input"
                        placeholder="например, Участие в мини-ивенте"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        />
                    </div>
                    <Button type="submit">Начислить баллы</Button>
                    </form>
                </CardContent>
            </Card>
           </div>
           <div className="break-inside-avoid mb-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive"><MinusCircle /> Списать баллы</CardTitle>
                    <CardDescription>Вручную спишите баллы с пользователя за нарушения.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleDeductPoints} className="space-y-4">
                    <div>
                        <Label htmlFor="user-select-deduct">Пользователь</Label>
                        <SearchableSelect
                            options={userOnlyOptions}
                            value={deductSelectedUserId}
                            onValueChange={setDeductSelectedUserId}
                            placeholder="Выберите пользователя"
                        />
                    </div>
                    <div>
                        <Label htmlFor="points-input-deduct">Баллы</Label>
                        <Input
                        id="points-input-deduct"
                        type="number"
                        value={deductPoints}
                        onChange={(e) => setDeductPoints(e.target.value)}
                        placeholder="Введите количество"
                        />
                    </div>
                    <div>
                        <Label htmlFor="reason-input-deduct">Причина</Label>
                        <Textarea
                        id="reason-input-deduct"
                        placeholder="например, Нарушение правил"
                        value={deductReason}
                        onChange={e => setDeductReason(e.target.value)}
                        />
                    </div>
                    <Button type="submit" variant="destructive">Списать баллы</Button>
                    </form>
                </CardContent>
            </Card>
          </div>
          <div className="break-inside-avoid mb-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Clock /> Автоматические действия</CardTitle>
                    <CardDescription>Автоматические еженедельные расчеты баллов.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2"><Users /> Еженедельный бонус</h3>
                        <p className="text-sm text-muted-foreground mb-3">Автоматически начисляет 800 баллов за активность и баллы за популярность всем 'активным' игрокам раз в 7 дней.</p>
                        <div className="p-4 rounded-md border space-y-3">
                             <Alert variant="default">
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle>Все в порядке</AlertTitle>
                                <AlertDescription>
                                   Следующее автоматическое начисление через {weeklyBonusStatus.daysUntilNext} д.
                                </AlertDescription>
                            </Alert>
                             <Button onClick={handleTestBonus} variant="secondary" className="w-full" disabled={isTestingBonus}>
                                {isTestingBonus ? 'Расчет...' : 'Тестовый расчет'}
                            </Button>
                            {testBonusResult && (
                                <Alert variant="default" className="mt-4">
                                    <AlertTitle>Результаты теста</AlertTitle>
                                    <AlertDescription className="whitespace-pre-wrap text-xs">
                                        {testBonusResult}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2"><Users /> Еженедельный штраф за неактивность</h3>
                        <p className="text-sm text-muted-foreground mb-3">Списывает 1000 баллов со всех 'неактивных' игроков.</p>
                        <Button onClick={handleInactivityPenalty} variant="destructive">Применить штраф</Button>
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="general" className="mt-4">
         <div className="gap-6 column-1 md:column-2 lg:column-3">
            <div className="break-inside-avoid mb-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Trophy /> Выдать ачивку</CardTitle>
                    <CardDescription>Наградите игрока уникальным достижением.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleGrantAchievement} className="space-y-4">
                    <div>
                        <Label htmlFor="user-select-achieve">Пользователь</Label>
                         <SearchableSelect
                            options={userOnlyOptions}
                            value={achieveUserId}
                            onValueChange={setAchieveUserId}
                            placeholder="Выберите пользователя"
                        />
                    </div>
                    <div>
                        <Label htmlFor="achieve-select">Ачивка</Label>
                        <SearchableSelect
                            options={achievementOptions}
                            value={achieveId}
                            onValueChange={setAchieveId}
                            placeholder="Выберите ачивку..."
                        />
                    </div>
                    <Button type="submit">Выдать ачивку</Button>
                    </form>
                </CardContent>
            </Card>
            </div>
            <div className="break-inside-avoid mb-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Wand2 /> Управление мудлетами</CardTitle>
                    <CardDescription>Наложите временные эффекты на персонажей.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddMoodlet} className="space-y-4">
                        <div>
                            <Label htmlFor="moodlet-user">Пользователь</Label>
                            <SearchableSelect
                                options={userOnlyOptions}
                                value={moodletUserId}
                                onValueChange={uid => { setMoodletUserId(uid); setMoodletCharId(''); }}
                                placeholder="Выберите пользователя"
                            />
                        </div>
                        <div>
                            <Label htmlFor="moodlet-char">Персонаж</Label>
                            <SearchableSelect
                                options={charactersForMoodletUser}
                                value={moodletCharId}
                                onValueChange={setMoodletCharId}
                                placeholder="Выберите персонажа"
                                disabled={!moodletUserId}
                            />
                        </div>
                        <div>
                            <Label htmlFor="moodlet-type">Мудлет</Label>
                             <SearchableSelect
                                options={moodletOptions}
                                value={moodletId}
                                onValueChange={setMoodletId}
                                placeholder="Выберите мудлет"
                            />
                        </div>
                        <div>
                            <Label htmlFor="moodlet-duration">Длительность (в днях)</Label>
                            <Input id="moodlet-duration" type="number" value={moodletDuration} onChange={(e) => setMoodletDuration(Number(e.target.value))} />
                        </div>
                        <div>
                            <Label htmlFor="moodlet-source">Источник эффекта (необязательно)</Label>
                            <Input id="moodlet-source" list="moodlet-sources" value={moodletSource} onChange={e => setMoodletSource(e.target.value)} placeholder="Имя персонажа или божество..." />
                            <datalist id="moodlet-sources">
                                {moodletSourceOptions.map(name => <option key={name} value={name} />)}
                            </datalist>
                        </div>
                        <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" />Добавить мудлет</Button>
                    </form>
                    {selectedCharacterForMoodlet && (selectedCharacterForMoodlet.moodlets || []).filter(m => new Date(m.expiresAt) > new Date()).length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                            <h4 className="font-semibold text-sm mb-2">Активные мудлеты:</h4>
                            <div className="space-y-2">
                            {(selectedCharacterForMoodlet.moodlets || []).filter(m => new Date(m.expiresAt) > new Date()).map(moodlet => (
                                    <div key={moodlet.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                                        <div>
                                        <span>{moodlet.name}</span>
                                        {moodlet.source && <span className="text-xs text-muted-foreground italic ml-2">(от {moodlet.source})</span>}
                                        </div>
                                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleRemoveMoodlet(moodletUserId, moodletCharId, moodlet.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                            ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            </div>
            <div className="break-inside-avoid mb-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserCog /> Управление ролями</CardTitle>
                    <CardDescription>Назначайте или снимайте права администратора.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangeRole} className="space-y-4">
                    <div>
                        <Label htmlFor="user-select-role">Пользователь</Label>
                        <SearchableSelect
                            options={userOnlyOptions}
                            value={roleSelectedUserId}
                            onValueChange={setRoleSelectedUserId}
                            placeholder="Выберите пользователя"
                        />
                    </div>
                    <div>
                        <Label htmlFor="role-select">Новая роль</Label>
                        <SearchableSelect
                            options={[{value: 'admin', label: 'Администратор'}, {value: 'user', label: 'Пользователь'}]}
                            value={selectedRole}
                            onValueChange={(value) => setSelectedRole(value as UserRole)}
                            placeholder="Выберите роль"
                        />
                    </div>
                    <Button type="submit">Изменить роль</Button>
                    </form>
                </CardContent>
            </Card>
            </div>
            <div className="break-inside-avoid mb-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserCog /> Изменить статус</CardTitle>
                    <CardDescription>Измените статус активности пользователя.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangeStatus} className="space-y-4">
                    <div>
                        <Label htmlFor="user-select-status">Пользователь</Label>
                         <SearchableSelect
                            options={userOnlyOptions}
                            value={statusSelectedUserId}
                            onValueChange={setStatusSelectedUserId}
                            placeholder="Выберите пользователя"
                        />
                    </div>
                    <div>
                        <Label htmlFor="status-select">Новый статус</Label>
                        <SearchableSelect
                            options={[{value: 'активный', label: 'активный'}, {value: 'неактивный', label: 'неактивный'}, {value: 'отпуск', label: 'отпуск'}]}
                            value={selectedStatus}
                            onValueChange={(value) => setSelectedStatus(value as UserStatus)}
                            placeholder="Выберите статус"
                        />
                    </div>
                    <Button type="submit">Изменить статус</Button>
                    </form>
                </CardContent>
            </Card>
            </div>
            <div className="break-inside-avoid mb-6">
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive"><ShieldAlert /> Опасная зона</CardTitle>
                    <CardDescription>Действия в этой секции необратимы.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="space-y-2 p-3 border rounded-md">
                        <h4 className="font-semibold text-sm">Объединение данных пользователей</h4>
                        <div>
                            <Label>Аккаунт-источник (откуда)</Label>
                            <SearchableSelect
                                options={userOnlyOptions}
                                value={sourceMergeUserId}
                                onValueChange={setSourceMergeUserId}
                                placeholder="Выберите пользователя..."
                            />
                        </div>
                        <div>
                            <Label>Целевой аккаунт (куда)</Label>
                            <SearchableSelect
                                options={userOnlyOptions.filter(u => u.value !== sourceMergeUserId)}
                                value={targetMergeUserId}
                                onValueChange={setTargetMergeUserId}
                                placeholder="Выберите пользователя..."
                                disabled={!sourceMergeUserId}
                            />
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className="w-full" variant="secondary" disabled={!sourceMergeUserId || !targetMergeUserId || isMerging}>
                                    {isMerging ? 'Объединение...' : <><Merge className="mr-2" /> Объединить</>}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Это действие добавит все данные (персонажи, баллы, история и т.д.) от пользователя{' '}
                                        <span className="font-bold">{users.find(u => u.id === sourceMergeUserId)?.name}</span>{' '}
                                        к пользователю{' '}
                                        <span className="font-bold">{users.find(u => u.id === targetMergeUserId)?.name}</span>.
                                        Исходный аккаунт не будет удален. Это действие необратимо.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleMergeUsers}>Да, объединить</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Очистка истории баллов (1 игрок)</h4>
                        <div className="flex gap-2 items-center">
                            <SearchableSelect
                                options={userOnlyOptions}
                                value={clearHistoryUserId}
                                onValueChange={setClearHistoryUserId}
                                placeholder="Выберите пользователя"
                            />
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon" disabled={!clearHistoryUserId}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Это действие необратимо. Вся история начисления и списания баллов для пользователя 
                                        <span className="font-bold"> {users.find(u => u.id === clearHistoryUserId)?.name} </span>
                                        будет навсегда удалена. Баланс баллов не изменится.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleClearHistory} className="bg-destructive hover:bg-destructive/90">
                                    Да, я понимаю, очистить
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-sm mb-2">Очистка истории баллов (ВСЕ)</h4>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full">Очистить историю у всех</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Это действие необратимо. Вся история начисления и списания баллов для <strong>ВСЕХ</strong> пользователей будет навсегда удалена.
                                    <br/><br/>
                                    <strong>Баланс баллов игроков не изменится.</strong> Однако, функция восстановления фамильяров по истории перестанет работать.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction onClick={handleClearAllHistories} className="bg-destructive hover:bg-destructive/90">
                                    Да, я понимаю, очистить всё
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
            </div>
         </div>
      </TabsContent>
      
      <TabsContent value="popularity" className="mt-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Eye /> Управление популярностью</CardTitle>
            <CardDescription>
              Выберите персонажей, которые были в центре внимания. Всем остальным популярность будет понижена на 5.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePopularityUpdate} className="space-y-6">
              <div>
                <Label>1. Персонажи в центре внимания</Label>
                <SearchableMultiSelect
                    options={allCharactersForSelection}
                    selected={popularityCharIds}
                    onChange={setPopularityCharIds}
                    placeholder="Выберите одного или нескольких персонажей..."
                />
              </div>

              {popularityCharIds.length > 0 && (
                <div className="space-y-4">
                    <div>
                        <Label>2. События для персонажей</Label>
                        <div className="space-y-3 rounded-md border p-3">
                            {popularityCharIds.map(charId => {
                                const char = allCharactersForSelection.find(c => c.value === charId);
                                if (!char) return null;
                                return (
                                    <div key={charId} className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
                                        <Label className="sm:col-span-1 truncate">{char.label}</Label>
                                        <div className="sm:col-span-2">
                                            <SearchableMultiSelect
                                                options={popularityEventOptions}
                                                selected={popularityUpdates[charId]?.events || []}
                                                onChange={(events) => handlePopularityEventChange(charId, events)}
                                                placeholder="Выберите события..."
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                     <div>
                        <Label>3. Общее описание (необязательно)</Label>
                        <Input value={popularityDescription} onChange={e => setPopularityDescription(e.target.value)} placeholder="Напр., статья 'Скандалы недели'"/>
                        <p className="text-xs text-muted-foreground mt-1">Это описание будет добавлено к каждому событию для выбранных персонажей.</p>
                      </div>
                </div>
              )}
             
              <Button type="submit" className="w-full" disabled={isProcessingPopularity || popularityCharIds.length === 0}>
                {isProcessingPopularity ? "Обновление..." : "Применить изменения"}
              </Button>
            </form>
             <Separator className="my-6" />
             <div className="p-4 border border-destructive/50 rounded-lg">
                <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2"><ShieldAlert /> Опасная зона</h4>
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">Очистить историю популярности у всех</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Это действие необратимо. Вся история начисления и списания очков популярности для <strong>ВСЕХ</strong> персонажей будет навсегда удалена.
                            <br/><br/>
                            <strong>Текущие очки популярности не изменятся.</strong>
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearAllPopularityHistories} className="bg-destructive hover:bg-destructive/90">
                            Да, я понимаю, очистить историю
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

       <TabsContent value="alchemy" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FlaskConical /> {editingRecipeId ? 'Редактирование' : 'Создание'} рецепта</CardTitle>
                        <CardDescription>
                            {editingRecipeId ? 'Измените детали существующего рецепта.' : 'Создайте новый алхимический рецепт, который станет доступен игрокам.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleRecipeSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="recipe-name">Название рецепта (необязательно)</Label>
                                <Input id="recipe-name" value={newRecipe.name} onChange={e => setNewRecipe(p => ({ ...p, name: e.target.value }))} placeholder="Напр., Простое зелье лечения"/>
                            </div>
                            <div>
                                <Label htmlFor="result-potion">Итоговое зелье/артефакт</Label>
                                <SearchableSelect
                                    options={alchemyResultOptions}
                                    value={newRecipe.resultPotionId}
                                    onValueChange={val => setNewRecipe(p => ({...p, resultPotionId: val}))}
                                    placeholder="Выберите зелье..."
                                />
                            </div>
                            <div>
                                <Label htmlFor="output-qty">Количество на выходе</Label>
                                <Input id="output-qty" type="number" min="1" value={newRecipe.outputQty} onChange={e => setNewRecipe(p => ({ ...p, outputQty: parseInt(e.target.value, 10) || 1 }))} />
                            </div>
                            <div>
                                <Label htmlFor="difficulty">Сложность (1-10)</Label>
                                <Input id="difficulty" type="number" min="1" max="10" value={newRecipe.difficulty} onChange={e => setNewRecipe(p => ({ ...p, difficulty: parseInt(e.target.value, 10) || 1 }))} />
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label>Ингредиенты</Label>
                                {newRecipe.components.map((comp, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                                        <div className="flex-1">
                                            <SearchableSelect
                                                options={alchemyIngredientOptions}
                                                value={comp.ingredientId}
                                                onValueChange={val => handleNewRecipeComponentChange(index, 'ingredientId', val)}
                                                placeholder="Выберите ингредиент..."
                                            />
                                        </div>
                                        <Input 
                                            type="number" 
                                            min="1" 
                                            value={comp.qty} 
                                            onChange={e => handleNewRecipeComponentChange(index, 'qty', parseInt(e.target.value, 10) || 1)} 
                                            className="w-20"
                                        />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeRecipeComponent(index)}>
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={addRecipeComponent}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Добавить ингредиент
                                </Button>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                                {editingRecipeId && (
                                    <Button type="button" variant="ghost" onClick={() => setEditingRecipeId(null)}>Отмена</Button>
                                )}
                                <Button type="submit" className="w-full" disabled={isSubmittingRecipe}>
                                    {isSubmittingRecipe ? 'Сохранение...' : (editingRecipeId ? 'Сохранить изменения' : 'Добавить рецепт')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Существующие рецепты</CardTitle>
                        <CardDescription>Список всех созданных в игре рецептов.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[60vh]">
                            <div className="space-y-2 pr-3">
                                {allRecipes.length > 0 ? allRecipes.map(recipe => {
                                const resultItem = allItemsMap.get(recipe.resultPotionId);
                                const recipeName = recipe.name || resultItem?.name || 'Неизвестный рецепт';
                                return (
                                    <div key={recipe.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                                    <span className="font-semibold truncate pr-2">{recipeName}</span>
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingRecipeId(recipe.id)}>
                                        <Edit className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="icon" variant="destructive" className="h-8 w-8">
                                            <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Это действие необратимо удалит рецепт "{recipeName}".
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteRecipe(recipe.id)} className="bg-destructive hover:bg-destructive/90">
                                                    Удалить
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                    </div>
                                );
                                }) : (
                                    <p className="text-center text-sm text-muted-foreground pt-8">Пока нет созданных рецептов.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
      </TabsContent>
      
      <TabsContent value="familiars" className="mt-4">
        <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto">
                <TabsTrigger value="stats">Статистика</TabsTrigger>
                <TabsTrigger value="manage">Управление</TabsTrigger>
            </TabsList>
            <TabsContent value="stats" className="mt-4">
                <div className="gap-6 column-1 md:column-2 lg:column-3">
                    <div className="break-inside-avoid mb-6">
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><PieChart /> Статистика Фамильяров</CardTitle>
                                 <CardDescription>Общее количество уникальных карт в игре.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between font-bold text-base">
                                    <span>Всего карт:</span>
                                    <span>{familiarStats.total}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between"><span>Мифические:</span> <span>{familiarStats.мифический}</span></div>
                                <div className="flex justify-between"><span>Ивентовые:</span> <span>{familiarStats.ивентовый}</span></div>
                                <div className="flex justify-between"><span>Легендарные:</span> <span>{familiarStats.легендарный}</span></div>
                                <div className="flex justify-between"><span>Редкие:</span> <span>{familiarStats.редкий}</span></div>
                                <div className="flex justify-between"><span>Обычные:</span> <span>{familiarStats.обычный}</span></div>
                            </CardContent>
                        </Card>
                    </div>
                     <div className="break-inside-avoid mb-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Gift /> Выдать любого фамильяра</CardTitle>
                                <CardDescription>Наградите персонажа любой картой из существующих.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleGiveFamiliar} className="space-y-4">
                                <div>
                                    <Label htmlFor="user-select-give">Пользователь</Label>
                                    <SearchableSelect
                                        options={userOnlyOptions}
                                        value={giveFamiliarUserId}
                                        onValueChange={uid => { setGiveFamiliarUserId(uid); setGiveFamiliarCharId(''); }}
                                        placeholder="Выберите пользователя"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="character-select-give">Персонаж</Label>
                                    <SearchableSelect
                                        options={charactersForGiveFamiliar}
                                        value={giveFamiliarCharId}
                                        onValueChange={setGiveFamiliarCharId}
                                        placeholder="Выберите персонажа"
                                        disabled={!giveFamiliarUserId}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="familiar-select-give">Фамильяр</Label>
                                    <SearchableSelect
                                        options={allFamiliarsGroupedOptions}
                                        value={giveFamiliarId}
                                        onValueChange={setGiveFamiliarId}
                                        placeholder="Выберите фамильяра..."
                                        disabled={!giveFamiliarCharId}
                                    />
                                </div>
                                <Button type="submit">Выдать фамильяра</Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="break-inside-avoid mb-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><VenetianMask /> Управление Фамильярами</CardTitle>
                            <CardDescription>Удалить карту фамильяра у персонажа.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="remove-fam-user">Пользователь</Label>
                                     <SearchableSelect
                                        options={userOnlyOptions}
                                        value={removeFamiliarUserId}
                                        onValueChange={uid => { setRemoveFamiliarUserId(uid); setRemoveFamiliarCharId(''); setRemoveFamiliarCardId(''); }}
                                        placeholder="Выберите пользователя"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="remove-fam-char">Персонаж</Label>
                                   <SearchableSelect
                                        options={charactersForFamiliarRemoval}
                                        value={removeFamiliarCharId}
                                        onValueChange={cid => { setRemoveFamiliarCharId(cid); setRemoveFamiliarCardId(''); }}
                                        placeholder="Выберите персонажа"
                                        disabled={!removeFamiliarUserId}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="remove-fam-card">Карта для удаления</Label>
                                    <SearchableSelect
                                        options={familiarsForSelectedCharacterOptions}
                                        value={removeFamiliarCardId}
                                        onValueChange={setRemoveFamiliarCardId}
                                        placeholder="Выберите карту..."
                                        disabled={!removeFamiliarCharId}
                                    />
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                    <Button 
                                        variant="destructive" 
                                        disabled={!removeFamiliarCardId}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Удалить карту
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Это действие удалит карту 
                                            <span className="font-bold"> {familiarsById[removeFamiliarCardId]?.name} </span> 
                                            у персонажа. Если карта мифическая, она вернется в рулетку. Это действие необратимо.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleRemoveFamiliar} className="bg-destructive hover:bg-destructive/90">
                                            Да, удалить
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                    </div>
                     <div className="break-inside-avoid mb-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">Настройка шансов рулетки</CardTitle>
                                <CardDescription>Задайте процентные шансы на выпадение рангов. Обычный ранг рассчитывается автоматически.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-sm">Обычная прокрутка</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <Label htmlFor="norm-mythic">Миф. (%)</Label>
                                            <Input id="norm-mythic" type="number" value={gachaChances.normal.мифический} onChange={e => handleChanceChange('normal', 'мифический', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label htmlFor="norm-legendary">Лег. (%)</Label>
                                            <Input id="norm-legendary" type="number" value={gachaChances.normal.легендарный} onChange={e => handleChanceChange('normal', 'легендарный', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label htmlFor="norm-rare">Ред. (%)</Label>
                                            <Input id="norm-rare" type="number" value={gachaChances.normal.редкий} onChange={e => handleChanceChange('normal', 'редкий', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                                 <div className="space-y-4">
                                    <h4 className="font-semibold text-sm">Благословенная прокрутка</h4>
                                     <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <Label htmlFor="blessed-mythic">Миф. (%)</Label>
                                            <Input id="blessed-mythic" type="number" value={gachaChances.blessed.мифический} onChange={e => handleChanceChange('blessed', 'мифический', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label htmlFor="blessed-legendary">Лег. (%)</Label>
                                            <Input id="blessed-legendary" type="number" value={gachaChances.blessed.легендарный} onChange={e => handleChanceChange('blessed', 'легендарный', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label htmlFor="blessed-rare">Ред. (%)</Label>
                                            <Input id="blessed-rare" type="number" value={gachaChances.blessed.редкий} onChange={e => handleChanceChange('blessed', 'редкий', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                                <Button onClick={handleSaveChances}>Сохранить шансы</Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="manage" className="mt-4">
                <AdminFamiliarsTab />
            </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="economy" className="mt-4">
        <div className="gap-6 column-1 md:column-2 lg:column-3">
            <div className="break-inside-avoid mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Banknote/> Управление счетом</CardTitle>
                        <CardDescription>Начисление или списание тыквинов со счета персонажа.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleEconomySubmit} className="space-y-4">
                             <div className="space-y-2">
                                <Label>Пользователь и персонаж</Label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                     <SearchableSelect
                                        options={userOnlyOptions}
                                        value={ecoUserId}
                                        onValueChange={uid => { setEcoUserId(uid); setEcoCharId(''); }}
                                        placeholder="Пользователь"
                                    />
                                    <SearchableSelect
                                        options={charactersForEconomy}
                                        value={ecoCharId}
                                        onValueChange={setEcoCharId}
                                        placeholder="Персонаж"
                                        disabled={!ecoUserId}
                                    />
                                </div>
                            </div>
                             <div>
                                <Label>Сумма</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input type="number" placeholder="Платина" value={ecoAmount.platinum || ''} onChange={e => handleEcoAmountChange('platinum', e.target.value)} />
                                    <Input type="number" placeholder="Золото" value={ecoAmount.gold || ''} onChange={e => handleEcoAmountChange('gold', e.target.value)} />
                                    <Input type="number" placeholder="Серебро" value={ecoAmount.silver || ''} onChange={e => handleEcoAmountChange('silver', e.target.value)} />
                                    <Input type="number" placeholder="Медь" value={ecoAmount.copper || ''} onChange={e => handleEcoAmountChange('copper', e.target.value)} />
                                </div>
                             </div>
                              <div>
                                <Label htmlFor="eco-reason">Причина</Label>
                                <Textarea id="eco-reason" placeholder="например, Награда за квест" value={ecoReason} onChange={e => setEcoReason(e.target.value)} />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" onClick={() => setIsDeductingEco(false)} className="flex-1">Начислить</Button>
                                <Button type="submit" variant="destructive" onClick={() => setIsDeductingEco(true)} className="flex-1">Списать</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
             <div className="break-inside-avoid mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Landmark/> Изменить уровень достатка</CardTitle>
                        <CardDescription>Установите уровень финансового благосостояния для персонажа.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleWealthLevelUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Пользователь и персонаж</Label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <SearchableSelect
                                        options={userOnlyOptions}
                                        value={ecoUserId}
                                        onValueChange={uid => { setEcoUserId(uid); setEcoCharId(''); }}
                                        placeholder="Пользователь"
                                    />
                                    <SearchableSelect
                                        options={charactersForEconomy}
                                        value={ecoCharId}
                                        onValueChange={setEcoCharId}
                                        placeholder="Персонаж"
                                        disabled={!ecoUserId}
                                    />
                                </div>
                            </div>
                             {selectedCharacterForEconomy && (
                                <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                                    Текущий уровень: <span className="font-semibold text-foreground">{selectedCharacterForEconomy.wealthLevel}</span>
                                </div>
                            )}
                            <div>
                                <Label htmlFor="wealth-level">Уровень достатка</Label>
                                <SearchableSelect
                                    options={wealthLevelOptions}
                                    value={ecoWealthLevel}
                                    onValueChange={v => setEcoWealthLevel(v as WealthLevel)}
                                    placeholder="Выберите уровень"
                                />
                            </div>
                            <Button type="submit">Сохранить уровень</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
             <div className="break-inside-avoid mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserCog/> Статус персонажа</CardTitle>
                        <CardDescription>Измените статус налогообложения для персонажа.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCharacterStatusUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Пользователь и персонаж</Label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <SearchableSelect
                                        options={userOnlyOptions}
                                        value={ecoUserId}
                                        onValueChange={uid => { setEcoUserId(uid); setEcoCharId(''); }}
                                        placeholder="Пользователь"
                                    />
                                    <SearchableSelect
                                        options={charactersForEconomy}
                                        value={ecoCharId}
                                        onValueChange={setEcoCharId}
                                        placeholder="Персонаж"
                                        disabled={!ecoUserId}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Статус налогоплательщика</Label>
                                <div className="flex items-center gap-2 pt-2">
                                     <Switch
                                        checked={charStatus.taxpayerStatus === 'taxable'}
                                        onCheckedChange={(checked) => setCharStatus(p => ({...p, taxpayerStatus: checked ? 'taxable' : 'exempt'}))}
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        {charStatus.taxpayerStatus === 'taxable' ? 'Облагается налогами' : 'Освобожден от налогов'}
                                    </span>
                                </div>
                            </div>
                            <Button type="submit">Сохранить статус</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
            <div className="break-inside-avoid mb-6">
                <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Clock /> Экономические действия</CardTitle>
                        <CardDescription>Массовые операции с экономикой.</CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="pb-4 border-b">
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><Users /> Ежемесячная зарплата</h3>
                            <p className="text-sm text-muted-foreground mb-3">Начисляет зарплату всем персонажам в зависимости от их уровня достатка.</p>
                            <Button onClick={handleSalaryPayout} variant="outline">Начислить зарплату</Button>
                        </div>
                        <div className="pt-4">
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><FileText /> Ежегодные налоги</h3>
                            <p className="text-sm text-muted-foreground mb-3">Собирает налоги со всех персонажей в соответствии с правилами их страны проживания.</p>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                     <Button onClick={() => {}} variant="destructive" disabled={isProcessingTaxes}>{isProcessingTaxes ? "Сбор налогов..." : "Собрать налоги"}</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Вы уверены, что хотите собрать налоги?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Это действие спишет рассчитанную сумму налогов со всех персонажей, облагаемых налогом. Действие необратимо.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleTaxCollection} className="bg-destructive hover:bg-destructive/90">Да, собрать налоги</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            </div>
             <div className="break-inside-avoid mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Star /> Стартовый капитал</CardTitle>
                        <CardDescription>Начислить персонажу стартовый капитал.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleStartingCapitalSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Пользователь и персонаж</Label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                     <SearchableSelect
                                        options={userOnlyOptions}
                                        value={capitalUserId}
                                        onValueChange={uid => { setCapitalUserId(uid); setCapitalCharId(''); }}
                                        placeholder="Пользователь"
                                     />
                                     <SearchableSelect
                                        options={charactersForCapital}
                                        value={capitalCharId}
                                        onValueChange={setCapitalCharId}
                                        placeholder="Персонаж"
                                        disabled={!capitalUserId}
                                     />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="capital-level">Уровень капитала</Label>
                                <SearchableSelect
                                    options={startingCapitalOptions}
                                    value={capitalLevel}
                                    onValueChange={setCapitalLevel}
                                    placeholder="Выберите уровень"
                                />
                            </div>
                            <Button type="submit">Начислить капитал</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
      </TabsContent>
      
      <TabsContent value="shops" className="mt-4">
        <div className="gap-6 column-1 md:column-2 lg:column-3">
          <div className="break-inside-avoid mb-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Store /> Управление магазинами</CardTitle>
                    <CardDescription>Назначьте или снимите владельца для магазина или таверны на рынке.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAssignShopOwner} className="space-y-4">
                        <div>
                            <Label>Магазин</Label>
                            <SearchableSelect
                                options={shopOptions}
                                value={shopId}
                                onValueChange={setShopId}
                                placeholder="Выберите магазин..."
                            />
                        </div>
                        {selectedShop?.ownerCharacterName && (
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>Текущий владелец</AlertTitle>
                                <AlertDescription>{selectedShop.ownerCharacterName}</AlertDescription>
                            </Alert>
                        )}
                        <div>
                            <Label>Пользователь-владелец</Label>
                            <SearchableSelect
                                options={userOnlyOptions}
                                value={shopOwnerUserId}
                                onValueChange={uid => { setShopOwnerUserId(uid); setShopOwnerCharId(''); }}
                                placeholder="Выберите пользователя..."
                            />
                        </div>
                        <div>
                            <Label>Персонаж-владелец</Label>
                            <SearchableSelect
                                options={charactersForShopOwner}
                                value={shopOwnerCharId}
                                onValueChange={setShopOwnerCharId}
                                placeholder="Выберите персонажа..."
                                disabled={!shopOwnerUserId}
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button type="submit" className="flex-1">Назначить владельца</Button>
                            {selectedShop?.ownerUserId && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button type="button" variant="destructive" className="flex-1"><UserMinus className="mr-2"/>Снять владельца</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Это действие удалит владельца с магазина "{selectedShop.title}". Магазин снова станет бесхозным.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleRemoveShopOwner} className="bg-destructive hover:bg-destructive/90">Да, снять владельца</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>
           </div>
             <div className="break-inside-avoid mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BadgeCheck /> Лицензирование</CardTitle>
                        <CardDescription>Управление лицензиями для магазинов.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLicenseUpdate} className="space-y-4">
                            <div>
                                <Label>Магазин</Label>
                                <SearchableSelect
                                    options={shopOptions}
                                    value={licenseShopId}
                                    onValueChange={setLicenseShopId}
                                    placeholder="Выберите магазин..."
                                />
                            </div>
                            {selectedShopForLicense && (
                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch
                                        id="license-switch"
                                        checked={shopHasLicense}
                                        onCheckedChange={setShopHasLicense}
                                    />
                                    <Label htmlFor="license-switch">Имеет лицензию</Label>
                                </div>
                            )}
                            <Button type="submit" disabled={!selectedShopForLicense}>Сохранить</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
            <div className="break-inside-avoid mb-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PackagePlus /> Управление инвентарем</CardTitle>
                    <CardDescription>Добавление, редактирование и удаление предметов в инвентаре персонажа.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Tabs defaultValue="add">
                        <TabsList className="w-full flex flex-wrap h-auto justify-start">
                            <TabsTrigger value="add">Добавить предмет</TabsTrigger>
                            <TabsTrigger value="edit">Редактировать предмет</TabsTrigger>
                        </TabsList>
                        <TabsContent value="add" className="pt-4">
                           <form onSubmit={handleGiveItem} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Пользователь и персонаж</Label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <SearchableSelect
                                            options={userOnlyOptions}
                                            value={itemUserId}
                                            onValueChange={uid => { setItemUserId(uid); setItemCharId(''); }}
                                            placeholder="Пользователь"
                                        />
                                        <SearchableSelect
                                            options={charactersForItem}
                                            value={itemCharId}
                                            onValueChange={setItemCharId}
                                            placeholder="Персонаж"
                                            disabled={!itemUserId}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Label htmlFor="item-mode-switch">Новый предмет</Label>
                                    <Switch
                                        id="item-mode-switch"
                                        checked={isGivingNewItem}
                                        onCheckedChange={setIsGivingNewItem}
                                    />
                                </div>
                                
                                {isGivingNewItem ? (
                                    <div className="p-4 border rounded-md space-y-4">
                                        <ImageKitUploader
                                            currentImageUrl={newItemData.image}
                                            onUpload={(url) => setNewItemData(p => ({...p, image: url}))}
                                        />
                                        <div>
                                            <Label htmlFor="new-item-name">Название предмета</Label>
                                            <Input id="new-item-name" value={newItemData.name} onChange={e => setNewItemData(p => ({...p, name: e.target.value}))} />
                                        </div>
                                        <div>
                                            <Label htmlFor="new-item-desc">Описание</Label>
                                            <Textarea id="new-item-desc" value={newItemData.description} onChange={e => setNewItemData(p => ({...p, description: e.target.value}))} />
                                        </div>
                                         <div>
                                            <Label htmlFor="new-item-quantity">Количество</Label>
                                            <Input id="new-item-quantity" type="number" value={newItemData.quantity} onChange={e => setNewItemData(p => ({...p, quantity: parseInt(e.target.value, 10) || 1}))} />
                                        </div>
                                        <div>
                                            <Label htmlFor="new-item-tag">Категория в инвентаре</Label>
                                             <SearchableSelect
                                                options={INVENTORY_CATEGORIES}
                                                value={newItemData.inventoryTag}
                                                onValueChange={(v) => setNewItemData(p => ({...p, inventoryTag: v as InventoryCategory}))}
                                                placeholder="Выберите категорию..."
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <Label>Существующий предмет</Label>
                                        <SearchableSelect
                                            options={allShopItems}
                                            value={selectedShopItemId}
                                            onValueChange={setSelectedShopItemId}
                                            placeholder="Выберите предмет из магазина..."
                                        />
                                    </div>
                                )}
                                <Button type="submit">Выдать предмет</Button>
                            </form>
                        </TabsContent>
                         <TabsContent value="edit" className="pt-4">
                            <form onSubmit={handleUpdateItem} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Пользователь и персонаж</Label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <SearchableSelect
                                            options={userOnlyOptions}
                                            value={itemUserId}
                                            onValueChange={uid => { setItemUserId(uid); setItemCharId(''); setSelectedInventoryItem(null); }}
                                            placeholder="Пользователь"
                                        />
                                        <SearchableSelect
                                            options={charactersForItem}
                                            value={itemCharId}
                                            onValueChange={cid => { setItemCharId(cid); setSelectedInventoryItem(null); }}
                                            placeholder="Персонаж"
                                            disabled={!itemUserId}
                                        />
                                    </div>
                                </div>
                                 <div>
                                    <Label>Предмет для редактирования</Label>
                                    <SearchableSelect
                                        options={inventoryItemsForSelectedChar}
                                        value={selectedInventoryItem ? JSON.stringify(selectedInventoryItem) : ''}
                                        onValueChange={v => setSelectedInventoryItem(v ? JSON.parse(v) : null)}
                                        placeholder="Выберите предмет..."
                                        disabled={!itemCharId}
                                    />
                                </div>

                                {editItemData && selectedInventoryItem && (
                                     <div className="p-4 border rounded-md space-y-4">
                                         <ImageKitUploader
                                            currentImageUrl={editItemData.image}
                                            onUpload={(url) => setEditItemData(p => p ? {...p, image: url} : null)}
                                        />
                                         <div>
                                            <Label htmlFor="edit-item-name">Название предмета</Label>
                                            <Input id="edit-item-name" value={editItemData.name ?? ''} onChange={e => setEditItemData(p => p ? {...p, name: e.target.value} : null)} />
                                        </div>
                                        <div>
                                            <Label htmlFor="edit-item-desc">Описание</Label>
                                            <Textarea id="edit-item-desc" value={editItemData.description ?? ''} onChange={e => setEditItemData(p => p ? {...p, description: e.target.value} : null)} />
                                        </div>
                                        <div>
                                            <Label htmlFor="edit-item-quantity">Количество</Label>
                                            <Input id="edit-item-quantity" type="number" value={editItemData.quantity ?? ''} onChange={e => setEditItemData(p => p ? {...p, quantity: parseInt(e.target.value, 10) || 0} : null)} />
                                        </div>
                                         <div>
                                            <Label htmlFor="edit-item-tag">Категория</Label>
                                            <p className="text-sm text-muted-foreground">Категорию предмета изменить нельзя.</p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Button type="submit" className="flex-1"><Edit className="mr-2"/>Сохранить</Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button type="button" variant="destructive" className="flex-1"><Trash2 className="mr-2"/>Удалить</Button></AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Это действие удалит предмет "{editItemData.name}" из инвентаря персонажа без возможности восстановления.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                        <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive hover:bg-destructive/90">Удалить</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                     </div>
                                )}
                            </form>
                         </TabsContent>
                     </Tabs>
                </CardContent>
            </Card>
           </div>
        </div>
      </TabsContent>
       <TabsContent value="mail" className="mt-4">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">Массовая рассылка</CardTitle>
                    <CardDescription>Отправить объявление от лица определенной группы или персонажа.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleSendMassMail} className="space-y-4">
                        <div>
                            <Label htmlFor="mail-sender">Отправитель</Label>
                            <Input id="mail-sender" value={mailSender} onChange={e => setMailSender(e.target.value)} placeholder="Напр., 'Королевская канцелярия'" />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="send-to-all-switch" checked={sendToAll} onCheckedChange={setSendToAll} />
                            <Label htmlFor="send-to-all-switch">Отправить всем персонажам</Label>
                        </div>

                        {!sendToAll && (
                            <div>
                                <Label htmlFor="mail-recipients">Получатели</Label>
                                <SearchableMultiSelect
                                    options={allCharactersForSelection}
                                    selected={mailRecipients}
                                    onChange={setMailRecipients}
                                    placeholder="Выберите одного или нескольких персонажей..."
                                />
                            </div>
                        )}

                        <div>
                            <Label htmlFor="mail-subject">Тема письма</Label>
                            <Input id="mail-subject" value={mailSubject} onChange={e => setMailSubject(e.target.value)} required />
                        </div>
                         <div>
                            <Label htmlFor="mail-content">Содержание</Label>
                            <Textarea id="mail-content" value={mailContent} onChange={e => setMailContent(e.target.value)} required rows={8}/>
                        </div>
                        <Button type="submit" disabled={isSendingMail} className="w-full">
                            <Send className="mr-2 h-4 w-4" />
                            {isSendingMail ? 'Отправка...' : 'Отправить'}
                        </Button>
                    </form>
                    <Separator />
                    <div className="p-4 border border-destructive/50 rounded-lg">
                        <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2"><ShieldAlert /> Опасная зона</h4>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full">Очистить все почтовые ящики</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Это действие необратимо. Вся почта (личные письма и рассылки) будет удалена для <strong>ВСЕХ</strong> пользователей.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction onClick={handleClearAllMailboxes} className="bg-destructive hover:bg-destructive/90">
                                    Да, я понимаю, очистить всё
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
      </TabsContent>
    </Tabs>
  );
}

    

    
