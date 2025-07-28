
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { intervalToDuration, isPast, differenceInYears, parse } from 'date-fns';
import { BankAccount } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeLeft(isoDateString?: string | null): string {
    if (!isoDateString) {
        return "Время не указано";
    }
    const targetDate = new Date(isoDateString);
    if (isPast(targetDate)) {
        return "Срок истек";
    }
    const duration = intervalToDuration({ start: new Date(), end: targetDate });
    
    const parts: string[] = [];
    if (duration.days && duration.days > 0) parts.push(`${duration.days} д.`);
    if (duration.hours && duration.hours > 0) parts.push(`${duration.hours} ч.`);

    if (parts.length === 0) {
      if (duration.minutes && duration.minutes > 0) {
        return `Осталось менее часа`;
      }
      return "Срок истекает";
    }

    return `Осталось: ${parts.join(' ')}`;
}

export function calculateAge(birthDateString: string, gameDate: Date): number | null {
  if (!birthDateString) return null;
  
  try {
    const parts = birthDateString.split('.');
    if (parts.length !== 3) {
        console.warn("Invalid birthDate format (expected D.M.Y):", birthDateString);
        return null;
    }

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS
    let year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year) || year < 0) {
        console.warn("Invalid date parts in birthDateString:", birthDateString);
        return null;
    }
    
    // Handle very early years correctly by setting them on a Date object.
    // JavaScript's `new Date()` handles years between 0 and 99 by mapping them to 1900-1999.
    // We need to set the full year manually to avoid this.
    const birthDate = new Date(0);
    birthDate.setFullYear(year, month, day);

    // Re-check after creation for invalid dates like 31.02.2000
    if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month || birthDate.getDate() !== day) {
        console.warn("Invalid date created from parts (e.g., Feb 30):", birthDateString);
        return null;
    }

    const gameYear = gameDate.getFullYear();
    const gameMonth = gameDate.getMonth();
    const gameDay = gameDate.getDate();

    let age = gameYear - birthDate.getFullYear();
    
    // Check if the birthday has occurred this year
    if (gameMonth < birthDate.getMonth() || (gameMonth === birthDate.getMonth() && gameDay < birthDate.getDate())) {
        age--;
    }

    return age;
  } catch (error) {
    console.error("Error calculating age:", error);
    return null;
  }
}

export function calculateRelationshipLevel(points: number): { level: number; progressToNextLevel: number; maxPointsForCurrentLevel: number; } {
    const level = Math.min(10, Math.floor(points / 100));
    const maxPointsForCurrentLevel = level >= 10 ? 1000 : 100;
    if (level >= 10) {
        return { level: 10, progressToNextLevel: 100, maxPointsForCurrentLevel: 1000 };
    }
    const pointsInCurrentLevel = points % 100;
    const progressToNextLevel = pointsInCurrentLevel; // as it's out of 100
    return { level, progressToNextLevel, maxPointsForCurrentLevel };
}

export function formatCurrency(bankAccount: BankAccount | undefined, isForMultiLine: boolean = false): string | [string, string][] {
  if (!bankAccount) {
    return '0 тыквин';
  }

  const { platinum = 0, gold = 0, silver = 0, copper = 0 } = bankAccount;
  const parts: [string, string][] = [];

  if (platinum > 0) parts.push([platinum.toLocaleString(), isForMultiLine ? 'платины' : 'пл.']);
  if (gold > 0) parts.push([gold.toLocaleString(), isForMultiLine ? 'золота' : 'з.']);
  if (silver > 0) parts.push([silver.toLocaleString(), isForMultiLine ? 'серебра' : 'с.']);
  if (copper > 0) parts.push([copper.toLocaleString(), isForMultiLine ? 'меди' : 'м.']);
  
  if (parts.length === 0) {
    return '0 тыквин';
  }

  if (isForMultiLine) {
      return parts;
  }
  
  return parts.map(part => part.join(' ')).join(' ');
}
