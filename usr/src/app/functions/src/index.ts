
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
db.settings({ ignoreUndefinedProperties: true });


const isFirestoreSpecial = (v: any): boolean => {
  if (!v || typeof v !== "object") return false;
  const ctor = v.constructor?.name;
  return (
    v instanceof admin.firestore.Timestamp ||
    v instanceof admin.firestore.GeoPoint ||
    v instanceof admin.firestore.DocumentReference ||
    v instanceof Date ||
    v instanceof Buffer ||
    v instanceof Uint8Array ||
    ctor === "Bytes" ||
    ctor === "FieldValue"
  );
};

function deepSanitize<T>(obj: T): T {
  if (isFirestoreSpecial(obj)) return obj;

  if (Array.isArray(obj)) {
    const out = obj.map(deepSanitize).filter((v) => v !== undefined);
    return out as any;
  }

  if (obj && typeof obj === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) continue;
      if (typeof v === "number" && Number.isNaN(v)) continue;
      out[k] = deepSanitize(v as any);
    }
    return out;
  }

  return obj;
}


// Helper to find a recipe that matches the provided ingredients, regardless of order.
const findMatchingRecipe = (
  submittedIngredients: AlchemyRecipeComponent[],
  allRecipes: AlchemyRecipe[]
): AlchemyRecipe | undefined => {
  return allRecipes.find((recipe) => {
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
    const recipesRef = db.collection("alchemy_recipes");

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new HttpsError("not-found", "Пользователь не найден.");
      }
      
      const recipesSnapshot = await transaction.get(recipesRef);
      const allRecipes = recipesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AlchemyRecipe));

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
      
      const safeNumber = (v: any, fallback = 0) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : fallback;
      };

      // 1. Find a matching recipe
      const recipe = findMatchingRecipe(ingredients, allRecipes);
      if (!recipe) {
        throw new HttpsError("not-found", "Подходящий рецепт не найден.");
      }
      
      // 2. Check heat level
      if (heatLevel < recipe.minHeat || heatLevel > recipe.maxHeat) {
          throw new HttpsError('failed-precondition', 'Неверный уровень нагрева для этого рецепта.');
      }

      // 3. Check and consume ingredients
      for (const comp of recipe.components) {
        const norm = (v:any) => String(v);
        const itemIndex = ingredientsList.findIndex(
            (item) => norm(item.id) === norm(comp.ingredientId)
        );
        if (itemIndex === -1 || safeNumber(ingredientsList[itemIndex].quantity) < safeNumber(comp.qty)) {
          throw new HttpsError(
            "failed-precondition",
            `Недостаточно ингредиента: ${comp.ingredientId}`
          );
        }
        ingredientsList[itemIndex].quantity = safeNumber(ingredientsList[itemIndex].quantity) - safeNumber(comp.qty);
      }
      // Filter out ingredients with 0 quantity
      inventory.ингредиенты = ingredientsList.filter((item) => item.quantity > 0);

      // 4. Add resulting potion
      const resultPotion = ALL_POTIONS.find(
        (p) => String(p.id) === String(recipe.resultPotionId)
      );
      if (!resultPotion) {
        throw new HttpsError("internal", "Не удалось найти зелье из рецепта.");
      }
      
      const norm = (v:any) => String(v);
      const existingPotionIndex = potionsList.findIndex(p => norm(p.name) === norm(resultPotion.name));
      const outputQty = safeNumber(recipe.outputQty, 1) > 0 ? safeNumber(recipe.outputQty, 1) : 1;
      
      if (existingPotionIndex > -1) {
          potionsList[existingPotionIndex].quantity = safeNumber(potionsList[existingPotionIndex].quantity) + outputQty;
      } else {
          potionsList.push({
              id: `inv-item-${Date.now()}`,
              name: resultPotion.name,
              description: resultPotion.note,
              image: resultPotion.image,
              quantity: outputQty,
          });
      }
      inventory.зелья = potionsList;
      character.inventory = inventory;

      const updatedCharacters = [...characters];
      updatedCharacters[charIndex] = character;
      
      const cleanedPayload = deepSanitize({ characters: updatedCharacters });

      transaction.update(userRef, cleanedPayload);
    });

    // Return the updated user data to the client
    const updatedUserDoc = await userRef.get();
    return updatedUserDoc.data();
  } catch (error: any) {
    console.error("Error in brewPotion:", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      stack: error?.stack,
    });

    if (error instanceof HttpsError) {
      throw error;
    }

    if (typeof error?.code === "string") {
      throw new HttpsError(error.code as any, error.message ?? "Ошибка.");
    }

    if (typeof error?.code === "number") {
      const map: Record<number, string> = {
        3: "invalid-argument", 5: "not-found", 7: "permission-denied",
        10:"aborted", 13:"internal", 16:"unauthenticated",
      };
      const mapped = map[error.code] ?? "internal";
      throw new HttpsError(mapped as any, error.message ?? "Ошибка.");
    }

    throw new HttpsError("unknown", "Неизвестная ошибка.");
  }
});

