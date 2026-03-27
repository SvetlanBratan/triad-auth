

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { ShopItem, Currency, InventoryCategory } from '@/lib/types';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
import { INVENTORY_CATEGORIES, ELEMENTAL_MAGIC_OPTIONS } from '@/lib/data';
import { SearchableSelect } from '../ui/searchable-select';
import ImageKitUploader from './imagekit-uploader';
import { Switch } from '../ui/switch';
import { SearchableMultiSelect } from '../ui/searchable-multi-select';
import { useQuery } from '@tanstack/react-query';
import { Separator } from '../ui/separator';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import {
    ARMOR_DEFENSE_BONUS_OPTIONS,
    ARMOR_DEFENSE_TYPE_OPTIONS,
    WEAPON_DAMAGE_OPTIONS,
    WEAPON_DAMAGE_TYPE_OPTIONS,
    POTION_HEALING_OPTIONS,
    POTION_MANA_RESTORE_OPTIONS,
    ARTIFACT_RANK_OPTIONS,
    ARTIFACT_RANK_VALUES,
} from '@/lib/item-attributes';

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
    mailOnPurchase: '',
    armorDefenseBonus: undefined,
    armorDefenseType: undefined,
    weaponDamage: undefined,
    weaponDamageType: undefined,
    weaponElement: '',
    potionHealing: undefined,
    potionManaRestore: undefined,
    artifactRank: undefined,
    artifactDamage: undefined,
    artifactDefense: undefined,
    artifactHealing: undefined,
    artifactMana: undefined,
};

