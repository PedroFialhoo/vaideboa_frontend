import { View, Text, TouchableOpacity, KeyboardAvoidingView, ScrollView } from "react-native";
import { ChevronLeft, ChevronRight, MapPin, ArrowRight, PencilLine, CircleDot } from "lucide-react-native";
import { useState } from "react";
import Destination from "@/components/offer/destination";
import Origin from "@/components/offer/origin";
import Stops, { StopType } from "@/components/offer/stops";
import RideForm from "@/components/offer/ride-form";
import "@/global.css";
import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";
import { useRouter } from "expo-router";

export default function Offer() {
  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [seats, setSeats] = useState(3);
  const [stops, setStops] = useState<StopType[]>([]);
  const [messageError, setMessageError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function handleNext() {
    if (step === 1 && !origin) return;
    if (step === 2 && !destination) return;
    setStep(step + 1);
  }

  const canGoNext = (step === 1 && origin) || (step === 2 && destination) || step === 3;

  const createRide = () => {
    setMessageError("")
    if (!destination || !origin || !date || !time) {
      setMessageError("Todas as informações são obrigatórias!")
      return;
    }

    setLoading(true)
    getToken().then(token => {
      const dataObj = new Date(date);
      const timeObj = new Date(time);

      const dataFormatada = dataObj.toISOString().split("T")[0];
      const horaFormatada = timeObj.toTimeString().split(" ")[0];

      api.post(
        "/carona/cadastrar",
        {
          qntAssentos: seats,
          data: dataFormatada,
          hora: horaFormatada,
          saidaLat: origin.latitude,
          saidaLng: origin.longitude,
          destinoLat: destination.latitude,
          destinoLng: destination.longitude,
          paradas: stops.map((stop, index) => ({
            indexOrder: index,
            latitude: stop.latitude,
            longitude: stop.longitude,
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then(response => {
        router.push({
          pathname: "/page-sucess",
          params: {
            sucess: "true",
            message: "Carona criada com sucesso!",
            to: "/travels"
          }
        })        
      })
      .catch(error => {
        setMessageError("Erro ao criar carona!")
      })
      .finally(() => setLoading(false));
    });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
    >
    <View className="flex-1 bg-platinum">

      <View className="pt-8 pb-4 px-6 bg-velvet-orchid-900 flex-row items-center justify-between shadow-md z-20">
        <View className="w-10">
          {step > 1 && (
            <TouchableOpacity onPress={() => setStep(step - 1)} className="p-2 -ml-2">
              <ChevronLeft size={28} color="#cc66ff" />
            </TouchableOpacity>
          )}
        </View>

        <Text className="font-black text-platinum-50 text-lg">Oferecer Carona</Text>

        <View className="w-10 items-end">
          {step < 4 && (
            <TouchableOpacity onPress={handleNext} disabled={!canGoNext} className={`p-2 -mr-2 ${!canGoNext ? "opacity-30" : ""}`}>
              <ChevronRight size={28} color="#cc66ff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="flex-1">
        {step === 1 && <Origin origin={origin} setOrigin={setOrigin} next={handleNext} />}
        {step === 2 && <Destination origin={origin} destination={destination} setDestination={setDestination} next={handleNext} showRouteInfo />}
        {step === 3 && <Stops origin={origin!} destination={destination!} stops={stops} setStops={setStops} next={handleNext} />}
        {step === 4 && (
          <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
            <View className="mx-6 mt-6 p-5 bg-white rounded-3xl shadow-sm border border-purple-x11-100 relative">
              <TouchableOpacity 
                onPress={() => setStep(1)}
                className="absolute top-4 right-4 bg-purple-x11-50 p-2 rounded-full"
              >
                <PencilLine size={18} color="#7b4d91" />
              </TouchableOpacity>

              <View className="flex-row items-center mb-3">
                <View className="w-7 h-7 bg-purple-x11-100 rounded-full items-center justify-center mr-3">
                  <MapPin size={14} color="#7b4d91" />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Partida</Text>
                  <Text className="text-velvet-orchid-900 font-bold text-sm" numberOfLines={1}>
                    {origin?.address || "Localização selecionada"}
                  </Text>
                </View>
              </View>

              <View className="h-[1px] bg-platinum ml-10 mb-3" />

              {stops.length > 0 && (
                <>
                  {stops.map((stop, index) => (
                    <View key={`stop-summary-${index}`}>
                      <View className="flex-row items-center mb-3">
                        <View className="w-7 h-7 bg-purple-x11-100 rounded-full items-center justify-center mr-3">
                          <CircleDot size={14} color="#7b4d91" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Parada {index + 1}</Text>
                          <Text className="text-velvet-orchid-900 font-bold text-sm" numberOfLines={1}>
                            {stop.address || "Local no mapa"}
                          </Text>
                        </View>
                      </View>
                      <View className="h-[1px] bg-platinum ml-10 mb-3" />
                    </View>
                  ))}
                </>
              )}

              <View className="flex-row items-center">
                <View className="w-7 h-7 bg-velvet-orchid-100 rounded-full items-center justify-center mr-3">
                  <ArrowRight size={14} color="#391f47" />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Destino</Text>
                  <Text className="text-velvet-orchid-900 font-bold text-sm" numberOfLines={1}>
                    {destination?.address || "Destino selecionado"}
                  </Text>
                </View>
              </View>
            </View>

            <RideForm
              date={date}
              setDate={setDate}
              time={time}
              setTime={setTime}
              price={price}
              setPrice={setPrice}
              seats={seats}
              setSeats={setSeats}
              createRide={createRide}
              messageError={messageError}
              loading={loading}
            />
          </ScrollView>
        )}
      </View>
    </View>
    </KeyboardAvoidingView>
  );
}