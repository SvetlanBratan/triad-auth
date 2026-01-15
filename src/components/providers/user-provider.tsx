

"use client";

import React, { createContext, useState, useMemo, useCallback, useEffect, useContext } from 'react';
import type { User, Character, PointLog, UserStatus, UserRole, RewardRequest, RewardRequestStatus, FamiliarCard, Moodlet, Inventory, GameSettings, Relationship, RelationshipAction, RelationshipActionType, BankAccount, WealthLevel, ExchangeRequest, Currency, FamiliarTradeRequest, FamiliarTradeRequestStatus, FamiliarRank, BankTransaction, Shop, ShopItem, InventoryItem, AdminGiveItemForm, InventoryCategory, CitizenshipStatus, TaxpayerStatus, PerformRelationshipActionParams, MailMessage, Cooldowns, PopularityLog, CharacterPopularityUpdate, OwnedFamiliarCard, AlchemyRecipe, AlchemyRecipeComponent, PlayerStatus, PlayerPing, SocialLink, OngoingHunt, HuntReward } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, writeBatch, collection, getDocs, query, where, orderBy, deleteDoc, runTransaction, addDoc, collectionGroup, limit, startAfter, increment, FieldValue, arrayUnion, deleteField, arrayRemove } from "firebase/firestore";
import { ALL_STATIC_FAMILIARS, EVENT_FAMILIARS, MOODLETS_DATA, DEFAULT_GAME_SETTINGS, WEALTH_LEVELS, ALL_SHOPS, SHOPS_BY_ID, POPULARITY_EVENTS, ALL_ACHIEVEMENTS, INVENTORY_CATEGORIES } from '@/lib/data';
import { differenceInDays, differenceInMonths } from 'date-fns';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface AuthContextType {
    user: FirebaseUser | null;
    loading: boolean;
    signOutUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

interface UserContextType extends Omit<User, 'id' | 'name' | 'email' | 'avatar' | 'role' | 'points' | 'status' | 'characters' | 'pointHistory' | 'achievementIds' | 'extraCharacterSlots' | 'mail' | 'playerPings' | 'playerStatus' | 'playPlatform' | 'socialLink' | 'socials' | 'favoritePlayerIds' | 'lastLogin'> {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  gameDate: Date | null;
  gameDateString: string | null;
  gameSettings: GameSettings;
  lastWeeklyBonusAwardedAt: string | undefined;
  fetchUserById: (userId: string) => Promise<User | null>;
  fetchCharacterById: (characterId: string) => Promise<{ character: Character; owner: User } | null>;
  fetchUsersForAdmin: () => Promise<User[]>;
  fetchLeaderboardUsers: () => Promise<User[]>;
  fetchAllRewardRequests: () => Promise<RewardRequest[]>;
  fetchRewardRequestsForUser: (userId: string) => Promise<RewardRequest[]>;
  fetchAvailableMythicCardsCount: () => Promise<number>;
  addPointsToUser: (userId: string, amount: number, reason: string, characterId?: string) => Promise<User | null>;
  addPointsToAllUsers: (amount: number, reason: string) => Promise<void>;
  addCharacterToUser: (userId: string, character: Character) => Promise<void>;
  updateCharacterInUser: (userId: string, character: Character) => Promise<User>;
  deleteCharacterFromUser: (userId: string, characterId: string) => Promise<void>;
  updateUserStatus: (userId: string, status: UserStatus) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  grantAchievementToUser: (userId: string, achievementId: string) => Promise<void>;
  createNewUser: (uid: string, nickname: string) => Promise<User>;
  createRewardRequest: (rewardRequest: Omit<RewardRequest, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  updateRewardRequestStatus: (request: RewardRequest, newStatus: RewardRequestStatus) => Promise<RewardRequest | null>;
  pullGachaForCharacter: (userId: string, characterId: string) => Promise<{updatedUser: User, newCard: FamiliarCard, isDuplicate: boolean}>;
  giveAnyFamiliarToCharacter: (userId: string, characterId: string, familiarId: string) => Promise<void>;
  clearPointHistoryForUser: (userId: string) => Promise<void>;
  clearAllPointHistories: () => Promise<void>;
  addMoodletToCharacter: (userId: string, characterId: string, moodletId: string, durationInDays: number, source?: string) => Promise<void>;
  removeMoodletFromCharacter: (userId: string, characterId: string, moodletId: string) => Promise<void>;
  clearRewardRequestsHistory: () => Promise<void>;
  removeFamiliarFromCharacter: (userId: string, characterId: string, cardId: string) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  updateUserAvatar: (userId: string, avatarUrl: string) => Promise<void>;
  updateGameDate: (newDateString: string) => Promise<void>;
  updateGameSettings: (updates: Partial<GameSettings>) => Promise<void>;
  processWeeklyBonus: () => Promise<{ awardedCount: number }>;
  checkExtraCharacterSlots: (userId: string) => Promise<number>;
  performRelationshipAction: (params: PerformRelationshipActionParams) => Promise<void>;
  recoverFamiliarsFromHistory: (userId: string, characterId: string, oldCharacterName?: string) => Promise<number>;
  recoverAllFamiliars: () => Promise<{ totalRecovered: number; usersAffected: number }>;
  addBankPointsToCharacter: (userId: string, characterId: string, amount: Partial<BankAccount>, reason: string) => Promise<void>;
  transferCurrency: (sourceUserId: string, sourceCharacterId: string, targetCharacterId: string, amount: Partial<Omit<BankAccount, 'history'>>, reason: string) => Promise<void>;
  processMonthlySalary: () => Promise<void>;
  updateCharacterWealthLevel: (userId: string, characterId: string, wealthLevel: WealthLevel) => Promise<void>;
  createExchangeRequest: (creatorUserId: string, creatorCharacterId: string, fromCurrency: Currency, fromAmount: number, toCurrency: Currency, toAmount: number) => Promise<void>;
  fetchOpenExchangeRequests: () => Promise<ExchangeRequest[]>;
  acceptExchangeRequest: (acceptorUserId: string, acceptorCharacterId: string, request: ExchangeRequest) => Promise<void>;
  cancelExchangeRequest: (request: ExchangeRequest) => Promise<void>;
  createFamiliarTradeRequest: (initiatorCharacterId: string, initiatorFamiliarId: string, targetCharacterId: string, targetFamiliarId: string) => Promise<void>;
  fetchFamiliarTradeRequestsForUser: () => Promise<FamiliarTradeRequest[]>;
  acceptFamiliarTradeRequest: (request: FamiliarTradeRequest) => Promise<void>;
  declineOrCancelFamiliarTradeRequest: (request: FamiliarTradeRequest, status: 'отклонено' | 'отменено') => Promise<void>;
  fetchAllShops: () => Promise<Shop[]>;
  fetchShopById: (shopId: string) => Promise<Shop | null>;
  updateShopOwner: (shopId: string, ownerUserId: string, ownerCharacterId: string, ownerCharacterName: string) => Promise<void>;
  removeShopOwner: (shopId: string) => Promise<void>;
  updateShopDetails: (shopId: string, details: Partial<Pick<Shop, 'title' | 'description' | 'defaultNewItemCategory'>>) => Promise<void>;
  addShopItem: (shopId: string, item: Omit<ShopItem, 'id'>) => Promise<void>;
  updateShopItem: (shopId: string, item: ShopItem) => Promise<void>;
  deleteShopItem: (shopId: string, itemId: string) => Promise<void>;
  purchaseShopItem: (shopId: string, itemId: string, buyerUserId: string, buyerCharacterId: string, quantity: number) => Promise<void>;
  adminGiveItemToCharacter: (userId: string, characterId: string, itemData: AdminGiveItemForm) => Promise<void>;
  adminUpdateItemInCharacter: (userId: string, characterId: string, itemData: InventoryItem, category: InventoryCategory) => Promise<void>;
  adminDeleteItemFromCharacter: (userId: string, characterId: string, itemId: string, category: InventoryCategory) => Promise<void>;
  consumeInventoryItem: (userId: string, characterId: string, itemId: string, category: InventoryCategory) => Promise<void>;
  restockShopItem: (shopId: string, itemId: string) => Promise<void>;
  adminUpdateCharacterStatus: (userId: string, characterId: string, updates: { taxpayerStatus?: TaxpayerStatus; citizenshipStatus?: CitizenshipStatus }) => Promise<void>;
  adminUpdateShopLicense: (shopId: string, hasLicense: boolean) => Promise<void>;
  processAnnualTaxes: () => Promise<{ taxedCharactersCount: number; totalTaxesCollected: BankAccount }>;
  sendMassMail: (subject: string, content: string, senderName: string, recipientCharacterIds?: string[]) => Promise<void>;
  markMailAsRead: (mailId: string) => Promise<void>;
  deleteMailMessage: (mailId: string) => Promise<void>;
  clearAllMailboxes: () => Promise<void>;
  updatePopularity: (updates: CharacterPopularityUpdate[]) => Promise<void>;
  clearAllPopularityHistories: () => Promise<void>;
  withdrawFromShopTill: (shopId: string) => Promise<void>;
  brewPotion: (userId: string, characterId: string, recipeId: string) => Promise<void>;
  addAlchemyRecipe: (recipe: Omit<AlchemyRecipe, 'id' | 'createdAt'>) => Promise<void>;
  updateAlchemyRecipe: (recipeId: string, recipe: Omit<AlchemyRecipe, 'id' | 'createdAt'>) => Promise<void>;
  deleteAlchemyRecipe: (recipeId: string) => Promise<void>;
  fetchAlchemyRecipes: () => Promise<AlchemyRecipe[]>;
  fetchDbFamiliars: () => Promise<FamiliarCard[]>;
  addFamiliarToDb: (familiar: Omit<FamiliarCard, 'id'>) => Promise<void>;
  deleteFamiliarFromDb: (familiarId: string) => Promise<void>;
  sendPlayerPing: (targetUserId: string) => Promise<void>;
  deletePlayerPing: (pingId: string, isMyPing: boolean) => Promise<void>;
  addFavoritePlayer: (targetUserId: string) => Promise<void>;
  removeFavoritePlayer: (targetUserId: string) => Promise<void>;
  deleteUserAccount: (userId: string) => Promise<void>;
  allFamiliars: FamiliarCard[];
  familiarsById: Record<string, FamiliarCard>;
  startHunt: (characterId: string, familiarId: string, locationId: string) => Promise<void>;
  claimHuntReward: (characterId: string, huntId: string) => Promise<InventoryItem[]>;
  recallHunt: (characterId: string, huntId: string) => Promise<void>;
}

export const UserContext = createContext<UserContextType | null>(null);

const ADMIN_UIDS = ['Td5P02zpyaMR3IxCY9eCf7gcYky1', 'yawuIwXKVbNhsBQSqWfGZyAzZ3A3'];
const ROULETTE_COST = 5000;
const DUPLICATE_REFUND = 1000;
const FIRST_PULL_ACHIEVEMENT_ID = 'ach-first-gacha';
const MYTHIC_PULL_ACHIEVEMENT_ID = 'ach-mythic-pull';
const FIRST_BREW_ACHIEVEMENT_ID = 'ach-first-brew';
const FIRST_PURCHASE_ACHIEVEMENT_ID = 'ach-first-purchase';
const GENEROUS_ACHIEVEMENT_ID = 'ach-generous';
const GENEROUS_THRESHOLD = 100000;
const PUMPKIN_WIFE_REWARD_ID = 'r-pumpkin-wife';
const PUMPKIN_WIFE_CARD_ID = 'fam-e-pumpkin-wife';
const PUMPKIN_HUSBAND_REWARD_ID = 'r-pumpkin-husband';
const PUMPKIN_HUSBAND_CARD_ID = 'fam-e-pumpkin-husband';
const PUMPKIN_SPOUSE_ACHIEVEMENT_ID = 'ach-pumpkin-spouse';
const PUMPKIN_HUSBAND_ACHIEVEMENT_ID = 'ach-pumpkin-husband';
const FORBES_LIST_ACHIEVEMENT_ID = 'ach-forbes-list';
const GODS_FAVORITE_ACHIEVEMENT_ID = 'ach-gods-favorite';
const EXTRA_CHARACTER_REWARD_ID = 'r-extra-char';
const AI_ART_REWARD_ID = 'r-ai-art';
const ERA_FACE_ACHIEVEMENT_ID = 'ach-era-face';


const RELATIONSHIP_POINTS_CONFIG: Record<RelationshipActionType, number> = {
    подарок: 25,
    письмо: 10,
};

const drawFamiliarCard = (allCardPool: FamiliarCard[], hasBlessing: boolean, unavailableMythicIds: Set<string>, gachaChances: GameSettings['gachaChances']): FamiliarCard => {
    let rand = Math.random() * 100;
    const chances = hasBlessing ? gachaChances.blessed : gachaChances.normal;
    const availableCards = allCardPool;

    const availableMythic = availableCards.filter(c => c.rank === 'мифический' && !unavailableMythicIds.has(c.id));
    const availableLegendary = availableCards.filter(c => c.rank === 'легендарный');
    const availableRare = availableCards.filter(c => c.rank === 'редкий');
    const availableCommon = availableCards.filter(c => c.rank === 'обычный');
    
    const cumulativeMythic = chances.мифический;
    const cumulativeLegendary = cumulativeMythic + chances.легендарный;
    const cumulativeRare = cumulativeLegendary + chances.редкий;

    let chosenPool: FamiliarCard[] = [];

    if (rand <= cumulativeMythic && availableMythic.length > 0) {
        chosenPool = availableMythic;
    } else if (rand <= cumulativeLegendary && availableLegendary.length > 0) {
        chosenPool = availableLegendary;
    } else if (rand <= cumulativeRare && availableRare.length > 0) {
        chosenPool = availableRare;
    } else {
        chosenPool = availableCommon;
    }
    
    if (chosenPool.length === 0) {
        if (availableCommon.length > 0) chosenPool = availableCommon;
        else if (availableRare.length > 0) chosenPool = availableRare;
        else if (availableLegendary.length > 0) chosenPool = availableLegendary;
        else if (availableMythic.length > 0) chosenPool = availableMythic;
        else chosenPool = allCardPool.filter(c => c.rank !== 'ивентовый');
    }

    return chosenPool[Math.floor(Math.random() * chosenPool.length)];
};

const defaultInventory: Inventory = INVENTORY_CATEGORIES.reduce((acc, category) => {
    acc[category.value] = [];
    return acc;
}, {} as Inventory);

const sanitizeObjectForFirestore = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObjectForFirestore);
    }
    if (typeof obj === 'object' && obj.constructor === Object) {
      const newObj: { [key: string]: any } = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          newObj[key] = sanitizeObjectForFirestore(obj[key]);
        }
      }
      return newObj;
    }
    return obj;
};


