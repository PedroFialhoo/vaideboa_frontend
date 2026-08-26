import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  watchPositionAsync,
  LocationAccuracy,
  LocationObject,
  reverseGeocodeAsync,
} from "expo-location";
import { useEffect, useRef, useState } from "react";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import {
  CircleDot,
  Navigation,
  Search,
  X,
  Plus,
  MapPin,
} from "lucide-react-native";
import "@/global.css";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";
import RouteInfoBadge, {
  RouteInfo,
  extrairInfoRota,
} from "@/components/offer/route-info-badge";

export type StopType = {
  latitude: number;
  longitude: number;
  address?: string;
};

type Coord = {
  latitude: number;
  longitude: number;
};

const MAX_STOPS = 5;

export default function Stops({
  origin,
  destination,
  stops,
  setStops,
  next,
}: {
  origin: Coord & { address?: string };
  destination: Coord & { address?: string };
  stops: StopType[];
  setStops: (stops: StopType[]) => void;
  next: () => void;
}) {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const mapRef = useRef<MapView>(null);
  const [search, setSearch] = useState("");
  const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [coords, setCoords] = useState<Coord[]>([]);
  const [rotaInfo, setRotaInfo] = useState<RouteInfo | null>(null);
  const [pendingStop, setPendingStop] = useState<StopType | null>(null);
  const pendingStopRef = useRef<StopType | null>(null);

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

  useEffect(() => {
    if (!origin || !destination) return;
    setCoords([]);
    setRotaInfo(null);

    getToken().then((token) => {
      api
        .post(
          "/rota/buscar",
          {
            latSaida: origin.latitude,
            lonSaida: origin.longitude,
            latDestino: destination.latitude,
            lonDestino: destination.longitude,
            paradas: stops.map((stop, index) => ({
              indexOrder: index,
              latitude: stop.latitude,
              longitude: stop.longitude,
            })),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        .then((response) => {
          const feature = response.data.features[0];
          const converted = feature.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => ({
              latitude: lat,
              longitude: lng,
            })
          );
          setCoords(converted);
          setRotaInfo(extrairInfoRota(feature));
        })
        .catch(() => {});
    });
  }, [origin, destination, stops]);

  const handleMapPress = (event: any) => {
    try {
      const coord = event.nativeEvent.coordinate;
      if (!coord) return;

      const stop: StopType = {
        latitude: coord.latitude,
        longitude: coord.longitude,
        address: "Local no mapa",
      };

      setPendingStop(stop);
      pendingStopRef.current = stop;
      animateTo(coord.latitude, coord.longitude);

      reverseGeocodeAsync(coord)
        .then((reverse) => {
          if (reverse.length > 0) {
            const address = `${reverse[0].street ?? ""}, ${reverse[0].name ?? ""}`;
            setPendingStop((prev) =>
              prev ? { ...prev, address } : null
            );
            pendingStopRef.current = pendingStopRef.current
              ? { ...pendingStopRef.current, address }
              : null;
          }
        })
        .catch(() => {});
    } catch (e) {
      console.log("Erro no handleMapPress:", e);
    }
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
    mapRef.current?.animateCamera({ zoom: zoomLevel.current });
  }

  function zoomOut() {
    zoomLevel.current -= 1;
    mapRef.current?.animateCamera({ zoom: zoomLevel.current });
  }

  const addPendingStop = () => {
    const toAdd = pendingStopRef.current;
    if (!toAdd) return;
    if (stops.length >= MAX_STOPS) return;
    setPendingStop(null);
    pendingStopRef.current = null;
    setStops([...stops, toAdd]);
  };

  const removeStop = (index: number) => {
    const updated = stops.filter((_: any, i: number) => i !== index);
    const reindexed = updated.map((s, i) => ({ ...s, indexOrder: i }));
    setStops(reindexed);
  };

  const listHeight = Math.min(stops.length, 3) * 40;

  return (
    <View className="flex-1 bg-platinum">
      {/* BUSCA */}
      <View className="absolute top-3 w-[92%] self-center z-10 shadow-lg">
        <GooglePlacesAutocomplete
          textInputProps={{
            value: search,
            onChangeText: setSearch,
          }}
          placeholder="Onde parar no caminho?"
          fetchDetails={true}
          debounce={300}
          enablePoweredByContainer={false}
          onPress={(data, details = null) => {
            if (!details) return;

            const coord = {
              latitude: details.geometry.location.lat,
              longitude: details.geometry.location.lng,
            };

            const stop: StopType = { ...coord, address: data.description };
            setPendingStop(stop);
            pendingStopRef.current = stop;
            animateTo(coord.latitude, coord.longitude);
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
                setPendingStop(null);
                pendingStopRef.current = null;
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
          {coords.length > 0 && (
            <Polyline
              coordinates={coords}
              strokeWidth={4}
              strokeColor="#7b4d91"
            />
          )}

          <Marker coordinate={origin}>
            <View className="bg-velvet-orchid-700 p-2 rounded-full border-1 border-white">
              <MapPin size={20} color="white" />
            </View>
          </Marker>

          <Marker coordinate={destination}>
            <View className="bg-velvet-orchid-900 p-2 rounded-full border-1 border-white">
              <MapPin size={20} color="white" />
            </View>
          </Marker>

          {stops.map((stop, index) => (
            <Marker
              key={`stop-${index}-${stop.latitude}-${stop.longitude}`}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            >
              <View className="bg-purple-x11-500 px-2 py-1 rounded-full border-2 border-white flex-row items-center">
                <CircleDot size={12} color="white" />
                <Text className="text-white text-xs font-bold ml-1">
                  {index + 1}
                </Text>
              </View>
            </Marker>
          ))}

          {pendingStop && (
            <Marker
              coordinate={{
                latitude: pendingStop.latitude,
                longitude: pendingStop.longitude,
              }}
            >
              <View className="bg-yellow-500 p-2 rounded-full border-2 border-white">
                <Plus size={18} color="white" />
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
      <View className="absolute right-4 bottom-60 bg-velvet-orchid-800 rounded-lg w-10 items-center justify-center">
        <Pressable onPress={zoomIn}>
          <Text className="p-2 text-white text-2xl">+</Text>
        </Pressable>
        <Pressable onPress={zoomOut}>
          <Text className="p-2 text-white text-2xl">-</Text>
        </Pressable>
      </View>

      {/* CARD INFERIOR */}
      <View
        className="absolute bottom-8 w-[92%] self-center bg-white rounded-3xl shadow-2xl border"
        style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View className="p-1.5 rounded-full mr-2 bg-purple-x11-100">
              <CircleDot size={16} color="#7b4d91" />
            </View>
            <Text className="text-velvet-orchid-900 font-black text-sm">
              Paradas
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            {rotaInfo && <RouteInfoBadge {...rotaInfo} />}
            <Text className="text-gray-400 text-xs font-bold">
              {stops.length}/{MAX_STOPS}
            </Text>
          </View>
        </View>

        {/* LISTA DE PARADAS */}
        {stops.length > 0 && (
          <View style={{ maxHeight: listHeight }} className="mb-2">
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {stops.map((stop, index) => (
                <View
                  key={`stop-item-${index}`}
                  className="flex-row items-center py-1.5 border-b border-platinum-100"
                >
                  <View className="bg-purple-x11-500 w-5 h-5 rounded-full items-center justify-center mr-2">
                    <Text className="text-white text-[10px] font-bold">
                      {index + 1}
                    </Text>
                  </View>
                  <Text
                    className="flex-1 text-xs text-velvet-orchid-800 font-medium"
                    numberOfLines={1}
                  >
                    {stop.address || "Local no mapa"}
                  </Text>
                  <Pressable
                    onPress={() => removeStop(index)}
                    className="p-0.5 ml-1"
                  >
                    <X size={14} color="#999" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {stops.length === 0 && !pendingStop && (
          <Text className="text-gray-400 text-xs mb-2 text-center">
            Toque no mapa ou busque um local
          </Text>
        )}

        {/* PENDING STOP CONFIRMATION */}
        {pendingStop && (
          <View className="bg-yellow-50 rounded-xl p-2.5 mb-2 border border-yellow-200">
            <Text className="text-[10px] uppercase font-bold text-yellow-600 mb-0.5">
              Parada selecionada
            </Text>
            <Text
              className="text-xs font-semibold text-gray-700 mb-1.5"
              numberOfLines={1}
            >
              {pendingStop.address || "Local no mapa"}
            </Text>
            <Pressable
              onPress={addPendingStop}
              disabled={stops.length >= MAX_STOPS}
              className={`h-9 rounded-xl items-center justify-center flex-row ${
                stops.length >= MAX_STOPS ? "bg-gray-300" : "bg-yellow-500"
              }`}
            >
              <Plus size={14} color="white" />
              <Text className="text-white font-bold text-xs ml-1">
                Adicionar
              </Text>
            </Pressable>
          </View>
        )}

        {/* BOTOES */}
        <View className="flex-row gap-3">
          <Pressable
            onPress={() =>
              location &&
              animateTo(
                location.coords.latitude,
                location.coords.longitude
              )
            }
            className="bg-platinum h-12 w-12 rounded-2xl items-center justify-center"
          >
            <Navigation size={20} color="#7b4d91" />
          </Pressable>

          <Pressable
            className="flex-1 h-12 rounded-2xl items-center justify-center bg-velvet-orchid-700"
            onPress={next}
          >
            <Text className="text-white font-black text-base">
              {stops.length > 0 ? "Confirmar" : "Pular"}
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
