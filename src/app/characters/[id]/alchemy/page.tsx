'use client';

import React, { useState, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import type { AlchemyRecipe } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { ALL_SHOPS } from '@/lib/data';
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
} from "@/components/ui/tooltip"

export default function AlchemyPage() {
    const { id: characterId } = useParams();
    const { currentUser, fetchAlchemyRecipes, brewPotion } = useUser();
    const { toast } = useToast();

    const { data: recipes = [], isLoading: isLoadingRecipes } = useQuery<AlchemyRecipe[]>({
        queryKey: ['alchemyRecipes'],
        queryFn: fetchAlchemyRecipes,
    });

    const [isCraftingId, setIsCraftingId] = useState<string | null>(null);

    const character = useMemo(() => {
        return currentUser?.characters.find(c => c.id === characterId);
    }, [currentUser, characterId]);

    const allItemsMap = useMemo(() => {
        const map = new Map();
        ALL_SHOPS.forEach(shop => {
            (shop.items || []).forEach(item => {
                map.set(item.id, item);
            });
        });
        return map;
    }, []);

    const handleCraft = async (recipe: AlchemyRecipe) => {
        if (!character) return;
        setIsCraftingId(recipe.id);
        try {
            await brewPotion(character.id, recipe);
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

    if (!character) {
        return notFound();
    }

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
             <Link href={`/characters/${character.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="w-4 h-4" />
                Вернуться к персонажу
            </Link>

            <header className="text-center">
                 <h1 className="text-3xl font-bold font-headline text-primary flex items-center justify-center gap-4">
                    <FlaskConical />
                    Алхимия
                </h1>
                <p className="text-muted-foreground">Создавайте мощные зелья из собранных ингредиентов.</p>
            </header>

            {isLoadingRecipes ? (
                <p>Загрузка рецептов...</p>
            ) : recipes.length === 0 ? (
                <p className="text-center text-muted-foreground">Администратор еще не добавил ни одного рецепта.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {recipes.map(recipe => {
                        const canCraft = recipe.components.every(component => {
                            const playerIngredient = character.inventory.ингредиенты?.find(i => i.id === component.ingredientId);
                            return playerIngredient && playerIngredient.quantity >= component.qty;
                        });
                        const outputItem = allItemsMap.get(recipe.resultPotionId);

                        return (
                            <Card key={recipe.id} className="flex flex-col">
                                <CardHeader>
                                    {outputItem?.image && (
                                         <div className="relative w-full aspect-square bg-muted rounded-md mb-4">
                                             <Image src={outputItem.image} alt={outputItem.name || 'Предмет'} fill style={{ objectFit: "contain" }} />
                                         </div>
                                    )}
                                    <CardTitle>{outputItem?.name || recipe.name}</CardTitle>
                                    <CardDescription>Сложность: {recipe.difficulty}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-3">
                                     <h4 className="text-sm font-semibold text-muted-foreground">Ингредиенты:</h4>
                                     <ul className="space-y-2">
                                        {recipe.components.map(comp => {
                                            const ingredient = allItemsMap.get(comp.ingredientId);
                                            const playerQty = character.inventory.ингредиенты?.find(i => i.id === comp.ingredientId)?.quantity || 0;
                                            const hasEnough = playerQty >= comp.qty;
                                            return (
                                                <li key={comp.ingredientId} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                         <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="relative w-8 h-8 bg-muted rounded-sm">
                                                                        {ingredient?.image && <Image src={ingredient.image} alt={ingredient.name} fill style={{objectFit: "contain"}} />}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{ingredient?.name}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                         </TooltipProvider>
                                                        <span>{ingredient?.name}</span>
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
            )}
        </div>
    );
}
