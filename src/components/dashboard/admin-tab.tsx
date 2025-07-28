

"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { DollarSign, Clock, Users, ShieldAlert, UserCog, Trophy, Gift, Star, MinusCircle, Trash2, Wand2, PlusCircle, VenetianMask, CalendarClock, History, DatabaseZap, Banknote, Landmark, Cat, PieChart, Info, AlertTriangle, Bell, CheckCircle, Store, PackagePlus } from 'lucide-react';
import type { UserStatus, UserRole, User, FamiliarCard, BankAccount, WealthLevel, FamiliarRank, Shop, InventoryCategory, AdminGiveItemForm } from '@/lib/types';
import { FAME_LEVELS_POINTS, EVENT_FAMILIARS, ALL_ACHIEVEMENTS, MOODLETS_DATA, FAMILIARS_BY_ID, WEALTH_LEVELS, ALL_FAMILIARS, STARTING_CAPITAL_LEVELS, ALL_SHOPS, INVENTORY_CATEGORIES } from '@/lib/data';
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

const rankNames: Record<FamiliarRank, string> = {
    'мифический': 'Мифический',
    'ивентовый': 'Ивентовый',
    'легендарный': 'Легендарный',
    'редкий': 'Редкий',
    'обычный': 'Обычный'
};

const rankOrder: FamiliarRank[] = ['мифический', 'ивентовый', 'легендарный', 'редкий', 'обычный'];


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
    updateGameDate,
    gameDateString: initialGameDate,
    lastWeeklyBonusAwardedAt,
    processWeeklyBonus,
    recoverFamiliarsFromHistory,
    addBankPointsToCharacter,
    processMonthlySalary,
    updateCharacterWealthLevel,
    giveAnyFamiliarToCharacter,
    updateShopOwner,
    fetchAllShops,
    adminGiveItemToCharacter,
  } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Recovery state
  const [recoveryUserId, setRecoveryUserId] = useState('');
  const [recoveryCharId, setRecoveryCharId] = useState('');
  const [recoveryOldName, setRecoveryOldName] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

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
  
  // Game date state
  const [newGameDateString, setNewGameDateString] = useState(initialGameDate || '');
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);

  // Economy state
  const [ecoUserId, setEcoUserId] = useState('');
  const [ecoCharId, setEcoCharId] = useState('');
  const [isDeductingEco, setIsDeductingEco] = useState(false);
  const [ecoAmount, setEcoAmount] = useState<Partial<Omit<BankAccount, 'history'>>>({ platinum: 0, gold: 0, silver: 0, copper: 0});
  const [ecoReason, setEcoReason] = useState('');
  const [ecoWealthLevel, setEcoWealthLevel] = useState<WealthLevel | ''>('');
  
  // Starting capital state
  const [capitalUserId, setCapitalUserId] = useState('');
  const [capitalCharId, setCapitalCharId] = useState('');
  const [capitalLevel, setCapitalLevel] = useState('');

  // Weekly bonus state
  const [isProcessingWeekly, setIsProcessingWeekly] = useState(false);

  // Shop management state
  const [shopId, setShopId] = useState('');
  const [shopOwnerUserId, setShopOwnerUserId] = useState('');
  const [shopOwnerCharId, setShopOwnerCharId] = useState('');
  
  // Item giving state
  const [itemGiveUserId, setItemGiveUserId] = useState('');
  const [itemGiveCharId, setItemGiveCharId] = useState('');
  const [isGivingNewItem, setIsGivingNewItem] = useState(false);
  const [allShopItems, setAllShopItems] = useState<{label: string, value: string}[]>([]);
  const [selectedShopItemId, setSelectedShopItemId] = useState('');
  const [newItemData, setNewItemData] = useState<AdminGiveItemForm>({ name: '', description: '', inventoryTag: 'прочее' });


  const { toast } = useToast();

  const refetchUsers = useCallback(async () => {
    try {
        const fetchedUsers = await fetchUsersForAdmin();
        setUsers(fetchedUsers);
    } catch (error) {
        console.error("Failed to refetch users", error);
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось обновить список пользователей.' });
    }
  }, [fetchUsersForAdmin, toast]);

  useEffect(() => {
    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            const [fetchedUsers, fetchedShops] = await Promise.all([
                fetchUsersForAdmin(),
                fetchAllShops()
            ]);
            setUsers(fetchedUsers);
            
            const items = fetchedShops.flatMap(shop => 
                (shop.items || []).map(item => ({
                    label: `${item.name} (${shop.title})`,
                    value: JSON.stringify({ name: item.name, description: item.description, inventoryTag: item.inventoryTag })
                }))
            );
            setAllShopItems(items);

        } catch (error) {
            console.error("Failed to fetch initial admin data", error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить данные для админ-панели.' });
        } finally {
            setIsLoading(false);
        }
    };
    loadInitialData();
  }, [fetchUsersForAdmin, fetchAllShops, toast]);

  useEffect(() => {
      setNewGameDateString(initialGameDate || '');
  }, [initialGameDate]);

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

  const handleUpdateGameDate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingDate(true);
    try {
        await updateGameDate(newGameDateString);
        toast({ title: 'Игровая дата обновлена', description: `Новая дата: ${newGameDateString}` });
    } catch(error) {
        console.error('Failed to update game date', error);
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось обновить игровую дату.' });
    } finally {
        setIsUpdatingDate(false);
    }
  };

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
        return { canAward: true, daysSinceLast: 7, isOverdue: false };
    }
    const daysSinceLast = differenceInDays(new Date(), new Date(lastWeeklyBonusAwardedAt));
    const canAward = daysSinceLast >= 7;
    const isOverdue = daysSinceLast > 7;
    return { canAward, daysSinceLast, isOverdue };
  }, [lastWeeklyBonusAwardedAt]);


  const handleWeeklyCalculations = async () => {
    setIsProcessingWeekly(true);
    try {
        const { awardedCount, isOverdue } = await processWeeklyBonus();
        await refetchUsers();
        let description = `Еженедельные бонусы (активность + известность) начислены ${awardedCount} активным пользователям.`;
        if (isOverdue) {
            description += ' Была также начислена компенсация за просрочку.';
        }
        toast({ title: "Еженедельные расчеты завершены", description });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
        toast({ variant: 'destructive', title: 'Ошибка', description: errorMessage });
    } finally {
        setIsProcessingWeekly(false);
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

    const familiarName = FAMILIARS_BY_ID[giveFamiliarId]?.name;

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
      const cardName = FAMILIARS_BY_ID[removeFamiliarCardId]?.name || 'Карта';
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
    toast({ title: 'Владелец назначен!', description: `Владелец магазина успешно изменен.` });
    
    setShopId('');
    setShopOwnerUserId('');
    setShopOwnerCharId('');
  };

  const handleGiveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemGiveUserId || !itemGiveCharId) {
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
    
    await adminGiveItemToCharacter(itemGiveUserId, itemGiveCharId, itemData);
    await refetchUsers();
    toast({ title: 'Предмет выдан!', description: `"${itemData.name}" добавлен в инвентарь персонажа.` });
    
    // Reset form
    setItemGiveUserId('');
    setItemGiveCharId('');
    setSelectedShopItemId('');
    setNewItemData({ name: '', description: '', inventoryTag: 'прочее' });
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

  const charactersForItemGive = useMemo(() => {
    if (!itemGiveUserId) return [];
    const user = users.find(u => u.id === itemGiveUserId);
    return (user?.characters || []).map(c => ({ value: c.id, label: c.name }));
  }, [itemGiveUserId, users]);

  const familiarsForSelectedCharacterOptions = useMemo((): {value: string, label: string}[] => {
    if (!removeFamiliarUserId || !removeFamiliarCharId) return [];
    const user = users.find(u => u.id === removeFamiliarUserId);
    const character = user?.characters.find(c => c.id === removeFamiliarCharId);
    if (!character || !character.inventory?.familiarCards) return [];
    
    // Create a map to count occurrences of each card ID
    const cardCount = new Map<string, number>();
    character.inventory.familiarCards.forEach(ownedCard => {
        cardCount.set(ownedCard.id, (cardCount.get(ownedCard.id) || 0) + 1);
    });

    // Create a unique list of owned cards for the options
    const uniqueOwnedCards = Array.from(new Set(character.inventory.familiarCards.map(c => c.id)))
        .map(id => FAMILIARS_BY_ID[id])
        .filter((card): card is FamiliarCard => !!card);

    return uniqueOwnedCards.map(cardDetails => {
        const count = cardCount.get(cardDetails.id) || 0;
        const label = count > 1 
            ? `${cardDetails.name} (${rankNames[cardDetails.rank]}) (x${count})` 
            : `${cardDetails.name} (${rankNames[cardDetails.rank]})`;
        return { value: cardDetails.id, label };
    });
  }, [removeFamiliarUserId, removeFamiliarCharId, users]);

  const allFamiliarsGroupedOptions = useMemo(() => {
    const allCards = [...ALL_FAMILIARS, ...EVENT_FAMILIARS];
    const grouped: { [key in FamiliarRank]?: { value: string, label: string }[] } = {};

    allCards.forEach(fam => {
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
  }, []);

  const familiarStats = useMemo(() => {
    const allCards = [...ALL_FAMILIARS, ...EVENT_FAMILIARS];
    const stats = {
      total: allCards.length,
      мифический: allCards.filter(c => c.rank === 'мифический').length,
      ивентовый: allCards.filter(c => c.rank === 'ивентовый').length,
      легендарный: allCards.filter(c => c.rank === 'легендарный').length,
      редкий: allCards.filter(c => c.rank === 'редкий').length,
      обычный: allCards.filter(c => c.rank === 'обычный').length,
    };
    return stats;
  }, []);


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

  const shopOptions = useMemo(() => ALL_SHOPS.map(shop => ({
      value: shop.id,
      label: shop.title,
  })), []);


  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><p>Загрузка данных...</p></div>
  }
  
  return (
    <Tabs defaultValue="points" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="points">Баллы</TabsTrigger>
        <TabsTrigger value="general">Общее</TabsTrigger>
        <TabsTrigger value="familiars">Фамильяры</TabsTrigger>
        <TabsTrigger value="economy">Экономика</TabsTrigger>
        <TabsTrigger value="shops">Магазины</TabsTrigger>
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
                    <CardDescription>Симулируйте автоматические расчеты баллов.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2"><Users /> Еженедельный бонус</h3>
                        <p className="text-sm text-muted-foreground mb-3">Начисляет 800 баллов за активность и баллы за известность всем 'активным' игрокам.</p>
                        <div className="p-4 rounded-md border space-y-3">
                            {weeklyBonusStatus.canAward ? (
                                weeklyBonusStatus.isOverdue ? (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Просрочено!</AlertTitle>
                                    <AlertDescription>
                                        Начисление просрочено на {weeklyBonusStatus.daysSinceLast - 7} д. Игроки получат компенсацию 1000 баллов.
                                    </AlertDescription>
                                </Alert>
                                ) : (
                                <Alert className="border-green-500/50 text-green-700">
                                     <Bell className="h-4 w-4" />
                                    <AlertTitle>Время начислять!</AlertTitle>
                                    <AlertDescription>
                                        Прошло 7 дней. Пора начислить еженедельные бонусы.
                                    </AlertDescription>
                                </Alert>
                                )
                            ) : (
                                 <Alert variant="default">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertTitle>Все в порядке</AlertTitle>
                                    <AlertDescription>
                                       Следующее начисление через {7 - weeklyBonusStatus.daysSinceLast} д.
                                    </AlertDescription>
                                </Alert>
                            )}
                            <Button onClick={handleWeeklyCalculations} disabled={!weeklyBonusStatus.canAward || isProcessingWeekly} className="w-full">
                                {isProcessingWeekly ? 'Обработка...' : 'Запустить еженедельный расчет'}
                            </Button>
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
                    <CardTitle className="flex items-center gap-2"><CalendarClock /> Управление игровой датой</CardTitle>
                    <CardDescription>Измените текущую дату в игровом мире.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdateGameDate} className="space-y-4">
                        <div>
                            <Label htmlFor="game-date-input">Текущая дата</Label>
                            <Input
                            id="game-date-input"
                            type="text"
                            value={newGameDateString}
                            onChange={(e) => setNewGameDateString(e.target.value)}
                            placeholder="например, 21 марта 2709 год"
                            disabled={isUpdatingDate}
                            />
                        </div>
                        <Button type="submit" disabled={isUpdatingDate || newGameDateString === initialGameDate}>
                            {isUpdatingDate ? 'Сохранение...' : 'Сохранить дату'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
            </div>
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

      <TabsContent value="familiars" className="mt-4">
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
                                    <span className="font-bold"> {FAMILIARS_BY_ID[removeFamiliarCardId]?.name} </span> 
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
                    <CardTitle className="flex items-center gap-2"><DatabaseZap /> Восстановление фамильяров</CardTitle>
                    <CardDescription>Восстановить утерянных фамильяров для персонажа на основе истории баллов.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="recovery-user">Пользователь</Label>
                            <SearchableSelect
                                options={userOnlyOptions}
                                value={recoveryUserId}
                                onValueChange={uid => { setRecoveryUserId(uid); setRecoveryCharId(''); }}
                                placeholder="Выберите пользователя"
                            />
                        </div>
                        <div>
                            <Label htmlFor="recovery-char">Персонаж</Label>
                             <SearchableSelect
                                options={charactersForRecovery}
                                value={recoveryCharId}
                                onValueChange={setRecoveryCharId}
                                placeholder="Выберите персонажа"
                                disabled={!recoveryUserId}
                            />
                        </div>
                        <div>
                            <Label htmlFor="recovery-old-name">Старое имя персонажа (если менялось)</Label>
                            <Input
                                id="recovery-old-name"
                                value={recoveryOldName}
                                onChange={e => setRecoveryOldName(e.target.value)}
                                placeholder="например, Милти Слоя"
                                disabled={!recoveryCharId}
                            />
                        </div>
                        <Button onClick={handleRecovery} disabled={!recoveryCharId || isRecovering}>
                            {isRecovering ? 'Восстановление...' : <><History className="mr-2 h-4 w-4" />Начать восстановление</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>
            </div>
        </div>
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
                             <div>
                                <Label>Пользователь и персонаж</Label>
                                <div className="flex gap-2">
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
                            <div>
                                <Label>Пользователь и персонаж</Label>
                                <div className="flex gap-2">
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
                        <CardTitle className="flex items-center gap-2"><Clock /> Экономические действия</CardTitle>
                        <CardDescription>Массовые операции с экономикой.</CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><Users /> Ежемесячная зарплата</h3>
                            <p className="text-sm text-muted-foreground mb-3">Начисляет зарплату всем персонажам в зависимости от их уровня достатка.</p>
                            <Button onClick={handleSalaryPayout} variant="outline">Начислить зарплату</Button>
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
                            <div>
                                <Label>Пользователь и персонаж</Label>
                                <div className="flex gap-2">
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
                    <CardDescription>Назначьте владельца для магазина или таверны на рынке.</CardDescription>
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
                        <Button type="submit">Назначить владельца</Button>
                    </form>
                </CardContent>
            </Card>
           </div>
            <div className="break-inside-avoid mb-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PackagePlus /> Выдать предмет в инвентарь</CardTitle>
                    <CardDescription>Добавьте любой предмет в инвентарь персонажа.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleGiveItem} className="space-y-4">
                        <div>
                            <Label>Пользователь и персонаж</Label>
                            <div className="flex gap-2">
                                <SearchableSelect
                                    options={userOnlyOptions}
                                    value={itemGiveUserId}
                                    onValueChange={uid => { setItemGiveUserId(uid); setItemGiveCharId(''); }}
                                    placeholder="Пользователь"
                                />
                                <SearchableSelect
                                    options={charactersForItemGive}
                                    value={itemGiveCharId}
                                    onValueChange={setItemGiveCharId}
                                    placeholder="Персонаж"
                                    disabled={!itemGiveUserId}
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
                                <div>
                                    <Label htmlFor="new-item-name">Название предмета</Label>
                                    <Input id="new-item-name" value={newItemData.name} onChange={e => setNewItemData(p => ({...p, name: e.target.value}))} />
                                </div>
                                <div>
                                    <Label htmlFor="new-item-desc">Описание</Label>
                                    <Textarea id="new-item-desc" value={newItemData.description} onChange={e => setNewItemData(p => ({...p, description: e.target.value}))} />
                                </div>
                                <div>
                                    <Label htmlFor="new-item-tag">Категория в инвентаре</Label>
                                    <Select value={newItemData.inventoryTag} onValueChange={(v: InventoryCategory) => setNewItemData(p => ({...p, inventoryTag: v}))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {INVENTORY_CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
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
                </CardContent>
            </Card>
           </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
