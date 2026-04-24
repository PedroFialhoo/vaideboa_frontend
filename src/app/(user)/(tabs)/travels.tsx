import "@/global.css";
import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useRouter } from "expo-router";
import { Calendar as CalendarIcon, Car, ChevronRight, Clock, Filter, MapPin, Users, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Platform, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface Ride {
  id: number;
  data: string;
  hora: string;
  papel: "MOTORISTA" | "PASSAGEIRO";
  origemTexto: string;
  destinoTexto: string;
}

export default function MyTravels() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [filterRole, setFilterRole] = useState<"TODOS" | "MOTORISTA" | "PASSAGEIRO">("TODOS");
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const router = useRouter();

  const fetchRides = () => {
    getToken()
      .then(token => api.get("/carona/minhas", { headers: { Authorization: `Bearer ${token}` } }))
      .then(response => setRides(response.data))
      .catch(error => console.error(error))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useFocusEffect(useCallback(() => { fetchRides(); }, []));

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowCalendar(Platform.OS === 'ios');
    if (selectedDate) setFilterDate(selectedDate);
  };

  const filteredRides = rides.filter(ride => {
    const matchesRole = filterRole === "TODOS" || ride.papel === filterRole;
    
    let matchesDate = true;
    if (filterDate) {
      const formattedFilterDate = filterDate.toISOString().split('T')[0];
      matchesDate = ride.data === formattedFilterDate;
    }
    
    return matchesRole && matchesDate;
  });

  return (
    <View className="flex-1 bg-platinum">
      <View className="bg-velvet-orchid-900 pt-16 pb-12 px-8 rounded-b-[40px] shadow-xl">
        <Text className="text-white font-black text-3xl">Minhas Viagens</Text>
        <Text className="text-purple-x11-200 text-sm font-medium mt-1">Filtre e gerencie seu histórico</Text>
      </View>

      {/* Barra de Filtros */}
      <View className="px-6 -mt-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-2">
          
          {/* Filtro de Papel */}
          <FilterButton 
            label="Todas" 
            active={filterRole === "TODOS"} 
            onPress={() => setFilterRole("TODOS")} 
          />
          <FilterButton 
            label="Motorista" 
            active={filterRole === "MOTORISTA"} 
            onPress={() => setFilterRole("MOTORISTA")} 
            icon={<Car size={14} color={filterRole === "MOTORISTA" ? "white" : "#7b4d91"} />}
          />
          <FilterButton 
            label="Passageiro" 
            active={filterRole === "PASSAGEIRO"} 
            onPress={() => setFilterRole("PASSAGEIRO")} 
            icon={<Users size={14} color={filterRole === "PASSAGEIRO" ? "white" : "#7b4d91"} />}
          />          
        </ScrollView>
        <View className="flex-row py-2">
            <TouchableOpacity 
            onPress={() => setShowCalendar(true)}
            className={`flex-row items-center px-4 py-2 rounded-full shadow-sm ${filterDate ? 'bg-velvet-orchid-700' : 'bg-white border border-purple-x11-100'}`}
          >
            <CalendarIcon size={14} color={filterDate ? "white" : "#7b4d91"} className="mr-2" />
            <Text className={`font-bold text-xs ${filterDate ? 'text-white' : 'text-velvet-orchid-700'}`}>
              {filterDate ? filterDate.toLocaleDateString('pt-BR') : "Escolher data"}
            </Text>
            {filterDate && (
              <TouchableOpacity onPress={() => setFilterDate(null)} className="ml-2 bg-white/20 rounded-full p-0.5">
                <X size={12} color="white" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {showCalendar && (
        <DateTimePicker
          value={filterDate || new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      <ScrollView 
        className="flex-1 px-6 mt-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRides(); }} tintColor="#7b4d91" />}
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#7b4d91" className="mt-20" />
        ) : filteredRides.length === 0 ? (
          <View className="items-center justify-center mt-20">
            <Filter size={48} color="#d1d5db" />
            <Text className="text-gray-400 font-bold mt-4 text-center">
              Nenhuma carona encontrada{"\n"}para os filtros selecionados.
            </Text>
          </View>
        ) : (
          filteredRides.map((ride) => (
            <TouchableOpacity
              key={ride.id}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: "/ride-details/[id]", params: { id: ride.id } } as any)}
              className="bg-white rounded-[32px] p-5 mb-4 border border-purple-x11-100 shadow-sm"
            >
              <View className="flex-row justify-between items-center mb-4">
                <View className={`px-3 py-1 rounded-full ${ride.papel === "MOTORISTA" ? "bg-velvet-orchid-700" : "bg-blue-600"}`}>
                  <Text className="font-black text-[10px] uppercase text-white">{ride.papel}</Text>
                </View>
                <Text className="text-velvet-orchid-900 font-bold text-[10px] bg-platinum/50 px-3 py-1 rounded-full">
                  {ride.data.split('-').reverse().join('/')}
                </Text>
              </View>

              <View className="flex-row mb-4">
                <View className="items-center mr-3">
                  <View className="w-2 h-2 rounded-full bg-purple-x11-400" />
                  <View className="w-[1px] h-8 bg-purple-x11-100 my-1" />
                  <MapPin size={12} color="#7b4d91" />
                </View>
                <View className="flex-1 justify-between">
                  <Text className="text-velvet-orchid-900 font-bold text-xs" numberOfLines={1}>{ride.origemTexto}</Text>
                  <Text className="text-velvet-orchid-900 font-bold text-xs" numberOfLines={1}>{ride.destinoTexto}</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between pt-4 border-t border-platinum">
                <View className="flex-row items-center">
                  <Clock size={16} color="#7b4d91" />
                  <Text className="text-velvet-orchid-700 font-black ml-1">{ride.hora.substring(0, 5)}</Text>
                </View>
                <ChevronRight size={16} color="#7b4d91" />
              </View>
            </TouchableOpacity>
          ))
        )}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}

function FilterButton({ label, active, onPress, icon }: any) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className={`flex-row items-center px-4 py-2 rounded-full mr-2 shadow-sm ${active ? 'bg-velvet-orchid-700' : 'bg-white border border-purple-x11-100'}`}
    >
      {icon && <View className="mr-2">{icon}</View>}
      <Text className={`font-bold text-xs ${active ? 'text-white' : 'text-velvet-orchid-700'}`}>{label}</Text>
    </TouchableOpacity>
  );
}