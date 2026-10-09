import "@/global.css";
import { api } from "@/src/services/api";
import { connectRideTracking, RideTrackingConnection, RideLocation } from "@/src/services/ride-tracking";
import { getToken } from "@/src/services/storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LocationAccuracy, LocationSubscription, requestForegroundPermissionsAsync, watchPositionAsync } from "expo-location";
import { Car, ChevronLeft, LocateFixed, Navigation } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import Logo from "../../../assets/images/logo-vdb.svg";

type Coord = RideLocation;

type Ride = {
  idRota: string;
  latDestino: number;
  latSaida: number;
  lonDestino: number;
  lonSaida: number;
  realizado: boolean;
  statusCarona: "EM_ESPERA" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA" | null;
};

export default function RideTracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const zoomLevel = useRef(15);
  const hasFocusedDriverRef = useRef(false);
  const connectionRef = useRef<RideTrackingConnection | null>(null);
  const locationSubscriptionRef = useRef<LocationSubscription | null>(null);
  const [ride, setRide] = useState<Ride | null>(null);
  const [role, setRole] = useState<"MOTORISTA" | "PASSAGEIRO" | null>(null);
  const [driverLocation, setDriverLocation] = useState<Coord | null>(null);
  const [message, setMessage] = useState("Conectando ao acompanhamento...");

  useEffect(() => {
    let active = true;

    const loadTracking = async () => {
      const token = await getToken();
      if (!token) return;

      try {
        const [rideResponse, tripsResponse] = await Promise.all([
          api.get(`/carona/buscar/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/carona/minhas", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!active) return;

        const loadedRide = rideResponse.data as Ride;
        const trip = tripsResponse.data.find((item: { id: number; papel: "MOTORISTA" | "PASSAGEIRO" }) => item.id === Number(id));
        if (loadedRide.realizado || loadedRide.statusCarona !== "EM_ANDAMENTO" || !trip) {
          setMessage("O acompanhamento não está disponível para esta carona.");
          return;
        }

        setRide(loadedRide);
        setRole(trip.papel);
      } catch {
        if (active) setMessage("Não foi possível carregar o acompanhamento da carona.");
      }
    };

    void loadTracking();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!driverLocation || hasFocusedDriverRef.current) return;

    hasFocusedDriverRef.current = true;
    zoomLevel.current = 17;
    mapRef.current?.animateCamera({ center: driverLocation, zoom: zoomLevel.current });
  }, [driverLocation]);

  function zoomIn() {
    zoomLevel.current += 1;
    mapRef.current?.animateCamera({ zoom: zoomLevel.current });
  }

  function zoomOut() {
    zoomLevel.current -= 1;
    mapRef.current?.animateCamera({ zoom: zoomLevel.current });
  }

  useEffect(() => {
    if (!ride || !role) return;
    let active = true;

    const stopTracking = () => {
      locationSubscriptionRef.current?.remove();
      locationSubscriptionRef.current = null;
      const connection = connectionRef.current;
      connectionRef.current = null;
      if (connection) void connection.disconnect();
    };

    const startTracking = async () => {
      const token = await getToken();
      if (!token || !active) return;

      try {
        if (role === "MOTORISTA") {
          const permission = await requestForegroundPermissionsAsync();
          console.log("[Rastreamento] Permissão de localização:", permission.status);
          if (!permission.granted) {
            setMessage("Permita a localização para compartilhar o trajeto.");
            return;
          }
        }

        const connection = await connectRideTracking({
          idCarona: id,
          token,
          onLocation: role === "PASSAGEIRO" ? (location) => {
            if (active) {
              setDriverLocation(location);
              setMessage("Motorista em deslocamento.");
            }
          } : undefined,
        });
        if (!active) {
          await connection.disconnect();
          return;
        }
        connectionRef.current = connection;

        if (role === "PASSAGEIRO") {
          setMessage("Aguardando a localização do motorista.");
          return;
        }

        const subscription = await watchPositionAsync(
          { accuracy: LocationAccuracy.High, timeInterval: 500, distanceInterval: 1 },
          ({ coords }) => {
            const location = { latitude: coords.latitude, longitude: coords.longitude };
            console.log("[Rastreamento] Atualizando localização:", location);
            connection.publishLocation(location);
            setDriverLocation(location);
            setMessage("Compartilhando sua localização com os passageiros.");
          },
        );
        if (active) locationSubscriptionRef.current = subscription;
        else subscription.remove();
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Não foi possível conectar ao acompanhamento.");
      }
    };

    void startTracking();
    return () => {
      active = false;
      stopTracking();
    };
  }, [id, ride, role]);

  if (!ride || !role) {
    return (
      <View className="flex-1 bg-vintage-grape-950 items-center justify-center px-8">
        {message === "Conectando ao acompanhamento..." && <ActivityIndicator color="#dd99ff" size="large" />}
        <Text className="text-white font-bold text-center mt-4">{message}</Text>
        {message !== "Conectando ao acompanhamento..." && (
          <Pressable onPress={() => router.back()} className="mt-6 bg-purple-x11-700 px-5 py-3 rounded-xl">
            <Text className="text-white font-black">Voltar</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-vintage-grape-950">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: (ride.latSaida + ride.latDestino) / 2,
          longitude: (ride.lonSaida + ride.lonDestino) / 2,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >

        {driverLocation && (
          <Marker coordinate={driverLocation} title={role === "MOTORISTA" ? "Sua localização" : "Motorista"}>
            <View className="bg-purple-x11-700 p-3 rounded-full border-2 border-white">
              <Logo width={20} height={20} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      <View className="absolute right-4 bottom-44 bg-velvet-orchid-800 rounded-lg w-10 items-center justify-center">
        <Pressable onPress={zoomIn} accessibilityLabel="Aumentar zoom">
          <Text className="p-2 text-white text-2xl">+</Text>
        </Pressable>
        <Pressable onPress={zoomOut} accessibilityLabel="Diminuir zoom">
          <Text className="p-2 text-white text-2xl">-</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => router.back()} className="absolute top-12 left-6 bg-white p-3 rounded-xl shadow-lg">
        <ChevronLeft size={24} color="#391f47" />
      </Pressable>

      <View className="absolute bottom-0 left-0 right-0 bg-vintage-grape-50 rounded-t-[32px] px-7 pt-6 pb-10">
        <View className="flex-row items-center">
          <View className="bg-purple-x11-100 p-3 rounded-2xl mr-3">
            <LocateFixed size={22} color="#7b4d91" />
          </View>
          <View className="flex-1">
            <Text className="text-velvet-orchid-900 font-black text-lg">Acompanhamento ao vivo</Text>
            <Text className="text-velvet-orchid-700 text-sm mt-1">{message}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
