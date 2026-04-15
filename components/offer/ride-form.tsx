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
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Pressable,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

type Props = {
  date: Date | null;
  setDate: (date: Date) => void;
  time: Date | null;
  setTime: (time: Date) => void;
  price: number | null;
  setPrice: (price: number) => void;
  seats: number;
  setSeats: (seats: number) => void;
  createRide: () => void;
  messageError: string
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
  messageError
}: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const MAX_SEATS = 6;
  const MIN_SEATS = 1;

  const formatDate = (date: Date | null) => {
    if (!date) return "Selecionar";
    return date.toLocaleDateString("pt-BR");
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "Selecionar";
    return date.toLocaleTimeString("pt-BR", {
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

  return (
    <ScrollView className="flex-1 bg-platinum px-6 pt-6">
      <View className="bg-white rounded-3xl p-6 border border-purple-900 mb-6">
        <Text className="text-velvet-orchid-900 font-black text-xl mb-6">
          Detalhes da Carona
        </Text>

        {/* Data e Hora */}
        <View className="flex-row mb-6" style={{ gap: 16 }}>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="flex-1 flex-row items-center bg-platinum/50 rounded-2xl px-4 h-14 border border-purple-900"
          >
            <Calendar size={20} color="#7b4d91" />
            <Text className="ml-3 font-semibold">
              {formatDate(date)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowTimePicker(true)}
            className="flex-1 flex-row items-center bg-platinum/50 rounded-2xl px-4 h-14 border border-purple-900"
          >
            <Clock size={20} color="#7b4d91" />
            <Text className="ml-3 font-semibold">
              {formatTime(time)}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date || new Date()}
            mode="date"
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === "ios");
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={time || new Date()}
            mode="time"
            onChange={(event, selectedTime) => {
              setShowTimePicker(Platform.OS === "ios");
              if (selectedTime) setTime(selectedTime);
            }}
          />
        )}

        {/* Assentos */}
        <View className="mb-6">
          <Text className="text-xs uppercase mb-3">
            Assentos Disponíveis
          </Text>

          <View className="flex-row items-center justify-between p-2 rounded-2xl border border-purple-900">
            <TouchableOpacity
              onPress={decrementSeats}
              disabled={seats === MIN_SEATS}
            >
              <Minus size={20} />
            </TouchableOpacity>

            <View className="flex-row items-center">
              <Users size={22} />
              <Text className="text-2xl font-black ml-2">
                {seats}
              </Text>
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

        {/* Preço */}
        <View className="mb-8">
          <Text className="text-xs uppercase mb-2">
            Contribuição (R$)
          </Text>

          <View className="flex-row items-center rounded-2xl px-4 h-16 border">
            <DollarSign size={20} />

            <TextInput
              placeholder="0,00"
              className="flex-1 text-xl ml-2"
              keyboardType="decimal-pad"
              value={price ? String(price) : ""}
              onChangeText={(text) =>
                setPrice(Number(text.replace(",", ".")))
              }
            />
          </View>
        </View>
        {
           messageError ? (
           <Text className="text-red-500 text-sm mb-4 text-center">
              {messageError}
           </Text>
           ) : null
        }
        {/* Botão */}
        <Pressable 
          onPress={createRide}
          className="bg-velvet-orchid-700 w-full h-14 rounded-2xl flex items-center justify-center shadow-lg active:opacity-90 active:scale-[0.98] transition-all flex-row">
          <Text className="text-white font-black text-lg mr-2">
            Publicar Carona
          </Text>
          <ChevronRight size={20} color="white" />
        </Pressable>
      </View>
    </ScrollView>
  );
}