import "@/global.css";
import {
  Calendar,
  ChevronRight,
  Clock,
  DollarSign,
  Minus,
  Plus,
  Users,
} from "lucide-react-native";
import React, { type ReactNode, useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  Pressable,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

type Props = {
  date: Date | null;
  setDate: (date: Date) => void;
  time: Date | null;
  setTime: (time: Date) => void;
  price: number | null;
  setPrice: (price: number | null) => void;
  seats: number;
  setSeats: (seats: number) => void;
  createRide: () => void;
  messageError: string;
  loading: boolean;
  vehicleSection: ReactNode;
  maxSeats: number;
  recommendation: number | null;
  recommendationLoading: boolean;
  recommendationError: string;
};

export default function RideForm({
  date,
  setDate,
  time,
  setTime,
  price,
  setPrice,
  seats,
  setSeats,
  createRide,
  messageError,
  loading,
  vehicleSection,
  maxSeats,
  recommendation,
  recommendationLoading,
  recommendationError,
}: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const MAX_SEATS = Math.min(7, maxSeats);
  const MIN_SEATS = 1;
  const MIN_PRICE = 5;

  const formatDate = (d: Date | null) => {
    if (!d) return "Selecionar";
    return d.toLocaleDateString("pt-BR");
  };

  const formatTime = (d: Date | null) => {
    if (!d) return "Selecionar";
    return d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const incrementSeats = () => {
    if (seats < MAX_SEATS) setSeats(seats + 1);
  };

  const decrementSeats = () => {
    if (seats > MIN_SEATS) setSeats(seats - 1);
  };

  const changePrice = (variation: number) => {
    const current = price ?? recommendation ?? MIN_PRICE;
    setPrice(Math.max(MIN_PRICE, Math.round(current + variation)));
  };

  const priceAssessment = (() => {
    if (price === null || recommendation === null || recommendation <= 0) return null;
    const difference = (price - recommendation) / recommendation;
    if (difference <= -0.2) return { text: "Abaixo do recomendado: pode estar barato demais.", tone: "text-velvet-orchid-700" };
    if (difference >= 0.2) return { text: "Acima do recomendado: pode estar caro demais.", tone: "text-velvet-orchid-700" };
    return { text: "Valor próximo da recomendação para esta rota.", tone: "text-ash-grey-500" };
  })();

  return (
    <>
      {vehicleSection}
      <View className="mx-6 mt-4 mb-6">
        {/* DATA E HORA */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5 ml-1">
              Data
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
              className="bg-white rounded-2xl border border-purple-x11-100 px-4 h-14 flex-row items-center"
            >
              <View className="bg-purple-x11-50 w-9 h-9 rounded-xl items-center justify-center mr-3">
                <Calendar size={18} color="#7b4d91" />
              </View>
              <Text
                className={`flex-1 font-semibold text-sm ${
                  date ? "text-velvet-orchid-900" : "text-gray-400"
                }`}
              >
                {formatDate(date)}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date || new Date()}
                mode="date"
                minimumDate={new Date()}
                onChange={(_, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}
          </View>

          <View className="flex-1">
            <Text className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5 ml-1">
              Hora
            </Text>
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
              className="bg-white rounded-2xl border border-purple-x11-100 px-4 h-14 flex-row items-center"
            >
              <View className="bg-purple-x11-50 w-9 h-9 rounded-xl items-center justify-center mr-3">
                <Clock size={18} color="#7b4d91" />
              </View>
              <Text
                className={`flex-1 font-semibold text-sm ${
                  time ? "text-velvet-orchid-900" : "text-gray-400"
                }`}
              >
                {formatTime(time)}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={time || new Date()}
                mode="time"
                onChange={(_, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) setTime(selectedTime);
                }}
              />
            )}
          </View>
        </View>

        {/* ASSENTOS */}
        <View className="mb-4">
          <Text className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5 ml-1">
            Assentos disponíveis
          </Text>
          <View className="bg-white rounded-2xl border border-purple-x11-100 p-4">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={decrementSeats}
                disabled={seats === MIN_SEATS}
              >
                <Minus size={20} />
              </TouchableOpacity>

              <View className="flex-row items-center">
                <Users size={22} />
                <Text className="text-2xl font-black ml-2">{seats}</Text>
              </View>

              <TouchableOpacity
                onPress={incrementSeats}
                disabled={seats === MAX_SEATS}
              >
                <Plus size={20} />
              </TouchableOpacity>
            </View>

            <Text className="text-center text-xs mt-2">
              Min: {MIN_SEATS} • Max: {MAX_SEATS}
            </Text>
          </View>
        </View>

        {/* PREÇO */}
        <View className="mb-5">
          <Text className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5 ml-1">
            Contribuição por pessoa (R$)
          </Text>
          <View className="bg-white rounded-2xl border border-purple-x11-100 p-4">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Diminuir contribuição"
                onPress={() => changePrice(-1)}
                disabled={(price ?? recommendation ?? MIN_PRICE) <= MIN_PRICE || recommendationLoading}
                className={(price ?? recommendation ?? MIN_PRICE) <= MIN_PRICE || recommendationLoading ? "opacity-30" : ""}
              >
                <Minus size={20} color="#391f47" />
              </TouchableOpacity>
              <View className="items-center">
                <View className="flex-row items-center">
                  <DollarSign size={22} color="#7b4d91" />
                  <Text className="text-2xl font-black text-velvet-orchid-900 ml-1">
                    {recommendationLoading ? "..." : String(price ?? MIN_PRICE)}
                  </Text>
                </View>
                <Text className="text-center text-xs text-gray-400 mt-1">por pessoa</Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Aumentar contribuição"
                onPress={() => changePrice(1)}
                disabled={recommendationLoading}
                className={recommendationLoading ? "opacity-30" : ""}
              >
                <Plus size={20} color="#391f47" />
              </TouchableOpacity>
            </View>
          </View>
          {recommendation !== null && !recommendationLoading && (
            <View className="mt-3 bg-purple-x11-50 rounded-2xl p-3">
              <Text className="text-velvet-orchid-900 text-sm font-bold">
                Recomendado: R$ {recommendation} por pessoa
              </Text>
              <Text className="text-gray-500 text-xs mt-1">Calculado para {seats + 1} pessoas, incluindo você.</Text>
              {priceAssessment && <Text className={`text-xs font-bold mt-2 ${priceAssessment.tone}`}>{priceAssessment.text}</Text>}
            </View>
          )}
          {recommendationError ? <Text accessibilityRole="alert" className="mt-2 text-red-700 text-sm">{recommendationError}</Text> : null}
        </View>

        {/* ERRO */}
        {messageError ? (
          <View className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200">
            <Text className="text-center font-bold text-xs text-red-700">
              {messageError}
            </Text>
          </View>
        ) : null}

        {/* BOTÃO */}
        <Pressable
          onPress={createRide}
          disabled={loading}
          className={`h-14 rounded-2xl items-center justify-center shadow-lg flex-row ${
            loading
              ? "bg-gray-400"
              : "bg-velvet-orchid-700 active:opacity-90 active:scale-[0.98]"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white font-black text-lg mr-2">
                Publicar Carona
              </Text>
              <ChevronRight size={20} color="white" />
            </>
          )}
        </Pressable>
      </View>
    </>
  );
}
