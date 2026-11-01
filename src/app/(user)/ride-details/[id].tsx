import { profilePhotoPath } from "@/src/services/avatar";
import UserAvatar from "@/components/user-avatar";
import PassengerMapMarker from "@/components/travels/passenger-map-marker";
import { passengerMapPoints } from "@/src/services/passenger-map-points";
import "@/global.css";
import CancelRideAction from "@/components/travels/cancel-ride-action";
import ChatButton from "@/components/chat/chat-button";
import { api } from "@/src/services/api";
import { obterLinkCompartilhamento } from "@/src/services/compartilhamento";
import { getToken } from "@/src/services/storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  ChevronLeft,
  Clock,
  MapPin,
  Navigation,
  Play,
  User,
  Check,
  X,
  Clock3,
  ShieldCheck,
  CircleDot
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

type Ride = {
  data: string;
  destinoTexto: string;
  distancia: number;
  duracao: number;
  genero: string;
  hora: string;
  idCarona: string;
  idRota: string;
  latDestino: number;
  latSaida: number;
  lonDestino: number;
  lonSaida: number;
  nome: string;
  idMotorista: number;
  fotoUrl: string | null;
  fotoMotorista?: string | null;
  qntAssentos: number;
  realizado: boolean;
  statusCarona: "EM_ESPERA" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA" | null;
  saidaTexto: string;
  vagasDisponiveis: number;
  papel: "MOTORISTA" | "PASSAGEIRO";
  paradas?: Array<{
    latPonto: number;
    lonPonto: number;
    indexOrder: number;
    textoPonto?: string;
  }>;
};

type Pedido = {
  latSaida: number;
  lonSaida: number;
  latDestino: number;
  lonDestino: number;
  idReserva?: number;
  idPedidoCarona: number;
  nome: string;
  idUser: number;
  fotoUrl: string | null;
  foto?: string | null;
  statusPedido: string;
  statusReserva?: string | null;
  saidaTexto: string;
  destinoTexto: string;
  genero: string;
  idAvaliacao?: number;
};

type MinhaCarona = {
  id: number;
  papel: "MOTORISTA" | "PASSAGEIRO";
  idReserva?: number | null;
  idPedidoCarona?: number | null;
  statusPedido?: string | null;
  statusReserva?: string | null;
  idAvaliacao?: number | null;
};

type Coord = {
  latitude: number;
  longitude: number;
};

