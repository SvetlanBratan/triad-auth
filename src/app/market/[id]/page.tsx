
'use client';

import React from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import type { Shop, ShopItem, BankAccount } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserCircle, PlusCircle, Edit, Trash2, ShoppingCart, Info, Package, Settings, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import ShopItemForm from '@/components/dashboard/shop-item-form';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
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

export default function ShopPage() {
    const { id } = useParams();
    const router = useRouter();
    const { currentUser, deleteShopItem, purchaseShopItem, restockShopItem, fetchShopById } = useUser();
    const { toast } = useToast();
    
    const shopId = Array.isArray(id) ? id[0] : id;

    const { data: shop, isLoading, refetch } = useQuery<Shop | null>({
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


    const isOwnerOrAdmin = React.useMemo(() => {
        if (!currentUser || !shop) return false;
        return currentUser.role === 'admin' || currentUser.id === shop.ownerUserId;
    }, [currentUser, shop]);
    
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
        setIsPurchaseDialogOpen(true);
    };
    
    const handleRestock = async (item: ShopItem) => {
        if (!shop || !shop.ownerUserId || !shop.ownerCharacterId) return;
        setIsRestockingId(item.id);
        try {
            await restockShopItem(shopId!, item.id, shop.ownerUserId, shop.ownerCharacterId);
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

    const buyerCharacterOptions = React.useMemo(() => {
        if (!currentUser || !totalPrice) return [];
        return currentUser.characters
            .filter(char => {
                const balance = char.bankAccount;
                return (balance.platinum >= totalPrice.platinum) &&
                       (balance.gold >= totalPrice.gold) &&
                       (balance.silver >= totalPrice.silver) &&
                       (balance.copper >= totalPrice.copper);
            })
            .map(char => ({
                value: char.id,
                label: `${char.name} (${formatCurrency(char.bankAccount)})`
            }));
    }, [currentUser, totalPrice]);

    const outOfStockItems = React.useMemo(() => {
        return (shop?.items || []).filter(item => item.quantity === 0);
    }, [shop]);


    if (isLoading) {
        return <div className="container mx-auto p-8"><p>Загрузка магазина...</p></div>;
    }

    if (!shop) {
        notFound();
    }

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
             <Button onClick={() => router.push('/?tab=market')} variant="ghost" className="mb-4 pl-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад на рынок
            </Button>

            <Card className="overflow-hidden">
                 <div className="relative h-64 w-full bg-muted">
                    {shop.image && (
                         <Image
                            src={shop.image}
                            alt={shop.title}
                            fill
                            style={{objectFit: "cover"}}
                            className="w-full h-full"
                            data-ai-hint={shop.aiHint}
                        />
                    )}
                </div>
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">{shop.title}</CardTitle>
                    <CardDescription>{shop.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-start flex-wrap gap-4">
                         {shop.ownerCharacterName ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <UserCircle className="h-5 w-5" />
                                <span>Владелец: 
                                    <Link href={`/characters/${shop.ownerCharacterId}`} className="font-semibold text-primary hover:underline ml-1">
                                        {shop.ownerCharacterName}
                                    </Link>
                                </span>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">У этого магазина пока нет владельца.</p>
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
                        <h3 className="text-2xl font-semibold mb-4">Ассортимент</h3>
                        {shop.items && shop.items.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {shop.items.map(item => {
                                    const isOutOfStock = item.quantity === 0;
                                    return (
                                    <Card key={item.id} className="flex flex-col group">
                                        <CardHeader className="flex-grow">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg">{item.name}</CardTitle>
                                                {isOwnerOrAdmin && (
                                                    <div className="flex gap-2">
                                                        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => { setEditingItem(item); setIsFormOpen(true); }}><Edit className="h-4 w-4"/></Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button size="icon" variant="destructive" className="h-8 w-8"><Trash2 className="h-4 w-4"/></Button>
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
                                            {item.description && <CardDescription className="pt-2 text-sm">{item.description}</CardDescription>}
                                        </CardHeader>
                                        <CardFooter className="flex-col items-start gap-4 pt-0 mt-auto">
                                             {item.quantity !== undefined && item.quantity >= 0 && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Package className="h-4 w-4" />
                                                    <span>Осталось: {item.quantity} шт.</span>
                                                </div>
                                            )}
                                            <div className="text-primary font-bold">
                                                {formatCurrency(item.price)}
                                            </div>
                                            {!isOwnerOrAdmin && (
                                                <Button className="w-full" onClick={() => handlePurchaseClick(item)} disabled={isOutOfStock}>
                                                    <ShoppingCart className="mr-2 h-4 w-4" /> {isOutOfStock ? "Нет в наличии" : "Купить"}
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                )})}
                            </div>
                        ) : (
                             <p className="text-center text-muted-foreground py-8">В этом магазине пока нет товаров.</p>
                        )}
                    </div>

                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleFormClose()}>
                <DialogContent>
                     <DialogHeader>
                        <DialogTitle>{editingItem ? "Редактировать товар" : "Добавить новый товар"}</DialogTitle>
                     </DialogHeader>
                     <ShopItemForm shopId={shopId!} item={editingItem} closeDialog={handleFormClose} />
                </DialogContent>
            </Dialog>

            <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Управление магазином</DialogTitle>
                        <DialogDescription>
                            Пополняйте запасы товаров, которые закончились. Стоимость пополнения составляет 30% от базовой цены товара.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <h4 className="font-semibold mb-2">Товары не в наличии</h4>
                        {outOfStockItems.length > 0 ? (
                            <div className="space-y-4">
                                {outOfStockItems.map(item => {
                                    const restockCost = {
                                        platinum: Math.ceil((item.price.platinum || 0) * 0.3),
                                        gold: Math.ceil((item.price.gold || 0) * 0.3),
                                        silver: Math.ceil((item.price.silver || 0) * 0.3),
                                        copper: Math.ceil((item.price.copper || 0) * 0.3),
                                    }
                                    return (
                                        <div key={item.id} className="flex justify-between items-center p-3 border rounded-md">
                                            <div>
                                                <p className="font-semibold">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">Базовая цена: {formatCurrency(item.price)}</p>
                                            </div>
                                            <Button 
                                                onClick={() => handleRestock(item)}
                                                disabled={isRestockingId === item.id}
                                            >
                                                 <RefreshCw className="mr-2 h-4 w-4" />
                                                 {isRestockingId === item.id ? "Пополняем..." : `Пополнить за ${formatCurrency(restockCost)}`}
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
                </DialogContent>
            </Dialog>
            
            <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Подтверждение покупки</DialogTitle>
                        <DialogDescription>
                            Вы собираетесь купить "{selectedItemForPurchase?.name}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Количество</Label>
                            <Input 
                                id="quantity"
                                type="number"
                                value={purchaseQuantity}
                                onChange={e => {
                                    const val = parseInt(e.target.value, 10);
                                    if(val > 0) setPurchaseQuantity(val);
                                }}
                                min={1}
                                max={selectedItemForPurchase?.quantity}
                            />
                        </div>

                         <div className="text-right">
                            <p className="text-sm text-muted-foreground">Итоговая стоимость:</p>
                            <p className="font-bold text-primary">{formatCurrency(totalPrice as BankAccount)}</p>
                        </div>
                        
                         <div className="space-y-2">
                             <label htmlFor="buyer-character" className="text-sm font-medium">Выберите персонажа для оплаты:</label>
                             {buyerCharacterOptions && buyerCharacterOptions.length > 0 ? (
                                <SearchableSelect
                                    options={buyerCharacterOptions}
                                    value={buyerCharacterId}
                                    onValueChange={setBuyerCharacterId}
                                    placeholder="Выберите персонажа..."
                                />
                             ) : (
                                <Alert variant="destructive">
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>Недостаточно средств</AlertTitle>
                                    <AlertDescription>
                                        Ни у одного из ваших персонажей нет достаточно средств для совершения этой покупки.
                                    </AlertDescription>
                                </Alert>
                             )}
                         </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Отмена</Button></DialogClose>
                        <Button 
                            onClick={handleConfirmPurchase}
                            disabled={isPurchasing || !buyerCharacterId || purchaseQuantity <= 0 || (selectedItemForPurchase?.quantity !== undefined && purchaseQuantity > selectedItemForPurchase.quantity)}
                        >
                            {isPurchasing ? "Обработка..." : "Подтвердить"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

    

    