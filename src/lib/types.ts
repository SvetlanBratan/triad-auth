export type UserRole = 'admin' | 'user';
export type UserStatus = 'активный' | 'неактивный' | 'отпуск';
export type RewardRequestStatus = 'в ожидании' | 'одобрено' | 'отклонено';
export type FamiliarRank = 'обычный' | 'редкий' | 'легендарный' | 'мифический' | 'ивентовый';

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

export interface Character {
  id: string;
  name: string;
  activity: string;
  skillLevel: string;
  currentFameLevel: string;
  workLocation: string;
  familiarCards: OwnedFamiliarCard[];
  blessingExpires?: string; // ISO string date
  hasLeviathanFriendship?: boolean;
  hasCrimeConnections?: boolean;
  moodlets?: Moodlet[];
}

export interface PointLog {
  id: string;
  date: string;
  amount: number;
  reason: string;
  characterName?: string;
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
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  type: 'permanent' | 'temporary';
  iconName: string; 
  requiresCharacter?: boolean;
}

export interface RewardRequest {
  id: string;
  userId: string;
  userName: string;
  rewardId: string;
  rewardTitle: string;
  rewardCost: number;
  characterId?: string;
  characterName?: string;
  status: RewardRequestStatus;
  createdAt: string; // ISO string date
}
