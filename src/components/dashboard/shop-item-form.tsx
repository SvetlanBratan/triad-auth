
'use client';

import React, { useState, useEffect } from 'react';
import type { ShopItem, Currency } from '@/lib/types';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';

interface ShopItemFormProps {
    shopId: string;
    item: ShopItem | null;
    closeDialog: () => void;
}

const initialFormData: Omit<ShopItem, 'id'> = {
    name: '',
    price: { platinum: 0, gold: 0, silver: 0, copper: 0 },
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
                price: {
                    platinum: item.price.platinum || 0,
                    gold: item.price.gold || 0,
                    silver: item.price.silver || 0,
                    copper: item.price.copper || 0,
                },
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
            if (item) {
                // When updating, we need to include the existing imageUrl
                const itemDataToUpdate = { ...item, ...formData };
                await updateShopItem(shopId, itemDataToUpdate);
                toast({ title: "Товар обновлен" });
            } else {
                await addShopItem(shopId, formData);
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
                        <Label>Цена</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Input type="number" placeholder="Платина" value={formData.price.platinum || ''} onChange={e => handlePriceChange('platinum', e.target.value)} />
                            <Input type="number" placeholder="Золото" value={formData.price.gold || ''} onChange={e => handlePriceChange('gold', e.target.value)} />
                            <Input type="number" placeholder="Серебро" value={formData.price.silver || ''} onChange={e => handlePriceChange('silver', e.target.value)} />
                            <Input type="number" placeholder="Медь" value={formData.price.copper || ''} onChange={e => handlePriceChange('copper', e.target.value)} />
                        </div>
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
