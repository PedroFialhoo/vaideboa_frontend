import { View, Text, Pressable, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { 
  requestForegroundPermissionsAsync, 
  getCurrentPositionAsync, 
  watchPositionAsync, 
  LocationAccuracy, 
  LocationObject,
  reverseGeocodeAsync
} from "expo-location";
import { useEffect, useRef, useState } from "react";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { GOOGLE_MAPS_API_KEY } from "@env";
import { MapPin, Navigation, Search, Map as MapIcon, X } from "lucide-react-native";
import "@/global.css";
import { Spinner } from "@/components/ui/spinner";

type OriginType = {
  latitude: number;
  longitude: number;
  address?: string;
};

export default function Origin({
  origin,
  setOrigin,
  next,
}: {
  origin: OriginType | null;
  setOrigin: (value: OriginType | null) => void;
  next: () => void;
}) {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const mapRef = useRef<MapView>(null);
  const [search, setSearch] = useState("");

  async function requestLocationPermission() {
    const { granted } = await requestForegroundPermissionsAsync();
    if (granted) {
      const currentPosition = await getCurrentPositionAsync();
      setLocation(currentPosition);
    }
  }

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    let subscription: any;
    watchPositionAsync(
      {
        accuracy: LocationAccuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (response) => {
        setLocation(response);
      }
    ).then((sub) => (subscription = sub));

    return () => subscription?.remove();
  }, []);

  const handleMapPress = async (event: any) => {
    const coords = event.nativeEvent.coordinate;

    const reverse = await reverseGeocodeAsync(coords);

    let address = "Local no mapa";

    if (reverse.length > 0) {
      address = `${reverse[0].street ?? ""}, ${reverse[0].name ?? ""}`;
    }

    setOrigin({
      latitude: coords.latitude,
      longitude: coords.longitude,
      address,
    });

    animateTo(coords.latitude, coords.longitude);
  };

  const animateTo = (lat: number, lng: number) => {
    mapRef.current?.animateCamera({
      center: { latitude: lat, longitude: lng },
      zoom: 16,
    });
  };

  const zoomLevel = useRef(16);

  function zoomIn() {
    zoomLevel.current += 1;
    mapRef.current?.animateCamera({
      zoom: zoomLevel.current,
    });
  }

  function zoomOut() {
    zoomLevel.current -= 1;
    mapRef.current?.animateCamera({
      zoom: zoomLevel.current,
    });
  }

  return (
    <View className="flex-1 bg-platinum">
      {/* BUSCA */}
      <View className="absolute top-12 w-[92%] self-center z-10 shadow-lg">
        <GooglePlacesAutocomplete
          textInputProps={{
            value: search,
            onChangeText: setSearch,
          }}
          placeholder="De onde vamos sair?"
          fetchDetails={true}
          debounce={300}
          enablePoweredByContainer={false}
          onPress={(data, details = null) => {
            if (!details) return;

            const coords = {
              latitude: details.geometry.location.lat,
              longitude: details.geometry.location.lng,
            };

            setOrigin({
              ...coords,
              address: data.description,
            });

            animateTo(coords.latitude, coords.longitude);
          }}
          query={{
            key: GOOGLE_MAPS_API_KEY,
            language: "pt-BR",
            components: "country:br",
            location: location
              ? `${location.coords.latitude},${location.coords.longitude}`
              : undefined,
            radius: 50000,
            rankby: "distance",
          }}
          styles={{
            container: { flex: 0 },
            textInput: {
              height: 55,
              paddingHorizontal: 20,
              fontSize: 16,
              backgroundColor: "#FFF",
              color: "#391f47",
            },
            listView: {
              backgroundColor: "#FFF",
              borderRadius: 12,
              marginTop: 5,
            },
          }}
          renderLeftButton={() => (
            <View className="h-[55px] w-12 -mr-3 items-center justify-center bg-white rounded-l-2xl">
              <Search size={20} color="#7b4d91" />
            </View>
          )}
          renderRightButton={() => (
            <Pressable
              className="h-[55px] w-12 -ml-3 items-center justify-center bg-white rounded-r-2xl"
              onPress={() => {
                setSearch("");
                setOrigin(null);
              }}
            >
              <X size={20} color="#7b4d91" />
            </Pressable>
          )}
        />
      </View>

      {/* MAPA */}
      {location ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton={false}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {origin && (
            <Marker coordinate={origin}>
              <View className="bg-velvet-orchid-700 p-2 rounded-full border-1 border-white">
                <MapPin size={20} color="white" />
              </View>
            </Marker>
          )}
        </MapView>
      ) : (
        <View className="flex-1 justify-center items-center flex-row gap-5">
          <Spinner size="large" color="grey" />
          <Text className="text-lg">Carregando mapa...</Text>
        </View>
      )}

      {/* ZOOM */}
      <View className="absolute right-4 bottom-60 bg-[#7b4d91] rounded-lg w-10 items-center justify-center">
        <Pressable onPress={zoomIn}>
          <Text className="p-2 text-white text-2xl">+</Text>
        </Pressable>
        <Pressable onPress={zoomOut}>
          <Text className="p-2 text-white text-2xl">-</Text>
        </Pressable>
      </View>

      {/* CARD */}
      <View className="absolute bottom-8 w-[92%] self-center bg-white rounded-3xl p-5 shadow-2xl border">
        <View className="flex-row items-center mb-4">
          <View className="p-3 rounded-2xl mr-4">
            <MapIcon size={24} color="#7b4d91" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-400 text-xs uppercase">
              Ponto de partida selecionado
            </Text>
            <Text className="font-bold text-lg" numberOfLines={1}>
              {origin
                ? origin.address || "Local no mapa"
                : "Toque no mapa ou busque"}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <Pressable
            onPress={() =>
              location &&
              animateTo(
                location.coords.latitude,
                location.coords.longitude
              )
            }
            className="bg-platinum h-14 w-14 rounded-2xl items-center justify-center"
          >
            <Navigation size={24} color="#7b4d91" />
          </Pressable>

          <Pressable
            className={`flex-1 h-14 rounded-2xl items-center justify-center ${
              origin ? "bg-velvet-orchid-700" : "bg-gray-300"
            }`}
            disabled={!origin}
            onPress={next}
          >
            <Text className="text-white font-black text-lg">
              Definir origem
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
});