
export type UserRole = 'admin' | 'user';
export type UserStatus = 'активный' | 'неактивный' | 'отпуск';
export type RewardRequestStatus = 'в ожидании' | 'одобрено' | 'отклонено';
export type FamiliarRank = 'обычный' | 'редкий' | 'легендарный' | 'мифический' | 'ивентовый';
export type InventoryCategory = 'оружие' | 'гардероб' | 'еда' | 'подарки' | 'артефакты' | 'зелья' | 'недвижимость' | 'транспорт';
export type RelationshipType = 'романтика' | 'дружба' | 'вражда' | 'конкуренция' | 'нейтралитет';

export interface GameSettings {
  gameDateString: string;
  gameDate: Date;
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
}

export interface Relationship {
  targetCharacterId: string;
  targetCharacterName: string;
  type: RelationshipType;
  level: number; // 1-10
}


export interface Character {
  id: string;
  name: string;
  activity: string;
  race: string;
  birthDate: string;
  skillLevel: string[];
  skillDescription?: string;
  currentFameLevel: string[];
  workLocation: string;
  // New questionnaire fields
  abilities?: string;
  weaknesses?: string;
  lifeGoal?: string;
  pets?: string;
  appearance: string;
  personality: string;
  biography: string;
  diary: string; // "Личный дневник"
  training: string[]; // "Обучение" - Changed to array of strings
  relationships: Relationship[];
  marriedTo?: string[]; // IDs of other characters
  inventory: Inventory;
  // Old fields that are now part of inventory or deprecated at top level
  familiarCards: OwnedFamiliarCard[]; // Kept for backwards compatibility, should be migrated to inventory
  moodlets?: Moodlet[];
  blessingExpires?: string; // ISO string date
  hasLeviathanFriendship?: boolean;
  hasCrimeConnections?: boolean;
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
  extraCharacterSlots?: number;
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
