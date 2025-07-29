

"use client";

import React, { createContext, useState, useMemo, useCallback, useEffect, useContext } from 'react';
import type { User, Character, PointLog, UserStatus, UserRole, RewardRequest, RewardRequestStatus, FamiliarCard, Moodlet, Inventory, GameSettings, Relationship, RelationshipAction, RelationshipActionType, BankAccount, WealthLevel, ExchangeRequest, Currency, FamiliarTradeRequest, FamiliarTradeRequestStatus, FamiliarRank, BankTransaction, Shop, ShopItem, InventoryItem, AdminGiveItemForm, InventoryCategory, CitizenshipStatus, TaxpayerStatus, PerformRelationshipActionParams } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, writeBatch, collection, getDocs, query, where, orderBy, deleteDoc, runTransaction, addDoc, collectionGroup, limit, startAfter } from "firebase/firestore";
import { ALL_FAMILIARS, FAMILIARS_BY_ID, MOODLETS_DATA, DEFAULT_GAME_SETTINGS, WEALTH_LEVELS, FAME_LEVELS_POINTS, ALL_SHOPS, SHOPS_BY_ID } from '@/lib/data';
import { differenceInDays } from 'date-fns';

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

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  gameDate: Date | null;
  gameDateString: string | null;
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
  updateCharacterInUser: (userId: string, character: Character) => Promise<void>;
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
  processWeeklyBonus: () => Promise<{awardedCount: number, isOverdue: boolean}>;
  checkExtraCharacterSlots: (userId: string) => Promise<number>;
  performRelationshipAction: (params: PerformRelationshipActionParams) => Promise<void>;
  recoverFamiliarsFromHistory: (userId: string, characterId: string, oldCharacterName?: string) => Promise<number>;
  addBankPointsToCharacter: (userId: string, characterId: string, amount: Partial<BankAccount>, reason: string) => Promise<void>;
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
  updateShopDetails: (shopId: string, details: { title?: string; description?: string }) => Promise<void>;
  addShopItem: (shopId: string, item: Omit<ShopItem, 'id'>) => Promise<void>;
  updateShopItem: (shopId: string, item: ShopItem) => Promise<void>;
  deleteShopItem: (shopId: string, itemId: string) => Promise<void>;
  purchaseShopItem: (shopId: string, itemId: string, buyerUserId: string, buyerCharacterId: string, quantity: number) => Promise<void>;
  adminGiveItemToCharacter: (userId: string, characterId: string, itemData: AdminGiveItemForm) => Promise<void>;
  adminUpdateItemInCharacter: (userId: string, characterId: string, itemData: InventoryItem, category: InventoryCategory) => Promise<void>;
  adminDeleteItemFromCharacter: (userId: string, characterId: string, itemId: string, category: InventoryCategory) => Promise<void>;
  consumeInventoryItem: (userId: string, characterId: string, itemId: string, category: InventoryCategory) => Promise<void>;
  restockShopItem: (shopId: string, itemId: string, ownerUserId: string, ownerCharacterId: string) => Promise<void>;
  adminUpdateCharacterStatus: (userId: string, characterId: string, updates: { taxpayerStatus?: TaxpayerStatus; citizenshipStatus?: CitizenshipStatus }) => Promise<void>;
  adminUpdateShopLicense: (shopId: string, hasLicense: boolean) => Promise<void>;
  processAnnualTaxes: () => Promise<{ taxedCharactersCount: number; totalTaxesCollected: BankAccount }>;
  sendMassMail: (subject: string, content: string, senderName: string) => Promise<void>;
  markMailAsRead: (mailId: string) => Promise<void>;
  deleteMailMessage: (mailId: string) => Promise<void>;
}

export const UserContext = createContext<UserContextType | null>(null);

const ADMIN_UIDS = ['Td5P02zpyaMR3IxCY9eCf7gcYky1', 'yawuIwXKVbNhsBQSqWfGZyAzZ3A3'];
const ROULETTE_COST = 5000;
const DUPLICATE_REFUND = 1000;
const FIRST_PULL_ACHIEVEMENT_ID = 'ach-first-gacha';
const MYTHIC_PULL_ACHIEVEMENT_ID = 'ach-mythic-pull';
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

const RELATIONSHIP_POINTS_CONFIG: Record<RelationshipActionType, number> = {
    подарок: 25,
    письмо: 10,
};

const drawFamiliarCard = (hasBlessing: boolean, unavailableMythicIds: Set<string>): FamiliarCard => {
    
    let rand = Math.random() * 100;

    const chances = {
        мифический: 2,
        легендарный: 10,
        редкий: 25,
    };
    
    if (hasBlessing) {
        chances.мифический = 5;
        chances.легендарный = 20;
        chances.редкий = 40;
    }
    
    const availableCards = ALL_FAMILIARS;

    const availableMythic = availableCards.filter(c => c.rank === 'мифический' && !unavailableMythicIds.has(c.id));
    const availableLegendary = availableCards.filter(c => c.rank === 'легендарный');
    const availableRare = availableCards.filter(c => c.rank === 'редкий');
    const availableCommon = availableCards.filter(c => c.rank === 'обычный');

    let chosenPool: FamiliarCard[] = [];

    if (rand < chances.мифический && availableMythic.length > 0) {
        chosenPool = availableMythic;
    } else if (rand < chances.мифический + chances.легендарный && availableLegendary.length > 0) {
        chosenPool = availableLegendary;
    } else if (rand < chances.мифический + chances.легендарный + chances.редкий && availableRare.length > 0) {
        chosenPool = availableCommon;
    } else { 
        chosenPool = availableCommon;
    }
    
    if (chosenPool.length === 0) {
        if (availableCommon.length > 0) {
            chosenPool = availableCommon;
        } else if (availableRare.length > 0) {
            chosenPool = availableRare;
        } else if (availableLegendary.length > 0) {
            chosenPool = availableLegendary;
        } else if (availableMythic.length > 0) {
            chosenPool = availableMythic;
        } else {
            // Fallback to all non-event cards if somehow all pools are empty
            chosenPool = ALL_FAMILIARS.filter(c => c.rank !== 'ивентовый');
        }
    }

    return chosenPool[Math.floor(Math.random() * chosenPool.length)];
};


