import { useCallback, useState, useSyncExternalStore } from "react";
import { useFocusEffect } from "expo-router";
import { acquireAvatar, avatarRevision, subscribeAvatars } from "@/src/services/avatar";

export function useAvatar(fotoUrl: string | null | undefined, identity?: string | number) {
  const revision = useSyncExternalStore(subscribeAvatars, avatarRevision, avatarRevision);
  const key = JSON.stringify([fotoUrl, identity, revision]);
  const [photo, setPhoto] = useState<{ key: string; uri: string | null; error: string | null }>();
  useFocusEffect(useCallback(() => {
    let active = true;
    setPhoto(undefined);
    if (!fotoUrl) return;
    const lease = acquireAvatar(fotoUrl);
    void lease.promise.then(result => { if (active) setPhoto({ key, ...result }); });
    return () => { active = false; lease.release(); };
  }, [fotoUrl, key]));
  return {
    uri: photo?.key === key ? photo.uri : null,
    error: photo?.key === key ? photo.error : null,
    onError: () => setPhoto({ key, uri: null, error: "Não foi possível exibir a foto." }),
  };
}
