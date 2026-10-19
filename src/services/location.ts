import * as Location from "expo-location";
import { Platform } from "react-native";

// Compartilha somente a verificação em andamento; novas chamadas consultam o SO.
let pendingAccess: Promise<void> | null = null;

export async function ensureLocationAccess(): Promise<void> {
  if (!pendingAccess) {
    pendingAccess = (async () => {
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== "granted" && permission.canAskAgain) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (permission.status !== "granted") {
        throw new Error(
          "Acesso à localização negado. No Expo Go, permita a localização para o Expo Go nas configurações do aparelho."
        );
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        throw new Error("A localização/GPS está desativada. Ative-a nas configurações do aparelho.");
      }
      if (Platform.OS === "android") {
        const providers = await Location.getProviderStatusAsync();
        // GPS pode estar indisponível enquanto a localização por rede funciona.
        if (providers.gpsAvailable === false && providers.networkAvailable === false) {
          throw new Error("Nenhum provedor de localização está disponível. Verifique o GPS e a localização por rede do aparelho.");
        }
      }
    })();
  }
  try {
    await pendingAccess;
  } finally {
    pendingAccess = null;
  }
}

export function locationErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível obter a localização. Tente novamente.";
}

export async function reverseGeocodeSafely(coords: { latitude: number; longitude: number }) {
  try {
    await ensureLocationAccess();
    return await Location.reverseGeocodeAsync(coords);
  } catch (error) {
    console.error("Erro ao obter endereço da localização:", error);
    // A seleção das coordenadas continua válida mesmo sem endereço.
    return [];
  }
}
