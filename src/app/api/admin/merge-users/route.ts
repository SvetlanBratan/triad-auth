import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import type { User } from '@/lib/types';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

type MergeBody = {
  sourceUserId?: string;
  targetUserId?: string;
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => typeof v === 'string' && v.length > 0)));
}

function pickLatestIsoDate(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

function readBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader) return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length).trim();
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.FIREBASE_ADMIN_JSON) {
      return NextResponse.json(
        { message: 'Переменная FIREBASE_ADMIN_JSON не настроена на сервере.' },
        { status: 500 }
      );
    }

    const token = readBearerToken(req);
    if (!token) {
      return NextResponse.json({ message: 'Требуется авторизация.' }, { status: 401 });
    }

    const firebaseAdmin = getFirebaseAdmin();
    const decoded = await firebaseAdmin.auth().verifyIdToken(token);
    const db = firebaseAdmin.firestore();

    const requesterDoc = await db.collection('users').doc(decoded.uid).get();
    if (!requesterDoc.exists || requesterDoc.data()?.role !== 'admin') {
      return NextResponse.json({ message: 'Недостаточно прав.' }, { status: 403 });
    }

    const body = (await req.json()) as MergeBody;
    const sourceUserId = typeof body.sourceUserId === 'string' ? body.sourceUserId.trim() : '';
    const targetUserId = typeof body.targetUserId === 'string' ? body.targetUserId.trim() : '';

    if (!sourceUserId || !targetUserId) {
      return NextResponse.json({ message: 'Нужно передать sourceUserId и targetUserId.' }, { status: 400 });
    }

    if (sourceUserId === targetUserId) {
      return NextResponse.json({ message: 'Нельзя объединять один и тот же аккаунт.' }, { status: 400 });
    }

    const sourceRef = db.collection('users').doc(sourceUserId);
    const targetRef = db.collection('users').doc(targetUserId);

    const result = await db.runTransaction(async (transaction) => {
      const [sourceSnap, targetSnap] = await Promise.all([
        transaction.get(sourceRef),
        transaction.get(targetRef),
      ]);

      if (!sourceSnap.exists) {
        throw new Error('SOURCE_NOT_FOUND');
      }
      if (!targetSnap.exists) {
        throw new Error('TARGET_NOT_FOUND');
      }

      const sourceData = sourceSnap.data() as User;
      const targetData = targetSnap.data() as User;

      const targetCharacters = asArray<any>(targetData.characters);
      const sourceCharacters = asArray<any>(sourceData.characters);
      const existingCharacterIds = new Set(
        targetCharacters
          .map((c) => (typeof c?.id === 'string' ? c.id : ''))
          .filter(Boolean)
      );

      const sourceCharactersWithUniqueIds = sourceCharacters.map((character, index) => {
        const originalId = typeof character?.id === 'string' && character.id.length > 0
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

    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'SOURCE_NOT_FOUND') {
        return NextResponse.json({ message: 'Исходный аккаунт не найден.' }, { status: 404 });
      }
      if (error.message === 'TARGET_NOT_FOUND') {
        return NextResponse.json({ message: 'Целевой аккаунт не найден.' }, { status: 404 });
      }
    }

    console.error('Merge users route error:', error);
    return NextResponse.json({ message: 'Внутренняя ошибка сервера при объединении.' }, { status: 500 });
  }
}
