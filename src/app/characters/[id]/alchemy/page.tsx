
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import type { AlchemyRecipe, InventoryItem, Potion } from '@/lib/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { ALCHEMY_INGREDIENTS } from '@/lib/alchemy-data';
import Image from 'next/image';

export default function AlchemyPage() {
    const { id } = useParams();
    const router = useRouter();
    const { currentUser, fetchCharacterById, brewPotion, fetchAlchemyRecipes } = useUser();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const charId = Array.isArray(id) ? id[0] : id;

    const { data: characterData, isLoading: isCharacterLoading } = useQuery({
        queryKey: ['character', charId],
        queryFn: () => charId ? fetchCharacterById(charId) : Promise.resolve(null),
        enabled: !!charId && !!currentUser,
    });
    
    const { data: recipes, isLoading: isRecipesLoading } = useQuery<AlchemyRecipe[]>({
        queryKey: ['alchemyRecipes'],
        queryFn: fetchAlchemyRecipes,
    });

    const [isBrewingId, setIsBrewingId] = useState<string | null>(null);

    const character = characterData?.character;
    const owner = characterData?.owner;

    const isOwnerOrAdmin = currentUser?.id === owner?.id || currentUser?.role === 'admin';

    const handleBrew = async (recipe: AlchemyRecipe) => {
        if (!character || !currentUser) return;
        
        setIsBrewingId(recipe.id);
        try {
            await brewPotion(character.id, recipe.components, recipe.difficulty);
            toast({
                title: 'Зелье сварено!',
                description: `Вы успешно создали: ${recipe.name}.`,
            });
            await queryClient.invalidateQueries({ queryKey: ['character', charId] });
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Произошла ошибка";
            toast({
                variant: 'destructive',
                title: 'Ошибка крафта',
                description: msg,
            });
        } finally {
            setIsBrewingId(null);
        }
    };
    
    const availableRecipes = useMemo(() => {
        if (!character || !recipes) return [];
        const inventoryIngredients = character.inventory.ингредиенты || [];
        
        return recipes.map(recipe => {
            const canCraft = recipe.components.every(comp => {
                const owned = inventoryIngredients.find(i => i.id === comp.ingredientId);
                return owned && owned.quantity >= comp.qty;
            });
            
            const componentsWithDetails = recipe.components.map(comp => {
                const detail = ALCHEMY_INGREDIENTS.find(i => i.id === comp.ingredientId);
                const owned = inventoryIngredients.find(i => i.id === comp.ingredientId);
                return {
                    ...comp,
                    name: detail?.name || 'Неизвестный ингредиент',
                    image: detail?.image,
                    ownedQty: owned?.quantity || 0,
                };
            });
            
            return { ...recipe, canCraft, componentsWithDetails };
        });
    }, [character, recipes]);

    if (isCharacterLoading || isRecipesLoading) {
        return <div className="container mx-auto p-4 md:p-8"><p>Загрузка алхимии...</p></div>;
    }
    
    if (!character || !owner || !isOwnerOrAdmin) {
        notFound();
    }

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <Link href={`/characters/${character.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="w-4 h-4" />
                Вернуться к персонажу
            </Link>

            <header className="text-center">
                <h1 className="text-3xl font-bold font-headline text-primary flex items-center justify-center gap-3">
                    <FlaskConical /> Алхимический стол
                </h1>
                <p className="text-muted-foreground mt-2">Создавайте зелья из имеющихся у вас ингредиентов.</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableRecipes.map(recipe => (
                    <Card key={recipe.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle>{recipe.name || 'Неизвестный рецепт'}</CardTitle>
                            <CardDescription>Сложность: {recipe.difficulty}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                             <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Требуемые ингредиенты:</h4>
                             <div className="space-y-2">
                                 {recipe.componentsWithDetails.map(comp => (
                                     <div key={comp.ingredientId} className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
                                        {comp.image && <Image src={comp.image} alt={comp.name} width={40} height={40} className="rounded-md" />}
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{comp.name}</p>
                                            <p className={cn("text-xs", comp.ownedQty >= comp.qty ? 'text-green-600' : 'text-destructive')}>
                                                В наличии: {comp.ownedQty}/{comp.qty}
                                            </p>
                                        </div>
                                     </div>
                                 ))}
                             </div>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                className="w-full"
                                disabled={!recipe.canCraft || isBrewingId === recipe.id}
                                onClick={() => handleBrew(recipe)}
                            >
                                {isBrewingId === recipe.id ? 'Создание...' : 'Создать'}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
                {availableRecipes.length === 0 && (
                    <p className="text-muted-foreground text-center col-span-full py-16">
                        Нет доступных рецептов.
                    </p>
                )}
            </div>

        </div>
    );
}

