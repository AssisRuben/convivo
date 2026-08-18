import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * `expo-secure-store` não funciona no web (só iOS/Android nativos) — cai
 * pra `localStorage` nesse caso. Menos seguro que o Keychain/Keystore
 * nativo, mas web aqui é só ambiente de desenvolvimento/preview.
 */
export async function getItemAsync(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
