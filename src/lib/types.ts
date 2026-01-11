

export type UserRole = "admin" | "user";
export type UserStatus = "активный" | "неактивный" | "отпуск";
export type PlayerStatus =
  | "Должен пост"
  | "Жду пост"
  | "Ищу соигрока"
  | "Не играю"
  | "Регулярные посты"
  | "Медленный темп"
  | "Средний темп";
export type PlayPlatform = "Discord" | "Вконтакте" | "Telegram" | "Не указана";
export type RewardRequestStatus = "в ожидании" | "одобрено" | "отклонено";
export type FamiliarRank =
  | "обычный"
  | "редкий"
  | "легендарный"
  | "мифический"
  | "ивентовый";
export type InventoryCategory =
  | "оружие"
  | "гардероб"
  | "еда"
  | "подарки"
  | "артефакты"
  | "зелья"
  | "недвижимость"
  | "транспорт"
  | "драгоценности"
  | "книгиИСвитки"
  | "прочее"
  | "предприятия"
  | "души"
  | "мебель"
  | "доспехи"
  | "инструменты"
  | "питомцы"
  | "проживание"
  | "услуги"
  | "документы"
  | "ингредиенты";
export type RelationshipType =
  | "романтика"
  | "дружба"
  | "вражда"
  | "конкуренция"
  | "нейтралитет"
  | "любовь"
  | "семья"
  | "уважение"
  | "страсть"
  | "заинтересованность"
  | "сотрудничество";
export type RelationshipActionType = "подарок" | "письмо";
export type RelationshipActionStatus = "pending" | "confirmed";
export type WealthLevel =
  | "Нищий"
  | "Бедный"
  | "Просветленный"
  | "Средний"
  | "Выше среднего"
  | "Высокий"
  | "Сказочно богат";
export type Currency = keyof Omit<BankAccount, "history">;
export type ExchangeRequestStatus = "open" | "closed";
export type FamiliarTradeRequestStatus =
  | "в ожидании"
  | "принято"
  | "отклонено"
  | "отменено";
export type CrimeLevel = 1 | 2 | 3 | 4 | 5;
export type CitizenshipStatus = "citizen" | "non-citizen" | "refugee";
export type TaxpayerStatus = "taxable" | "exempt";
export type MailMessageType = "announcement" | "personal";


export interface SocialLink {
  id: string;
  platform: PlayPlatform;
  link: string;
}

export interface MailMessage {
  id: string;
  senderUserId: string;
  senderCharacterName: string;
  senderCharacterId?: string;
  recipientUserId: string;
  recipientCharacterId: string;
  recipientCharacterName?: string;
  subject: string;
  content: string;
  sentAt: string; // ISO string
  isRead: boolean;
  type: MailMessageType;
}

export interface GameSettings {
  gameDateString: string;
  gameDate: Date;
  lastWeeklyBonusAwardedAt?: string; // ISO string date
  gachaChances: {
    normal: {
      мифический: number;
      легендарный: number;
      редкий: number;
    };
    blessed: {
      мифический: number;
      легендарный: number;
      редкий: number;
    };
  };
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
  "data-ai-hint"?: string;
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
  драгоценности: InventoryItem[];
  книгиИСвитки: InventoryItem[];
  прочее: InventoryItem[];
  предприятия: InventoryItem[];
  души: InventoryItem[];
  мебель: InventoryItem[];
  доспехи: InventoryItem[];
  инструменты: InventoryItem[];
  питомцы: InventoryItem[];
  проживание: InventoryItem[];
  услуги: InventoryItem[];
  документы: InventoryItem[];
  ингредиенты: InventoryItem[];
}

export interface RelationshipAction {
  id: string;
  type: RelationshipActionType;
  date: string; // ISO string
  description: string;
  status: RelationshipActionStatus;
}

export interface Cooldowns {
  [characterId: string]: {
    lastGiftSentAt?: string;
    lastLetterSentAt?: string;
  };
}

export interface Relationship {
  id?: string; // Temporary client-side ID for list rendering
  targetCharacterId: string;
  targetCharacterName: string;
  type: RelationshipType;
  points: number; // 0-1000, where 100 points = 1 level
  history: RelationshipAction[];
  cooldowns?: Cooldowns;
  // Deprecated fields, kept for migration
  lastGiftSentAt?: string;
  lastLetterSentAt?: string;
}

