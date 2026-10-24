import "@/global.css";
import { api } from "@/src/services/api";
import { connectRideTracking, RideTrackingConnection, RideLocation } from "@/src/services/ride-tracking";
import { getToken } from "@/src/services/storage";
import { obterLinkCompartilhamento } from "@/src/services/compartilhamento";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LocationAccuracy, LocationSubscription, requestForegroundPermissionsAsync, watchPositionAsync } from "expo-location";
import { ChevronLeft, LocateFixed } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import Logo from "../../../assets/images/logo-vdb.svg";

type Coord = RideLocation;
type Passenger = { idPedidoCarona: number; nome: string; statusPedido: string };
type Trip = { id: number; papel: "MOTORISTA" | "PASSAGEIRO"; idReserva?: number | null };

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
  const [driverRoute, setDriverRoute] = useState<Coord[]>([]);
  const [message, setMessage] = useState("Conectando ao acompanhamento...");

  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [codigo, setCodigo] = useState("");
  const [feedback, setFeedback] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [compartilhando, setCompartilhando] = useState(false);
  const [erroCompartilhamento, setErroCompartilhamento] = useState("");
  const sharingRef = useRef(false);
  const compartilhar = async () => {
    if (sharingRef.current) return;
    sharingRef.current = true;
    setCompartilhando(true);
    setErroCompartilhamento("");
    try {
      const { url } = await obterLinkCompartilhamento(Number(id));
      await Share.share({ message: `Acompanhe minha carona no Vai de Boa: ${url}` });
    } catch (error) {
      setErroCompartilhamento(error instanceof Error ? error.message : "Não foi possível compartilhar o acompanhamento.");
    } finally {
      sharingRef.current = false;
      setCompartilhando(false);
    }
  };
  const submittingRef = useRef(false);
  const canConfirm = role === "MOTORISTA" && ride?.statusCarona === "EM_ANDAMENTO" && !ride.realizado;

  const confirmarEmbarque = async () => {
    if (!canConfirm || submittingRef.current) return;
    if (!/^[0-9]{4}$/.test(codigo)) {
      setFeedback("Informe os quatro dígitos do código.");
      return;
    }
    submittingRef.current = true;
    setConfirmando(true);
    setFeedback("");
    try {
      const token = await getToken();
      if (!token) {
        setFeedback("Sessão expirada. Entre novamente para confirmar o embarque.");
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      const response = await api.post<string>("/codigo/confirmar", {
        idCarona: Number(id),
        codigo,
      }, { headers, responseType: "text" });
      setCodigo("");
      setFeedback(response.data);
      try {
        const [rideResponse, tripsResponse, passengersResponse] = await Promise.all([
          api.get(`/carona/buscar/${id}`, { headers }),
          api.get<Trip[]>("/carona/minhas", { headers }),
          api.get<Passenger[]>(`/pedido/buscarPedidos/${id}`, { headers }),
        ]);
        setRide(rideResponse.data);
        setRole(tripsResponse.data.find((trip) => trip.id === Number(id))?.papel ?? null);
        setPassengers(passengersResponse.data);
      } catch {
        setFeedback(`${response.data}. Não foi possível atualizar os dados. Reabra o acompanhamento para atualizar a lista.`);
      }
    } catch (error: any) {
      setFeedback(typeof error.response?.data === "string" && error.response.data
        ? error.response.data : "Não foi possível confirmar o embarque. Tente novamente.");
    } finally {
      submittingRef.current = false;
      setConfirmando(false);
    }
  };

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
        const trip = tripsResponse.data.find((item: Trip) => item.id === Number(id));
        const canTrack = trip?.papel === "MOTORISTA" || (trip?.papel === "PASSAGEIRO" && trip.idReserva != null);
        if (loadedRide.realizado || loadedRide.statusCarona !== "EM_ANDAMENTO" || !canTrack) {
          setMessage("O acompanhamento não está disponível para esta carona.");
          return;
        }

        setRide(loadedRide);
        setRole(trip.papel);
        if (trip.papel === "MOTORISTA") {
          try {
            const response = await api.get<Passenger[]>(`/pedido/buscarPedidos/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (active) setPassengers(response.data);
          } catch {
            if (active) setFeedback("Não foi possível carregar os passageiros.");
          }
        }
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
    if (!ride || !role || ride.realizado || ride.statusCarona !== "EM_ANDAMENTO") return;
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
              setDriverRoute((route) => appendLocation(route, location));
              setMessage("Motorista em deslocamento.");
            }
          } : undefined,
          onRoute: (route) => {
            if (!active) return;
            setDriverRoute((currentRoute) => mergeRoutes(route, currentRoute));
            setDriverLocation((location) => location ?? route.at(-1) ?? null);
          },
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
            setDriverRoute((route) => appendLocation(route, location));
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
  }, [id, !!ride, role, ride?.statusCarona, ride?.realizado]);

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
        {driverRoute.length > 1 && (
          <Polyline coordinates={driverRoute} strokeColor="#660099" strokeWidth={5} />
        )}
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

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="absolute bottom-0 left-0 right-0" pointerEvents="box-none">
      <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 420 }} className="bg-vintage-grape-50 rounded-t-[32px]" contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 24, paddingBottom: 40 }}>
        <View className="flex-row items-center">
          <View className="bg-purple-x11-100 p-3 rounded-2xl mr-3">
            <LocateFixed size={22} color="#7b4d91" />
          </View>
          <View className="flex-1">
            <Text className="text-velvet-orchid-900 font-black text-lg">Acompanhamento ao vivo</Text>
            <Text className="text-velvet-orchid-700 text-sm mt-1">{message}</Text>
          </View>
        </View>
        <Pressable onPress={compartilhar} disabled={compartilhando} accessibilityRole="button" accessibilityState={{ disabled: compartilhando, busy: compartilhando }} className="mt-5 rounded-xl bg-purple-x11-700 px-4 h-12 flex-row gap-3 items-center justify-center">
          {compartilhando && <ActivityIndicator color="white" />}
          <Text className="text-white font-black">{compartilhando ? "Obtendo link..." : "Compartilhar acompanhamento"}</Text>
        </Pressable>
        {!!erroCompartilhamento && <Text accessibilityLiveRegion="polite" className="text-velvet-orchid-900 mt-3">{erroCompartilhamento}</Text>}
        {canConfirm && (
          <View className="mt-5">
            <Text className="text-velvet-orchid-900 font-black text-lg">Confirmar embarque</Text>
            <Text className="text-velvet-orchid-700 mt-1">Peça o código ao passageiro após ele entrar no veículo.</Text>
            <Text nativeID="boarding-code-label" className="text-velvet-orchid-900 font-bold mt-4 mb-2">Código de embarque</Text>
            <TextInput
              accessibilityLabel="Código de embarque"
              value={codigo}
              onChangeText={(value) => setCodigo(value.replace(/[^0-9]/g, "").slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              editable={!confirmando}
              placeholder="0000"
              className="bg-white border border-purple-x11-200 rounded-xl px-4 h-12 text-center text-velvet-orchid-900 font-black text-lg"
            />
            <Pressable onPress={confirmarEmbarque} disabled={confirmando} accessibilityRole="button" className={`mt-3 rounded-xl h-12 flex-row gap-3 items-center justify-center ${confirmando ? "bg-purple-x11-300" : "bg-purple-x11-700"}`}>
              {confirmando && <ActivityIndicator color="white" />}
              <Text className="text-white font-black">{confirmando ? "Confirmando..." : "Confirmar embarque"}</Text>
            </Pressable>
          </View>
        )}
        {role === "MOTORISTA" && (
          <View className="mt-4">
            {!!feedback && <Text accessibilityLiveRegion="polite" className="text-velvet-orchid-900 mb-3">{feedback}</Text>}
            <Text className="text-velvet-orchid-900 font-bold">Passageiros e solicitações</Text>
            {passengers.map((passenger) => (
              <Text key={passenger.idPedidoCarona} className="text-velvet-orchid-700 mt-2">{passenger.nome} · {passenger.statusPedido}</Text>
            ))}
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function appendLocation(route: Coord[], location: Coord) {
  const lastLocation = route.at(-1);
  if (lastLocation?.latitude === location.latitude && lastLocation.longitude === location.longitude) {
    return route;
  }
  return [...route, location];
}

function mergeRoutes(route: Coord[], currentRoute: Coord[]) {
  return currentRoute.reduce(appendLocation, route);
}
