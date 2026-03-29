import type { ArmorDefenseType, WeaponDamageType, DamageType } from "./types";

export type OptionType<T extends string = string> = { value: T; label: string };

export const ARMOR_DEFENSE_BONUS_OPTIONS: OptionType<string>[] = [
  { value: "5", label: "Очень слабая защита (+5 защиты)" },
  { value: "10", label: "Слабая защита (+10 защиты)" },
  { value: "20", label: "Средняя защита (+20 защиты)" },
  { value: "35", label: "Высокая защита (+35 защиты)" },
  { value: "50", label: "Очень высокая защита (+50 защиты)" },
];

export const ARMOR_DEFENSE_TYPE_OPTIONS: OptionType<ArmorDefenseType>[] = [
  { value: "Физическая", label: "Физическая" },
  { value: "Магическая", label: "Магическая" },
  { value: "Смешанная", label: "Смешанная" },
];

export const WEAPON_DAMAGE_OPTIONS: OptionType<string>[] = [
  { value: "10", label: "Очень слабый урон (10)" },
  { value: "20", label: "Слабый урон (20)" },
  { value: "35", label: "Средний урон (35)" },
  { value: "50", label: "Высокий урон (50)" },
  { value: "70", label: "Очень высокий урон (70)" },
];

export const WEAPON_DAMAGE_TYPE_OPTIONS: OptionType<WeaponDamageType>[] = [
  { value: "Физический", label: "Физический" },
  { value: "Магический", label: "Магический" },
];

export const ARTIFACT_DAMAGE_TYPE_OPTIONS: OptionType<DamageType>[] = [
  { value: "Физический", label: "Физический" },
  { value: "Магический", label: "Магический" },
  { value: "Психический", label: "Психический" },
];

export const POTION_HEALING_OPTIONS: OptionType<string>[] = [
  { value: "20", label: "Очень слабое лечение (+20 ОЗ)" },
  { value: "40", label: "Слабое лечение (+40 ОЗ)" },
  { value: "70", label: "Среднее лечение (+70 ОЗ)" },
  { value: "100", label: "Сильное лечение (+100 ОЗ)" },
  { value: "150", label: "Очень сильное лечение (+150 ОЗ)" },
];

export const POTION_MANA_RESTORE_OPTIONS: OptionType<string>[] = [
  { value: "15", label: "Восстановление маны (+15 ОМ)" },
  { value: "30", label: "Восстановление маны (+30 ОМ)" },
  { value: "50", label: "Восстановление маны (+50 ОМ)" },
  { value: "80", label: "Восстановление маны (+80 ОМ)" },
];

export type ArtifactRank =
  | "Очень слабый артефакт"
  | "Слабый артефакт"
  | "Обычный артефакт"
  | "Редкий артефакт"
  | "Легендарный артефакт"
  | "Мифический артефакт";

export const ARTIFACT_RANK_OPTIONS: OptionType<ArtifactRank>[] = [
  { value: "Очень слабый артефакт", label: "Очень слабый" },
  { value: "Слабый артефакт", label: "Слабый" },
  { value: "Обычный артефакт", label: "Обычный" },
  { value: "Редкий артефакт", label: "Редкий" },
  { value: "Легендарный артефакт", label: "Легендарный" },
  { value: "Мифический артефакт", label: "Мифический" },
];

export const ARTIFACT_RANK_VALUES: Record<
  ArtifactRank,
  { damage: number; defense: number; heal: number; mana: number }
> = {
  "Очень слабый артефакт": { damage: 5, defense: 5, heal: 15, mana: 10 },
  "Слабый артефакт": { damage: 10, defense: 10, heal: 30, mana: 20 },
  "Обычный артефакт": { damage: 20, defense: 20, heal: 50, mana: 35 },
  "Редкий артефакт": { damage: 30, defense: 30, heal: 80, mana: 50 },
  "Легендарный артефакт": { damage: 45, defense: 45, heal: 120, mana: 70 },
  "Мифический артефакт": { damage: 100, defense: 100, heal: 250, mana: 500 },
};


