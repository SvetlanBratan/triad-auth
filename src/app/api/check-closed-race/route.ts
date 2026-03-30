import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const race = searchParams.get('race');

    if (!userId || !race) {
      return NextResponse.json({ error: 'Missing userId or race parameter' }, { status: 400 });
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const allowed = userData.purchasedClosedRaces?.includes(race) || false;

    return NextResponse.json({ allowed });
  } catch (error) {
    console.error('Error checking closed race permission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}