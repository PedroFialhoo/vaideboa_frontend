import { Calendar, Clock, Search as SearchIcon, Navigation, MapPin } from "lucide-react-native";
import { View, Text, TouchableOpacity, Pressable, ActivityIndicator } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

type Props = {
  date: Date;
  showDatePicker: boolean;
  showTimePicker: boolean;
  setShowDatePicker: (value: boolean) => void;
  setShowTimePicker: (value: boolean) => void;
  onDateChange: (event: any, date?: Date) => void;
  onTimeChange: (event: any, date?: Date) => void;
  searchTravels: () => void;
  loading: boolean;
  origin: any;
  destination: any;
  messageError: string;
};

export default function SearchForm({
  date,
  showDatePicker,
  showTimePicker,
  setShowDatePicker,
  setShowTimePicker,
  onDateChange,
  onTimeChange,
  searchTravels,
  loading,
  origin,
  destination,
  messageError
}: Props) {

  return (
    <View className="bg-white rounded-3xl p-6 shadow-lg border border-purple-x11-50">
      
      {/* Visualização de Trajeto (Read-only) */}
      <View className="mb-6 bg-platinum/20 p-4 rounded-2xl border border-purple-x11-100">
        <View className="flex-row items-center mb-4">
          <View className="bg-purple-x11-100 p-2 rounded-full mr-3">
            <Navigation size={16} color="#7b4d91" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-400 text-[10px] font-bold uppercase">Saída de</Text>
            <Text className="text-velvet-orchid-900 font-bold text-sm" numberOfLines={1}>
              {origin?.address || "Localização atual"}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <View className="bg-velvet-orchid-700 p-2 rounded-full mr-3">
            <MapPin size={16} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-400 text-[10px] font-bold uppercase">Destino para</Text>
            <Text className="text-velvet-orchid-900 font-bold text-sm" numberOfLines={1}>
              {destination?.address || "Selecione o destino"}
            </Text>
          </View>
        </View>
      </View>

      {/* Seletores de Data e Hora */}
      <View className="flex-row gap-4 mb-6">
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className="flex-1 flex-row items-center bg-platinum/30 p-4 rounded-2xl border border-purple-x11-100"
        >
          <Calendar size={20} color="#7b4d91" />
          <View className="ml-3">
            <Text className="text-gray-400 text-[10px] font-bold">DATA</Text>
            <Text className="text-velvet-orchid-900 font-bold">
              {date.toLocaleDateString("pt-BR")}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowTimePicker(true)}
          className="flex-1 flex-row items-center bg-platinum/30 p-4 rounded-2xl border border-purple-x11-100"
        >
          <Clock size={20} color="#7b4d91" />
          <View className="ml-3">
            <Text className="text-gray-400 text-[10px] font-bold">HORA</Text>
            <Text className="text-velvet-orchid-900 font-bold">
              {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          onChange={onTimeChange}
          is24Hour
        />
      )}

      <Pressable
        onPress={searchTravels}
        disabled={loading || !origin || !destination}
        className={`h-16 rounded-2xl flex-row items-center justify-center shadow-md active:opacity-90 ${
          origin && destination ? "bg-velvet-orchid-700" : "bg-gray-300"
        }`}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <SearchIcon size={22} color="white" />
            <Text className="text-white font-black text-lg ml-2">
              Buscar Caronas
            </Text>
          </>
        )}
      </Pressable>

      {messageError ? (
        <Text className="text-red-500 text-center mt-4 font-bold italic">
          {messageError}
        </Text>
      ) : null}
    </View>
  );
}