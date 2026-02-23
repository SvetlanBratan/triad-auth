'use client';

import React from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import type { Shop, ShopItem, BankAccount, Character, InventoryCategory, InventoryItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserCircle, PlusCircle, Edit, Trash2, ShoppingCart, Info, Package, Settings, RefreshCw, BadgeCheck, Save, Search, WalletCards, Eye } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import ShopItemForm from '@/components/dashboard/shop-item-form';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, cn } from '@/lib/utils';
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
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import FormattedTextRenderer from '@/components/dashboard/formatted-text-renderer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { INVENTORY_CATEGORIES } from '@/lib/data';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/components/providers/user-provider';
import AuthPage from '@/components/auth/auth-page';

export default function ShopPage() {
    const { id } = useParams();
    const router = useRouter();
    const { currentUser, deleteShopItem, purchaseShopItem, restockShopItem, fetchShopById, updateShopDetails, withdrawFromShopTill, adminAddShop } = useUser();
    const { loading } = useAuth();
    const { toast } = useToast();
    const shopId = Array.isArray(id) ? id[0] : id;

    const { data: shop, isPending, refetch } = useQuery<Shop | null>({
        queryKey: ['shop', shopId],
        queryFn: () => fetchShopById(shopId!),
        enabled: !!shopId,
    });

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<ShopItem | null>(null);
    const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = React.useState(false);
    const [selectedItemForPurchase, setSelectedItemForPurchase] = React.useState<ShopItem | null>(null);
    const [buyerCharacterId, setBuyerCharacterId] = React.useState('');
    const [isPurchasing, setIsPurchasing] = React.useState(false);
    const [purchaseQuantity, setPurchaseQuantity] = React.useState(1);
    const [isManageDialogOpen, setIsManageDialogOpen] = React.useState(false);
    const [isRestockingId, setIsRestockingId] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState('');
    
    const [editedTitle, setEditedTitle] = React.useState('');
    const [editedDescription, setEditedDescription] = React.useState('');
    const [isSavingDetails, setIsSavingDetails] = React.useState(false);
    const [defaultNewItemCategory, setDefaultNewItemCategory] = React.useState<InventoryCategory>('прочее');
    const [isWithdrawing, setIsWithdrawing] = React.useState(false);

    React.useEffect(() => {
        if (shop) {
            setEditedTitle(shop.title);
            setEditedDescription(shop.description);
            setDefaultNewItemCategory(shop.defaultNewItemCategory || 'прочее');
        }
    }, [shop]);

    const isOwnerOrAdmin = React.useMemo(() => {
        if (!currentUser || !shop) return false;
        return currentUser.role === 'admin' || currentUser.id === shop.ownerUserId;
    }, [currentUser, shop]);
    
    const isOwner = React.useMemo(() => {
        if (!currentUser || !shop) return false;
        return currentUser.id === shop.ownerUserId;
    }, [currentUser, shop]);

    const totalPrice = React.useMemo(() => {
        if (!selectedItemForPurchase) return null;
        const { platinum = 0, gold = 0, silver = 0, copper = 0 } = selectedItemForPurchase.price;
        return {
            platinum: platinum * purchaseQuantity,
            gold: gold * purchaseQuantity,
            silver: silver * purchaseQuantity,
            copper: copper * purchaseQuantity,
        };
    }, [selectedItemForPurchase, purchaseQuantity]);

    const buyerCharacters = React.useMemo(() => {
        if (!currentUser || !totalPrice) return [];
        return currentUser.characters.filter(char => {
            const balance = char.bankAccount;
            return (totalPrice.platinum <= 0 || balance.platinum >= totalPrice.platinum) &&
                   (totalPrice.gold <= 0 || balance.gold >= totalPrice.gold) &&
                   (totalPrice.silver <= 0 || balance.silver >= totalPrice.silver) &&
                   (totalPrice.copper <= 0 || balance.copper >= totalPrice.copper);
        });
    }, [currentUser, totalPrice]);

    const buyerCharacterOptions = React.useMemo(() => {
        return buyerCharacters.map(char => ({
            value: char.id,
            label: `${char.name} (${formatCurrency(char.bankAccount)})`
        }));
    }, [buyerCharacters]);

    const outOfStockItems = React.useMemo(() => {
        return (shop?.items || []).filter(item => item.quantity === 0);
    }, [shop]);

    const filteredItems = React.useMemo(() => {
        if (!shop?.items) return [];
        let items = [...shop.items];
        
        if (!isOwnerOrAdmin) {
            items = items.filter(item => !item.isHidden);
        }

        // Мы убираем сортировку по популярности, так как она заставляет товары прыгать 
        // и менять высоту контейнера при каждом обновлении данных.
        // Используем стабильную сортировку по имени.
        const sortedItems = items.sort((a, b) => a.name.localeCompare(b.name));
        
        if (!searchQuery) return sortedItems;

        return sortedItems.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [shop?.items, searchQuery, isOwnerOrAdmin]);

    if (loading || (isPending && !shop)) {
        return <div className="container mx-auto p-8"><p>Загрузка магазина...</p></div>;
    }

    if (!currentUser) {
        return <AuthPage />;
    }
    
    if (!shop) {
        notFound();
    }

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingItem(null);
        refetch();
    };
    
    const handleDelete = async (itemId: string) => {
        if (!shopId) return;
        try {
            await deleteShopItem(shopId, itemId);
            toast({ title: "Товар удален", description: "Товар был успешно удален из вашего магазина." });
            refetch();
        } catch (e) {
            toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось удалить товар." });
        }
    }

    const handlePurchaseClick = (item: ShopItem) => {
        setSelectedItemForPurchase(item);
        setPurchaseQuantity(1);
        setBuyerCharacterId(''); 
        setIsPurchaseDialogOpen(true);
    };
    
    const handleRestock = async (item: ShopItem) => {
        if (!shop) return;
        setIsRestockingId(item.id);
        try {
            await restockShopItem(shopId!, item.id);
            toast({ title: "Запасы пополнены!", description: `Товар "${item.name}" снова в наличии.` });
            refetch();
        } catch(e) {
             const message = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
            toast({ variant: 'destructive', title: "Ошибка пополнения", description: message });
        } finally {
            setIsRestockingId(null);
        }
    }

    const handleConfirmPurchase = async () => {
        if (!currentUser || !selectedItemForPurchase || !buyerCharacterId || !shopId || purchaseQuantity <= 0) return;
        setIsPurchasing(true);
        try {
            await purchaseShopItem(shopId, selectedItemForPurchase.id, currentUser.id, buyerCharacterId, purchaseQuantity);
            toast({ title: "Покупка совершена!", description: `Вы приобрели "${selectedItemForPurchase.name}" x${purchaseQuantity}.` });
            setIsPurchaseDialogOpen(false);
            setSelectedItemForPurchase(null);
            setBuyerCharacterId('');
            refetch();
        } catch (e) {
            const message = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
            toast({ variant: 'destructive', title: "Ошибка покупки", description: message });
        } finally {
            setIsPurchasing(false);
        }
    }

    const handleSaveChanges = async () => {
        if (!shop) return;
        setIsSavingDetails(true);
        try {
            await updateShopDetails(shop.id, { 
                title: editedTitle, 
                description: editedDescription,
                defaultNewItemCategory: defaultNewItemCategory 
            });
            toast({ title: "Информация о заведении обновлена" });
            refetch();
            setIsManageDialogOpen(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Произошла неизвестная ошибка.";
            toast({ variant: 'destructive', title: "Ошибка сохранения", description: message });
        } finally {
            setIsSavingDetails(false);
        }
    };
    
    const handleWithdraw = async () => {
        if (!shop) return;
        setIsWithdrawing(true);
        try {
            await withdrawFromShopTill(shop.id);
            toast({ title: "Средства выведены", description: "Деньги из кассы заведения были перечислены на счет вашего персонажа." });
            refetch();
        } catch(e) {
            const message = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
            toast({ variant: 'destructive', title: "Ошибка вывода", description: message });
        } finally {
            setIsWithdrawing(false);
        }
    }

    const shopBalance = shop.bankAccount || { platinum: 0, gold: 0, silver: 0, copper: 0 };
    const hasMoneyInTill = Object.values(shopBalance).some(amount => amount > 0);

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
             <Button asChild variant="ghost" className="mb-4 pl-1">
                <Link href="/?tab=market">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Назад на рынок
                </Link>
            </Button>

            <Card className="overflow-hidden">
                 <div className="relative h-64 w-full bg-muted">
                    {shop.image && (
                         <Image
                            src={shop.image}
                            alt={shop.title}
                            fill
                            priority
                            style={{objectFit: "cover"}}
                            className="w-full h-full"
                            data-ai-hint={shop.aiHint}
                        />
                    )}
                </div>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-3xl font-headline flex-shrink">{shop.title}</CardTitle>
                        {shop.hasLicense && <BadgeCheck className="w-6 h-6 text-green-600 shrink-0" />}
                    </div>
                    <CardDescription>{shop.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-start flex-wrap gap-4">
                         {shop.ownerCharacterName ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <UserCircle className="h-5 v-5" />
                                <span>Владелец: 
                                    <Link href={`/characters/${shop.ownerCharacterId}`} className="font-semibold text-primary hover:underline ml-1">
                                        {shop.ownerCharacterName}
                                    </Link>
                                </span>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">У этого заведения пока нет владельца.</p>
                        )}

                        {isOwnerOrAdmin && (
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => setIsManageDialogOpen(true)}>
                                    <Settings className="mr-2 h-4 w-4"/> Управление
                                </Button>
                                <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }}>
                                    <PlusCircle className="mr-2 h-4 w-4"/> Добавить товар
                                </Button>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-8">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                             <h3 className="text-2xl font-semibold">Ассортимент</h3>
                             <div className="relative w-full sm:max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Найти товар..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                             </div>
                        </div>
                       
                        {filteredItems.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6">
                                {filteredItems.map(item => {
                                    const isAffordableByShop = Object.entries(item.price).every(([currency, val]) => {
                                        if (val >= 0) return true;
                                        return (shopBalance[currency as keyof BankAccount] as number || 0) >= Math.abs(val);
                                    });

                                    return (
                                    <Card key={item.id} className={cn("flex flex-col group overflow-hidden w-full h-full", (item.isHidden || (!isAffordableByShop && Object.values(item.price).some(v => v < 0))) && "opacity-60")}>
                                        {item.image && (
                                            <div className="relative w-full aspect-square bg-muted">
                                                 <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    style={{objectFit:"contain"}}
                                                />
                                            </div>
                                        )}
                                        <CardHeader className="p-2 sm:p-6">
                                            <div className="flex justify-between items-start gap-1">
                                                <CardTitle className="text-sm sm:text-lg flex items-center gap-1 sm:gap-2">
                                                  <span className="line-clamp-2">{item.name}</span>
                                                  {item.isHidden && <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />}
                                                </CardTitle>
                                                {isOwnerOrAdmin && (
                                                    <div className="flex gap-1 sm:gap-2">
                                                        <Button size="icon" variant="secondary" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => { setEditingItem(item); setIsFormOpen(true); }}><Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4"/></Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button size="icon" variant="destructive" className="h-7 w-7 sm:h-8 sm:w-8"><Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4"/></Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Это действие удалит товар "{item.name}" без возможности восстановления.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive hover:bg-destructive/90">Удалить</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-2 sm:p-6 pt-0 flex-grow">
                                            {item.description && 
                                                <ScrollArea className="h-16 sm:h-24 pr-2">
                                                    <CardDescription className="text-[10px] sm:text-sm">
                                                        <FormattedTextRenderer text={item.description} />
                                                    </CardDescription>
                                                </ScrollArea>
                                            }
                                        </CardContent>
                                        <CardFooter className="flex-col items-start gap-2 sm:gap-4 p-2 sm:p-6 pt-0 sm:pt-4">
                                             {item.quantity !== undefined && item.quantity >= 0 && (
                                                <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm text-muted-foreground">
                                                    <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    <span>Осталось: {item.quantity} шт.</span>
                                                </div>
                                            )}
                                            <div className={cn("font-bold text-xs sm:text-base", Object.values(item.price).some(v => v < 0) ? "text-green-600" : "text-primary")}>
                                                {formatCurrency(item.price)}
                                            </div>
                                            <Button 
                                                className="w-full h-8 sm:h-10 text-xs sm:text-sm" 
                                                onClick={() => handlePurchaseClick(item)}
                                                disabled={Object.values(item.price).some(v => v < 0) && !isAffordableByShop}
                                            >
                                                <ShoppingCart className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> 
                                                {Object.values(item.price).some(v => v < 0) && !isAffordableByShop ? "Нет средств в кассе" : "Купить"}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                )})}
                            </div>
                        ) : (
                             <p className="text-center text-muted-foreground py-8">
                                {shop.items && shop.items.length > 0 ? "По вашему запросу ничего не найдено." : "В этом магазине пока нет товаров."}
                             </p>
                        )}
                    </div>

                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleFormClose()}>
                <DialogContent className="max-w-2xl" onCloseAutoFocus={(e) => e.preventDefault()} onOpenAutoFocus={(e) => e.preventDefault()}>
                     <DialogHeader>
                        <DialogTitle>{editingItem ? "Редактировать товар" : "Добавить новый товар"}</DialogTitle>
                     </DialogHeader>
                     <ShopItemForm 
                        shopId={shopId!} 
                        item={editingItem} 
                        closeDialog={handleFormClose} 
                        defaultCategory={defaultNewItemCategory}
                     />
                </DialogContent>
            </Dialog>

            <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
                <DialogContent className="max-w-3xl" onCloseAutoFocus={(e) => e.preventDefault()} onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>Управление магазином</DialogTitle>
                        <DialogDescription>
                            Здесь вы можете изменить информацию о вашем заведении и пополнить запасы товаров.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh]">
                        <div className="py-4 pr-6 space-y-6">
                            <div className="space-y-4 p-4 border rounded-md">
                                <h4 className="font-semibold mb-2">Настройки магазина</h4>
                                <div className="space-y-2">
                                    <Label htmlFor="shopTitle">Название</Label>
                                    <Input id="shopTitle" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="shopDescription">Описание</Label>
                                    <Textarea id="shopDescription" value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="defaultCategory">Категория по умолчанию для новых товаров</Label>
                                    <SearchableSelect
                                        options={INVENTORY_CATEGORIES}
                                        value={defaultNewItemCategory}
                                        onValueChange={(v) => setDefaultNewItemCategory(v as InventoryCategory)}
                                        placeholder="Выберите категорию..."
                                    />
                                </div>
                                <Button onClick={handleSaveChanges} disabled={isSavingDetails}>
                                    <Save className="mr-2 h-4 w-4" /> {isSavingDetails ? "Сохранение..." : "Сохранить информацию"}
                                </Button>
                            </div>
                            
                            <div className="space-y-4 p-4 border rounded-md">
                                <h4 className="font-semibold mb-2">Касса заведения</h4>
                                <div className="p-4 bg-muted rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm text-muted-foreground">Текущий баланс:</p>
                                        <p className="text-xl font-bold text-primary">{formatCurrency(shopBalance)}</p>
                                    </div>
                                    <Button onClick={handleWithdraw} disabled={isWithdrawing || !hasMoneyInTill}>
                                        <WalletCards className="mr-2 h-4 w-4" /> 
                                        {isWithdrawing ? "Перевод..." : "Вывести средства"}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4 p-4 border rounded-md">
                                <h4 className="font-semibold mb-2">Товары не в наличии</h4>
                                <p className="text-sm text-muted-foreground">Стоимость пополнения составляет 30% от базовой цены товара и списывается из кассы заведения.</p>
                                {outOfStockItems.length > 0 ? (
                                    <div className="space-y-4">
                                        {outOfStockItems.map(item => {
                                            const restockCost = {
                                                platinum: Math.ceil((item.price.platinum || 0) * 0.3),
                                                gold: Math.ceil((item.price.gold || 0) * 0.3),
                                                silver: Math.ceil((item.price.silver || 0) * 0.3),
                                                copper: Math.ceil((item.price.copper || 0) * 0.3),
                                            }
                                            const canAffordRestock = 
                                                (shopBalance.platinum >= restockCost.platinum) &&
                                                (shopBalance.gold >= restockCost.gold) &&
                                                (shopBalance.silver >= restockCost.silver) &&
                                                (shopBalance.copper >= restockCost.copper);

                                            return (
                                                <div key={item.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                                                    <div>
                                                        <p className="font-semibold">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">Стоимость пополнения: {formatCurrency(restockCost)}</p>
                                                    </div>
                                                    <Button 
                                                        onClick={() => handleRestock(item)}
                                                        disabled={isRestockingId === item.id || !canAffordRestock}
                                                    >
                                                        <RefreshCw className="mr-2 h-4 w-4" />
                                                        {isRestockingId === item.id ? "Пополняем..." : (canAffordRestock ? "Пополнить" : "Недостаточно средств")}
                                                    </Button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        Все товары в наличии.
                                    </p>
                                )}
                            </div>
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
            
            <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
                <DialogContent onCloseAutoFocus={(e) => e.preventDefault()} onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>Подтверждение покупки</DialogTitle>
                        {selectedItemForPurchase &&
                            <DialogDescription>
                                Вы собираетесь купить "{selectedItemForPurchase.name}".
                            </DialogDescription>
                        }
                    </DialogHeader>
                    {(() => {
                        if (!selectedItemForPurchase) return null;

                        const buyerChar = buyerCharacters.find(c => c.id === buyerCharacterId);

                        const isOutOfStock = selectedItemForPurchase.quantity === 0;

                        const alreadyPurchased = buyerChar && selectedItemForPurchase.isSinglePurchase &&
                            Object.values(buyerChar.inventory).flat().some(invItem => (invItem as InventoryItem).name === selectedItemForPurchase!.name);

                        const meetsRaceRequirement = !buyerChar || !selectedItemForPurchase.excludedRaces || !selectedItemForPurchase.excludedRaces.includes(buyerChar.race.split(' (')[0]);

                        const meetsDocumentRequirement = !buyerChar || !selectedItemForPurchase.requiredDocument || 
                            (buyerChar.inventory.документы || []).some(doc => doc.name === selectedItemForPurchase!.requiredDocument);
                            
                        const isShopPaying = Object.values(totalPrice || {}).some(v => v < 0);
                        const isAffordableByShop = Object.entries(totalPrice || {}).every(([currency, val]) => {
                            if (val >= 0) return true;
                            return (shopBalance[currency as keyof BankAccount] as number || 0) >= Math.abs(val);
                        });

                        const canPurchase = buyerChar && !isOutOfStock && !alreadyPurchased && meetsRaceRequirement && meetsDocumentRequirement && (!isShopPaying || isAffordableByShop);
                        
                        let disabledReason = '';
                        if(isOutOfStock) disabledReason = "Нет в наличии";
                        else if (alreadyPurchased) disabledReason = "Уже приобретено";
                        else if (!meetsRaceRequirement) disabledReason = "Недоступно для вашей расы";
                        else if (!meetsDocumentRequirement) disabledReason = `Требуется документ: ${selectedItemForPurchase.requiredDocument}`;
                        else if (isShopPaying && !isAffordableByShop) disabledReason = "В кассе заведения недостаточно средств для выплаты";

                        return (
                            <>
                                <div className="py-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="quantity">Количество</Label>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            value={purchaseQuantity}
                                            onChange={e => {
                                                const val = parseInt(e.target.value, 10);
                                                if (val > 0) setPurchaseQuantity(val);
                                            }}
                                            min={1}
                                            max={selectedItemForPurchase.isSinglePurchase ? 1 : selectedItemForPurchase.quantity}
                                            disabled={selectedItemForPurchase.isSinglePurchase}
                                        />
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">{isShopPaying ? "Вы получите:" : "Итоговая стоимость:"}</p>
                                        <p className={cn("font-bold", isShopPaying ? "text-green-600" : "text-primary")}>
                                            {formatCurrency(totalPrice as BankAccount)}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="buyer-character" className="text-sm font-medium">Выберите персонажа:</label>
                                        {buyerCharacterOptions && buyerCharacterOptions.length > 0 ? (
                                            <SearchableSelect
                                                options={buyerCharacterOptions}
                                                value={buyerCharacterId}
                                                onValueChange={setBuyerCharacterId}
                                                placeholder="Выберите персонажа..."
                                                renderSelected={(option) => {
                                                    const character = buyerCharacters.find(c => c.id === option.value);
                                                    if (!character) return option.label;
                                                    return (
                                                        <div className="flex flex-col items-start">
                                                            <span>{character.name}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatCurrency(character.bankAccount)}
                                                            </span>
                                                        </div>
                                                    );
                                                }}
                                                renderOption={(option) => {
                                                     const character = buyerCharacters.find(c => c.id === option.value);
                                                    if (!character) return option.label;
                                                    return (
                                                        <div>
                                                            <div>{character.name}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Баланс: {formatCurrency(character.bankAccount)}
                                                            </div>
                                                        </div>
                                                    );
                                                }}
                                            />
                                        ) : (
                                            <Alert variant="destructive">
                                                <Info className="h-4 w-4" />
                                                <AlertTitle>Нет подходящих персонажей</AlertTitle>
                                                <AlertDescription>
                                                    Ни у одного из ваших персонажей нет достаточно средств для совершения этой покупки.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                    {buyerCharacterId && disabledReason && (
                                        <Alert variant="destructive">
                                            <Info className="h-4 w-4" />
                                            <AlertTitle>Невозможно совершить операцию</AlertTitle>
                                            <AlertDescription>
                                                {disabledReason}
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="ghost">Отмена</Button></DialogClose>
                                    <Button
                                        onClick={handleConfirmPurchase}
                                        disabled={isPurchasing || !canPurchase || purchaseQuantity <= 0 || (selectedItemForPurchase.quantity !== undefined && purchaseQuantity > selectedItemForPurchase.quantity)}
                                    >
                                        {isPurchasing ? "Обработка..." : "Подтвердить"}
                                    </Button>
                                </DialogFooter>
                            </>
                        )
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    );
}
