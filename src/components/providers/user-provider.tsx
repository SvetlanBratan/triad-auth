
"use client";

import React, { createContext, useState, useMemo, useCallback, useEffect, useContext } from 'react';
import type { User, Character, PointLog, UserStatus, UserRole, RewardRequest, RewardRequestStatus, FamiliarCard, Moodlet, Inventory, GameSettings, Relationship, RelationshipAction, RelationshipActionType, BankAccount, WealthLevel, ExchangeRequest, Currency, FamiliarTradeRequest, FamiliarTradeRequestStatus, FamiliarRank, BankTransaction } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, writeBatch, collection, getDocs, query, where, orderBy, deleteDoc, runTransaction, addDoc, collectionGroup, limit, startAfter } from "firebase/firestore";
import { ALL_FAMILIARS, FAMILIARS_BY_ID, MOODLETS_DATA, DEFAULT_GAME_SETTINGS, WEALTH_LEVELS, FAME_LEVELS_POINTS } from '@/lib/data';

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
  fetchUsersForAdmin: () => Promise<User[]>;
  fetchLeaderboardUsers: () => Promise<User[]>;
  fetchAllRewardRequests: () => Promise<RewardRequest[]>;
  fetchRewardRequestsForUser: (userId: string) => Promise<RewardRequest[]>;
  fetchAvailableMythicCardsCount: () => Promise<number>;
  addPointsToUser: (userId: string, amount: number, reason: string, characterId?: string) => Promise<User | null>;
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
  addMoodletToCharacter: (userId: string, characterId: string, moodletId: string, durationInDays: number, source?: string) => Promise<void>;
  removeMoodletFromCharacter: (userId: string, characterId: string, moodletId: string) => Promise<void>;
  clearRewardRequestsHistory: () => Promise<void>;
  removeFamiliarFromCharacter: (userId: string, characterId: string, cardId: string) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  updateUserAvatar: (userId: string, avatarUrl: string) => Promise<void>;
  updateGameDate: (newDateString: string) => Promise<void>;
  processWeeklyBonus: () => Promise<{awardedCount: number, isOverdue: boolean}>;
  checkExtraCharacterSlots: (userId: string) => Promise<number>;
  performRelationshipAction: (
    sourceUserId: string,
    sourceCharacterId: string,
    targetCharacterId: string,
    actionType: RelationshipActionType,
    description: string
  ) => Promise<void>;
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

    let mythicChance = 2;
    let legendaryChance = 10;
    let rareChance = 25;
    
    if (hasBlessing) {
        mythicChance = 5;
        legendaryChance = 20;
        rareChance = 40;
    }
    
    const availableCards = ALL_FAMILIARS;

    const availableMythic = availableCards.filter(c => c.rank === 'мифический' && !unavailableMythicIds.has(c.id));
    const availableLegendary = availableCards.filter(c => c.rank === 'легендарный');
    const availableRare = availableCards.filter(c => c.rank === 'редкий');
    const availableCommon = availableCards.filter(c => c.rank === 'обычный');

    let chosenPool: FamiliarCard[] = [];

    if (rand < mythicChance && availableMythic.length > 0) {
        chosenPool = availableMythic;
    } else if (rand < mythicChance + legendaryChance && availableLegendary.length > 0) {
        chosenPool = availableLegendary;
    } else if (rand < mythicChance + legendaryChance + rareChance && availableRare.length > 0) {
        chosenPool = availableRare;
    } else if (availableCommon.length > 0) {
        chosenPool = availableCommon;
    } else {
        // Fallback to rare if common is empty for some reason
        chosenPool = availableRare;
    }
    
    // Final fallback if all pools are somehow empty
    if (chosenPool.length === 0) {
      chosenPool = availableCards.filter(c => c.rank !== 'мифический' || (c.rank === 'мифический' && !unavailableMythicIds.has(c.id)));
      if (chosenPool.length === 0) {
          // Absolute fallback: if even non-mythics are gone, pick any non-event card
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
    },
    bankAccount: { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] },
    wealthLevel: 'Бедный',
  }), []);

  const fetchUserById = useCallback(async (userId: string): Promise<User | null> => {
      const userRef = doc(db, "users", userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
          const userData = docSnap.data() as User;
           userData.characters = userData.characters?.map(char => ({
                ...initialFormData,
                ...char,
                bankAccount: typeof char.bankAccount !== 'object' || char.bankAccount === null 
                    ? { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] } 
                    : { platinum: 0, gold: 0, silver: 0, copper: 0, history: [], ...char.bankAccount },
                accomplishments: char.accomplishments || [],
                training: Array.isArray(char.training) ? char.training : [],
                marriedTo: Array.isArray(char.marriedTo) ? char.marriedTo : [],
                relationships: (Array.isArray(char.relationships) ? char.relationships : []).map(r => ({ ...r, id: r.id || `rel-${Math.random()}` })),
                inventory: char.inventory || { оружие: [], гардероб: [], еда: [], подарки: [], артефакты: [], зелья: [], недвижимость: [], транспорт: [], familiarCards: char.familiarCards || [] },
                moodlets: char.moodlets || [],
            })) || [];
           userData.achievementIds = userData.achievementIds || [];
           userData.extraCharacterSlots = userData.extraCharacterSlots || 0;
           userData.pointHistory = userData.pointHistory || [];
          return userData;
      }
      return null;
  }, [initialFormData]);

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
            await fetchGameSettings(); // Fetch settings only after user is confirmed
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
                 bankAccount: typeof char.bankAccount !== 'object' || char.bankAccount === null 
                    ? { platinum: 0, gold: 0, silver: 0, copper: 0, history: [] } 
                    : { platinum: 0, gold: 0, silver: 0, copper: 0, history: [], ...char.bankAccount },
                inventory: char.inventory || { оружие: [], гардероб: [], еда: [], подарки: [], артефакты: [], зелья: [], недвижимость: [], транспорт: [], familiarCards: char.familiarCards || [] },
                moodlets: char.moodlets || [],
            })) || [];
            userData.achievementIds = userData.achievementIds || [];
            userData.pointHistory = userData.pointHistory || [];
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
        const oldCharacterState = sourceUserData.characters.find(c => c.id === characterToUpdate.id);
        const oldRelationships = new Map((oldCharacterState?.relationships || []).map(r => [r.targetCharacterId, r]));

        // Ensure bankAccount.history is an array
        const sanitizedCharacterToUpdate = {
            ...characterToUpdate,
            bankAccount: {
                ...characterToUpdate.bankAccount,
                history: Array.isArray(characterToUpdate.bankAccount?.history) ? characterToUpdate.bankAccount.history : [],
            },
        };

        const updatedCharacters = [...sourceUserData.characters];
        const characterIndex = updatedCharacters.findIndex(char => char.id === sanitizedCharacterToUpdate.id);

        if (characterIndex > -1) {
            updatedCharacters[characterIndex] = sanitizedCharacterToUpdate;
        } else {
            updatedCharacters.push(sanitizedCharacterToUpdate);
        }

        // --- Relationship Synchronization ---
        const allUsersSnapshot = await getDocs(collection(db, "users"));
        const allUsersMap = new Map(allUsersSnapshot.docs.map(d => [d.id, d.data() as User]));
        const usersToUpdate = new Map<string, User>();
        usersToUpdate.set(userId, { ...sourceUserData, characters: updatedCharacters });

        const newRelationships = new Map(sanitizedCharacterToUpdate.relationships.map(r => [r.targetCharacterId, r]));

        // Check for new/updated relationships
        for (const [targetCharId, newRel] of newRelationships.entries()) {
            const oldRel = oldRelationships.get(targetCharId);
            if (JSON.stringify(oldRel) === JSON.stringify(newRel)) continue; // No change

            // Find target user and character
            let targetUser: User | undefined;
            let targetUserId: string | undefined;
            allUsersMap.forEach((user, id) => {
                if (user.characters.some(c => c.id === targetCharId)) {
                    targetUser = user;
                    targetUserId = id;
                }
            });

            if (targetUser && targetUserId) {
                const userToUpdate = usersToUpdate.get(targetUserId) || { ...targetUser };
                const targetCharIndex = userToUpdate.characters.findIndex(c => c.id === targetCharId);
                
                if (targetCharIndex !== -1) {
                    const targetChar = { ...userToUpdate.characters[targetCharIndex] };
                    targetChar.relationships = targetChar.relationships || [];
                    const reciprocalRelIndex = targetChar.relationships.findIndex(r => r.targetCharacterId === sanitizedCharacterToUpdate.id);

                    const reciprocalRel: Relationship = {
                        targetCharacterId: sanitizedCharacterToUpdate.id,
                        targetCharacterName: sanitizedCharacterToUpdate.name,
                        type: newRel.type,
                        points: reciprocalRelIndex !== -1 ? targetChar.relationships[reciprocalRelIndex].points : 0,
                        history: reciprocalRelIndex !== -1 ? targetChar.relationships[reciprocalRelIndex].history : [],
                    };
                    
                    if (reciprocalRelIndex !== -1) {
                        targetChar.relationships[reciprocalRelIndex] = reciprocalRel;
                    } else {
                        targetChar.relationships.push(reciprocalRel);
                    }
                    
                    userToUpdate.characters[targetCharIndex] = targetChar;
                    usersToUpdate.set(targetUserId, userToUpdate);
                }
            }
        }

        // Check for removed relationships
        for (const [targetCharId] of oldRelationships.entries()) {
            if (!newRelationships.has(targetCharId)) {
                // Find target user and character
                 let targetUser: User | undefined;
                 let targetUserId: string | undefined;
                 allUsersMap.forEach((user, id) => {
                     if (user.characters.some(c => c.id === targetCharId)) {
                         targetUser = user;
                         targetUserId = id;
                     }
                 });

                 if (targetUser && targetUserId) {
                    const userToUpdate = usersToUpdate.get(targetUserId) || { ...targetUser };
                    const targetCharIndex = userToUpdate.characters.findIndex(c => c.id === targetCharId);
                    
                    if (targetCharIndex !== -1) {
                         const targetChar = { ...userToUpdate.characters[targetCharIndex] };
                         targetChar.relationships = (targetChar.relationships || []).filter(r => r.targetCharacterId !== sanitizedCharacterToUpdate.id);
                         userToUpdate.characters[targetCharIndex] = targetChar;
                         usersToUpdate.set(targetUserId, userToUpdate);
                    }
                 }
            }
        }
        
        // Commit all updates
        for (const [id, user] of usersToUpdate.entries()) {
            // Sanitize relationships before writing to remove temporary client-side IDs
            const sanitizedUser = {
                ...user,
                characters: user.characters.map(c => ({
                    ...c,
                    relationships: (c.relationships || []).map(({ id: tempId, ...rest }) => rest)
                }))
            };
            transaction.set(doc(db, "users", id), sanitizedUser);
        }
    });

    const updatedUser = await fetchUserById(userId);
    if (updatedUser) {
      if (currentUser?.id === userId) {
        setCurrentUser(updatedUser);
      }
    }
}, [currentUser?.id, fetchUserById]);



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
      characterId: rewardRequestData.characterId,
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
      let user = await fetchUserById(request.userId);
      if (!user) throw new Error("User for the request not found");

      const batch = writeBatch(db);
      const requestRef = doc(db, "users", request.userId, "reward_requests", request.id);
      batch.update(requestRef, { status: newStatus });
      
      let updatedUser = { ...user };
      let updatesForUser: Partial<User> = {};

      if (newStatus === 'одобрено') {
        let characterToUpdateIndex = -1;
        if (request.characterId) {
            characterToUpdateIndex = updatedUser.characters.findIndex(c => c.id === request.characterId);
        }
        
        const achievementMap: Record<string, string> = {
          'r-race-1': 'ach-unique-character',
          'r-race-2': 'ach-unique-character',
          'r-race-3': 'ach-unique-character',
          'r-race-4': 'ach-unique-character',
          'r-extra-char': 'ach-multi-hand',
          'r-wild-pet': 'ach-tamer',
          'r-crime-connections': 'ach-mafiosi',
          'r-leviathan': 'ach-submariner',
          'r-ship': 'ach-seaman',
          'r-airship': 'ach-sky-master',
          'r-archmage': 'ach-big-mage',
          'r-court-position': 'ach-important-person',
          'r-baron': 'ach-baron',
          'r-land-titled': 'ach-sir-lady',
          'r-extra-element': 'ach-warlock',
          'r-extra-doctrine': 'ach-wizard',
          'r-guild': 'ach-guildmaster',
          'r-hybrid': 'ach-hybrid',
          'r-swap-element': 'ach-exchange-master',
          'r-forbidden-magic': 'ach-dark-lord',
          'r-body-parts': 'ach-chimera-mancer',
          'r-pumpkin-wife': PUMPKIN_SPOUSE_ACHIEVEMENT_ID,
          'r-pumpkin-husband': PUMPKIN_HUSBAND_ACHIEVEMENT_ID,
          'r-blessing': GODS_FAVORITE_ACHIEVEMENT_ID,
        };

        const achievementIdToGrant = achievementMap[request.rewardId];
        if (achievementIdToGrant) {
            const currentAchievements = updatedUser.achievementIds || [];
            if (!currentAchievements.includes(achievementIdToGrant)) {
                updatedUser.achievementIds = [...currentAchievements, achievementIdToGrant];
                updatesForUser.achievementIds = updatedUser.achievementIds;
            }
        }

        if(request.rewardId === EXTRA_CHARACTER_REWARD_ID) {
            const currentSlots = updatedUser.extraCharacterSlots || 0;
            updatesForUser.extraCharacterSlots = currentSlots + 1;
            updatedUser.extraCharacterSlots = currentSlots + 1;
        }

        if (characterToUpdateIndex !== -1) {
            let characterToUpdate = { ...updatedUser.characters[characterToUpdateIndex] };
            let inventory = characterToUpdate.inventory || { оружие: [], гардероб: [], еда: [], подарки: [], артефакты: [], зелья: [], недвижимость: [], транспорт: [], familiarCards: [] };

            if (request.rewardId === PUMPKIN_WIFE_REWARD_ID) {
                 const currentCards = inventory.familiarCards || [];
                 if (!currentCards.some(card => card.id === PUMPKIN_WIFE_CARD_ID)) {
                    inventory.familiarCards = [...currentCards, { id: PUMPKIN_WIFE_CARD_ID }];
                 }
            } else if (request.rewardId === PUMPKIN_HUSBAND_REWARD_ID) {
                const currentCards = inventory.familiarCards || [];
                if (!currentCards.some(card => card.id === PUMPKIN_HUSBAND_CARD_ID)) {
                   inventory.familiarCards = [...currentCards, { id: PUMPKIN_HUSBAND_CARD_ID }];
                }
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
            updatedUser.characters[characterToUpdateIndex] = characterToUpdate;
            updatesForUser.characters = updatedUser.characters;
        }
      } else if (newStatus === 'отклонено') {
          const reason = `Возврат за отклоненный запрос: ${request.rewardTitle}`;
          const newPointLog: PointLog = {
              id: `h-${Date.now()}-refund`,
              date: new Date().toISOString(),
              amount: request.rewardCost,
              reason,
          };
          updatedUser.points += request.rewardCost;
          updatedUser.pointHistory.unshift(newPointLog);
          updatesForUser.points = updatedUser.points;
          updatesForUser.pointHistory = updatedUser.pointHistory;
      }

      if (Object.keys(updatesForUser).length > 0) {
        const userRef = doc(db, "users", user.id);
        batch.update(userRef, updatesForUser);
      }

      await batch.commit();

      if (Object.keys(updatesForUser).length > 0) {
        if (currentUser?.id === updatedUser.id) {
            setCurrentUser(prev => ({...prev!, ...updatesForUser}));
        }
      }
      return {...request, status: newStatus};
  }, [fetchUserById, currentUser?.id, grantAchievementToUser]);

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

        // Globally check for claimed mythic cards
        const allUsersSnapshot = await getDocs(collection(db, 'users'));
        const claimedMythicIds = new Set<string>();
        allUsersSnapshot.forEach(doc => {
            const u = doc.data() as User;
            (u.characters || []).forEach(c => {
                (c.inventory?.familiarCards || c.familiarCards || []).forEach(cardRef => {
                    const cardDetails = FAMILIARS_BY_ID[cardRef.id];
                    if(cardDetails && cardDetails.rank === 'мифический') {
                        claimedMythicIds.add(cardRef.id);
                    }
                });
            });
        });

        const hasBlessing = character.blessingExpires ? new Date(character.blessingExpires) > new Date() : false;
        newCard = drawFamiliarCard(hasBlessing, claimedMythicIds);
        
        const ownedCardIds = new Set((character.inventory?.familiarCards || character.familiarCards || []).map(c => c.id));
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
        
        finalUser = updatedUser; // Update the user object to be returned
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
    
    // Unlike event familiars, we can allow duplicates from admin panel if needed
    // For now, let's just add it.
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

    // Find the first instance of the card and remove it
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

  const performRelationshipAction = useCallback(async (
    sourceUserId: string,
    sourceCharacterId: string,
    targetCharacterId: string,
    actionType: RelationshipActionType,
    description: string
  ) => {
    await runTransaction(db, async (transaction) => {
        const sourceUserRef = doc(db, "users", sourceUserId);
        const sourceUserDoc = await transaction.get(sourceUserRef);
        if (!sourceUserDoc.exists()) throw new Error("Исходный пользователь не найден.");
        const sourceUserData = sourceUserDoc.data() as User;

        let targetUserDoc: any = null;
        let targetUserData: User | null = null;
        let targetUserId: string | null = null;
        
        // This query is inefficient but necessary without a direct mapping
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

        const updateRelationship = (character: Character, otherCharId: string, points: number, action: RelationshipAction) => {
            const relIndex = (character.relationships || []).findIndex(r => r.targetCharacterId === otherCharId);
            if (relIndex === -1) return; // Relationship must exist

            const relationship = character.relationships[relIndex];
            relationship.points += points;

            const now = new Date();
            if (action.type === 'подарок') relationship.lastGiftSentAt = now.toISOString();
            if (action.type === 'письмо') relationship.lastLetterSentAt = now.toISOString();

            relationship.history = [...(relationship.history || []), action];
        };

        const nowISO = new Date().toISOString();
        const newAction: RelationshipAction = {
            id: `act-${Date.now()}`,
            type: actionType,
            date: nowISO,
            description,
            status: 'confirmed',
        };
        const pointsToAdd = RELATIONSHIP_POINTS_CONFIG[actionType];

        // Update Source Character
        const sourceCharIndex = sourceUserData.characters.findIndex(c => c.id === sourceCharacterId);
        if (sourceCharIndex === -1) throw new Error("Исходный персонаж не найден.");
        updateRelationship(sourceUserData.characters[sourceCharIndex], targetCharacterId, pointsToAdd, newAction);

        // Update Target Character
        const targetCharIndex = targetUserData.characters.findIndex(c => c.id === targetCharacterId);
        if (targetCharIndex === -1) throw new Error("Целевой персонаж не найден.");
        updateRelationship(targetUserData.characters[targetCharIndex], sourceCharacterId, pointsToAdd, newAction);

        transaction.update(sourceUserRef, { characters: sourceUserData.characters });
        transaction.update(targetUserDoc.ref, { characters: targetUserData.characters });
    });

    if (currentUser && currentUser.id === sourceUserId) {
        const updatedUser = await fetchUserById(sourceUserId);
        if(updatedUser) setCurrentUser(updatedUser);
    }
  }, [currentUser, fetchUserById]);

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


  // --- Currency Exchange ---
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
        const newDocRef = doc(requestsCollection); // Firestore generates ID
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
        
        // Get acceptor
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
        
        // Get creator
        const creatorUserRef = doc(db, "users", request.creatorUserId);
        const creatorUserDoc = await transaction.get(creatorUserRef);
        if (!creatorUserDoc.exists()) throw new Error("Создатель запроса не найден.");
        const creatorUserData = creatorUserDoc.data() as User;
        const creatorCharIndex = creatorUserData.characters.findIndex(c => c.id === request.creatorCharacterId);
        if (creatorCharIndex === -1) throw new Error("Персонаж создателя запроса не найден.");

        // Perform transaction
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
        
        // Commit changes
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

        // Refund money
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


    // --- Familiar Exchange ---

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

    if (initiatorFamiliar.rank !== targetFamiliar.rank) {
        throw new Error("Фамильяры должны быть одного ранга.");
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

    // Query for outgoing requests
    const outgoingQuery = query(
      requestsCollection,
      where('initiatorUserId', '==', currentUser.id),
      where('status', '==', 'в ожидании')
    );
    
    // Query for incoming requests
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

        // --- Remove cards ---
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

        // --- Add cards ---
        initiatorChar.inventory.familiarCards.push({ id: request.targetFamiliarId });
        targetChar.inventory.familiarCards.push({ id: request.initiatorFamiliarId });

        // --- Commit ---
        transaction.update(initiatorUserRef, { characters: initiatorData.characters });
        transaction.update(targetUserRef, { characters: targetData.characters });
        transaction.update(requestRef, { status: 'принято' });
    });

    // Refresh data for both users if one of them is the current user
    if (currentUser && (currentUser.id === request.initiatorUserId || currentUser.id === request.targetUserId)) {
        const updatedUser = await fetchUserById(currentUser.id);
        if (updatedUser) setCurrentUser(updatedUser);
    }
  }, [currentUser, fetchUserById]);

  const declineOrCancelFamiliarTradeRequest = useCallback(async (request: FamiliarTradeRequest, status: 'отклонено' | 'отменено') => {
      const requestRef = doc(db, "familiar_trade_requests", request.id);
      await updateDoc(requestRef, { status });
  }, []);

  const signOutUser = useCallback(() => {
    signOut(auth);
  }, []);
  
  const authValue = useMemo(() => ({
    user: firebaseUser,
    loading,
    signOutUser,
  }), [firebaseUser, loading, signOutUser]);
  
  const processWeeklyBonus = useCallback(async (): Promise<{awardedCount: number, isOverdue: boolean}> => {
    const now = new Date();
    const lastAwarded = gameSettings.lastWeeklyBonusAwardedAt ? new Date(gameSettings.lastWeeklyBonusAwardedAt) : new Date(0);
    
    const isFirstTime = lastAwarded.getFullYear() < 2000;
    const daysSinceLast = isFirstTime ? 7 : (now.getTime() - lastAwarded.getTime()) / (1000 * 3600 * 24);

    if (daysSinceLast < 7) {
        throw new Error(`Еженедельные бонусы уже были начислены. Следующее начисление через ${Math.ceil(7 - daysSinceLast)} д.`);
    }
    
    const isOverdue = !isFirstTime && daysSinceLast > 7;
    const allUsers = await fetchUsersForAdmin();
    const activeUsers = allUsers.filter(u => u.status === 'активный');
    const batch = writeBatch(db);

    const userPointsToAdd = new Map<string, { points: number; reasons: string[] }>();

    // Initialize map for active users
    activeUsers.forEach(user => {
        userPointsToAdd.set(user.id, { points: 0, reasons: [] });
    });

    // 1. Calculate Activity Bonus
    activeUsers.forEach(user => {
        const currentData = userPointsToAdd.get(user.id)!;
        const activityBonus = 800;
        const compensation = isOverdue ? 1000 : 0;
        
        currentData.points += activityBonus + compensation;
        let reason = `Еженедельный бонус за активность`;
        if (isOverdue) reason += ' (+ компенсация)';
        currentData.reasons.push(reason);
    });

    // 2. Calculate Fame Bonus
    activeUsers.forEach(user => {
        if (!user.characters || user.characters.length === 0) return;

        let pointsForFame = 0;
        user.characters.forEach(character => {
            (character.accomplishments || []).forEach(acc => {
                const fameLevelKey = acc.fameLevel as keyof typeof FAME_LEVELS_POINTS;
                if (FAME_LEVELS_POINTS[fameLevelKey]) {
                    pointsForFame += FAME_LEVELS_POINTS[fameLevelKey];
                }
            });
        });

        if (pointsForFame > 0) {
            const currentData = userPointsToAdd.get(user.id)!;
            currentData.points += pointsForFame;
            currentData.reasons.push(`Награда за известность персонажей`);
        }
    });
    
    // 3. Commit to Batch
    for (const user of activeUsers) {
        const data = userPointsToAdd.get(user.id);
        if (!data || data.points === 0) continue;

        const combinedReason = data.reasons.join(', ');

        const newPointLog: PointLog = {
            id: `h-${Date.now()}-weekly`,
            date: now.toISOString(),
            amount: data.points,
            reason: combinedReason,
        };
        
        const userRef = doc(db, "users", user.id);
        batch.update(userRef, {
            points: user.points + data.points,
            pointHistory: [newPointLog, ...user.pointHistory]
        });
    }
    
    const settingsRef = doc(db, 'game_settings', 'main');
    batch.update(settingsRef, { lastWeeklyBonusAwardedAt: now.toISOString() });

    await batch.commit();
    await fetchGameSettings(); // Refetch settings to update the context state

    return { awardedCount: activeUsers.length, isOverdue };
}, [gameSettings.lastWeeklyBonusAwardedAt, fetchUsersForAdmin, fetchGameSettings]);


  const userContextValue = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      gameDate: gameSettings.gameDate,
      gameDateString: gameSettings.gameDateString,
      lastWeeklyBonusAwardedAt: gameSettings.lastWeeklyBonusAwardedAt,
      fetchUserById,
      fetchUsersForAdmin,
      fetchLeaderboardUsers,
      fetchAllRewardRequests,
      fetchRewardRequestsForUser,
      fetchAvailableMythicCardsCount,
      addPointsToUser,
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
    }),
    [currentUser, gameSettings, fetchUserById, fetchUsersForAdmin, fetchLeaderboardUsers, fetchAllRewardRequests, fetchRewardRequestsForUser, fetchAvailableMythicCardsCount, addPointsToUser, addCharacterToUser, updateCharacterInUser, deleteCharacterFromUser, updateUserStatus, updateUserRole, grantAchievementToUser, createNewUser, createRewardRequest, updateRewardRequestStatus, pullGachaForCharacter, giveAnyFamiliarToCharacter, clearPointHistoryForUser, addMoodletToCharacter, removeMoodletFromCharacter, clearRewardRequestsHistory, removeFamiliarFromCharacter, updateUser, updateUserAvatar, updateGameDate, processWeeklyBonus, checkExtraCharacterSlots, performRelationshipAction, recoverFamiliarsFromHistory, addBankPointsToCharacter, processMonthlySalary, updateCharacterWealthLevel, createExchangeRequest, fetchOpenExchangeRequests, acceptExchangeRequest, cancelExchangeRequest, createFamiliarTradeRequest, fetchFamiliarTradeRequestsForUser, acceptFamiliarTradeRequest, declineOrCancelFamiliarTradeRequest]
  );

  return (
    <AuthContext.Provider value={authValue}>
        <UserContext.Provider value={userContextValue}>
            {children}
        </UserContext.Provider>
    </AuthContext.Provider>
  );
}
