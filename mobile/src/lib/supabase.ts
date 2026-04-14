import "react-native-url-polyfill/auto";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY manquent dans .env"
  );
}

const CHUNK_SIZE = 1800;

const webStorage = {
  getItem: (k: string) =>
    Promise.resolve(
      typeof localStorage !== "undefined" ? localStorage.getItem(k) : null
    ),
  setItem: (k: string, v: string) => {
    if (typeof localStorage !== "undefined") localStorage.setItem(k, v);
    return Promise.resolve();
  },
  removeItem: (k: string) => {
    if (typeof localStorage !== "undefined") localStorage.removeItem(k);
    return Promise.resolve();
  },
};

async function nativeGetItem(key: string): Promise<string | null> {
  const first = await SecureStore.getItemAsync(key);
  if (!first) return null;
  if (!first.startsWith("__chunked__:")) return first;
  const count = parseInt(first.slice("__chunked__:".length), 10) || 0;
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const part = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
    if (part == null) return null;
    parts.push(part);
  }
  return parts.join("");
}

async function nativeSetItem(key: string, value: string): Promise<void> {
  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  const parts: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    parts.push(value.slice(i, i + CHUNK_SIZE));
  }
  await SecureStore.setItemAsync(key, `__chunked__:${parts.length}`);
  for (let i = 0; i < parts.length; i++) {
    await SecureStore.setItemAsync(`${key}_chunk_${i}`, parts[i]);
  }
}

async function nativeRemoveItem(key: string): Promise<void> {
  const first = await SecureStore.getItemAsync(key);
  if (first && first.startsWith("__chunked__:")) {
    const count = parseInt(first.slice("__chunked__:".length), 10) || 0;
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
    }
  }
  await SecureStore.deleteItemAsync(key);
}

const nativeStorage = {
  getItem: nativeGetItem,
  setItem: nativeSetItem,
  removeItem: nativeRemoveItem,
};

const storage = Platform.OS === "web" ? webStorage : nativeStorage;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
    flowType: "pkce",
  },
});

export type SupabaseClient = typeof supabase;
