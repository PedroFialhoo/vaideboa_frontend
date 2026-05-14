import "@/global.css";
import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  ChevronLeft,
  Clock,
  MapPin,
  Navigation,
  User,
  Check,
  X,
  Clock3,
  ShieldCheck
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

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
  qntAssentos: number;
  realizado: boolean;
  saidaTexto: string;
  vagasDisponiveis: number;
  papel: "MOTORISTA" | "PASSAGEIRO";
};

type Pedido = {
  idPedidoCarona: number;
  nome: string;
  statusPedido: string;
  saidaTexto: string;
  destinoTexto: string;
  genero: string;
};

type Coord = {
  latitude: number;
  longitude: number;
};

export default function SearchDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [ride, setRide] = useState<Ride | null>(null);
  const [coords, setCoords] = useState<Coord[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const mapRef = useRef<MapView>(null);
  const [messageError, setMessageError] = useState("");
  const [textBtn, setTextBtn] = useState("Carregando...");
  const [filter, setFilter] = useState<"TODOS" | "ACEITOS" | "PENDENTES">("TODOS");

  useEffect(() => {
    if (!id) return;

    getToken().then((token) => {
      if (!token) return;
      api.get(`/carona/buscar/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setRide(response.data);
        api.get("/carona/minhas", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(resMinhas => {
          const caronas = resMinhas.data;
          const minhaCarona = caronas.find((carona: any) => carona.id === Number(id));
          
          if (minhaCarona) {
            if (minhaCarona.papel === "MOTORISTA") {
              setTextBtn("Marcar como realizada");
              fetchPedidos(token);
            } else {
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
    getToken().then((token) => {
      api.post("/pedido/agendar", {
        idCarona: id,
        saidaLat: ride?.latSaida,
        saidaLng: ride?.lonSaida,
        destinoLat: ride?.latDestino,
        destinoLng: ride?.lonDestino,
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

  const handleAction = () => {
    if (textBtn === "Solicitar reserva") requestRide();
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

  return (
    <View className="flex-1 bg-platinum">
      
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

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} className="bg-platinum">
        
        {/* SEÇÃO DO MAPA */}
        <View className="h-80 w-full">
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
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
            {coords.length > 0 && (
              <Polyline coordinates={coords} strokeWidth={4} strokeColor="#7b4d91" />
            )}
          </MapView>
        </View>

        {/* CARD PRINCIPAL DE DETALHES */}
        <View className="flex-1 bg-vintage-grape-50 rounded-t-[45px] -mt-10 px-8 pt-8 shadow-2xl pb-12 border border-purple-x11-900">
          
          {/* HEADER: MOTORISTA E VAGAS */}
          <View className="flex-row items-center justify-between mb-8">
            <View className="flex-row items-center flex-1">
              <View className="bg-purple-x11-100 p-3 rounded-2xl mr-4">
                <User size={28} color="#7b4d91" />
              </View>
              <View className="flex-1">
                <Text numberOfLines={1} className="text-velvet-orchid-900 font-black text-xl">{ride.nome}</Text>
                <View className="flex-row items-center">
                  <ShieldCheck size={12} color="#7b4d91" />
                  <Text className="text-gray-600 text-[10px] font-bold uppercase ml-1">Motorista</Text>
                </View>
              </View>
            </View>
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

          {/* BOTÃO DE AÇÃO PRINCIPAL */}
          <Pressable 
            className="bg-velvet-orchid-700 h-16 rounded-2xl items-center justify-center shadow-lg active:scale-[0.97] mb-8" 
            onPress={handleAction}
          >
            <Text className="text-white font-black text-lg">{textBtn}</Text>
          </Pressable>

          {/* SEÇÃO DE LISTAGEM DE PEDIDOS */}
          {textBtn === "Marcar como realizada" && (
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
                        <View className="flex-row flex-1 pr-3">
                          <View className="bg-purple-x11-100 w-14 h-14 rounded-full items-center justify-center mr-4">
                            <User size={24} color="#7b4d91" />
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
                        </View>
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
                          >
                            <X size={18} color="#ef4444" />
                            <Text className="text-red-500 font-black ml-2 text-sm">
                              RECUSAR
                            </Text>
                          </TouchableOpacity>
                        </View>
                      }
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
          {/* MENSAGEM DE ERRO/FEEDBACK */}
          {messageError && (
            <View className="mt-4 p-4 rounded-2xl border bg-red-50 border-red-200">
              <Text className="text-center font-bold text-xs text-red-700">{messageError}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}