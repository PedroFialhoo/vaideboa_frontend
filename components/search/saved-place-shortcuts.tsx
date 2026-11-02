import { Pressable, Text, View } from "react-native";
import { GraduationCap, House } from "lucide-react-native";
import { colors } from "@/src/styles/colors";
import type { PlaceShortcut } from "@/src/services/saved-places";

export default function SavedPlaceShortcuts({ places, onSelect }: {
  places: PlaceShortcut[];
  onSelect: (place: PlaceShortcut) => void;
}) {
  if (!places.length) return null;
  return <View className="mt-2 rounded-2xl bg-white overflow-hidden">
    {places.map((place) => {
      const Icon = place.type === "casa" ? House : GraduationCap;
      return <Pressable key={place.type} accessibilityRole="button" accessibilityLabel={place.label}
        onPress={() => onSelect(place)}
        className="flex-row items-center gap-3 px-4 py-4 border-b border-platinum-100">
        <Icon size={22} color={colors["velvet-orchid"][600]} />
        <Text numberOfLines={2} className="flex-1 text-velvet-orchid-900 font-bold">{place.label}</Text>
      </Pressable>;
    })}
  </View>;
}
