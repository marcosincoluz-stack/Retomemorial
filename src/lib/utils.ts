import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateReferenceNumber(event: string, sequence: number) {
  const year = new Date().getFullYear();
  const seqPadded = sequence.toString().padStart(5, '0');
  return `${year}-${event.substring(0, 3).toUpperCase()}-${seqPadded}`;
}
