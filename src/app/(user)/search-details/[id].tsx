import { View, Text, ScrollView, TouchableOpacity, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MapView, { Marker, Polyline } from "react-native-maps";
import { 
  MapPin, 
  Navigation, 
  Calendar, 
  Clock, 
  Users, 
  ChevronLeft, 
  User,
  ShieldCheck,
  TrendingUp
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { api } from "@/src/services/api";
import "@/global.css";
import { getToken } from "@/src/services/storage";

type Ride = {
  data: string;
  destinoTexto: string;
  distancia: number;
  duracao: number;
  genero: string;
  hora: string;
  idCarona: string;
  latDestino: number;
  latSaida: number;
  lonDestino: number;
  lonSaida: number;
  nome: string;
  qntAssentos: number;
  realizado: boolean;
  saidaTexto: string;
  vagasDisponiveis: number;
};

export default function SearchDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [ride, setRide] = useState<Ride | null>(null);

   useEffect(() => {
        if (!id) return;
        console.log("Buscando detalhes da carona com ID:", id);
        getToken().then(token => {
        api.get(`/carona/buscar/${id}`, {
            headers: {
            Authorization: `Bearer ${token}`,
            },
        })
        .then(response => {
            setRide(response.data);
        })
        .catch(error => {
            console.log("Erro ao buscar carona:", error);
        });
        });
    }, [id]);


  if (!ride) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
  <View className="flex-1 bg-platinum">
    {/* Botão de Voltar Minimalista */}
    <TouchableOpacity 
      onPress={() => router.back()}
      className="absolute top-12 left-6 z-20 bg-white/90 p-2 rounded-xl shadow-md"
    >
      <ChevronLeft size={24} color="#391f47" />
    </TouchableOpacity>

    <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} className="bg-platinum">
      {/* Mapa com Zoom Aproximado */}
      <View className="h-80 w-full">
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: (ride.latSaida + ride.latDestino) / 2,
            longitude: (ride.lonSaida + ride.lonDestino) / 2,
            // Valores menores para zoom mais próximo
            latitudeDelta: Math.abs(ride.latSaida - ride.latDestino) * 1.2,
            longitudeDelta: Math.abs(ride.lonSaida - ride.lonDestino) * 1.2,
          }}
          scrollEnabled={true}
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
        </MapView>
      </View>

      {/* Conteúdo Detalhado */}
      <View className="flex-1 bg-white -mt-12 rounded-t-[45px] px-8 pt-8 shadow-2xl">
        
        {/* Motorista e Vagas */}
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-row items-center">
            <View className="bg-purple-x11-100 p-3 rounded-2xl mr-4">
              <User size={28} color="#7b4d91" />
            </View>
            <View>
              <Text className="text-velvet-orchid-900 font-black text-xl">{ride.nome}</Text>
              <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Motorista</Text>
            </View>
          </View>
          <View className="bg-purple-x11-50 px-4 py-2 rounded-2xl border border-purple-x11-100">
            <Text className="text-purple-x11-700 font-black">{ride.vagasDisponiveis} vagas</Text>
          </View>
        </View>

        {/* Info Grid (Data/Hora/Distância) */}
        <View className="flex-row justify-between mb-8">
          <View className="items-center bg-platinum/30 flex-1 p-3 rounded-2xl mr-2">
            <Calendar size={20} color="#7b4d91" />
            <Text className="text-velvet-orchid-900 font-bold text-sm mt-1">{ride.data.split('-').reverse().join('/')}</Text>
          </View>
          <View className="items-center bg-platinum/30 flex-1 p-3 rounded-2xl mr-2">
            <Clock size={20} color="#7b4d91" />
            <Text className="text-velvet-orchid-900 font-bold text-sm mt-1">{ride.hora}</Text>
          </View>
          <View className="items-center bg-platinum/30 flex-1 p-3 rounded-2xl">
            <Navigation size={20} color="#7b4d91" />
            <Text className="text-velvet-orchid-900 font-bold text-sm mt-1">{ride.distancia}km</Text>
          </View>
        </View>

        {/* Endereços Resumidos */}
        <View className="space-y-4 mb-10">
          <View className="flex-row items-start">
            <View className="w-2 h-2 rounded-full bg-purple-x11-400 mt-2 mr-3" />
            <View className="flex-1">
              <Text className="text-gray-400 text-sm font-bold uppercase">Saída</Text>
              <Text className="text-velvet-orchid-900 font-medium" numberOfLines={2}>{ride.saidaTexto}</Text>
            </View>
          </View>
          <View className="h-6 w-[1px] bg-platinum ml-[3.5px]" />
          <View className="flex-row items-start">
            <View className="w-2 h-2 rounded-full bg-velvet-orchid-700 mt-2 mr-3" />
            <View className="flex-1">
              <Text className="text-gray-400 text-sm font-bold uppercase">Destino</Text>
              <Text className="text-velvet-orchid-900 font-medium" numberOfLines={2}>{ride.destinoTexto}</Text>
            </View>
          </View>
        </View>

        <Pressable 
          className="bg-velvet-orchid-700 h-16 rounded-2xl items-center justify-center shadow-lg active:scale-[0.97] mb-8"
        >
          <Text className="text-white font-black text-lg">Solicitar agora</Text>
        </Pressable>
      </View>
    </ScrollView>
  </View>
);
}