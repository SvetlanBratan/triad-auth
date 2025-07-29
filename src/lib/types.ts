

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
}

export interface UserContextType {
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
}
