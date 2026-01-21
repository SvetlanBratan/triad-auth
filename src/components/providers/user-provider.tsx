
"use client";

import React, { createContext, useState, useMemo, useCallback, useEffect, useContext } from 'react';
import type { User, Character, PointLog, UserStatus, UserRole, RewardRequest, RewardRequestStatus, FamiliarCard, Moodlet, Inventory, GameSettings, Relationship, RelationshipAction, RelationshipActionType, BankAccount, WealthLevel, ExchangeRequest, Currency, FamiliarTradeRequest, FamiliarTradeRequestStatus, FamiliarRank, BankTransaction, Shop, ShopItem, InventoryItem, AdminGiveItemForm, InventoryCategory, CitizenshipStatus, TaxpayerStatus, PerformRelationshipActionParams, MailMessage, Cooldowns, PopularityLog, CharacterPopularityUpdate, OwnedFamiliarCard, AlchemyRecipe, Potion, AlchemyIngredient, PlayerPing, OngoingHunt, PlayerStatus, PlayPlatform, SocialLink, HuntingLocation } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut, reauthenticateWithCredential, EmailAuthProvider, updatePassword, updateEmail } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, writeBatch, collection, getDocs, query, where, orderBy, deleteDoc, runTransaction, addDoc, collectionGroup, limit, startAfter, increment, FieldValue, arrayUnion, arrayRemove, deleteField } from "firebase/firestore";
import { ALL_STATIC_FAMILIARS, EVENT_FAMILIARS, MOODLETS_DATA, DEFAULT_GAME_SETTINGS, WEALTH_LEVELS, ALL_SHOPS, SHOPS_BY_ID, POPULARITY_EVENTS, ALL_ACHIEVEMENTS, INVENTORY_CATEGORIES } from '@/lib/data';
import { differenceInDays, differenceInMonths, isPast } from 'date-fns';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ALL_ITEMS_FOR_ALCHEMY } from '@/lib/alchemy-data';
import { useToast } from '@/hooks/use-toast';

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

export interface UserContextType {
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
  brewPotion: (userId: string, characterId: string, recipeId: string) => Promise<{ createdItem: InventoryItem; recipeName: string; }>;
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
  allFamiliars: FamiliarCard[];
  familiarsById: Record<string, FamiliarCard>;
  startHunt: (characterId: string, familiarId: string, locationId: string) => Promise<void>;
  startMultipleHunts: (characterId: string, familiarIds: string[], locationId: string) => Promise<void>;
  claimHuntReward: (characterId: string, huntId: string) => Promise<InventoryItem[]>;
  claimAllHuntRewards: (characterId: string) => Promise<InventoryItem[]>;
  recallHunt: (characterId: string, huntId: string) => Promise<void>;
  claimRewardsForOtherPlayer: (ownerUserId: string, characterId: string) => Promise<void>;
  changeUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  changeUserEmail: (currentPassword: string, newEmail: string) => Promise<void>;
  mergeUserData: (sourceUserId: string, targetUserId: string) => Promise<void>;
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
const CUSTOM_STATUS_REWARD_ID = 'r-custom-status';
const VIP_ACHIEVEMENT_ID = 'ach-vip';
const QUESTIONNAIRE_ACHIEVEMENT_ID = 'ach-questionnaire';
const FIRST_HUNT_ACHIEVEMENT_ID = 'ach-hunting';
const FAVORITE_PLAYER_ACHIEVEMENT_ID = 'ach-favorites';


const RELATIONSHIP_POINTS_CONFIG: Record<RelationshipActionType, number> = {
    подарок: 25,
    письмо: 10,
};

const drawFamiliarCard = (allCardPool: FamiliarCard[], hasBlessing: boolean, unavailableMythicIds: Set<string>, gachaChances: GameSettings['gachaChances']): FamiliarCard => {
    let rand = Math.random() * 100;
    const chances = hasBlessing ? gachaChances.blessed : gachaChances.normal;
    const availableCards = allCardPool.filter(c => c.rank !== 'ивентовый');

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
    const { toast } = useToast();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [allFamiliars, setAllFamiliars] = useState<FamiliarCard[]>([...ALL_STATIC_FAMILIARS, ...EVENT_FAMILIARS]);
    const [familiarsById, setFamiliarsById] = useState<Record<string, FamiliarCard>>({});
  
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

    const processUserDoc = useCallback((userDoc: User): User => {
        const userData = { ...userDoc };
        userData.characters = userData.characters?.map(char => ({
            ...initialFormData,
            ...char,
            inventory: { ...defaultInventory, ...(char.inventory || {}) },
            familiarCards: char.familiarCards || [],
            ongoingHunts: char.ongoingHunts || [],
            crimeLevel: char.crimeLevel ?? 5,
            bankAccount: typeof char.bankAccount !== 'object' || char.bankAccount === null
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
            relationships: (Array.isArray(char.relationships) ? char.relationships : []).map(r => ({...r, id: r.id || `rel-${Math.random()}`})),
            moodlets: char.moodlets || [],
            popularity: char.popularity ?? 0,
            popularityHistory: char.popularityHistory || [],
            galleryImages: char.galleryImages || [],
        })) || [];
        userData.achievementIds = userData.achievementIds || [];
        userData.extraCharacterSlots = userData.extraCharacterSlots || 0;
        userData.pointHistory = userData.pointHistory || [];
        userData.mail = userData.mail || [];
        userData.playerPings = userData.playerPings || [];
        userData.playerStatus = userData.playerStatus || 'Не играю';
        userData.socials = userData.socials || [];
        userData.favoritePlayerIds = Array.isArray(userData.favoritePlayerIds) ? userData.favoritePlayerIds : [];
        userData.lastLogin = userData.lastLogin || new Date().toISOString();
        userData.statusEmoji = userData.statusEmoji || '';
        userData.statusText = userData.statusText || '';
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

    const fetchCharacterById = useCallback(async (characterId: string): Promise<{ character: Character; owner: User } | null> => {
      try {
          const usersCollection = collection(db, "users");
          const usersSnapshot = await getDocs(usersCollection);

          for (const userDoc of usersSnapshot.docs) {
              const user = await fetchUserById(userDoc.id); 
              if (user && user.characters) {
                  const character = user.characters.find(c => c.id === characterId);
                  if (character) {
                      return { character, owner: user };
                  }
              }
          }
          return null; 
      } catch (error) {
          console.error("Error fetching character by ID:", error);
          return null;
      }
    }, [fetchUserById]);

    const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, sanitizeObjectForFirestore(updates));
        
        if (currentUser?.id === userId) {
            setCurrentUser(prev => prev ? processUserDoc({ ...prev, ...updates }) : null);
        }
    }, [currentUser?.id, processUserDoc]);

    const updateUserAvatar = useCallback(async (userId: string, avatarUrl: string) => {
      await updateUser(userId, { avatar: avatarUrl });
    }, [updateUser]);

    const fetchUsersForAdmin = useCallback(async (): Promise<User[]> => {
        try {
            const usersCollection = collection(db, "users");
            const userSnapshot = await getDocs(query(usersCollection));
            return Promise.all(userSnapshot.docs.map(doc => processUserDoc(doc.data() as User)));
        } catch (error) {
            console.error("Error fetching users for admin.", error);
            throw error;
        }
    }, [processUserDoc]);

    const fetchLeaderboardUsers = useCallback(async (): Promise<User[]> => {
        const usersCollection = collection(db, "users");
        const userSnapshot = await getDocs(query(usersCollection, orderBy("points", "desc")));
        const users = await Promise.all(userSnapshot.docs.map(doc => processUserDoc(doc.data() as User)));
        return users.filter((user): user is User => user !== null);
    }, [processUserDoc]);

    const grantAchievementToUser = useCallback(async (userId: string, achievementId: string) => {
        const user = await fetchUserById(userId);
        if (!user) return;

        const achievementIds = user.achievementIds || [];
        if (!achievementIds.includes(achievementId)) {
            const updatedAchievementIds = [...achievementIds, achievementId];
            await updateUser(userId, { achievementIds: updatedAchievementIds });
            
            const allUsers = await fetchLeaderboardUsers(); 
            const top3Users = allUsers.slice(0, 3);
            
            for (const topUser of top3Users) {
              if (topUser.id === userId && !topUser.achievementIds?.includes(FORBES_LIST_ACHIEVEMENT_ID)) {
                 await grantAchievementToUser(topUser.id, FORBES_LIST_ACHIEVEMENT_ID);
              }
            }
        }
    }, [fetchUserById, updateUser, fetchLeaderboardUsers]);

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
        
