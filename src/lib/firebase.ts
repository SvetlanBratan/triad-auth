import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, indexedDBLocalPersistence } from "firebase/auth";
import { getFirestore, collection, doc, getDoc } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import type { Guild } from "./types";

const firebaseConfig = {
  apiKey: "AIzaSyD0N_lwtTGfRwxCL2EMVMIPG62FMCn_tco",
  authDomain: "triad-scoring-system.firebaseapp.com",
  projectId: "triad-scoring-system",
  storageBucket: "triad-scoring-system.firebasestorage.app",
  messagingSenderId: "1043121641751",
  appId: "1:1043121641751:web:268ee8a85356a315eeff52",
  measurementId: "G-FGKBLBFZ45",
  databaseURL: "https://triad-scoring-system-default-rtdb.europe-west1.firebasedatabase.app",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const database = getDatabase(app);

// Always use getAuth so server and client get the same initialization path,
// preventing React hydration mismatches from the typeof window branch.
export const auth = getAuth(app);

// Set IndexedDB persistence on the client only, after auth is ready.
if (typeof window !== 'undefined') {
  setPersistence(auth, indexedDBLocalPersistence).catch((err) => {
    console.error('Failed to set auth persistence:', err);
  });

  // Initialize Analytics only in the browser
  import('firebase/analytics')
    .then(({ getAnalytics }) => getAnalytics(app))
    .catch((err) => console.error('Failed to initialize Analytics:', err));
}

// --- GUILD UTILITIES ---

/**
 * Получить данные гильдии по ID.
 * Если гильдия не найдена или factionId пуст, вернёт null.
 */
export async function fetchGuildById(factionId: string | undefined | null): Promise<Guild | null> {
  if (!factionId) {
    return null;
  }

  try {
    const guildRef = doc(db, "guilds", factionId);
    const guildSnap = await getDoc(guildRef);
    
    if (guildSnap.exists()) {
      return { id: guildSnap.id, ...guildSnap.data() } as Guild;
    }
    return null;
  } catch (error) {
    console.error(`Ошибка при получении гильдии ${factionId}:`, error);
    return null;
  }
}

/**
 * Получить данные гильдии персонажа.
 * Берёт ID гильдии из поля character.factions и загружает полную информацию.
 */
export async function fetchCharacterGuild(characterFactionsField: string | undefined): Promise<Guild | null> {
  return fetchGuildById(characterFactionsField);
}
