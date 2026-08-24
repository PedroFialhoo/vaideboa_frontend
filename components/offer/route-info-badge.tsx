import { View, Text } from "react-native";
import { Clock, Route } from "lucide-react-native";
import "@/global.css";

export type RouteInfo = {
  distanciaKm: number;
  duracaoMin: number;
};

export function formatarDuracao(duracaoMin: number) {
  const minutos = Math.max(1, Math.round(duracaoMin));
  if (minutos < 60) return `${minutos} min`;
  return `${Math.floor(minutos / 60)}h ${String(minutos % 60).padStart(2, "0")}`;
}

export function extrairInfoRota(feature: any): RouteInfo {
  const segments = feature?.properties?.segments ?? [];
  const totais = segments.reduce(
    (acc: { distance: number; duration: number }, segment: any) => ({
      distance: acc.distance + (segment.distance ?? 0),
      duration: acc.duration + (segment.duration ?? 0),
    }),
    { distance: 0, duration: 0 }
  );
  return {
    distanciaKm: totais.distance / 1000,
    duracaoMin: totais.duration / 60,
  };
}

export default function RouteInfoBadge({ distanciaKm, duracaoMin }: RouteInfo) {
  return (
    <View className="flex-row items-center bg-purple-x11-50 rounded-full px-3 py-1.5 border border-purple-x11-100">
      <Route size={13} color="#7b4d91" />
      <Text className="text-velvet-orchid-900 font-bold text-xs ml-1">
        {distanciaKm.toFixed(1).replace(".", ",")} km
      </Text>
      <View className="ml-2 flex-row items-center">
        <Clock size={13} color="#7b4d91" />
        <Text className="text-velvet-orchid-900 font-bold text-xs ml-1">
          {formatarDuracao(duracaoMin)}
        </Text>
      </View>
    </View>
  );
}