export default function SearchDetails() {
  const { id, saidaLat, saidaLng, destinoLat, destinoLng } = useLocalSearchParams();
  const router = useRouter();
  const currentCarona = useRef(id);
  currentCarona.current = id;
  const [pedidosCarona, setPedidosCarona] = useState<typeof id>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [coords, setCoords] = useState<Coord[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const fittedRideRef = useRef<typeof id | undefined>(undefined);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [messageError, setMessageError] = useState("");
  const [carregandoVinculo, setCarregandoVinculo] = useState(true);
  const [papel, setPapel] = useState<"MOTORISTA" | "PASSAGEIRO" | null>(null);
  const [minhaCaronaData, setMinhaCaronaData] = useState<MinhaCarona | null>(null);
  const [filter, setFilter] = useState<"TODOS" | "ACEITOS" | "PENDENTES">("TODOS");
  const [cancelamentoBloqueado, setCancelamentoBloqueado] = useState(false);
  const [cancelamentoMensagem, setCancelamentoMensagem] = useState("");
  const compartilhamentoLock = useRef(false);
  const [compartilhando, setCompartilhando] = useState(false);
  const [erroCompartilhamento, setErroCompartilhamento] = useState("");
  const [iniciandoCarona, setIniciandoCarona] = useState(false);
  const [cancelandoReserva, setCancelandoReserva] = useState(false);
  const passengerPoints = useMemo(() => papel === "MOTORISTA" && pedidosCarona === id
    ? passengerMapPoints(pedidos, "details") : [], [papel, pedidosCarona, id, pedidos]);


  const temReserva = papel === "PASSAGEIRO" && minhaCaronaData?.idReserva != null;
  const reservaAcompanhavel = minhaCaronaData?.statusReserva === "ACEITA" || minhaCaronaData?.statusReserva === "EMBARQUE_LIBERADO" || minhaCaronaData?.statusReserva === "EMBARCADO";
  const dataCaronaNaoPassou = !!ride?.data && new Date(`${ride.data}T23:59:59`).getTime() >= Date.now();
  const podeCancelarReserva = temReserva && (minhaCaronaData?.statusReserva === "PENDENTE" || minhaCaronaData?.statusReserva === "ACEITA") && ride?.statusCarona === "EM_ESPERA" && dataCaronaNaoPassou;
  const pedidoPendente = papel === "PASSAGEIRO" && !temReserva && minhaCaronaData?.statusPedido === "PENDENTE";
  const podeSolicitar = !carregandoVinculo && papel === null && !ride?.realizado && ride?.statusCarona === "EM_ESPERA";
  const podeAcompanhar = !ride?.realizado && ride?.statusCarona === "EM_ANDAMENTO" && (papel === "MOTORISTA" || (papel === "PASSAGEIRO" && reservaAcompanhavel));
  const chatDisponivel = temReserva && ride?.statusCarona !== "CANCELADA" && ["ACEITA", "EMBARQUE_LIBERADO", "EMBARCADO", "CONCLUIDA_USUARIO", "CONCLUIDA_SISTEMA"].includes(minhaCaronaData?.statusReserva ?? "");

  const carregarDetalhes = useCallback(async () => {
    if (!id) return;
    setCarregandoVinculo(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Sessão expirada.");
      const headers = { Authorization: `Bearer ${token}` };
      const [rideResponse, minhasResponse] = await Promise.all([
        api.get(`/carona/buscar/${id}`, { headers }),
        api.get("/carona/minhas", { headers }),
      ]);
      if (currentCarona.current !== id) return;
      const minhaCarona: MinhaCarona | undefined = minhasResponse.data.find((carona: MinhaCarona) => carona.id === Number(id));
      setRide(rideResponse.data);
      setMinhaCaronaData(minhaCarona ?? null);
      setPapel(minhaCarona?.papel ?? null);
      if (minhaCarona?.papel === "MOTORISTA") await fetchPedidos(token);
      else setPedidos([]);
      setMessageError("");
    } catch (error: any) {
      setMessageError(typeof error.response?.data === "string" ? error.response.data : "Não foi possível atualizar os dados da carona.");
    } finally {
      setCarregandoVinculo(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => {
    void carregarDetalhes();
    const interval = setInterval(() => void carregarDetalhes(), 15000);
    return () => clearInterval(interval);
  }, [carregarDetalhes]));

  const fetchPedidos = async (token: string) => {
    setLoadingPedidos(true);
    try {
      const response = await api.get(`/pedido/buscarPedidos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (currentCarona.current !== id) return;
      setPedidos(response.data);
      setPedidosCarona(id);
    } catch (error: any) {
      if (currentCarona.current !== id) return;
      if (error.response?.status === 400 && error.response?.data === "Carona não possui nenhum pedido") {
        setPedidos([]);
        setPedidosCarona(id);
      } else {
        throw error;
      }
    } finally {
      setLoadingPedidos(false);
    }
  };

  useEffect(() => {
    if (!ride?.idRota) return;
    getToken().then((token) => {
      api.get(`/rota/buscar/front/${ride.idRota}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setCoords(response.data))
      .catch((error) => console.log(error));
    });
  }, [ride?.idRota]);

  useEffect(() => {
    if (!mapReady || coords.length === 0 || carregandoVinculo || fittedRideRef.current === id) return;
    if (papel === "MOTORISTA" && pedidosCarona !== id) return;
    fittedRideRef.current = id;
    mapRef.current?.fitToCoordinates([...coords, ...passengerPoints.map((point) => point.coordinate)], {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  }, [coords, mapReady, carregandoVinculo, id, papel, pedidosCarona, passengerPoints]);

  const requestRide = () => {
    setMessageError("");
    const getCoordinate = (value: string | string[] | undefined, fallback: number | undefined) => {
      const param = Array.isArray(value) ? value[0] : value;
      const coordinate = param?.trim() ? Number(param) : NaN;
      return Number.isFinite(coordinate) ? coordinate : fallback;
    };
    getToken().then((token) => {
      api.post("/pedido/agendar", {
        idCarona: id,
        saidaLat: getCoordinate(saidaLat, ride?.latSaida),
        saidaLng: getCoordinate(saidaLng, ride?.lonSaida),
        destinoLat: getCoordinate(destinoLat, ride?.latDestino),
        destinoLng: getCoordinate(destinoLng, ride?.lonDestino),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(async () => {
        await carregarDetalhes();
        router.push({
          pathname: "/page-sucess",
          params: { sucess: "true", message: "Carona agendada com sucesso!", to: "/travels" }
        });
      })
      .catch(error => setMessageError(error.response?.data || "Erro ao agendar carona"));
    });
  };

  const compartilharCarona = async () => {
    if (compartilhamentoLock.current || papel !== "MOTORISTA" || ride?.statusCarona !== "EM_ANDAMENTO" || ride.realizado) return;
    compartilhamentoLock.current = true;
    setCompartilhando(true);
    setErroCompartilhamento("");
    try {
      const { url } = await obterLinkCompartilhamento(Number(id));
      await Share.share({ message: `Acompanhe minha carona no Vai de Boa: ${url}` });
    } catch (error) {
      setErroCompartilhamento(error instanceof Error ? error.message : "Não foi possível compartilhar a carona. Tente novamente.");
    } finally {
      compartilhamentoLock.current = false;
      setCompartilhando(false);
    }
  };

  const iniciarCarona = async () => {
    if (iniciandoCarona) return;

    setMessageError("");
    const token = await getToken();
    if (!token) return;

    setIniciandoCarona(true);
    try {
      await api.get(`/carona/iniciar/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await carregarDetalhes();
      router.push({ pathname: "/ride-tracking/[id]", params: { id: String(id) } } as any);
    } catch (error: any) {
      setMessageError(error.response?.data || "Erro ao iniciar carona");
    } finally {
      setIniciandoCarona(false);
    }
  };

  const finalizarCarona = async () => {
    setMessageError("");
    const token = await getToken();
    if (!token) return;

    try {
      await api.get(`/carona/finalizar/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await carregarDetalhes();
      router.replace({
        pathname: "/page-sucess",
        params: { sucess: "true", message: "Carona finalizada com sucesso!", to: `/ride-details/${id}` }
      });
    } catch (error: any) {
      setMessageError(error.response?.data || "Erro ao finalizar carona");
    }
  };

  const cancelarReserva = async () => {
    const idReserva = minhaCaronaData?.idReserva;
    if (cancelandoReserva || idReserva == null || !podeCancelarReserva) return;

    setMessageError("");
    setCancelandoReserva(true);
    try {
      const token = await getToken();
      if (!token) return;

      const response = await api.get(`/reserva/cancelar/${idReserva}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await carregarDetalhes();
      router.replace({
        pathname: "/page-sucess",
        params: { sucess: "true", message: response.data, to: "/travels" },
      });
    } catch (error: any) {
      setMessageError(
        typeof error.response?.data === "string"
          ? error.response.data
          : "Não foi possível cancelar a reserva."
      );
    } finally {
      setCancelandoReserva(false);
    }
  };

  const handleAction = () => {
    if (podeCancelarReserva) cancelarReserva();
    else if (podeSolicitar) requestRide();
  };

  if (!ride) {
    return (
      <View className="flex-1 items-center justify-center bg-platinum">
        <ActivityIndicator size="large" color="#7b4d91" />
      </View>
    );
  }

  function acceptRide(pedidoId: number) {
    getToken().then(token => {
      if (!token) return
      
      api.post(`/pedido/aceitar/${pedidoId}`, null,
      {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        console.log("Pedido aceito: ", response)
        router.replace({
          pathname: "/page-sucess",
          params: {
            sucess: "true",
            message: "Pedido aceito com sucesso!",
            to: `/ride-details/${id}`
          }
        })  
      })
      .catch(err => {
        console.log("Erro ao aceitar carona: ", err)
        router.replace({
          pathname: "/page-sucess",
          params: {
            sucess: "false",
            message: "Erro ao aceitar pedido!",
            to: `/ride-details/${id}`
          }
        })
      })
    })
  }

  function recuseRide(pedidoId: number) {
    getToken().then(token => {
      if (!token) return
      
      api.post(`/pedido/recusar/${pedidoId}`, null,
      {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        console.log("Pedido recusado: ", response)
        router.replace({
          pathname: "/page-sucess",
          params: {
            sucess: "true",
            message: "Pedido recusado com sucesso!",
            to: `/ride-details/${id}`
          }
        })  
      })
      .catch(err => {
        console.log("Erro ao recusar carona: ", err)
        router.replace({
          pathname: "/page-sucess",
          params: {
            sucess: "false",
            message: "Erro ao recusar pedido!",
            to: `/ride-details/${id}`
          }
        })
      })
    })
  }

  const darkMapStyle = [
    {
      elementType: "geometry",
      stylers: [{ color: "#18171c" }],
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: "#c9c6d2" }],
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#111014" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#302d39" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#938ea4" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#220033" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#bb99ff" }],
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#32293d" }],
    },
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [{ color: "#19141f" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#302d39" }],
    },
    {
      featureType: "administrative",
      elementType: "geometry.stroke",
      stylers: [{ color: "#552f6a" }],
    },
  ];

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-platinum"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      
      {/* BOTÃO VOLTAR FLUTUANTE */}
      <TouchableOpacity
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/travels");
          }
        }}
        className="absolute top-12 left-6 z-20 bg-white/90 p-2 rounded-xl shadow-md"
      >
        <ChevronLeft size={24} color="#391f47" />
      </TouchableOpacity>

      {messageError && (
        <View className="absolute top-24 left-20 right-6 z-30 flex-row items-center bg-red-50 border border-red-200 rounded-2xl p-3 shadow-lg">
          <Text className="flex-1 text-red-700 font-bold text-sm pr-2">{messageError}</Text>
          <Pressable
            accessibilityLabel="Fechar mensagem de erro"
            onPress={() => setMessageError("")}
            className="p-1"
          >
            <X size={18} color="#b91c1c" />
          </Pressable>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        className="bg-platinum"
      >
        
        {/* SEÇÃO DO MAPA */}
        <View className="h-80 w-full">
          <MapView
            ref={mapRef}
            onMapReady={() => setMapReady(true)}
            style={{ flex: 1 }}
            customMapStyle={darkMapStyle}
            initialRegion={{
              latitude: (ride.latSaida + ride.latDestino) / 2,
              longitude: (ride.lonSaida + ride.lonDestino) / 2,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker coordinate={{ latitude: ride.latSaida, longitude: ride.lonSaida }}>
              <View className="bg-purple-x11-600 p-2 rounded-full border-2 border-white shadow-lg">
                <Navigation size={18} color="white" />
              </View>
            </Marker>
            <Marker coordinate={{ latitude: ride.latDestino, longitude: ride.lonDestino }}>
              <View className="bg-velvet-orchid-700 p-2 rounded-full border-2 border-white shadow-lg">
                <MapPin size={18} color="white" />
              </View>
            </Marker>
            {ride.paradas?.sort((a, b) => a.indexOrder - b.indexOrder).map((parada) => (
              <Marker
                key={`parada-${parada.indexOrder}`}
                coordinate={{ latitude: parada.latPonto, longitude: parada.lonPonto }}
              >
                <View className="bg-purple-x11-500 px-2 py-1 rounded-full border-2 border-white flex-row items-center">
                  <CircleDot size={12} color="white" />
                  <Text className="text-white text-xs font-bold ml-1">{parada.indexOrder + 1}</Text>
                </View>
              </Marker>
            ))}
            {passengerPoints.map((point) => <PassengerMapMarker key={point.key} point={point} />)}
            {coords.length > 0 && (
              <Polyline coordinates={coords} strokeWidth={4} strokeColor="#dd99ff" />
            )}
          </MapView>
        </View>

        {/* CARD PRINCIPAL DE DETALHES */}
        <View className="flex-1 bg-vintage-grape-50 rounded-t-[45px] -mt-10 px-8 pt-8 shadow-2xl pb-12 border border-purple-x11-800">
          
          {/* HEADER: MOTORISTA E VAGAS */}
          <View className="flex-row items-center justify-between mb-8">
              <TouchableOpacity onPress={() => router.push({ pathname: "/user-profile/[id]", params: { id: String(ride.idMotorista), idCarona: String(id) } } as any)} className="flex-row items-center flex-1">
               <View className="bg-purple-x11-100 w-14 h-14 rounded-2xl mr-4 overflow-hidden items-center justify-center">
                 <UserAvatar fotoUrl={String(ride.idCarona) === String(id) ? profilePhotoPath(ride.idMotorista, id) : null} identity={ride.idMotorista} fallback={<User size={28} color="#7b4d91" />} />
               </View>
              <View className="flex-1">
                <Text numberOfLines={1} className="text-velvet-orchid-900 font-black text-xl">{ride.nome}</Text>
                <View className="flex-row items-center">
                  <ShieldCheck size={12} color="#7b4d91" />
                  <Text className="text-gray-600 text-[10px] font-bold uppercase ml-1">Motorista</Text>
                </View>
              </View>
              </TouchableOpacity>
            <View className="bg-purple-x11-50 px-4 py-2 rounded-2xl border border-purple-x11-100">
              <Text className="text-purple-x11-700 font-black">{ride.vagasDisponiveis} vagas</Text>
            </View>
          </View>

          {/* GRID DE INFORMAÇÕES (DATA, HORA, DISTÂNCIA) */}
          <View className="flex-row items-center bg-platinum/30 rounded-[28px] p-2 mb-10 border border-purple-x11-50/50">
            <View className="flex-1 items-center py-2">
              <Calendar size={18} color="#7b4d91" />
              <Text className="text-velvet-orchid-900 font-black text-sm mt-1">{ride.data.split("-").reverse().join("/")}</Text>
              <Text className="text-gray-600 text-[8px] font-bold uppercase tracking-widest">Data</Text>
            </View>
            <View className="w-[1px] h-8 bg-purple-x11-100" />
            <View className="flex-1 items-center py-2">
              <Clock size={18} color="#7b4d91" />
              <Text className="text-velvet-orchid-900 font-black text-sm mt-1">{ride.hora.slice(0, 5)}</Text>
              <Text className="text-gray-600 text-[8px] font-bold uppercase tracking-widest">Embarque</Text>
            </View>
            <View className="w-[1px] h-8 bg-purple-x11-100" />
            <View className="flex-1 items-center py-2">
              <Navigation size={18} color="#7b4d91" />
              <Text className="text-velvet-orchid-900 font-black text-sm mt-1">{ride.distancia?.toFixed(1) ?? "--"} km</Text>
              <Text className="text-gray-600 text-[8px] font-bold uppercase tracking-widest">Trajeto</Text>
            </View>
          </View>

          {/* ITINERÁRIO: TIMELINE DE SAÍDA E DESTINO */}
          <View className="mb-10 px-2">
            <View className="flex-row items-start">
              <View className="items-center mr-4">
                <View className="w-5 h-5 rounded-full bg-purple-x11-100 items-center justify-center border border-purple-x11-200">
                  <View className="w-2 h-2 rounded-full bg-purple-x11-600" />
                </View>
                <View className="w-[2px] h-12 bg-purple-x11-100 my-1" />
              </View>
              <View className="flex-1">
                <Text className="text-purple-x11-400 text-[10px] font-black uppercase tracking-[1px] mb-1">Ponto de Partida</Text>
                <Text className="text-velvet-orchid-900 font-bold text-base leading-5" numberOfLines={2}>{ride.saidaTexto}</Text>
              </View>
            </View>

            {ride.paradas?.sort((a, b) => a.indexOrder - b.indexOrder).map((parada, idx) => (
              <View key={`parada-itinerary-${idx}`} className="flex-row items-start mt-[-4px]">
                <View className="items-center mr-4">
                  <View className="w-5 h-5 rounded-full bg-purple-x11-500 items-center justify-center border border-purple-x11-200">
                    <Text className="text-white text-[8px] font-bold">{parada.indexOrder + 1}</Text>
                  </View>
                  <View className="w-[2px] h-12 bg-purple-x11-100 my-1" />
                </View>
                <View className="flex-1">
                  <Text className="text-purple-x11-400 text-[10px] font-black uppercase tracking-[1px] mb-1">Parada {parada.indexOrder + 1}</Text>
                  <Text className="text-velvet-orchid-900 font-bold text-base leading-5" numberOfLines={2}>
                    {parada.textoPonto || `Parada ${parada.indexOrder + 1}`}
                  </Text>
                </View>
              </View>
            ))}

            <View className="flex-row items-start mt-[-4px]">
              <View className="items-center mr-4">
                <View className="w-5 h-5 rounded-full bg-velvet-orchid-700 items-center justify-center shadow-sm">
                  <MapPin size={12} color="white" />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-velvet-orchid-600 text-[10px] font-black uppercase tracking-[1px] mb-1">Destino Final</Text>
                <Text className="text-velvet-orchid-900 font-bold text-base leading-5" numberOfLines={2}>{ride.destinoTexto}</Text>
              </View>
            </View>
          </View>

          {!!cancelamentoMensagem && <Text accessibilityRole="alert" className="text-velvet-orchid-900 font-bold mb-4">{cancelamentoMensagem}</Text>}
          {ride.statusCarona === "CANCELADA" && <Text className="text-velvet-orchid-900 font-black mb-4">CANCELADA</Text>}
          {/* BOTÕES DE AÇÃO DO MOTORISTA */}
          {papel === "MOTORISTA" && !ride.realizado && (ride.statusCarona === "EM_ESPERA" || ride.statusCarona === "EM_ANDAMENTO") && (
            <View className="gap-3 mb-8">
              {ride.statusCarona !== "EM_ANDAMENTO" && (
                <Pressable
                  disabled={iniciandoCarona || cancelamentoBloqueado}
                  className="bg-purple-x11-700 h-16 rounded-2xl items-center justify-center shadow-lg active:scale-[0.97] flex-row"
                  onPress={iniciarCarona}
                >
                  <Text className="text-white font-black text-lg">{iniciandoCarona ? "Iniciando..." : "Iniciar Carona"}</Text>
                </Pressable>
              )}

              <Pressable
                className="bg-velvet-orchid-700 h-16 rounded-2xl items-center justify-center shadow-lg active:scale-[0.97] flex-row"
                disabled={cancelamentoBloqueado}
                onPress={finalizarCarona}
              >
                <Text className="text-white font-black text-lg">Marcar como realizada</Text>
              </Pressable>
              {ride.statusCarona === "EM_ESPERA" && <CancelRideAction
                id={Number(id)}
                onBlockedChange={setCancelamentoBloqueado}
                onMessage={setCancelamentoMensagem}
                onRefresh={async () => {
                  const token = await getToken();
                  if (!token) throw new Error("Sessão expirada");
                  const { data } = await api.get(`/carona/buscar/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }, timeout: 15000,
                  });
                  setRide(data);
                  carregarDetalhes();
                }}
              />}
            </View>
          )}

          {/* BOTÃO DE AÇÃO DO PASSAGEIRO */}
          {pedidoPendente && (
            <View className="bg-purple-x11-100 border border-purple-x11-200 rounded-2xl p-5 mb-8">
              <Text className="text-purple-x11-700 font-black text-base">Aguardando aprovação do motorista</Text>
            </View>
          )}

          {(podeSolicitar || podeCancelarReserva) && !ride.realizado && (
            <View className="gap-3 mb-8">
              <Pressable
                className="bg-velvet-orchid-700 h-16 rounded-2xl items-center justify-center shadow-lg active:scale-[0.97]"
                onPress={handleAction}
                disabled={cancelandoReserva}
              >
                {cancelandoReserva ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-black text-lg">{podeCancelarReserva ? "Cancelar reserva" : "Solicitar reserva"}</Text>
                )}
              </Pressable>



            </View>
          )}

          {podeAcompanhar && (
            <Pressable
              className="bg-purple-x11-700 h-16 rounded-2xl items-center justify-center shadow-lg active:scale-[0.97] flex-row mb-8"
              onPress={() => router.push({ pathname: "/ride-tracking/[id]", params: { id: String(id) } } as any)}
            >
              <Navigation size={20} color="white" />
              <Text className="text-white font-black text-lg ml-2">Acompanhar carona</Text>
            </Pressable>
          )}

          {papel === "MOTORISTA" && !ride.realizado && ride.statusCarona === "EM_ANDAMENTO" && (
            <View className="mb-8">
              <Pressable
                accessibilityRole="button"
                disabled={compartilhando}
                onPress={() => void compartilharCarona()}
                className={`bg-velvet-orchid-700 h-16 rounded-2xl items-center justify-center ${compartilhando ? "opacity-50" : ""}`}
              >
                <Text className="text-white font-black text-lg">{compartilhando ? "Obtendo link…" : "Compartilhar carona"}</Text>
              </Pressable>
              {!!erroCompartilhamento && <Text accessibilityRole="alert" className="text-velvet-orchid-900 mt-3 font-bold">{erroCompartilhamento}</Text>}
            </View>
          )}

          {/* CHAT DA RESERVA DO PASSAGEIRO */}
          {temReserva && (
            <View className="mb-6 bg-platinum-50 p-4 rounded-2xl border border-purple-x11-100">
              <Text className="text-velvet-orchid-900 font-bold">Sua reserva</Text>
              <Text className="text-velvet-orchid-700 text-sm mt-1">Status: {minhaCaronaData?.statusReserva ?? "Indisponível"}</Text>
              {chatDisponivel ? <ChatButton idReserva={minhaCaronaData?.idReserva ?? undefined} idCarona={Number(id)} nome={ride.nome} /> : <Text className="text-gray-500 text-sm mt-2">Chat indisponível para o estado atual da reserva.</Text>}
            </View>
          )}
          {/* BOTÃO AVALIAR (quando a carona foi realizada) */}
          {ride.realizado && papel === "PASSAGEIRO" && minhaCaronaData?.idAvaliacao && (
            <Pressable
              className="bg-purple-x11-100 border border-purple-x11-200 h-16 rounded-2xl items-center justify-center shadow-lg active:scale-[0.97] mb-8"
              onPress={() => router.push({
                pathname: "/review/[id]",
                params: { id: String(minhaCaronaData.idAvaliacao), nome: ride.nome }
              } as any)}
            >
              <Text className="text-purple-x11-700 font-black text-lg">Avaliar</Text>
            </Pressable>
          )}

          {/* SEÇÃO DE LISTAGEM DE PEDIDOS */}
          {papel === "MOTORISTA" && (
            <View className="mt-6 border-t border-platinum pt-6">
              
              {/* HEADER */}
              <View className="flex-row items-center justify-between mb-6">
                <View className="flex-row items-center">
                  <View className="bg-purple-x11-100 p-3 rounded-2xl">
                    <Clock3 size={22} color="#7b4d91" />
                  </View>

                  <View className="ml-3">
                    <Text className="text-velvet-orchid-900 font-black text-2xl">
                      Solicitações
                    </Text>

                    <Text className="text-gray-600 text-xs font-bold uppercase">
                      {pedidos.length} pedidos recebidos
                    </Text>
                  </View>
                </View>
              </View>

              {/* LOADING */}
              {loadingPedidos ? (
                <View className="py-10">
                  <ActivityIndicator color="#7b4d91" size="large" />
                </View>
              ) : pedidos.length === 0 ? (

                /* SEM PEDIDOS */
                <View className="bg-platinum/40 border border-dashed border-purple-x11-100 rounded-[30px] p-8 items-center">
                  <View className="bg-purple-x11-100 p-4 rounded-full mb-4">
                    <Clock3 size={28} color="#7b4d91" />
                  </View>

                  <Text className="text-velvet-orchid-900 font-black text-lg mb-1">
                    Nenhuma solicitação
                  </Text>

                  <Text className="text-gray-600 text-center text-sm leading-5">
                    Quando alguém solicitar essa carona,
                    os pedidos aparecerão aqui.
                  </Text>
                </View>

              ) : (

                /* LISTA */
                <View className="gap-5">
                  <View className="flex-row gap-3 mb-6">  
                    <TouchableOpacity
                      onPress={() => setFilter("TODOS")}
                      className={`px-4 py-3 rounded-2xl ${
                        filter === "TODOS"
                          ? "bg-purple-x11-700"
                          : "bg-white border border-purple-x11-100"
                      }`}
                    >
                      <Text
                        className={`font-black text-xs ${
                          filter === "TODOS"
                            ? "text-white"
                            : "text-velvet-orchid-900"
                        }`}
                      >
                        TODOS
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setFilter("PENDENTES")}
                      className={`px-4 py-3 rounded-2xl ${
                        filter === "PENDENTES"
                          ? "bg-red-500"
                          : "bg-white border border-red-100"
                      }`}
                    >
                      <Text
                        className={`font-black text-xs ${
                          filter === "PENDENTES"
                            ? "text-white"
                            : "text-red-500"
                        }`}
                      >
                        PENDENTES
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setFilter("ACEITOS")}
                      className={`px-4 py-3 rounded-2xl ${
                        filter === "ACEITOS"
                          ? "bg-green-600"
                          : "bg-white border border-green-100"
                      }`}
                    >
                      <Text
                        className={`font-black text-xs ${
                          filter === "ACEITOS"
                            ? "text-white"
                            : "text-green-700"
                        }`}
                      >
                        ACEITOS
                      </Text>
                    </TouchableOpacity>

                  </View>
                  {pedidos
                  .filter((pedido) => {
                    if (filter === "TODOS") return true;

                    if (filter === "ACEITOS") {
                      return pedido.statusPedido === "ACEITO";
                    }

                    if (filter === "PENDENTES") {
                      return pedido.statusPedido === "PENDENTE";
                    }

                    return true;
                  })
                  .sort((a, b) => {
                    if (a.statusPedido === "PENDENTE" && b.statusPedido !== "PENDENTE") {
                      return -1;
                    }

                    if (a.statusPedido !== "PENDENTE" && b.statusPedido === "PENDENTE") {
                      return 1;
                    }

                    return 0;
                  })
                  .map((pedido) => (
                    <View
                      key={pedido.idPedidoCarona}
                      className="bg-white border border-purple-x11-100 rounded-[32px] p-5 shadow-sm"
                    >
                      {/* TOPO */}
                      <View className="flex-row items-start justify-between mb-5">                        
                        {/* USUÁRIO */}
                        <TouchableOpacity onPress={() => router.push({ pathname: "/user-profile/[id]", params: { id: String(pedido.idUser), idCarona: String(id) } } as any)} className="flex-row flex-1 pr-3">
                          <View className="bg-purple-x11-100 w-14 h-14 rounded-full items-center justify-center mr-4 overflow-hidden">
                            <UserAvatar fotoUrl={pedidosCarona === id ? profilePhotoPath(pedido.idUser, id) : null} identity={pedido.idUser} fallback={<User size={24} color="#7b4d91" />} />
                          </View>
                          <View className="flex-1">
                            <Text
                              numberOfLines={1}
                              className="text-velvet-orchid-900 font-black text-lg"
                            >
                              {pedido.nome}
                            </Text>
                            <View className="flex-row items-center mt-1">
                              <ShieldCheck size={12} color="#7b4d91" />

                              <Text className="text-gray-600 text-[10px] font-bold uppercase ml-1">
                                {pedido.genero}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                        {/* STATUS */}
                        <View className={`px-3 py-2 rounded-2xl ${(pedido.statusReserva ?? pedido.statusPedido) === "ACEITO" || (pedido.statusReserva ?? pedido.statusPedido) === "ACEITA" || (pedido.statusReserva ?? pedido.statusPedido) === "EMBARCADO" ? "bg-green-100" : "bg-red-100"}`}>
                          <Text className={`text-[10px] font-black uppercase tracking-wide ${(pedido.statusReserva ?? pedido.statusPedido) === "ACEITO" || (pedido.statusReserva ?? pedido.statusPedido) === "ACEITA" || (pedido.statusReserva ?? pedido.statusPedido) === "EMBARCADO" ? "text-green-800" : "text-red-600"}`}>
                            {pedido.statusReserva ?? pedido.statusPedido}
                          </Text>
                        </View>
                      </View>
                      {/* CARD EMBARQUE */}
                      <View className="bg-platinum/40 rounded-3xl p-4 mb-2 border border-purple-x11-50 flex-col gap-4">                        
                        <View className="flex-row items-start">
                          <View className="bg-purple-x11-100 p-2 rounded-xl mr-3 mt-1">
                            <MapPin size={16} color="#7b4d91" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-purple-x11-400 text-[10px] font-black uppercase tracking-widest mb-1">
                              Local de embarque
                            </Text>
                            <Text
                              className="text-velvet-orchid-900 font-bold leading-5"
                              numberOfLines={3}
                            >
                              {pedido.saidaTexto}
                            </Text>
                          </View>
                        </View>
                                             
                        <View className="flex-row items-start">
                          <View className="bg-purple-x11-600 p-2 rounded-xl mr-3 mt-1">
                            <Navigation size={16} color="#f2f1f4" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-purple-x11-400 text-[10px] font-black uppercase tracking-widest mb-1">
                              Destino
                            </Text>
                            <Text
                              className="text-velvet-orchid-900 font-bold leading-5"
                              numberOfLines={3}
                            >
                              {pedido.destinoTexto}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {/* AÇÕES */}
                      {pedido.statusPedido === "ACEITO" && <ChatButton idReserva={pedido.idReserva} idCarona={Number(id)} nome={pedido.nome} />}
                      {pedido.statusPedido === "PENDENTE" &&
                        <View className="flex-row gap-3">                        
                          {/* ACEITAR */}
                          <TouchableOpacity
                            activeOpacity={0.85}
                            className="flex-1 bg-purple-x11-700 h-14 rounded-2xl flex-row items-center justify-center shadow-sm"
                            onPress={() => acceptRide(pedido.idPedidoCarona)}
                          >
                            <Check size={18} color="white" />
                            <Text className="text-white font-black ml-2 text-sm">
                              ACEITAR
                            </Text>
                          </TouchableOpacity>
                          {/* RECUSAR */}
                          <TouchableOpacity
                            activeOpacity={0.85}
                            className="flex-1 bg-red-50 border border-red-400 h-14 rounded-2xl flex-row items-center justify-center"
                            onPress={() => recuseRide(pedido.idPedidoCarona)}
                          >
                            <X size={18} color="#ef4444" />
                            <Text className="text-red-500 font-black ml-2 text-sm">
                              RECUSAR
                            </Text>
                          </TouchableOpacity>
                        </View>
                      }
                      {pedido.statusPedido === "ACEITO" && ride.realizado && pedido.idAvaliacao && (
                        <Pressable
                          className="bg-purple-x11-100 border border-purple-x11-200 h-14 rounded-2xl items-center justify-center shadow-sm active:scale-[0.97]"
                          onPress={() => router.push({
                            pathname: "/review/[id]",
                            params: { id: String(pedido.idAvaliacao), nome: pedido.nome }
                          } as any)}
                        >
                          <Text className="text-purple-x11-700 font-black text-sm">Avaliar</Text>
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
