
"use client";

import React, { createContext, useState, useMemo, useCallback, useEffect, useContext } from 'react';
import type { User, Character, PointLog, UserStatus, UserRole, RewardRequest, RewardRequestStatus, FamiliarCard, Moodlet, Inventory, GameSettings } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, writeBatch, collection, getDocs, query, where, orderBy, deleteDoc, collectionGroup } from "firebase/firestore";
import { ALL_FAMILIARS, FAMILIARS_BY_ID, MOODLETS_DATA, DEFAULT_GAME_SETTINGS } from '@/lib/data';

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
  fetchUsersForAdmin: () => Promise<User[]>;
  fetchAllRewardRequests: () => Promise<RewardRequest[]>;
  addPointsToUser: (userId: string, amount: number, reason: string, characterName?: string) => Promise<User | null>;
  addCharacterToUser: (userId: string, character: Character) => Promise<void>;
  updateCharacterInUser: (userId: string, character: Character) => Promise<void>;
  deleteCharacterFromUser: (userId: string, characterId: string) => Promise<void>;
  updateUserStatus: (userId: string, status: UserStatus) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  grantAchievementToUser: (userId: string, achievementId: string) => Promise<void>;
  createNewUser: (uid: string, nickname: string) => Promise<User>;
  createRewardRequest: (rewardRequest: Omit<RewardRequest, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  updateRewardRequestStatus: (request: RewardRequest, newStatus: RewardRequestStatus) => Promise<RewardRequest | null>;
  pullGachaForCharacter: (userId: string, characterId: string) => Promise<{newCard: FamiliarCard, isDuplicate: boolean}>;
  giveEventFamiliarToCharacter: (userId: string, characterId: string, familiarId: string) => Promise<void>;
  fetchAvailableMythicCardsCount: () => Promise<number>;
  clearPointHistoryForUser: (userId: string) => Promise<void>;
  addMoodletToCharacter: (userId: string, characterId: string, moodletId: string, durationInDays: number, source?: string) => Promise<void>;
  removeMoodletFromCharacter: (userId: string, characterId: string, moodletId: string) => Promise<void>;
  clearRewardRequestsHistory: () => Promise<void>;
  removeFamiliarFromCharacter: (userId: string, characterId: string, cardId: string) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  updateGameDate: (newDateString: string) => Promise<void>;
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
    } else if (rand < mythicChance + legendaryChance + rareChance && availableCommon.length > 0) {
        chosenPool = availableCommon;
    } else if (availableCommon.length > 0) {
        chosenPool = availableCommon;
    } else {
      chosenPool = availableCards.filter(c => c.rank !== 'мифический');
    }
    
    if (chosenPool.length === 0) {
      chosenPool = availableCards.filter(c => c.rank !== 'мифический' || (c.rank === 'мифический' && !unavailableMythicIds.has(c.id)));
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
            if (dateParts) {
                const months: { [key: string]: number } = { "января":0, "февраля":1, "марта":2, "апреля":3, "мая":4, "июня":5, "июля":6, "августа":7, "сентября":8, "октября":9, "ноября":10, "декабря":11 };
                const day = parseInt(dateParts[1]);
                const month = months[dateParts[2].toLowerCase()];
                const year = parseInt(dateParts[3]);
                const gameDate = new Date(year, month, day);
                 if (!isNaN(gameDate.getTime())) {
                    setGameSettings({ gameDateString: dateStr, gameDate });
                }
            }
        }
    } catch (error) {
        console.error("Error fetching game settings. Using default.", error);
    }
  }, []);

  const updateGameDate = useCallback(async (newDateString: string) => {
    const settingsRef = doc(db, 'game_settings', 'main');
    await setDoc(settingsRef, { gameDateString: newDateString }, { merge: true });
    await fetchGameSettings();
  }, [fetchGameSettings]);

  const initialFormData: Character = useMemo(() => ({
    id: '',
    name: '',
    activity: '',
    race: '',
    birthDate: '',
    skillLevel: [],
    skillDescription: '',
    currentFameLevel: [],
    workLocation: '',
    appearance: '',
    personality: '',
    biography: '',
    diary: '',
    training: [],
    relationships: '',
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
    }
  }), []);

  const fetchUserById = useCallback(async (userId: string): Promise<User | null> => {
      const userRef = doc(db, "users", userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
          const userData = docSnap.data() as User;
           userData.characters = userData.characters?.map(char => ({
                ...initialFormData,
                ...char,
                currentFameLevel: Array.isArray(char.currentFameLevel) ? char.currentFameLevel : (char.currentFameLevel ? [char.currentFameLevel] : []),
                skillLevel: Array.isArray(char.skillLevel) ? char.skillLevel : (char.skillLevel ? [char.skillLevel] : []),
                training: Array.isArray(char.training) ? char.training : [],
                marriedTo: Array.isArray(char.marriedTo) ? char.marriedTo : [],
                inventory: char.inventory || { оружие: [], гардероб: [], еда: [], подарки: [], артефакты: [], зелья: [], недвижимость: [], транспорт: [], familiarCards: char.familiarCards || [] },
                moodlets: char.moodlets || [],
            })) || [];
           userData.achievementIds = userData.achievementIds || [];
          return userData;
      }
      return null;
  }, [initialFormData]);

  const createNewUser = useCallback(async (uid: string, nickname: string): Promise<User> => {
    const newUser: User = {
        id: uid,
        name: nickname,
        email: `${nickname.toLowerCase().replace(/\s/g, '')}@pumpkin.com`,
        avatar: `https://placehold.co/100x100/888888/FFFFFF.png?text=${nickname.charAt(0)}`,
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
  }, [createNewUser, fetchUserById]);

    useEffect(() => {
        if (currentUser?.role === 'admin') {
            fetchGameSettings();
        }
    }, [currentUser, fetchGameSettings]);

  const fetchUsersForAdmin = useCallback(async (): Promise<User[]> => {
    try {
        const usersCollection = collection(db, "users");
        // This query requires a composite index on 'points' descending.
        // Firestore will provide a link in the console error to create it.
        const q = query(usersCollection, orderBy("points", "desc"));
        const userSnapshot = await getDocs(q);
        return userSnapshot.docs.map(doc => {
            const userData = doc.data() as User;
            userData.characters = userData.characters?.map(char => ({
                ...initialFormData,
                ...char,
                inventory: char.inventory || { оружие: [], гардероб: [], еда: [], подарки: [], артефакты: [], зелья: [], недвижимость: [], транспорт: [], familiarCards: char.familiarCards || [] },
                moodlets: char.moodlets || [],
            })) || [];
            userData.achievementIds = userData.achievementIds || [];
            return userData;
        });
    } catch(error) {
        console.error("Error fetching users for admin. This likely requires a Firestore index. Check the browser console for a link to create it.", error);
        throw error;
    }
  }, [initialFormData]);

  const fetchAllRewardRequests = useCallback(async (): Promise<RewardRequest[]> => {
    try {
        // This query requires a composite index. Firestore will provide a link to create it in the error message in the console.
        const requestsQuery = collectionGroup(db, 'reward_requests');
        const q = query(requestsQuery, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as RewardRequest);
    } catch (error) {
        console.error("Error fetching reward requests with collectionGroup. This might be a Firestore rules or index issue. Check the browser console.", error);
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

  const grantAchievementToUser = useCallback(async (userId: string, achievementId: string) => {
    const user = await fetchUserById(userId);
    if (!user) return;

    const achievementIds = user.achievementIds || [];
    if (!achievementIds.includes(achievementId)) {
        const updatedAchievementIds = [...achievementIds, achievementId];
        await updateUser(userId, { achievementIds: updatedAchievementIds });
    }
  }, [fetchUserById, updateUser]);

  const addPointsToUser = useCallback(async (userId: string, amount: number, reason: string, characterName?: string): Promise<User | null> => {
    const user = await fetchUserById(userId);
    if (!user) return null;

    const newPointLog: PointLog = {
      id: `h-${Date.now()}`,
      date: new Date().toISOString(),
      amount,
      reason,
      ...(characterName && { characterName }),
    };
    const newPoints = user.points + amount;
    const newHistory = [newPointLog, ...user.pointHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const updates: Partial<User> = { points: newPoints, pointHistory: newHistory };
    
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, updates);

    // After updating points, check for Forbes list achievement
    const allUsers = await fetchUsersForAdmin(); // Using the safe, indexed query
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
  }, [fetchUserById, currentUser?.id, grantAchievementToUser, fetchUsersForAdmin]);

  const addCharacterToUser = useCallback(async (userId: string, characterData: Character) => {
    const user = await fetchUserById(userId);
    if (!user) return;

    const updatedCharacters = [...user.characters, characterData];
    await updateUser(userId, { characters: updatedCharacters });
  }, [fetchUserById, updateUser]);

  const updateCharacterInUser = useCallback(async (userId: string, characterToUpdate: Character) => {
    const user = await fetchUserById(userId);
    if (!user) return;
    
    const characterIndex = user.characters.findIndex(char => char.id === characterToUpdate.id);
    const updatedCharacters = [...user.characters];

    if (characterIndex > -1) {
      updatedCharacters[characterIndex] = characterToUpdate;
    } else {
      updatedCharacters.push(characterToUpdate);
    }
    
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


  const pullGachaForCharacter = useCallback(async (userId: string, characterId: string): Promise<{newCard: FamiliarCard, isDuplicate: boolean}> => {
    const allUsers = await fetchUsersForAdmin(); // Use the safe query
    let user = allUsers.find(u => u.id === userId);

    if (!user) throw new Error("Пользователь не найден.");
    
    const hasPulledGachaBefore = user.pointHistory.some(log => log.reason.includes('Рулетка'));
    const hasFirstPullAchievement = (user.achievementIds || []).includes(FIRST_PULL_ACHIEVEMENT_ID);

    if (!hasPulledGachaBefore && !hasFirstPullAchievement) {
        await grantAchievementToUser(userId, FIRST_PULL_ACHIEVEMENT_ID);
        user = await fetchUserById(userId);
        if (!user) throw new Error("Could not re-fetch user after granting achievement.");
    }
    
    const characterIndex = user.characters.findIndex(c => c.id === characterId);
    if (characterIndex === -1) throw new Error("Персонаж не найден.");
    const character = user.characters[characterIndex];

    const isFirstPullForChar = !user.pointHistory.some(log => log.characterName === character.name && log.reason.includes('Рулетка'));
    const cost = isFirstPullForChar ? 0 : ROULETTE_COST;

    if (user.points < cost) throw new Error("Недостаточно очков.");

    const claimedMythicIds = new Set<string>();
    allUsers.forEach(u => {
        u.characters.forEach(c => {
            (c.inventory?.familiarCards || c.familiarCards || []).forEach(card => {
                const familiar = FAMILIARS_BY_ID[card.id];
                if (familiar && familiar.rank === 'мифический') {
                    claimedMythicIds.add(card.id);
                }
            })
        })
    });
    
    const hasBlessing = character.blessingExpires ? new Date(character.blessingExpires) > new Date() : false;
    const newCard = drawFamiliarCard(hasBlessing, claimedMythicIds);
    
    const ownedCardIds = new Set((character.inventory?.familiarCards || character.familiarCards || []).map(c => c.id));
    const isDuplicate = ownedCardIds.has(newCard.id);
    
    const batch = writeBatch(db);
    const updatedUser = { ...user };
    let finalPointChange = -cost;
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

    updatedUser.points += finalPointChange;

    const newPointLog: PointLog = {
        id: `h-${Date.now()}-gacha`,
        date: new Date().toISOString(),
        amount: finalPointChange,
        reason: reason,
        characterName: character.name,
    };
    updatedUser.pointHistory.unshift(newPointLog);

    const userRef = doc(db, "users", userId);
    batch.set(userRef, updatedUser);
    await batch.commit();
    
    if (currentUser?.id === userId) {
        setCurrentUser(updatedUser);
    }

    return { newCard, isDuplicate };
  }, [currentUser?.id, grantAchievementToUser, fetchUserById, fetchUsersForAdmin]);
  
  const fetchAvailableMythicCardsCount = useCallback(async (): Promise<number> => {
      const allUsers = await fetchUsersForAdmin();
      const allMythicCards = ALL_FAMILIARS.filter(c => c.rank === 'мифический');
      const totalMythicCount = allMythicCards.length;

      const claimedMythicIds = new Set<string>();
      allUsers.forEach(u => {
        u.characters.forEach(c => {
            (c.inventory?.familiarCards || c.familiarCards || []).forEach(card => {
                const familiar = FAMILIARS_BY_ID[card.id];
                if (familiar && familiar.rank === 'мифический') {
                    claimedMythicIds.add(card.id);
                }
            })
        })
    });

    return totalMythicCount - claimedMythicIds.size;
  }, [fetchUsersForAdmin]);

  const giveEventFamiliarToCharacter = useCallback(async (userId: string, characterId: string, familiarId: string) => {
    const user = await fetchUserById(userId);
    if (!user) return;

    const characterIndex = user.characters.findIndex(c => c.id === characterId);
    if (characterIndex === -1) return;

    const familiar = FAMILIARS_BY_ID[familiarId];
    if (!familiar) return;

    const character = { ...user.characters[characterIndex] };
    const inventory = character.inventory || { оружие: [], гардероб: [], еда: [], подарки: [], артефакты: [], зелья: [], недвижимость: [], транспорт: [], familiarCards: [] };
    
    if ((inventory.familiarCards || []).some(card => card.id === familiarId)) {
      console.warn(`Character ${character.name} already owns familiar ${familiar.name}`);
      return;
    }

    inventory.familiarCards = [...(inventory.familiarCards || []), { id: familiarId }];
    character.inventory = inventory;

    const updatedCharacters = [...user.characters];
    updatedCharacters[characterIndex] = character;
    
    const newPointLog: PointLog = {
        id: `h-${Date.now()}-event`,
        date: new Date().toISOString(),
        amount: 0,
        reason: `Ивентовая награда: получен фамильяр "${familiar.name}"`,
        characterName: character.name,
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
      fetchUsersForAdmin,
      fetchAllRewardRequests,
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
      giveEventFamiliarToCharacter,
      fetchAvailableMythicCardsCount,
      clearPointHistoryForUser,
      addMoodletToCharacter,
      removeMoodletFromCharacter,
      clearRewardRequestsHistory,
      removeFamiliarFromCharacter,
      updateUser,
      updateGameDate,
    }),
    [currentUser, gameSettings, fetchUsersForAdmin, fetchAllRewardRequests, addPointsToUser, addCharacterToUser, updateCharacterInUser, deleteCharacterFromUser, updateUserStatus, updateUserRole, grantAchievementToUser, createNewUser, createRewardRequest, updateRewardRequestStatus, pullGachaForCharacter, giveEventFamiliarToCharacter, fetchAvailableMythicCardsCount, clearPointHistoryForUser, addMoodletToCharacter, removeMoodletFromCharacter, clearRewardRequestsHistory, removeFamiliarFromCharacter, updateUser, updateGameDate]
  );

  return (
    <AuthContext.Provider value={authValue}>
        <UserContext.Provider value={userContextValue}>
            {children}
        </UserContext.Provider>
    </AuthContext.Provider>
  );
}
