

"use client";

import React, { createContext, useState, useMemo, useCallback, useEffect, useContext } from 'react';
import type { User, Character, PointLog, UserStatus, UserRole, RewardRequest, RewardRequestStatus, FamiliarCard, Moodlet, Inventory, GameSettings, Relationship, RelationshipAction, RelationshipActionType, BankAccount, WealthLevel, ExchangeRequest, Currency, FamiliarTradeRequest, FamiliarTradeRequestStatus, FamiliarRank, BankTransaction, Shop, ShopItem, InventoryItem, AdminGiveItemForm, InventoryCategory, CitizenshipStatus, TaxpayerStatus, PerformRelationshipActionParams, MailMessage, Cooldowns, PopularityLog, CharacterPopularityUpdate, OwnedFamiliarCard, AlchemyRecipe, Potion, AlchemyIngredient, PlayerPing, OngoingHunt, PlayerStatus, PlayPlatform, SocialLink, HuntingLocation, HuntReward } from '@/lib/types';
import { auth, db, database } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut, reauthenticateWithCredential, EmailAuthProvider, updatePassword, updateEmail } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, writeBatch, collection, getDocs, query, where, orderBy, deleteDoc, runTransaction, addDoc, collectionGroup, limit, startAfter, increment, FieldValue, arrayUnion, arrayRemove, deleteField, DocumentSnapshot, DocumentData } from "firebase/firestore";
import { ref as rtdbRef, onValue, set as rtdbSet } from 'firebase/database';
import { ALL_STATIC_FAMILIARS, EVENT_FAMILIARS, MOODLETS_DATA, DEFAULT_GAME_SETTINGS, WEALTH_LEVELS, ALL_SHOPS, SHOPS_BY_ID, POPULARITY_EVENTS, ALL_ACHIEVEMENTS, INVENTORY_CATEGORIES } from '@/lib/data';
import { differenceInDays, differenceInMonths, isPast } from 'date-fns';
import { getFunctions, httpsCallable, FunctionsError } from 'firebase/functions';
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
  fetchLeaderboardUsers: (lastVisible?: DocumentSnapshot<DocumentData> | null) => Promise<{ users: User[], lastVisible?: DocumentSnapshot<DocumentData> }>;
  fetchAllRewardRequests: () => Promise<RewardRequest[]>;
  fetchRewardRequestsForUser: (userId: string, fetchLimit?: number) => Promise<RewardRequest[]>;
  fetchAvailableMythicCardsCount: () => Promise<number>;
  addPointsToUser: (userId: string, amount: number, reason: string, characterId?: string) => Promise<User | null>;
  addPointsToAllUsers: (amount: number, reason: string) => Promise<{success: boolean, message: string}>;
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
  imageGeneration: (prompt: string) => Promise<{url: string} | {error: string}>;
  deleteUserFromAuth: (uid: string) => Promise<{success: boolean; message: string}>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  updateUserAvatar: (userId: string, avatarUrl: string) => Promise<void>;
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
    if (obj === undefined) return undefined;
    if (obj === null) return null;
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObjectForFirestore);
    }
    if (typeof obj === 'object' && obj.constructor === Object) {
      const newObj: { [key: string]: any } = {};
      for (const key in obj) {
        const value = obj[key];
        if (value !== undefined) {
          newObj[key] = sanitizeObjectForFirestore(value);
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
    const [gameDate, setGameDate] = useState<Date | null>(null);
    const [gameDateString, setGameDateString] = useState<string | null>(null);
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

    const functions = useMemo(() => getFunctions(), []);
    
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
    
    const fetchLeaderboardUsers = useCallback(async (lastVisible: DocumentSnapshot<DocumentData> | null = null): Promise<{ users: User[], lastVisible?: DocumentSnapshot<DocumentData> }> => {
        const PAGE_SIZE = 20;
        const usersCollection = collection(db, "users");
        let q;
        if (lastVisible) {
          q = query(usersCollection, orderBy("points", "desc"), startAfter(lastVisible), limit(PAGE_SIZE));
        } else {
          q = query(usersCollection, orderBy("points", "desc"), limit(PAGE_SIZE));
        }

        const userSnapshot = await getDocs(q);
        const users = await Promise.all(userSnapshot.docs.map(doc => processUserDoc(doc.data() as User)));
        
        const newLastVisible = userSnapshot.docs.length >= PAGE_SIZE 
            ? userSnapshot.docs[userSnapshot.docs.length - 1]
            : undefined;
        
        return {
            users: users.filter((user): user is User => user !== null),
            lastVisible: newLastVisible,
        };
    }, [processUserDoc]);
    
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

    const grantAchievementToUser = useCallback(async (userId: string, achievementId: string) => {
        const user = await fetchUserById(userId);
        if (!user) return;

        const achievementIds = user.achievementIds || [];
        if (!achievementIds.includes(achievementId)) {
            const updatedAchievementIds = [...achievementIds, achievementId];
            await updateUser(userId, { achievementIds: updatedAchievementIds });
        }
    }, [fetchUserById, updateUser]);

    const fetchCharacterById = useCallback(async (characterId: string): Promise<{ character: Character; owner: User } | null> => {
      try {
          const allUsers = await fetchUsersForAdmin();
          for (const user of allUsers) {
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
    }, [fetchUsersForAdmin]);
    
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
    }, [fetchUserById, currentUser?.id, setCurrentUser]);

    const addPointsToAllUsers = useCallback(async (amount: number, reason: string): Promise<{success: boolean, message: string}> => {
        try {
            const addPointsCallable = httpsCallable(functions, 'addPointsToAll');
            const result = await addPointsCallable({ amount, reason });
            const data = result.data as { success: boolean, message: string, processedCount?: number };

            if (data.success) {
                toast({
                    title: "Баллы успешно начислены!",
                    description: data.message || `Начислено ${data.processedCount || 'всем'} пользователям.`,
                });
                if (currentUser) {
                    const updatedUser = await fetchUserById(currentUser.id);
                    if(updatedUser) setCurrentUser(updatedUser);
                }
            } else {
                 toast({
                    variant: "destructive",
                    title: "Ошибка при начислении баллов",
                    description: data.message,
                });
            }
            return data;
        } catch (error) {
            console.error("Error calling addPointsToAll cloud function", error);
            if (error instanceof FunctionsError) {
                return { success: false, message: error.message };
            }
            return { success: false, message: 'Произошла неизвестная ошибка' };
        }
    }, [functions, toast, currentUser, fetchUserById, setCurrentUser]);
    
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
                setGameSettings(finalSettings);
            } else {
                await setDoc(doc(db, 'game_settings', 'main'), DEFAULT_GAME_SETTINGS);
                setGameSettings(DEFAULT_GAME_SETTINGS);
            }
        } catch (error) {
            console.error("Error fetching game settings. Using default.", error);
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
    
    const createNewUser = useCallback(async (uid: string, nickname: string): Promise<User> => {
        const formattedNickname = nickname
            .trim()
            .split(' ')
            .filter(word => word.length > 0)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        
        let newUser: User = {
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
          // Return the processed user to ensure all defaults are applied
          return processUserDoc(newUser);
        } catch(error) {
          console.error("Error creating user in Firestore:", error);
          throw error;
        }
    }, [processUserDoc]);

    const processWeeklyBonus = useCallback(async () => {
        const allUsersSnapshot = await getDocs(query(collection(db, 'users')));
        const allUsers = allUsersSnapshot.docs.map(d => processUserDoc(d.data() as User));

        await runTransaction(db, async (transaction) => {
            const settingsRef = doc(db, 'game_settings', 'main');
            const settingsDoc = await transaction.get(settingsRef);
            const settings = (settingsDoc.data() || DEFAULT_GAME_SETTINGS) as GameSettings;
            const now = new Date();
            const lastAwarded = settings.lastWeeklyBonusAwardedAt ? new Date(settings.lastWeeklyBonusAwardedAt) : new Date(0);
            
            if (differenceInDays(now, lastAwarded) < 7) {
              return; 
            }
            
            transaction.update(settingsRef, { lastWeeklyBonusAwardedAt: now.toISOString() });
            
            for (const user of allUsers) {
                const userRef = doc(db, "users", user.id);
                const lastLogin = user.lastLogin ? new Date(user.lastLogin) : new Date(0);
                
                const updates: {[key: string]: any} = {};

                if (differenceInMonths(new Date(), lastLogin) >= 1 && user.status !== 'отпуск' && user.status !== 'неактивный') {
                    updates.status = 'неактивный';
                }
        
                if (user.status === 'активный') {
                    let totalBonus = 800;
                    let reason = "Еженедельный бонус за активность";
                    const popularityPoints = (user.characters || []).reduce((acc, char) => acc + (char.popularity ?? 0), 0);
                    if (popularityPoints > 0) {
                        totalBonus += popularityPoints;
                        reason += ` и популярность (${popularityPoints})`;
                    }
                    
                    const newPointLog: PointLog = { id: `h-weekly-${Date.now()}-${user.id.slice(0, 4)}`, date: now.toISOString(), amount: totalBonus, reason };
                    
                    updates.points = increment(totalBonus);
                    updates.pointHistory = arrayUnion(newPointLog);
                }

                if (Object.keys(updates).length > 0) {
                    transaction.update(userRef, updates);
                }
            }
        });
        
        await fetchGameSettings();
        return { awardedCount: 0 };
    }, [fetchGameSettings, processUserDoc]);


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
                    if(userData?.role === 'admin') {
                        await processWeeklyBonus();
                    }
                } else {
                    const nickname = user.displayName || user.email?.split('@')[0] || 'Пользователь';
                    userData = await createNewUser(user.uid, nickname);
                }

                setCurrentUser(userData);
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
    
    useEffect(() => {
        if (!firebaseUser) return;

        const dateRef = rtdbRef(database, 'calendar/currentDate');
        const connectionTimeout = setTimeout(() => {
            setGameDateString((current) => {
                if (current === null) { // Check if it's still in the initial loading state
                    console.error("Realtime Database connection timed out. Check security rules and database path: /calendar/currentDate");
                    return "Ошибка: нет доступа к базе данных. Проверьте правила безопасности Realtime Database в консоли Firebase.";
                }
                return current;
            });
        }, 8000); 

        const unsubscribe = onValue(dateRef, 
            (snapshot) => {
                clearTimeout(connectionTimeout);
                const rtdbDateString = snapshot.val();
                
                if (rtdbDateString && typeof rtdbDateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rtdbDateString)) {
                    const [year, month, day] = rtdbDateString.split('-').map(Number);
                    
                    const newGameDate = new Date(year, month - 1, day);
                    setGameDate(newGameDate);
                    
                    const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
                    setGameDateString(`${day} ${months[month - 1]} ${year} год`);
                } else {
                    console.warn(`Invalid or null date from Realtime DB: "${rtdbDateString}". Expected YYYY-MM-DD.`);
                    setGameDateString("Дата не установлена");
                    setGameDate(null);
                }

            }, 
            (error: Error) => {
                clearTimeout(connectionTimeout);
                console.error("Firebase Realtime Database read failed:", error);
                const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as any).code) : 'unknown';
                setGameDateString(`Ошибка RTDB: ${code}`);
                setGameDate(null);
            }
        );

        return () => {
            clearTimeout(connectionTimeout);
            unsubscribe();
        };
    }, [firebaseUser]);

    const signOutUser = useCallback(() => {
        signOut(auth);
    }, []);

    const authValue = useMemo(() => ({
        user: firebaseUser,
        loading,
        signOutUser,
    }), [firebaseUser, loading, signOutUser]);
    
    // ... other useCallback hooks
    
    const userContextValue = useMemo(
        () => ({
          currentUser,
          setCurrentUser,
          gameDate,
          gameDateString,
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
          updateAlchemyRecipe,
          deleteAlchemyRecipe,
          fetchAlchemyRecipes,
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
          imageGeneration,
          deleteUserFromAuth
        }),
        [currentUser, setCurrentUser, gameDate, gameDateString, gameSettings, fetchUserById, fetchCharacterById, fetchUsersForAdmin, fetchLeaderboardUsers, fetchAllRewardRequests, fetchRewardRequestsForUser, fetchAvailableMythicCardsCount, addPointsToUser, addPointsToAllUsers, updateCharacterInUser, deleteCharacterFromUser, updateUserStatus, updateUserRole, grantAchievementToUser, createNewUser, createRewardRequest, updateRewardRequestStatus, pullGachaForCharacter, giveAnyFamiliarToCharacter, clearPointHistoryForUser, clearAllPointHistories, addMoodletToCharacter, removeMoodletFromCharacter, clearRewardRequestsHistory, removeFamiliarFromCharacter, updateUser, updateUserAvatar, updateGameSettings, processWeeklyBonus, checkExtraCharacterSlots, performRelationshipAction, recoverFamiliarsFromHistory, recoverAllFamiliars, addBankPointsToCharacter, transferCurrency, processMonthlySalary, updateCharacterWealthLevel, createExchangeRequest, fetchOpenExchangeRequests, acceptExchangeRequest, cancelExchangeRequest, createFamiliarTradeRequest, fetchFamiliarTradeRequestsForUser, acceptFamiliarTradeRequest, declineOrCancelFamiliarTradeRequest, fetchAllShops, fetchShopById, updateShopOwner, removeShopOwner, updateShopDetails, addShopItem, updateShopItem, deleteShopItem, purchaseShopItem, adminGiveItemToCharacter, adminUpdateItemInCharacter, adminDeleteItemFromCharacter, consumeInventoryItem, restockShopItem, adminUpdateCharacterStatus, adminUpdateShopLicense, processAnnualTaxes, sendMassMail, markMailAsRead, deleteMailMessage, clearAllMailboxes, updatePopularity, clearAllPopularityHistories, withdrawFromShopTill, brewPotion, addAlchemyRecipe, updateAlchemyRecipe, deleteAlchemyRecipe, fetchAlchemyRecipes, fetchDbFamiliars, addFamiliarToDb, deleteFamiliarFromDb, allFamiliars, familiarsById, startHunt, startMultipleHunts, claimHuntReward, claimAllHuntRewards, recallHunt, claimRewardsForOtherPlayer, changeUserPassword, changeUserEmail, mergeUserData, sendPlayerPing, deletePlayerPing, addFavoritePlayer, removeFavoritePlayer, imageGeneration, deleteUserFromAuth]
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
    


    

    