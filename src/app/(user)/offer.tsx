import { View, Text, TouchableOpacity } from "react-native";
import { ChevronLeft, ChevronRight, MapPin, ArrowRight, PencilLine } from "lucide-react-native";
import { useState } from "react";
import Destination from "@/components/offer/destination";
import Origin from "@/components/offer/origin";
import RideForm from "@/components/offer/ride-form";
import "@/global.css";
import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";

export default function Offer() {
  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [seats, setSeats] = useState(1);

  function handleNext() {
    if (step === 1 && !origin) return;
    if (step === 2 && !destination) return;
    setStep(step + 1);
  }

  const canGoNext = (step === 1 && origin) || (step === 2 && destination);

  const createRide = () => {
    console.log("clicou criar ride");

    if (!destination || !origin || !date || !time) {
      console.log("faltando dados");
      return;
    }

    getToken().then(token => {
      const dataObj = new Date(date);
      const timeObj = new Date(time);

      const dataFormatada = dataObj.toISOString().split("T")[0]; // yyyy-MM-dd
      const horaFormatada = timeObj.toTimeString().split(" ")[0]; // HH:mm:ss

      console.log("Dados para criar carona:", {
        qntAssentos: seats,
        data: dataFormatada,
        hora: horaFormatada,
        saidaLat: origin.latitude,
        saidaLng: origin.longitude,
        destinoLat: destination.latitude,
        destinoLng: destination.longitude,
      });

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
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then(response => {
        console.log("Carona criada com sucesso:", response.data);
      })
      .catch(error => {
        console.error("Erro ao criar carona:", error);
      });
    });
  }

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

        <Text className="font-black text-platinum-50 text-lg">Oferecer Carona</Text>

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
            <View className="mx-6 mt-6 p-5 bg-white rounded-3xl shadow-sm border border-purple-x11-100 relative">
              <TouchableOpacity 
                onPress={() => setStep(1)}
                className="absolute top-4 right-4 bg-purple-x11-50 p-2 rounded-full"
              >
                <PencilLine size={18} color="#7b4d91" />
              </TouchableOpacity>

              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-purple-x11-100 rounded-full items-center justify-center mr-3">
                  <MapPin size={16} color="#7b4d91" />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Partida</Text>
                  <Text className="text-velvet-orchid-900 font-bold text-sm" numberOfLines={1}>
                    {origin?.address || "Localização selecionada"}
                  </Text>
                </View>
              </View>

              <View className="h-[1px] bg-platinum ml-11 mb-4" />

              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-velvet-orchid-100 rounded-full items-center justify-center mr-3">
                  <ArrowRight size={16} color="#391f47" />
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
            />
          </View>
        )}
      </View>
    </View>
  );
}