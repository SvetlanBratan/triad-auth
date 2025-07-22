export type UserRole = 'admin' | 'user';
export type UserStatus = 'активный' | 'неактивный' | 'отпуск';
export type RewardRequestStatus = 'в ожидании' | 'одобрено' | 'отклонено';
export type FamiliarRank = 'обычный' | 'редкий' | 'легендарный' | 'мифический' | 'ивентовый';

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
}

export interface PointLog {
  id: string;
  date: string;
  amount: number;
  reason: string;
  characterName?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  points: number;
  status: UserStatus;
  characters: Character[];
  pointHistory: PointLog[];
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