export const addAlchemyRecipe = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "Пользователь не авторизован.");
  }

  const uid = context.auth.uid;
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError("not-found", "Пользователь не найден.");
  }

  const u = userSnap.data() as any;
  // Поддержим обе модели: { role: 'admin' } ИЛИ { roles: ['admin', ...] }
  const isAdmin =
    u?.role === "admin" ||
    (Array.isArray(u?.roles) && u.roles.includes("admin"));

  if (!isAdmin) {
    throw new HttpsError("permission-denied", "Только администраторы могут добавлять рецепты.");
  }

  // Извлекаем и приводим входные поля
  const {
    name,
    resultPotionId,
    components,
    minHeat,
    maxHeat,
    outputQty,
    difficulty,
  } = data ?? {};

  // Базовая валидация типов
  if (typeof name !== "string" || !name.trim()) {
    throw new HttpsError("invalid-argument", "name обязателен и должен быть строкой.");
  }
  if (typeof resultPotionId !== "string" || !resultPotionId.trim()) {
    throw new HttpsError("invalid-argument", "resultPotionId обязателен и должен быть строкой.");
  }
  if (!Array.isArray(components) || components.length === 0) {
    throw new HttpsError("invalid-argument", "components должен быть непустым массивом.");
  }

  // Нормализация/валидация компонентов
  const normComponents = components.map((c: any, idx: number) => {
    const id = String(c?.ingredientId ?? "").trim();
    const rawQty = Number(c?.qty);
    const qty = Number.isInteger(rawQty) ? rawQty : NaN;

    if (!id) {
      throw new HttpsError("invalid-argument", `components[${idx}].ingredientId пустой.`);
    }
    if (!Number.isInteger(qty) || qty < 1) {
      throw new HttpsError("invalid-argument", `components[${idx}].qty должен быть целым ≥ 1.`);
    }
    return { ingredientId: id, qty };
  });

  // Нормализация чисел
  const int = (v: any) => (Number.isInteger(Number(v)) ? Number(v) : NaN);

  const minH = int(minHeat);
  const maxH = int(maxHeat);
  if (!Number.isInteger(minH) || !Number.isInteger(maxH)) {
    throw new HttpsError("invalid-argument", "minHeat/maxHeat должны быть целыми числами.");
  }
  if (minH > maxH) {
    throw new HttpsError("invalid-argument", "minHeat не может быть больше maxHeat.");
  }

  let outQty = int(outputQty);
  if (!Number.isInteger(outQty) || outQty < 1) outQty = 1;

  let diff = int(difficulty);
  if (!Number.isInteger(diff) || diff < 1) diff = 1;

  // Очистка полезной нагрузки (убрать undefined/NaN)
  const safe = (obj: any) => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(safe).filter(v => v !== undefined);
    if (typeof obj === "object") {
      const out: any = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v === undefined) continue;
        if (typeof v === "number" && !Number.isFinite(v)) continue; // убираем NaN/Infinity
        out[k] = safe(v);
      }
      return out;
    }
    return obj;
  };

  // (опц.) добавим signature для быстрого поиска по наборам
  const signature = normComponents
    .slice()
    .sort((a, b) => a.ingredientId.localeCompare(b.ingredientId))
    .map(c => `${c.ingredientId}#${c.qty}`)
    .join("+");

  const newRecipeData = safe({
    name: name.trim(),
    resultPotionId: resultPotionId.trim(),
    components: normComponents,
    minHeat: minH,
    maxHeat: maxH,
    outputQty: outQty,
    difficulty: diff,
    signature,           // пригодится потом
    isActive: true,      // можно сразу активировать
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  try {
    await db.collection("alchemy_recipes").add(newRecipeData);
    return { success: true, message: "Рецепт успешно добавлен." };
  } catch (e: any) {
    console.error("Error in addAlchemyRecipe:", {
      code: e?.code,
      message: e?.message,
      details: e?.details,
      stack: e?.stack,
      dataPreview: newRecipeData, // поможет в логах
    });
    // Если Firestore ответил числовым кодом
    if (typeof e?.code === "number") {
      const map: Record<number, string> = {
        3: "invalid-argument",
        5: "not-found",
        7: "permission-denied",
        10: "aborted",
        13: "internal",
        16: "unauthenticated",
      };
      throw new HttpsError((map[e.code] ?? "internal") as any, e?.message ?? "Ошибка.");
    }
    // Если это уже HttpsError — пробросим
    if (e instanceof HttpsError) throw e;
    // Строковый код Firestore — пробросим как есть
    if (typeof e?.code === "string") throw new HttpsError(e.code as any, e?.message ?? "Ошибка.");
    // По умолчанию
    throw new HttpsError("internal", "Не удалось добавить рецепт.");
  }
});
