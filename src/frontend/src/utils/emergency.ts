/**
 * Determines if the app should be in Emergency Mode based on Ohio time.
 * Emergency Mode activates after 5 PM or before 8 AM, or on weekends.
 */
export function isEmergencyMode(): boolean {
  const now = new Date();
  // Ohio = Eastern Time. Use UTC-5 (EST) conservatively.
  const ohioOffset = -5;
  const ohioHour = (now.getUTCHours() + 24 + ohioOffset) % 24;
  const day = now.getUTCDay(); // 0=Sun, 6=Sat
  const isWeekend = day === 0 || day === 6;
  const isAfterHours = ohioHour >= 17 || ohioHour < 8;
  return isWeekend || isAfterHours;
}

/**
 * Returns a friendly string of the current Ohio time.
 */
export function getOhioTimeString(): string {
  const now = new Date();
  const ohioOffset = -5;
  const ohioMs = now.getTime() + ohioOffset * 3600 * 1000;
  const ohioDate = new Date(ohioMs);
  return ohioDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Hard Rule 2: 4-HOUR DECAY
 * Checks if a provider's status is stale (not updated in 4 hours).
 * Must use 4-hour threshold to match the Sentinel Agent auto-decay rule.
 */
export function isProviderStale(lastVerified: bigint): boolean {
  const lastVerifiedMs = Number(lastVerified / 1000000n);
  return Date.now() - lastVerifiedMs > 14_400_000; // 4 hours in milliseconds
}
