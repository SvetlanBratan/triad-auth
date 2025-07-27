
export type UserRole = 'admin' | 'user';
export type UserStatus = 'активный' | 'неактивный' | 'отпуск';
export type RewardRequestStatus = 'в ожидании' | 'одобрено' | 'отклонено';
export type FamiliarRank = 'обычный' | 'редкий' | 'легендарный' | 'мифический' | 'ивентовый';
export type InventoryCategory = 'оружие' | 'гардоб' | 'еда' | 'подарки' | 'артефакты' | 'зелья' | 'недвижимость' | 'транспорт';
export type RelationshipType = 'романтика' | 'дружба' | 'вражда' | 'конкуренция' | 'нейтралитет' | 'любовь' | 'семья';
export type RelationshipActionType = 'подарок' | 'письмо';
export type RelationshipActionStatus = 'pending' | 'confirmed';
export type WealthLevel = 'Нищий' | 'Бедный' | 'Просветленный' | 'Средний' | 'Выше среднего' | 'Высокий' | 'Сказочно богат';
export type Currency = keyof Omit<BankAccount, 'history'>;
export type ExchangeRequestStatus = 'open' | 'closed';
export type FamiliarTradeRequestStatus = 'в ожидании' | 'принято' | 'отклонено' | 'отменено';
export type CrimeLevel = 1 | 2 | 3 | 4 | 5;


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
  marriage?: never; // for type consistency with EditableSection
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
    imageUrl: string;
    price: Omit<BankAccount, 'history'>;
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
}
