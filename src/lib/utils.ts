
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { intervalToDuration, isPast, differenceInYears, parse } from 'date-fns';

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
    // Assuming format DD.MM.YYYY
    const birthDate = parse(birthDateString, 'dd.MM.yyyy', new Date());
    
    // Check if parsing was successful
    if (isNaN(birthDate.getTime())) {
      console.warn("Invalid birthDate format:", birthDateString);
      return null;
    }

    let age = differenceInYears(gameDate, birthDate);
    
    // Adjust age if birthday hasn't occurred yet this year in game time
    const birthDateThisYear = new Date(birthDate);
    birthDateThisYear.setFullYear(gameDate.getFullYear());

    if (gameDate < birthDateThisYear) {
      age--;
    }

    return age;
  } catch (error) {
    console.error("Error calculating age:", error);
    return null;
  }
}

export function calculateRelationshipLevel(points: number): { level: number; progressToNextLevel: number } {
    const level = Math.min(10, Math.floor(points / 100));
    if (level >= 10) {
        return { level: 10, progressToNextLevel: 100 };
    }
    const pointsInCurrentLevel = points % 100;
    const progressToNextLevel = pointsInCurrentLevel; // as it's out of 100
    return { level, progressToNextLevel };
}
