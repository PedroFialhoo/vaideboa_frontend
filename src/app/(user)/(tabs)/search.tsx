import Destination from "@/components/offer/destination";
import Origin from "@/components/offer/origin";
import SearchForm from "@/components/search/search-form";
import "@/global.css";
import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";
import { getCurrentPositionAsync, LocationObject, requestForegroundPermissionsAsync } from "expo-location";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Clock, User } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";

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
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
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

      console.log("Payload enviado:", payload);

      api.post("/reserva/buscar", payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        console.log("Resposta da API:", response.data);

        setRides(response.data);

        if (response.data.length === 0) {
          setMessageError("Nenhuma carona encontrada para este trajeto.");
        }
      })
      .catch((error) => {
        console.error("Erro completo:", error.response?.data);
        setMessageError("Erro ao buscar caronas.");
      })
      .finally(() => {
        setLoading(false);
      });

    });
  };


  return (
    <View className="flex-1 bg-platinum">
      <View className="pt-12 pb-4 px-6 bg-velvet-orchid-900 flex-row items-center justify-between shadow-md z-20">
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
      
      <View className="flex-1 p-3">
        
        {step === 1 && <Origin origin={origin} setOrigin={setOrigin} next={handleNext} />}
        {step === 2 && <Destination origin={origin} destination={destination} setDestination={setDestination} next={handleNext} />}   
        {step === 3 && <SearchForm date={date} showDatePicker={showDatePicker} showTimePicker={showTimePicker} setShowDatePicker={setShowDatePicker} setShowTimePicker={setShowTimePicker} onDateChange={onDateChange} onTimeChange={onTimeChange} searchTravels={searchTravels} loading={loading} origin={origin} destination={destination} messageError={messageError} />}        
        
        {/* LISTA DE RESULTADOS */}
        {(rides.length > 0 && step === 3) && (
          <View className="mt-8 mb-10">
            <Text className="text-velvet-orchid-900 font-black text-xl mb-4 ml-2">Caronas Disponíveis</Text>
            {rides.map((ride, index) => (
              <TouchableOpacity 
                key={index} 
                className="bg-white rounded-3xl p-5 mb-4 border border-purple-x11-100 shadow-sm flex-row items-center"
                onPress={() => router.push({ pathname: "/ride-details/[id]", params: { id: ride.idRota } } as any)}
              >
                <View className="bg-purple-x11-100 p-3 rounded-2xl mr-4">
                  <User size={24} color="#7b4d91" />
                </View>
                <View className="flex-1">
                  <Text className="text-velvet-orchid-900 font-bold text-lg">{ride.nomeMotorista}</Text>
                  <View className="flex-row items-center mt-1">
                    <Clock size={14} color="#7b4d91" />
                    <Text className="text-gray-500 text-xs ml-1 font-medium">{ride.hora.substring(0,5)} • {ride.data.split('-').reverse().join('/')}</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#7b4d91" opacity={0.5} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}