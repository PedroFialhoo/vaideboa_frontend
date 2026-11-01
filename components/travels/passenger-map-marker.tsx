import { UserRound } from "lucide-react-native";
import { Text, View } from "react-native";
import { Callout, Marker } from "react-native-maps";
import { PassengerMapPoint } from "@/src/services/passenger-map-points";
import { colors } from "@/src/styles/colors";

export default function PassengerMapMarker({ point }: { point: PassengerMapPoint }) {
  const boarding = point.kind === "embarque";
  return (
    <Marker coordinate={point.coordinate} title={`${boarding ? "Embarque" : "Destino"} de ${point.nome}`}>
      <View className="bg-vintage-grape-300 w-7 h-7 rounded-full border-2 border-white items-center justify-center">
        <UserRound size={16} color={colors["vintage-grape"][900]} />
      </View>
      <Callout tooltip>
        <View style={{
          width: 144,
          height: 144,
          padding: 14,
          marginBottom: 8,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors["velvet-orchid"][200],
          backgroundColor: colors.platinum[50],
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}>
          <Text numberOfLines={3} style={{
            color: colors["vintage-grape"][900],
            fontSize: 15,
            lineHeight: 20,
            fontWeight: "700",
            textAlign: "center",
          }}>{point.nome}</Text>
          <View style={{
            backgroundColor: colors["velvet-orchid"][100],
            borderRadius: 6,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}>
            <Text style={{ color: colors["velvet-orchid"][800], fontSize: 12, fontWeight: "600" }}>
              {boarding ? "Embarque" : "Destino"}
            </Text>
          </View>
        </View>
      </Callout>
    </Marker>
  );
}