        const finalUser = { ...user, points: newPoints, pointHistory: newHistory };
        if(currentUser?.id === userId) {
          setCurrentUser(finalUser);
        }
        return finalUser;
    }, [fetchUserById, currentUser?.id]);
    
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
            return { awardedCount: 0 };
        }

        const allUsers = await fetchUsersForAdmin();
        let awardedCount = 0;

        for (const user of allUsers) {
            let needsUpdate = false;
            
            const lastLogin = user.lastLogin ? new Date(user.lastLogin) : new Date(0);
            if (differenceInMonths(now, lastLogin) >= 1 && user.status !== 'отпуск' && user.status !== 'неактивный') {
                 await updateDoc(doc(db, "users", user.id), { status: 'неактивный' });
            }

            if (user.status === 'активный') {
                await addPointsToUser(user.id, 800, 'Еженедельный бонус за активность');
                awardedCount++;
            }
        }

        await updateDoc(settingsRef, { lastWeeklyBonusAwardedAt: now.toISOString() });
        await fetchGameSettings();
        
        const allUsersWithLeaderboard = await fetchLeaderboardUsers(); 
        const top3Users = allUsersWithLeaderboard.slice(0, 3);
        
        for (const topUser of top3Users) {
          if (!topUser.achievementIds?.includes(FORBES_LIST_ACHIEVEMENT_ID)) {
            await grantAchievementToUser(topUser.id, FORBES_LIST_ACHIEVEMENT_ID);
          }
        }

        return { awardedCount };
    }, [fetchUsersForAdmin, fetchGameSettings, addPointsToUser, fetchLeaderboardUsers, grantAchievementToUser]);
    
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
    
    const createNewUser = useCallback(async (uid: string, nickname: string): Promise<User> => {
        const formattedNickname = nickname
            .split(' ')
            .filter(word => word.length > 0)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        
        const newUser: User = {
            id: uid,
            name: formattedNickname,
            email: `${nickname.toLowerCase().replace(/\s/g, '')}@pumpkin.com`,
            avatar: `https://placehold.co/100x100/A050A0/FFFFFF.png?text=${formattedNickname.charAt(0)}`,
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
            statusEmoji: '',
            statusText: '',
        };
        try {
          await setDoc(doc(db, "users", uid), newUser);
          
          return newUser;
        } catch(error) {
          console.error("Error creating user in Firestore:", error);
          throw error;
        }
    }, []);

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
    
    const signOutUser = useCallback(() => {
        signOut(auth);
    }, []);

    const authValue = useMemo(() => ({
        user: firebaseUser,
        loading,
        signOutUser,
    }), [firebaseUser, loading, signOutUser]);
    
    const addPointsToAllUsers = useCallback(async (amount: number, reason: string) => {
        const allUsers = await fetchUsersForAdmin();
        for (const user of allUsers) {
            await addPointsToUser(user.id, amount, reason);
        }
    }, [fetchUsersForAdmin, addPointsToUser]);
    
    const updateGameDate = useCallback(async (newDateString: string) => {
        const settingsRef = doc(db, 'game_settings', 'main');
        await updateDoc(settingsRef, { gameDateString: newDateString });
        await fetchGameSettings();
    }, [fetchGameSettings]);
    
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
            const isNewCharacter = characterIndex === -1;

            const updatesToApply: Partial<User> = {};

            if (isNewCharacter) {
                updatedCharacters.push(sanitizedCharacterToUpdate);
                if (!(sourceUserData.achievementIds || []).includes(QUESTIONNAIRE_ACHIEVEMENT_ID)) {
                    updatesToApply.achievementIds = [...(sourceUserData.achievementIds || []), QUESTIONNAIRE_ACHIEVEMENT_ID];
                }
            } else {
                updatedCharacters[characterIndex] = sanitizedCharacterToUpdate;
            }
            updatesToApply.characters = updatedCharacters;

            transaction.update(userRef, updatesToApply);
        });

        const updatedUser = await fetchUserById(userId);
        if (!updatedUser) throw new Error("Failed to fetch user after update.");
        if (currentUser?.id === userId) {
            setCurrentUser(updatedUser);
        }
        return updatedUser;
    }, [currentUser?.id, fetchUserById, initialFormData]);

    const deleteCharacterFromUser = useCallback(async (userId: string, characterId: string) => {
        const user = await fetchUserById(userId);
        if (!user) return;

        const updatedCharacters = user.characters.filter(char => char.id !== characterId);
        await updateUser(userId, { characters: updatedCharacters });
    }, [fetchUserById, updateUser]);

    const updateUserStatus = useCallback(async (userId: string, status: UserStatus) => {
        await updateUser(userId, { status });
    }, [updateUser]);

    const updateUserRole = useCallback(async (userId: string, role: UserRole) => {
        await updateUser(userId, { role });
    }, [updateUser]);
  
    const createRewardRequest = useCallback(async (rewardRequestData: Omit<RewardRequest, 'id' | 'status' | 'createdAt'>) => {
        const user = await fetchUserById(rewardRequestData.userId);
        if (!user) throw new Error("User not found for reward request");

        const batch = writeBatch(db);
        const requestId = `req-${Date.now()}`;

        const newRequest: RewardRequest = {
            ...rewardRequestData,
            id: requestId,
            status: 'в ожидании',
            createdAt: new Date().toISOString(),
        };

        const requestRef = doc(db, "users", user.id, "reward_requests", requestId);
        batch.set(requestRef, newRequest);

        const newPointLog: PointLog = {
          id: `h-${Date.now()}-req`,
          date: new Date().toISOString(),
          amount: -rewardRequestData.rewardCost,
          reason: `Запрос награды: ${rewardRequestData.rewardTitle}`,
          characterId: rewardRequestData.characterId ?? undefined,
        };
        const updatedPoints = user.points - rewardRequestData.rewardCost;
        const updatedHistory = [newPointLog, ...user.pointHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const userRef = doc(db, "users", user.id);
        batch.update(userRef, { points: updatedPoints, pointHistory: updatedHistory });

        await batch.commit();

        const updatedUser = { ...user, points: updatedPoints, pointHistory: updatedHistory };

        if (currentUser?.id === user.id) {
            setCurrentUser(updatedUser);
        }
        
        const hasGenerousAchievement = (updatedUser.achievementIds || []).includes(GENEROUS_ACHIEVEMENT_ID);
        if (!hasGenerousAchievement) {
            const requestsCollectionRef = collection(db, `users/${user.id}/reward_requests`);
            const allRequestsSnapshot = await getDocs(requestsCollectionRef);

            let totalSpent = 0;
            allRequestsSnapshot.forEach((doc) => {
                const request = doc.data() as RewardRequest;
                if (request.status === 'одобрено' || request.id === newRequest.id) {
                    totalSpent += request.rewardCost;
                }
            });

            if (totalSpent >= GENEROUS_THRESHOLD) {
                await grantAchievementToUser(user.id, GENEROUS_ACHIEVEMENT_ID);
            }
        }

    }, [fetchUserById, currentUser?.id, grantAchievementToUser]);
  
    const updateRewardRequestStatus = useCallback(async (request: RewardRequest, newStatus: RewardRequestStatus): Promise<RewardRequest | null> => {
        await runTransaction(db, async (transaction) => {
            const requestRef = doc(db, "users", request.userId, "reward_requests", request.id);
            const requestDoc = await transaction.get(requestRef);
            if (!requestDoc.exists()) throw new Error("Request not found");

            const userRef = doc(db, "users", request.userId);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw new Error("User for the request not found");
            let user = userDoc.data() as User;
            
            transaction.update(requestRef, { status: newStatus });
            let updatesForUser: Partial<User> = {};

            if (newStatus === 'одобрено') {
                 if (request.rewardId === CUSTOM_STATUS_REWARD_ID) {
                    updatesForUser.statusEmoji = request.statusEmoji;
                    updatesForUser.statusText = request.statusText;
                    const currentAchievements = user.achievementIds || [];
                    if (!currentAchievements.includes(VIP_ACHIEVEMENT_ID)) {
                        updatesForUser.achievementIds = [...currentAchievements, VIP_ACHIEVEMENT_ID];
                    }
                } else {
                    let characterToUpdateIndex = -1;
                    if (request.characterId) {
                        characterToUpdateIndex = user.characters.findIndex(c => c.id === request.characterId);
                    }
                    
                    const achievementMap: Record<string, string> = {
                        'r-race-1': 'ach-unique-character', 'r-race-2': 'ach-unique-character', 'r-race-3': 'ach-unique-character', 'r-race-4': 'ach-unique-character',
                        'r-extra-char': 'ach-multi-hand', 'r-wild-pet': 'ach-tamer', 'r-crime-connections': 'ach-mafiosi', 'r-leviathan': 'ach-submariner',
                        'r-ship': 'ach-seaman', 'r-airship': 'ach-sky-master', 'r-archmage': 'ach-big-mage', 'r-court-position': 'ach-important-person',
                        'r-baron': 'ach-baron', 'r-land-titled': 'ach-sir-lady', 'r-extra-element': 'ach-warlock', 'r-extra-doctrine': 'ach-wizard',
                        'r-guild': 'ach-guildmaster', 'r-hybrid': 'ach-hybrid', 'r-swap-element': 'ach-exchange-master', 'r-forbidden-magic': 'ach-dark-lord',
                        'r-body-parts': 'ach-chimera-mancer', 'r-pumpkin-wife': PUMPKIN_SPOUSE_ACHIEVEMENT_ID, 'r-pumpkin-husband': PUMPKIN_HUSBAND_ACHIEVEMENT_ID,
                        'r-blessing': GODS_FAVORITE_ACHIEVEMENT_ID,
                        [AI_ART_REWARD_ID]: ERA_FACE_ACHIEVEMENT_ID,
                    };

                    const achievementIdToGrant = achievementMap[request.rewardId];
                    if (achievementIdToGrant) {
                        const currentAchievements = user.achievementIds || [];
                        if (!currentAchievements.includes(achievementIdToGrant)) {
                            updatesForUser.achievementIds = [...currentAchievements, achievementIdToGrant];
                        }
                    }

                    if(request.rewardId === EXTRA_CHARACTER_REWARD_ID) {
                        updatesForUser.extraCharacterSlots = (user.extraCharacterSlots || 0) + 1;
                    }
                    
                    if (characterToUpdateIndex !== -1) {
                        const updatedCharacters = [...user.characters];
                        let characterToUpdate = { ...updatedCharacters[characterToUpdateIndex] };
                        let familiarCards = characterToUpdate.familiarCards || [];

                        if (request.rewardId === PUMPKIN_WIFE_REWARD_ID) {
                             familiarCards = [...familiarCards, { id: PUMPKIN_WIFE_CARD_ID }];
                        } else if (request.rewardId === PUMPKIN_HUSBAND_REWARD_ID) {
                           familiarCards = [...familiarCards, { id: PUMPKIN_HUSBAND_CARD_ID }];
                        } else if (request.rewardId === 'r-blessing') {
                            const expiryDate = new Date();
                            expiryDate.setDate(expiryDate.getDate() + 5);
                            characterToUpdate.blessingExpires = expiryDate.toISOString();
                        } else if (request.rewardId === 'r-leviathan') {
                            characterToUpdate.hasLeviathanFriendship = true;
                        } else if (request.rewardId === 'r-crime-connections') {
                            characterToUpdate.hasCrimeConnections = true;
                        }
                        
                        characterToUpdate.familiarCards = familiarCards;
                        updatedCharacters[characterToUpdateIndex] = characterToUpdate;
                        updatesForUser.characters = updatedCharacters;
                    }
                }
            } else if (newStatus === 'отклонено') {
                  const reason = `Возврат за отклоненный запрос: ${request.rewardTitle}`;
                  const newPointLog: PointLog = {
                      id: `h-${Date.now()}-refund`, date: new Date().toISOString(), amount: request.rewardCost, reason,
                  };
                  updatesForUser.points = user.points + request.rewardCost;
                  updatesForUser.pointHistory = [newPointLog, ...user.pointHistory];
            }

            if (Object.keys(updatesForUser).length > 0) {
                transaction.update(userRef, updatesForUser);
            }
        });

        const updatedUser = await fetchUserById(request.userId);
        if (updatedUser && currentUser?.id === request.userId) {
            setCurrentUser(updatedUser);
        }
        return {...request, status: newStatus};
    }, [fetchUserById, currentUser?.id]);
    
    const fetchAllRewardRequests = useCallback(async (): Promise<RewardRequest[]> => {
        const requests: RewardRequest[] = [];
        try {
          const q = query(collectionGroup(db, 'reward_requests'));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            requests.push(doc.data() as RewardRequest);
          });
          return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (error) {
          console.error("Error fetching all reward requests:", error);
          throw error;
        }
    }, []);

    const fetchRewardRequestsForUser = useCallback(async (userId: string): Promise<RewardRequest[]> => {
        const requests: RewardRequest[] = [];
        try {
            const requestsRef = collection(db, 'users', userId, 'reward_requests');
            const q = query(requestsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                requests.push(doc.data() as RewardRequest);
            });
            return requests;
        } catch (error) {
          console.error("Error fetching reward requests for user:", error);
          throw error;
        }
    }, []);

    const fetchAvailableMythicCardsCount = useCallback(async (): Promise<number> => {
        const allUsers = await fetchUsersForAdmin();
        const allMythicCards = allFamiliars.filter(c => c.rank === 'мифический');
        const claimedMythicIds = new Set<string>();

        for (const user of allUsers) {
            for (const character of user.characters) {
                for (const card of (character.familiarCards || [])) {
                    const cardDetails = familiarsById[card.id];
                    if (cardDetails && cardDetails.rank === 'мифический') {
                        claimedMythicIds.add(card.id);
                    }
                }
            }
        }
        return allMythicCards.length - claimedMythicIds.size;
    }, [fetchUsersForAdmin, allFamiliars, familiarsById]);

    const pullGachaForCharacter = useCallback(async (userId: string, characterId: string): Promise<{updatedUser: User, newCard: FamiliarCard, isDuplicate: boolean}> => {
        let finalUser: User | null = null;
        let newCard: FamiliarCard;
        let isDuplicate = false;
        
        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", userId);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw new Error("Пользователь не найден.");
            const user = userDoc.data() as User;
        
            const characterIndex = user.characters.findIndex(c => c.id === characterId);
            if (characterIndex === -1) throw new Error("Персонаж не найден.");
            const character = user.characters[characterIndex];

            const hasCards = character.familiarCards && character.familiarCards.length > 0;
            const hasHistory = user.pointHistory.some(log => log.characterId === characterId && log.reason.includes('Рулетка'));
            const isFirstPullForChar = !hasCards && !hasHistory;
            
            const cost = isFirstPullForChar ? 0 : ROULETTE_COST;
            if (user.points < cost) throw new Error("Недостаточно очков.");
            let finalPointChange = -cost;

            const allUsers = await fetchUsersForAdmin();
            const claimedMythicIds = new Set<string>();
            for (const u of allUsers) {
                (u.characters || []).forEach(c => {
                    (c.familiarCards || []).forEach(cardRef => {
                        const cardDetails = familiarsById[cardRef.id];
                        if (cardDetails && cardDetails.rank === 'мифический') {
                            claimedMythicIds.add(cardRef.id);
                        }
                    });
                });
            }
            
            const hasBlessing = character.blessingExpires ? new Date(character.blessingExpires) > new Date() : false;
            newCard = drawFamiliarCard(allFamiliars.filter(c => c.rank !== 'ивентовый'), hasBlessing, claimedMythicIds, gameSettings.gachaChances);
            
            const ownedCardIds = new Set((character.familiarCards || []).map(c => c.id));
            isDuplicate = ownedCardIds.has(newCard.id);
            
            const updatedUser = { ...user };
            let reason = `Рулетка: получена карта ${newCard.name} (${newCard.rank})`;
            
            if (isDuplicate) {
                finalPointChange += DUPLICATE_REFUND;
                reason = `Рулетка: дубликат ${newCard.name}, возврат ${DUPLICATE_REFUND} баллов`;
            } else {
                const updatedCharacter = { ...character };
                const familiarCards = [...(updatedCharacter.familiarCards || []), { id: newCard.id }];
                updatedCharacter.familiarCards = familiarCards;
                
                updatedUser.characters[characterIndex] = updatedCharacter;
                
                const hasMythicAchievement = (user.achievementIds || []).includes(MYTHIC_PULL_ACHIEVEMENT_ID);
                if (newCard.rank === 'мифический' && !hasMythicAchievement) {
                    updatedUser.achievementIds = [...(updatedUser.achievementIds || []), MYTHIC_PULL_ACHIEVEMENT_ID];
                }
            }
            
            const hasFirstPullAchievement = (user.achievementIds || []).includes(FIRST_PULL_ACHIEVEMENT_ID);
             if (!user.pointHistory.some(log => log.reason.includes('Рулетка')) && !hasFirstPullAchievement) {
                updatedUser.achievementIds = [...(updatedUser.achievementIds || []), FIRST_PULL_ACHIEVEMENT_ID];
            }

            updatedUser.points += finalPointChange;

            const newPointLog: PointLog = {
                id: `h-${Date.now()}-gacha`,
                date: new Date().toISOString(),
                amount: finalPointChange,
                reason: reason,
                characterId: character.id,
            };
            updatedUser.pointHistory.unshift(newPointLog);
            
            finalUser = updatedUser;
            transaction.set(userRef, updatedUser);
        });

        if (!finalUser || !newCard!) {
          throw new Error("Транзакция не удалась, попробуйте еще раз.");
        }

        return { updatedUser: finalUser, newCard: newCard!, isDuplicate };
    }, [fetchUsersForAdmin, allFamiliars, familiarsById, gameSettings.gachaChances]);
  
    const giveAnyFamiliarToCharacter = useCallback(async (userId: string, characterId: string, familiarId: string) => {
        const user = await fetchUserById(userId);
        if (!user) return;

        const characterIndex = user.characters.findIndex(c => c.id === characterId);
        if (characterIndex === -1) return;

        const familiar = familiarsById[familiarId];
        if (!familiar) return;

        const character = { ...user.characters[characterIndex] };
        const familiarCards = [...(character.familiarCards || []), { id: familiarId }];
        character.familiarCards = familiarCards;

        const updatedCharacters = [...user.characters];
        updatedCharacters[characterIndex] = character;
        
        const newPointLog: PointLog = {
            id: `h-${Date.now()}-admin-give`,
            date: new Date().toISOString(),
            amount: 0,
            reason: `Администратор выдал фамильяра: "${familiar.name}"`,
            characterId: character.id,
        };
        const newHistory = [newPointLog, ...user.pointHistory];

        await updateUser(userId, { characters: updatedCharacters, pointHistory: newHistory });
    }, [fetchUserById, updateUser, familiarsById]);
  
    const clearPointHistoryForUser = useCallback(async (userId: string) => {
        await updateUser(userId, { pointHistory: [] });
    }, [updateUser]);

    const clearAllPointHistories = useCallback(async () => {
        const allUsers = await fetchUsersForAdmin();
        const batch = writeBatch(db);
        for (const user of allUsers) {
            const userRef = doc(db, "users", user.id);
            batch.update(userRef, { pointHistory: [] });
        }
        await batch.commit();
        if (currentUser) {
            const updatedCurrentUser = await fetchUserById(currentUser.id);
            if (updatedCurrentUser) {
                setCurrentUser(updatedCurrentUser);
            }
        }
    }, [fetchUsersForAdmin, currentUser, fetchUserById]);

    const addMoodletToCharacter = useCallback(async (userId: string, characterId: string, moodletId: string, durationInDays: number, source?: string) => {
        const user = await fetchUserById(userId);
        if (!user) return;

        const characterIndex = user.characters.findIndex(c => c.id === characterId);
        if (characterIndex === -1) return;

        const moodletData = MOODLETS_DATA[moodletId as keyof typeof MOODLETS_DATA];
        if (!moodletData) return;

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + durationInDays);

        const newMoodlet: Moodlet = {
            id: moodletId,
            ...moodletData,
            expiresAt: expiryDate.toISOString(),
            ...(source && { source }),
        };

        const character = { ...user.characters[characterIndex] };
        const existingMoodlets = (character.moodlets || []).filter(m => m.id !== moodletId);
        character.moodlets = [...existingMoodlets, newMoodlet];

        const updatedCharacters = [...user.characters];
        updatedCharacters[characterIndex] = character;
        
        await updateUser(userId, { characters: updatedCharacters });
    }, [fetchUserById, updateUser]);

    const removeMoodletFromCharacter = useCallback(async (userId: string, characterId: string, moodletId: string) => {
          const user = await fetchUserById(userId);
          if (!user) return;

          const characterIndex = user.characters.findIndex(c => c.id === characterId);
          if (characterIndex === -1) return;

          const character = { ...user.characters[characterIndex] };
          character.moodlets = (character.moodlets || []).filter(m => m.id !== moodletId);

          const updatedCharacters = [...user.characters];
          updatedCharacters[characterIndex] = character;
          
          await updateUser(userId, { characters: updatedCharacters });
    }, [fetchUserById, updateUser]);

    const clearRewardRequestsHistory = useCallback(async () => {
        const allUsers = await fetchUsersForAdmin();
        const batch = writeBatch(db);

        for (const user of allUsers) {
          const requestsQuery = query(collection(db, `users/${user.id}/reward_requests`), where('status', '!=', 'в ожидании'));
          const requestSnapshot = await getDocs(requestsQuery);
          requestSnapshot.forEach(doc => {
            batch.delete(doc.ref);
          });
        }

        await batch.commit();
    }, [fetchUsersForAdmin]);
  
    const removeFamiliarFromCharacter = useCallback(async (userId: string, characterId: string, cardId: string) => {
        const user = await fetchUserById(userId);
        if (!user) throw new Error("User not found");

        const characterIndex = user.characters.findIndex(c => c.id === characterId);
        if (characterIndex === -1) throw new Error("Character not found");

        const character = { ...user.characters[characterIndex] };
        const ownedCards = character.familiarCards || [];

        const cardIndexToRemove = ownedCards.findIndex(card => card.id === cardId);
        if (cardIndexToRemove === -1) throw new Error("Card not found on character");

        const updatedCards = [...ownedCards];
        updatedCards.splice(cardIndexToRemove, 1);
        character.familiarCards = updatedCards;

        const updatedCharacters = [...user.characters];
        updatedCharacters[characterIndex] = character;

        await updateUser(userId, { characters: updatedCharacters });
    }, [fetchUserById, updateUser]);

    const checkExtraCharacterSlots = useCallback(async (userId: string): Promise<number> => {
        const requestsRef = collection(db, 'users', userId, 'reward_requests');
        const q = query(requestsRef, where('rewardId', '==', EXTRA_CHARACTER_REWARD_ID), where('status', '==', 'одобрено'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
    }, []);

    const performRelationshipAction = useCallback(async (params: PerformRelationshipActionParams) => {
        const { sourceUserId, sourceCharacterId, targetCharacterId, actionType, description, itemId, itemCategory, quantity, content } = params;

        await runTransaction(db, async (transaction) => {
            const sourceUserRef = doc(db, "users", sourceUserId);
            const sourceUserDoc = await transaction.get(sourceUserRef);
            if (!sourceUserDoc.exists()) throw new Error("Исходный пользователь не найден.");
            const sourceUserData = sourceUserDoc.data() as User;
            
            let targetUserDoc: any = null, targetUserData: User | null = null, targetUserId: string | null = null;
            const allUsersSnapshot = await getDocs(collection(db, "users"));
            allUsersSnapshot.forEach(doc => {
                const user = doc.data() as User;
                if (user.characters?.some(c => c.id === targetCharacterId)) {
                    targetUserDoc = doc;
                    targetUserData = user;
                    targetUserId = doc.id;
                }
            });
            if (!targetUserDoc || !targetUserData || !targetUserId) throw new Error("Владелец целевого персонажа не найден.");
            
            const targetUserFromTx = await transaction.get(targetUserDoc.ref);
            if (!targetUserFromTx.exists()) throw new Error("Целевой пользователь не найден в транзакции.");
            targetUserData = targetUserFromTx.data() as User;

            const sourceCharIndex = sourceUserData.characters.findIndex(c => c.id === sourceCharacterId);
            if (sourceCharIndex === -1) throw new Error("Исходный персонаж не найден.");
            const sourceChar = sourceUserData.characters[sourceCharIndex];

            const targetCharIndex = targetUserData.characters.findIndex(c => c.id === targetCharacterId);
            if (targetCharIndex === -1) throw new Error("Целевой персонаж не найден.");
            const targetChar = targetUserData.characters[targetCharIndex];
            
            if (actionType === 'подарок') {
                if (!itemId || !itemCategory || !quantity || quantity <= 0) throw new Error("Для подарка требуется указать предмет и количество.");
                
                const sourceInventory = sourceChar.inventory || initialFormData.inventory;
                const categoryItems = (sourceInventory[itemCategory] as InventoryItem[] | undefined) || [];
                const itemIndex = categoryItems.findIndex(i => i.id === itemId);

                if (itemIndex === -1 || categoryItems[itemIndex].quantity < quantity) {
                    throw new Error("Предмет для подарка не найден или его недостаточно в инвентаре.");
                }
                const itemToGift = { ...categoryItems[itemIndex] };

                if (itemToGift.quantity > quantity) {
                    categoryItems[itemIndex].quantity -= quantity;
                } else {
                    categoryItems.splice(itemIndex, 1);
                }
                sourceInventory[itemCategory] = categoryItems;

                const targetInventory = targetChar.inventory || initialFormData.inventory;
                const targetCategoryItems = (targetInventory[itemCategory] as InventoryItem[] | undefined) || [];
                const existingTargetItemIndex = targetCategoryItems.findIndex(invItem => invItem.name === itemToGift.name);

                if (existingTargetItemIndex > -1) {
                     targetCategoryItems[existingTargetItemIndex].quantity += quantity;
                } else {
                    targetCategoryItems.push({ ...itemToGift, id: `inv-item-${Date.now()}`, quantity });
                }
                targetInventory[itemCategory] = targetCategoryItems;
                
                sourceChar.inventory = sourceInventory;
                targetChar.inventory = targetInventory;

                const giftMail: MailMessage = {
                    id: `mail-gift-${Date.now()}`,
                    senderUserId: sourceUserId,
                    senderCharacterName: sourceChar.name,
                    senderCharacterId: sourceChar.id,
                    recipientUserId: targetUserId,
                    recipientCharacterId: targetCharacterId,
                    recipientCharacterName: targetChar.name,
                    subject: `Вам пришел подарок!`,
                    content: `${sourceChar.name} отправил(а) вам подарок: "${itemToGift.name}" (x${quantity}).`,
                    sentAt: new Date().toISOString(),
                    isRead: false,
                    type: 'personal' as const,
                };
                targetUserData.mail = [...(targetUserData.mail || []), giftMail];

            } else if (actionType === 'письмо') {
                 if (!content) throw new Error("Содержание письма не может быть пустым.");

                const newMail: MailMessage = {
                    id: `mail-${Date.now()}`,
                    senderUserId: sourceUserId,
                    senderCharacterName: sourceChar.name,
                    senderCharacterId: sourceChar.id,
                    recipientUserId: targetUserId,
                    recipientCharacterId: targetCharacterId,
                    recipientCharacterName: targetChar.name,
                    subject: `Письмо от ${sourceChar.name}`,
                    content: content,
                    sentAt: new Date().toISOString(),
                    isRead: false,
                    type: 'personal' as const,
                };
                targetUserData.mail = [...(targetUserData.mail || []), newMail];
            }

            const updateRelationship = (character: Character, otherCharId: string, myCharId: string, points: number, action: RelationshipAction) => {
                const relIndex = (character.relationships || []).findIndex(r => r.targetCharacterId === otherCharId);
                if (relIndex === -1) return; 

                const relationship = character.relationships[relIndex];
                relationship.points += points;
                const now = new Date().toISOString();
                
                if (!relationship.cooldowns) relationship.cooldowns = {};
                if (!relationship.cooldowns[myCharId]) relationship.cooldowns[myCharId] = {};
                
                if (action.type === 'подарок') relationship.cooldowns[myCharId].lastGiftSentAt = now;
                if (action.type === 'письмо') relationship.cooldowns[myCharId].lastLetterSentAt = now;
                
                relationship.history = [...(relationship.history || []), action];
            };

            const newAction: RelationshipAction = {
                id: `act-${Date.now()}`, type: actionType, date: new Date().toISOString(), description, status: 'confirmed',
            };
            const pointsToAdd = RELATIONSHIP_POINTS_CONFIG[actionType];

            updateRelationship(sourceChar, targetCharacterId, sourceCharacterId, pointsToAdd, newAction);
            updateRelationship(targetChar, sourceCharacterId, sourceCharacterId, pointsToAdd, newAction);
            
            const sanitizedSourceUser = sanitizeObjectForFirestore(sourceUserData);
            const sanitizedTargetUser = sanitizeObjectForFirestore(targetUserData);

            transaction.update(sourceUserRef, { characters: sanitizedSourceUser.characters });
            transaction.update(targetUserDoc.ref, { characters: sanitizedTargetUser.characters, mail: sanitizedTargetUser.mail });
        });

        if (currentUser && currentUser.id === sourceUserId) {
            const updatedUser = await fetchUserById(sourceUserId);
            if(updatedUser) setCurrentUser(updatedUser);
        }
    }, [currentUser, fetchUserById, initialFormData]);

    const recoverFamiliarsFromHistory = useCallback(async (userId: string, characterId: string, oldCharacterName?: string): Promise<number> => {
        const user = await fetchUserById(userId);
        if (!user) throw new Error("User not found for recovery");

        const character = user.characters.find(c => c.id === characterId);
        if (!character) throw new Error("Character not found for recovery");

        const namesToSearch = new Set<string>([character.name]);
        if (oldCharacterName) {
            namesToSearch.add(oldCharacterName);
        }

        const historicalCardWins = new Set<string>();
        const gachaLogRegex = /Рулетка: получена карта (.+?) \((.+?)\)/;

        user.pointHistory.forEach(log => {
            if (log.characterId && character.id === log.characterId) {
                const match = log.reason.match(gachaLogRegex);
                if (match) {
                    const cardName = match[1].trim();
                    const foundCard = allFamiliars.find(c => c.name === cardName);
                    if (foundCard) {
                        historicalCardWins.add(foundCard.id);
                    }
                }
            }
        });
        
        const currentOwnedCardIds = new Set((character.familiarCards || []).map(c => c.id));
        const cardsToAdd: { id: string }[] = [];

        historicalCardWins.forEach(cardId => {
            if (!currentOwnedCardIds.has(cardId)) {
                cardsToAdd.push({ id: cardId });
            }
        });

        if (cardsToAdd.length > 0) {
            const characterIndex = user.characters.findIndex(c => c.id === characterId);
            if (characterIndex !== -1) {
                const updatedCharacter = { ...character };
                updatedCharacter.familiarCards = [...(updatedCharacter.familiarCards || []), ...cardsToAdd];

                const updatedCharacters = [...user.characters];
                updatedCharacters[characterIndex] = updatedCharacter;
                
                await updateUser(userId, { characters: updatedCharacters });
            }
        }

        return cardsToAdd.length;
    }, [fetchUserById, updateUser, allFamiliars]);

    const recoverAllFamiliars = useCallback(async (): Promise<{ totalRecovered: number; usersAffected: number }> => {
        const allUsers = await fetchUsersForAdmin();
        let totalRecovered = 0;
        let usersAffected = 0;
        
        const batch = writeBatch(db);

        for (const user of allUsers) {
            let userHasChanges = false;
            const updatedCharacters = [...user.characters];

            for (let i = 0; i < updatedCharacters.length; i++) {
                const character = updatedCharacters[i];
                const gachaLogRegex = /Рулетка: получена карта (.+?) \((.+?)\)/;
                const historicalCardWins = new Set<string>();

                user.pointHistory.forEach(log => {
                    if (log.characterId && character.id === log.characterId) {
                        const match = log.reason.match(gachaLogRegex);
                        if (match) {
                            const cardName = match[1].trim();
                            const foundCard = allFamiliars.find(c => c.name === cardName);
                            if (foundCard) {
                                historicalCardWins.add(foundCard.id);
                            }
                        }
                    }
                });

                const currentOwnedCardIds = new Set((character.familiarCards || []).map(c => c.id));
                const cardsToAdd: OwnedFamiliarCard[] = [];
                historicalCardWins.forEach(cardId => {
                    if (!currentOwnedCardIds.has(cardId)) {
                        cardsToAdd.push({ id: cardId });
                    }
                });
                
                if (cardsToAdd.length > 0) {
                    updatedCharacters[i].familiarCards = [...(character.familiarCards || []), ...cardsToAdd];
                    totalRecovered += cardsToAdd.length;
                    userHasChanges = true;
                }
            }

            if (userHasChanges) {
                const userRef = doc(db, 'users', user.id);
                batch.update(userRef, { characters: updatedCharacters });
                usersAffected++;
            }
        }

        await batch.commit();
        
        if (currentUser) {
           const updatedUser = await fetchUserById(currentUser.id);
           if(updatedUser) setCurrentUser(updatedUser);
        }
        
        return { totalRecovered, usersAffected };
    }, [fetchUsersForAdmin, fetchUserById, currentUser, allFamiliars]);

    const updateCharacterWealthLevel = useCallback(async (userId: string, characterId: string, wealthLevel: WealthLevel) => {
        const user = await fetchUserById(userId);
        if (!user) return;

        const characterIndex = user.characters.findIndex(c => c.id === characterId);
        if (characterIndex === -1) return;

        const updatedCharacters = [...user.characters];
        updatedCharacters[characterIndex] = { ...updatedCharacters[characterIndex], wealthLevel };
        
        await updateUser(userId, { characters: updatedCharacters });
    }, [fetchUserById, updateUser]);

    const addBankPointsToCharacter = useCallback(async (userId: string, characterId: string, amount: Partial<Omit<BankAccount, 'history'>>, reason: string) => {
        const user = await fetchUserById(userId);
        if (!user) throw new Error("User not found");

        const characterIndex = user.characters.findIndex(c => c.id === characterId);
        if (characterIndex === -1) throw new Error("Character not found");

        const updatedCharacters = [...user.characters];
        const character = { ...updatedCharacters[characterIndex] };
        
        const currentBalance = character.bankAccount || { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] };
        
        currentBalance.platinum = (currentBalance.platinum || 0) + (amount.platinum || 0);
        currentBalance.gold = (currentBalance.gold || 0) + (amount.gold || 0);
        currentBalance.silver = (currentBalance.silver || 0) + (amount.silver || 0);
        currentBalance.copper = (currentBalance.copper || 0) + (amount.copper || 0);

        const newTransaction: BankTransaction = {
            id: `txn-${Date.now()}`,
            date: new Date().toISOString(),
            reason,
            amount,
        };
        currentBalance.history = [newTransaction, ...(currentBalance.history || [])];

        character.bankAccount = currentBalance;
        updatedCharacters[characterIndex] = character;
        
        await updateUser(userId, { characters: updatedCharacters });
    }, [fetchUserById, updateUser]);

    const transferCurrency = useCallback(async (sourceUserId: string, sourceCharacterId: string, targetCharacterId: string, amount: Partial<Omit<BankAccount, 'history'>>, reason: string) => {
        await runTransaction(db, async (transaction) => {
            const sourceUserRef = doc(db, "users", sourceUserId);
            const sourceUserDoc = await transaction.get(sourceUserRef);
            if (!sourceUserDoc.exists()) throw new Error("Исходный пользователь не найден.");
            const sourceUserData = sourceUserDoc.data() as User;

            let targetUserDoc: any = null, targetUserData: User | null = null, targetUserId: string | null = null;
            const allUsersSnapshot = await getDocs(collection(db, "users"));
            allUsersSnapshot.forEach(doc => {
                const user = doc.data() as User;
                if (user.characters?.some(c => c.id === targetCharacterId)) {
                    targetUserDoc = doc;
                    targetUserData = user;
                    targetUserId = doc.id;
                }
            });
            if (!targetUserDoc || !targetUserData || !targetUserId) throw new Error("Владелец целевого персонажа не найден.");

            const targetUserFromTx = await transaction.get(targetUserDoc.ref);
            if (!targetUserFromTx.exists()) throw new Error("Целевой пользователь не найден в транзакции.");
            targetUserData = targetUserFromTx.data() as User;

            const sourceCharIndex = sourceUserData.characters.findIndex(c => c.id === sourceCharacterId);
            if (sourceCharIndex === -1) throw new Error("Исходный персонаж не найден.");
            const sourceChar = sourceUserData.characters[sourceCharIndex];
            const sourceBalance = sourceChar.bankAccount || { platinum: 0, gold: 0, silver: 0, copper: 0 };
            if (
                sourceBalance.platinum < (amount.platinum || 0) ||
                sourceBalance.gold < (amount.gold || 0) ||
                sourceBalance.silver < (amount.silver || 0) ||
                sourceBalance.copper < (amount.copper || 0)
            ) {
                throw new Error("Недостаточно средств у отправителя.");
            }

            const targetCharIndex = targetUserData.characters.findIndex(c => c.id === targetCharacterId);
            if (targetCharIndex === -1) throw new Error("Целевой персонаж не найден.");
            const targetChar = targetUserData.characters[targetCharIndex];
            
            const now = new Date().toISOString();
            const reasonText = reason || 'Прямой перевод';

            sourceChar.bankAccount.platinum -= (amount.platinum || 0);
            sourceChar.bankAccount.gold -= (amount.gold || 0);
            sourceChar.bankAccount.silver -= (amount.silver || 0);
            sourceChar.bankAccount.copper -= (amount.copper || 0);
            const sourceTx: BankTransaction = { id: `txn-send-${Date.now()}`, date: now, reason: `Перевод для ${targetChar.name}: ${reasonText}`, amount: { platinum: -(amount.platinum || 0), gold: -(amount.gold || 0), silver: -(amount.silver || 0), copper: -(amount.copper || 0) } };
            sourceChar.bankAccount.history = [sourceTx, ...(sourceChar.bankAccount.history || [])];

            targetChar.bankAccount.platinum += (amount.platinum || 0);
            targetChar.bankAccount.gold += (amount.gold || 0);
            targetChar.bankAccount.silver += (amount.silver || 0);
            targetChar.bankAccount.copper += (amount.copper || 0);
            const targetTx: BankTransaction = { id: `txn-recv-${Date.now()}`, date: now, reason: `Перевод от ${sourceChar.name}: ${reasonText}`, amount: { platinum: (amount.platinum || 0), gold: (amount.gold || 0), silver: (amount.silver || 0), copper: (amount.copper || 0) } };
            targetChar.bankAccount.history = [targetTx, ...(targetChar.bankAccount.history || [])];

            const sanitizedSourceUser = sanitizeObjectForFirestore(sourceUserData);
            const sanitizedTargetUser = sanitizeObjectForFirestore(targetUserData);

            transaction.update(sourceUserRef, { characters: sanitizedSourceUser.characters });
            transaction.update(targetUserDoc.ref, { characters: sanitizedTargetUser.characters });
        });

        if (currentUser && currentUser.id === sourceUserId) {
            const updatedUser = await fetchUserById(sourceUserId);
            if(updatedUser) setCurrentUser(updatedUser);
        }
    }, [currentUser, fetchUserById]);


    const processMonthlySalary = useCallback(async () => {
        const allUsers = await fetchUsersForAdmin();
        const batch = writeBatch(db);

        for (const user of allUsers) {
            let hasChanges = false;
            const updatedCharacters = user.characters.map(character => {
                const wealthInfo = WEALTH_LEVELS.find(w => w.name === character.wealthLevel);
                if (!wealthInfo || !wealthInfo.salary) return character;

                const salary = wealthInfo.salary;
                
                let newBalance = { ...(character.bankAccount || { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] }) };
                newBalance.platinum = (newBalance.platinum || 0) + (salary.platinum || 0);
                newBalance.gold = (newBalance.gold || 0) + (salary.gold || 0);
                newBalance.silver = (newBalance.silver || 0) + (salary.silver || 0);
                newBalance.copper = (newBalance.copper || 0) + (salary.copper || 0);
                
                const newTransaction: BankTransaction = {
                    id: `txn-salary-${Date.now()}`,
                    date: new Date().toISOString(),
                    reason: 'Ежемесячная зарплата',
                    amount: salary,
                };
                newBalance.history = [newTransaction, ...(newBalance.history || [])];

                hasChanges = true;
                return { ...character, bankAccount: newBalance };
            });

            if (hasChanges) {
                const userRef = doc(db, "users", user.id);
                batch.update(userRef, { characters: updatedCharacters });
            }
        }
        await batch.commit();

    }, [fetchUsersForAdmin]);


  const createExchangeRequest = useCallback(async (creatorUserId: string, creatorCharacterId: string, fromCurrency: Currency, fromAmount: number, toCurrency: Currency, toAmount: number) => {
        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", creatorUserId);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw new Error("Пользователь не найден.");
            
            const userData = userDoc.data() as User;
            const charIndex = userData.characters.findIndex(c => c.id === creatorCharacterId);
            if (charIndex === -1) throw new Error("Персонаж не найден.");
            
            const character = userData.characters[charIndex];
            const bankAccount = character.bankAccount || { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] };
            if (bankAccount[fromCurrency] < fromAmount) {
                throw new Error("Недостаточно средств для создания запроса.");
            }
            
            bankAccount[fromCurrency] -= fromAmount;
            
            const newTransaction: BankTransaction = {
              id: `txn-exchange-create-${Date.now()}`,
              date: new Date().toISOString(),
              reason: 'Создание запроса на обмен',
              amount: { [fromCurrency]: -fromAmount }
            };
            bankAccount.history = [newTransaction, ...(bankAccount.history || [])];
            character.bankAccount = bankAccount;

            const newRequest: Omit<ExchangeRequest, 'id'> = {
                creatorUserId,
                creatorName: userData.name,
                creatorCharacterId,
                creatorCharacterName: character.name,
                fromCurrency,
                fromAmount,
                toCurrency,
                toAmount,
                status: 'open',
                createdAt: new Date().toISOString(),
            };

            const requestsCollection = collection(db, "exchange_requests");
            const newDocRef = doc(requestsCollection); 
            transaction.set(newDocRef, newRequest);
            transaction.update(userRef, { characters: userData.characters });
        });
        const updatedUser = await fetchUserById(creatorUserId);
        if (updatedUser) setCurrentUser(updatedUser);
    }, [fetchUserById, currentUser?.id]);

 const fetchOpenExchangeRequests = useCallback(async (): Promise<ExchangeRequest[]> => {
        const requestsCollection = collection(db, "exchange_requests");
        const q = query(requestsCollection, where('status', '==', 'open'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExchangeRequest));
    }, []);

  const acceptExchangeRequest = useCallback(async (acceptorUserId: string, acceptorCharacterId: string, request: ExchangeRequest) => {
        await runTransaction(db, async (transaction) => {
            const requestRef = doc(db, "exchange_requests", request.id);
            const requestDoc = await transaction.get(requestRef);
            if (!requestDoc.exists() || requestDoc.data().status !== 'open') {
                throw new Error("Запрос больше не действителен.");
            }
            
            const acceptorUserRef = doc(db, "users", acceptorUserId);
            const acceptorUserDoc = await transaction.get(acceptorUserRef);
            if (!acceptorUserDoc.exists()) throw new Error("Принимающий пользователь не найден.");
            
            const acceptorUserData = acceptorUserDoc.data() as User;
            const acceptorCharIndex = acceptorUserData.characters.findIndex(c => c.id === acceptorCharacterId);
            
            if (acceptorCharIndex === -1) {
                 throw new Error("Выбранный персонаж не найден.");
            }
            const acceptorChar = acceptorUserData.characters[acceptorCharIndex];

            if ((acceptorChar.bankAccount?.[request.toCurrency] ?? 0) < request.toAmount) {
                 throw new Error("У выбранного персонажа недостаточно средств.");
            }
            
            const creatorUserRef = doc(db, "users", request.creatorUserId);
            const creatorUserDoc = await transaction.get(creatorUserRef);
            if (!creatorUserDoc.exists()) throw new Error("Создатель запроса не найден.");
            const creatorUserData = creatorUserDoc.data() as User;
            const creatorCharIndex = creatorUserData.characters.findIndex(c => c.id === request.creatorCharacterId);
            if (creatorCharIndex === -1) throw new Error("Персонаж создателя запроса не найден.");

            const acceptorBankAccount = acceptorChar.bankAccount || { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] };
            acceptorBankAccount[request.toCurrency] -= request.toAmount;
            acceptorBankAccount[request.fromCurrency] = (acceptorBankAccount[request.fromCurrency] || 0) + request.fromAmount;
            const acceptorTx: BankTransaction = { id: `txn-accept-${Date.now()}`, date: new Date().toISOString(), reason: `Обмен с ${request.creatorCharacterName}`, amount: { [request.toCurrency]: -request.toAmount, [request.fromCurrency]: request.fromAmount }};
            acceptorBankAccount.history = [acceptorTx, ...(acceptorBankAccount.history || [])];
            acceptorChar.bankAccount = acceptorBankAccount;

            const creatorChar = creatorUserData.characters[creatorCharIndex];
            const creatorBankAccount = creatorChar.bankAccount || { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] };
            creatorBankAccount[request.toCurrency] = (creatorBankAccount[request.toCurrency] || 0) + request.toAmount;
            const creatorTx: BankTransaction = { id: `txn-complete-${Date.now()}`, date: new Date().toISOString(), reason: `Обмен с ${acceptorChar.name}`, amount: { [request.toCurrency]: request.toAmount }};
            creatorBankAccount.history = [creatorTx, ...(creatorBankAccount.history || [])];
            creatorChar.bankAccount = creatorBankAccount;
            
            transaction.update(acceptorUserRef, { characters: acceptorUserData.characters });
            transaction.update(creatorUserRef, { characters: creatorUserData.characters });
            transaction.update(requestRef, { status: 'closed', acceptorCharacterId: acceptorCharacterId, acceptorCharacterName: acceptorChar.name });
        });
        
        if (currentUser) {
          if (currentUser.id === acceptorUserId || currentUser.id === request.creatorUserId) {
            const updatedUser = await fetchUserById(currentUser.id);
            if (updatedUser) setCurrentUser(updatedUser);
          }
        }
    }, [currentUser, fetchUserById]);

  const cancelExchangeRequest = useCallback(async (request: ExchangeRequest) => {
    await runTransaction(db, async (transaction) => {
        const requestRef = doc(db, "exchange_requests", request.id);
        const requestDoc = await transaction.get(requestRef);
        if (!requestDoc.exists() || requestDoc.data().status !== 'open') {
            throw new Error("Запрос уже не действителен.");
        }

        const creatorUserRef = doc(db, "users", request.creatorUserId);
        const creatorUserDoc = await transaction.get(creatorUserRef);
        if (!creatorUserDoc.exists()) throw new Error("Создатель запроса не найден.");
        const creatorUserData = creatorUserDoc.data() as User;
        const creatorCharIndex = creatorUserData.characters.findIndex(c => c.id === request.creatorCharacterId);
        if (creatorCharIndex === -1) throw new Error("Персонаж создателя запроса не найден.");

        const creatorChar = creatorUserData.characters[creatorCharIndex];
        const bankAccount = creatorChar.bankAccount || { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] };
        bankAccount[request.fromCurrency] = (bankAccount[request.fromCurrency] || 0) + request.fromAmount;
        
        const refundTx: BankTransaction = { id: `txn-cancel-${Date.now()}`, date: new Date().toISOString(), reason: 'Отмена запроса на обмен', amount: { [request.fromCurrency]: request.fromAmount }};
        bankAccount.history = [refundTx, ...(bankAccount.history || [])];
        creatorChar.bankAccount = bankAccount;
        
        transaction.update(creatorUserRef, { characters: creatorUserData.characters });
        transaction.delete(requestRef);
    });
    
    if (currentUser?.id === request.creatorUserId) {
       const updatedUser = await fetchUserById(request.creatorUserId);
       if(updatedUser) setCurrentUser(updatedUser);
    }
  }, [currentUser, fetchUserById]);

  const createFamiliarTradeRequest = useCallback(async (initiatorCharacterId: string, initiatorFamiliarId: string, targetCharacterId: string, targetFamiliarId: string) => {
        if (!currentUser) throw new Error("Пользователь не авторизован.");
        
        const allUsers = await fetchUsersForAdmin();
        
        const initiatorChar = currentUser.characters.find(c => c.id === initiatorCharacterId);
        if (!initiatorChar) throw new Error("Персонаж-инициатор не найден.");

        const initiatorFamiliar = familiarsById[initiatorFamiliarId];
        if (!initiatorFamiliar) throw new Error("Фамильяр инициатора не найден.");

        let targetUser: User | undefined;
        let targetChar: Character | undefined;

        for (const user of allUsers) {
            const foundChar = user.characters.find(c => c.id === targetCharacterId);
            if (foundChar) {
                targetUser = user;
                targetChar = foundChar;
                break;
            }
        }
        if (!targetUser || !targetChar) throw new Error("Целевой персонаж или его владелец не найдены.");
        
        const targetFamiliar = familiarsById[targetFamiliarId];
        if (!targetFamiliar) throw new Error("Целевой фамильяр не найден.");

        const ranksAreDifferent = initiatorFamiliar.rank !== targetFamiliar.rank;
        const isMythicEventTrade =
          (initiatorFamiliar.rank === 'мифический' && targetFamiliar.rank === 'ивентовый') ||
          (initiatorFamiliar.rank === 'ивентовый' && targetFamiliar.rank === 'мифический');

        if (ranksAreDifferent && !isMythicEventTrade) {
            throw new Error("Обмен возможен только между фамильярами одного ранга, или между мифическим и ивентовым.");
        }
        
        const newRequest: Omit<FamiliarTradeRequest, 'id'> = {
            initiatorUserId: currentUser.id,
            initiatorCharacterId,
            initiatorCharacterName: initiatorChar.name,
            initiatorFamiliarId,
            initiatorFamiliarName: initiatorFamiliar.name,
            targetUserId: targetUser.id,
            targetCharacterId,
            targetCharacterName: targetChar.name,
            targetFamiliarId,
            targetFamiliarName: targetFamiliar.name,
            rank: initiatorFamiliar.rank,
            status: 'в ожидании',
            createdAt: new Date().toISOString(),
        };

        const requestsCollection = collection(db, "familiar_trade_requests");
        await addDoc(requestsCollection, newRequest);

    }, [currentUser, fetchUsersForAdmin, familiarsById]);

  const fetchFamiliarTradeRequestsForUser = useCallback(async (): Promise<FamiliarTradeRequest[]> => {
        if (!currentUser) return [];
        
        const requestsCollection = collection(db, "familiar_trade_requests");

        const outgoingQuery = query(
          requestsCollection,
          where('initiatorUserId', '==', currentUser.id),
          where('status', '==', 'в ожидании')
        );
        
        const incomingQuery = query(
          requestsCollection,
          where('targetUserId', '==', currentUser.id),
          where('status', '==', 'в ожидании')
        );

        const [outgoingSnapshot, incomingSnapshot] = await Promise.all([
          getDocs(outgoingQuery),
          getDocs(incomingQuery)
        ]);

        const requests: FamiliarTradeRequest[] = [];
        outgoingSnapshot.forEach(doc => requests.push({ id: doc.id, ...doc.data() } as FamiliarTradeRequest));
        incomingSnapshot.forEach(doc => requests.push({ id: doc.id, ...doc.data() } as FamiliarTradeRequest));

        return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [currentUser]);

  const acceptFamiliarTradeRequest = useCallback(async (request: FamiliarTradeRequest) => {
         await runTransaction(db, async (transaction) => {
            const requestRef = doc(db, "familiar_trade_requests", request.id);
            const requestDoc = await transaction.get(requestRef);
            if (!requestDoc.exists() || requestDoc.data().status !== 'в ожидании') {
                throw new Error("Запрос больше не действителен.");
            }

            const initiatorUserRef = doc(db, "users", request.initiatorUserId);
            const targetUserRef = doc(db, "users", request.targetUserId);

            const [initiatorDoc, targetDoc] = await Promise.all([
                transaction.get(initiatorUserRef),
                transaction.get(targetUserRef)
            ]);
            
            if (!initiatorDoc.exists() || !targetDoc.exists()) {
                throw new Error("Один из пользователей не найден.");
            }
            
            const initiatorData = initiatorDoc.data() as User;
            const targetData = targetDoc.data() as User;

            const initiatorCharIndex = initiatorData.characters.findIndex(c => c.id === request.initiatorCharacterId);
            const targetCharIndex = targetData.characters.findIndex(c => c.id === request.targetCharacterId);

            if (initiatorCharIndex === -1 || targetCharIndex === -1) {
                throw new Error("Один из персонажей не найден.");
            }

            const initiatorChar = initiatorData.characters[initiatorCharIndex];
            const initiatorCardIndex = (initiatorChar.familiarCards || []).findIndex(c => c.id === request.initiatorFamiliarId);
            if (initiatorCardIndex === -1) throw new Error(`Фамильяр ${request.initiatorFamiliarName} не найден у ${request.initiatorCharacterName}.`);
            initiatorChar.familiarCards.splice(initiatorCardIndex, 1);

            const targetChar = targetData.characters[targetCharIndex];
            const targetCardIndex = (targetChar.familiarCards || []).findIndex(c => c.id === request.targetFamiliarId);
            if (targetCardIndex === -1) throw new Error(`Фамильяр ${request.targetFamiliarName} не найден у ${request.targetCharacterName}.`);
            targetChar.familiarCards.splice(targetCardIndex, 1);

            initiatorChar.familiarCards.push({ id: request.targetFamiliarId });
            targetChar.familiarCards.push({ id: request.targetFamiliarId });

            transaction.update(initiatorUserRef, { characters: initiatorData.characters });
            transaction.update(targetUserRef, { characters: targetData.characters });
            transaction.update(requestRef, { status: 'принято' });
        });

        if (currentUser && (currentUser.id === request.initiatorUserId || currentUser.id === request.targetUserId)) {
            const updatedUser = await fetchUserById(currentUser.id);
            if (updatedUser) setCurrentUser(updatedUser);
        }
    }, [currentUser, fetchUserById]);

  const declineOrCancelFamiliarTradeRequest = useCallback(async (request: FamiliarTradeRequest, status: 'отклонено' | 'отменено') => {
          const requestRef = doc(db, "familiar_trade_requests", request.id);
          await updateDoc(requestRef, { status });
    }, []);

  const fetchAllShops = useCallback(async (): Promise<Shop[]> => {
          const shopsCollection = collection(db, "shops");
          const snapshot = await getDocs(shopsCollection);
          const dbShops = new Map<string, Partial<Shop>>();
          snapshot.forEach(doc => {
              dbShops.set(doc.id, doc.data());
          });

          const allShopsWithData = ALL_SHOPS.map(baseShop => {
              const dbData = dbShops.get(baseShop.id);
              return { ...baseShop, ...(dbData || {}) };
          });
          
          return allShopsWithData;
    }, []);

  const fetchShopById = useCallback(async (shopId: string): Promise<Shop | null> => {
          const baseShop = SHOPS_BY_ID[shopId];
          if (!baseShop) return null;

          const shopRef = doc(db, "shops", shopId);
          const docSnap = await getDoc(shopRef);

          if (docSnap.exists()) {
              return { ...baseShop, ...docSnap.data() };
          }
          return baseShop;
    }, []);

  const updateShopOwner = useCallback(async (shopId: string, ownerUserId: string, ownerCharacterId: string, ownerCharacterName: string) => {
          const shopRef = doc(db, "shops", shopId);
           await setDoc(shopRef, {
              ownerUserId,
              ownerCharacterId,
              ownerCharacterName,
              bankAccount: { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] }
          }, { merge: true });
    }, []);

  const removeShopOwner = useCallback(async (shopId: string) => {
        const shopRef = doc(db, "shops", shopId);
        await setDoc(shopRef, {
            ownerUserId: deleteField(),
            ownerCharacterId: deleteField(),
            ownerCharacterName: deleteField(),
            bankAccount: { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] }
        }, { merge: true });
    }, []);

  const updateShopDetails = useCallback(async (shopId: string, details: Partial<Pick<Shop, 'title' | 'description' | 'defaultNewItemCategory'>>) => {
        const shopRef = doc(db, "shops", shopId);
        await setDoc(shopRef, details, { merge: true });
    }, []);
  
  const addShopItem = useCallback(async (shopId: string, item: Omit<ShopItem, 'id'>) => {
        const shopRef = doc(db, "shops", shopId);
        const shopDoc = await getDoc(shopRef);
        const shopData = shopDoc.data() || {};
        const items = shopData.items || [];
        const newItem: ShopItem = { 
            ...item, 
            id: `item-${Date.now()}`
        };
        const updatedItems = [...items, newItem];
        const sanitizedItems = updatedItems.map((i: ShopItem) => {
            const { quantity, ...rest } = i;
            if (quantity === undefined) {
                return rest;
            }
            return i;
        });
        await setDoc(shopRef, { items: sanitizedItems }, { merge: true });
    }, []);

  const updateShopItem = useCallback(async (shopId: string, itemToUpdate: ShopItem) => {
        const shopRef = doc(db, "shops", shopId);
        const shopDoc = await getDoc(shopRef);
        const shopData = shopDoc.data() || {};
        const items = shopData.items || [];
        const updatedItems = items.map((item: ShopItem) => item.id === itemToUpdate.id ? itemToUpdate : item);
         const sanitizedItems = updatedItems.map((i: ShopItem) => {
            const { quantity, ...rest } = i;
            if (quantity === undefined) {
                return rest;
            }
            return i;
        });
        await setDoc(shopRef, { items: sanitizedItems }, { merge: true });
    }, []);

  const deleteShopItem = useCallback(async (shopId: string, itemId: string) => {
        const shopRef = doc(db, "shops", shopId);
        const shopDoc = await getDoc(shopRef);
        const shopData = shopDoc.data() || {};
        const items = shopData.items || [];
        const updatedItems = items.filter((item: ShopItem) => item.id !== itemId);
        await setDoc(shopRef, { items: updatedItems }, { merge: true });
    }, []);
  
  const purchaseShopItem = useCallback(async (shopId: string, itemId: string, buyerUserId: string, buyerCharacterId: string, quantity: number) => {
        await runTransaction(db, async (transaction) => {
            const shopRef = doc(db, "shops", shopId);
            const shopDoc = await transaction.get(shopRef);
            if (!shopDoc.exists()) throw new Error("Магазин не найден.");
            const shopData = shopDoc.data() as Shop;
            
            const itemIndex = (shopData.items || []).findIndex(i => i.id === itemId);
            if (itemIndex === -1) throw new Error("Товар не найден.");
            const item = shopData.items![itemIndex];

            if (item.quantity !== undefined && item.quantity < quantity) {
                throw new Error("Недостаточно товара в наличии.");
            }

            const buyerUserRef = doc(db, "users", buyerUserId);
            const buyerUserDoc = await transaction.get(buyerUserRef);
            if (!buyerUserDoc.exists()) throw new Error("Покупатель не найден.");
            const buyerUserData = buyerUserDoc.data() as User;

            const buyerCharIndex = buyerUserData.characters.findIndex(c => c.id === buyerCharacterId);
            if (buyerCharIndex === -1) throw new Error("Персонаж покупателя не найден.");
            const buyerChar = buyerUserData.characters[buyerCharIndex];
            
            const price = item.price;
            const totalPrice = {
                platinum: (price.platinum || 0) * quantity,
                gold: (price.gold || 0) * quantity,
                silver: (price.silver || 0) * quantity,
                copper: (price.copper || 0) * quantity,
            }
            const balance = buyerChar.bankAccount || { platinum: 0, gold: 0, silver: 0, copper: 0 };
            if (
                balance.platinum < totalPrice.platinum ||
                balance.gold < totalPrice.gold ||
                balance.silver < totalPrice.silver ||
                balance.copper < totalPrice.copper
            ) {
                throw new Error("Недостаточно средств у персонажа.");
            }

            buyerChar.bankAccount.platinum -= totalPrice.platinum;
            buyerChar.bankAccount.gold -= totalPrice.gold;
            buyerChar.bankAccount.silver -= totalPrice.silver;
            buyerChar.bankAccount.copper -= totalPrice.copper;
            
            const buyerTx: BankTransaction = { id: `txn-buy-${Date.now()}`, date: new Date().toISOString(), reason: `Покупка: ${item.name} x${quantity}`, amount: { platinum: -totalPrice.platinum, gold: -totalPrice.gold, silver: -totalPrice.silver, copper: -totalPrice.copper } };
            buyerChar.bankAccount.history = [buyerTx, ...(buyerChar.bankAccount.history || [])];

            if (item.inventoryTag === 'проживание') {
                buyerChar.residenceLocation = item.name;
            } else if (item.inventoryTag) {
                const inv = (buyerChar.inventory ??= {} as Partial<Inventory>);
                const tag = item.inventoryTag as keyof Inventory;
                (inv[tag] ??= []);
                const list = inv[tag]!;
                
                const inventoryItemName = item.inventoryItemName || item.name;
                const inventoryItemDescription = item.inventoryItemDescription || item.description || '';
                const inventoryItemImage = item.inventoryItemImage || item.image || '';

                const existingItemIndex = list.findIndex(invItem => invItem.name === inventoryItemName);

                if (existingItemIndex > -1) {
                    list[existingItemIndex].quantity += quantity;
                } else {
                    const newInventoryItem: InventoryItem = {
                        id: `inv-item-${Date.now()}`,
                        name: inventoryItemName,
                        description: inventoryItemDescription,
                        image: inventoryItemImage,
                        quantity: quantity,
                    };
                    list.push(newInventoryItem);
                }
            }

            const shopBankAccount = shopData.bankAccount || { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] };
            shopBankAccount.platinum = (shopBankAccount.platinum || 0) + totalPrice.platinum;
            shopBankAccount.gold = (shopBankAccount.gold || 0) + totalPrice.gold;
            shopBankAccount.silver = (shopBankAccount.silver || 0) + totalPrice.silver;
            shopBankAccount.copper = (shopBankAccount.copper || 0) + totalPrice.copper;

            const shopTx: BankTransaction = { id: `txn-sell-${Date.now()}`, date: new Date().toISOString(), reason: `Продажа: ${item.name} x${quantity}`, amount: totalPrice };
            shopBankAccount.history = [shopTx, ...(shopBankAccount.history || [])];

            transaction.update(buyerUserRef, { characters: buyerUserData.characters });

            const updatedShopData: Partial<Shop> = { bankAccount: shopBankAccount };
            const updatedItems = [...shopData.items!];
            if (item.quantity !== undefined) {
                updatedItems[itemIndex].quantity = item.quantity - quantity;
            }
            updatedItems[itemIndex].purchaseCount = (updatedItems[itemIndex].purchaseCount || 0) + quantity;
            updatedShopData.items = updatedItems;
            updatedShopData.purchaseCount = increment(quantity) as unknown as number;

            transaction.set(shopRef, updatedShopData, { merge: true });
        });
        
         if (currentUser?.id === buyerUserId) {
            const updatedUser = await fetchUserById(buyerUserId);
            if (updatedUser) setCurrentUser(updatedUser);
        }
    }, [currentUser, fetchUserById, initialFormData]);

    const adminGiveItemToCharacter = useCallback(async (userId: string, characterId: string, itemData: AdminGiveItemForm) => {
        const user = await fetchUserById(userId);
        if (!user) throw new Error("User not found");

        const characterIndex = user.characters.findIndex(c => c.id === characterId);
        if (characterIndex === -1) throw new Error("Character not found");

        const character = { ...user.characters[characterIndex] };
        const inventory = (character.inventory ??= {} as Partial<Inventory>);
        
        const newInventoryItem: InventoryItem = {
            id: `inv-item-admin-${Date.now()}`,
            name: itemData.name || '',
            description: itemData.description || '',
            image: itemData.image || '',
            quantity: itemData.quantity || 1,
        };

        const tag = itemData.inventoryTag as keyof Inventory;
        (inventory[tag] ??= []);
        const list = inventory[tag]!;
        list.push(newInventoryItem);

        const updatedCharacters = [...user.characters];
        updatedCharacters[characterIndex] = character;
        await updateUser(userId, { characters: updatedCharacters });
    }, [fetchUserById, updateUser, initialFormData]);

    const adminUpdateItemInCharacter = useCallback(async (userId: string, characterId: string, itemData: InventoryItem, category: InventoryCategory) => {
        const user = await fetchUserById(userId);
        if (!user) throw new Error("User not found");

        const characterIndex = user.characters.findIndex(c => c.id === characterId);
        if (characterIndex === -1) throw new Error("Character not found");

        const character = { ...user.characters[characterIndex] };
        const inventory = character.inventory || initialFormData.inventory;

        if (!Array.isArray(inventory[category])) {
            inventory[category] = [];
        }
        
        const itemIndex = inventory[category].findIndex(i => i.id === itemData.id);
        if (itemIndex === -1) throw new Error("Item not found in character's inventory");

        inventory[category][itemIndex] = itemData;
        character.inventory = inventory;

        const updatedCharacters = [...user.characters];
        updatedCharacters[characterIndex] = character;
        await updateUser(userId, { characters: updatedCharacters });
    }, [fetchUserById, updateUser, initialFormData]);

    const adminDeleteItemFromCharacter = useCallback(async (userId: string, characterId: string, itemId: string, category: InventoryCategory) => {
        const user = await fetchUserById(userId);
        if (!user) throw new Error("User not found");

        const characterIndex = user.characters.findIndex(c => c.id === characterId);
        if (characterIndex === -1) throw new Error("Character not found");

        const character = { ...user.characters[characterIndex] };
        const inventory = character.inventory || initialFormData.inventory;

        if (!Array.isArray(inventory[category])) {
           return;
        }
        
        inventory[category] = inventory[category].filter(i => i.id !== itemId);
        character.inventory = inventory;

        const updatedCharacters = [...user.characters];
        updatedCharacters[characterIndex] = character;
        await updateUser(userId, { characters: updatedCharacters });
    }, [fetchUserById, updateUser, initialFormData]);

    const consumeInventoryItem = useCallback(async (userId: string, characterId: string, itemId: string, category: InventoryCategory) => {
        const user = await fetchUserById(userId);
        if (!user) throw new Error("User not found");

        const characterIndex = user.characters.findIndex(c => c.id === characterId);
        if (characterIndex === -1) throw new Error("Character not found");

        const character = { ...user.characters[characterIndex] };
        const inventory = character.inventory || initialFormData.inventory;

        if (!Array.isArray(inventory[category])) {
           throw new Error("Item category not found");
        }
        
        const itemIndex = inventory[category].findIndex(i => i.id === itemId);
        if (itemIndex === -1) throw new Error("Item not found");

        if (inventory[category][itemIndex].quantity > 1) {
            inventory[category][itemIndex].quantity -= 1;
        } else {
            inventory[category] = inventory[category].filter(i => i.id !== itemId);
        }
        
        character.inventory = inventory;

        const updatedCharacters = [...user.characters];
        updatedCharacters[characterIndex] = character;
        await updateUser(userId, { characters: updatedCharacters });
    }, [fetchUserById, updateUser, initialFormData]);


    const restockShopItem = useCallback(async (shopId: string, itemId: string) => {
        await runTransaction(db, async (transaction) => {
            const shopRef = doc(db, "shops", shopId);
            const shopDoc = await transaction.get(shopRef);
            if (!shopDoc.exists()) throw new Error("Магазин не найден.");
            const shopData = shopDoc.data() as Shop;
            
            const itemIndex = (shopData.items || []).findIndex(i => i.id === itemId);
            if (itemIndex === -1) throw new Error("Товар не найден.");
            const item = shopData.items![itemIndex];

            if (item.quantity !== 0) throw new Error("Этот товар еще есть в наличии.");
            
            const restockCost = {
                platinum: Math.ceil((item.price.platinum || 0) * 0.3),
                gold: Math.ceil((item.price.gold || 0) * 0.3),
                silver: Math.ceil((item.price.silver || 0) * 0.3),
                copper: Math.ceil((item.price.copper || 0) * 0.3),
            };

            const shopTill = shopData.bankAccount || { platinum: 0, gold: 0, silver: 0, copper: 0 };
            if (
                shopTill.platinum < restockCost.platinum ||
                shopTill.gold < restockCost.gold ||
                shopTill.silver < restockCost.silver ||
                shopTill.copper < restockCost.copper
            ) {
                throw new Error("В кассе заведения недостаточно средств для пополнения запасов.");
            }
            
            shopTill.platinum -= restockCost.platinum;
            shopTill.gold -= restockCost.gold;
            shopTill.silver -= restockCost.silver;
            shopTill.copper -= restockCost.copper;

            const restockTx: BankTransaction = { id: `txn-restock-${Date.now()}`, date: new Date().toISOString(), reason: `Пополнение товара: ${item.name}`, amount: { platinum: -restockCost.platinum, gold: -restockCost.gold, silver: -restockCost.silver, copper: -restockCost.copper } };
            shopTill.history = [restockTx, ...(shopTill.history || [])];

            const updatedItems = [...shopData.items!];
            updatedItems[itemIndex].quantity = 10;

            transaction.set(shopRef, { items: updatedItems, bankAccount: shopTill }, { merge: true });
        });
    }, []);

    const adminUpdateCharacterStatus = useCallback(async (userId: string, characterId: string, updates: { taxpayerStatus?: TaxpayerStatus; citizenshipStatus?: CitizenshipStatus; }) => {
        const user = await fetchUserById(userId);
        if (!user) throw new Error("User not found");

        const characterIndex = user.characters.findIndex(c => c.id === characterId);
        if (characterIndex === -1) throw new Error("Character not found");

        const updatedCharacters = [...user.characters];
        const character = { ...updatedCharacters[characterIndex], ...updates };
        updatedCharacters[characterIndex] = character;
        
        await updateUser(userId, { characters: updatedCharacters });
    }, [fetchUserById, updateUser]);

    const adminUpdateShopLicense = useCallback(async (shopId: string, hasLicense: boolean) => {
        const shopRef = doc(db, "shops", shopId);
        await setDoc(shopRef, { hasLicense }, { merge: true });
    }, []);



    const processAnnualTaxes = useCallback(async (): Promise<{ taxedCharactersCount: number; totalTaxesCollected: BankAccount }> => {
        const allUsers = await fetchUsersForAdmin();
        const allShops = await fetchAllShops();
        const shopsById = new Map(allShops.map(shop => [shop.id, shop]));
        const batch = writeBatch(db);
        let taxedCharactersCount = 0;
        let totalTaxesCollected: BankAccount = { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] };

        const currencyKeys: (keyof Omit<BankAccount, 'history'>)[] = ['platinum', 'gold', 'silver', 'copper'];

        for (const user of allUsers) {
            let hasChanges = false;
            const updatedCharacters = [...user.characters];

            for (let i = 0; i < updatedCharacters.length; i++) {
                const character = updatedCharacters[i];

                if (character.taxpayerStatus !== 'taxable') {
                    continue;
                }

                let incomeTaxRate = 0;
                let tradeTaxRate = 0;
                let tradeTaxRateLicensed = 0;

                switch (character.countryOfResidence) {
                    case 'Артерианск':
                        incomeTaxRate = 0.10;
                        tradeTaxRate = 0.10;
                        tradeTaxRateLicensed = 0.05;
                        break;
                    case 'Белоснежье':
                        incomeTaxRate = 0.10;
                        tradeTaxRate = character.citizenshipStatus === 'refugee' ? 0.15 : 0.10;
                        tradeTaxRateLicensed = character.citizenshipStatus === 'refugee' ? 0.10 : 0.05;
                        break;
                    case 'Огнеславия':
                        incomeTaxRate = 0.15;
                        tradeTaxRate = 0.15;
                        tradeTaxRateLicensed = 0.10;
                        break;
                    case 'Сан-Ликорис':
                        incomeTaxRate = 0.05;
                        tradeTaxRate = 0.07;
                        tradeTaxRateLicensed = 0.05;
                        break;
                    case 'Заприливье':
                        incomeTaxRate = 0.07;
                        tradeTaxRate = 0.10; // No license discount
                        tradeTaxRateLicensed = 0.10;
                        break;
                    default:
                        continue; // No taxes for other countries
                }

                let totalTaxToPay: Partial<Omit<BankAccount, 'history'>> = { platinum: 0, gold: 0, silver: 0, copper: 0 };

                // 1. Income Tax
                const wealthInfo = WEALTH_LEVELS.find(w => w.name === character.wealthLevel);
                if (wealthInfo && wealthInfo.salary) {
                    const annualSalary: Partial<Omit<BankAccount, 'history'>> = {
                        platinum: (wealthInfo.salary.platinum || 0) * 12,
                        gold: (wealthInfo.salary.gold || 0) * 12,
                        silver: (wealthInfo.salary.silver || 0) * 12,
                        copper: (wealthInfo.salary.copper || 0) * 12,
                    };
                    
                    currencyKeys.forEach(key => {
                        const tax = Math.ceil((annualSalary[key] || 0) * incomeTaxRate);
                        totalTaxToPay[key] = (totalTaxToPay[key] || 0) + tax;
                    });
                }
                
                // 2. Trade Tax
                const ownedShops = allShops.filter(shop => shop.ownerCharacterId === character.id);
                if (ownedShops.length > 0) {
                     for (const shop of ownedShops) {
                        const currentTaxRate = shop.hasLicense ? tradeTaxRateLicensed : tradeTaxRate;
                        let shopValue: Partial<Omit<BankAccount, 'history'>> = { platinum: 0, gold: 0, silver: 0, copper: 0 };
                        
                        (shop.items || []).forEach(item => {
                            currencyKeys.forEach(key => {
                                const quantity = item.quantity === undefined ? 1 : item.quantity;
                                shopValue[key] = (shopValue[key] || 0) + (item.price[key] || 0) * quantity;
                            });
                        });

                        currencyKeys.forEach(key => {
                            const tax = Math.ceil((shopValue[key] || 0) * currentTaxRate);
                            totalTaxToPay[key] = (totalTaxToPay[key] || 0) + tax;
                        });
                    }
                }

                // 3. Deduct taxes
                const finalTaxAmount = totalTaxToPay;
                if (Object.values(finalTaxAmount).some(v => v > 0)) {
                    let newBalance = { ...(character.bankAccount || { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] }) };
                    
                    let negativeAmount: Partial<Omit<BankAccount, 'history'>> = {};
                     currencyKeys.forEach(key => {
                        newBalance[key] = (newBalance[key] || 0) - (finalTaxAmount[key] || 0);
                        negativeAmount[key] = -(finalTaxAmount[key] || 0);
                    });
                    
                    const newTransaction: BankTransaction = {
                        id: `txn-tax-${Date.now()}`,
                        date: new Date().toISOString(),
                        reason: 'Ежегодный налог',
                        amount: negativeAmount,
                    };
                    newBalance.history = [newTransaction, ...(newBalance.history || [])];
                    
                    updatedCharacters[i] = { ...character, bankAccount: newBalance };
                    hasChanges = true;
                    taxedCharactersCount++;

                    currencyKeys.forEach(key => {
                        totalTaxesCollected[key] = (totalTaxesCollected[key] || 0) + (finalTaxAmount[key] || 0);
                    });
                }
            }
            
            if (hasChanges) {
                const userRef = doc(db, "users", user.id);
                batch.update(userRef, { characters: updatedCharacters });
            }
        }
        
        await batch.commit();
        return { taxedCharactersCount, totalTaxesCollected };

    }, [fetchUsersForAdmin, fetchAllShops]);

    const sendMassMail = useCallback(async (subject: string, content: string, senderName: string, recipientCharacterIds?: string[]) => {
        const allUsers = await fetchUsersForAdmin();
        const batch = writeBatch(db);
        const timestamp = Date.now();
      
        const recipientsSet = recipientCharacterIds && recipientCharacterIds.length > 0 
          ? new Set(recipientCharacterIds) 
          : null;
          
        const usersToUpdate = new Map<string, User>();
        
        for (const user of allUsers) {
            const userCharacters = recipientsSet
                ? user.characters.filter(c => recipientsSet.has(c.id))
                : user.characters;
                
            if (userCharacters.length > 0) {
                const recipientCharacterNames = userCharacters.map(c => c.name).join(', ');
                const newMail: MailMessage = {
                    id: `mail-mass-${timestamp}-${user.id}`,
                    senderUserId: 'admin',
                    senderCharacterName: senderName,
                    recipientUserId: user.id,
                    recipientCharacterId: '',
                    recipientCharacterName: recipientCharacterNames,
                    subject,
                    content,
                    sentAt: new Date(timestamp).toISOString(),
                    isRead: false,
                    type: 'announcement',
                };
                const updatedUser = { ...user, mail: [...(user.mail || []), newMail] };
                usersToUpdate.set(user.id, updatedUser);
            }
        }
        
        usersToUpdate.forEach((user, userId) => {
            const userRef = doc(db, "users", userId);
            batch.update(userRef, { mail: user.mail });
        });
        
        await batch.commit();
    }, [fetchUsersForAdmin]);

    const markMailAsRead = useCallback(async (mailId: string) => {
        if (!currentUser) return;
        const userMail = (currentUser.mail || []).map(m => m.id === mailId ? { ...m, isRead: true } : m);
        await updateUser(currentUser.id, { mail: userMail });
    }, [currentUser, updateUser]);

    const deleteMailMessage = useCallback(async (mailId: string) => {
        if (!currentUser) return;
        const userMail = (currentUser.mail || []).filter(m => m.id !== mailId);
        await updateUser(currentUser.id, { mail: userMail });
    }, [currentUser, updateUser]);

    const clearAllMailboxes = useCallback(async () => {
        const allUsers = await fetchUsersForAdmin();
        const batch = writeBatch(db);
        for (const user of allUsers) {
            const userRef = doc(db, "users", user.id);
            batch.update(userRef, { mail: [] });
        }
        await batch.commit();
        if (currentUser) {
            const updatedCurrentUser = await fetchUserById(currentUser.id);
            if (updatedCurrentUser) {
                setCurrentUser(updatedCurrentUser);
            }
        }
    }, [fetchUsersForAdmin, currentUser, fetchUserById]);

    const updatePopularity = useCallback(async (updates: CharacterPopularityUpdate[]) => {
        const allUsers = await fetchUsersForAdmin();
        const batch = writeBatch(db);

        const usersToUpdate = new Map<string, User>();
        allUsers.forEach(user => usersToUpdate.set(user.id, JSON.parse(JSON.stringify(user))));

        for (const user of usersToUpdate.values()) {
            let userHasChanges = false;
            const updatedCharacters = user.characters.map(char => {
                const charUpdate = updates.find(u => u.characterId === char.id);
                let newPopularity = char.popularity ?? 0;
                const newHistoryEntries: PopularityLog[] = [];

                if (charUpdate) {
                    let totalPoints = 0;
                    charUpdate.eventIds.forEach(eventId => {
                        const eventData = POPULARITY_EVENTS.find(e => e.label === eventId);
                        if (eventData) {
                            totalPoints += eventData.value;
                            const reason = charUpdate.description ? `${eventData.label}: ${charUpdate.description}` : eventData.label;
                            newHistoryEntries.push({
                                id: `pop-${Date.now()}-${char.id.slice(0, 4)}-${Math.random()}`,
                                date: new Date().toISOString(),
                                reason: reason,
                                amount: eventData.value,
                            });
                            
                            if (eventData.achievementId && !(user.achievementIds || []).includes(eventData.achievementId)) {
                                 user.achievementIds = [...(user.achievementIds || []), eventData.achievementId];
                                 userHasChanges = true;
                            }
                        }
                    });
                    newPopularity += totalPoints;
                } else {
                    newPopularity -= 5;
                    newHistoryEntries.push({
                        id: `pop-decay-${Date.now()}-${char.id.slice(0, 4)}`,
                        date: new Date().toISOString(),
                        reason: 'Еженедельный спад популярности',
                        amount: -5,
                    });
                }
                
                newPopularity = Math.max(0, newPopularity);

                if (newPopularity !== (char.popularity ?? 0) || newHistoryEntries.length > 0) {
                    userHasChanges = true;
                    const updatedHistory = [...newHistoryEntries, ...(char.popularityHistory || [])];
                    return { ...char, popularity: newPopularity, popularityHistory: updatedHistory };
                }
                return char;
            });

            if (userHasChanges) {
                 const userToUpdate = usersToUpdate.get(user.id)!;
                 userToUpdate.characters = updatedCharacters;
            }
        }

         for (const user of usersToUpdate.values()) {
            const userRef = doc(db, "users", user.id);
            batch.update(userRef, { 
                characters: user.characters, 
                achievementIds: user.achievementIds 
            });
        }

        await batch.commit();

        if (currentUser) {
            const updatedCurrentUser = await fetchUserById(currentUser.id);
            if (updatedCurrentUser) setCurrentUser(updatedCurrentUser);
        }
    }, [fetchUsersForAdmin, currentUser, fetchUserById, grantAchievementToUser]);

    const clearAllPopularityHistories = useCallback(async () => {
        const allUsers = await fetchUsersForAdmin();
        const batch = writeBatch(db);
        for (const user of allUsers) {
            let hasChanges = false;
            const updatedCharacters = user.characters.map(char => {
                if (char.popularityHistory && char.popularityHistory.length > 0) {
                    hasChanges = true;
                    return { ...char, popularityHistory: [] };
                }
                return char;
            });

            if (hasChanges) {
                const userRef = doc(db, "users", user.id);
                batch.update(userRef, { characters: updatedCharacters });
            }
        }
        await batch.commit();
    }, [fetchUsersForAdmin]);

    const withdrawFromShopTill = useCallback(async (shopId: string) => {
        if (!currentUser) throw new Error("Пользователь не авторизован.");
        
        await runTransaction(db, async (transaction) => {
            const shopRef = doc(db, "shops", shopId);
            const shopDoc = await transaction.get(shopRef);
            if (!shopDoc.exists()) throw new Error("Магазин не найден.");
            const shopData = shopDoc.data() as Shop;
            
            if (shopData.ownerUserId !== currentUser.id) {
                throw new Error("Вы не являетесь владельцем этого заведения.");
            }
            
            const ownerChar = currentUser.characters.find(c => c.id === shopData.ownerCharacterId);
            if (!ownerChar) throw new Error("Персонаж-владелец не найден в вашем профиле.");

            const shopTill = shopData.bankAccount || { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] };
            if (Object.values(shopTill).every(v => typeof v === 'number' && v === 0)) {
                throw new Error("Касса заведения пуста.");
            }

            const userRef = doc(db, "users", currentUser.id);
            const userDoc = await transaction.get(userRef);
            const userData = userDoc.data() as User;
            const charIndex = userData.characters.findIndex(c => c.id === ownerChar.id);
            const characterToUpdate = userData.characters[charIndex];
            
            const charBalance = characterToUpdate.bankAccount || { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] };
            charBalance.platinum += shopTill.platinum;
            charBalance.gold += shopTill.gold;
            charBalance.silver += shopTill.silver;
            charBalance.copper += shopTill.copper;
            
            const withdrawTx: BankTransaction = {
                id: `txn-withdraw-${Date.now()}`,
                date: new Date().toISOString(),
                reason: `Вывод средств из кассы "${shopData.title}"`,
                amount: { platinum: shopTill.platinum, gold: shopTill.gold, silver: shopTill.silver, copper: shopTill.copper }
            };
            charBalance.history = [withdrawTx, ...(charBalance.history || [])];

            const newShopTill: BankAccount = { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] };
            const shopWithdrawTx: BankTransaction = {
                id: `txn-shop-withdraw-${Date.now()}`,
                date: new Date().toISOString(),
                reason: `Вывод средств владельцем`,
                amount: { platinum: -shopTill.platinum, gold: -shopTill.gold, silver: -shopTill.silver, copper: -shopTill.copper }
            };
            newShopTill.history = [shopWithdrawTx, ...(shopTill.history || [])];
            
            transaction.update(userRef, { characters: userData.characters });
            transaction.set(shopRef, { bankAccount: newShopTill }, { merge: true });
        });
        
        const updatedUser = await fetchUserById(currentUser.id);
        if(updatedUser) setCurrentUser(updatedUser);
    }, [currentUser, fetchUserById]);

    const fetchAlchemyRecipes = useCallback(async (): Promise<AlchemyRecipe[]> => {
        const recipesCollection = collection(db, "alchemy_recipes");
        const snapshot = await getDocs(recipesCollection);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AlchemyRecipe));
    }, []);

    const brewPotion = useCallback(async (userId: string, characterId: string, recipeId: string): Promise<{ createdItem: InventoryItem; recipeName: string; }> => {
        let createdItem: InventoryItem | null = null;
        let recipeName: string = '';
    
        const allRecipes = await fetchAlchemyRecipes();
        const allItemsFromShops = (await fetchAllShops()).flatMap(shop => shop.items || []);
        const allItemsMap = new Map<string, ShopItem | AlchemyIngredient | Potion>();
        [...allItemsFromShops, ...ALL_ITEMS_FOR_ALCHEMY].forEach(item => {
            if (item) allItemsMap.set(item.id, item);
        });

        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", userId);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw new Error("Пользователь не найден.");
            const userData = userDoc.data() as User;
            const charIndex = userData.characters.findIndex(c => c.id === characterId);
            if (charIndex === -1) throw new Error("Персонаж не найден.");
    
            const recipe = allRecipes.find(r => r.id === recipeId);
            if (!recipe) throw new Error("Рецепт не найден.");
            
            const resultItemData = allItemsMap.get(recipe.resultPotionId);
            recipeName = recipe.name || resultItemData?.name ||'Неизвестный рецепт';
    
            const character = userData.characters[charIndex];
            const inventory = character.inventory || initialFormData.inventory;
            
            for (const component of recipe.components) {
                const requiredItemData = allItemsMap.get(component.ingredientId);
                if (!requiredItemData) {
                     throw new Error(`Required ingredient with ID ${component.ingredientId} not found.`);
                }
                const category = (requiredItemData as ShopItem).inventoryTag;
                if (!category || (category !== 'ингредиенты' && category !== 'драгоценности')) {
                    throw new Error(`Invalid inventory category for item ${requiredItemData.name}`);
                }
                const inventoryItemName = 'inventoryItemName' in requiredItemData && requiredItemData.inventoryItemName ? requiredItemData.inventoryItemName : requiredItemData.name;

                let totalAvailable = 0;
                const mainCategoryItems = (inventory[category] || []) as InventoryItem[];
                const mainPlayerItem = mainCategoryItems.find(i => i.name === inventoryItemName);
                if (mainPlayerItem) {
                    totalAvailable += mainPlayerItem.quantity;
                }

                if (category === 'драгоценности') {
                    const ingredientItems = (inventory['ингредиенты'] || []) as InventoryItem[];
                    const jewelInIngredients = ingredientItems.find(i => i.name === inventoryItemName);
                    if (jewelInIngredients) {
                        totalAvailable += jewelInIngredients.quantity;
                    }
                }

                if (totalAvailable < component.qty) {
                    throw new Error(`Недостаточно: ${inventoryItemName}`);
                }

                let qtyToDeduct = component.qty;

                if (category === 'драгоценности') {
                    const jewelInv = (inventory['драгоценности'] || []) as InventoryItem[];
                    const jewelIndex = jewelInv.findIndex(i => i.name === inventoryItemName);
                    if (jewelIndex > -1) {
                        const available = jewelInv[jewelIndex].quantity;
                        const deductFromHere = Math.min(qtyToDeduct, available);
                        
                        jewelInv[jewelIndex].quantity -= deductFromHere;
                        qtyToDeduct -= deductFromHere;
                        
                        if (jewelInv[jewelIndex].quantity <= 0) {
                            jewelInv.splice(jewelIndex, 1);
                        }
                    }

                    if (qtyToDeduct > 0) {
                        const ingredientInv = (inventory['ингредиенты'] || []) as InventoryItem[];
                        const jewelInIngrIndex = ingredientInv.findIndex(i => i.name === inventoryItemName);
                        ingredientInv[jewelInIngrIndex].quantity -= qtyToDeduct;
                        if (ingredientInv[jewelInIngrIndex].quantity <= 0) {
                            ingredientInv.splice(jewelInIngrIndex, 1);
                        }
                    }
                } else {
                    const ingredientInv = (inventory['ингредиенты'] || []) as InventoryItem[];
                    const playerItemIndex = ingredientInv.findIndex(i => i.name === inventoryItemName);
                    
                    ingredientInv[playerItemIndex].quantity -= qtyToDeduct;
                    if (ingredientInv[playerItemIndex].quantity <= 0) {
                        ingredientInv.splice(playerItemIndex, 1);
                    }
                }
            }
    
            if (!resultItemData) {
                throw new Error("Resulting item not found in data.");
            }
    
            const resultCategory = (resultItemData as ShopItem).inventoryTag || 'зелья';
            const categoryInventory = (inventory[resultCategory] || []) as InventoryItem[];
            const existingItemIndex = categoryInventory.findIndex(p => p.name === resultItemData.name);
    
            const newOrUpdatedItem: InventoryItem = {
                id: `inv-item-${Date.now()}`,
                name: (resultItemData as ShopItem).inventoryItemName || resultItemData.name || '',
                description: (resultItemData as ShopItem).inventoryItemDescription || (resultItemData as ShopItem).description || (resultItemData as Potion).note || '',
                image: (resultItemData as ShopItem).inventoryItemImage || resultItemData.image || '',
                quantity: recipe.outputQty,
                inventoryTag: resultCategory,
            };
    
            if (existingItemIndex > -1) {
                categoryInventory[existingItemIndex].quantity += recipe.outputQty;
                createdItem = { ...categoryInventory[existingItemIndex] };
            } else {
                categoryInventory.push(newOrUpdatedItem);
                createdItem = newOrUpdatedItem;
            }
            (inventory as any)[resultCategory] = categoryInventory;
            character.inventory = inventory;
            
            const hasFirstBrewAchievement = (userData.achievementIds || []).includes(FIRST_BREW_ACHIEVEMENT_ID);
            if (!hasFirstBrewAchievement) {
                userData.achievementIds = [...(userData.achievementIds || []), FIRST_BREW_ACHIEVEMENT_ID];
            }
    
            userData.characters[charIndex] = character;
            
            transaction.update(userRef, { characters: userData.characters, achievementIds: userData.achievementIds });
        });
    
        if (!createdItem) {
            throw new Error("Не удалось создать предмет.");
        }
        
        if (currentUser && currentUser.id === userId) {
            const updatedUser = await fetchUserById(userId);
            if(updatedUser) setCurrentUser(updatedUser);
        }
    
        return { createdItem, recipeName };
    }, [currentUser, fetchUserById, initialFormData, fetchAllShops, grantAchievementToUser, setCurrentUser, fetchAlchemyRecipes]);
    
    const addAlchemyRecipe = useCallback(async (recipe: Omit<AlchemyRecipe, 'id' | 'createdAt'>) => {
        const recipesCollection = collection(db, "alchemy_recipes");
        await addDoc(recipesCollection, { ...recipe, createdAt: new Date().toISOString() });
    }, []);

    const updateAlchemyRecipe = useCallback(async (recipeId: string, recipe: Omit<AlchemyRecipe, 'id' | 'createdAt'>) => {
        const recipeRef = doc(db, "alchemy_recipes", recipeId);
        await setDoc(recipeRef, recipe, { merge: true });
    }, []);
    
    const deleteAlchemyRecipe = useCallback(async (recipeId: string) => {
        const recipeRef = doc(db, "alchemy_recipes", recipeId);
        await deleteDoc(recipeRef);
    }, []);
    
    const addFamiliarToDb = useCallback(async (familiar: Omit<FamiliarCard, 'id'>) => {
        const familiarsCollection = collection(db, "familiars");
        await addDoc(familiarsCollection, familiar);
        await fetchAndCombineFamiliars();
    }, [fetchAndCombineFamiliars]);

    const deleteFamiliarFromDb = useCallback(async (familiarId: string) => {
        const familiarRef = doc(db, "familiars", familiarId);
        await deleteDoc(familiarRef);
        await fetchAndCombineFamiliars();
    }, [fetchAndCombineFamiliars]);

    const sendPlayerPing = useCallback(async (targetUserId: string) => {
        if (!currentUser) throw new Error("Not authenticated");
        
        const targetUserRef = doc(db, "users", targetUserId);
        
        const newPing: PlayerPing = {
            id: `ping-${Date.now()}-${currentUser.id.slice(0, 5)}`,
            fromUserId: currentUser.id,
            fromUserName: currentUser.name,
            fromUserAvatar: currentUser.avatar,
            toUserId: targetUserId,
            createdAt: new Date().toISOString()
        };

        await updateDoc(targetUserRef, {
            playerPings: arrayUnion(newPing)
        });
        
        const myUserRef = doc(db, "users", currentUser.id);
        await updateDoc(myUserRef, {
            playerPings: arrayUnion(newPing)
        });

    }, [currentUser]);

    const deletePlayerPing = useCallback(async (pingId: string, isMyPing: boolean) => {
        if (!currentUser) throw new Error("Not authenticated");

        const userRef = doc(db, "users", currentUser.id);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data() as User;
        
        const pingToRemove = (userData.playerPings || []).find(p => p.id === pingId);
        if (!pingToRemove) return;
        
        const otherUserId = isMyPing ? pingToRemove.toUserId : pingToRemove.fromUserId;
        
        const batch = writeBatch(db);
        batch.update(userRef, { playerPings: arrayRemove(pingToRemove) });
        
        const otherUserRef = doc(db, "users", otherUserId);
        batch.update(otherUserRef, { playerPings: arrayRemove(pingToRemove) });
        
        await batch.commit();

    }, [currentUser]);

    const addFavoritePlayer = useCallback(async (targetUserId: string) => {
        if (!currentUser) return;
        const userRef = doc(db, 'users', currentUser.id);
        await updateDoc(userRef, {
            favoritePlayerIds: arrayUnion(targetUserId)
        });
        
        if (!(currentUser.achievementIds || []).includes(FAVORITE_PLAYER_ACHIEVEMENT_ID)) {
             await grantAchievementToUser(currentUser.id, FAVORITE_PLAYER_ACHIEVEMENT_ID);
        }

        setCurrentUser(prev => prev ? { ...prev, favoritePlayerIds: [...(prev.favoritePlayerIds || []), targetUserId] } : null);
    }, [currentUser, setCurrentUser, grantAchievementToUser]);

    const removeFavoritePlayer = useCallback(async (targetUserId: string) => {
        if (!currentUser) return;
        const userRef = doc(db, 'users', currentUser.id);
        await updateDoc(userRef, {
            favoritePlayerIds: arrayRemove(targetUserId)
        });
        setCurrentUser(prev => prev ? { ...prev, favoritePlayerIds: (prev.favoritePlayerIds || []).filter(id => id !== targetUserId) } : null);
    }, [currentUser, setCurrentUser]);

    const updateGameSettings = useCallback(async (updates: Partial<GameSettings>) => {
        const settingsRef = doc(db, 'game_settings', 'main');
        await setDoc(settingsRef, updates, { merge: true });
        await fetchGameSettings();
    }, [fetchGameSettings]);
    
    const startHunt = useCallback(async (characterId: string, familiarId: string, locationId: string) => {
        if (!currentUser) throw new Error("Пользователь не авторизован.");
        
        const allUsers = await fetchUsersForAdmin();
        const location = gameSettings.huntingLocations?.find(l => l.id === locationId);
        if (!location) throw new Error("Локация не найдена.");

        let currentHuntsInLocation = 0;
        allUsers.forEach(user => {
            (user.characters || []).forEach(char => {
                (char.ongoingHunts || []).forEach(hunt => {
                    if (hunt.locationId === locationId) {
                        currentHuntsInLocation++;
                    }
                });
            });
        });

        if (currentHuntsInLocation >= (location.limit ?? 10)) {
            throw new Error(`В этой локации нет свободных мест. Попробуйте обновить страницу. (${currentHuntsInLocation}/${location.limit ?? 10})`);
        }

        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", currentUser.id);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw new Error("Пользователь не найден.");

            const userData = userDoc.data() as User;
            const charIndex = userData.characters.findIndex(c => c.id === characterId);
            if (charIndex === -1) throw new Error("Персонаж не найден.");
            
            const character = userData.characters[charIndex];
            const familiar = familiarsById[familiarId];
            if (!familiar) throw new Error("Фамильяр не найден.");

            const isFamiliarBusy = (character.ongoingHunts || []).some(h => h.familiarId === familiarId);
            if (isFamiliarBusy) {
                throw new Error("Этот фамильяр уже на охоте.");
            }

            const startedAt = new Date();
            const endsAt = new Date(startedAt.getTime() + location.durationMinutes * 60000);

            const newHunt: OngoingHunt = {
                huntId: `hunt-${Date.now()}-${familiarId.slice(0, 5)}`,
                characterId: character.id,
                characterName: character.name,
                familiarId,
                locationId,
                startedAt: startedAt.toISOString(),
                endsAt: endsAt.toISOString(),
            };
            
            character.ongoingHunts = [...(character.ongoingHunts || []), newHunt];
            userData.characters[charIndex] = character;
            
            let achievementIds = userData.achievementIds || [];
            if (!achievementIds.includes(FIRST_HUNT_ACHIEVEMENT_ID)) {
                achievementIds = [...achievementIds, FIRST_HUNT_ACHIEVEMENT_ID];
            }
            
            transaction.update(userRef, { characters: userData.characters, achievementIds });
        });

        const updatedUser = await fetchUserById(currentUser.id);
        if(updatedUser) setCurrentUser(updatedUser);

    }, [currentUser, familiarsById, gameSettings, fetchUserById, grantAchievementToUser, setCurrentUser, fetchUsersForAdmin]);

     const startMultipleHunts = useCallback(async (characterId: string, familiarIds: string[], locationId: string) => {
        if (!currentUser) throw new Error("Пользователь не авторизован.");
        
        const allUsers = await fetchUsersForAdmin();
        const location = gameSettings.huntingLocations?.find(l => l.id === locationId);
        if (!location) throw new Error("Локация не найдена.");

        let currentHuntsInLocation = 0;
        allUsers.forEach(user => {
            (user.characters || []).forEach(char => {
                (char.ongoingHunts || []).forEach(hunt => {
                    if (hunt.locationId === locationId) {
                        currentHuntsInLocation++;
                    }
                });
            });
        });

        const availableSlots = (location.limit ?? 10) - currentHuntsInLocation;

        if (availableSlots <= 0) {
            throw new Error("В этой локации нет свободных мест. Попробуйте обновить страницу.");
        }
        
        const familiarIdsToSend = familiarIds.slice(0, availableSlots);
        
        if (familiarIdsToSend.length < familiarIds.length) {
            toast({
                title: "Недостаточно мест",
                description: `Отправлено только ${familiarIdsToSend.length} фамильяров, так как в локации было ${availableSlots} свободных мест.`,
                variant: 'default',
            });
        }
        
        if (familiarIdsToSend.length === 0) {
            throw new Error("Нет доступных фамильяров для отправки или нет мест.");
        }
        
        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", currentUser.id);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw new Error("Пользователь не найден.");
            
            const userData = userDoc.data() as User;
            const charIndex = userData.characters.findIndex(c => c.id === characterId);
            if (charIndex === -1) throw new Error("Персонаж не найден.");
            
            const character = userData.characters[charIndex];

            const newHunts: OngoingHunt[] = [];
            const startedAt = new Date();
            const endsAt = new Date(startedAt.getTime() + location.durationMinutes * 60000);

            const busyFamiliarIds = new Set((character.ongoingHunts || []).map(h => h.familiarId));

            for (const familiarId of familiarIdsToSend) {
                const familiar = familiarsById[familiarId];
                if (!familiar) {
                    console.warn(`Familiar with id ${familiarId} not found, skipping.`);
                    continue;
                };
                if (busyFamiliarIds.has(familiarId)) {
                    console.warn(`Familiar with id ${familiarId} is already on a hunt, skipping.`);
                    continue;
                }
                
                const newHunt: OngoingHunt = {
                    huntId: `hunt-${Date.now()}-${familiarId.slice(0, 5)}-${Math.random().toString(36).substring(2, 7)}`,
                    characterId: character.id,
                    characterName: character.name,
                    familiarId,
                    locationId,
                    startedAt: startedAt.toISOString(),
                    endsAt: endsAt.toISOString(),
                };
                newHunts.push(newHunt);
            }
            
            character.ongoingHunts = [...(character.ongoingHunts || []), ...newHunts];
            
            userData.characters[charIndex] = character;
            
            let achievementIds = userData.achievementIds || [];
            if (!achievementIds.includes(FIRST_HUNT_ACHIEVEMENT_ID)) {
                achievementIds = [...achievementIds, FIRST_HUNT_ACHIEVEMENT_ID];
            }
            
            transaction.update(userRef, { characters: userData.characters, achievementIds });
        });
        
        const updatedUser = await fetchUserById(currentUser.id);
        if(updatedUser) setCurrentUser(updatedUser);

    }, [currentUser, gameSettings.huntingLocations, familiarsById, fetchUserById, setCurrentUser, grantAchievementToUser, fetchUsersForAdmin, toast]);

    const claimHuntReward = useCallback(async (characterId: string, huntId: string): Promise<InventoryItem[]> => {
        if (!currentUser) throw new Error("Пользователь не авторизован.");
        
        const character = currentUser.characters.find(c => c.id === characterId);
        if (!character) throw new Error("Персонаж не найден.");
        
        const huntIndex = (character.ongoingHunts || []).findIndex(h => h.huntId === huntId);
        if (huntIndex === -1) throw new Error("Охота не найдена.");
        
        const hunt = character.ongoingHunts![huntIndex];
        if (new Date(hunt.endsAt) > new Date()) {
            throw new Error("Охота еще не завершена.");
        }
        
        const familiar = familiarsById[hunt.familiarId];
        const location = gameSettings.huntingLocations?.find(l => l.id === hunt.locationId);
        if (!familiar || !location) throw new Error("Данные об охоте некорректны.");

        const allItems = [...(await fetchAllShops())].flatMap(shop => shop.items || []);
        const allItemsMap = new Map(allItems.map(item => [item.id, item]));

        const rewards: InventoryItem[] = [];
        (location.rewards || []).forEach(rewardRule => {
            let rankForReward = familiar.rank;
            if (rankForReward === 'ивентовый') {
                rankForReward = 'мифический';
            }
            const rewardData = rewardRule.rewardsByRank[rankForReward];
            if (rewardData && Math.random() * 100 < rewardData.chance) {
                const itemData = allItemsMap.get(rewardRule.itemId);
                if (itemData) {
                    rewards.push({
                        id: `inv-item-${Date.now()}-${Math.random()}`,
                        name: itemData.inventoryItemName || itemData.name,
                        description: itemData.inventoryItemDescription || itemData.description || '',
                        image: itemData.inventoryItemImage || itemData.image || '',
                        quantity: rewardData.quantity,
                        inventoryTag: itemData.inventoryTag || 'ингредиенты',
                    });
                }
            }
        });

        const updatedCharacter = { ...character };
        updatedCharacter.ongoingHunts = (updatedCharacter.ongoingHunts || []).filter(h => h.huntId !== huntId);

        const inventory = { ...updatedCharacter.inventory };
        rewards.forEach(reward => {
            const category = reward.inventoryTag;
            if (!category) return;
            if (!inventory[category]) (inventory as any)[category] = [];
            const categoryItems = inventory[category] as InventoryItem[];
            const existingItemIndex = categoryItems.findIndex(i => i.name === reward.name);
            if (existingItemIndex > -1) {
                categoryItems[existingItemIndex].quantity += reward.quantity;
            } else {
                categoryItems.push(reward);
            }
        });
        updatedCharacter.inventory = inventory;

        await updateCharacterInUser(currentUser.id, updatedCharacter);
        return rewards;

    }, [currentUser, familiarsById, gameSettings, updateCharacterInUser, fetchAllShops]);

    const claimAllHuntRewards = useCallback(async (characterId: string): Promise<InventoryItem[]> => {
        if (!currentUser) throw new Error("Пользователь не авторизован.");

        const character = currentUser.characters.find(c => c.id === characterId);
        if (!character) throw new Error("Персонаж не найден.");

        const finishedHunts = (character.ongoingHunts || []).filter((h: OngoingHunt) => isPast(new Date(h.endsAt)));
        if (finishedHunts.length === 0) return [];

        const allItems = [...(await fetchAllShops())].flatMap(shop => shop.items || []);
        const allItemsMap = new Map(allItems.map(item => [item.id, item]));

        const totalRewardsMap = new Map<string, InventoryItem>();
        const updatedCharacter: Character = JSON.parse(JSON.stringify(character)); // Deep copy to avoid mutation issues
        
        for (const hunt of finishedHunts) {
            const familiar = familiarsById[hunt.familiarId];
            const location = gameSettings.huntingLocations?.find(l => l.id === hunt.locationId);
            if (!familiar || !location) continue;

            (location.rewards || []).forEach(rewardRule => {
                let rankForReward = familiar.rank;
                if (rankForReward === 'ивентовый') {
                    rankForReward = 'мифический';
                }
                const rewardData = rewardRule.rewardsByRank[rankForReward];
                if (rewardData && Math.random() * 100 < rewardData.chance) {
                    const itemData = allItemsMap.get(rewardRule.itemId);
                    if (itemData) {
                        const itemName = (itemData as ShopItem).inventoryItemName || itemData.name;
                        const existingReward = totalRewardsMap.get(itemName);
    
                        if (existingReward) {
                            existingReward.quantity += rewardData.quantity;
                        } else {
                            totalRewardsMap.set(itemName, {
                                id: `inv-item-${Date.now()}-${Math.random()}`,
                                name: itemName,
                                description: (itemData as ShopItem).inventoryItemDescription || (itemData as ShopItem).description || '',
                                image: (itemData as ShopItem).inventoryItemImage || itemData.image || '',
                                quantity: rewardData.quantity,
                                inventoryTag: (itemData as ShopItem).inventoryTag || 'ингредиенты',
                            });
                        }
                    }
                }
            });
        }
        
        const totalRewards = Array.from(totalRewardsMap.values());

        // Add rewards to inventory
        const inventory = updatedCharacter.inventory;
        totalRewards.forEach(reward => {
            const category = reward.inventoryTag;
            if (!category) return;
            if (!inventory[category]) (inventory as any)[category] = [];
            const categoryItems = inventory[category] as InventoryItem[];
            const existingItemIndex = categoryItems.findIndex(i => i.name === reward.name);
            if (existingItemIndex > -1) {
                categoryItems[existingItemIndex].quantity += reward.quantity;
            } else {
                categoryItems.push(reward);
            }
        });
        
        const finishedHuntIds = new Set(finishedHunts.map((h: OngoingHunt) => h.huntId));
        updatedCharacter.ongoingHunts = (updatedCharacter.ongoingHunts || []).filter((h) => !finishedHuntIds.has(h.huntId));

        await updateCharacterInUser(currentUser.id, updatedCharacter);
        return totalRewards;
    }, [currentUser, familiarsById, gameSettings, updateCharacterInUser, fetchAllShops]);
    

    const recallHunt = useCallback(async (characterId: string, huntId: string) => {
        if (!currentUser) throw new Error("Пользователь не авторизован.");
        const character = currentUser.characters.find(c => c.id === characterId);
        if (!character) throw new Error("Персонаж не найден.");
        const updatedCharacter = { ...character, ongoingHunts: (character.ongoingHunts || []).filter(h => h.huntId !== huntId) };
        await updateCharacterInUser(currentUser.id, updatedCharacter);
    }, [currentUser, updateCharacterInUser]);
    
    const claimRewardsForOtherPlayer = useCallback(async (ownerUserId: string, characterId: string) => {
        if (!currentUser) {
            throw new Error("Пользователь не авторизован.");
        }
    
        const userToUpdate = await fetchUserById(ownerUserId);
        if (!userToUpdate) throw new Error("Пользователь не найден.");
    
        const charIndex = userToUpdate.characters.findIndex(c => c.id === characterId);
        if (charIndex === -1) throw new Error("Персонаж не найден.");
        
        const character = userToUpdate.characters[charIndex];
        const finishedHunts = (character.ongoingHunts || []).filter(h => isPast(new Date(h.endsAt)));
    
        if (finishedHunts.length === 0) {
            toast({ title: 'Нет готовых экспедиций', description: 'У этого персонажа нет завершенных охот для сбора.', variant: 'default'});
            return;
        }
    
        const allItems = [...(await fetchAllShops())].flatMap(shop => shop.items || []);
        const allItemsMap = new Map(allItems.map(item => [item.id, item]));
    
        const totalRewardsMap = new Map<string, InventoryItem>();
        const updatedCharacter: Character = JSON.parse(JSON.stringify(character)); // Deep copy
    
        for (const hunt of finishedHunts) {
            const familiar = familiarsById[hunt.familiarId];
            const location = gameSettings.huntingLocations?.find(l => l.id === hunt.locationId);
            if (!familiar || !location) continue;
    
            (location.rewards || []).forEach(rewardRule => {
                let rankForReward = familiar.rank;
                if (rankForReward === 'ивентовый') {
                    rankForReward = 'мифический';
                }
                const rewardData = rewardRule.rewardsByRank[rankForReward];
                if (rewardData && Math.random() * 100 < rewardData.chance) {
                    const itemData = allItemsMap.get(rewardRule.itemId);
                    if (itemData) {
                        const itemName = (itemData as ShopItem).inventoryItemName || itemData.name;
                        const existingReward = totalRewardsMap.get(itemName);
    
                        if (existingReward) {
                            existingReward.quantity += rewardData.quantity;
                        } else {
                            totalRewardsMap.set(itemName, {
                                id: `inv-item-${Date.now()}-${Math.random()}`,
                                name: itemName,
                                description: (itemData as ShopItem).inventoryItemDescription || (itemData as ShopItem).description || '',
                                image: (itemData as ShopItem).inventoryItemImage || itemData.image || '',
                                quantity: rewardData.quantity,
                                inventoryTag: (itemData as ShopItem).inventoryTag || 'ингредиенты',
                            });
                        }
                    }
                }
            });
        }
        
        const totalRewards = Array.from(totalRewardsMap.values());
        const inventory = updatedCharacter.inventory;
        totalRewards.forEach(reward => {
            const category = reward.inventoryTag;
            if (!category) return;
            if (!inventory[category]) (inventory as any)[category] = [];
            const categoryItems = inventory[category] as InventoryItem[];
            const existingItemIndex = categoryItems.findIndex(i => i.name === reward.name);
            if (existingItemIndex > -1) {
                categoryItems[existingItemIndex].quantity += reward.quantity;
            } else {
                categoryItems.push(reward);
            }
        });
        
        const finishedHuntIds = new Set(finishedHunts.map((h: OngoingHunt) => h.huntId));
        updatedCharacter.ongoingHunts = (updatedCharacter.ongoingHunts || []).filter((h) => !finishedHuntIds.has(h.huntId));
    
        const updatedCharacters = [...userToUpdate.characters];
        updatedCharacters[charIndex] = updatedCharacter;
        
        const rewardListString = totalRewards.length > 0 
            ? totalRewards.map(r => `${r.name} (x${r.quantity})`).join(', ')
            : 'Ничего (не повезло)';
    
        const mailContent = `Игрок ${currentUser.name} собрал добычу для вашего персонажа "${character.name}" из ${finishedHunts.length} завершенных экспедиций. Ваша добыча:\n\n${rewardListString}`;
    
        const mail: MailMessage = {
            id: `mail-other-claim-${Date.now()}`,
            senderUserId: currentUser.id,
            senderCharacterName: currentUser.name,
            recipientUserId: ownerUserId,
            recipientCharacterId: characterId,
            recipientCharacterName: character.name,
            subject: 'Добыча с охоты была собрана',
            content: mailContent,
            sentAt: new Date().toISOString(),
            isRead: false,
            type: 'personal',
        };
        
        const updatedMail = [...(userToUpdate.mail || []), mail];
    
        await updateUser(ownerUserId, { characters: updatedCharacters, mail: updatedMail });
    
    }, [currentUser, fetchUserById, updateUser, familiarsById, gameSettings.huntingLocations, fetchAllShops, toast]);

    const changeUserPassword = useCallback(async (currentPassword: string, newPassword: string) => {
        if (!firebaseUser || !firebaseUser.email) throw new Error("Пользователь не авторизован.");
        
        const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
        
        await reauthenticateWithCredential(firebaseUser, credential);
        await updatePassword(firebaseUser, newPassword);
    }, [firebaseUser]);
    
    const changeUserEmail = useCallback(async (currentPassword: string, newEmail: string) => {
        if (!firebaseUser || !firebaseUser.email) throw new Error("Пользователь не авторизован.");
        
        const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
        
        await reauthenticateWithCredential(firebaseUser, credential);
        await updateEmail(firebaseUser, newEmail);
        await updateUser(firebaseUser.uid, { email: newEmail });
    }, [firebaseUser, updateUser]);
    
    const mergeUserData = useCallback(async (sourceUserId: string, targetUserId: string) => {
        await runTransaction(db, async (transaction) => {
            const sourceUserRef = doc(db, 'users', sourceUserId);
            const targetUserRef = doc(db, 'users', targetUserId);
    
            const [sourceDoc, targetDoc] = await Promise.all([
                transaction.get(sourceUserRef),
                transaction.get(targetUserRef),
            ]);
    
            if (!sourceDoc.exists()) throw new Error(`Source user with ID ${sourceUserId} not found.`);
            if (!targetDoc.exists()) throw new Error(`Target user with ID ${targetUserId} not found.`);
    
            const sourceData = sourceDoc.data() as User;
            const targetData = targetDoc.data() as User;
    
            const targetCharIds = new Set(targetData.characters.map(c => c.id));
            const uniqueSourceChars = sourceData.characters.filter(c => !targetCharIds.has(c.id));
            const combinedCharacters = [...targetData.characters, ...uniqueSourceChars];
    
            const combinedPoints = (targetData.points || 0) + (sourceData.points || 0);
    
            const combinedPointHistory = [...(targetData.pointHistory || []), ...(sourceData.pointHistory || [])]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
            const combinedAchievementIds = Array.from(new Set([...(targetData.achievementIds || []), ...(sourceData.achievementIds || [])]));
            
             const combinedExtraSlots = (targetData.extraCharacterSlots || 0) + (sourceData.extraCharacterSlots || 0);

            const combinedMail = [...(targetData.mail || []), ...(sourceData.mail || [])];
            
            const combinedFavoriteIds = Array.from(new Set([...(targetData.favoritePlayerIds || []), ...(sourceData.favoritePlayerIds || [])]));

            transaction.update(targetUserRef, {
                characters: combinedCharacters,
                points: combinedPoints,
                pointHistory: combinedPointHistory,
                achievementIds: combinedAchievementIds,
                extraCharacterSlots: combinedExtraSlots,
                mail: combinedMail,
                favoritePlayerIds: combinedFavoriteIds,
            });
        });
    }, []);
  
    const userContextValue: UserContextType = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      gameDate: gameSettings.gameDate,
      gameDateString: gameSettings.gameDateString,
      gameSettings,
      lastWeeklyBonusAwardedAt: gameSettings.lastWeeklyBonusAwardedAt,
      fetchUserById,
      fetchCharacterById,
      fetchUsersForAdmin,
      fetchLeaderboardUsers,
      fetchAllRewardRequests,
      fetchRewardRequestsForUser,
      fetchAvailableMythicCardsCount,
      addPointsToUser,
      addPointsToAllUsers,
      updateCharacterInUser,
      deleteCharacterFromUser,
      updateUserStatus,
      updateUserRole,
      grantAchievementToUser,
      createNewUser,
      createRewardRequest,
      updateRewardRequestStatus,
      pullGachaForCharacter,
      giveAnyFamiliarToCharacter,
      clearPointHistoryForUser,
      clearAllPointHistories,
      addMoodletToCharacter,
      removeMoodletFromCharacter,
      clearRewardRequestsHistory,
      removeFamiliarFromCharacter,
      updateUser,
      updateUserAvatar,
      updateGameDate,
      updateGameSettings,
      processWeeklyBonus,
      checkExtraCharacterSlots,
      performRelationshipAction,
      recoverFamiliarsFromHistory,
      recoverAllFamiliars,
      addBankPointsToCharacter,
      transferCurrency,
      processMonthlySalary,
      updateCharacterWealthLevel,
      createExchangeRequest,
      fetchOpenExchangeRequests,
      acceptExchangeRequest,
      cancelExchangeRequest,
      createFamiliarTradeRequest,
      fetchFamiliarTradeRequestsForUser,
      acceptFamiliarTradeRequest,
      declineOrCancelFamiliarTradeRequest,
      fetchAllShops,
      fetchShopById,
      updateShopOwner,
      removeShopOwner,
      updateShopDetails,
      addShopItem,
      updateShopItem,
      deleteShopItem,
      purchaseShopItem,
      adminGiveItemToCharacter,
      adminUpdateItemInCharacter,
      adminDeleteItemFromCharacter,
      consumeInventoryItem,
      restockShopItem,
      adminUpdateCharacterStatus,
      adminUpdateShopLicense,
      processAnnualTaxes,
      sendMassMail,
      markMailAsRead,
      deleteMailMessage,
      clearAllMailboxes,
      updatePopularity,
      clearAllPopularityHistories,
      withdrawFromShopTill,
      brewPotion,
      addAlchemyRecipe,
      fetchAlchemyRecipes,
      updateAlchemyRecipe,
      deleteAlchemyRecipe,
      fetchDbFamiliars,
      addFamiliarToDb,
      deleteFamiliarFromDb,
      sendPlayerPing,
      deletePlayerPing,
      addFavoritePlayer,
      removeFavoritePlayer,
      allFamiliars,
      familiarsById,
      startHunt,
      startMultipleHunts,
      claimHuntReward,
      claimAllHuntRewards,
      recallHunt,
      claimRewardsForOtherPlayer,
      changeUserPassword,
      changeUserEmail,
      mergeUserData,
    }),
    [currentUser, setCurrentUser, gameSettings, fetchUserById, fetchCharacterById, fetchUsersForAdmin, fetchLeaderboardUsers, fetchAllRewardRequests, fetchRewardRequestsForUser, fetchAvailableMythicCardsCount, addPointsToUser, addPointsToAllUsers, updateCharacterInUser, deleteCharacterFromUser, updateUserStatus, updateUserRole, grantAchievementToUser, createNewUser, createRewardRequest, updateRewardRequestStatus, pullGachaForCharacter, giveAnyFamiliarToCharacter, clearPointHistoryForUser, clearAllPointHistories, addMoodletToCharacter, removeMoodletFromCharacter, clearRewardRequestsHistory, removeFamiliarFromCharacter, updateUser, updateUserAvatar, updateGameDate, updateGameSettings, processWeeklyBonus, checkExtraCharacterSlots, performRelationshipAction, recoverFamiliarsFromHistory, recoverAllFamiliars, addBankPointsToCharacter, transferCurrency, processMonthlySalary, updateCharacterWealthLevel, createExchangeRequest, fetchOpenExchangeRequests, acceptExchangeRequest, cancelExchangeRequest, createFamiliarTradeRequest, fetchFamiliarTradeRequestsForUser, acceptFamiliarTradeRequest, declineOrCancelFamiliarTradeRequest, fetchAllShops, fetchShopById, updateShopOwner, removeShopOwner, updateShopDetails, addShopItem, updateShopItem, deleteShopItem, purchaseShopItem, adminGiveItemToCharacter, adminUpdateItemInCharacter, adminDeleteItemFromCharacter, consumeInventoryItem, restockShopItem, adminUpdateCharacterStatus, adminUpdateShopLicense, processAnnualTaxes, sendMassMail, markMailAsRead, deleteMailMessage, clearAllMailboxes, updatePopularity, clearAllPopularityHistories, withdrawFromShopTill, brewPotion, addAlchemyRecipe, fetchAlchemyRecipes, updateAlchemyRecipe, deleteAlchemyRecipe, fetchDbFamiliars, addFamiliarToDb, deleteFamiliarFromDb, allFamiliars, familiarsById, startHunt, startMultipleHunts, claimHuntReward, claimAllHuntRewards, recallHunt, claimRewardsForOtherPlayer, changeUserPassword, changeUserEmail, mergeUserData, sendPlayerPing, deletePlayerPing, addFavoritePlayer, removeFavoritePlayer]
  );
    
    return (
        <AuthContext.Provider value={authValue}>
            <UserContext.Provider value={userContextValue}>
                {children}
            </UserContext.Provider>
        </AuthContext.Provider>
    );
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};

    
