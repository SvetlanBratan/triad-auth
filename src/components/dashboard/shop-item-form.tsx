
'use client';

import React, { useState, useEffect } from 'react';
import type { ShopItem, Currency, InventoryCategory } from '@/lib/types';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { INVENTORY_CATEGORIES } from '@/lib/data';
import { SearchableSelect } from '../ui/searchable-select';

interface ShopItemFormProps {
    shopId: string;
    item: ShopItem | null;
    closeDialog: () => void;
}

const initialFormData: Omit<ShopItem, 'id'> = {
    name: '',
    description: '',
    price: { platinum: 0, gold: 0, silver: 0, copper: 0 },
    inventoryTag: 'прочее',
    quantity: undefined, // undefined for infinite
};

export default function ShopItemForm({ shopId, item, closeDialog }: ShopItemFormProps) {
    const { addShopItem, updateShopItem } = useUser();
    const { toast } = useToast();
    const [formData, setFormData] = useState<Omit<ShopItem, 'id'>>(initialFormData);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name,
                description: item.description || '',
                price: {
                    platinum: item.price.platinum || 0,
                    gold: item.price.gold || 0,
                    silver: item.price.silver || 0,
                    copper: item.price.copper || 0,
                },
                inventoryTag: item.inventoryTag || 'прочее',
                quantity: item.quantity,
            });
        } else {
            setFormData(initialFormData);
        }
    }, [item]);
    
    const handlePriceChange = (currency: Currency, value: string) => {
        const numValue = parseInt(value, 10) || 0;
        setFormData(prev => ({
            ...prev,
            price: { ...prev.price, [currency]: numValue }
        }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
             const finalData = {
                ...formData,
                quantity: formData.quantity === null || isNaN(Number(formData.quantity)) ? undefined : Number(formData.quantity),
            };

            if (item) {
                const itemDataToUpdate = { ...item, ...finalData };
                await updateShopItem(shopId, itemDataToUpdate);
                toast({ title: "Товар обновлен" });
            } else {
                await addShopItem(shopId, finalData);
                toast({ title: "Товар добавлен" });
            }
            closeDialog();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Произошла ошибка";
            toast({ variant: 'destructive', title: "Ошибка", description: message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <ScrollArea className="max-h-[60vh] p-1">
                <div className="space-y-4 pr-4">
                    <div>
                        <Label htmlFor="name">Название товара</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                            required
                        />
                    </div>
                    
                    <div>
                        <Label htmlFor="description">Описание товара</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                            placeholder="Расскажите о товаре..."
                        />
                    </div>

                    <div>
                        <Label htmlFor="inventoryTag">Категория в инвентаре</Label>
                         <SearchableSelect
                            options={INVENTORY_CATEGORIES}
                            value={formData.inventoryTag}
                            onValueChange={(value) => setFormData(prev => ({...prev, inventoryTag: value as InventoryCategory}))}
                            placeholder="Выберите категорию..."
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                           В эту категорию инвентаря товар попадет после покупки.
                        </p>
                    </div>

                    <div>
                        <Label>Цена за 1 шт.</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Input type="number" placeholder="Платина" value={formData.price.platinum || ''} onChange={e => handlePriceChange('platinum', e.target.value)} />
                            <Input type="number" placeholder="Золото" value={formData.price.gold || ''} onChange={e => handlePriceChange('gold', e.target.value)} />
                            <Input type="number" placeholder="Серебро" value={formData.price.silver || ''} onChange={e => handlePriceChange('silver', e.target.value)} />
                            <Input type="number" placeholder="Медь" value={formData.price.copper || ''} onChange={e => handlePriceChange('copper', e.target.value)} />
                        </div>
                    </div>

                     <div>
                        <Label htmlFor="quantity">Количество в наличии</Label>
                        <Input
                            id="quantity"
                            type="number"
                            value={formData.quantity ?? ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value === '' ? undefined : parseInt(e.target.value, 10) }))}
                            placeholder="Оставьте пустым для бесконечного"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                           Если оставить поле пустым, товар будет считаться бесконечным.
                        </p>
                    </div>
                </div>
             </ScrollArea>
             <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={closeDialog}>Отмена</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Сохранение...' : 'Сохранить'}</Button>
             </div>
        </form>
    );
}
