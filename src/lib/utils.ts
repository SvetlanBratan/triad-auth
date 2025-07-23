import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { intervalToDuration, isPast } from 'date-fns';

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
