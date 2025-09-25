import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { HttpsError } from "firebase-functions/v1/https";
import {
  ALL_FAMILIARS,
  FAMILIARS_BY_ID,
  ALL_ACHIEVEMENTS,
  ALL_ALCHEMY_RECIPES,
  ALL_POTIONS,
} from "./data";
import type {
  User,
  FamiliarCard,
  Character,
  OwnedFamiliarCard,
  Inventory,
  InventoryItem,
  AlchemyRecipe,
  AlchemyRecipeComponent,
  Potion,
} from "./types";

admin.initializeApp();
const db = admin.firestore();

// Helper to find a recipe that matches the provided ingredients, regardless of order.
const findMatchingRecipe = (
  submittedIngredients: AlchemyRecipeComponent[]
): AlchemyRecipe | undefined => {
  return ALL_ALCHEMY_RECIPES.find((recipe) => {
    if (recipe.components.length !== submittedIngredients.length) {
      return false;
    }

    const recipeComponentsMap = new Map<string, number>();
    recipe.components.forEach((comp) => {
      recipeComponentsMap.set(
        comp.ingredientId,
        (recipeComponentsMap.get(comp.ingredientId) || 0) + comp.qty
      );
    });

    const submittedComponentsMap = new Map<string, number>();
    submittedIngredients.forEach((comp) => {
      submittedComponentsMap.set(
        comp.ingredientId,
        (submittedComponentsMap.get(comp.ingredientId) || 0) + comp.qty
      );
    });

    if (recipeComponentsMap.size !== submittedComponentsMap.size) {
      return false;
    }

    for (const [id, qty] of recipeComponentsMap) {
      if (submittedComponentsMap.get(id) !== qty) {
        return false;
      }
    }

    return true;
  });
};

export const brewPotion = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Пользователь не авторизован."
    );
  }

  const { characterId, ingredients, heatLevel } = data;
  const userId = context.auth.uid;

  if (
    !characterId ||
    !Array.isArray(ingredients) ||
    ingredients.length === 0 ||
    typeof heatLevel !== "number"
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Неверные данные для создания зелья."
    );
  }

  try {
    const userRef = db.collection("users").doc(userId);

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new HttpsError("not-found", "Пользователь не найден.");
      }

      const user = userDoc.data() as User;
      const characters = user.characters || [];
      const charIndex = characters.findIndex((c) => c.id === characterId);

      if (charIndex === -1) {
        throw new HttpsError("not-found", "Персонаж не найден.");
      }

      const character = characters[charIndex];
      const inventory = character.inventory || {};
      const ingredientsList = (inventory.ингредиенты || []) as InventoryItem[];
      const potionsList = (inventory.зелья || []) as InventoryItem[];

      // 1. Find a matching recipe
      const recipe = findMatchingRecipe(ingredients);
      if (!recipe) {
        throw new HttpsError("not-found", "Подходящий рецепт не найден.");
      }
      
      // 2. Check heat level
      if (heatLevel < recipe.minHeat || heatLevel > recipe.maxHeat) {
          throw new HttpsError('failed-precondition', 'Неверный уровень нагрева для этого рецепта.');
      }

      // 3. Check and consume ingredients
      for (const comp of recipe.components) {
        const itemIndex = ingredientsList.findIndex(
          (item) => item.id === comp.ingredientId
        );
        if (itemIndex === -1 || ingredientsList[itemIndex].quantity < comp.qty) {
          throw new HttpsError(
            "failed-precondition",
            `Недостаточно ингредиента: ${comp.ingredientId}`
          );
        }
        ingredientsList[itemIndex].quantity -= comp.qty;
      }
      // Filter out ingredients with 0 quantity
      inventory.ингредиенты = ingredientsList.filter((item) => item.quantity > 0);

      // 4. Add resulting potion
      const resultPotion = ALL_POTIONS.find(
        (p) => p.id === recipe.resultPotionId
      );
      if (!resultPotion) {
        throw new HttpsError("internal", "Не удалось найти зелье из рецепта.");
      }
      
      const existingPotionIndex = potionsList.findIndex(p => p.id === resultPotion.id);
      
      if (existingPotionIndex > -1) {
          potionsList[existingPotionIndex].quantity += recipe.outputQty;
      } else {
          potionsList.push({
              id: resultPotion.id,
              name: resultPotion.name,
              description: resultPotion.note,
              image: resultPotion.image,
              quantity: recipe.outputQty,
          });
      }
      inventory.зелья = potionsList;
      character.inventory = inventory;

      const updatedCharacters = [...characters];
      updatedCharacters[charIndex] = character;

      transaction.update(userRef, { characters: updatedCharacters });
    });

    // Return the updated user data to the client
    const updatedUserDoc = await userRef.get();
    return updatedUserDoc.data();
  } catch (error: any) {
    console.error("Error in brewPotion:", error);
     if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Внутренняя ошибка сервера при создании зелья.");
  }
});
