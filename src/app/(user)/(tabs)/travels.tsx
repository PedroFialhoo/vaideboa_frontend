import "@/global.css";
import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useRouter } from "expo-router";
import { Calendar as CalendarIcon, ArrowUpDown, Car, ChevronDown, ChevronRight, Clock, Filter, MapPin, Users, X, CircleDot } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Platform, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface Ride {
  id: number;
  data: string;
  hora: string;
  papel: "MOTORISTA" | "PASSAGEIRO";
  origemTexto: string;
  destinoTexto: string;
  realizada: boolean;
  paradas?: Array<{
    latPonto: number;
    lonPonto: number;
    indexOrder: number;
    textoPonto?: string;
  }>;
}

export default function MyTravels() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [filterRole, setFilterRole] = useState<"TODOS" | "MOTORISTA" | "PASSAGEIRO">("TODOS");
  const [filterStatus, setFilterStatus] = useState<"TODOS" | "PENDENTES" | "REALIZADAS">("TODOS");
  const [sortOrder, setSortOrder] = useState<"recente" | "antiga">("recente");
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

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
    setShowCalendar(false);
    if (selectedDate) setFilterDate(selectedDate);
  };

  const filteredRides = rides.filter(ride => {
    const matchesRole = filterRole === "TODOS" || ride.papel === filterRole;
    const matchesStatus = filterStatus === "TODOS" ||
      (filterStatus === "PENDENTES" && !ride.realizada) ||
      (filterStatus === "REALIZADAS" && ride.realizada);
    
    let matchesDate = true;
    if (filterDate) {
      const formattedFilterDate = filterDate.toISOString().split('T')[0];
      matchesDate = ride.data === formattedFilterDate;
    }
    
    return matchesRole && matchesStatus && matchesDate;
  }).sort((a, b) => {
    const dateCompare = b.data.localeCompare(a.data) || b.hora.localeCompare(a.hora);
    return sortOrder === "recente" ? dateCompare : -dateCompare;
  });

  return (
    <View className="flex-1 bg-vintage-grape-200">
      <View className="bg-velvet-orchid-900 pt-16 pb-12 px-8 rounded-b-[40px] shadow-xl">
        <Text className="text-white font-black text-3xl">Minhas Viagens</Text>
        <Text className="text-purple-x11-200 text-sm font-medium mt-1">Filtre e gerencie seu histórico</Text>
      </View>

      {/* Card de Filtros */}
      <View className="px-6 -mt-6">
        <View className="bg-vintage-grape-50 rounded-3xl p-4 border border-purple-x11-100 shadow-md">
          <TouchableOpacity
            onPress={() => setFiltersOpen(!filtersOpen)}
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <Filter size={14} color="#7b4d91" />
              <Text className="text-velvet-orchid-900 font-bold text-xs ml-1.5">Filtros</Text>
            </View>
            <ChevronDown size={16} color="#7b4d91" style={{ transform: [{ rotate: filtersOpen ? '180deg' : '0deg' }] }} />
          </TouchableOpacity>

          {filtersOpen && (
            <View className="mt-3">
              <Text className="text-velvet-orchid-700 font-semibold text-[10px] uppercase tracking-wider mb-2">Papel</Text>
              <View className="flex-row gap-2 mb-3">
                <FilterButton label="Todas" active={filterRole === "TODOS"} onPress={() => setFilterRole("TODOS")} />
                <FilterButton label="Motorista" active={filterRole === "MOTORISTA"} onPress={() => setFilterRole("MOTORISTA")} icon={<Car size={14} color={filterRole === "MOTORISTA" ? "white" : "#7b4d91"} />} />
                <FilterButton label="Passageiro" active={filterRole === "PASSAGEIRO"} onPress={() => setFilterRole("PASSAGEIRO")} icon={<Users size={14} color={filterRole === "PASSAGEIRO" ? "white" : "#7b4d91"} />} />
              </View>

              <Text className="text-velvet-orchid-700 font-semibold text-[10px] uppercase tracking-wider mb-2">Status</Text>
              <View className="flex-row gap-2 mb-3">
                <FilterButton label="Pendentes" active={filterStatus === "PENDENTES"} onPress={() => setFilterStatus(filterStatus === "PENDENTES" ? "TODOS" : "PENDENTES")} />
                <FilterButton label="Realizadas" active={filterStatus === "REALIZADAS"} onPress={() => setFilterStatus(filterStatus === "REALIZADAS" ? "TODOS" : "REALIZADAS")} />
              </View>

              <Text className="text-velvet-orchid-700 font-semibold text-[10px] uppercase tracking-wider mb-2">Data</Text>
              <View className="flex-row gap-2 mb-3">
                <TouchableOpacity
                  onPress={() => setShowCalendar(true)}
                  className={`flex-row items-center px-4 py-2 rounded-full shadow-sm ${filterDate ? 'bg-velvet-orchid-700' : 'bg-vintage-grape-200 border border-purple-x11-100'}`}
                >
                  <CalendarIcon size={14} color={filterDate ? "white" : "#7b4d91"} />
                  <Text className={`font-bold text-xs ml-1.5 ${filterDate ? 'text-white' : 'text-velvet-orchid-700'}`}>
                    {filterDate ? filterDate.toLocaleDateString('pt-BR') : "Escolher data"}
                  </Text>
                  {filterDate && (
                    <TouchableOpacity onPress={() => setFilterDate(null)} className="ml-2 bg-white/20 rounded-full p-0.5">
                      <X size={12} color="white" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>

              <Text className="text-velvet-orchid-700 font-semibold text-[10px] uppercase tracking-wider mb-2">Ordenar</Text>
              <View className="flex-row gap-2">
                <FilterButton label="Mais recente" active={sortOrder === "recente"} onPress={() => setSortOrder("recente")} icon={<ArrowUpDown size={14} color={sortOrder === "recente" ? "white" : "#7b4d91"} />} />
                <FilterButton label="Mais antiga" active={sortOrder === "antiga"} onPress={() => setSortOrder("antiga")} icon={<ArrowUpDown size={14} color={sortOrder === "antiga" ? "white" : "#7b4d91"} />} />
              </View>
            </View>
          )}
        </View>
      </View>

      {showCalendar && (
        <DateTimePicker
          value={filterDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "compact" : "default"}
          locale="pt-BR"
          themeVariant="light"
          accentColor="#7b4d91"
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
                <View className="flex-row items-center gap-2">
                  <View className={`px-3 py-1 rounded-full ${ride.papel === "MOTORISTA" ? "bg-velvet-orchid-700" : "bg-blue-600"}`}>
                    <Text className="font-black text-[10px] uppercase text-white">{ride.papel}</Text>
                  </View>
                  <View className={`px-3 py-1 rounded-full ${ride.realizada ? "bg-emerald-500" : "bg-amber-400"}`}>
                    <Text className="font-black text-[10px] uppercase text-white">{ride.realizada ? "Realizada" : "Pendente"}</Text>
                  </View>
                </View>
                <Text className="text-velvet-orchid-900 font-bold text-[10px] bg-platinum/50 px-3 py-1 rounded-full">
                  {ride.data.split('-').reverse().join('/')}
                </Text>
              </View>

              <View className="flex-row mb-4">
                <View className="items-center mr-3">
                  <View className="w-5 h-5 rounded-full bg-purple-x11-100 items-center justify-center border border-purple-x11-200">
                    <View className="w-2 h-2 rounded-full bg-purple-x11-600" />
                  </View>
                  <View className="w-[1px] h-2 bg-purple-x11-100 my-1" />

                  {ride.paradas && ride.paradas.length > 0 && (
                    <>
                      <View className="w-5 h-5 rounded-full bg-purple-x11-500 items-center justify-center border border-purple-x11-200">
                        <CircleDot size={10} color="white" />
                      </View>
                      <View className="w-[1px] h-2 bg-purple-x11-100 my-1" />
                    </>
                  )}

                  <View className="w-5 h-5 rounded-full bg-velvet-orchid-700 items-center justify-center shadow-sm">
                    <MapPin size={12} color="white" />
                  </View>
                </View>
                <View className="flex-1 justify-between">
                  <Text className="text-velvet-orchid-900 font-bold text-sm" numberOfLines={1}>{ride.origemTexto}</Text>
                  {ride.paradas && ride.paradas.length > 0 && (
                    <View className="flex-row items-center my-1">
                      <Text className="text-purple-x11-500 text-[11px] font-bold">{ride.paradas.length} parada{ride.paradas.length > 1 ? 's' : ''}</Text>
                    </View>
                  )}
                  <Text className="text-velvet-orchid-900 font-bold text-sm" numberOfLines={1}>{ride.destinoTexto}</Text>
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
      className={`flex-row items-center px-4 py-2 rounded-full shadow-sm ${active ? 'bg-velvet-orchid-700' : 'bg-vintage-grape-200 border border-purple-x11-100'}`}
    >
      {icon && <View className="mr-1.5">{icon}</View>}
      <Text className={`font-bold text-xs ${active ? 'text-white' : 'text-velvet-orchid-700'}`}>{label}</Text>
    </TouchableOpacity>
  );
}