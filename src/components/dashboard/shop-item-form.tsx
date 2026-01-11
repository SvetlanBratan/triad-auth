

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { ShopItem, Currency, InventoryCategory } from '@/lib/types';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
import { INVENTORY_CATEGORIES, RACE_OPTIONS } from '@/lib/data';
import { SearchableSelect } from '../ui/searchable-select';
import ImageKitUploader from './imagekit-uploader';
import { Switch } from '../ui/switch';
import { SearchableMultiSelect } from '../ui/searchable-multi-select';
import { useQuery } from '@tanstack/react-query';
import { Separator } from '../ui/separator';

interface ShopItemFormProps {
    shopId: string;
    item: ShopItem | null;
    closeDialog: () => void;
    defaultCategory: InventoryCategory;
}

const initialFormData: Omit<ShopItem, 'id'> = {
    name: '',
    description: '',
    image: '',
    price: { platinum: 0, gold: 0, silver: 0, copper: 0 },
    inventoryTag: 'прочее',
    quantity: undefined, // undefined for infinite
    isHidden: false,
    isSinglePurchase: false,
    excludedRaces: [],
    requiredDocument: '',
    inventoryItemName: '',
    inventoryItemDescription: '',
    inventoryItemImage: '',
};

export default function ShopItemForm({ shopId, item, closeDialog, defaultCategory }: ShopItemFormProps) {
    const { addShopItem, updateShopItem, fetchAllShops } = useUser();
    const { toast } = useToast();
    const [formData, setFormData] = useState<Omit<ShopItem, 'id'>>(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const [showInventoryFields, setShowInventoryFields] = useState(false);

    const { data: allShops = [] } = useQuery({
      queryKey: ['allShops'],
      queryFn: fetchAllShops,
    });

    const allDocumentOptions = useMemo(() => {
      const documentNames = new Set<string>();
      allShops.forEach(shop => {
        (shop.items || []).forEach(item => {
          if (item.inventoryTag === 'документы' && item.name) {
            documentNames.add(item.name);
          }
        });
      });
      return Array.from(documentNames).map(name => ({ label: name, value: name }));
    }, [allShops]);

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name,
                description: item.description || '',
                image: item.image || '',
                price: {
                    platinum: item.price.platinum || 0,
                    gold: item.price.gold || 0,
                    silver: item.price.silver || 0,
                    copper: item.price.copper || 0,
                },
                inventoryTag: item.inventoryTag || 'прочее',
                quantity: item.quantity,
                isHidden: item.isHidden || false,
                isSinglePurchase: item.isSinglePurchase || false,
                excludedRaces: item.excludedRaces || [],
                requiredDocument: item.requiredDocument || '',
                inventoryItemName: item.inventoryItemName || '',
                inventoryItemDescription: item.inventoryItemDescription || '',
                inventoryItemImage: item.inventoryItemImage || '',
            });
             setShowInventoryFields(!!(item.inventoryItemName || item.inventoryItemDescription || item.inventoryItemImage));
        } else {
            // For new items, use the default category passed from the parent
            setFormData({ ...initialFormData, inventoryTag: defaultCategory });
            setShowInventoryFields(false);
        }
    }, [item, defaultCategory]);
    
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
            let finalData = { ...formData };
            if (!showInventoryFields) {
                finalData = {
                    ...finalData,
                    inventoryItemName: '',
                    inventoryItemDescription: '',
                    inventoryItemImage: '',
                };
            }
            
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
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[75vh]">
            <div className="flex-1 overflow-y-auto pr-6 space-y-4">
                <h4 className="font-semibold text-muted-foreground">Витрина магазина</h4>
                <div className="p-4 border rounded-md space-y-4">
                    <ImageKitUploader
                        currentImageUrl={formData.image}
                        onUpload={(url) => setFormData(p => ({...p, image: url}))}
                    />
                    <div>
                        <Label htmlFor="name">Название товара (на витрине)</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                            required
                        />
                    </div>
                    
                    <div>
                        <Label htmlFor="description">Описание товара (на витрине)</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                            placeholder="Расскажите о товаре..."
                        />
                    </div>
                </div>

                <Separator />

                <div className="flex items-center space-x-2 pt-2">
                    <Switch
                        id="show-inventory-fields"
                        checked={showInventoryFields}
                        onCheckedChange={setShowInventoryFields}
                    />
                    <Label htmlFor="show-inventory-fields">Данные для инвентаря отличаются</Label>
                </div>

                {showInventoryFields && (
                    <>
                        <h4 className="font-semibold text-muted-foreground">Данные в инвентаре</h4>
                        <div className="p-4 border rounded-md space-y-4">
                            <ImageKitUploader
                                currentImageUrl={formData.inventoryItemImage}
                                onUpload={(url) => setFormData(p => ({...p, inventoryItemImage: url}))}
                            />
                            <div>
                                <Label htmlFor="inventory-item-name">Название в инвентаре</Label>
                                <Input
                                    id="inventory-item-name"
                                    value={formData.inventoryItemName || ''}
                                    onChange={(e) => setFormData(prev => ({...prev, inventoryItemName: e.target.value}))}
                                    placeholder="Если не указано, используется название с витрины"
                                />
                            </div>
                            <div>
                                <Label htmlFor="inventory-item-description">Описание в инвентаре</Label>
                                <Textarea
                                    id="inventory-item-description"
                                    value={formData.inventoryItemDescription || ''}
                                    onChange={(e) => setFormData(prev => ({...prev, inventoryItemDescription: e.target.value}))}
                                    placeholder="Если не указано, используется описание с витрины"
                                />
                            </div>
                        </div>
                    </>
                )}

                 <Separator />

                <div>
                    <Label htmlFor="inventoryTag">Категория в инвентаре</Label>
                     <SearchableSelect
                        options={INVENTORY_CATEGORIES}
                        value={formData.inventoryTag ?? 'прочее'}
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
                
                <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-muted-foreground">Ограничения</h4>
                     <div>
                        <Label htmlFor="excludedRaces">Недоступно для рас</Label>
                        <SearchableMultiSelect
                            options={RACE_OPTIONS}
                            selected={formData.excludedRaces || []}
                            onChange={(values) => setFormData(p => ({...p, excludedRaces: values}))}
                            placeholder="Доступно для всех рас"
                        />
                    </div>
                     <div>
                        <Label htmlFor="requiredDocument">Требуется документ</Label>
                        <SearchableSelect
                            options={allDocumentOptions}
                            value={formData.requiredDocument || ''}
                            onValueChange={(value) => setFormData(prev => ({...prev, requiredDocument: value }))}
                            placeholder="Выберите документ..."
                        />
                         <p className="text-xs text-muted-foreground mt-1">
                            Персонаж должен иметь предмет с таким названием в инвентаре в категории "Документы".
                        </p>
                    </div>
                </div>


                 <div className="flex items-center space-x-2 pt-2">
                    <Switch
                        id="isHidden"
                        checked={formData.isHidden}
                        onCheckedChange={(checked) => setFormData(prev => ({...prev, isHidden: checked}))}
                    />
                    <Label htmlFor="isHidden">Скрыть товар от покупателей</Label>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                    <Switch
                        id="isSinglePurchase"
                        checked={formData.isSinglePurchase}
                        onCheckedChange={(checked) => setFormData(prev => ({...prev, isSinglePurchase: checked}))}
                    />
                    <Label htmlFor="isSinglePurchase">Только одна покупка на персонажа</Label>
                </div>
            </div>
             <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={closeDialog}>Отмена</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Сохранение...' : 'Сохранить'}</Button>
             </div>
        </form>
    );
}