export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchGameSettings = useCallback(async () => {
    try {
        const settingsRef = doc(db, 'game_settings', 'main');
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
            const data = docSnap.data() as GameSettings;
            const dateStr = data.gameDateString;
            const dateParts = dateStr.match(/(\d+)\s(\S+)\s(\d+)/);
            let finalSettings: GameSettings = { ...DEFAULT_GAME_SETTINGS, ...data };
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

  const updateGameDate = useCallback(async (newDateString: string) => {
    const settingsRef = doc(db, 'game_settings', 'main');
    await updateDoc(settingsRef, { gameDateString: newDateString });
    await fetchGameSettings();
  }, [fetchGameSettings]);

  const initialFormData: Omit<Character, 'id'> = useMemo(() => ({
    name: '',
    activity: '',
    race: '',
    birthDate: '',
    accomplishments: [],
    workLocation: '',
    factions: '',
    appearance: '',
    personality: '',
    biography: '',
    diary: '',
    training: [],
    relationships: [],
    marriedTo: [],
    abilities: '',
    weaknesses: '',
    lifeGoal: '',
    pets: '',
    criminalRecords: '',
    familiarCards: [],
    moodlets: [],
    inventory: {
        оружие: [],
        гардероб: [],
        еда: [],
        подарки: [],
        артефакты: [],
        зелья: [],
        недвижимость: [],
        транспорт: [],
        familiarCards: [],
        драгоценности: [],
        книгиИСвитки: [],
        прочее: [],
        предприятия: [],
        души: [],
        мебель: [],
    },
    bankAccount: { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] },
    wealthLevel: 'Бедный',
    crimeLevel: 5,
    countryOfResidence: '',
    citizenshipStatus: 'non-citizen',
    taxpayerStatus: 'taxable',
  }), []);

  const fetchUserById = useCallback(async (userId: string): Promise<User | null> => {
      const userRef = doc(db, "users", userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
          const userData = docSnap.data() as User;
           userData.characters = userData.characters?.map(char => ({
                ...initialFormData,
                ...char,
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
                inventory: { ...initialFormData.inventory, ...(char.inventory || {}) },
                moodlets: char.moodlets || [],
            })) || [];
           userData.achievementIds = userData.achievementIds || [];
           userData.extraCharacterSlots = userData.extraCharacterSlots || 0;
           userData.pointHistory = userData.pointHistory || [];
           userData.mail = userData.mail || [];
          return userData;
      }
      return null;
  }, [initialFormData]);
  
  const fetchCharacterById = useCallback(async (characterId: string): Promise<{ character: Character; owner: User } | null> => {
    const usersCollection = collection(db, "users");
    const snapshot = await getDocs(usersCollection);
    
    for (const doc of snapshot.docs) {
        const user = doc.data() as User;
        const character = user.characters?.find(c => c.id === characterId);
        if (character) {
             const fullUser = await fetchUserById(user.id);
             if (!fullUser) return null;
             const fullCharacter = fullUser.characters.find(c => c.id === characterId);
             if (!fullCharacter) return null;

             return { character: fullCharacter, owner: fullUser };
        }
    }
    
    return null;
  }, [fetchUserById]);

  const createNewUser = useCallback(async (uid: string, nickname: string): Promise<User> => {
    const newUser: User = {
        id: uid,
        name: nickname,
        email: `${nickname.toLowerCase().replace(/\s/g, '')}@pumpkin.com`,
        avatar: `https://placehold.co/100x100/A050A0/FFFFFF.png?text=${nickname.charAt(0)}`,
        role: ADMIN_UIDS.includes(uid) ? 'admin' : 'user',
        points: 1000,
        status: 'активный',
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
            let userData = await fetchUserById(user.uid);
            if (!userData) {
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
  }, [createNewUser, fetchUserById, fetchGameSettings]);


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
            };
        });
        return users;
    }, []);

  const fetchUsersForAdmin = useCallback(async (): Promise<User[]> => {
    try {
        const usersCollection = collection(db, "users");
        const userSnapshot = await getDocs(query(usersCollection, orderBy("points", "desc")));
        const users = userSnapshot.docs.map(doc => {
            const userData = doc.data() as User;
            userData.characters = userData.characters?.map(char => ({
                ...initialFormData,
                ...char,
                 bankAccount:
                    typeof char.bankAccount !== 'object' || char.bankAccount === null
                      ? { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] }
                      : {
                          platinum: char.bankAccount.platinum ?? 0,
                          gold: char.bankAccount.gold ?? 0,
                          silver: char.bankAccount.silver ?? 0,
                          copper: char.bankAccount.copper ?? 0,
                          history: Array.isArray(char.bankAccount.history) ? char.bankAccount.history : [],
                        },
                inventory: { ...initialFormData.inventory, ...(char.inventory || {}) },
                moodlets: char.moodlets || [],
            })) || [];
            userData.achievementIds = userData.achievementIds || [];
            userData.pointHistory = userData.pointHistory || [];
            userData.mail = userData.mail || [];
            return userData;
        });
        return users;
    } catch(error) {
        console.error("Error fetching users for admin.", error);
        throw error;
    }
  }, [initialFormData]);

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


  const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, updates);
      
      if (currentUser?.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
      }
  }, [currentUser?.id]);
  
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
  
  const addPointsToAllUsers = useCallback(async (amount: number, reason: string) => {
    const allUsers = await fetchUsersForAdmin();
    const batch = writeBatch(db);
    
    for (const user of allUsers) {
        const userRef = doc(db, "users", user.id);
        const newPointLog: PointLog = {
            id: `h-${Date.now()}-${user.id.slice(0, 4)}`,
            date: new Date().toISOString(),
            amount,
            reason,
        };
        const newPoints = user.points + amount;
        const newHistory = [newPointLog, ...user.pointHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        batch.update(userRef, { points: newPoints, pointHistory: newHistory });
    }

    await batch.commit();

    if (currentUser) {
        const updatedCurrentUser = await fetchUserById(currentUser.id);
        setCurrentUser(updatedCurrentUser);
    }
  }, [fetchUsersForAdmin, fetchUserById, currentUser]);

  const addCharacterToUser = useCallback(async (userId: string, characterData: Character) => {
    const user = await fetchUserById(userId);
    if (!user) return;

    const updatedCharacters = [...user.characters, characterData];
    await updateUser(userId, { characters: updatedCharacters });
  }, [fetchUserById, updateUser]);

  const updateCharacterInUser = useCallback(async (userId: string, characterToUpdate: Character) => {
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
            sanitized.inventory = { ...initialFormData.inventory, ...(sanitized.inventory || {}) };
            sanitized.bankAccount = { ...initialFormData.bankAccount, ...(sanitized.bankAccount || {}) };
            
            const arrayFields: (keyof Character)[] = ['accomplishments', 'training', 'relationships', 'marriedTo', 'moodlets'];
            arrayFields.forEach(field => {
                if (!Array.isArray(sanitized[field])) {
                    (sanitized as any)[field] = [];
                }
            });
            
             // Ensure familiarCards is part of inventory
            if (sanitized.inventory && !Array.isArray(sanitized.inventory.familiarCards)) {
                sanitized.inventory.familiarCards = [];
            }
            // remove root familiarCards
            delete sanitized.familiarCards;

            const stringFields: (keyof Character)[] = ['factions', 'abilities', 'weaknesses', 'lifeGoal', 'pets', 'criminalRecords', 'appearanceImage', 'diary', 'workLocation', 'blessingExpires'];
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
    if (updatedUser) {
      if (currentUser?.id === userId) {
        setCurrentUser(updatedUser);
      }
    }
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
                let inventory = characterToUpdate.inventory || { оружие: [], гардероб: [], еда: [], подарки: [], артефакты: [], зелья: [], недвижимость: [], транспорт: [], familiarCards: [] };

                if (request.rewardId === PUMPKIN_WIFE_REWARD_ID) {
                     inventory.familiarCards = [...(inventory.familiarCards || []), { id: PUMPKIN_WIFE_CARD_ID }];
                } else if (request.rewardId === PUMPKIN_HUSBAND_REWARD_ID) {
                   inventory.familiarCards = [...(inventory.familiarCards || []), { id: PUMPKIN_HUSBAND_CARD_ID }];
                } else if (request.rewardId === 'r-blessing') {
                    const expiryDate = new Date();
                    expiryDate.setDate(expiryDate.getDate() + 5);
                    characterToUpdate.blessingExpires = expiryDate.toISOString();
                } else if (request.rewardId === 'r-leviathan') {
                    characterToUpdate.hasLeviathanFriendship = true;
                } else if (request.rewardId === 'r-crime-connections') {
                    characterToUpdate.hasCrimeConnections = true;
                }
                
                characterToUpdate.inventory = inventory;
                updatedCharacters[characterToUpdateIndex] = characterToUpdate;
                updatesForUser.characters = updatedCharacters;
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

  const fetchAvailableMythicCardsCount = useCallback(async (): Promise<number> => {
    const allUsers = await fetchUsersForAdmin();
    const allMythicCards = ALL_FAMILIARS.filter(c => c.rank === 'мифический');
    const claimedMythicIds = new Set<string>();

    for (const user of allUsers) {
        for (const character of user.characters) {
            const inventory = character.inventory || { familiarCards: [] };
            for (const card of (inventory.familiarCards || [])) {
                const cardDetails = FAMILIARS_BY_ID[card.id];
                if (cardDetails && cardDetails.rank === 'мифический') {
                    claimedMythicIds.add(card.id);
                }
            }
        }
    }
    return allMythicCards.length - claimedMythicIds.size;
  }, [fetchUsersForAdmin]);

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

        const hasCards = character.inventory?.familiarCards && character.inventory.familiarCards.length > 0;
        const hasHistory = user.pointHistory.some(log => log.characterId === characterId && log.reason.includes('Рулетка'));
        const isFirstPullForChar = !hasCards && !hasHistory;
        
        const cost = isFirstPullForChar ? 0 : ROULETTE_COST;
        if (user.points < cost) throw new Error("Недостаточно очков.");
        let finalPointChange = -cost;

        const allUsersSnapshot = await getDocs(collection(db, 'users'));
        const claimedMythicIds = new Set<string>();
        allUsersSnapshot.forEach(doc => {
            const u = doc.data() as User;
            (u.characters || []).forEach(c => {
                (c.inventory?.familiarCards || []).forEach(cardRef => {
                    const cardDetails = FAMILIARS_BY_ID[cardRef.id];
                    if(cardDetails && cardDetails.rank === 'мифический') {
                        claimedMythicIds.add(cardRef.id);
                    }
                });
            });
        });

        const hasBlessing = character.blessingExpires ? new Date(character.blessingExpires) > new Date() : false;
        newCard = drawFamiliarCard(hasBlessing, claimedMythicIds);
        
        const ownedCardIds = new Set((character.inventory?.familiarCards || []).map(c => c.id));
        isDuplicate = ownedCardIds.has(newCard.id);
        
        const updatedUser = { ...user };
        let reason = `Рулетка: получена карта ${newCard.name} (${newCard.rank})`;
        
        if (isDuplicate) {
            finalPointChange += DUPLICATE_REFUND;
            reason = `Рулетка: дубликат ${newCard.name}, возврат ${DUPLICATE_REFUND} баллов`;
        } else {
            const updatedCharacter = { ...character };
            const inventory = updatedCharacter.inventory || { оружие: [], гардероб: [], еда: [], подарки: [], артефакты: [], зелья: [], недвижимость: [], транспорт: [], familiarCards: [] };
            inventory.familiarCards = [...(inventory.familiarCards || []), { id: newCard.id }];
            updatedCharacter.inventory = inventory;
            
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
  }, []);
  

  const giveAnyFamiliarToCharacter = useCallback(async (userId: string, characterId: string, familiarId: string) => {
    const user = await fetchUserById(userId);
    if (!user) return;

    const characterIndex = user.characters.findIndex(c => c.id === characterId);
    if (characterIndex === -1) return;

    const familiar = FAMILIARS_BY_ID[familiarId];
    if (!familiar) return;

    const character = { ...user.characters[characterIndex] };
    const inventory = character.inventory || { оружие: [], гардероб: [], еда: [], подарки: [], артефакты: [], зелья: [], недвижимость: [], транспорт: [], familiarCards: [] };
    
    inventory.familiarCards = [...(inventory.familiarCards || []), { id: familiarId }];
    character.inventory = inventory;

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
  }, [fetchUserById, updateUser]);
  
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

    const characterIndex = user.characters.findIndex(char => char.id === characterId);
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

      const characterIndex = user.characters.findIndex(char => char.id === characterId);
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

    const characterIndex = user.characters.findIndex(char => char.id === characterId);
    if (characterIndex === -1) throw new Error("Character not found");

    const character = { ...user.characters[characterIndex] };
    const inventory = character.inventory || { оружие: [], гардероб: [], еда: [], подарки: [], артефакты: [], зелья: [], недвижимость: [], транспорт: [], familiarCards: [] };
    const ownedCards = inventory.familiarCards || [];

    const cardIndexToRemove = ownedCards.findIndex(card => card.id === cardId);
    if (cardIndexToRemove === -1) throw new Error("Card not found on character");

    const updatedCards = [...ownedCards];
    updatedCards.splice(cardIndexToRemove, 1);
    inventory.familiarCards = updatedCards;
    character.inventory = inventory;

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
    const { sourceUserId, sourceCharacterId, targetCharacterId, actionType, description, itemId, itemCategory, content } = params;

    await runTransaction(db, async (transaction) => {
        // --- 1. Get all necessary documents ---
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

        // --- 2. Find characters and relationships ---
        const sourceCharIndex = sourceUserData.characters.findIndex(c => c.id === sourceCharacterId);
        if (sourceCharIndex === -1) throw new Error("Исходный персонаж не найден.");
        const sourceChar = sourceUserData.characters[sourceCharIndex];

        const targetCharIndex = targetUserData.characters.findIndex(c => c.id === targetCharacterId);
        if (targetCharIndex === -1) throw new Error("Целевой персонаж не найден.");
        const targetChar = targetUserData.characters[targetCharIndex];
        
        // --- 3. Handle item transfer or mail ---
        if (actionType === 'подарок') {
            if (!itemId || !itemCategory) throw new Error("Для подарка требуется указать предмет.");
            
            const sourceInventory = sourceChar.inventory || initialFormData.inventory;
            const categoryItems = (sourceInventory[itemCategory] as InventoryItem[] | undefined) || [];
            const itemIndex = categoryItems.findIndex(i => i.id === itemId);

            if (itemIndex === -1) throw new Error("Предмет для подарка не найден в инвентаре.");
            const itemToGift = { ...categoryItems[itemIndex] };

            // Remove from source
            if (itemToGift.quantity > 1) {
                categoryItems[itemIndex].quantity -= 1;
            } else {
                categoryItems.splice(itemIndex, 1);
            }
            sourceInventory[itemCategory] = categoryItems;

            // Add to target
            const targetInventory = targetChar.inventory || initialFormData.inventory;
            const targetCategoryItems = (targetInventory[itemCategory] as InventoryItem[] | undefined) || [];
            const existingTargetItemIndex = targetCategoryItems.findIndex(i => i.name === itemToGift.name);

            if (existingTargetItemIndex > -1) {
                 targetCategoryItems[existingTargetItemIndex].quantity += 1;
            } else {
                targetCategoryItems.push({ ...itemToGift, id: `inv-${Date.now()}`, quantity: 1 });
            }
            targetInventory[itemCategory] = targetCategoryItems;
            
            sourceChar.inventory = sourceInventory;
            targetChar.inventory = targetInventory;
        } else if (actionType === 'письмо') {
             if (!content) throw new Error("Содержание письма не может быть пустым.");

            const newMail = {
                id: `mail-${Date.now()}`,
                senderCharacterName: sourceChar.name,
                senderCharacterId: sourceChar.id,
                recipientUserId: targetUserId,
                recipientCharacterId: targetCharacterId,
                subject: `Письмо от ${sourceChar.name}`,
                content: content,
                sentAt: new Date().toISOString(),
                isRead: false,
                type: 'personal' as const,
            };
            targetUserData.mail = [...(targetUserData.mail || []), newMail];
        }

        // --- 4. Update relationship points and history ---
        const updateRelationship = (character: Character, otherCharId: string, points: number, action: RelationshipAction) => {
            const relIndex = (character.relationships || []).findIndex(r => r.targetCharacterId === otherCharId);
            if (relIndex === -1) return; // Should not happen if UI is correct

            const relationship = character.relationships[relIndex];
            relationship.points += points;
            const now = new Date();
            if (action.type === 'подарок') relationship.lastGiftSentAt = now.toISOString();
            if (action.type === 'письмо') relationship.lastLetterSentAt = now.toISOString();
            relationship.history = [...(relationship.history || []), action];
        };

        const newAction: RelationshipAction = {
            id: `act-${Date.now()}`, type: actionType, date: new Date().toISOString(), description, status: 'confirmed',
        };
        const pointsToAdd = RELATIONSHIP_POINTS_CONFIG[actionType];

        updateRelationship(sourceChar, targetCharacterId, pointsToAdd, newAction);
        updateRelationship(targetChar, sourceCharacterId, pointsToAdd, newAction);

        // --- 5. Commit transaction ---
        transaction.update(sourceUserRef, { characters: sourceUserData.characters });
        transaction.update(targetUserDoc.ref, { characters: targetUserData.characters, mail: targetUserData.mail });
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
                const foundCard = ALL_FAMILIARS.find(c => c.name === cardName);
                if (foundCard) {
                    historicalCardWins.add(foundCard.id);
                }
            }
        }
    });
    
    const inventory = character.inventory || { оружие: [], гардероб: [], еда: [], подарки: [], артефакты: [], зелья: [], недвижимость: [], транспорт: [], familiarCards: [] };
    const currentOwnedCardIds = new Set((inventory.familiarCards || []).map(c => c.id));
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
            const updatedInventory = { ...inventory };
            updatedInventory.familiarCards = [...(updatedInventory.familiarCards || []), ...cardsToAdd];
            updatedCharacter.inventory = updatedInventory;

            const updatedCharacters = [...user.characters];
            updatedCharacters[characterIndex] = updatedCharacter;
            
            await updateUser(user.id, { characters: updatedCharacters });
        }
    }

    return cardsToAdd.length;
}, [fetchUserById, updateUser]);

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
  }, [fetchUserById]);

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

    const initiatorFamiliar = FAMILIARS_BY_ID[initiatorFamiliarId];
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
    
    const targetFamiliar = FAMILIARS_BY_ID[targetFamiliarId];
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

  }, [currentUser, fetchUsersForAdmin]);

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
        const initiatorCardIndex = (initiatorChar.inventory.familiarCards || []).findIndex(c => c.id === request.initiatorFamiliarId);
        if (initiatorCardIndex === -1) throw new Error(`Фамильяр ${request.initiatorFamiliarName} не найден у ${request.initiatorCharacterName}.`);
        initiatorChar.inventory.familiarCards.splice(initiatorCardIndex, 1);

        const targetChar = targetData.characters[targetCharIndex];
        const targetCardIndex = (targetChar.inventory.familiarCards || []).findIndex(c => c.id === request.targetFamiliarId);
        if (targetCardIndex === -1) throw new Error(`Фамильяр ${request.targetFamiliarName} не найден у ${request.targetCharacterName}.`);
        targetChar.inventory.familiarCards.splice(targetCardIndex, 1);

        initiatorChar.inventory.familiarCards.push({ id: request.targetFamiliarId });
        targetChar.inventory.familiarCards.push({ id: request.initiatorFamiliarId });

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
          ownerCharacterName
      }, { merge: true });
  }, []);

  const updateShopDetails = useCallback(async (shopId: string, details: { title?: string; description?: string }) => {
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
        // 1. Get all necessary documents
        const shopRef = doc(db, "shops", shopId);
        const shopDoc = await transaction.get(shopRef);
        if (!shopDoc.exists()) throw new Error("Магазин не найден.");
        const shopData = shopDoc.data() as Shop;
        
        const itemIndex = (shopData.items || []).findIndex(i => i.id === itemId);
        if (itemIndex === -1) throw new Error("Товар не найден.");
        const item = shopData.items![itemIndex];

        // Check stock
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
        
        // 2. Check funds
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

        // 3. Perform transactions
        // Deduct from buyer
        buyerChar.bankAccount.platinum -= totalPrice.platinum;
        buyerChar.bankAccount.gold -= totalPrice.gold;
        buyerChar.bankAccount.silver -= totalPrice.silver;
        buyerChar.bankAccount.copper -= totalPrice.copper;
        
        const buyerTx: BankTransaction = { id: `txn-buy-${Date.now()}`, date: new Date().toISOString(), reason: `Покупка: ${item.name} x${quantity}`, amount: { platinum: -totalPrice.platinum, gold: -totalPrice.gold, silver: -totalPrice.silver, copper: -totalPrice.copper } };
        buyerChar.bankAccount.history = [buyerTx, ...(buyerChar.bankAccount.history || [])];

        // Add item to buyer's inventory
        if (item.inventoryTag) {
            const inventory = buyerChar.inventory || initialFormData.inventory;
            if (!Array.isArray(inventory[item.inventoryTag])) {
                inventory[item.inventoryTag] = [];
            }
            
            const existingItemIndex = inventory[item.inventoryTag].findIndex(invItem => invItem.name === item.name);
            if (existingItemIndex > -1) {
                 inventory[item.inventoryTag][existingItemIndex].quantity += quantity;
            } else {
                const newInventoryItem: InventoryItem = {
                    id: `inv-item-${Date.now()}`,
                    name: item.name,
                    description: item.description,
                    image: item.image,
                    quantity: quantity,
                };
                inventory[item.inventoryTag].push(newInventoryItem);
            }
            
            buyerChar.inventory = inventory;
        }

        // Add to owner
        if (shopData.ownerUserId && shopData.ownerCharacterId) {
            const ownerUserRef = doc(db, "users", shopData.ownerUserId);
            const ownerUserDoc = await transaction.get(ownerUserRef);
            if (ownerUserDoc.exists()) {
                const ownerUserData = ownerUserDoc.data() as User;
                const ownerCharIndex = ownerUserData.characters.findIndex(c => c.id === shopData.ownerCharacterId);
                if (ownerCharIndex !== -1) {
                    const ownerChar = ownerUserData.characters[ownerCharIndex];
                    ownerChar.bankAccount.platinum += totalPrice.platinum;
                    ownerChar.bankAccount.gold += totalPrice.gold;
                    ownerChar.bankAccount.silver += totalPrice.silver;
                    ownerChar.bankAccount.copper += totalPrice.copper;
                    
                    const ownerTx: BankTransaction = { id: `txn-sell-${Date.now()}`, date: new Date().toISOString(), reason: `Продажа: ${item.name} x${quantity}`, amount: totalPrice };
                    ownerChar.bankAccount.history = [ownerTx, ...(ownerChar.bankAccount.history || [])];
                    
                    transaction.update(ownerUserRef, { characters: ownerUserData.characters });
                }
            }
        }
        
        // 4. Update buyer's character data & shop data
        transaction.update(buyerUserRef, { characters: buyerUserData.characters });

        // Decrease stock in shop
        if (item.quantity !== undefined) {
            const updatedItems = [...shopData.items!];
            updatedItems[itemIndex].quantity = item.quantity - quantity;
            transaction.set(shopRef, { items: updatedItems }, { merge: true });
        }
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
    const inventory = character.inventory || initialFormData.inventory;
    
    const newInventoryItem: InventoryItem = {
        id: `inv-item-admin-${Date.now()}`,
        name: itemData.name,
        description: itemData.description,
        image: itemData.image,
        quantity: itemData.quantity || 1,
    };

    if (!Array.isArray(inventory[itemData.inventoryTag])) {
        inventory[itemData.inventoryTag] = [];
    }
    inventory[itemData.inventoryTag].push(newInventoryItem);
    character.inventory = inventory;

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
       return; // Nothing to delete
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


const restockShopItem = useCallback(async (shopId: string, itemId: string, ownerUserId: string, ownerCharacterId: string) => {
    await runTransaction(db, async (transaction) => {
        const shopRef = doc(db, "shops", shopId);
        const shopDoc = await transaction.get(shopRef);
        if (!shopDoc.exists()) throw new Error("Магазин не найден.");
        const shopData = shopDoc.data() as Shop;
        
        const itemIndex = (shopData.items || []).findIndex(i => i.id === itemId);
        if (itemIndex === -1) throw new Error("Товар не найден.");
        const item = shopData.items![itemIndex];

        if (item.quantity !== 0) throw new Error("Этот товар еще есть в наличии.");
        
        const ownerUserRef = doc(db, "users", ownerUserId);
        const ownerUserDoc = await transaction.get(ownerUserRef);
        if (!ownerUserDoc.exists()) throw new Error("Владелец не найден.");
        const ownerUserData = ownerUserDoc.data() as User;

        const ownerCharIndex = ownerUserData.characters.findIndex(c => c.id === ownerCharacterId);
        if (ownerCharIndex === -1) throw new Error("Персонаж владельца не найден.");
        const ownerChar = ownerUserData.characters[ownerCharIndex];
        
        const restockCost = {
            platinum: Math.ceil((item.price.platinum || 0) * 0.3),
            gold: Math.ceil((item.price.gold || 0) * 0.3),
            silver: Math.ceil((item.price.silver || 0) * 0.3),
            copper: Math.ceil((item.price.copper || 0) * 0.3),
        };

        const balance = ownerChar.bankAccount || { platinum: 0, gold: 0, silver: 0, copper: 0 };
        if (
            balance.platinum < restockCost.platinum ||
            balance.gold < restockCost.gold ||
            balance.silver < restockCost.silver ||
            balance.copper < restockCost.copper
        ) {
            throw new Error("У владельца недостаточно средств для пополнения запасов.");
        }
        
        ownerChar.bankAccount.platinum -= restockCost.platinum;
        ownerChar.bankAccount.gold -= restockCost.gold;
        ownerChar.bankAccount.silver -= restockCost.silver;
        ownerChar.bankAccount.copper -= restockCost.copper;

        const restockTx: BankTransaction = { id: `txn-restock-${Date.now()}`, date: new Date().toISOString(), reason: `Пополнение товара: ${item.name}`, amount: { platinum: -restockCost.platinum, gold: -restockCost.gold, silver: -restockCost.silver, copper: -restockCost.copper } };
        ownerChar.bankAccount.history = [restockTx, ...(ownerChar.bankAccount.history || [])];

        const updatedItems = [...shopData.items!];
        updatedItems[itemIndex].quantity = 10;

        transaction.update(ownerUserRef, { characters: ownerUserData.characters });
        transaction.set(shopRef, { items: updatedItems }, { merge: true });
    });
     if (currentUser?.id === ownerUserId) {
        const updatedUser = await fetchUserById(ownerUserId);
        if (updatedUser) setCurrentUser(updatedUser);
    }
}, [currentUser, fetchUserById]);

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

const processWeeklyBonus = useCallback(async () => {
    const settingsRef = doc(db, 'game_settings', 'main');
    const settingsDoc = await getDoc(settingsRef);
    const settings = settingsDoc.data() as GameSettings;

    const now = new Date();
    const lastAwarded = settings.lastWeeklyBonusAwardedAt ? new Date(settings.lastWeeklyBonusAwardedAt) : new Date(0);
    const daysSinceLast = differenceInDays(now, lastAwarded);
    
    if (daysSinceLast < 7) {
        throw new Error(`Еженедельные бонусы можно начислять только раз в 7 дней. Осталось: ${7 - daysSinceLast} д.`);
    }

    const isOverdue = daysSinceLast > 7;
    const allUsers = await fetchUsersForAdmin();
    const activeUsers = allUsers.filter(u => u.status === 'активный');
    let awardedCount = 0;

    const batch = writeBatch(db);

    for (const user of activeUsers) {
        let totalBonus = 800;
        let reason = "Еженедельный бонус за активность";
        
        const famePoints = user.characters.reduce((acc, char) => {
            const charFame = (char.accomplishments || []).reduce((charAcc, acco) => charAcc + (FAME_LEVELS_POINTS[acco.fameLevel as keyof typeof FAME_LEVELS_POINTS] || 0), 0);
            return acc + charFame;
        }, 0);

        if (famePoints > 0) {
            totalBonus += famePoints;
            reason += ` и известность (${famePoints})`;
        }

        if (isOverdue) {
            totalBonus += 1000;
            reason += ` + компенсация за просрочку`;
        }

        const userRef = doc(db, "users", user.id);
        const newPointLog: PointLog = {
            id: `h-weekly-${Date.now()}-${user.id.slice(0, 4)}`,
            date: now.toISOString(),
            amount: totalBonus,
            reason,
        };
        const newPoints = user.points + totalBonus;
        const newHistory = [newPointLog, ...user.pointHistory];
        batch.update(userRef, { points: newPoints, pointHistory: newHistory });
        awardedCount++;
    }

    batch.update(settingsRef, { lastWeeklyBonusAwardedAt: now.toISOString() });
    await batch.commit();
    await fetchGameSettings();

    return { awardedCount, isOverdue };
}, [fetchUsersForAdmin, fetchGameSettings]);

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

const sendMassMail = useCallback(async (subject: string, content: string, senderName: string) => {
    const allUsers = await fetchUsersForAdmin();
    const batch = writeBatch(db);
    
    const newMail = {
        id: `mail-mass-${Date.now()}`,
        senderCharacterName: senderName,
        subject,
        content,
        sentAt: new Date().toISOString(),
        isRead: false,
        type: 'announcement' as const,
    };

    for (const user of allUsers) {
        for (const character of user.characters) {
            const userRef = doc(db, "users", user.id);
            const userMail = user.mail || [];
            const finalMail = { ...newMail, recipientUserId: user.id, recipientCharacterId: character.id };
            batch.update(userRef, { mail: [...userMail, finalMail] });
        }
    }
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


  const signOutUser = useCallback(() => {
    signOut(auth);
  }, []);
  
  const authValue = useMemo(() => ({
    user: firebaseUser,
    loading,
    signOutUser,
  }), [firebaseUser, loading, signOutUser]);
  
  const userContextValue = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      gameDate: gameSettings.gameDate,
      gameDateString: gameSettings.gameDateString,
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
      addCharacterToUser,
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
      processWeeklyBonus,
      checkExtraCharacterSlots,
      performRelationshipAction,
      recoverFamiliarsFromHistory,
      addBankPointsToCharacter,
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
    }),
    [currentUser, gameSettings, fetchUserById, fetchCharacterById, fetchUsersForAdmin, fetchLeaderboardUsers, fetchAllRewardRequests, fetchRewardRequestsForUser, fetchAvailableMythicCardsCount, addPointsToUser, addPointsToAllUsers, addCharacterToUser, updateCharacterInUser, deleteCharacterFromUser, updateUserStatus, updateUserRole, grantAchievementToUser, createNewUser, createRewardRequest, updateRewardRequestStatus, pullGachaForCharacter, giveAnyFamiliarToCharacter, clearPointHistoryForUser, clearAllPointHistories, addMoodletToCharacter, removeMoodletFromCharacter, clearRewardRequestsHistory, removeFamiliarFromCharacter, updateUser, updateUserAvatar, updateGameDate, processWeeklyBonus, checkExtraCharacterSlots, performRelationshipAction, recoverFamiliarsFromHistory, addBankPointsToCharacter, processMonthlySalary, updateCharacterWealthLevel, createExchangeRequest, fetchOpenExchangeRequests, acceptExchangeRequest, cancelExchangeRequest, createFamiliarTradeRequest, fetchFamiliarTradeRequestsForUser, acceptFamiliarTradeRequest, declineOrCancelFamiliarTradeRequest, fetchAllShops, fetchShopById, updateShopOwner, updateShopDetails, addShopItem, updateShopItem, deleteShopItem, purchaseShopItem, adminGiveItemToCharacter, adminUpdateItemInCharacter, adminDeleteItemFromCharacter, consumeInventoryItem, restockShopItem, adminUpdateCharacterStatus, adminUpdateShopLicense, processAnnualTaxes, sendMassMail, markMailAsRead, deleteMailMessage]
  );

  return (
    <AuthContext.Provider value={authValue}>
        <UserContext.Provider value={userContextValue}>
            {children}
        </UserContext.Provider>
    </AuthContext.Provider>
  );
}


  

