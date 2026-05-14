import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatEngagementRate(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 3,
  backoffMs = 1000
): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status >= 500 && attempt < retries - 1) {
        await sleep(backoffMs * Math.pow(2, attempt));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt < retries - 1) {
        await sleep(backoffMs * Math.pow(2, attempt));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Failed after ${retries} retries: ${url}`);
}
