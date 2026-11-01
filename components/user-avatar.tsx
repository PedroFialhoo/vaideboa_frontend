import { type ReactNode } from "react";
import { Image, View } from "react-native";
import { useAvatar } from "@/src/hooks/useAvatar";

export default function UserAvatar({ fotoUrl, identity, fallback }: {
  fotoUrl?: string | null; identity?: string | number; fallback: ReactNode;
}) {
  const photo = useAvatar(fotoUrl, identity);
  return photo.uri ? <Image key={photo.uri} source={{ uri: photo.uri }} onError={photo.onError} accessibilityLabel="Foto do usuário" className="w-full h-full" /> : <View accessible accessibilityLabel={photo.error || "Usuário sem foto"} className="w-full h-full items-center justify-center">{fallback}</View>;
}
