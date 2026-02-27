/**
 * Media Checkin Service - Not used in Digital Heirloom
 * This file exists only to prevent build errors from legacy subtitle extract code
 * 
 * Note: Digital Heirloom has its own check-in functionality at:
 * - Frontend: src/app/[locale]/(dashboard)/digital-heirloom/check-in/page.tsx
 * - API: /api/digital-heirloom/vault/heartbeat
 */

export interface CheckinResult {
  addedCredits: number;
  newTotal: number;
  checkinDate: string;
}

export async function canCheckInToday(userId: string): Promise<boolean> {
  // Media check-in is not available in Digital Heirloom
  return false;
}

export async function performDailyCheckin(userId: string): Promise<CheckinResult> {
  // Media check-in is not available in Digital Heirloom
  throw new Error('Media check-in is not available in Digital Heirloom. Use Digital Heirloom check-in instead.');
}
