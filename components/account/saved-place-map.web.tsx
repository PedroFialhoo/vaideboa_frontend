import { Text, View } from "react-native";
import type { PlaceCoordinates } from "@/src/services/saved-places";

export default function SavedPlaceMap(_props: {
  point: PlaceCoordinates | null;
  onSelect: (point: PlaceCoordinates) => void;
}) {
  return <View className="flex-1 items-center justify-center p-6 bg-platinum-100">
    <Text className="text-center text-velvet-orchid-900">Abra o aplicativo no Android ou iOS para selecionar o local no mapa.</Text>
  </View>;
}
