import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  FIREBASE_SERVICE_ACCOUNT = './secrets/firebase-service-account.json',
  FIRESTORE_DATABASE_ID = '(default)',
  BATCH_SIZE = '500',
} = process.env;

if (!SUPABASE_URL) throw new Error('Missing SUPABASE_URL');
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

const batchSize = Math.max(1, parseInt(BATCH_SIZE, 10) || 500);

function readServiceAccount(filePath) {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Firebase service account not found at: ${abs}`);
  }
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

function sanitizeForJson(value) {
  if (value == null) return value;

  if (typeof value === 'object' && value._seconds != null && value._nanoseconds != null) {
    const ms = value._seconds * 1000 + Math.floor(value._nanoseconds / 1e6);
    return new Date(ms).toISOString();
  }
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    try { return value.toDate().toISOString(); } catch {}
  }

  if (Array.isArray(value)) return value.map(sanitizeForJson);
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = sanitizeForJson(v);
    return out;
  }
  return value;
}

function pickTimestamps(raw) {
  const created = raw.createdAt ?? raw.created_at ?? raw.created ?? raw.createdOn ?? null;
  const updated = raw.updatedAt ?? raw.updated_at ?? raw.updated ?? raw.updatedOn ?? null;

  return {
    created_at: created ? sanitizeForJson(created) : null,
    updated_at: updated ? sanitizeForJson(updated) : null,
  };
}

async function upsertBatch(supabase, rows) {
  const { error } = await supabase
    .from('reward_requests')
    .upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

async function main() {
  console.log('Starting reward_requests migration...');
  console.log('Firestore DB:', FIRESTORE_DATABASE_ID);
  console.log('Batch size:', batchSize);

  const serviceAccount = readServiceAccount(FIREBASE_SERVICE_ACCOUNT);
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }

  const db = admin.firestore();
  db.settings({ databaseId: FIRESTORE_DATABASE_ID });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Берём всех пользователей
  const usersSnap = await db.collection('users').get();
  console.log(`Users scanned: ${usersSnap.size}`);

  let buffer = [];
  let total = 0;

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;

    // Подколлекция reward_requests
    const rrSnap = await db.collection('users').doc(uid).collection('reward_requests').get();
    if (rrSnap.empty) continue;

    for (const rrDoc of rrSnap.docs) {
      const raw = rrDoc.data();
      const data = sanitizeForJson(raw);
      const { created_at, updated_at } = pickTimestamps(raw);

      buffer.push({
        id: rrDoc.id,
        firebase_uid: uid,
        data,
        created_at,
        updated_at,
      });

      if (buffer.length >= batchSize) {
        await upsertBatch(supabase, buffer);
        total += buffer.length;
        buffer = [];
        console.log(`   upserted: ${total}`);
      }
    }
  }

  if (buffer.length) {
    await upsertBatch(supabase, buffer);
    total += buffer.length;
  }

  console.log(`✅ Done reward_requests: ${total} docs`);
}

main().catch((e) => {
  console.error('Reward requests migration failed:', e);
  process.exit(1);
});
