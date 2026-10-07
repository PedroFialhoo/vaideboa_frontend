import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { ensureLocationAccess, locationErrorMessage } from "@/src/services/location";

export function useLocation(watch = false) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;
    const onError = (error: unknown) => {
      console.error("Erro ao obter localização:", error);
      if (!cancelled) setLocationError(locationErrorMessage(error));
    };
    async function start() {
      try {
        await ensureLocationAccess();
        if (cancelled) return;
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (cancelled) return;
        setLocation(position);
        if (watch) {
          await ensureLocationAccess();
          if (cancelled) return;
          const watcher = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
            (response) => { if (!cancelled) setLocation(response); },
            (reason) => onError(new Error(reason))
          );
          if (cancelled) watcher.remove();
          else subscription = watcher;
        }
      } catch (error) {
        onError(error);
      }
    }
    void start();
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [watch]);

  return { location, locationError };
}
