import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  CLIENT: 'auth_client',
  UID: 'auth_uid',
  PUBSUB_TOKEN: 'auth_pubsub_token',
} as const;

// In-memory fallback if secure store is unavailable (e.g. web or tests)
const memoryCache: Record<string, string | null> = {};

const isSecureStoreAvailable = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

async function setSecureItem(key: string, value: string | null | undefined): Promise<void> {
  memoryCache[key] = value ?? null;
  if (!value) {
    await deleteSecureItem(key);
    return;
  }
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn(`[SecureStore] Failed to save ${key}:`, error);
    }
  }
}

async function getSecureItem(key: string): Promise<string | null> {
  if (memoryCache[key] !== undefined && memoryCache[key] !== null) {
    return memoryCache[key];
  }
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      const val = await SecureStore.getItemAsync(key);
      if (val !== null) {
        memoryCache[key] = val;
        return val;
      }
    }
  } catch (error) {
    if (__DEV__) {
      console.warn(`[SecureStore] Failed to get ${key}:`, error);
    }
  }
  return memoryCache[key] ?? null;
}

async function deleteSecureItem(key: string): Promise<void> {
  delete memoryCache[key];
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn(`[SecureStore] Failed to delete ${key}:`, error);
    }
  }
}

export interface StoredAuthHeaders {
  'access-token': string;
  client: string;
  uid: string;
}

export interface StoredAuthTokens {
  'access-token': string | null;
  client: string | null;
  uid: string | null;
  pubsub_token: string | null;
}

/**
 * Save auth headers (access-token, client, uid) to SecureStore
 */
export async function saveAuthHeaders(headers: {
  'access-token': string;
  client: string;
  uid: string;
}): Promise<void> {
  await Promise.all([
    setSecureItem(KEYS.ACCESS_TOKEN, headers['access-token']),
    setSecureItem(KEYS.CLIENT, headers.client),
    setSecureItem(KEYS.UID, headers.uid),
  ]);
}

/**
 * Retrieve auth headers (access-token, client, uid) from SecureStore
 */
export async function getAuthHeaders(): Promise<StoredAuthHeaders | null> {
  const [accessToken, client, uid] = await Promise.all([
    getSecureItem(KEYS.ACCESS_TOKEN),
    getSecureItem(KEYS.CLIENT),
    getSecureItem(KEYS.UID),
  ]);

  if (accessToken && client && uid) {
    return {
      'access-token': accessToken,
      client,
      uid,
    };
  }
  return null;
}

/**
 * Save ActionCable pubsub token to SecureStore
 */
export async function savePubSubToken(token: string | null | undefined): Promise<void> {
  await setSecureItem(KEYS.PUBSUB_TOKEN, token);
}

/**
 * Get ActionCable pubsub token from SecureStore
 */
export async function getPubSubToken(): Promise<string | null> {
  return await getSecureItem(KEYS.PUBSUB_TOKEN);
}

/**
 * Save all sensitive auth tokens in one call
 */
export async function saveAuthTokens(tokens: {
  'access-token'?: string | null;
  client?: string | null;
  uid?: string | null;
  pubsub_token?: string | null;
}): Promise<void> {
  const promises: Promise<void>[] = [];
  if (tokens['access-token'] !== undefined) {
    promises.push(setSecureItem(KEYS.ACCESS_TOKEN, tokens['access-token']));
  }
  if (tokens.client !== undefined) {
    promises.push(setSecureItem(KEYS.CLIENT, tokens.client));
  }
  if (tokens.uid !== undefined) {
    promises.push(setSecureItem(KEYS.UID, tokens.uid));
  }
  if (tokens.pubsub_token !== undefined) {
    promises.push(setSecureItem(KEYS.PUBSUB_TOKEN, tokens.pubsub_token));
  }
  await Promise.all(promises);
}

/**
 * Retrieve all sensitive auth tokens from SecureStore
 */
export async function getAuthTokens(): Promise<StoredAuthTokens> {
  const [accessToken, client, uid, pubsubToken] = await Promise.all([
    getSecureItem(KEYS.ACCESS_TOKEN),
    getSecureItem(KEYS.CLIENT),
    getSecureItem(KEYS.UID),
    getSecureItem(KEYS.PUBSUB_TOKEN),
  ]);

  return {
    'access-token': accessToken,
    client,
    uid,
    pubsub_token: pubsubToken,
  };
}

/**
 * Clear all sensitive credentials from SecureStore on logout or 401
 */
export async function clearAuthTokens(): Promise<void> {
  await Promise.all([
    deleteSecureItem(KEYS.ACCESS_TOKEN),
    deleteSecureItem(KEYS.CLIENT),
    deleteSecureItem(KEYS.UID),
    deleteSecureItem(KEYS.PUBSUB_TOKEN),
  ]);
}
