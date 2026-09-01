import Destination from "@/components/offer/destination";
import Origin from "@/components/offer/origin";
import SearchForm from "@/components/search/search-form";
import "@/global.css";
import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";
import { getCurrentPositionAsync, LocationObject, requestForegroundPermissionsAsync } from "expo-location";
import { useRouter } from "expo-router";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CircleDot, Clock, MapPin, ShieldCheck, User } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function Search() {
  const [destination, setDestination] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageError, setMessageError] = useState("");

  const originRef = useRef<any>(null);
  const destinationRef = useRef<any>(null);
  const router = useRouter();

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [location, setLocation] = useState<LocationObject | null>(null);
  
  const [step, setStep] = useState(1);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    setShowForm(true);
  }, [step]);

  async function requestLocationPermission() {
    const { granted } = await requestForegroundPermissionsAsync();
    if (granted) {
      const currentPosition = await getCurrentPositionAsync();
      setLocation(currentPosition);
    }
  }

  function handleNext() {
    if (step === 1 && !origin) return;
    if (step === 2 && !destination) return;
    setStep(step + 1);
  }
  
  const canGoNext = (step === 1 && origin) || (step === 2 && destination);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) setDate(selectedTime);
  };

  const searchTravels = () => {
    console.log("Buscando caronas");

    if (!destination || !origin) {
      setMessageError("Informe origem e destino!");
      return;
    }

    setLoading(true);
    setMessageError("");

    const dataFormatada = date.toISOString().split("T")[0];
    const horaFormatada = date.toTimeString().slice(0, 5);

    getToken().then((token) => {

      const payload = {
        data: dataFormatada,
        hora: horaFormatada,
        saidaLat: origin.latitude,
        saidaLon: origin.longitude,
        destinoLat: destination.latitude,
        destinoLon: destination.longitude,
      };

      api.post("/reserva/buscar", payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        console.log("Carona:", response.data);

        setRides(response.data);

        if (response.data.length === 0) {
          setMessageError("Nenhuma carona encontrada para este trajeto.");
        } else {
          setShowForm(false);
        }
      })
      .catch((error) => {
          setMessageError(error.response.data);          
        })
      .finally(() => {
        setLoading(false);
      });

    });
  };

  const getRatingColor = (rating?: number) => {
    if (!rating) return "#9CA3AF"; // cinza

    if (rating >= 4.0) return "#22C55E"; // verde
    if (rating >= 3.0) return "#EAB308"; // amarelo
    if (rating >= 2.0) return "#F97316"; // laranja

    return "#EF4444"; // vermelho
  };

  return (
    <View className="flex-1 bg-platinum">
      <View className="pt-8 pb-4 px-6 bg-velvet-orchid-900 flex-row items-center justify-between shadow-md z-20">
        <View className="w-10">
          {step > 1 && (
            <TouchableOpacity onPress={() => setStep(step - 1)} className="p-2 -ml-2">
              <ChevronLeft size={28} color="#cc66ff" />
            </TouchableOpacity>
          )}
        </View>

        <Text className="font-black text-platinum-50 text-lg">Buscar Carona</Text>

        <View className="w-10 items-end">
          {step < 3 && (
            <TouchableOpacity onPress={handleNext} disabled={!canGoNext} className={`p-2 -mr-2 ${!canGoNext ? "opacity-30" : ""}`}>
              <ChevronRight size={28} color="#cc66ff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View className="flex-1">
        
        {step === 1 && <Origin origin={origin} setOrigin={setOrigin} next={handleNext} />}
        {step === 2 && <Destination origin={origin} destination={destination} setDestination={setDestination} next={handleNext} />}   
        {step === 3 && (
          <View className="flex-1">
            <View className="px-4 pt-4">
              {showForm ? (
                <>
                  <SearchForm date={date} showDatePicker={showDatePicker} showTimePicker={showTimePicker} setShowDatePicker={setShowDatePicker} setShowTimePicker={setShowTimePicker} onDateChange={onDateChange} onTimeChange={onTimeChange} searchTravels={searchTravels} loading={loading} origin={origin} destination={destination} messageError={messageError} />

                  {rides.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setShowForm(false)}
                      className="flex-row items-center justify-center py-3 mt-1"
                    >
                      <Text className="text-purple-x11-600 font-black text-[11px] uppercase tracking-wide mr-1">
                        Ocultar filtros
                      </Text>
                      <ChevronUp size={15} color="#8800cc" />
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowForm(true)}
                  className="bg-white rounded-3xl p-4 border border-purple-x11-100 shadow-md flex-row items-center"
                >
                  <View className="flex-1 pr-3">
                    <View className="flex-row items-center">
                      <View className="w-5 h-5 rounded-full bg-purple-x11-100 items-center justify-center border border-purple-x11-200 mr-2">
                        <CircleDot size={8} color="#8800cc" />
                      </View>
                      <Text numberOfLines={1} className="text-velvet-orchid-900 font-bold text-sm">
                        {origin?.address || "Minha localização"}
                      </Text>
                    </View>
                    <View className="flex-row items-center mt-1.5">
                      <View className="w-5 h-5 rounded-full bg-velvet-orchid-700 items-center justify-center mr-2">
                        <MapPin size={9} color="white" />
                      </View>
                      <Text numberOfLines={1} className="text-velvet-orchid-900 font-bold text-sm">
                        {destination?.address || "Selecione o destino"}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <View className="bg-platinum/50 px-2.5 py-1 rounded-full mb-2">
                      <Text className="text-velvet-orchid-900 font-black text-[11px]">
                        {date.toLocaleDateString("pt-BR")} •{" "}
                        {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-purple-x11-600 font-black text-[11px] uppercase tracking-wide mr-1">
                        Abrir filtros
                      </Text>
                      <ChevronDown size={15} color="#8800cc" />
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* LISTA DE RESULTADOS */}
            {(rides.length > 0) && (
              <ScrollView className="flex-1 mt-5 px-2" showsVerticalScrollIndicator={false}>
                <Text className="text-velvet-orchid-900 font-black text-xl mb-4 ml-2">Caronas Disponíveis</Text>
            {rides.map((ride, index) => (
              <TouchableOpacity 
                key={index} 
                className="bg-white rounded-[32px] p-5 mb-5 border border-purple-x11-100 shadow-hard-2 active:scale-[0.98]"
                onPress={() => router.push({ pathname: "/ride-details/[id]", params: { id: ride.idRota } } as any)}
              >
                {/* HEADER: MOTORISTA + RATING */}
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center flex-1 pr-3">
                    <View className="bg-purple-x11-100 w-12 h-12 rounded-2xl items-center justify-center mr-3">
                      <User size={24} color="#7b4d91" />
                    </View>
                    <View className="flex-1">
                      <Text numberOfLines={1} className="text-velvet-orchid-900 font-black text-lg">
                        {ride.nomeMotorista}
                      </Text>
                      {ride.avaliacaoMotorista?.numViagensMotorista != null &&
                       ride.avaliacaoMotorista.numViagensMotorista !== 0 && (
                        <View className="flex-row items-center mt-0.5">
                          <ShieldCheck size={11} color="#7b4d91" />
                          <Text className="text-gray-500 text-xs font-bold ml-1">
                            {ride.avaliacaoMotorista.numViagensMotorista} viagens realizadas
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {ride.avaliacaoMotorista?.notaMotorista != null && (
                    <View
                      className="px-2.5 py-1.5 rounded-xl flex-row items-center"
                      style={{ backgroundColor: getRatingColor(ride.avaliacaoMotorista.notaMotorista) }}
                    >
                      <Text className="text-white font-black text-sm ml-1">
                        ★ {ride.avaliacaoMotorista.notaMotorista.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* ITINERÁRIO: SAÍDA → DESTINO */}
                {(ride.saidaTexto || ride.destinoTexto || ride.origemTexto) && (
                  <View className="bg-platinum/40 rounded-[24px] p-4 mb-4 border border-purple-x11-50">
                    <View className="flex-row items-center">
                      <View className="items-center mr-4 h-16">
                        <View className="w-4 h-4 rounded-full bg-purple-x11-100 items-center justify-center border border-purple-x11-200">
                          <CircleDot size={7} color="#8800cc" />
                        </View>
                        <View className="w-[2px] flex-1 bg-purple-x11-100" />
                        <View className="w-4 h-4 rounded-full bg-velvet-orchid-700 items-center justify-center">
                          <MapPin size={8} color="white" />
                        </View>
                      </View>
                      <View className="flex-1">
                        {(ride.saidaTexto || ride.origemTexto) && (
                          <>
                            <Text className="text-purple-x11-400 text-[9px] font-black uppercase tracking-[1px] mb-1">
                              Partida
                            </Text>
                            <Text numberOfLines={1} className="text-velvet-orchid-900 font-bold text-sm">
                              {ride.saidaTexto || ride.origemTexto}
                            </Text>
                          </>
                        )}
                        {ride.destinoTexto && (
                          <>
                            <View className="h-[1px] bg-purple-x11-100 my-2" />
                            <Text className="text-purple-x11-400 text-[9px] font-black uppercase tracking-[1px] mb-1">
                              Destino
                            </Text>
                            <Text numberOfLines={1} className="text-velvet-orchid-900 font-bold text-sm">
                              {ride.destinoTexto}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                )}

                {/* RODAPÉ: HORA/DATA, PARADAS, VAGAS */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 flex-row items-center gap-3 flex-wrap pr-3">
                    <View className="flex-row items-center">
                      <Clock size={14} color="#7b4d91" />
                      <Text className="text-velvet-orchid-900 font-bold text-sm ml-1.5">
                        {ride.hora.substring(0,5)}
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <CalendarDays size={14} color="#7b4d91" />
                      <Text className="text-gray-500 font-bold text-xs ml-1.5">
                        {ride.data.split('-').reverse().join('/')}
                      </Text>
                    </View>

                    {ride.paradas && ride.paradas.length > 0 && (
                      <View className="flex-row items-center bg-purple-x11-50 px-2.5 py-1 rounded-full">
                        <CircleDot size={11} color="#8800cc" />
                        <Text className="text-purple-x11-600 text-xs font-bold ml-1">
                          {ride.paradas.length} {ride.paradas.length > 1 ? 'paradas' : 'parada'}
                        </Text>
                      </View>
                    )}

                    {ride.vagasDisponiveis != null && (
                      <View className="flex-row items-center bg-platinum/40 px-2.5 py-1 rounded-full">
                        <User size={11} color="#7b4d91" />
                        <Text className="text-velvet-orchid-900 text-xs font-bold ml-1">
                          {ride.vagasDisponiveis} vagas
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="w-9 h-9 bg-purple-x11-700 rounded-full items-center justify-center">
                    <ChevronRight size={18} color="white" />
                  </View>
                </View>
              </TouchableOpacity>
              ))}
            </ScrollView>
            )}
          </View>
        )}
      </View>
    </View>
  );
}