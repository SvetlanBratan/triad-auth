
'use client';

import React, { useState, useMemo } from 'react';
import { useUser } from '@/hooks/use-user';
import type { AlchemyRecipe, Character, Shop, ShopItem, InventoryItem, Potion, AlchemyIngredient } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FlaskConical, Edit } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SearchableSelect } from '@/components/ui/searchable-select';
import { CustomIcon } from '../ui/custom-icon';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ALL_ITEMS_FOR_ALCHEMY } from '@/lib/alchemy-data';

const RecipeCard = ({ recipe, character, allItemsMap, isCraftingId, handleCraft }: { recipe: AlchemyRecipe, character: Character, allItemsMap: Map<string, ShopItem | AlchemyIngredient | Potion>, isCraftingId: string | null, handleCraft: (recipe: AlchemyRecipe) => void }) => {
    const { currentUser } = useUser();
    const isAdmin = currentUser?.role === 'admin';
    const outputItem = allItemsMap.get(recipe.resultPotionId);
    const recipeTitle = recipe.name || outputItem?.name || 'Неизвестный рецепт';
    const isArtifact = outputItem?.inventoryTag === 'артефакты';

    const canCraft = useMemo(() => {
        return recipe.components.every(component => {
            const requiredItemData = allItemsMap.get(component.ingredientId);
            if (!requiredItemData) return false;

            const category = (requiredItemData as ShopItem).inventoryTag;
            if (!category || (category !== 'ингредиенты' && category !== 'драгоценности')) {
                 return false;
            }

            const inventoryItemName = 'inventoryItemName' in requiredItemData && requiredItemData.inventoryItemName ? requiredItemData.inventoryItemName : requiredItemData.name;
            
            let totalPlayerQty = 0;
            const mainCategoryItems = (character.inventory[category] || []) as InventoryItem[];
            const mainPlayerItem = mainCategoryItems.find(i => i.name === inventoryItemName);
            if (mainPlayerItem) {
                totalPlayerQty += mainPlayerItem.quantity;
            }

            // If it's a jewel, also check the ingredients category
            if (category === 'драгоценности') {
                const ingredientItems = (character.inventory['ингредиенты'] || []) as InventoryItem[];
                const jewelInIngredients = ingredientItems.find(i => i.name === inventoryItemName);
                if (jewelInIngredients) {
                    totalPlayerQty += jewelInIngredients.quantity;
                }
            }
            
            return totalPlayerQty >= component.qty;
        });
    }, [recipe.components, allItemsMap, character.inventory]);

    return (
        <Card className="flex flex-col relative group w-full overflow-hidden">
            <CardHeader className="p-4 sm:p-6">
                {outputItem?.image && (
                    <div className={cn(
                        "relative bg-muted rounded-md mb-4 mx-auto overflow-hidden",
                        isArtifact ? "w-full max-w-[256px] aspect-square" : "w-full max-w-sm aspect-square"
                    )}>
                        <Image src={outputItem.image} alt={outputItem.name || 'Предмет'} fill style={{ objectFit: "contain" }} data-ai-hint={isArtifact ? "artifact" : "alchemy potion"} />
                    </div>
                )}
                <CardTitle className="text-base sm:text-2xl break-words">{recipeTitle}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-3 p-4 sm:p-6 pt-0 sm:pt-0">
                <h4 className="text-sm font-semibold text-muted-foreground">Ингредиенты:</h4>
                <ul className="space-y-2">
                    {recipe.components.map(comp => {
                        const itemData = allItemsMap.get(comp.ingredientId);
                        if (!itemData) return null;
                        
                        const category = (itemData as ShopItem).inventoryTag;
                        if (!category || (category !== 'ингредиенты' && category !== 'драгоценности')) {
                            return null;
                        }

                        const inventoryItemName = 'inventoryItemName' in itemData && itemData.inventoryItemName ? itemData.inventoryItemName : itemData.name;
                        
                        let playerQty = 0;
                        const mainCategoryItems = (character.inventory[category] || []) as InventoryItem[];
                        const mainPlayerItem = mainCategoryItems.find(i => i.name === inventoryItemName);
                        if (mainPlayerItem) {
                            playerQty += mainPlayerItem.quantity;
                        }

                        if (category === 'драгоценности') {
                            const ingredientItems = (character.inventory['ингредиенты'] || []) as InventoryItem[];
                            const jewelInIngredients = ingredientItems.find(i => i.name === inventoryItemName);
                            if (jewelInIngredients) {
                                playerQty += jewelInIngredients.quantity;
                            }
                        }

                        const hasEnough = playerQty >= comp.qty;

                        return (
                            <li key={comp.ingredientId} className="flex items-center justify-between text-xs sm:text-sm gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="relative w-6 h-6 sm:w-8 sm:h-8 shrink-0">
                                        <Image src={(itemData as any).image || "/Ingredient.png"} alt="Ingredient" fill style={{ objectFit: "contain" }} />
                                    </div>
                                    <span className="truncate">{itemData.name}</span>
                                </div>
                                <span className={cn("shrink-0 font-medium", hasEnough ? 'text-green-600' : 'text-destructive')}>
                                    {playerQty} / {comp.qty}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            </CardContent>
            <CardFooter className="p-4 sm:p-6">
                <Button 
                    className="w-full" 
                    disabled={!canCraft || isCraftingId === recipe.id}
                    onClick={() => handleCraft(recipe)}
                >
                    {isCraftingId === recipe.id ? "Создание..." : "Создать"}
                </Button>
            </CardFooter>
        </Card>
    );
};


export default function AlchemyTab() {
    const { currentUser, fetchAlchemyRecipes, brewPotion, fetchAllShops } = useUser();
    const { toast } = useToast();
    const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

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
        const map = new Map<string, ShopItem | AlchemyIngredient | Potion>();
        if (isLoadingShops) return map;
        const allItemsFromShops = allShops.flatMap(shop => shop.items || []);
        [...allItemsFromShops, ...ALL_ITEMS_FOR_ALCHEMY].forEach(item => {
            if (item) map.set(item.id, item);
        });
        return map;
    }, [allShops, isLoadingShops]);

    const { potionRecipes, artifactRecipes } = useMemo(() => {
        const potions: AlchemyRecipe[] = [];
        const artifacts: AlchemyRecipe[] = [];
        recipes.forEach(recipe => {
            const outputItem = allItemsMap.get(recipe.resultPotionId);
            if (outputItem?.inventoryTag === 'артефакты') {
                artifacts.push(recipe);
            } else { // Default to potions for 'зелья' or other/undefined tags
                potions.push(recipe);
            }
        });
        return { 
            potionRecipes: potions.sort((a,b) => (a.name || allItemsMap.get(a.resultPotionId)?.name || '').localeCompare(b.name || allItemsMap.get(b.resultPotionId)?.name || '')), 
            artifactRecipes: artifacts.sort((a,b) => (a.name || allItemsMap.get(a.resultPotionId)?.name || '').localeCompare(b.name || allItemsMap.get(b.resultPotionId)?.name || ''))
        };
    }, [recipes, allItemsMap]);

    const handleCraft = async (recipe: AlchemyRecipe) => {
        if (!character || !currentUser) return;
        setIsCraftingId(recipe.id);
        try {
            const { createdItem, recipeName } = await brewPotion(currentUser.id, character.id, recipe.id);
            toast({
                title: "Предмет создан!",
                description: `Вы успешно создали: ${createdItem.name}.`
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
            toast({ variant: "destructive", title: "Ошибка крафта", description: message });
        } finally {
            setIsCraftingId(null);
        }
    };

    const selectedRecipe = useMemo(() => {
        if (!selectedRecipeId) return null;
        return recipes.find(r => r.id === selectedRecipeId) || null;
    }, [selectedRecipeId, recipes]);
    
    const RecipeList = ({ recipes, title }: { recipes: AlchemyRecipe[], title: string }) => {
        if (recipes.length === 0) return null;
        return (
            <div>
                <h3 className="font-semibold text-muted-foreground px-3 mb-2">{title}</h3>
                <div className="flex flex-col gap-1">
                    {recipes.map(recipe => {
                        const outputItem = allItemsMap.get(recipe.resultPotionId);
                        const recipeTitle = recipe.name || outputItem?.name || 'Неизвестный рецепт';
                        return (
                             <Button
                                key={recipe.id}
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start h-auto py-2 px-3 text-sm whitespace-normal text-left",
                                    selectedRecipeId === recipe.id && "bg-muted font-bold"
                                )}
                                onClick={() => setSelectedRecipeId(recipe.id)}
                            >
                                {recipeTitle}
                            </Button>
                        )
                    })}
                </div>
            </div>
        )
    };

    return (
        <div className="min-h-screen bg-fixed dark:bg-[url('/Backgroundblack.png')] bg-[url('/Lightbackground.png')] dark:bg-[length:400px_400px] p-2 md:p-8">
            <div className="container mx-auto space-y-6 bg-background/80 backdrop-blur-sm min-h-screen rounded-lg border p-4 md:p-8">
                <header className="text-center">
                    <h1 className="text-2xl md:text-3xl font-bold font-headline text-primary flex items-center justify-center gap-2 sm:gap-4">
                        <div className="w-6 h-6 sm:w-8 sm:h-8">
                            <CustomIcon src="/icons/alchemy.svg" className="icon-primary" />
                        </div>
                        Алхимия
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground">Создавайте мощные зелья и артефакты из собранных ингредиентов.</p>
                </header>

                <div className="max-w-md mx-auto space-y-2">
                    <label className="text-sm font-medium">Выберите персонажа для крафта:</label>
                    <SearchableSelect
                        options={characterOptions}
                        value={selectedCharacterId}
                        onValueChange={(val) => {
                            setSelectedCharacterId(val);
                            setSelectedRecipeId(null); // Reset selection when character changes
                        }}
                        placeholder="Выберите персонажа..."
                    />
                </div>

                {selectedCharacterId && character ? (
                    isLoadingRecipes || isLoadingShops ? (
                        <p className="text-center">Загрузка рецептов...</p>
                    ) : (
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-start">
                            <div className="md:col-span-1">
                                <Card>
                                    <CardHeader className="p-4 sm:p-6">
                                        <CardTitle className="text-lg">Рецепты</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
                                        <ScrollArea className="h-[40vh] md:h-[60vh] pr-2 sm:pr-4">
                                           <div className="space-y-4">
                                                <RecipeList recipes={potionRecipes} title="Зелья" />
                                                <RecipeList recipes={artifactRecipes} title="Артефакты" />
                                                {(potionRecipes.length === 0 && artifactRecipes.length === 0) && (
                                                    <p className="text-center text-muted-foreground pt-8 text-sm">Нет доступных рецептов.</p>
                                                )}
                                           </div>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="md:col-span-2">
                               {selectedRecipe ? (
                                    <RecipeCard
                                        recipe={selectedRecipe}
                                        character={character}
                                        allItemsMap={allItemsMap}
                                        isCraftingId={isCraftingId}
                                        handleCraft={handleCraft}
                                    />
                               ) : (
                                    <div className="flex items-center justify-center h-48 sm:h-96 border-2 border-dashed rounded-lg">
                                        <p className="text-sm sm:text-base text-muted-foreground">Выберите рецепт из списка</p>
                                    </div>
                               )}
                            </div>
                         </div>
                    )
                ) : (
                    <p className="text-center text-muted-foreground pt-8 text-sm sm:text-base">Выберите персонажа, чтобы увидеть доступные рецепты.</p>
                )}
            </div>
        </div>
    );
}
