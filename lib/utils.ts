import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateEventId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function generateCode6(): string {
  // Generate 6-digit numeric code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateCode4(): string {
  // Generate 4-digit numeric code
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function generateOwnerLink(): string {
  // Generate unique hash link for owner
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

