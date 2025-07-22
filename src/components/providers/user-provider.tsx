
"use client";

import React, { createContext, useState, useMemo, useCallback, useEffect, useContext } from 'react';
import type { User, Character, PointLog, UserStatus, UserRole, RewardRequest, RewardRequestStatus, FamiliarCard, OwnedFamiliarCard } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, writeBatch, collectionGroup, query, orderBy } from "firebase/firestore";
import { ALL_FAMILIARS, EVENT_FAMILIARS, FAMILIARS_BY_ID } from '@/lib/data';

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
  users: User[];
  rewardRequests: RewardRequest[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  addPointsToUser: (userId: string, amount: number, reason: string, characterName?: string) => void;
  addCharacterToUser: (userId: string, character: Omit<Character, 'id'>) => void;
  deleteCharacterFromUser: (userId: string, characterId: string) => void;
  updateUserStatus: (userId: string, status: UserStatus) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  createNewUser: (uid: string, nickname: string) => Promise<User>;
  createRewardRequest: (rewardRequest: Omit<RewardRequest, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  updateRewardRequestStatus: (requestId: string, status: RewardRequestStatus) => Promise<void>;
  pullGachaForCharacter: (userId: string, characterId: string, cost: number) => Promise<FamiliarCard>;
  giveEventFamiliarToCharacter: (userId: string, characterId: string, familiarId: string) => void;
}

export const UserContext = createContext<UserContextType | null>(null);

const ADMIN_UIDS = ['Td5P02zpyaMR3IxCY9eCf7gcYky1', 'yawuIwXKVbNhsBQSqWfGZyAzZ3A3'];

const drawFamiliarCard = (ownedCardIds: Set<string>): FamiliarCard => {
    const availableCards = ALL_FAMILIARS.filter(c => !ownedCardIds.has(c.id));

    if (availableCards.length === 0) {
        throw new Error("Поздравляем! Вы собрали все доступные карты фамильяров.");
    }
    
    const rand = Math.random() * 100;

    // Filter available cards by rank
    const availableMythic = availableCards.filter(c => c.rank === 'мифический');
    const availableLegendary = availableCards.filter(c => c.rank === 'легендарный');
    const availableRare = availableCards.filter(c => c.rank === 'редкий');
    const availableCommon = availableCards.filter(c => c.rank === 'обычный');

    let chosenPool: FamiliarCard[] = [];

    if (rand < 5 && availableMythic.length > 0) { // 5% chance for mythic
        chosenPool = availableMythic;
    } else if (rand < 15 && availableLegendary.length > 0) { // 10% chance for legendary
        chosenPool = availableLegendary;
    } else if (rand < 40 && availableRare.length > 0) { // 25% chance for rare
        chosenPool = availableRare;
    } else if (availableCommon.length > 0) { // Common or fallback
        chosenPool = availableCommon;
    } else {
      // Fallback to any available card if preferred ranks are all owned
      chosenPool = availableCards;
    }
    
    if (chosenPool.length === 0) {
      // This should only happen if logic is flawed or all cards of all ranks are exhausted.
      // Final fallback to any available card.
      chosenPool = availableCards;
    }

    return chosenPool[Math.floor(Math.random() * chosenPool.length)];
};


export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [rewardRequests, setRewardRequests] = useState<RewardRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

  // Load all users and requests from Firestore on initial mount
  useEffect(() => {
    const fetchAllData = async () => {
        try {
            const usersCollection = collection(db, "users");
            const userSnapshot = await getDocs(usersCollection);
            const userList = userSnapshot.docs.map(doc => {
                const userData = doc.data() as User;
                // Ensure all characters have a familiarCards array
                userData.characters = userData.characters?.map(char => ({
                    ...char,
                    familiarCards: char.familiarCards || []
                })) || [];
                return userData;
            });
            setUsers(userList);

            const requestsQuery = query(collectionGroup(db, 'reward_requests'), orderBy('createdAt', 'desc'));
            const requestSnapshot = await getDocs(requestsQuery);
            const requestList = requestSnapshot.docs.map(doc => doc.data() as RewardRequest);
            setRewardRequests(requestList);

        } catch (error) {
            console.error("Could not load data from Firestore", error);
        } finally {
            setIsInitialDataLoaded(true);
        }
    };
    fetchAllData();
  }, []);

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
    };
    try {
      await setDoc(doc(db, "users", uid), newUser);
      setUsers(prev => [...prev, newUser]);
      return newUser;
    } catch(error) {
      console.error("Error creating user in Firestore:", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    if (!isInitialDataLoaded) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        let existingUser = users.find(u => u.id === user.uid);
        
        if (!existingUser) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            existingUser = userDoc.data() as User;
            // Ensure all characters have a familiarCards array for this newly fetched user
            existingUser.characters = existingUser.characters?.map(char => ({
                ...char,
                familiarCards: char.familiarCards || []
            })) || [];
            setUsers(prev => [...prev.filter(u => u.id !== user.uid), existingUser!]);
          } else {
            const nickname = user.displayName || user.email?.split('@')[0] || 'Пользователь';
            existingUser = await createNewUser(user.uid, nickname);
          }
        } else {
             // Also check the user from state
             existingUser.characters = existingUser.characters?.map(char => ({
                ...char,
                familiarCards: char.familiarCards || []
            })) || [];
        }
        
        setCurrentUser(existingUser);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [users, createNewUser, isInitialDataLoaded]);


  const updateUserInStateAndFirestore = async (updatedUser: User) => {
     try {
        await setDoc(doc(db, "users", updatedUser.id), updatedUser, { merge: true });
        setUsers(prevUsers =>
          prevUsers.map(u => (u.id === updatedUser.id ? updatedUser : u))
        );
        if (currentUser?.id === updatedUser.id) {
          setCurrentUser(updatedUser);
        }
      } catch (error) {
        console.error("Error updating user:", error);
      }
  };

  const addPointsToUser = useCallback((userId: string, amount: number, reason: string, characterName?: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newPointLog: PointLog = {
      id: `h-${Date.now()}`,
      date: new Date().toISOString(),
      amount,
      reason,
      ...(characterName && { characterName }),
    };
    const updatedUser = {
      ...user,
      points: user.points + amount,
      pointHistory: [newPointLog, ...user.pointHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
    
    updateUserInStateAndFirestore(updatedUser);
  }, [users]);

  const addCharacterToUser = useCallback((userId: string, characterData: Omit<Character, 'id'>) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const newCharacter: Character = {
        id: `c-${Date.now()}`,
        ...characterData,
        familiarCards: characterData.familiarCards || [] // Ensure it's initialized
    };

    const updatedUser = {
        ...user,
        characters: [...user.characters, newCharacter],
    };
    updateUserInStateAndFirestore(updatedUser);
  }, [users]);

  const deleteCharacterFromUser = useCallback((userId: string, characterId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const updatedUser = {
        ...user,
        characters: user.characters.filter(char => char.id !== characterId),
    };

    updateUserInStateAndFirestore(updatedUser);
  }, [users]);

  const updateUserStatus = useCallback((userId: string, status: UserStatus) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const updatedUser = { ...user, status };
    updateUserInStateAndFirestore(updatedUser);
  }, [users]);

  const updateUserRole = useCallback((userId: string, role: UserRole) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const updatedUser = { ...user, role };
    updateUserInStateAndFirestore(updatedUser);
  }, [users]);
  
  const createRewardRequest = useCallback(async (rewardRequestData: Omit<RewardRequest, 'id' | 'status' | 'createdAt'>) => {
    const user = users.find(u => u.id === rewardRequestData.userId);
    if (!user) throw new Error("User not found for reward request");

    const batch = writeBatch(db);

    // 1. Create the new request
    const requestId = `req-${Date.now()}`;
    const newRequest: RewardRequest = {
        ...rewardRequestData,
        id: requestId,
        status: 'в ожидании',
        createdAt: new Date().toISOString(),
    };
    const requestRef = doc(db, "users", user.id, "reward_requests", requestId);
    batch.set(requestRef, newRequest);

    // 2. Subtract points from the user
    const newPointLog: PointLog = {
      id: `h-${Date.now()}-req`,
      date: new Date().toISOString(),
      amount: -rewardRequestData.rewardCost,
      reason: `Запрос награды: ${rewardRequestData.rewardTitle}`,
    };
    const updatedUser = {
      ...user,
      points: user.points - rewardRequestData.rewardCost,
      pointHistory: [newPointLog, ...user.pointHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
    const userRef = doc(db, "users", user.id);
    batch.set(userRef, updatedUser);

    await batch.commit();

    // Update state locally
    setRewardRequests(prev => [newRequest, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setUsers(prevUsers => prevUsers.map(u => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
    }
  }, [users, currentUser?.id]);
  
 const updateRewardRequestStatus = useCallback(async (requestId: string, status: RewardRequestStatus) => {
      const request = rewardRequests.find(r => r.id === requestId);
      if (!request) throw new Error("Request not found");

      const user = users.find(u => u.id === request.userId);
      if (!user) throw new Error("User for the request not found");

      const batch = writeBatch(db);
      
      const requestRef = doc(db, "users", request.userId, "reward_requests", requestId);
      batch.update(requestRef, { status });
      
      let updatedUser = { ...user };

      // Gacha logic was here, now moved to its own function.
      if (status === 'отклонено') {
          // Refund points
          const reason = `Возврат за отклоненный запрос: ${request.rewardTitle}`;
          const newPointLog: PointLog = {
              id: `h-${Date.now()}-refund`,
              date: new Date().toISOString(),
              amount: request.rewardCost,
              reason,
          };
          updatedUser.points += request.rewardCost;
          updatedUser.pointHistory.unshift(newPointLog);
      }

      const userRef = doc(db, "users", user.id);
      batch.set(userRef, updatedUser, { merge: true });

      await batch.commit();

      // Optimistically update user state
      setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
      if (currentUser?.id === updatedUser.id) {
          setCurrentUser(updatedUser);
      }

      // Optimistically update request state
      setRewardRequests(prev => prev.map(r => r.id === requestId ? { ...r, status } : r));

  }, [rewardRequests, users, currentUser?.id]);


  const pullGachaForCharacter = useCallback(async (userId: string, characterId: string, cost: number): Promise<FamiliarCard> => {
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error("Пользователь не найден.");

    const characterIndex = user.characters.findIndex(c => c.id === characterId);
    if (characterIndex === -1) throw new Error("Персонаж не найден.");

    if (user.points < cost) throw new Error("Недостаточно очков.");

    const character = user.characters[characterIndex];
    const ownedCardIds = new Set((character.familiarCards || []).map(c => c.id));

    const newCard = drawFamiliarCard(ownedCardIds);

    const batch = writeBatch(db);

    // Update character with new card ID
    const updatedCharacter: Character = {
        ...character,
        familiarCards: [...(character.familiarCards || []), { id: newCard.id }],
    };
    
    const updatedUser = { ...user };
    updatedUser.characters[characterIndex] = updatedCharacter;
    
    // Subtract points and add log
    updatedUser.points -= cost;
    const newPointLog: PointLog = {
        id: `h-${Date.now()}-gacha`,
        date: new Date().toISOString(),
        amount: -cost,
        reason: `Гача: получена карта ${newCard.name} (${newCard.rank})`,
        characterName: character.name,
    };
    updatedUser.pointHistory.unshift(newPointLog);

    const userRef = doc(db, "users", userId);
    batch.set(userRef, updatedUser);

    await batch.commit();
    
    // Update state
    setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    if (currentUser?.id === userId) {
        setCurrentUser(updatedUser);
    }
    
    return newCard;
  }, [users, currentUser?.id]);

  const giveEventFamiliarToCharacter = useCallback((userId: string, characterId: string, familiarId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const characterIndex = user.characters.findIndex(c => c.id === characterId);
    if (characterIndex === -1) return;

    const familiar = FAMILIARS_BY_ID[familiarId];
    if (!familiar) return;

    const character = user.characters[characterIndex];
    
    // Check if character already owns this card
    if ((character.familiarCards || []).some(card => card.id === familiarId)) {
      console.warn(`Character ${character.name} already owns familiar ${familiar.name}`);
      // Maybe show a toast here in the future
      return;
    }

    const updatedCharacter: Character = {
      ...character,
      familiarCards: [...(character.familiarCards || []), { id: familiarId }],
    };

    const updatedUser = { ...user };
    updatedUser.characters[characterIndex] = updatedCharacter;
    
    const newPointLog: PointLog = {
        id: `h-${Date.now()}-event`,
        date: new Date().toISOString(),
        amount: 0,
        reason: `Ивентовая награда: получен фамильяр "${familiar.name}"`,
        characterName: character.name,
    };
    updatedUser.pointHistory.unshift(newPointLog);

    updateUserInStateAndFirestore(updatedUser);
  }, [users]);


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
      users,
      rewardRequests,
      currentUser,
      setCurrentUser,
      addPointsToUser,
      addCharacterToUser,
      deleteCharacterFromUser,
      updateUserStatus,
      updateUserRole,
      createNewUser,
      createRewardRequest,
      updateRewardRequestStatus,
      pullGachaForCharacter,
      giveEventFamiliarToCharacter,
    }),
    [users, rewardRequests, currentUser, addPointsToUser, addCharacterToUser, deleteCharacterFromUser, updateUserStatus, updateUserRole, createNewUser, createRewardRequest, updateRewardRequestStatus, pullGachaForCharacter, giveEventFamiliarToCharacter]
  );

  return (
    <AuthContext.Provider value={authValue}>
        <UserContext.Provider value={userContextValue}>
            {children}
        </UserContext.Provider>
    </AuthContext.Provider>
  );
}
