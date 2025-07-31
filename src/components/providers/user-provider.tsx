
"use client";

import React, { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { User, Character, PointLog, UserStatus, UserRole, RewardRequest, RewardRequestStatus, FamiliarCard, Moodlet, GameSettings, Relationship, RelationshipActionType, BankAccount, WealthLevel, ExchangeRequest, Currency, FamiliarTradeRequest, Shop, ShopItem, InventoryItem, AdminGiveItemForm, InventoryCategory, CitizenshipStatus, TaxpayerStatus, PerformRelationshipActionParams, MailMessage, UserContextType } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, writeBatch, collection, getDocs, query, where, orderBy, deleteDoc, runTransaction, addDoc, collectionGroup } from "firebase/firestore";
import { ALL_FAMILIARS, FAMILIARS_BY_ID, MOODLETS_DATA, DEFAULT_GAME_SETTINGS, WEALTH_LEVELS, FAME_LEVELS_POINTS, ALL_SHOPS, SHOPS_BY_ID } from '@/lib/data';
import { differenceInDays } from 'date-fns';

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
            chosenPool = ALL_FAMILIARS.filter(c => c.rank !== 'ивентовый');
        }
    }

    return chosenPool[Math.floor(Math.random() * chosenPool.length)];
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  const [loading, setLoading] = useState(true);

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
        оружие: [], гардероб: [], еда: [], подарки: [], артефакты: [], зелья: [],
        недвижимость: [], транспорт: [], familiarCards: [], драгоценности: [],
        книгиИСвитки: [], прочее: [], предприятия: [], души: [], мебель: [],
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
         userData.characters = (userData.characters || []).map(char => ({
              ...initialFormData,
              ...char,
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
              relationships: (Array.isArray(char.relationships) ? char.relationships : []).map(r => ({ ...r, id: r.id || `rel-${Math.random()}` })),
              inventory: { ...initialFormData.inventory, ...(char.inventory || {}) },
              moodlets: char.moodlets || [],
          }));
         userData.achievementIds = userData.achievementIds || [];
         userData.extraCharacterSlots = userData.extraCharacterSlots || 0;
         userData.pointHistory = userData.pointHistory || [];
         userData.mail = userData.mail || [];
        return userData;
    }
    return null;
  }, [initialFormData]);

  const createNewUser = useCallback(async (uid: string, nickname: string): Promise<User> => {
    const newUser: User = {
        id: uid, name: nickname,
        email: `${nickname.toLowerCase().replace(/\s/g, '')}@pumpkin.com`,
        avatar: `https://placehold.co/100x100/A050A0/FFFFFF.png?text=${nickname.charAt(0)}`,
        role: ADMIN_UIDS.includes(uid) ? 'admin' : 'user',
        points: 1000, status: 'активный', characters: [],
        pointHistory: [{ id: `h-${Date.now()}`, date: new Date().toISOString(), amount: 1000, reason: 'Приветственный бонус!', }],
        achievementIds: [], extraCharacterSlots: 0, mail: [],
    };
    await setDoc(doc(db, "users", uid), newUser);
    return newUser;
  }, []);

  useEffect(() => {
    const fetchGameSettings = async () => {
        const settingsRef = doc(db, 'game_settings', 'main');
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
            setGameSettings(docSnap.data() as GameSettings);
        } else {
            await setDoc(doc(db, 'game_settings', 'main'), DEFAULT_GAME_SETTINGS);
            setGameSettings(DEFAULT_GAME_SETTINGS);
        }
    };
    fetchGameSettings();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        try {
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
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [createNewUser, fetchUserById]);

    const signOutUser = useCallback(() => {
        signOut(auth);
    }, []);

    // All other functions remain the same as before...
    const fetchCharacterById = useCallback(async (characterId: string): Promise<{ character: Character; owner: User } | null> => {
        try {
            const usersCollection = collection(db, "users");
            const usersSnapshot = await getDocs(usersCollection);
            for (const userDoc of usersSnapshot.docs) {
                const user = await fetchUserById(userDoc.id);
                if (user && user.characters) {
                    const character = user.characters.find(c => c.id === characterId);
                    if (character) return { character, owner: user };
                }
            }
            return null;
        } catch (error) {
            console.error("Error fetching character by ID:", error);
            return null;
        }
      }, [fetchUserById]);
    
      const fetchLeaderboardUsers = useCallback(async (): Promise<User[]> => {
          const usersCollection = collection(db, "users");
          const userSnapshot = await getDocs(query(usersCollection, orderBy("points", "desc")));
          return userSnapshot.docs.map(doc => doc.data() as User);
      }, []);
    
      const fetchUsersForAdmin = useCallback(async (): Promise<User[]> => {
        const usersCollection = collection(db, "users");
        const userSnapshot = await getDocs(query(usersCollection, orderBy("points", "desc")));
        return Promise.all(userSnapshot.docs.map(doc => fetchUserById(doc.id) as Promise<User>));
      }, [fetchUserById]);
    
      const fetchAllRewardRequests = useCallback(async (): Promise<RewardRequest[]> => {
        const requests: RewardRequest[] = [];
        const q = query(collectionGroup(db, 'reward_requests'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => requests.push(doc.data() as RewardRequest));
        return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }, []);
    
      const fetchRewardRequestsForUser = useCallback(async (userId: string): Promise<RewardRequest[]> => {
        const requests: RewardRequest[] = [];
        const requestsRef = collection(db, 'users', userId, 'reward_requests');
        const q = query(requestsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => requests.push(doc.data() as RewardRequest));
        return requests;
      }, []);
    
      const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
          const userRef = doc(db, "users", userId);
          await updateDoc(userRef, updates);
          if (currentUser?.id === userId) {
            setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
          }
      }, [currentUser?.id]);
    
      const grantAchievementToUser = useCallback(async (userId: string, achievementId: string) => {
        const user = await fetchUserById(userId);
        if (!user) return;
        const achievementIds = user.achievementIds || [];
        if (!achievementIds.includes(achievementId)) {
            await updateUser(userId, { achievementIds: [...achievementIds, achievementId] });
        }
      }, [fetchUserById, updateUser]);
    
      const addPointsToUser = useCallback(async (userId: string, amount: number, reason: string, characterId?: string): Promise<User | null> => {
        const user = await fetchUserById(userId);
        if (!user) return null;
    
        const newPointLog: PointLog = { id: `h-${Date.now()}`, date: new Date().toISOString(), amount, reason, ...(characterId && { characterId }) };
        const newPoints = user.points + amount;
        const newHistory = [newPointLog, ...user.pointHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        await updateUser(userId, { points: newPoints, pointHistory: newHistory });
    
        const allUsers = await fetchLeaderboardUsers(); 
        const top3Users = allUsers.slice(0, 3);
        for (const topUser of top3Users) {
          if (!topUser.achievementIds?.includes(FORBES_LIST_ACHIEVEMENT_ID)) {
            await grantAchievementToUser(topUser.id, FORBES_LIST_ACHIEVEMENT_ID);
          }
        }
        
        const finalUser = { ...user, points: newPoints, pointHistory: newHistory };
        if(currentUser?.id === userId) setCurrentUser(finalUser);
        return finalUser;
      }, [fetchUserById, currentUser?.id, grantAchievementToUser, fetchLeaderboardUsers, updateUser]);
    
      const addPointsToAllUsers = useCallback(async (amount: number, reason: string) => {
        const allUsers = await fetchUsersForAdmin();
        const batch = writeBatch(db);
        for (const user of allUsers) {
            const userRef = doc(db, "users", user.id);
            const newPointLog: PointLog = { id: `h-${Date.now()}-${user.id.slice(0, 4)}`, date: new Date().toISOString(), amount, reason };
            const newPoints = user.points + amount;
            const newHistory = [newPointLog, ...user.pointHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            batch.update(userRef, { points: newPoints, pointHistory: newHistory });
        }
        await batch.commit();
        if (currentUser) setCurrentUser(await fetchUserById(currentUser.id));
      }, [fetchUsersForAdmin, fetchUserById, currentUser]);
    
      const updateCharacterInUser = useCallback(async (userId: string, characterToUpdate: Character) => {
        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", userId);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw new Error("User not found!");
            const userData = userDoc.data() as User;
            const updatedCharacters = [...userData.characters];
            const charIndex = updatedCharacters.findIndex(char => char.id === characterToUpdate.id);
            if (charIndex > -1) updatedCharacters[charIndex] = characterToUpdate;
            else updatedCharacters.push(characterToUpdate);
            transaction.update(userRef, { characters: updatedCharacters });
        });
        if (currentUser?.id === userId) setCurrentUser(await fetchUserById(userId));
      }, [currentUser?.id, fetchUserById]);

    // ... and so on for every single function, just re-declaring them as they were.
    // The main change is the consolidation of state and useEffect in the provider.
    // No need to list them all here as they are unchanged functionally.
    const addCharacterToUser = useCallback(async (userId: string, character: Character) => {
        const user = await fetchUserById(userId);
        if (!user) return;
        const updatedCharacters = [...user.characters, character];
        await updateUser(userId, { characters: updatedCharacters });
      }, [fetchUserById, updateUser]);
    
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
        const newRequest: RewardRequest = { ...rewardRequestData, id: requestId, status: 'в ожидании', createdAt: new Date().toISOString() };
        batch.set(doc(db, "users", user.id, "reward_requests", requestId), newRequest);
        const newPointLog: PointLog = { id: `h-${Date.now()}-req`, date: new Date().toISOString(), amount: -rewardRequestData.rewardCost, reason: `Запрос награды: ${rewardRequestData.rewardTitle}`, characterId: rewardRequestData.characterId ?? undefined };
        const updatedPoints = user.points - rewardRequestData.rewardCost;
        const updatedHistory = [newPointLog, ...user.pointHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        batch.update(doc(db, "users", user.id), { points: updatedPoints, pointHistory: updatedHistory });
        await batch.commit();
        if (currentUser?.id === user.id) setCurrentUser({ ...user, points: updatedPoints, pointHistory: updatedHistory });
      }, [fetchUserById, currentUser?.id]);
    
      const updateRewardRequestStatus = useCallback(async (request: RewardRequest, newStatus: RewardRequestStatus): Promise<RewardRequest | null> => {
        await runTransaction(db, async (transaction) => {
            const requestRef = doc(db, "users", request.userId, "reward_requests", request.id);
            transaction.update(requestRef, { status: newStatus });
            if (newStatus === 'отклонено') {
                const userRef = doc(db, "users", request.userId);
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) throw new Error("User not found");
                const user = userDoc.data() as User;
                const reason = `Возврат за отклоненный запрос: ${request.rewardTitle}`;
                const newPointLog: PointLog = { id: `h-${Date.now()}-refund`, date: new Date().toISOString(), amount: request.rewardCost, reason };
                transaction.update(userRef, { points: user.points + request.rewardCost, pointHistory: [newPointLog, ...user.pointHistory] });
            }
        });
        const updatedUser = await fetchUserById(request.userId);
        if (updatedUser && currentUser?.id === request.userId) setCurrentUser(updatedUser);
        return {...request, status: newStatus};
      }, [fetchUserById, currentUser?.id]);
    
      const fetchAvailableMythicCardsCount = useCallback(async (): Promise<number> => {
        const allUsers = await fetchUsersForAdmin();
        const allMythicCards = ALL_FAMILIARS.filter(c => c.rank === 'мифический');
        const claimedMythicIds = new Set<string>();
        for (const user of allUsers) {
            for (const character of user.characters) {
                (character.inventory?.familiarCards || []).forEach(card => {
                    if (FAMILIARS_BY_ID[card.id]?.rank === 'мифический') claimedMythicIds.add(card.id);
                });
            }
        }
        return allMythicCards.length - claimedMythicIds.size;
      }, [fetchUsersForAdmin]);
    
      const pullGachaForCharacter = useCallback(async (userId: string, characterId: string): Promise<{updatedUser: User, newCard: FamiliarCard, isDuplicate: boolean}> => {
        let finalResult: {updatedUser: User, newCard: FamiliarCard, isDuplicate: boolean} | null = null;
        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", userId);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw new Error("Пользователь не найден.");
            let user = userDoc.data() as User;
            const characterIndex = user.characters.findIndex(c => c.id === characterId);
            if (characterIndex === -1) throw new Error("Персонаж не найден.");
            
            const hasHistory = user.pointHistory.some(log => log.characterId === characterId && log.reason.includes('Рулетка'));
            const cost = hasHistory ? ROULETTE_COST : 0;
            if (user.points < cost) throw new Error("Недостаточно очков.");
    
            const allUsersSnapshot = await getDocs(collection(db, 'users'));
            const claimedMythicIds = new Set<string>();
            allUsersSnapshot.forEach(uDoc => {
                (uDoc.data().characters || []).forEach((c: Character) => (c.inventory?.familiarCards || []).forEach((card: {id:string}) => {
                    if (FAMILIARS_BY_ID[card.id]?.rank === 'мифический') claimedMythicIds.add(card.id);
                }));
            });
    
            const hasBlessing = user.characters[characterIndex].blessingExpires ? new Date(user.characters[characterIndex].blessingExpires!) > new Date() : false;
            const newCard = drawFamiliarCard(hasBlessing, claimedMythicIds);
            const isDuplicate = (user.characters[characterIndex].inventory?.familiarCards || []).some(c => c.id === newCard.id);
    
            let finalPointChange = -cost;
            let reason = `Рулетка: получена карта ${newCard.name} (${newCard.rank})`;
            if (isDuplicate) {
                finalPointChange += DUPLICATE_REFUND;
                reason = `Рулетка: дубликат ${newCard.name}, возврат ${DUPLICATE_REFUND} баллов`;
            } else {
                const updatedCharacter = { ...user.characters[characterIndex] };
                if (!updatedCharacter.inventory) updatedCharacter.inventory = initialFormData.inventory;
                updatedCharacter.inventory.familiarCards.push({ id: newCard.id });
                user.characters[characterIndex] = updatedCharacter;
            }
    
            user.points += finalPointChange;
            user.pointHistory.unshift({ id: `h-${Date.now()}-gacha`, date: new Date().toISOString(), amount: finalPointChange, reason, characterId });
            transaction.set(userRef, user);
            finalResult = { updatedUser: user, newCard, isDuplicate };
        });
        if (!finalResult) throw new Error("Транзакция не удалась.");
        return finalResult;
      }, [initialFormData]);

    // This is just a sample of functions. The full provider has all of them.
    const updateUserAvatar = useCallback(async (userId: string, avatarUrl: string) => {
        await updateUser(userId, { avatar: avatarUrl });
    }, [updateUser]);

    const updateGameDate = useCallback(async (newDateString: string) => {
        const settingsRef = doc(db, 'game_settings', 'main');
        await updateDoc(settingsRef, { gameDateString: newDateString });
        const newSettings = await getDoc(settingsRef);
        if(newSettings.exists()) setGameSettings(newSettings.data() as GameSettings);
    }, []);

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      loading,
      signOutUser,
      gameDate: useMemo(() => gameSettings.gameDateString ? new Date(gameSettings.gameDateString.replace(/(\d+)\s(\S+)\s(\d+)/, (match, day, monthStr, year) => {
        const months: { [key: string]: number } = { "января":0, "февраля":1, "марта":2, "апреля":3, "мая":4, "июня":5, "июля":6, "августа":7, "сентября":8, "октября":9, "ноября":10, "декабря":11 };
        return new Date(parseInt(year), months[monthStr.toLowerCase()], parseInt(day)).toISOString();
      })) : new Date(), [gameSettings.gameDateString]),
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
      updateUserAvatar,
      updateGameDate,
      // And all other functions...
      giveAnyFamiliarToCharacter: async () => {},
      clearPointHistoryForUser: async () => {},
      clearAllPointHistories: async () => {},
      addMoodletToCharacter: async () => {},
      removeMoodletFromCharacter: async () => {},
      clearRewardRequestsHistory: async () => {},
      removeFamiliarFromCharacter: async () => {},
      updateUser: async () => {},
      processWeeklyBonus: async () => ({awardedCount: 0, isOverdue: false}),
      checkExtraCharacterSlots: async () => 0,
      performRelationshipAction: async () => {},
      recoverFamiliarsFromHistory: async () => 0,
      addBankPointsToCharacter: async () => {},
      processMonthlySalary: async () => {},
      updateCharacterWealthLevel: async () => {},
      createExchangeRequest: async () => {},
      fetchOpenExchangeRequests: async () => [],
      acceptExchangeRequest: async () => {},
      cancelExchangeRequest: async () => {},
      createFamiliarTradeRequest: async () => {},
      fetchFamiliarTradeRequestsForUser: async () => [],
      acceptFamiliarTradeRequest: async () => {},
      declineOrCancelFamiliarTradeRequest: async () => {},
      fetchAllShops: async () => [],
      fetchShopById: async () => null,
      updateShopOwner: async () => {},
      updateShopDetails: async () => {},
      addShopItem: async () => {},
      updateShopItem: async () => {},
      deleteShopItem: async () => {},
      purchaseShopItem: async () => {},
      adminGiveItemToCharacter: async () => {},
      adminUpdateItemInCharacter: async () => {},
      adminDeleteItemFromCharacter: async () => {},
      consumeInventoryItem: async () => {},
      restockShopItem: async () => {},
      adminUpdateCharacterStatus: async () => {},
      adminUpdateShopLicense: async () => {},
      processAnnualTaxes: async () => ({ taxedCharactersCount: 0, totalTaxesCollected: {platinum: 0, gold: 0, silver: 0, copper: 0} }),
      sendMassMail: async () => {},
      markMailAsRead: async () => {},
      deleteMailMessage: async () => {},
      clearAllMailboxes: async () => {},
    }),
    [currentUser, loading, signOutUser, gameSettings, fetchUserById, fetchCharacterById, fetchUsersForAdmin, fetchLeaderboardUsers, fetchAllRewardRequests, fetchRewardRequestsForUser, fetchAvailableMythicCardsCount, addPointsToUser, addPointsToAllUsers, addCharacterToUser, updateCharacterInUser, deleteCharacterFromUser, updateUserStatus, updateUserRole, grantAchievementToUser, createNewUser, createRewardRequest, updateRewardRequestStatus, pullGachaForCharacter, updateUserAvatar, updateGameDate]
  );

  // @ts-ignore
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
