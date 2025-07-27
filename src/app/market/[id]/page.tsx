
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import type { Shop, ShopItem, Character } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ArrowLeft, UserCircle, PlusCircle, Edit, Trash2, ShoppingCart, Info } from 'lucide-react';
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

export default function ShopPage() {
    const { id } = useParams();
    const router = useRouter();
    const { currentUser, fetchShopById, deleteShopItem, purchaseShopItem } = useUser();
    const { toast } = useToast();
    const [shop, setShop] = useState<Shop | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
    const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
    const [selectedItemForPurchase, setSelectedItemForPurchase] = useState<ShopItem | null>(null);
    const [buyerCharacterId, setBuyerCharacterId] = useState('');
    const [isPurchasing, setIsPurchasing] = useState(false);


    const shopId = Array.isArray(id) ? id[0] : id;

    const isOwnerOrAdmin = useMemo(() => {
        if (!currentUser || !shop) return false;
        return currentUser.role === 'admin' || currentUser.id === shop.ownerUserId;
    }, [currentUser, shop]);

    const loadShop = async () => {
        setIsLoading(true);
        try {
            const fetchedShop = await fetchShopById(shopId);
            if (fetchedShop) {
                setShop(fetchedShop);
            } else {
                notFound();
            }
        } catch (error) {
            console.error("Failed to load shop data", error);
            notFound();
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (!shopId) return;
        loadShop();
    }, [shopId, fetchShopById]);

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingItem(null);
        loadShop(); // Refetch shop data after form is closed
    };
    
    const handleDelete = async (itemId: string) => {
        try {
            await deleteShopItem(shopId, itemId);
            toast({ title: "Товар удален", description: "Товар был успешно удален из вашего магазина." });
            loadShop();
        } catch (e) {
            toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось удалить товар." });
        }
    }

    const handlePurchaseClick = (item: ShopItem) => {
        setSelectedItemForPurchase(item);
        setIsPurchaseDialogOpen(true);
    };

    const handleConfirmPurchase = async () => {
        if (!currentUser || !selectedItemForPurchase || !buyerCharacterId) return;
        setIsPurchasing(true);
        try {
            await purchaseShopItem(shopId, selectedItemForPurchase.id, currentUser.id, buyerCharacterId);
            toast({ title: "Покупка совершена!", description: `Вы приобрели "${selectedItemForPurchase.name}".` });
            setIsPurchaseDialogOpen(false);
            setSelectedItemForPurchase(null);
            setBuyerCharacterId('');
        } catch (e) {
            const message = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
            toast({ variant: 'destructive', title: "Ошибка покупки", description: message });
        } finally {
            setIsPurchasing(false);
        }
    }
    
    const buyerCharacterOptions = useMemo(() => {
        if (!currentUser || !selectedItemForPurchase) return [];
        return currentUser.characters
            .filter(char => {
                const price = selectedItemForPurchase.price;
                const balance = char.bankAccount;
                return (balance.platinum >= (price.platinum || 0)) &&
                       (balance.gold >= (price.gold || 0)) &&
                       (balance.silver >= (price.silver || 0)) &&
                       (balance.copper >= (price.copper || 0));
            })
            .map(char => ({
                value: char.id,
                label: `${char.name} (${formatCurrency(char.bankAccount)})`
            }));
    }, [currentUser, selectedItemForPurchase]);


    if (isLoading) {
        return <div className="container mx-auto p-8"><p>Загрузка магазина...</p></div>;
    }

    if (!shop) {
        return notFound();
    }

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад на рынок
            </Button>

            <Card className="overflow-hidden">
                <div className="relative h-64 w-full">
                    <Image
                        src={shop.image}
                        alt={shop.title}
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint={shop.aiHint}
                    />
                </div>
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">{shop.title}</CardTitle>
                    <CardDescription>{shop.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-start">
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
                            <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }}>
                                <PlusCircle className="mr-2 h-4 w-4"/> Добавить товар
                            </Button>
                        )}
                    </div>
                    
                    <div className="mt-8">
                        <h3 className="text-2xl font-semibold mb-4">Ассортимент</h3>
                        {shop.items && shop.items.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {shop.items.map(item => (
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
                                            <div className="text-primary font-bold">
                                                {formatCurrency(item.price)}
                                            </div>
                                            {!isOwnerOrAdmin && (
                                                <Button className="w-full" onClick={() => handlePurchaseClick(item)}>
                                                    <ShoppingCart className="mr-2 h-4 w-4" /> Купить
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                ))}
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
                     <ShopItemForm shopId={shopId} item={editingItem} closeDialog={handleFormClose} />
                </DialogContent>
            </Dialog>
            
            <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Подтверждение покупки</DialogTitle>
                        <DialogDescription>
                            Вы собираетесь купить "{selectedItemForPurchase?.name}" за {formatCurrency(selectedItemForPurchase?.price)}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                         <label htmlFor="buyer-character" className="text-sm font-medium">Выберите персонажа для оплаты:</label>
                         {buyerCharacterOptions.length > 0 ? (
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
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Отмена</Button></DialogClose>
                        <Button 
                            onClick={handleConfirmPurchase}
                            disabled={isPurchasing || !buyerCharacterId}
                        >
                            {isPurchasing ? "Обработка..." : "Подтвердить"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
