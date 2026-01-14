
import type { Potion, AlchemyIngredient, AlchemyRecipe } from './types';
import { POTIONS_LIST, INGREDIENTS_LIST } from './items-data';

export const ALCHEMY_INGREDIENTS: AlchemyIngredient[] = INGREDIENTS_LIST;

// Combine potions and artifacts into one list for crafting results
export const ALCHEMY_POTIONS: Potion[] = [
    ...POTIONS_LIST,
    // You can add unique, non-shoppable artifacts/potions here later
];
