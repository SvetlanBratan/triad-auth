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

const COLLECTIONS = [
  { collection: 'alchemy_recipes', table: 'alchemy_recipes', idCol: 'id' },
  { collection: 'exchange_requests', table: 'exchange_requests', idCol: 'id' },
  { collection: 'familiar_trade_requests', table: 'familiar_trade_requests', idCol: 'id' },
  { collection: 'familiars', table: 'familiars', idCol: 'id' },
  { collection: 'game_settings', table: 'game_settings', idCol: 'id' },
  { collection: 'shops', table: 'shops', idCol: 'id' },
  { collection: 'system_flags', table: 'system_flags', idCol: 'id' },
  { collection: 'users', table: 'users', idCol: 'firebase_uid' },
];

function readServiceAccount(filePath) {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Firebase service account not found at: ${abs}`);
  }
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

// Firestore Timestamp -> ISO
function sanitizeForJson(value) {
  if (value == null) return value;

  if (typeof value === 'object' && value._seconds != null && value._nanoseconds != null) {
    const ms = value._seconds * 1000 + Math.floor(value._nanoseconds / 1e6);
    return new Date(ms).toISOString();
  }
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    try {
      return value.toDate().toISOString();
    } catch {}
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

async function upsertBatch(supabase, table, idCol, rows) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: idCol });
  if (error) throw error;
}

async function migrateCollection({ db, supabase, collection, table, idCol }) {
  console.log(`\n==> Migrating ${collection} -> ${table} ...`);

  let lastDoc = null;
  let total = 0;

  while (true) {
    let q = db
      .collection(collection)
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(batchSize);

    if (lastDoc) q = q.startAfter(lastDoc);

    const snap = await q.get();
    if (snap.empty) break;

    const rows = snap.docs.map((doc) => {
      const raw = doc.data();
      const data = sanitizeForJson(raw);
      const { created_at, updated_at } = pickTimestamps(raw);

      if (collection === 'users') {
        return { firebase_uid: doc.id, data, created_at, updated_at };
      }
      return { id: doc.id, data, created_at, updated_at };
    });

    await upsertBatch(supabase, table, idCol, rows);

    total += rows.length;
    lastDoc = snap.docs[snap.docs.length - 1];

    console.log(`   upserted: ${total}`);
  }

  console.log(`✅ Done ${collection}: ${total} docs`);
}

async function main() {
  console.log('Starting migration...');
  console.log('Firestore DB:', FIRESTORE_DATABASE_ID);
  console.log('Batch size:', batchSize);

  // Firebase init
  const serviceAccount = readServiceAccount(FIREBASE_SERVICE_ACCOUNT);
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  const db = admin.firestore();
  db.settings({ databaseId: FIRESTORE_DATABASE_ID });

  // Supabase init
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const cfg of COLLECTIONS) {
    await migrateCollection({ db, supabase, ...cfg });
  }

  console.log('\n🎉 All done.');
}

main().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