```
  </change>
  <change>
    <file>/src/app/characters/[id]/page.tsx</file>
    <content><![CDATA[

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { User, Character, FamiliarCard, FamiliarRank, Moodlet, Relationship, RelationshipType, WealthLevel, BankAccount, Accomplishment, BankTransaction, OwnedFamiliarCard, InventoryCategory, InventoryItem, CitizenshipStatus, TaxpayerStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FAMILIARS_BY_ID, MOODLETS_DATA, TRAINING_OPTIONS, CRIME_LEVELS, INVENTORY_CATEGORIES } from '@/lib/data';
import FamiliarCardDisplay from '@/components/dashboard/familiar-card';
import { ArrowLeft, BookOpen, Edit, Heart, PersonStanding, RussianRuble, Shield, Swords, Warehouse, Gem, BrainCircuit, ShieldAlert, Star, Dices, Home, CarFront, Sparkles, Anchor, KeyRound, Users, HeartHandshake, Wallet, Coins, Award, Zap, ShieldOff, History, Info, PlusCircle, BookUser, Gavel, Group, Building, Package, LandPlot, ShieldCheck, FileQuestion, BadgeCheck, BadgeAlert, Landmark } from 'lucide-react';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import CharacterForm, { type EditableSection, type EditingState } from '@/components/dashboard/character-form';
import { useToast } from '@/hooks/use-toast';
import { cn, formatTimeLeft, calculateAge, calculateRelationshipLevel, formatCurrency } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import * as LucideIcons from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import RelationshipActions from '@/components/dashboard/relationship-actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';


const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    const IconComponent = (LucideIcons as any)[name] as React.ComponentType<{ className?: string }>;
    
    if (!IconComponent) {
        return <Star className={className} />;
    }
    
    return <IconComponent className={className} />;
};


const rankOrder: FamiliarRank[] = ['мифический', 'ивентовый', 'легендарный', 'редкий', 'обычный'];
const rankNames: Record<FamiliarRank, string> = {
    'мифический': 'Мифические',
    'ивентовый': 'Ивентовые',
    'легендарный': 'Легендарные',
    'редкий': 'Редкие',
    'обычный': 'Обычные'
};

const relationshipColors: Record<RelationshipType, string> = {
    'романтика': 'bg-pink-500',
    'дружба': 'bg-green-500',
    'вражда': 'bg-red-500',
    'конкуренция': 'bg-yellow-500',
    'нейтралитет': 'bg-gray-500',
    'любовь': 'bg-red-700',
    'семья': 'bg-blue-700',
};
const relationshipLabels: Record<RelationshipType, string> = {
    'романтика': 'Романтика',
    'дружба': 'Дружба',
    'вражда': 'Вражда',
    'конкуренция': 'Конкуренция',
    'нейтралитет': 'Нейтралитет',
    'любовь': 'Любовь',
    'семья': 'Семья',
}

const currencyNames: Record<string, string> = {
    platinum: 'платины',
    gold: 'золота',
    silver: 'серебра',
    copper: 'меди'
};

const citizenshipIcons: Record<CitizenshipStatus, React.ElementType> = {
    'citizen': ShieldCheck,
    'non-citizen': ShieldAlert,
    'refugee': FileQuestion,
};

const citizenshipLabels: Record<CitizenshipStatus, string> = {
    'citizen': 'Гражданин',
    'non-citizen': 'Не гражданин',
    'refugee': 'Беженец',
}

const taxpayerIcons: Record<TaxpayerStatus, React.ElementType> = {
    'taxable': BadgeCheck,
    'exempt': BadgeAlert,
};
const taxpayerLabels: Record<TaxpayerStatus, string> = {
    'taxable': 'Облагается налогами',
    'exempt': 'Освобожден от налогов',
}

const inventoryLayout: {
    title: string;
    icon: React.ElementType;
    categories: { key: keyof Character['inventory']; label: string; icon: React.ElementType }[];
}[] = [
    {
        title: 'Инвентарь',
        icon: Package,
        categories: [
            { key: 'оружие', label: 'Оружие', icon: Swords },
            { key: 'артефакты', label: 'Артефакты', icon: Gem },
            { key: 'зелья', label: 'Зелья/лекарства', icon: BrainCircuit },
            { key: 'гардероб', label: 'Гардероб', icon: RussianRuble },
            { key: 'драгоценности', label: 'Драгоценности', icon: Sparkles },
            { key: 'книгиИСвитки', label: 'Книги и свитки', icon: BookOpen },
            { key: 'еда', label: 'Еда', icon: Star },
            { key: 'прочее', label: 'Прочее', icon: Dices },
        ]
    },
    {
        title: 'Имущество',
        icon: LandPlot,
        categories: [
            { key: 'предприятия', label: 'Предприятия', icon: Building },
            { key: 'недвижимость', label: 'Недвижимость', icon: Home },
            { key: 'души', label: 'Души (рабочая сила)', icon: Users },
            { key: 'мебель', label: 'Мебель', icon: CarFront },
            { key: 'транспорт', label: 'Транспорт', icon: CarFront },
        ]
    }
];

const FamiliarsSection = ({ character }: { character: Character }) => {
    const familiarCards = character.inventory?.familiarCards || [];

    const groupedFamiliars = familiarCards.reduce((acc, ownedCard, index) => {
        const cardDetails = FAMILIARS_BY_ID[ownedCard.id];
        if (cardDetails) {
            const rank = cardDetails.rank;
            if (!acc[rank]) {
                acc[rank] = [];
            }
            acc[rank].push({ ...cardDetails, uniqueKey: `${cardDetails.id}-${index}` });
        }
        return acc;
    }, {} as Record<FamiliarRank, (FamiliarCard & { uniqueKey: string })[]>);


    return (
        <div className="pt-2">
            {familiarCards.length > 0 ? (
                <div className="space-y-4">
                    {rankOrder.map(rank => {
                        if (groupedFamiliars[rank] && groupedFamiliars[rank].length > 0) {
                            return (
                                <div key={rank}>
                                    <h4 className="font-semibold capitalize text-muted-foreground mb-2">{rankNames[rank]}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {groupedFamiliars[rank].map(card => (
                                            <FamiliarCardDisplay key={card.uniqueKey} cardId={card.id} />
                                        ))}
                                    </div>
                                </div>
                            )
                        }
                        return null;
                    })}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">У этого персонажа нет фамильяров.</p>
            )}
        </div>
    );
};


export default function CharacterPage() {
    const { id } = useParams();
    const { currentUser, updateCharacterInUser, gameDate, consumeInventoryItem, setCurrentUser, fetchCharacterById, fetchUsersForAdmin } = useUser();
    const [character, setCharacter] = useState<Character | null>(null);
    const [owner, setOwner] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [editingState, setEditingState] = useState<EditingState | null>(null);
    const [selectedItem, setSelectedItem] = useState<(InventoryItem & { category: InventoryCategory }) | null>(null);
    const [isConsuming, setIsConsuming] = useState(false);

    const { toast } = useToast();

    const charId = Array.isArray(id) ? id[0] : id;

    const { data: characterData, isLoading } = useQuery({
        queryKey: ['character', charId],
        queryFn: () => charId ? fetchCharacterById(charId) : Promise.resolve(null),
        enabled: !!charId,
    });
    
    useEffect(() => {
        if (characterData) {
            setCharacter(characterData.character);
            setOwner(characterData.owner);
        }
    }, [characterData]);
    
     useEffect(() => {
        // Fetch all users only when needed for forms
        if (editingState) {
            fetchUsersForAdmin().then(setAllUsers);
        }
    }, [editingState, fetchUsersForAdmin]);

    const { data: allShops = [] } = useQuery({
        queryKey: ['allShops'],
        queryFn: useUser().fetchAllShops
    });

    const handleFormSubmit = (characterData: Character) => {
        if (!owner) return;
        updateCharacterInUser(owner.id, characterData);
        setCharacter(characterData); // Optimistic update
        toast({ title: "Анкета обновлена", description: "Данные персонажа успешно сохранены." });
        setEditingState(null);
    };
    
    const closeDialog = () => {
        setEditingState(null);
    }
    
    const handleConsumeItem = async () => {
        if (!selectedItem || !character || !owner) return;
        setIsConsuming(true);
        try {
            await consumeInventoryItem(owner.id, character.id, selectedItem.id, selectedItem.category);
            toast({ title: "Предмет использован", description: `"${selectedItem.name}" был удален из инвентаря.` });
            
            // Optimistic UI update
            const updatedCharacter = { ...character };
            const inventory = { ...updatedCharacter.inventory };
            const categoryItems = [...(inventory[selectedItem.category] || [])];
            const itemIndex = categoryItems.findIndex(i => i.id === selectedItem.id);

            if (itemIndex > -1) {
                if (categoryItems[itemIndex].quantity > 1) {
                    categoryItems[itemIndex] = { ...categoryItems[itemIndex], quantity: categoryItems[itemIndex].quantity - 1 };
                } else {
                    categoryItems.splice(itemIndex, 1);
                }
                inventory[selectedItem.category] = categoryItems;
                updatedCharacter.inventory = inventory;
                setCharacter(updatedCharacter);
                
                // Update owner user in state for consistency if needed
                 if (currentUser?.id === owner.id) {
                    const updatedCurrentUser = { ...currentUser };
                    const charIndex = updatedCurrentUser.characters.findIndex(c => c.id === character.id);
                    if (charIndex > -1) {
                        updatedCurrentUser.characters[charIndex] = updatedCharacter;
                        setCurrentUser(updatedCurrentUser);
                    }
                }
            }
            setSelectedItem(null);
        } catch (e) {
            const message = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
            toast({ variant: 'destructive', title: "Ошибка", description: message });
        } finally {
            setIsConsuming(false);
        }
    };


    const spouses = useMemo(() => {
        if (!character?.marriedTo || allUsers.length === 0) return [];
        const spouseChars: {id: string, name: string}[] = [];
        for (const spouseId of character.marriedTo) {
            for (const user of allUsers) {
                const foundSpouse = user.characters.find(c => c.id === spouseId);
                if (foundSpouse) {
                    spouseChars.push({ id: foundSpouse.id, name: foundSpouse.name });
                    break;
                }
            }
        }
        return spouseChars;
    }, [character, allUsers]);

    const ownedShops = useMemo(() => {
        if (!character) return [];
        return allShops.filter(shop => shop.ownerCharacterId === character.id);
    }, [character, allShops]);

    const formattedCurrency = useMemo(() => {
        if (!character || !character.bankAccount) return [];
        const result = formatCurrency(character.bankAccount, true);
        return Array.isArray(result) ? result : [];
    }, [character]);
    
    const sortedBankHistory = useMemo(() => {
        if (!character || !character.bankAccount?.history) return [];
        return [...character.bankAccount.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [character]);

    const crimeLevelInfo = useMemo(() => {
        if (!character?.crimeLevel) return null;
        return CRIME_LEVELS.find(cl => cl.level === character.crimeLevel);
    }, [character]);

    const citizenshipStatus = character?.citizenshipStatus || 'non-citizen';
    const CitizenshipIcon = citizenshipIcons[citizenshipStatus];
    const taxpayerStatus = character?.taxpayerStatus || 'taxable';
    const TaxpayerIcon = taxpayerIcons[taxpayerStatus];


    if (isLoading) {
        return <div className="container mx-auto p-4 md:p-8"><p>Загрузка данных персонажа...</p></div>;
    }

    if (!character || !owner) {
        return notFound();
    }

    const isOwnerOrAdmin = currentUser?.id === owner.id || currentUser?.role === 'admin';
    const inventory = character.inventory;
    
    const trainingValues = Array.isArray(character.training) ? character.training : [];
    const uniqueTrainingValues = [...new Set(trainingValues)];
    const trainingLabels = uniqueTrainingValues.map(value => {
        const option = TRAINING_OPTIONS.find(opt => opt.value === value);
        return option ? option.label : value;
    });
    
    const isBlessed = character.blessingExpires && new Date(character.blessingExpires) > new Date();
    const activeMoodlets = (character.moodlets || []).filter(m => new Date(m.expiresAt) > new Date());
    const age = gameDate ? calculateAge(character.birthDate, gameDate) : null;
    const canViewHistory = isOwnerOrAdmin;
    const accomplishments = character.accomplishments || [];
    
    const backLink = currentUser?.id === owner.id ? '/' : `/users/${owner.id}`;
    const backLinkText = currentUser?.id === owner.id ? 'Вернуться в профиль' : 'Вернуться в профиль игрока';

    const SectionHeader = ({ title, icon, section }: { title: string; icon: React.ReactNode; section: EditableSection }) => (
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">{icon} {title}</CardTitle>
            {isOwnerOrAdmin && (
                <Button variant="ghost" size="icon" onClick={() => setEditingState({ type: 'section', section })} className="shrink-0 self-start sm:self-center">
                    <Edit className="w-4 h-4" />
                </Button>
            )}
        </CardHeader>
    );

    const SubSection = ({ title, content, section, isVisible, isEmpty }: { title: string; content: React.ReactNode; section: EditableSection; isVisible: boolean; isEmpty: boolean; }) => {
        if (!isVisible) return null;
        return (
             <div className="py-2">
                <div className="flex justify-between items-center mb-1">
                    <h4 className="font-semibold text-muted-foreground">{title}</h4>
                    {isOwnerOrAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => setEditingState({ type: 'section', section })} className="h-7 w-7">
                            {isEmpty ? <PlusCircle className="w-4 h-4 text-muted-foreground" /> : <Edit className="w-4 h-4" />}
                        </Button>
                    )}
                </div>
                {!isEmpty ? content : <p className="text-sm text-muted-foreground italic">Информация отсутствует.</p>}
            </div>
        );
    };
    
     const InfoRow = ({ label, value, field, section, isVisible = true, icon }: { label: string, value: React.ReactNode, field: keyof Character, section: EditableSection | 'mainInfo', isVisible?: boolean, icon?: React.ReactNode }) => {
        if (!isVisible && !isOwnerOrAdmin) return null;
        const isEmpty = !value;
        return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 group items-start">
                <span className="text-muted-foreground col-span-1 flex items-center gap-1.5">{icon}{label}:</span>
                <div className="flex items-center justify-between col-span-1 sm:col-span-2">
                    <div className="flex-1 text-left">
                        {isEmpty && isOwnerOrAdmin ? <span className="italic text-muted-foreground/80">Не указано</span> : value}
                    </div>
                    {isOwnerOrAdmin && (
                         <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={() => setEditingState({ type: 'field', section, field })}
                        >
                            {isEmpty ? <PlusCircle className="w-4 h-4 text-muted-foreground" /> : <Edit className="w-4 h-4" />}
                        </Button>
                    )}
                </div>
            </div>
        );
     };

    const getItemActionProps = (category: InventoryCategory) => {
        if (category === 'еда') {
            return { text: 'Съесть', variant: 'default' as const };
        }
        if (category === 'зелья') {
            return { text: 'Использовать', variant: 'secondary' as const };
        }
        return { text: 'Удалить', variant: 'destructive' as const };
    };


    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <Link href={backLink} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="w-4 h-4" />
                {backLinkText}
            </Link>

            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-xl md:text-2xl font-bold font-headline text-primary">{character.name}</h1>
                        <div className="flex items-center gap-1.5">
                            {isBlessed && (
                                <Popover>
                                    <PopoverTrigger asChild><button><Sparkles className="h-5 w-5 text-yellow-500 cursor-pointer" /></button></PopoverTrigger>
                                    <PopoverContent className="w-auto text-sm"><p>{formatTimeLeft(character.blessingExpires)}. Повышен шанс в рулетке.</p></PopoverContent>
                                </Popover>
                            )}
                            {character.hasLeviathanFriendship && (
                                <Popover>
                                    <PopoverTrigger asChild><button><Anchor className="h-5 w-5 text-blue-500 cursor-pointer" /></button></PopoverTrigger>
                                    <PopoverContent className="w-auto text-sm"><p>Дружба с Левиафаном</p></PopoverContent>
                                </Popover>
                            )}
                            {character.hasCrimeConnections && (
                                <Popover>
                                    <PopoverTrigger asChild><button><KeyRound className="h-5 w-5 text-gray-500 cursor-pointer" /></button></PopoverTrigger>
                                    <PopoverContent className="w-auto text-sm"><p>Связи в преступном мире</p></PopoverContent>
                                </Popover>
                            )}
                        </div>
                    </div>
                    <p className="text-muted-foreground">{character.activity}</p>
                    <p className="text-sm text-muted-foreground">Владелец: {owner.name}</p>
                </div>
            </header>
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main Content Column (Left on Large Screens) */}
                    <div className="w-full lg:w-2/3 space-y-6 order-2 lg:order-1">
                        <Card>
                            <SectionHeader title="Внешность" icon={<PersonStanding />} section="appearance" />
                            <CardContent>
                                <div className={cn("grid grid-cols-1 gap-6", character.appearanceImage && "md:grid-cols-3")}>
                                    {character.appearanceImage && (
                                        <div className="md:col-span-1">
                                            <div className="relative aspect-[2/3] w-full">
                                                <Image
                                                    src={character.appearanceImage}
                                                    alt={`Внешность ${character.name}`}
                                                    fill
                                                    style={{objectFit: "contain"}}
                                                    className="rounded-lg"
                                                    data-ai-hint="character portrait"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className={cn(character.appearanceImage ? "md:col-span-2" : "md:col-span-3")}>
                                        <ScrollArea className="h-96 w-full">
                                            <p className="whitespace-pre-wrap pr-4">{character.appearance || 'Описание отсутствует.'}</p>
                                        </ScrollArea>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <SectionHeader title="Характер" icon={<Heart />} section="personality" />
                            <CardContent>
                                <ScrollArea className="h-40 w-full">
                                    <p className="whitespace-pre-wrap pr-4">{character.personality || 'Описание отсутствует.'}</p>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                        <Card>
                            <SectionHeader title="Биография" icon={<BookOpen />} section="biography" />
                            <CardContent>
                                <ScrollArea className="h-64 w-full">
                                    <p className="whitespace-pre-wrap pr-4">{character.biography || 'Описание отсутствует.'}</p>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                        
                        {(character.abilities || isOwnerOrAdmin) && (
                            <Card>
                                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <CardTitle className="flex items-center gap-2"><Zap /> Способности</CardTitle>
                                    {isOwnerOrAdmin && (
                                        <Button variant={character.abilities ? "ghost" : "outline-dashed"} size={character.abilities ? "icon" : "sm"} onClick={() => setEditingState({type: 'section', section: "abilities"})} className="shrink-0 self-start sm:self-auto">
                                            {character.abilities ? <Edit className="w-4 h-4" /> : <><PlusCircle className="mr-2 h-4 w-4" /> Добавить</>}
                                        </Button>
                                    )}
                                </CardHeader>
                                {character.abilities && (
                                    <CardContent>
                                        <ScrollArea className="h-40 w-full">
                                            <p className="whitespace-pre-wrap pr-4">{character.abilities}</p>
                                        </ScrollArea>
                                    </CardContent>
                                )}
                            </Card>
                        )}
                        
                        {(character.weaknesses || isOwnerOrAdmin) && (
                            <Card>
                                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <CardTitle className="flex items-center gap-2"><ShieldOff /> Слабости</CardTitle>
                                    {isOwnerOrAdmin && (
                                        <Button variant={character.weaknesses ? "ghost" : "outline-dashed"} size={character.weaknesses ? "icon" : "sm"} onClick={() => setEditingState({ type: 'section', section: "weaknesses"})} className="shrink-0 self-start sm:self-auto">
                                            {character.weaknesses ? <Edit className="w-4 h-4" /> : <><PlusCircle className="mr-2 h-4 w-4" /> Добавить</>}
                                        </Button>
                                    )}
                                </CardHeader>
                                {character.weaknesses && (
                                    <CardContent>
                                        <ScrollArea className="h-40 w-full">
                                            <p className="whitespace-pre-wrap pr-4">{character.weaknesses}</p>
                                        </ScrollArea>
                                    </CardContent>
                                )}
                            </Card>
                        )}
                        
                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <CardTitle className="flex items-center gap-2"><HeartHandshake /> Отношения</CardTitle>
                                {isOwnerOrAdmin && (
                                    <Button variant="outline-dashed" size="sm" onClick={() => setEditingState({ type: 'relationship', mode: 'add' })} className="shrink-0 self-start sm:self-auto">
                                        <PlusCircle className="mr-2 h-4 w-4" /> Добавить отношение
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                {(character.relationships && character.relationships.length > 0) ? (
                                    <div className="space-y-4">
                                        {character.relationships.map((rel, index) => {
                                            const { level, progressToNextLevel, maxPointsForCurrentLevel } = calculateRelationshipLevel(rel.points);
                                            const pointsInCurrentLevel = rel.points - (level * 100);
                                            return (
                                            <div key={rel.id || `${rel.targetCharacterId}-${rel.type}-${index}`} className="relative group">
                                                {isOwnerOrAdmin && (
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingState({ type: 'relationship', mode: 'edit', relationship: rel })} className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <div className="flex justify-between items-center mb-1">
                                                    <Link href={`/characters/${rel.targetCharacterId}`} className="font-semibold hover:underline">{rel.targetCharacterName}</Link>
                                                    <Badge variant="secondary" className={cn('capitalize', relationshipColors[rel.type], 'text-white')}>{relationshipLabels[rel.type]}</Badge>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{pointsInCurrentLevel}/{maxPointsForCurrentLevel}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Progress value={progressToNextLevel} className={cn("w-full h-2")} indicatorClassName={relationshipColors[rel.type]}/>
                                                    <span className="text-xs font-bold w-8 text-right">{level}/10</span>
                                                </div>
                                            </div>
                                        )})}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm">Отношений пока нет.</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><BookUser /> Дополнительно</CardTitle>
                            </CardHeader>
                            <CardContent className="divide-y">
                                <SubSection 
                                    title="Обучение"
                                    section="training"
                                    isVisible={true}
                                    isEmpty={!character.training || character.training.length === 0}
                                    content={
                                        <ul className="list-disc pl-5 space-y-1 text-sm pt-2">
                                            {trainingLabels.map((label, index) => <li key={`${label}-${index}`}>{label}</li>)}
                                        </ul>
                                    }
                                />
                                <SubSection 
                                    title="Жизненная цель"
                                    section="lifeGoal"
                                    isVisible={!!character.lifeGoal || isOwnerOrAdmin}
                                    isEmpty={!character.lifeGoal}
                                    content={<p className="whitespace-pre-wrap text-sm pt-2">{character.lifeGoal}</p>}
                                />
                                <SubSection 
                                    title="Судимости"
                                    section="criminalRecords"
                                    isVisible={!!character.criminalRecords || isOwnerOrAdmin}
                                    isEmpty={!character.criminalRecords}
                                    content={<p className="whitespace-pre-wrap text-sm pt-2">{character.criminalRecords}</p>}
                                />
                                <SubSection 
                                    title="Питомцы"
                                    section="pets"
                                    isVisible={!!character.pets || isOwnerOrAdmin}
                                    isEmpty={!character.pets}
                                    content={<p className="whitespace-pre-wrap text-sm pt-2">{character.pets}</p>}
                                />
                                <SubSection 
                                    title="Личный дневник"
                                    section="diary"
                                    isVisible={!!character.diary}
                                    isEmpty={!character.diary}
                                    content={<p className="whitespace-pre-wrap text-sm pt-2">{character.diary}</p>}
                                />
                            </CardContent>
                        </Card>
                    </div>
                    {/* Sidebar Column (Right on Large Screens) */}
                    <div className="w-full lg:w-1/3 flex flex-col space-y-6 order-1 lg:order-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Info /> Основная информация</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <InfoRow label="Имя" value={character.name} field="name" section="mainInfo" />
                                <InfoRow label="Деятельность" value={character.activity} field="activity" section="mainInfo" />
                                <InfoRow label="Раса" value={character.race} field="race" section="mainInfo" />
                                <InfoRow
                                    label="Дата рождения"
                                    value={
                                        <span className="flex items-center gap-1.5 flex-wrap">
                                            <span>{character.birthDate || ''}</span>
                                            {age !== null && <span className="text-muted-foreground">({age} лет)</span>}
                                        </span>
                                    }
                                    field="birthDate"
                                    section="mainInfo"
                                />
                                <InfoRow 
                                    label="Страна проживания"
                                    value={
                                        <span className="flex items-center gap-1.5">
                                            <span>{character.countryOfResidence}</span>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild><CitizenshipIcon className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                                                    <TooltipContent><p>{citizenshipLabels[citizenshipStatus]}</p></TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </span>
                                    } 
                                    field="countryOfResidence" 
                                    section="mainInfo" 
                                    isVisible={!!character.countryOfResidence || isOwnerOrAdmin} 
                                    icon={<Landmark className="w-4 h-4" />}
                                />
                                <InfoRow 
                                    label="Уровень преступности" 
                                    value={crimeLevelInfo ? crimeLevelInfo.title : ''} 
                                    field="crimeLevel" 
                                    section="mainInfo" 
                                    isVisible={!!crimeLevelInfo}
                                    icon={
                                        crimeLevelInfo ? (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild><ShieldAlert className="w-4 h-4 text-destructive" /></TooltipTrigger>
                                                <TooltipContent className="max-w-xs"><p>{crimeLevelInfo.description}</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        ) : undefined
                                    }
                                />
                                <InfoRow label="Место работы" value={character.workLocation} field="workLocation" section="mainInfo" isVisible={!!character.workLocation}/>
                                <InfoRow label="Фракции/гильдии" value={character.factions} field="factions" section="mainInfo" isVisible={!!character.factions || isOwnerOrAdmin} icon={<Group className="w-4 h-4" />} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <CardTitle className="flex items-center gap-2"><Award /> Достижения</CardTitle>
                                {isOwnerOrAdmin && (
                                    <Button variant="outline-dashed" size="sm" onClick={() => setEditingState({ type: 'accomplishment', mode: 'add' })} className="shrink-0 self-start sm:self-auto">
                                        <PlusCircle className="mr-2 h-4 w-4" /> Добавить
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                {accomplishments.length > 0 ? (
                                    <div className="space-y-2">
                                        {accomplishments.map(acc => (
                                            <div key={acc.id} className="text-sm p-2 bg-muted/50 rounded-md group relative">
                                                {isOwnerOrAdmin && (
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingState({ type: 'accomplishment', mode: 'edit', accomplishment: acc })} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7">
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <p><span className="font-semibold">{acc.fameLevel}</span> <span className="text-primary font-semibold">{acc.skillLevel}</span></p>
                                                <p className="text-muted-foreground">{acc.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm">Достижений пока нет.</p>
                                )}
                            </CardContent>
                        </Card>
                        {isOwnerOrAdmin && (
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="flex items-center gap-2"><Wallet /> Финансы</CardTitle>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild><TaxpayerIcon className="w-5 h-5 text-muted-foreground" /></TooltipTrigger>
                                            <TooltipContent><p>{taxpayerLabels[taxpayerStatus]}</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span>Уровень достатка:</span>
                                        <Badge variant="outline">{character.wealthLevel || 'Бедный'}</Badge>
                                    </div>
                                    <div className="flex justify-between items-start pt-2">
                                        <span>Счет в банке:</span>
                                        <div className="text-right font-medium text-primary">
                                            {formattedCurrency.length > 0 ? (
                                                formattedCurrency.map(([amount, name]) => (
                                                    <div key={name} className="flex justify-end items-baseline gap-1.5">
                                                        <span>{amount}</span>
                                                        <span className="text-xs text-muted-foreground font-normal">{name}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <span>0 тыквин</span>
                                            )}
                                        </div>
                                    </div>
                                    {canViewHistory && sortedBankHistory.length > 0 && (
                                        <Accordion type="single" collapsible className="w-full pt-2">
                                            <AccordionItem value="history">
                                                <AccordionTrigger className="text-xs text-muted-foreground hover:no-underline">
                                                <div className="flex items-center gap-2">
                                                        <History className="w-4 h-4" />
                                                        <span>История счёта</span>
                                                </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <ScrollArea className="h-48 pr-3">
                                                        <div className="space-y-3">
                                                        {sortedBankHistory.map(tx => {
                                                            if (!tx.amount) return null;
                                                            const amounts = Object.entries(tx.amount).filter(([, val]) => val !== 0);
                                                            const isCredit = Object.values(tx.amount).some(v => v > 0);
                                                            const isDebit = Object.values(tx.amount).some(v => v < 0);
                                                            let colorClass = '';
                                                            if(isCredit && !isDebit) colorClass = 'text-green-600';
                                                            if(isDebit && !isCredit) colorClass = 'text-destructive';

                                                            return (
                                                                <div key={tx.id} className="text-xs p-2 bg-muted/50 rounded-md">
                                                                    <p className="font-semibold">{tx.reason}</p>
                                                                    <p className="text-muted-foreground">{new Date(tx.date).toLocaleString()}</p>
                                                                    <div className={cn("font-mono font-semibold", colorClass)}>
                                                                        {amounts.map(([currency, value]) => (
                                                                            <div key={currency}>
                                                                                {value > 0 ? '+' : ''}{value.toLocaleString()} {currencyNames[currency] || currency}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                        </div>
                                                    </ScrollArea>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                        
                        {currentUser && currentUser.id !== owner.id && <RelationshipActions targetCharacter={character} />}

                        <Card>
                            <SectionHeader title="Семейное положение" icon={<Users />} section="marriage" />
                            <CardContent>
                                <div className="space-y-1">
                                    <span className="text-sm">В браке с:</span>
                                    {spouses.length > 0 ? spouses.map(spouse => (
                                        <Link key={spouse.id} href={`/characters/${spouse.id}`} className="block text-sm font-semibold text-primary hover:underline">
                                            {spouse.name}
                                        </Link>
                                    )) : <p className="text-sm text-muted-foreground">Не в браке</p>}
                                </div>
                            </CardContent>
                        </Card>


                        {activeMoodlets.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Активные эффекты</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {activeMoodlets.map(moodlet => (
                                        <Popover key={moodlet.id}>
                                            <PopoverTrigger asChild>
                                                <div className="flex items-center justify-between w-full cursor-pointer text-sm p-2 rounded-md hover:bg-muted">
                                                    <div className="flex items-center gap-2">
                                                        <DynamicIcon name={moodlet.iconName} className="w-4 h-4" />
                                                        <span>{moodlet.name}</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{formatTimeLeft(moodlet.expiresAt)}</span>
                                                </div>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto max-w-xs text-sm">
                                                <p className="font-bold">{moodlet.name}</p>
                                                <p className="text-xs mb-2">{moodlet.description}</p>
                                                {moodlet.source && <p className="text-xs mb-2">Источник: <span className="font-semibold">{moodlet.source}</span></p>}
                                                <p className="text-xs text-muted-foreground">{formatTimeLeft(moodlet.expiresAt)}</p>
                                            </PopoverContent>
                                        </Popover>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                        
                        {inventoryLayout.map(section => {
                            const hasContent = section.categories.some(cat => {
                                if (cat.key === 'предприятия') return ownedShops.length > 0;
                                const items = inventory[cat.key as keyof typeof inventory] as InventoryItem[];
                                return items && items.length > 0;
                            }) || (section.title === 'Инвентарь' && inventory.familiarCards?.length > 0);

                            if (!hasContent) return null;

                            return (
                                <Card key={section.title}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <section.icon className="w-5 h-5" /> {section.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Accordion type="multiple" className="w-full">
                                            {section.title === 'Инвентарь' && inventory.familiarCards?.length > 0 && (
                                                <AccordionItem value="familiars">
                                                    <AccordionTrigger><ShieldAlert className="mr-2 w-4 h-4" />Фамильяры ({inventory.familiarCards.length})</AccordionTrigger>
                                                    <AccordionContent>
                                                        <FamiliarsSection character={character} />
                                                    </AccordionContent>
                                                </AccordionItem>
                                            )}
                                            {ownedShops.length > 0 && section.categories.some(c => c.key === 'предприятия') && (
                                                <AccordionItem value="businesses">
                                                    <AccordionTrigger><Building className="mr-2 w-4 h-4" />Предприятия ({ownedShops.length})</AccordionTrigger>
                                                    <AccordionContent>
                                                        <ul className="space-y-1 text-sm pt-2">
                                                            {ownedShops.map(shop => (
                                                                <li key={shop.id}>
                                                                    <Link href={`/market/${shop.id}`} className="hover:underline">{shop.title}</Link>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            )}
                                            {section.categories.map(cat => {
                                                if (cat.key === 'предприятия') return null;
                                                const items = (inventory[cat.key as keyof typeof inventory] || []) as InventoryItem[];
                                                if (items.length === 0) return null;
                                                return (
                                                    <AccordionItem key={cat.key} value={cat.key}>
                                                        <AccordionTrigger>
                                                            <cat.icon className="mr-2 w-4 h-4" />{cat.label} ({items.length})
                                                        </AccordionTrigger>
                                                        <AccordionContent>
                                                            <ul className="space-y-1 text-sm pt-2">
                                                                {items.map(item => (
                                                                    <li key={item.id}>
                                                                        <button className="text-left hover:underline" onClick={() => setSelectedItem({ ...item, category: cat.key as InventoryCategory })}>
                                                                            {item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                );
                                            })}
                                        </Accordion>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>

            <Dialog open={!!editingState} onOpenChange={(isOpen) => !isOpen && closeDialog()}>
                <DialogContent>
                    <CharacterForm
                        character={character}
                        allUsers={allUsers}
                        onSubmit={handleFormSubmit}
                        closeDialog={closeDialog}
                        editingState={editingState}
                    />
                </DialogContent>
            </Dialog>
            
            <Dialog open={!!selectedItem} onOpenChange={(isOpen) => !isOpen && setSelectedItem(null)}>
                {selectedItem && (
                    <DialogContent className="max-w-xl">
                        <div className="grid md:grid-cols-2 gap-6 items-start">
                            {selectedItem.image && (
                                <div className="relative w-full h-80 bg-muted rounded-md overflow-hidden">
                                    <Image src={selectedItem.image} alt={selectedItem.name} fill style={{objectFit: "contain"}} />
                                </div>
                            )}
                            <div className={cn("flex flex-col h-full", !selectedItem.image && "md:col-span-2")}>
                                <DialogHeader className="flex-grow">
                                    <DialogTitle>{selectedItem.name}</DialogTitle>
                                    <ScrollArea className="h-64 pr-4 mt-2">
                                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {selectedItem.description || 'Описание отсутствует.'}
                                        </div>
                                    </ScrollArea>
                                </DialogHeader>
                                {isOwnerOrAdmin && (
                                    <DialogFooter className="mt-4">
                                        <Button 
                                            onClick={handleConsumeItem} 
                                            disabled={isConsuming}
                                            variant={getItemActionProps(selectedItem.category).variant}
                                            className="w-full"
                                        >
                                            {isConsuming ? 'Обработка...' : getItemActionProps(selectedItem.category).text}
                                        </Button>
                                    </DialogFooter>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                )}
            </Dialog>


        </div>
    );
}
```
  </change>
  <change>
    <file>/src/lib/types.ts</file>
    <content><![CDATA[

export type UserRole = 'admin' | 'user';
export type UserStatus = 'активный' | 'неактивный' | 'отпуск';
export type RewardRequestStatus = 'в ожидании' | 'одобрено' | 'отклонено';
export type FamiliarRank = 'обычный' | 'редкий' | 'легендарный' | 'мифический' | 'ивентовый';
export type InventoryCategory = 'оружие' | 'гардероб' | 'еда' | 'подарки' | 'артефакты' | 'зелья' | 'недвижимость' | 'транспорт' | 'драгоценности' | 'книгиИСвитки' | 'прочее' | 'предприятия' | 'души' | 'мебель';
export type RelationshipType = 'романтика' | 'дружба' | 'вражда' | 'конкуренция' | 'нейтралитет' | 'любовь' | 'семья';
export type RelationshipActionType = 'подарок' | 'письмо';
export type RelationshipActionStatus = 'pending' | 'confirmed';
export type WealthLevel = 'Нищий' | 'Бедный' | 'Просветленный' | 'Средний' | 'Выше среднего' | 'Высокий' | 'Сказочно богат';
export type Currency = keyof Omit<BankAccount, 'history'>;
export type ExchangeRequestStatus = 'open' | 'closed';
export type FamiliarTradeRequestStatus = 'в ожидании' | 'принято' | 'отклонено' | 'отменено';
export type CrimeLevel = 1 | 2 | 3 | 4 | 5;
export type CitizenshipStatus = 'citizen' | 'non-citizen' | 'refugee';
export type TaxpayerStatus = 'taxable' | 'exempt';
export type MailMessageType = 'announcement' | 'personal';


export interface MailMessage {
  id: string;
  senderCharacterName: string;
  senderCharacterId?: string;
  recipientUserId: string;
  recipientCharacterId: string;
  subject: string;
  content: string;
  sentAt: string; // ISO string
  isRead: boolean;
  type: MailMessageType;
}

export interface GameSettings {
  gameDateString: string;
  gameDate: Date;
  lastWeeklyBonusAwardedAt?: string; // ISO string date
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconName: string;
}

export interface Moodlet {
  id: string; // e.g., 'curse'
  name: string;
  description: string;
  iconName: string;
  expiresAt: string; // ISO string date
  source?: string; // Who applied the moodlet
}

export interface FamiliarCard {
  id: string;
  name: string;
  rank: FamiliarRank;
  imageUrl: string;
  'data-ai-hint'?: string;
}

export interface OwnedFamiliarCard {
  id: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    description?: string;
    quantity: number;
    image?: string;
}

export interface Inventory {
    оружие: InventoryItem[];
    гардероб: InventoryItem[];
    еда: InventoryItem[];
    подарки: InventoryItem[];
    артефакты: InventoryItem[];
    зелья: InventoryItem[];
    недвижимость: InventoryItem[];
    транспорт: InventoryItem[];
    familiarCards: OwnedFamiliarCard[];
    драгоценности: InventoryItem[];
    книгиИСвитки: InventoryItem[];
    прочее: InventoryItem[];
    предприятия: InventoryItem[];
    души: InventoryItem[];
    мебель: InventoryItem[];
}

export interface RelationshipAction {
  id: string;
  type: RelationshipActionType;
  date: string; // ISO string
  description: string;
  status: RelationshipActionStatus;
}

export interface Relationship {
  id?: string; // Temporary client-side ID for list rendering
  targetCharacterId: string;
  targetCharacterName: string;
  type: RelationshipType;
  points: number; // 0-1000, where 100 points = 1 level
  history: RelationshipAction[];
  lastGiftSentAt?: string; // ISO string date
  lastLetterSentAt?: string; // ISO string date
}

export interface BankTransaction {
  id: string;
  date: string; // ISO string date
  reason: string;
  amount: Partial<Omit<BankAccount, 'history'>>;
}


export interface BankAccount {
  platinum: number;
  gold: number;
  silver: number;
  copper: number;
  history?: BankTransaction[];
}

export interface CapitalLevel {
    name: string;
    amount: Partial<BankAccount>;
}

export interface ExchangeRequest {
    id: string;
    creatorUserId: string;
    creatorName: string;
    creatorCharacterId: string;
    creatorCharacterName: string;
    fromCurrency: Currency;
    fromAmount: number;
    toCurrency: Currency;
    toAmount: number;
    status: ExchangeRequestStatus;
    createdAt: string; // ISO string date
    acceptorCharacterId?: string;
    acceptorCharacterName?: string;
}

export interface FamiliarTradeRequest {
    id: string;
    initiatorUserId: string;
    initiatorCharacterId: string;
    initiatorCharacterName: string;
    initiatorFamiliarId: string;
    initiatorFamiliarName: string;
    targetUserId: string;
    targetCharacterId: string;
    targetCharacterName: string;
    targetFamiliarId: string;
    targetFamiliarName: string;
    rank: FamiliarRank;
    status: FamiliarTradeRequestStatus;
    createdAt: string; // ISO string date
}

export interface CharacterLevel {
    id: string;
    level: string;
    description: string;
}

export interface Accomplishment {
    id: string;
    fameLevel: string;
    skillLevel: string;
    description: string;
}

export interface Character {
  id: string;
  name: string;
  activity: string;
  race: string;
  birthDate: string;
  countryOfResidence?: string;
  citizenshipStatus?: CitizenshipStatus;
  taxpayerStatus?: TaxpayerStatus;
  accomplishments: Accomplishment[];
  workLocation: string;
  factions?: string;
  abilities?: string;
  weaknesses?: string;
  lifeGoal?: string;
  pets?: string;
  appearance: string;
  appearanceImage?: string;
  personality: string;
  biography: string;
  diary: string; 
  training: string[]; 
  relationships: Relationship[];
  marriedTo?: string[];
  inventory: Inventory;
  familiarCards: OwnedFamiliarCard[];
  moodlets?: Moodlet[];
  blessingExpires?: string; 
  hasLeviathanFriendship?: boolean;
  hasCrimeConnections?: boolean;
  bankAccount: BankAccount;
  wealthLevel: WealthLevel;
  crimeLevel?: CrimeLevel;
  criminalRecords?: string;
  // Deprecated fields, kept for migration
  skillLevels?: CharacterLevel[];
  fameLevels?: CharacterLevel[];
}

export interface PointLog {
  id: string;
  date: string;
  amount: number;
  reason: string;
  characterId?: string;
}

export interface User {
  id:string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  points: number;
  status: UserStatus;
  characters: Character[];
  pointHistory: PointLog[];
  achievementIds?: string[];
  extraCharacterSlots?: number;
  mail?: MailMessage[];
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  type: 'permanent' | 'temporary';
  iconName: string;
}

export interface RewardRequest {
  id: string;
  userId: string;
  userName: string;
  rewardId: string;
  rewardTitle: string;
  rewardCost: number;
  characterId: string;
  characterName: string;
  status: RewardRequestStatus;
  createdAt: string; // ISO string date
}

export interface ShopItem {
    id: string;
    name: string;
    description?: string;
    image?: string;
    price: Omit<BankAccount, 'history'>;
    inventoryTag?: InventoryCategory;
    quantity?: number; // undefined or -1 for infinite
}

export interface Shop {
  id: string;
  title: string;
  description: string;
  image: string;
  aiHint: string;
  ownerUserId?: string;
  ownerCharacterId?: string;
  ownerCharacterName?: string;
  items?: ShopItem[];
  hasLicense?: boolean;
}

export type AdminGiveItemForm = {
    name: string;
    description: string;
    inventoryTag: InventoryCategory;
    quantity?: number;
    image?: string;
}

export interface PerformRelationshipActionParams {
    sourceUserId: string;
    sourceCharacterId: string;
    targetCharacterId: string;
    actionType: RelationshipActionType;
    description: string;
    itemId?: string;
    itemCategory?: InventoryCategory;
    content?: string; // For letters
}


export interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  gameDate: Date | null;
  gameDateString: string | null;
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
  updateCharacterInUser: (userId: string, character: Character) => Promise<void>;
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
  processWeeklyBonus: () => Promise<{awardedCount: number, isOverdue: boolean}>;
  checkExtraCharacterSlots: (userId: string) => Promise<number>;
  performRelationshipAction: (params: PerformRelationshipActionParams) => Promise<void>;
  recoverFamiliarsFromHistory: (userId: string, characterId: string, oldCharacterName?: string) => Promise<number>;
  addBankPointsToCharacter: (userId: string, characterId: string, amount: Partial<BankAccount>, reason: string) => Promise<void>;
  processMonthlySalary: () => Promise<void>;
  processAnnualTaxes: () => Promise<{ taxedCharactersCount: number; totalTaxesCollected: BankAccount }>;
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
  updateShopDetails: (shopId: string, details: { title?: string; description?: string }) => Promise<void>;
  addShopItem: (shopId: string, item: Omit<ShopItem, 'id'>) => Promise<void>;
  updateShopItem: (shopId: string, item: ShopItem) => Promise<void>;
  deleteShopItem: (shopId: string, itemId: string) => Promise<void>;
  purchaseShopItem: (shopId: string, itemId: string, buyerUserId: string, buyerCharacterId: string, quantity: number) => Promise<void>;
  adminGiveItemToCharacter: (userId: string, characterId: string, itemData: AdminGiveItemForm) => Promise<void>;
  adminUpdateItemInCharacter: (userId: string, characterId: string, itemData: InventoryItem, category: InventoryCategory) => Promise<void>;
  adminDeleteItemFromCharacter: (userId: string, characterId: string, itemId: string, category: InventoryCategory) => Promise<void>;
  consumeInventoryItem: (userId: string, characterId: string, itemId: string, category: InventoryCategory) => Promise<void>;
  restockShopItem: (shopId: string, itemId: string, ownerUserId: string, ownerCharacterId: string) => Promise<void>;
  adminUpdateCharacterStatus: (userId: string, characterId: string, updates: { taxpayerStatus?: TaxpayerStatus; citizenshipStatus?: CitizenshipStatus; }) => Promise<void>;
  adminUpdateShopLicense: (shopId: string, hasLicense: boolean) => Promise<void>;
  sendMassMail: (subject: string, content: string, senderName: string) => Promise<void>;
  markMailAsRead: (mailId: string) => Promise<void>;
  deleteMailMessage: (mailId: string) => Promise<void>;
}
```
  </change>
  <change>
    <file>/next.config.mjs</file>
    <content><![CDATA[/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'i.postimg.cc',
                port: '',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                port: '',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
                port: '',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'ik.imagekit.io',
                port: '',
                pathname: '**',
            }
        ],
    },
};

export default nextConfig;