export default function ShopItemForm({ shopId, item, closeDialog, defaultCategory }: ShopItemFormProps) {
    const { addShopItem, updateShopItem, fetchAllShops, currentUser } = useUser();
    const { toast } = useToast();
    const [formData, setFormData] = useState<Omit<ShopItem, 'id'>>(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const [showInventoryFields, setShowInventoryFields] = useState(false);
    const [useImageUrl, setUseImageUrl] = React.useState(false);
    const [useInventoryImageUrl, setUseInventoryImageUrl] = React.useState(false);
    const [raceOptions, setRaceOptions] = useState<{ value: string; label: string }[]>([]);
    const [isLoadingRaces, setIsLoadingRaces] = useState(false);

    const isAdmin = currentUser?.role === 'admin';

    const { data: allShops = [] } = useQuery({
      queryKey: ['allShops'],
      queryFn: fetchAllShops,
    });

    useEffect(() => {
        const fetchRaces = async () => {
            setIsLoadingRaces(true);
            try {
                const racesRef = ref(database, 'races');
                const snapshot = await get(racesRef);
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const opts = Object.entries(data)
                        .filter(([id, race]: [string, any]) => race && (race.singularName || race.name))
                        .map(([id, race]: [string, any]) => {
                            const name = (race.singularName || race.name) as string;
                            return { value: name, label: name };
                        })
                        .sort((a, b) => a.label.localeCompare(b.label, 'ru'));
                    setRaceOptions(opts);
                } else {
                    console.warn('No races data found in Realtime Database');
                }
            } catch (e) {
                console.error('Failed to fetch races from database:', e);
            } finally {
                setIsLoadingRaces(false);
            }
        };
        fetchRaces();
    }, []);

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
                mailOnPurchase: item.mailOnPurchase || '',
                armorDefenseBonus: item.armorDefenseBonus,
                armorDefenseType: item.armorDefenseType,
                weaponDamage: item.weaponDamage,
                weaponDamageType: item.weaponDamageType,
                weaponElement: item.weaponElement || '',
                potionHealing: item.potionHealing,
                potionManaRestore: item.potionManaRestore,
                artifactRank: item.artifactRank,
                artifactDamage: item.artifactDamage,
                artifactDefense: item.artifactDefense,
                artifactHealing: item.artifactHealing,
                artifactMana: item.artifactMana,
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
        
        if (!isAdmin && (formData.quantity === undefined || formData.quantity <= 0)) {
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: "Пожалуйста, укажите количество товара (от 1 до 10).",
            });
            return;
        }

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
                     <div>
                        {isAdmin && (
                            <div className="flex items-center space-x-2 my-2">
                                <Switch
                                    id="image-url-switch"
                                    checked={useImageUrl}
                                    onCheckedChange={setUseImageUrl}
                                />
                                <Label htmlFor="image-url-switch">Вставить ссылку на изображение</Label>
                            </div>
                        )}
                        {useImageUrl && isAdmin ? (
                             <div>
                                <Label htmlFor="image-url">URL изображения (витрина)</Label>
                                <Input
                                    id="image-url"
                                    placeholder="https://example.com/image.png"
                                    value={formData.image || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, image: e.target.value }))}
                                />
                            </div>
                        ) : (
                            <ImageKitUploader
                                onUpload={(url) => setFormData(p => ({...p, image: url}))}
                            />
                        )}
                    </div>
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

                {isAdmin && (
                    <>
                        <Separator />
                        <div className="flex items-center space-x-2 pt-2">
                            <Switch
                                id="show-inventory-fields"
                                checked={showInventoryFields}
                                onCheckedChange={setShowInventoryFields}
                            />
                            <Label htmlFor="show-inventory-fields">Данные для инвентаря отличаются</Label>
                        </div>
                    </>
                )}


                {showInventoryFields && isAdmin && (
                    <>
                        <h4 className="font-semibold text-muted-foreground">Данные в инвентаре</h4>
                        <div className="p-4 border rounded-md space-y-4">
                             <div>
                                {isAdmin && (
                                    <div className="flex items-center space-x-2 my-2">
                                        <Switch
                                            id="inventory-image-url-switch"
                                            checked={useInventoryImageUrl}
                                            onCheckedChange={setUseInventoryImageUrl}
                                        />
                                        <Label htmlFor="inventory-image-url-switch">Вставить ссылку на изображение</Label>
                                    </div>
                                )}
                                {useInventoryImageUrl && isAdmin ? (
                                    <div>
                                        <Label htmlFor="inventory-image-url">URL изображения (инвентарь)</Label>
                                        <Input
                                            id="inventory-image-url"
                                            placeholder="https://example.com/image.png"
                                            value={formData.inventoryItemImage || ''}
                                            onChange={(e) => setFormData(p => ({...p, inventoryItemImage: e.target.value}))}
                                        />
                                    </div>
                                ) : (
                                    <ImageKitUploader
                                        onUpload={(url) => setFormData(p => ({...p, inventoryItemImage: url}))}
                                    />
                                )}
                            </div>
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
                        onValueChange={(value) => setFormData(prev => ({
                            ...prev,
                            inventoryTag: value as InventoryCategory,
                            armorDefenseBonus: undefined,
                            armorDefenseType: undefined,
                            weaponDamage: undefined,
                            weaponDamageType: undefined,
                            weaponElement: '',
                            potionHealing: undefined,
                            potionManaRestore: undefined,
                            artifactRank: undefined,
                            artifactDamage: undefined,
                            artifactDefense: undefined,
                            artifactHealing: undefined,
                            artifactMana: undefined,
                        }))}
                        placeholder="Выберите категорию..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                       В эту категорию инвентаря товар попадет после покупки.
                    </p>
                </div>

                {(formData.inventoryTag === 'доспехи' || formData.inventoryTag === 'оружие' || formData.inventoryTag === 'зелья' || formData.inventoryTag === 'артефакты') && (
                    <div className="p-4 border rounded-md space-y-4">
                        <h4 className="font-semibold text-muted-foreground">Характеристики предмета</h4>

                        {formData.inventoryTag === 'доспехи' && (
                            <>
                                <div>
                                    <Label>Защита</Label>
                                    <SearchableSelect
                                        options={ARMOR_DEFENSE_BONUS_OPTIONS}
                                        value={formData.armorDefenseBonus !== undefined ? String(formData.armorDefenseBonus) : ''}
                                        onValueChange={(v) => setFormData(p => ({ ...p, armorDefenseBonus: v ? Number(v) : undefined }))}
                                        placeholder="Выберите уровень защиты..."
                                    />
                                </div>
                                <div>
                                    <Label>Тип защиты</Label>
                                    <SearchableSelect
                                        options={ARMOR_DEFENSE_TYPE_OPTIONS}
                                        value={formData.armorDefenseType || ''}
                                        onValueChange={(v) => setFormData(p => ({ ...p, armorDefenseType: (v || undefined) as any }))}
                                        placeholder="Выберите тип защиты..."
                                    />
                                </div>
                            </>
                        )}

                        {formData.inventoryTag === 'оружие' && (
                            <>
                                <div>
                                    <Label>Урон</Label>
                                    <SearchableSelect
                                        options={WEAPON_DAMAGE_OPTIONS}
                                        value={formData.weaponDamage !== undefined ? String(formData.weaponDamage) : ''}
                                        onValueChange={(v) => setFormData(p => ({ ...p, weaponDamage: v ? Number(v) : undefined }))}
                                        placeholder="Выберите уровень урона..."
                                    />
                                </div>
                                <div>
                                    <Label>Тип урона</Label>
                                    <SearchableSelect
                                        options={WEAPON_DAMAGE_TYPE_OPTIONS}
                                        value={formData.weaponDamageType || ''}
                                        onValueChange={(v) =>
                                            setFormData(p => ({
                                                ...p,
                                                weaponDamageType: (v || undefined) as any,
                                                weaponElement: v === 'Магический' ? (p.weaponElement || '') : '',
                                            }))
                                        }
                                        placeholder="Выберите тип урона..."
                                    />
                                </div>
                                {formData.weaponDamageType === 'Магический' && (
                                    <div>
                                        <Label>Стихия</Label>
                                        <SearchableSelect
                                            options={ELEMENTAL_MAGIC_OPTIONS}
                                            value={formData.weaponElement || ''}
                                            onValueChange={(v) => setFormData(p => ({ ...p, weaponElement: v }))}
                                            placeholder="Выберите стихию..."
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {formData.inventoryTag === 'зелья' && (
                            <>
                                <div>
                                    <Label>Лечение</Label>
                                    <SearchableSelect
                                        options={POTION_HEALING_OPTIONS}
                                        value={formData.potionHealing !== undefined ? String(formData.potionHealing) : ''}
                                        onValueChange={(v) => setFormData(p => ({ ...p, potionHealing: v ? Number(v) : undefined }))}
                                        placeholder="Выберите уровень лечения..."
                                    />
                                </div>
                                <div>
                                    <Label>Восстановление маны</Label>
                                    <SearchableSelect
                                        options={POTION_MANA_RESTORE_OPTIONS}
                                        value={formData.potionManaRestore !== undefined ? String(formData.potionManaRestore) : ''}
                                        onValueChange={(v) => setFormData(p => ({ ...p, potionManaRestore: v ? Number(v) : undefined }))}
                                        placeholder="Выберите восстановление маны..."
                                    />
                                </div>
                            </>
                        )}

                        {formData.inventoryTag === 'артефакты' && (
                            <>
                                <div>
                                    <Label>Ранг артефакта</Label>
                                    <SearchableSelect
                                        options={ARTIFACT_RANK_OPTIONS}
                                        value={formData.artifactRank || ''}
                                        onValueChange={(v) => {
                                            const rank = v || undefined;
                                            if (!rank) {
                                                setFormData(p => ({
                                                    ...p,
                                                    artifactRank: undefined,
                                                    artifactDamage: undefined,
                                                    artifactDefense: undefined,
                                                    artifactHealing: undefined,
                                                    artifactMana: undefined,
                                                }));
                                                return;
                                            }
                                            const values = ARTIFACT_RANK_VALUES[rank as keyof typeof ARTIFACT_RANK_VALUES];
                                            setFormData(p => ({
                                                ...p,
                                                artifactRank: rank as any,
                                                artifactDamage: values.damage,
                                                artifactDefense: values.defense,
                                                artifactHealing: values.heal,
                                                artifactMana: values.mana,
                                            }));
                                        }}
                                        placeholder="Выберите ранг..."
                                    />
                                </div>
                                {formData.artifactRank && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Урон</Label>
                                            <p className="font-medium">+{formData.artifactDamage ?? 0}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Защита</Label>
                                            <p className="font-medium">+{formData.artifactDefense ?? 0}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Лечение (ОЗ)</Label>
                                            <p className="font-medium">+{formData.artifactHealing ?? 0} ОЗ</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Восстановление маны (ОМ)</Label>
                                            <p className="font-medium">+{formData.artifactMana ?? 0} ОМ</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

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
                        onChange={(e) => {
                            const rawValue = e.target.value;
                             if (rawValue === '') {
                                setFormData(prev => ({ ...prev, quantity: undefined }));
                                return;
                            }
                            let numValue = parseInt(rawValue, 10);
                            if(isNaN(numValue)) return;
                            if (!isAdmin && numValue > 10) {
                                numValue = 10;
                            }
                            setFormData(prev => ({ ...prev, quantity: numValue }));
                        }}
                        placeholder={isAdmin ? "Пусто = бесконечно" : "1-10"}
                        disabled={!isAdmin && !!item}
                        required={!isAdmin}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                       {isAdmin 
                        ? "Если оставить поле пустым, товар будет считаться бесконечным."
                        : "Максимум 10. После создания количество изменить нельзя."
                       }
                    </p>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-muted-foreground">Ограничения</h4>
                     <div>
                        <Label htmlFor="excludedRaces">Недоступно для рас</Label>
                        <SearchableMultiSelect
                            options={isLoadingRaces ? [] : raceOptions}
                            selected={formData.excludedRaces || []}
                            onChange={(values) => setFormData(p => ({...p, excludedRaces: values}))}
                            placeholder={isLoadingRaces ? "Загрузка рас..." : "Доступно для всех рас"}
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

                {isAdmin && (
                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-semibold text-muted-foreground">Дополнительные действия</h4>
                        <div>
                            <Label htmlFor="mailOnPurchase">Сообщение при покупке</Label>
                            <Textarea
                                id="mailOnPurchase"
                                value={formData.mailOnPurchase || ''}
                                onChange={(e) => setFormData(p => ({...p, mailOnPurchase: e.target.value}))}
                                placeholder="Это сообщение будет отправлено на почту покупателю. Например: 'Пароль от номера: 1234'"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Будет отправлено от имени магазина. Оставьте пустым, чтобы ничего не отправлять.
                            </p>
                        </div>
                    </div>
                )}


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
