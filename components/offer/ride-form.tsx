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
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Pressable,
  KeyboardAvoidingView,
  ActivityIndicator,
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
  messageError: string;
  loading: boolean;
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
}: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const MAX_SEATS = 6;
  const MIN_SEATS = 1;

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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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
            Contribuição (R$)
          </Text>
          <View className="bg-white rounded-2xl border border-purple-x11-100 px-4 h-14 flex-row items-center">
            <View className="bg-purple-x11-50 w-9 h-9 rounded-xl items-center justify-center mr-3">
              <DollarSign size={18} color="#7b4d91" />
            </View>
            <TextInput
              placeholder="0,00"
              placeholderTextColor="#aeaabb"
              className="flex-1 text-velvet-orchid-900 font-black text-xl"
              keyboardType="decimal-pad"
              value={price ? String(price) : ""}
              onChangeText={(text) =>
                setPrice(Number(text.replace(",", ".")))
              }
            />
          </View>
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
    </KeyboardAvoidingView>
  );
}
