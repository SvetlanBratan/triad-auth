

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { AlchemyRecipe, AlchemyRecipeComponent, User } from "@/lib/types";
import { ALL_SHOPS } from "@/lib/data";

admin.initializeApp();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => typeof v === "string" && v.length > 0)));
}

function pickLatestIsoDate(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

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

exports.mergeUserData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const adminUserDoc = await db.collection("users").doc(context.auth.uid).get();
  if (!adminUserDoc.exists || adminUserDoc.data()?.role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Only admins can merge users.");
  }

  const sourceUserId = typeof data?.sourceUserId === "string" ? data.sourceUserId.trim() : "";
  const targetUserId = typeof data?.targetUserId === "string" ? data.targetUserId.trim() : "";

  if (!sourceUserId || !targetUserId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Both sourceUserId and targetUserId are required."
    );
  }

  if (sourceUserId === targetUserId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Source and target users must be different."
    );
  }

  const sourceRef = db.collection("users").doc(sourceUserId);
  const targetRef = db.collection("users").doc(targetUserId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const [sourceSnap, targetSnap] = await Promise.all([
        transaction.get(sourceRef),
        transaction.get(targetRef),
      ]);

      if (!sourceSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Source user not found.");
      }
      if (!targetSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Target user not found.");
      }

      const sourceData = sourceSnap.data() as User;
      const targetData = targetSnap.data() as User;

      const targetCharacters = asArray<any>(targetData.characters);
      const sourceCharacters = asArray<any>(sourceData.characters);
      const existingCharacterIds = new Set(
        targetCharacters
          .map((c) => (typeof c?.id === "string" ? c.id : ""))
          .filter(Boolean)
      );

      const sourceCharactersWithUniqueIds = sourceCharacters.map((character, index) => {
        const originalId = typeof character?.id === "string" && character.id.length > 0
          ? character.id
          : `merged-char-${Date.now()}-${index}`;
        let nextId = originalId;
        let attempt = 1;

        while (existingCharacterIds.has(nextId)) {
          nextId = `${originalId}-merged-${attempt}`;
          attempt += 1;
        }

        existingCharacterIds.add(nextId);
        return nextId === originalId ? character : { ...character, id: nextId };
      });

      const targetPoints = Number(targetData.points || 0);
      const sourcePoints = Number(sourceData.points || 0);

      const mergedPayload: Partial<User> = {
        points: targetPoints + sourcePoints,
        characters: [...targetCharacters, ...sourceCharactersWithUniqueIds],
        pointHistory: [...asArray<any>(targetData.pointHistory), ...asArray<any>(sourceData.pointHistory)],
        achievementIds: uniqueStrings([
          ...asArray<any>(targetData.achievementIds),
          ...asArray<any>(sourceData.achievementIds),
        ]),
        extraCharacterSlots: Number(targetData.extraCharacterSlots || 0) + Number(sourceData.extraCharacterSlots || 0),
        mail: [...asArray<any>(targetData.mail), ...asArray<any>(sourceData.mail)],
        playerPings: [...asArray<any>(targetData.playerPings), ...asArray<any>(sourceData.playerPings)],
        favoritePlayerIds: uniqueStrings([
          ...asArray<any>(targetData.favoritePlayerIds),
          ...asArray<any>(sourceData.favoritePlayerIds),
        ]),
        purchasedClosedRaces: uniqueStrings([
          ...asArray<any>(targetData.purchasedClosedRaces),
          ...asArray<any>(sourceData.purchasedClosedRaces),
        ]),
        lastLogin: pickLatestIsoDate(targetData.lastLogin, sourceData.lastLogin),
      };

      transaction.update(targetRef, mergedPayload);
      transaction.update(sourceRef, {
        mergedIntoUserId: targetUserId,
        mergedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        movedCharacters: sourceCharactersWithUniqueIds.length,
        movedPoints: sourcePoints,
      };
    });

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error("Error merging users:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", "Failed to merge user data.");
  }
});

    

    