import { Redis } from "@upstash/redis";

// Initialize Redis with explicit config
// Vercel/Upstash uses STORAGE_KV_REST_API_URL and STORAGE_KV_REST_API_TOKEN
const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.STORAGE_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

const KV_KEY = "watched_addresses";

export interface WatchedAddresses {
  [email: string]: string[];
}

// Get all watched addresses from KV
export async function getWatchedAddressesFromKV(): Promise<WatchedAddresses> {
  try {
    const data = await redis.get<WatchedAddresses>(KV_KEY);
    return data || {};
  } catch (error) {
    console.error("KV read error:", error);
    return {};
  }
}

// Save watched addresses to KV
export async function saveWatchedAddressesToKV(
  addresses: WatchedAddresses
): Promise<void> {
  await redis.set(KV_KEY, addresses);
}

// Add an address for an email
export async function addWatchedAddress(
  email: string,
  address: string
): Promise<WatchedAddresses> {
  const current = await getWatchedAddressesFromKV();
  const normalizedAddress = address.toLowerCase();

  if (!current[email]) {
    current[email] = [];
  }

  // Check if address already exists for this email
  if (
    !current[email].some((addr) => addr.toLowerCase() === normalizedAddress)
  ) {
    current[email].push(normalizedAddress);
    await saveWatchedAddressesToKV(current);
  }

  return current;
}

// Remove an address for an email
export async function removeWatchedAddress(
  email: string,
  address: string
): Promise<WatchedAddresses> {
  const current = await getWatchedAddressesFromKV();
  const normalizedAddress = address.toLowerCase();

  if (current[email]) {
    current[email] = current[email].filter(
      (addr) => addr.toLowerCase() !== normalizedAddress
    );

    // Remove email key if no addresses left
    if (current[email].length === 0) {
      delete current[email];
    }

    await saveWatchedAddressesToKV(current);
  }

  return current;
}

// Add a new email (with optional initial addresses)
export async function addEmail(
  email: string,
  addresses: string[] = []
): Promise<WatchedAddresses> {
  const current = await getWatchedAddressesFromKV();

  if (!current[email]) {
    current[email] = addresses.map((addr) => addr.toLowerCase());
    await saveWatchedAddressesToKV(current);
  }

  return current;
}

// Remove an email and all its watched addresses
export async function removeEmail(email: string): Promise<WatchedAddresses> {
  const current = await getWatchedAddressesFromKV();

  if (current[email]) {
    delete current[email];
    await saveWatchedAddressesToKV(current);
  }

  return current;
}

// Import addresses to KV (accepts data to import)
export async function importAddressesToKV(
  data: WatchedAddresses
): Promise<void> {
  const existing = await redis.get<WatchedAddresses>(KV_KEY);
  if (!existing || Object.keys(existing).length === 0) {
    await saveWatchedAddressesToKV(data);
    console.log("Imported addresses to KV");
  }
}

// Get emails for a voter (for webhook use)
export async function getEmailsForVoterFromKV(
  voterAddress: string
): Promise<{ email: string; index: number }[]> {
  const addresses = await getWatchedAddressesFromKV();
  const results: { email: string; index: number }[] = [];
  const lowerVoter = voterAddress.toLowerCase();

  for (const [email, addrs] of Object.entries(addresses)) {
    const index = addrs.findIndex(
      (addr) => addr.toLowerCase() === lowerVoter
    );
    if (index !== -1) {
      results.push({ email, index: index + 1 });
    }
  }

  return results;
}
