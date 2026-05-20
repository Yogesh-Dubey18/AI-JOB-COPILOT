import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}
