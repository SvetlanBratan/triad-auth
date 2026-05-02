import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { GalleryImage } from "@/lib/types";

/**
 * POST /api/character-gallery
 *
 * Добавляет колдоснимки в анкету персонажа.
 * Используется внешними сайтами: они загружают изображения в Cloudinary,
 * получают URL и передают сюда — картинки сразу попадают в поле personazha.galleryImages.
 *
 * Тело запроса (JSON):
 * {
 *   "userId": "uid_пользователя_владельца",
 *   "characterId": "id_персонажа",
 *   "images": [
 *     { "url": "https://res.cloudinary.com/...", "taggedCharacterIds": [] },
 *     ...
 *   ]
 * }
 *
 * Заголовок авторизации:
 *   Authorization: Bearer <API_SECRET_KEY>
 */
export async function POST(req: NextRequest) {
  // Проверка секретного ключа
  const authHeader = req.headers.get("authorization");
  const expectedKey = process.env.API_SECRET_KEY;

  if (!expectedKey) {
    console.error("API_SECRET_KEY is not configured");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { userId?: string; characterId?: string; images?: { url: string; taggedCharacterIds?: string[] }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId, characterId, images } = body;

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  if (!characterId || typeof characterId !== "string") {
    return NextResponse.json({ error: "characterId is required" }, { status: 400 });
  }
  if (!images || !Array.isArray(images) || images.length === 0) {
    return NextResponse.json({ error: "images array is required and must not be empty" }, { status: 400 });
  }

  // Валидация URL
  const invalidImages = images.filter(img => !img.url || typeof img.url !== "string" || !img.url.startsWith("http"));
  if (invalidImages.length > 0) {
    return NextResponse.json({ error: "All images must have a valid URL starting with http(s)" }, { status: 400 });
  }

  try {
    const admin = getFirebaseAdmin();
    const db = admin.firestore();

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data() as { characters?: { id: string; galleryImages?: GalleryImage[] }[] };
    const characters = userData.characters || [];
    const charIndex = characters.findIndex(c => c.id === characterId);

    if (charIndex === -1) {
      return NextResponse.json({ error: "Character not found for this user" }, { status: 404 });
    }

    // Формируем новые GalleryImage объекты
    const newImages: GalleryImage[] = images.map(img => ({
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url: img.url,
      taggedCharacterIds: img.taggedCharacterIds || [],
    }));

    const existingGallery: GalleryImage[] = characters[charIndex].galleryImages || [];
    const updatedGallery = [...existingGallery, ...newImages];

    // Обновляем массив персонажей
    const updatedCharacters = [...characters];
    updatedCharacters[charIndex] = {
      ...updatedCharacters[charIndex],
      galleryImages: updatedGallery,
    };

    await userRef.update({ characters: updatedCharacters });

    return NextResponse.json({
      success: true,
      addedCount: newImages.length,
      totalGalleryCount: updatedGallery.length,
    });
  } catch (error) {
    console.error("Error updating character gallery:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