export interface BankTransaction {
  id: string;
  date: string; // ISO string date
  reason: string;
  amount: Partial<Omit<BankAccount, "history">>;
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

export interface PopularityLog {
  id: string;
  date: string; // ISO
  reason: string;
  amount: number;
}

export interface GalleryImage {
  id: string;
  url: string;
  taggedCharacterIds?: string[];
}

export interface Character {
  id: string;
  name: string;
  activity: string;
  race: string;
  raceIsConfirmed?: boolean;
  birthDate: string;
  countryOfResidence?: string;
  residenceLocation?: string;
  citizenshipStatus?: CitizenshipStatus;
  taxpayerStatus?: TaxpayerStatus;
  accomplishments: Accomplishment[];
  workLocation: string;
  factions?: string;
  abilities?: string;
  weaknesses?: string;
  lifeGoal?: string;
  appearance: string;
  appearanceImage?: string;
  personality: string;
  biography: string;
  biographyIsHidden?: boolean;
  diary: string;
  training: string[];
  relationships: Relationship[];
  marriedTo?: string[];
  inventory: Partial<Inventory>;
  familiarCards: OwnedFamiliarCard[];
  moodlets?: Moodlet[];
  blessingExpires?: string;
  hasLeviathanFriendship?: boolean;
  hasCrimeConnections?: boolean;
  bankAccount: BankAccount;
  wealthLevel: WealthLevel;
  crimeLevel?: CrimeLevel;
  criminalRecords?: string;
  popularity: number;
  popularityHistory: PopularityLog[];
  galleryImages?: GalleryImage[];
  bannerImage?: string;
  // Deprecated fields, kept for migration
  skillLevels?: CharacterLevel[];
  fameLevels?: CharacterLevel[];
  pets?: string;
}

export interface PointLog {
  id: string;
  date: string;
  amount: number;
  reason: string;
  characterId?: string;
}

export interface PlayerPing {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  toUserId: string;
  createdAt: string; // ISO string
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  points: number;
  status: UserStatus;
  playerStatus?: PlayerStatus;
  socials?: SocialLink[];
  characters: Character[];
  pointHistory: PointLog[];
  achievementIds?: string[];
  extraCharacterSlots?: number;
  mail?: MailMessage[];
  playerPings?: PlayerPing[];
  favoritePlayerIds?: string[];
  lastLogin?: string; // ISO string
  // Deprecated fields, for migration
  playPlatform?: PlayPlatform;
  socialLink?: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  type: "permanent" | "temporary";
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
  price: Omit<BankAccount, "history">;
  inventoryTag?: InventoryCategory;
  quantity?: number; // undefined or -1 for infinite
  purchaseCount?: number;
  isHidden?: boolean;
  isSinglePurchase?: boolean;
  excludedRaces?: string[];
  requiredDocument?: string;
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
  defaultNewItemCategory?: InventoryCategory;
  purchaseCount?: number;
  bankAccount?: BankAccount;
}

export type AdminGiveItemForm = {
  name: string;
  description: string;
  inventoryTag: InventoryCategory;
  quantity?: number;
  image?: string;
};

export interface PerformRelationshipActionParams {
  sourceUserId: string;
  sourceCharacterId: string;
  targetCharacterId: string;
  actionType: RelationshipActionType;
  description: string;
  itemId?: string;
  itemCategory?: InventoryCategory;
  quantity?: number;
  content?: string; // For letters
}

export interface PopularityEvent {
  label: string;
  value: number;
  achievementId?: string;
}

export interface CharacterPopularityUpdate {
  characterId: string;
  eventIds: string[];
  description?: string;
}

// --- ALCHEMY TYPES ---
export interface AlchemyIngredient extends InventoryItem {
  note?: string;
  tags: string[];
}

export interface Potion extends InventoryItem {
  note?: string;
  effects: {
    stat: "hp" | "mana" | "luck";
    value: number;
    durationSec?: number;
  }[];
  tier: "обычный" | "редкий" | "легендарный";
}

export interface AlchemyRecipeComponent {
  ingredientId: string;
  qty: number;
}

export interface AlchemyRecipe {
  id: string;
  name?: string;
  components: AlchemyRecipeComponent[];
  resultPotionId: string;
  outputQty: number;
  difficulty: number; // 1-10
  createdAt: string; // ISO string
}
// --- END ALCHEMY TYPES ---
