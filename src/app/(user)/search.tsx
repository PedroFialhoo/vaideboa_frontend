import { View, Text, ScrollView, TouchableOpacity, Pressable, Platform } from "react-native";
import { MapPin, Navigation, Calendar, Clock, Search as SearchIcon, ArrowDownUp, X } from "lucide-react-native";
import { useEffect, useState, useRef } from "react";
import "@/global.css";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import DateTimePicker from '@react-native-community/datetimepicker';
import { getCurrentPositionAsync, LocationAccuracy, LocationObject, requestForegroundPermissionsAsync, watchPositionAsync } from "expo-location";

export default function Search() {
  const [destination, setDestination] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);

  const originRef = useRef<any>(null);
  const destinationRef = useRef<any>(null);

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [location, setLocation] = useState<LocationObject | null>(null);

  async function requestLocationPermission() {
    const { granted } = await requestForegroundPermissionsAsync();
    if (granted) {
      const currentPosition = await getCurrentPositionAsync();
      setLocation(currentPosition);
    }
  }

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

  const renderAutocomplete = (
    placeholder: string,
    icon: React.ReactNode,
    label: string,
    onSelect: (data: any, details: any) => void,
    onClear: () => void,
    value?: string,
    ref?: any
  ) => (
    <View className="flex-row items-start mb-4 z-50">
      <View className="mt-7 mr-4">{icon}</View>

      <View className="flex-1 border-b border-platinum pb-2">
        <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-1">
          {label}
        </Text>

        <GooglePlacesAutocomplete
          ref={ref}
          debounce={400}
          placeholder={placeholder}
          fetchDetails={true}
          enablePoweredByContainer={false}
          onPress={onSelect}
          query={{
            key: GOOGLE_MAPS_API_KEY,
            language: "pt-BR",
            components: "country:br",
            location: location ? `${location.coords.latitude},${location.coords.longitude}` : undefined,
            radius: 50000,
          }}
          styles={{
            textInput: { height: 40, color: "#391f47", fontWeight: '600', paddingLeft: 0 },
            container: { flex: 0 },
            listView: { backgroundColor: 'white', zIndex: 1000, elevation: 5 }
          }}
          renderRightButton={() => value ? (
            <TouchableOpacity onPress={onClear} className="justify-center px-2">
              <X size={16} color="#7b4d91" />
            </TouchableOpacity>
          ) : null}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </View>
  );

  const searchTravels = () => {
    const dataObj = new Date(date);
    const timeObj = new Date(date);

    const dataFormatada = dataObj.toISOString().split("T")[0];
    const horaFormatada = timeObj.toTimeString().split(" ")[0];

    console.log("Dados para buscar carona:", {
      data: dataFormatada,
      hora: horaFormatada,
      saidaLat: origin?.latitude,
      saidaLng: origin?.longitude,
      destinoLat: destination?.latitude,
      destinoLng: destination?.longitude,
    });
  };

  return (
    <View className="flex-1 bg-platinum">
      <View className="bg-velvet-orchid-900 pt-16 pb-12 px-8 rounded-b-[40px] shadow-xl">
        <Text className="text-white font-black text-3xl mb-2">Encontrar Carona</Text>
        <Text className="text-purple-x11-200 text-base font-medium">
          Para onde você quer ir hoje?
        </Text>
      </View>

      <View className="px-6 -mt-8">
        <View className="bg-white rounded-3xl p-6 shadow-lg border border-platinum">

          {renderAutocomplete(
            "De onde vamos sair?",
            <View className="bg-purple-x11-100 p-2 rounded-full border-2 border-white shadow-sm">
              <Navigation size={16} color="#7b4d91" />
            </View>,
            "Partida de",
            (data, details) =>
              setOrigin({
                latitude: details!.geometry.location.lat,
                longitude: details!.geometry.location.lng,
                address: data.description,
              }),
            () => {
              setOrigin(null);
              originRef.current?.clear();
            },
            origin?.address,
            originRef
          )}

          {renderAutocomplete(
            "Para onde vamos?",
            <View className="bg-velvet-orchid-700 p-2 rounded-full border-2 border-white shadow-sm">
              <MapPin size={16} color="white" />
            </View>,
            "Destino para",
            (data, details) =>
              setDestination({
                latitude: details!.geometry.location.lat,
                longitude: details!.geometry.location.lng,
                address: data.description,
              }),
            () => {
              setDestination(null);
              destinationRef.current?.clear();
            },
            destination?.address,
            destinationRef
          )}

          <View className="h-[1px] bg-platinum my-4" />

          <View className="flex-row gap-4 mb-8">
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="flex-1 flex-row items-center bg-platinum/30 p-4 rounded-2xl border border-platinum"
            >
              <Calendar size={20} color="#7b4d91" />
              <View className="ml-3">
                <Text className="text-gray-400 text-[10px] font-bold uppercase">Data</Text>
                <Text className="text-velvet-orchid-900 font-bold">
                  {date.toLocaleDateString('pt-BR')}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              className="flex-1 flex-row items-center bg-platinum/30 p-4 rounded-2xl border border-platinum"
            >
              <Clock size={20} color="#7b4d91" />
              <View className="ml-3">
                <Text className="text-gray-400 text-[10px] font-bold uppercase">Hora</Text>
                <Text className="text-velvet-orchid-900 font-bold">
                  {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
              is24Hour={true}
            />
          )}

          <Pressable
            onPress={searchTravels}
            disabled={!origin || !destination}
            className={`h-16 rounded-2xl flex-row items-center justify-center shadow-lg active:scale-[0.98] ${
              origin && destination ? 'bg-velvet-orchid-700' : 'bg-gray-300'
            }`}
          >
            <SearchIcon size={22} color="white" className="mr-2" />
            <Text className="text-white font-black text-lg">Buscar Caronas</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}0