import MapView, { Marker } from "react-native-maps";
import { useEffect, useRef } from "react";
import { View, Text } from "react-native";
import { useLocation } from "@/src/hooks/use-location";
import { PlaceCoordinates } from "@/src/services/saved-places";

export default function SavedPlaceMap({ point, onSelect }: {
  point: PlaceCoordinates | null;
  onSelect: (point: PlaceCoordinates) => void;
}) {
  const { location, locationError } = useLocation();
  const map = useRef<MapView>(null);
  const initialPoint = useRef(point).current;
  const selectedPoint = useRef(point);
  selectedPoint.current = point;

  useEffect(() => {
    if (location && !initialPoint && !selectedPoint.current) map.current?.animateToRegion({
      latitude: location.coords.latitude, longitude: location.coords.longitude,
      latitudeDelta: 0.03, longitudeDelta: 0.03,
    });
  }, [location, initialPoint]);

  return (
    <View className="flex-1">
      <MapView ref={map} style={{ flex: 1 }}
        initialRegion={{ latitude: initialPoint?.latitude ?? -22.537, longitude: initialPoint?.longitude ?? -44.774,
          latitudeDelta: initialPoint ? 0.01 : 0.1, longitudeDelta: initialPoint ? 0.01 : 0.1 }}
        showsUserLocation={!!location}
        onPress={(event) => onSelect(event.nativeEvent.coordinate)}>
        {point && <Marker coordinate={point} draggable onDragEnd={(event) => onSelect(event.nativeEvent.coordinate)} />}
      </MapView>
      {!!locationError && <Text className="absolute top-3 left-3 right-3 bg-platinum-50 text-velvet-orchid-900 p-3 rounded-xl">
        Não foi possível usar sua localização. Você pode navegar pelo mapa e selecionar o ponto manualmente.
      </Text>}
    </View>
  );
}
