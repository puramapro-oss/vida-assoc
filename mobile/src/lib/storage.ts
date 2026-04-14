import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const storage = { getItem, setItem, removeItem };

const ONBOARDING_KEYS = {
  intro: "vida_assoc_intro_seen",
  tutorial: "vida_assoc_tutorial_completed",
} as const;

export const onboardingStorage = {
  get(kind: keyof typeof ONBOARDING_KEYS) {
    return getItem(ONBOARDING_KEYS[kind]);
  },
  set(kind: keyof typeof ONBOARDING_KEYS, value: string) {
    return setItem(ONBOARDING_KEYS[kind], value);
  },
  reset(kind: keyof typeof ONBOARDING_KEYS) {
    return removeItem(ONBOARDING_KEYS[kind]);
  },
};
