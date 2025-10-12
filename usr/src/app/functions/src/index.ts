

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { AlchemyRecipe, AlchemyRecipeComponent, User } from "@/lib/types";
import { ALL_SHOPS } from "@/lib/data";

admin.initializeApp();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

exports.brewPotion = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { characterId, ingredients, heatLevel } = data;
  const userId = context.auth.uid;

  try {
    const userRef = db.collection("users").doc(userId);
    let updatedUser: User | null = null;

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "User document not found."
        );
      }

      const userData = userDoc.data() as User;
      const charIndex = userData.characters.findIndex(
        (c) => c.id === characterId
      );
      if (charIndex === -1) {
        throw new functions.https.HttpsError(
          "not-found",
          "Character not found."
        );
      }

      const character = userData.characters[charIndex];
      const inventory = character.inventory || {};
      const ingredientsInv = (inventory.ингредиенты || []) as {
        id: string;
        name: string;
        quantity: number;
      }[];

      // This logic will be more complex in the future, for now it's simplified
      const allItems = ALL_SHOPS.flatMap((s) => s.items || []);
      const resultItem = allItems.find(
        (item) => item.id === "potion-minor-healing"
      );
      if (!resultItem) {
        throw new functions.https.HttpsError(
          "internal",
          "Result potion data not found."
        );
      }
      
      const potionsInv = (inventory.зелья || []) as { id: string; name: string; quantity: number }[];
      const existingPotionIndex = potionsInv.findIndex(p => p.name === resultItem.name);
      
      if (existingPotionIndex > -1) {
          potionsInv[existingPotionIndex].quantity += 1;
      } else {
          potionsInv.push({
              id: `inv-item-${Date.now()}`,
              name: resultItem.name,
              quantity: 1,
          });
      }


      ingredients.forEach((component: AlchemyRecipeComponent) => {
        const requiredIngredient = allItems.find(
          (item) => item.id === component.ingredientId
        );
        if (!requiredIngredient) {
          throw new functions.https.HttpsError(
            "failed-precondition",
            `Required ingredient with ID ${component.ingredientId} not found.`
          );
        }

        const playerIngIndex = ingredientsInv.findIndex(
          (i) => i.name === requiredIngredient.name
        );
        if (playerIngIndex === -1 || ingredientsInv[playerIngIndex].quantity < component.qty) {
          throw new functions.https.HttpsError(
            "failed-precondition",
            `Недостаточно ингредиента: ${requiredIngredient.name}`
          );
        }

         if (ingredientsInv[playerIngIndex].quantity > component.qty) {
            ingredientsInv[playerIngIndex].quantity -= component.qty;
        } else {
            ingredientsInv.splice(playerIngIndex, 1);
        }
      });
      
      inventory.ингредиенты = ingredientsInv;
      inventory.зелья = potionsInv;
      character.inventory = inventory;
      userData.characters[charIndex] = character;
      
      transaction.update(userRef, { characters: userData.characters });
      updatedUser = userData;
    });

    return updatedUser;
  } catch (error) {
    console.error("Error brewing potion:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      "An unexpected error occurred."
    );
  }
});


exports.addAlchemyRecipe = functions.https.onCall(async (data, context) => {
    if (!context.auth || (await db.collection('users').doc(context.auth.uid).get()).data()?.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Must be an admin to call this function');
    }

    const recipe = data as Omit<AlchemyRecipe, 'id'>;
    const newRecipe = {
        ...recipe,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const result = await db.collection('alchemy_recipes').add(newRecipe);
    return { id: result.id };
});
