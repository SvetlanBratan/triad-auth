import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { intervalToDuration, isPast } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeLeft(isoDateString?: string | null): string {
    if (!isoDateString) {
        return "Благословение активно";
    }
    const targetDate = new Date(isoDateString);
    if (isPast(targetDate)) {
        return "Срок благословения истек";
    }
    const duration = intervalToDuration({ start: new Date(), end: targetDate });
    
    const parts: string[] = [];
    if (duration.days) parts.push(`${duration.days} д.`);
    if (duration.hours) parts.push(`${duration.hours} ч.`);

    if (parts.length === 0 && duration.minutes) {
      return `Осталось менее часа`;
    }

    return `Осталось: ${parts.join(' ')}`;
}
