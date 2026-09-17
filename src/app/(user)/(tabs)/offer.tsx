import { View, Text, TouchableOpacity, KeyboardAvoidingView, ScrollView, ActivityIndicator } from "react-native";
import { ChevronLeft, ChevronRight, MapPin, ArrowRight, PencilLine, CircleDot, Car } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import Destination from "@/components/offer/destination";
import Origin from "@/components/offer/origin";
import Stops, { StopType } from "@/components/offer/stops";
import RideForm from "@/components/offer/ride-form";
import "@/global.css";
import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router/react-navigation";

type Vehicle = {
  id: number;
  marca: string;
  modelo: string;
  cor: string;
  placa: string;
  ano: number;
  vagas: number;
};

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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const router = useRouter()

  const loadVehicles = useCallback(async () => {
    setLoadingVehicles(true);
    try {
      const token = await getToken();
      const response = await api.get<Vehicle[]>("/carro/meus", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVehicles(response.data);
      setSelectedVehicleId((current) => response.data.some((vehicle) => vehicle.id === current) ? current : response.data[0]?.id ?? null);
    } catch {
      setVehicles([]);
      setSelectedVehicleId(null);
    } finally {
      setLoadingVehicles(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadVehicles();
  }, [loadVehicles]));

  useEffect(() => {
    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);
    if (selectedVehicle && seats > selectedVehicle.vagas) {
      setSeats(selectedVehicle.vagas);
    }
  }, [selectedVehicleId, seats, vehicles]);

  function handleNext() {
    if (step === 1 && !origin) return;
    if (step === 2 && !destination) return;
    setStep(step + 1);
  }

  const canGoNext = (step === 1 && origin) || (step === 2 && destination) || step === 3;

  const createRide = () => {
    setMessageError("")
    if (!destination || !origin || !date || !time || !selectedVehicleId) {
      setMessageError(selectedVehicleId ? "Todas as informações são obrigatórias!" : "Selecione um veículo para oferecer a carona.")
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
          idCarro: selectedVehicleId,
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
              vehicleSection={
                <View className="mx-6 mb-4 mt-3 bg-white rounded-3xl p-5 border border-purple-x11-100">
                  <View className="flex-row items-center gap-2 mb-3"><Car size={19} color="#7b4d91" /><Text className="font-black text-velvet-orchid-900">Veículo da carona</Text></View>
                  {loadingVehicles ? <ActivityIndicator color="#7b4d91" /> : vehicles.length === 0 ? (
                    <TouchableOpacity onPress={() => router.push("/profile/vehicles" as any)} className="bg-purple-x11-50 rounded-xl p-3">
                      <Text className="text-velvet-orchid-900 font-bold text-center">Cadastre um veículo para continuar</Text>
                    </TouchableOpacity>
                  ) : (
                    <View className="gap-2">
                      {vehicles.map((vehicle) => {
                        const selected = vehicle.id === selectedVehicleId;
                        return <TouchableOpacity key={vehicle.id} onPress={() => setSelectedVehicleId(vehicle.id)} className={`rounded-xl border p-3 ${selected ? "bg-purple-x11-100 border-purple-x11-600" : "bg-white border-platinum"}`}>
                          <Text className="font-bold text-velvet-orchid-900">{vehicle.marca} {vehicle.modelo} · {vehicle.ano}</Text>
                          <Text className="text-xs text-gray-500">{vehicle.cor} · {vehicle.placa} · até {vehicle.vagas} vagas</Text>
                        </TouchableOpacity>;
                      })}
                    </View>
                  )}
                </View>
              }
              maxSeats={vehicles.find((vehicle) => vehicle.id === selectedVehicleId)?.vagas ?? 6}
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
