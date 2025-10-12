
'use client';

import React, { useState, useMemo } from 'react';
import { useUser } from '@/hooks/use-user';
import type { AlchemyRecipe, Character, Shop, ShopItem } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SearchableSelect } from '@/components/ui/searchable-select';

export default function AlchemyTab() {
    const { currentUser, fetchAlchemyRecipes, brewPotion, fetchAllShops } = useUser();
    const { toast } = useToast();
    const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');

    const { data: recipes = [], isLoading: isLoadingRecipes } = useQuery<AlchemyRecipe[]>({
        queryKey: ['alchemyRecipes'],
        queryFn: fetchAlchemyRecipes,
    });
    
    const { data: allShops = [], isLoading: isLoadingShops } = useQuery<Shop[]>({
        queryKey: ['allShops'],
        queryFn: fetchAllShops,
    });

    const [isCraftingId, setIsCraftingId] = useState<string | null>(null);

    const characterOptions = useMemo(() => {
        return (currentUser?.characters || []).map(char => ({
            value: char.id,
            label: char.name
        }));
    }, [currentUser]);

    const character = useMemo(() => {
        return currentUser?.characters.find(c => c.id === selectedCharacterId);
    }, [currentUser, selectedCharacterId]);

    const allItemsMap = useMemo(() => {
        const map = new Map<string, ShopItem>();
        if (isLoadingShops) return map;
        allShops.forEach(shop => {
            (shop.items || []).forEach(item => {
                map.set(item.id, item);
            });
        });
        return map;
    }, [allShops, isLoadingShops]);

    const handleCraft = async (recipe: AlchemyRecipe) => {
        if (!character || !currentUser) return;
        setIsCraftingId(recipe.id);
        try {
            await brewPotion(currentUser.id, character.id, recipe.id);
            toast({
                title: "Предмет создан!",
                description: `Вы успешно создали предмет.`
            });
            // User context will be updated automatically by the provider, re-render will happen
        } catch (error) {
            const message = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
            toast({ variant: 'destructive', title: "Ошибка крафта", description: message });
        } finally {
            setIsCraftingId(null);
        }
    };
    
    return (
        <div className="min-h-screen bg-fixed dark:bg-[url('/Backgroundblack.png')] bg-[url('/Lightbackground.png')] dark:bg-[length:800px_800px] bg-[length:800px_800px] -m-4 md:-m-8 p-4 md:p-8">
            <div className="container mx-auto p-4 md:p-8 space-y-6 bg-background/80 backdrop-blur-sm min-h-screen">
                <header className="text-center">
                    <h1 className="text-3xl font-bold font-headline text-primary flex items-center justify-center gap-4">
                        <FlaskConical />
                        Алхимия
                    </h1>
                    <p className="text-muted-foreground">Создавайте мощные зелья из собранных ингредиентов.</p>
                </header>

                <div className="max-w-md mx-auto space-y-2">
                    <label className="text-sm font-medium">Выберите персонажа для крафта:</label>
                    <SearchableSelect
                        options={characterOptions}
                        value={selectedCharacterId}
                        onValueChange={setSelectedCharacterId}
                        placeholder="Выберите персонажа..."
                    />
                </div>

                {selectedCharacterId && character ? (
                    isLoadingRecipes || isLoadingShops ? (
                        <p className="text-center">Загрузка рецептов...</p>
                    ) : recipes.length === 0 ? (
                        <p className="text-center text-muted-foreground">Администратор еще не добавил ни одного рецепта.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {recipes.map(recipe => {
                                const outputItem = allItemsMap.get(recipe.resultPotionId);
                                const recipeTitle = recipe.name || outputItem?.name || 'Неизвестный рецепт';
                                
                                const canCraft = recipe.components.every(component => {
                                    const requiredIngredient = allItemsMap.get(component.ingredientId);
                                    if (!requiredIngredient) return false;
                                    const playerIngredient = character.inventory.ингредиенты?.find(i => i.name === requiredIngredient.name);
                                    return playerIngredient && playerIngredient.quantity >= component.qty;
                                });

                                return (
                                    <Card key={recipe.id} className="flex flex-col">
                                        <CardHeader>
                                            {outputItem?.image && (
                                                <div className="relative w-full aspect-square bg-muted rounded-md mb-4">
                                                    <Image src={outputItem.image} alt={outputItem.name || 'Предмет'} fill style={{ objectFit: "contain" }} data-ai-hint="alchemy potion" />
                                                </div>
                                            )}
                                            <CardTitle>{recipeTitle}</CardTitle>
                                            <CardDescription>Сложность: {recipe.difficulty}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-grow space-y-3">
                                            <h4 className="text-sm font-semibold text-muted-foreground">Ингредиенты:</h4>
                                            <ul className="space-y-2">
                                                {recipe.components.map(comp => {
                                                    const ingredient = allItemsMap.get(comp.ingredientId);
                                                    if (!ingredient) return null;
                                                    const playerIngredient = character.inventory.ингредиенты?.find(i => i.name === ingredient.name);
                                                    const playerQty = playerIngredient?.quantity || 0;
                                                    const hasEnough = playerQty >= comp.qty;

                                                    return (
                                                        <li key={comp.ingredientId} className="flex items-center justify-between text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="relative w-8 h-8">
                                                                                <Image src="/Ingredient.png" alt="Ingredient" fill style={{ objectFit: "contain" }} />
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>{ingredient?.name || 'Неизвестный ингредиент'}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                                <span>{ingredient.name}</span>
                                                            </div>
                                                            <span className={hasEnough ? 'text-green-600' : 'text-destructive'}>
                                                                {playerQty} / {comp.qty}
                                                            </span>
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </CardContent>
                                        <CardFooter>
                                            <Button 
                                                className="w-full" 
                                                disabled={!canCraft || isCraftingId === recipe.id}
                                                onClick={() => handleCraft(recipe)}
                                            >
                                                {isCraftingId === recipe.id ? "Создание..." : "Создать"}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                )
                            })}
                        </div>
                    )
                ) : (
                    <p className="text-center text-muted-foreground pt-8">Выберите персонажа, чтобы увидеть доступные рецепты.</p>
                )}
            </div>
        </div>
    );
}
