import type { AlchemyRecipe } from './types';
import { POTIONS_LIST, INGREDIENTS_LIST } from './items-data';

export const ALCHEMY_INGREDIENTS = INGREDIENTS_LIST;
export const ALCHEMY_POTIONS = POTIONS_LIST;

// Example recipes using items from items-data.ts
export const ALCHEMY_RECIPES: AlchemyRecipe[] = [
  {
    id: 'healing_potion_recipe',
    name: 'Рецепт целебного зелья',
    components: [
      { ingredientId: 'ing-herb-mountain', qty: 2 },
      { ingredientId: 'ing-crystal-water', qty: 1 }
    ],
    resultPotionId: 'potion-small-heal',
    outputQty: 1,
    difficulty: 1
  },
];
