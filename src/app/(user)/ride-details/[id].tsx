import "@/global.css";
import ChatButton from "@/components/chat/chat-button";
import { api } from "@/src/services/api";
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
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
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
  fotoMotorista?: string;
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
  idReserva?: number;
  idPedidoCarona: number;
  nome: string;
  idUser: number;
  foto?: string;
  statusPedido: string;
  saidaTexto: string;
  destinoTexto: string;
  genero: string;
  idAvaliacao?: number;
};

type Coord = {
  latitude: number;
  longitude: number;
};

export default function SearchDetails() {
  const { id, saidaLat, saidaLng, destinoLat, destinoLng } = useLocalSearchParams();
  const router = useRouter();
  const [ride, setRide] = useState<Ride | null>(null);
  const [coords, setCoords] = useState<Coord[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const mapRef = useRef<MapView>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [messageError, setMessageError] = useState("");
  const [textBtn, setTextBtn] = useState("Carregando...");
  const [papel, setPapel] = useState<"MOTORISTA" | "PASSAGEIRO" | null>(null);
  const [minhaCaronaData, setMinhaCaronaData] = useState<any>(null);
  const [filter, setFilter] = useState<"TODOS" | "ACEITOS" | "PENDENTES">("TODOS");
  const [iniciandoCarona, setIniciandoCarona] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [confirmandoCodigo, setConfirmandoCodigo] = useState(false);
  const [codigoFeedback, setCodigoFeedback] = useState("");

  const carregarDetalhes = useCallback(() => {
    if (!id) return;

    getToken().then((token) => {
      if (!token) return;
      api.get(`/carona/buscar/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        console.log(response.data)
        setRide(response.data)
        api.get("/carona/minhas", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(resMinhas => {
          const caronas = resMinhas.data;
          const minhaCarona = caronas.find((carona: any) => carona.id === Number(id));
          
          if (minhaCarona) {
            setMinhaCaronaData(minhaCarona);
            if (minhaCarona.papel === "MOTORISTA") {
              setPapel("MOTORISTA");
              fetchPedidos(token);
            } else {
              setPapel("PASSAGEIRO");
              setTextBtn("Cancelar reserva");
            }
          } else {
            setTextBtn("Solicitar reserva");
          }
        });
      })
      .catch((error) => console.log(error));
    });
  }, [id]);

  useFocusEffect(useCallback(() => {
    carregarDetalhes();
    const interval = setInterval(carregarDetalhes, 15000);
    return () => clearInterval(interval);
  }, [carregarDetalhes]));

  const fetchPedidos = (token: string) => {
    setLoadingPedidos(true);
    api.get(`/pedido/buscarPedidos/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(response => setPedidos(response.data))
    .catch(error => console.log(error))
    .finally(() => setLoadingPedidos(false));
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
  }, [ride]);

  useEffect(() => {
    if (coords.length === 0) return;
    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  }, [coords]);

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
      .then(() => {
        router.push({
          pathname: "/page-sucess",
          params: { sucess: "true", message: "Carona agendada com sucesso!", to: "/travels" }
        });
      })
      .catch(error => setMessageError(error.response?.data || "Erro ao agendar carona"));
    });
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
      setRide((currentRide) => currentRide && { ...currentRide, statusCarona: "EM_ANDAMENTO" });
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
      router.replace({
        pathname: "/page-sucess",
        params: { sucess: "true", message: "Carona finalizada com sucesso!", to: `/ride-details/${id}` }
      });
    } catch (error: any) {
      setMessageError(error.response?.data || "Erro ao finalizar carona");
    }
  };

  const confirmarCodigo = async () => {
    if (codigo.length !== 4) {
      setCodigoFeedback("Informe os quatro dígitos do código.");
      return;
    }

    const token = await getToken();
    if (!token) return;

    setConfirmandoCodigo(true);
    setCodigoFeedback("");
    try {
      const response = await api.post("/codigo/confirmar", {
        idCarona: Number(id),
        codigo,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCodigo("");
      setCodigoFeedback(response.data);
    } catch (error: any) {
      setCodigoFeedback(error.response?.data || "Não foi possível confirmar o código.");
    } finally {
      setConfirmandoCodigo(false);
    }
  };

  const handleAction = () => {
    if (textBtn === "Solicitar reserva") requestRide();
    else if (textBtn === "Cancelar reserva") setMessageError("Cancelamento de reserva não disponível no momento");
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
                 {ride.fotoMotorista ? <Image source={{ uri: ride.fotoMotorista }} className="w-full h-full" /> : <User size={28} color="#7b4d91" />}
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

          {/* BOTÕES DE AÇÃO DO MOTORISTA */}
          {papel === "MOTORISTA" && !ride.realizado && (
            <View className="gap-3 mb-8">
              {ride.statusCarona !== "EM_ANDAMENTO" && (
                <Pressable
                  disabled={iniciandoCarona}
                  className="bg-purple-x11-700 h-16 rounded-2xl items-center justify-center shadow-lg active:scale-[0.97] flex-row"
                  onPress={iniciarCarona}
                >
                  <Text className="text-white font-black text-lg">{iniciandoCarona ? "Iniciando..." : "Iniciar Carona"}</Text>
                </Pressable>
              )}

              <Pressable
                className="bg-velvet-orchid-700 h-16 rounded-2xl items-center justify-center shadow-lg active:scale-[0.97] flex-row"
                onPress={finalizarCarona}
              >
                <Text className="text-white font-black text-lg">Marcar como realizada</Text>
              </Pressable>
            </View>
          )}

          {/* BOTÃO DE AÇÃO DO PASSAGEIRO */}
          {papel !== "MOTORISTA" && !ride.realizado && (
            <View className="gap-3 mb-8">
              <Pressable
                className="bg-velvet-orchid-700 h-16 rounded-2xl items-center justify-center shadow-lg active:scale-[0.97]"
                onPress={handleAction}
              >
                <Text className="text-white font-black text-lg">{textBtn}</Text>
              </Pressable>

              {textBtn === "Cancelar reserva" && (
                <View className="bg-purple-x11-100 border border-purple-x11-200 rounded-2xl p-5">
                  <Text className="text-purple-x11-700 font-black text-base">Confirmar embarque ou desembarque</Text>
                  <Text className="text-velvet-orchid-900 text-sm mt-1 mb-4">Informe o código de quatro dígitos enviado para seu e-mail.</Text>
                  <View className="flex-row gap-3">
                    <TextInput
                      value={codigo}
                      onChangeText={(value) => setCodigo(value.replace(/\D/g, "").slice(0, 4))}
                      keyboardType="number-pad"
                      maxLength={4}
                      onFocus={() => {
                        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
                      }}
                      placeholder="0000"
                      placeholderTextColor="#938ea4"
                      className="flex-1 bg-white border border-purple-x11-200 rounded-xl px-4 h-12 text-center text-velvet-orchid-900 font-black text-lg tracking-[6px]"
                    />
                    <Pressable
                      disabled={confirmandoCodigo}
                      onPress={confirmarCodigo}
                      className={`px-5 h-12 rounded-xl items-center justify-center ${confirmandoCodigo ? "bg-purple-x11-300" : "bg-purple-x11-700"}`}
                    >
                      <Text className="text-white font-black">{confirmandoCodigo ? "..." : "Confirmar"}</Text>
                    </Pressable>
                  </View>
                  {!!codigoFeedback && <Text className="text-velvet-orchid-900 text-sm mt-3">{codigoFeedback}</Text>}
                </View>
              )}

            </View>
          )}

          {papel && !ride.realizado && ride.statusCarona === "EM_ANDAMENTO" && (
            <Pressable
              className="bg-purple-x11-700 h-16 rounded-2xl items-center justify-center shadow-lg active:scale-[0.97] flex-row mb-8"
              onPress={() => router.push({ pathname: "/ride-tracking/[id]", params: { id: String(id) } } as any)}
            >
              <Navigation size={20} color="white" />
              <Text className="text-white font-black text-lg ml-2">Acompanhar carona</Text>
            </Pressable>
          )}

          {/* CHAT DA RESERVA DO PASSAGEIRO */}
          {papel === "PASSAGEIRO" && (
            <View className="mb-6 bg-platinum-50 p-4 rounded-2xl border border-purple-x11-100">
              <Text className="text-velvet-orchid-900 font-bold">Sua reserva</Text>
              <ChatButton idReserva={minhaCaronaData?.idReserva} idCarona={Number(id)} nome={ride.nome} />
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
                            {pedido.foto ? <Image source={{ uri: pedido.foto }} className="w-full h-full" /> : <User size={24} color="#7b4d91" />}
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
                        <View className={`px-3 py-2 rounded-2xl ${pedido.statusPedido === "ACEITO" ? "bg-green-100" : "bg-red-100"}`}>
                          <Text className={`text-[10px] font-black uppercase tracking-wide ${ pedido.statusPedido === "ACEITO" ? "text-green-800" : "text-red-600" }`}>
                            {pedido.statusPedido}
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
