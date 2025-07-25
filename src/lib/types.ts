
export type UserRole = 'admin' | 'user';
export type UserStatus = 'активный' | 'неактивный' | 'отпуск';
export type RewardRequestStatus = 'в ожидании' | 'одобрено' | 'отклонено';
export type FamiliarRank = 'обычный' | 'редкий' | 'легендарный' | 'мифический' | 'ивентовый';
export type InventoryCategory = 'оружие' | 'гардоб' | 'еда' | 'подарки' | 'артефакты' | 'зелья' | 'недвижимость' | 'транспорт';
export type RelationshipType = 'романтика' | 'дружба' | 'вражда' | 'конкуренция' | 'нейтралитет' | 'любовь' | 'семья';
export type RelationshipActionType = 'подарок' | 'письмо';
export type RelationshipActionStatus = 'pending' | 'confirmed';
export type WealthLevel = 'Бедный' | 'Просветленный' | 'Средний' | 'Выше среднего' | 'Высокий';
export type Currency = keyof BankAccount;
export type ExchangeRequestStatus = 'open' | 'closed';
export type FamiliarTradeRequestStatus = 'в ожидании' | 'принято' | 'отклонено' | 'отменено';


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

export interface BankAccount {
  platinum: number;
  gold: number;
  silver: number;
  copper: number;
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
  accomplishments: Accomplishment[];
  workLocation: string;
  abilities?: string;
  weaknesses?: string;
  lifeGoal?: string;
  pets?: string;
  appearance: string;
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
