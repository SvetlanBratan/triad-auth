
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hammer, FlaskConical, Plus, Trash2 } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { ALL_ALCHEMY_INGREDIENTS, ALL_ALCHEMY_RECIPES } from '@/lib/data';
import type { AlchemyRecipeComponent } from '@/lib/types';
import { SearchableSelect } from '../ui/searchable-select';
import { Slider } from '../ui/slider';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function CraftingTab() {
  const { currentUser, brewPotion, setCurrentUser } = useUser();
  const { toast } = useToast();

  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [selectedIngredients, setSelectedIngredients] = useState<AlchemyRecipeComponent[]>([]);
  const [heatLevel, setHeatLevel] = useState(50);
  const [isLoading, setIsLoading] = useState(false);

  const characterOptions = useMemo(() => 
    (currentUser?.characters || []).map(c => ({ value: c.id, label: c.name })),
    [currentUser]
  );

  const selectedCharacter = useMemo(() => 
    currentUser?.characters.find(c => c.id === selectedCharacterId),
    [currentUser, selectedCharacterId]
  );

  const availableIngredientsOptions = useMemo(() => {
    if (!selectedCharacter) return [];
    const inventoryIngredients = selectedCharacter.inventory?.ингредиенты || [];
    return inventoryIngredients
      .filter(invItem => invItem.quantity > 0)
      .map(invItem => {
        const ingredientData = ALL_ALCHEMY_INGREDIENTS.find(i => i.id === invItem.id);
        return {
          value: invItem.id,
          label: `${ingredientData?.name || invItem.name} (x${invItem.quantity})`,
        };
      });
  }, [selectedCharacter]);

  const addIngredient = (ingredientId: string) => {
    if (!ingredientId) return;

    const inventoryIngredients = selectedCharacter?.inventory?.ингредиенты || [];
    const availableQty = inventoryIngredients.find(i => i.id === ingredientId)?.quantity || 0;
    
    const existing = selectedIngredients.find(i => i.ingredientId === ingredientId);
    const currentQty = existing ? existing.qty : 0;

    if (currentQty < availableQty) {
      if (existing) {
        setSelectedIngredients(
          selectedIngredients.map(i => 
            i.ingredientId === ingredientId ? { ...i, qty: i.qty + 1 } : i
          )
        );
      } else {
        setSelectedIngredients([...selectedIngredients, { ingredientId, qty: 1 }]);
      }
    } else {
        toast({ variant: 'destructive', title: 'Недостаточно ингредиентов', description: 'У вас больше нет этого ингредиента в инвентаре.' });
    }
  };

  const removeIngredient = (ingredientId: string) => {
    const existing = selectedIngredients.find(i => i.ingredientId === ingredientId);
    if (!existing) return;
    if (existing.qty > 1) {
      setSelectedIngredients(
        selectedIngredients.map(i => 
          i.ingredientId === ingredientId ? { ...i, qty: i.qty - 1 } : i
        )
      );
    } else {
      setSelectedIngredients(selectedIngredients.filter(i => i.ingredientId !== ingredientId));
    }
  };

  const handleBrew = async () => {
    if (!selectedCharacterId || selectedIngredients.length === 0) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Выберите персонажа и добавьте ингредиенты.' });
      return;
    }
    setIsLoading(true);
    try {
      const updatedUser = await brewPotion(selectedCharacterId, selectedIngredients, heatLevel);
      setCurrentUser(updatedUser);
      toast({ title: 'Успех!', description: 'Зелье успешно сварено и добавлено в инвентарь.' });
      setSelectedIngredients([]);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Неудача', description: error.message || 'Не удалось сварить зелье.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hammer /> Ремесло: Алхимия
        </CardTitle>
        <CardDescription>
          Создавайте мощные зелья из собранных ингредиентов, используя рецепты.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <h3 className="font-semibold">Рецепты</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {ALL_ALCHEMY_RECIPES.map(recipe => {
              const resultPotion = ALL_POTIONS.find(p => p.id === recipe.resultPotionId);
              return (
              <div key={recipe.id} className="p-3 border rounded-md text-sm">
                <p className="font-bold">{resultPotion?.name || recipe.name}</p>
                <ul className="text-xs text-muted-foreground list-disc pl-4 mt-1">
                  {recipe.components.map(comp => {
                    const ingredient = ALL_ALCHEMY_INGREDIENTS.find(i => i.id === comp.ingredientId);
                    return <li key={comp.ingredientId}>{ingredient?.name || comp.ingredientId} x{comp.qty}</li>
                  })}
                </ul>
              </div>
            )})}
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
           <div>
              <Label htmlFor="character-select">Выберите персонажа</Label>
              <SearchableSelect
                options={characterOptions}
                value={selectedCharacterId}
                onValueChange={setSelectedCharacterId}
                placeholder="Выберите персонажа..."
              />
            </div>
          
          {selectedCharacterId && (
            <>
              <div>
                <Label>Алхимический стол</Label>
                <div className="p-4 border rounded-lg min-h-48 mt-2 space-y-2">
                  {selectedIngredients.length > 0 ? (
                    selectedIngredients.map(ing => {
                      const ingredientData = ALL_ALCHEMY_INGREDIENTS.find(i => i.id === ing.ingredientId);
                      return (
                      <div key={ing.ingredientId} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          {ingredientData?.image && <Image src={ingredientData.image} alt={ingredientData.name} width={24} height={24} />}
                          <span>{ingredientData?.name || ing.ingredientId} x{ing.qty}</span>
                        </div>
                        <Button size="icon-sm" variant="ghost" onClick={() => removeIngredient(ing.ingredientId)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )})
                  ) : (
                    <p className="text-sm text-center text-muted-foreground pt-12">Добавьте ингредиенты из вашего инвентаря.</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <SearchableSelect
                    options={availableIngredientsOptions}
                    value={''}
                    onValueChange={addIngredient}
                    placeholder="Добавить ингредиент..."
                  />
                </div>
              </div>
              <div>
                <Label>Нагрев котла ({heatLevel}°)</Label>
                <Slider
                  defaultValue={[50]}
                  max={100}
                  step={1}
                  onValueChange={(value) => setHeatLevel(value[0])}
                />
              </div>
              <Button onClick={handleBrew} disabled={isLoading || selectedIngredients.length === 0} className="w-full">
                <FlaskConical className="mr-2" />
                {isLoading ? 'Варка...' : 'Сварить зелье'}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