export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [allFamiliars, setAllFamiliars] = useState<FamiliarCard[]>([...ALL_STATIC_FAMILIARS, ...EVENT_FAMILIARS]);
  const [familiarsById, setFamiliarsById] = useState<Record<string, FamiliarCard>>({});

  const functions = useMemo(() => getFunctions(), []);
  
  const initialFormData: Omit<Character, 'id'> = useMemo(() => ({
    name: '',
    activity: '',
    race: '',
    raceIsConfirmed: false,
    birthDate: '',
    crimeLevel: 5,
    countryOfResidence: '',
    residenceLocation: '',
    citizenshipStatus: 'non-citizen',
    taxpayerStatus: 'taxable',
    accomplishments: [],
    workLocation: '',
    factions: '',
    appearance: '',
    appearanceImage: '',
    personality: '',
    biography: '',
    biographyIsHidden: false,
    diary: '',
    training: [],
    relationships: [],
    marriedTo: [],
    abilities: '',
    weaknesses: '',
    lifeGoal: '',
    criminalRecords: '',
    familiarCards: [],
    moodlets: [],
    inventory: defaultInventory,
    bankAccount: { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] },
    wealthLevel: 'Бедный',
    popularity: 0,
    popularityHistory: [],
    pets: '',
    galleryImages: [],
    bannerImage: '',
    ongoingHunts: [],
  }), []);

  const processUserDoc = useCallback((userDoc: User) => {
    const userData = { ...userDoc };
    userData.characters = userData.characters?.map(char => {
         const processedChar = {
             ...initialFormData,
             ...char,
             inventory: { ...defaultInventory, ...(char.inventory || {}) },
             familiarCards: char.familiarCards || [],
             ongoingHunts: char.ongoingHunts || [],
             crimeLevel: char.crimeLevel ?? 5, 
             bankAccount:
               typeof char.bankAccount !== 'object' || char.bankAccount === null
                 ? { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] }
                 : {
                     platinum: char.bankAccount.platinum ?? 0,
                     gold: char.bankAccount.gold ?? 0,
                     silver: char.bankAccount.silver ?? 0,
                     copper: char.bankAccount.copper ?? 0,
                     history: Array.isArray(char.bankAccount.history) ? char.bankAccount.history : []
                   },
             accomplishments: char.accomplishments || [],
             training: Array.isArray(char.training) ? char.training : [],
             marriedTo: Array.isArray(char.marriedTo) ? char.marriedTo : [],
             relationships: (Array.isArray(char.relationships) ? char.relationships : []).map(r => ({ ...r, id: r.id || `rel-${Math.random()}` })),
             moodlets: char.moodlets || [],
             popularity: char.popularity ?? 0,
             popularityHistory: char.popularityHistory || [],
             galleryImages: char.galleryImages || [],
         };

         return processedChar;
     }) || [];
    userData.achievementIds = userData.achievementIds || [];
    userData.extraCharacterSlots = userData.extraCharacterSlots || 0;
    userData.pointHistory = userData.pointHistory || [];
    userData.mail = userData.mail || [];
    userData.playerPings = userData.playerPings || [];
    userData.playerStatus = userData.playerStatus || 'Не играю';
    userData.socials = userData.socials || [];
    userData.favoritePlayerIds = userData.favoritePlayerIds || [];
    userData.lastLogin = userData.lastLogin || new Date().toISOString();
    return userData;
  }, [initialFormData]);
  
  const fetchUserById = useCallback(async (userId: string): Promise<User | null> => {
      const userRef = doc(db, "users", userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
          return processUserDoc(docSnap.data() as User);
      }
      return null;
  }, [processUserDoc]);

  const fetchUsersForAdmin = useCallback(async (): Promise<User[]> => {
    try {
        const usersCollection = collection(db, "users");
        const userSnapshot = await getDocs(query(usersCollection));
        return Promise.all(userSnapshot.docs.map(doc => processUserDoc(doc.data() as User)));
    } catch(error) {
        console.error("Error fetching users for admin.", error);
        throw error;
    }
  }, [processUserDoc]);

  const fetchLeaderboardUsers = useCallback(async (): Promise<User[]> => {
      const usersCollection = collection(db, "users");
      const userSnapshot = await getDocs(query(usersCollection, orderBy("points", "desc")));
      const users = userSnapshot.docs.map(doc => {
          const userData = doc.data() as User;
          return {
              id: userData.id,
              name: userData.name,
              avatar: userData.avatar,
              points: userData.points,
              status: userData.status,
              email: userData.email,
              role: userData.role,
              characters: userData.characters || [],
              pointHistory: [], 
              achievementIds: userData.achievementIds || [],
              playerStatus: userData.playerStatus || 'Не играю',
              socials: userData.socials || [],
              favoritePlayerIds: userData.favoritePlayerIds || [],
              lastLogin: userData.lastLogin
          };
      });
      return users;
  }, []);

  const grantAchievementToUser = useCallback(async (userId: string, achievementId: string) => {
    const user = await fetchUserById(userId);
    if (!user) return;

    const achievementIds = user.achievementIds || [];
    if (!achievementIds.includes(achievementId)) {
        const updatedAchievementIds = [...achievementIds, achievementId];
        await updateDoc(doc(db, "users", userId), { achievementIds: updatedAchievementIds });
    }
  }, [fetchUserById]);

  const addPointsToUser = useCallback(async (userId: string, amount: number, reason: string, characterId?: string): Promise<User | null> => {
    const user = await fetchUserById(userId);
    if (!user) return null;

    const newPointLog: PointLog = {
      id: `h-${Date.now()}`,
      date: new Date().toISOString(),
      amount,
      reason,
      ...(characterId && { characterId }),
    };
    const newPoints = user.points + amount;
    const newHistory = [newPointLog, ...user.pointHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const updates: Partial<User> = { points: newPoints, pointHistory: newHistory };
    
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, updates);

    // After updating points, check for Forbes list achievement
    const allUsers = await fetchLeaderboardUsers(); 
    const top3Users = allUsers.slice(0, 3);
    
    for (const topUser of top3Users) {
      if (!topUser.achievementIds?.includes(FORBES_LIST_ACHIEVEMENT_ID)) {
        await grantAchievementToUser(topUser.id, FORBES_LIST_ACHIEVEMENT_ID);
      }
    }
    
    const finalUser = { ...user, points: newPoints, pointHistory: newHistory };
    if(currentUser?.id === userId) {
      setCurrentUser(finalUser);
    }
    return finalUser;
  }, [fetchUserById, currentUser?.id, grantAchievementToUser, fetchLeaderboardUsers]);

  const fetchGameSettings = useCallback(async () => {
    try {
        const settingsRef = doc(db, 'game_settings', 'main');
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
            const data = docSnap.data() as GameSettings;
            let finalSettings: GameSettings = { ...DEFAULT_GAME_SETTINGS, ...data };
             if (!finalSettings.gachaChances) {
                finalSettings.gachaChances = DEFAULT_GAME_SETTINGS.gachaChances;
            }
            if(data.gameDateString) {
                const dateStr = data.gameDateString;
                const dateParts = dateStr.match(/(\d+)\s(\S+)\s(\d+)/);
                if (dateParts) {
                    const months: { [key: string]: number } = { "января":0, "февраля":1, "марта":2, "апреля":3, "мая":4, "июня":5, "июля":6, "августа":7, "сентября":8, "октября":9, "ноября":10, "декабря":11 };
                    const day = parseInt(dateParts[1]);
                    const month = months[dateParts[2].toLowerCase()];
                    const year = parseInt(dateParts[3]);
                    const gameDate = new Date(year, month, day);
                     if (!isNaN(gameDate.getTime())) {
                        finalSettings.gameDate = gameDate;
                    }
                }
            }
            setGameSettings(finalSettings);
        } else {
            // If no settings exist, create them with defaults
            await setDoc(doc(db, 'game_settings', 'main'), DEFAULT_GAME_SETTINGS);
            setGameSettings(DEFAULT_GAME_SETTINGS);
        }
    } catch (error) {
        console.error("Error fetching game settings. Using default.", error);
    }
  }, []);
  
  const processWeeklyBonus = useCallback(async () => {
    const settingsRef = doc(db, 'game_settings', 'main');
    const settingsDoc = await getDoc(settingsRef);
    const settings = settingsDoc.data() as GameSettings;

    const now = new Date();
    const lastAwarded = settings.lastWeeklyBonusAwardedAt ? new Date(settings.lastWeeklyBonusAwardedAt) : new Date(0);
    const daysSinceLast = differenceInDays(now, lastAwarded);
    
    if (daysSinceLast < 7) {
        console.log(`Weekly bonus not due yet. Days since last: ${daysSinceLast}`);
        return { awardedCount: 0 };
    }

    const allUsers = await fetchUsersForAdmin();
    let awardedCount = 0;

    for (const user of allUsers) {
        let needsUpdate = false;
        
        // Inactivity check
        const lastLogin = user.lastLogin ? new Date(user.lastLogin) : new Date(0);
        if (differenceInMonths(now, lastLogin) >= 1 && user.status !== 'отпуск' && user.status !== 'неактивный') {
             await updateDoc(doc(db, "users", user.id), { status: 'неактивный' });
        }

        // Weekly bonus for active users
        if (user.status === 'активный') {
            await addPointsToUser(user.id, 800, 'Еженедельный бонус за активность');
            awardedCount++;
        }
    }

    await updateDoc(settingsRef, { lastWeeklyBonusAwardedAt: now.toISOString() });
    await fetchGameSettings();

    return { awardedCount };
  }, [fetchUsersForAdmin, fetchGameSettings, addPointsToUser]);
  
  const createNewUser = useCallback(async (uid: string, nickname: string): Promise<User> => {
    const newUser: User = {
        id: uid,
        name: nickname,
        email: `${nickname.toLowerCase().replace(/\s/g, '')}@pumpkin.com`,
        avatar: `https://placehold.co/100x100/A050A0/FFFFFF.png?text=${nickname.charAt(0)}`,
        role: ADMIN_UIDS.includes(uid) ? 'admin' : 'user',
        points: 1000,
        status: 'активный',
        playerStatus: 'Не играю',
        socials: [],
        characters: [],
        pointHistory: [{
            id: `h-${Date.now()}`,
            date: new Date().toISOString(),
            amount: 1000,
            reason: 'Приветственный бонус!',
        }],
        achievementIds: [],
        extraCharacterSlots: 0,
        mail: [],
        playerPings: [],
        favoritePlayerIds: [],
        lastLogin: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, "users", uid), newUser);
      return newUser;
    } catch(error) {
      console.error("Error creating user in Firestore:", error);
      throw error;
    }
  }, []);

  const fetchDbFamiliars = useCallback(async (): Promise<FamiliarCard[]> => {
    const familiarsCollection = collection(db, "familiars");
    const snapshot = await getDocs(familiarsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FamiliarCard));
  }, []);

  const fetchAndCombineFamiliars = useCallback(async () => {
    const dbFamiliars = await fetchDbFamiliars();
    const combined = [...ALL_STATIC_FAMILIARS, ...EVENT_FAMILIARS, ...dbFamiliars];
    setAllFamiliars(combined);
    
    const byId = combined.reduce((acc, card) => {
        acc[card.id] = card;
        return acc;
    }, {} as Record<string, FamiliarCard>);
    setFamiliarsById(byId);
  }, [fetchDbFamiliars]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setFirebaseUser(user);
        try {
            await fetchGameSettings(); 
            await fetchAndCombineFamiliars();
            let userData = await fetchUserById(user.uid);

            if (userData) {
                const updates: Partial<User> = { lastLogin: new Date().toISOString() };
                if (userData.status !== 'отпуск') {
                    updates.status = 'активный';
                }
                await updateDoc(doc(db, "users", user.uid), updates);
                userData = { ...userData, ...updates }; 
            } else {
                const nickname = user.displayName || user.email?.split('@')[0] || 'Пользователь';
                userData = await createNewUser(user.uid, nickname);
            }

            setCurrentUser(userData);
            if(userData?.role === 'admin') {
                processWeeklyBonus();
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            setCurrentUser(null);
        }
      } else {
        setFirebaseUser(null);
        setCurrentUser(null);
        setGameSettings(DEFAULT_GAME_SETTINGS); 
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [createNewUser, fetchUserById, fetchGameSettings, processWeeklyBonus, fetchAndCombineFamiliars]);

    const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, sanitizeObjectForFirestore(updates));
    
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [currentUser?.id]);

  const updateGameDate = useCallback(async (newDateString: string) => {
    const settingsRef = doc(db, 'game_settings', 'main');
    await updateDoc(settingsRef, { gameDateString: newDateString });
    await fetchGameSettings();
  }, [fetchGameSettings]);

  const updateGameSettings = useCallback(async (updates: Partial<GameSettings>) => {
    const settingsRef = doc(db, 'game_settings', 'main');
    await updateDoc(settingsRef, updates);
    await fetchGameSettings();
  }, [fetchGameSettings]);

  const updateUserAvatar = useCallback(async (userId: string, avatarUrl: string) => {
    await updateUser(userId, { avatar: avatarUrl });
  }, [updateUser]);

  const addPointsToAllUsers = useCallback(async (amount: number, reason: string) => {
    const allUsers = await fetchUsersForAdmin();
    const batch = writeBatch(db);
    
    for (const user of allUsers) {
        await addPointsToUser(user.id, amount, reason);
    }

  }, [fetchUsersForAdmin, addPointsToUser]);

  const addCharacterToUser = useCallback(async (userId: string, characterData: Character) => {
    const user = await fetchUserById(userId);
    if (!user) return;

    const updatedCharacters = [...user.characters, characterData];
    await updateUser(userId, { characters: updatedCharacters });
  }, [fetchUserById, updateUser]);

  const updateCharacterInUser = useCallback(async (userId: string, characterToUpdate: Character): Promise<User> => {
    await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", userId);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
            throw new Error("Source user not found!");
        }

        const sourceUserData = userDoc.data() as User;
        
        const sanitizeCharacterForWrite = (char: Character): Character => {
            let sanitized: any = JSON.parse(JSON.stringify(char));

            sanitized = { ...initialFormData, ...sanitized };
            sanitized.inventory = { ...defaultInventory, ... (sanitized.inventory || {}) };
            sanitized.bankAccount = { ...initialFormData.bankAccount, ... (sanitized.bankAccount || {}) };
            sanitized.familiarCards = sanitized.familiarCards || [];
            
            const arrayFields: (keyof Character)[] = ['accomplishments', 'training', 'relationships', 'marriedTo', 'moodlets', 'popularityHistory', 'galleryImages'];
            arrayFields.forEach(field => {
                if (!Array.isArray(sanitized[field])) {
                    (sanitized as any)[field] = [];
                }
            });

            const stringFields: (keyof Character)[] = ['factions', 'abilities', 'weaknesses', 'lifeGoal', 'criminalRecords', 'appearanceImage', 'diary', 'workLocation', 'blessingExpires', 'bannerImage'];
            stringFields.forEach(field => {
                if (sanitized[field] === undefined || sanitized[field] === null) {
                    (sanitized as any)[field] = '';
                }
            });
            
            Object.keys(sanitized).forEach(key => {
                if (sanitized[key] === undefined) {
                    delete sanitized[key];
                }
            });
            
            return sanitized as Character;
        };
        
        const sanitizedCharacterToUpdate = sanitizeCharacterForWrite(characterToUpdate);

        const updatedCharacters = [...sourceUserData.characters];
        const characterIndex = updatedCharacters.findIndex(char => char.id === sanitizedCharacterToUpdate.id);

        if (characterIndex > -1) {
            updatedCharacters[characterIndex] = sanitizedCharacterToUpdate;
        } else {
            updatedCharacters.push(sanitizedCharacterToUpdate);
        }
        
        transaction.update(userRef, { characters: updatedCharacters });
    });

    const updatedUser = await fetchUserById(userId);
    if (!updatedUser) throw new Error("Failed to fetch user after update.");
    if (currentUser?.id === userId) {
        setCurrentUser(updatedUser);
    }
    return updatedUser;
}, [currentUser?.id, fetchUserById, initialFormData]);

  const fetchCharacterById = useCallback(async (characterId: string): Promise<{ character: Character; owner: User } | null> => {
    try {
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);

        for (const userDoc of usersSnapshot.docs) {
            const user = await fetchUserById(userDoc.id); // Use fetchUserById to get fully processed user data
            if (user && user.characters) {
                const character = user.characters.find(c => c.id === characterId);
                if (character) {
                    return { character, owner: user };
                }
            }
        }
        return null; // Not found
    } catch (error) {
        console.error("Error fetching character by ID:", error);
        return null;
    }
  }, [fetchUserById]);

  const signOutUser = useCallback(() => {
    signOut(auth);
  }, []);
  
  const authValue = useMemo(() => ({
    user: firebaseUser,
    loading,
    signOutUser,
  }), [firebaseUser, loading, signOutUser]);
  
  const userContextValue: UserContextType = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      gameDate: gameSettings.gameDate,
      gameDateString: gameSettings.gameDateString,
      gameSettings,
      lastWeeklyBonusAwardedAt: gameSettings.lastWeeklyBonusAwardedAt,
      allFamiliars,
      familiarsById,
      fetchDbFamiliars,
      addFamiliarToDb,
      deleteFamiliarFromDb,
      fetchUserById,
      fetchCharacterById,
      fetchUsersForAdmin,
      fetchLeaderboardUsers,
      addPointsToUser,
      addPointsToAllUsers,
      updateUser,
      updateUserAvatar,
      updateGameDate,
      updateGameSettings,
      processWeeklyBonus,
    }),
    [currentUser, gameSettings, allFamiliars, familiarsById, fetchUserById, fetchCharacterById, fetchUsersForAdmin, fetchLeaderboardUsers, addPointsToUser, addPointsToAllUsers, updateUser, updateUserAvatar, updateGameDate, updateGameSettings, processWeeklyBonus, fetchDbFamiliars, addFamiliarToDb, deleteFamiliarFromDb]
  );

  return (
    <AuthContext.Provider value={authValue}>
        <UserContext.Provider value={userContextValue}>
            {children}
        </UserContext.Provider>
    </AuthContext.Provider>
  );
}


