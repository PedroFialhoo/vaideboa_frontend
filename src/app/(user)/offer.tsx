import { View, Text, TouchableOpacity } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import Destination from "@/components/offer/destination";
import "@/global.css";
import Origin from "@/components/offer/origin";

export default function Offer() {
  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState<{latitude: number, longitude: number} | null>(null);
  const [origin, setOrigin] = useState<{latitude: number, longitude: number} | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [price, setPrice] = useState<number | null>(null);

  function handleNext() {
    if (step === 1 && !destination) return;
    if (step === 2 && !origin) return;
    if (step === 3 && !date) return;
    if (step === 4 && !time) return;
    if (step === 5 && !price) return;

    setStep(step + 1);
  }

  const canGoNext =
  (step === 1 && destination) ||
  (step === 2 && origin) ||
  (step === 3 && date) ||
  (step === 4 && time) ||
  (step === 5 && price);


  return (
    <View className="flex-1 bg-platinum">
      <View className="pt-10 pb-4 px-6 bg-velvet-orchid-900 flex-row items-center justify-between shadow-sm z-20">
        <View className="w-10">
          {step > 1 && (
            <TouchableOpacity 
              onPress={() => setStep(step - 1)}
              className="p-2 -ml-2 rounded-full active:bg-gray-100"
            >
              <ChevronLeft size={28} color="#cc66ff" />
            </TouchableOpacity>
          )}
        </View>

        <Text className="font-black text-platinum-50 text-lg">
          Oferecer Carona
        </Text>

        <View className="w-10 items-end">
          <TouchableOpacity 
            onPress={handleNext}
            disabled={!canGoNext}
            className="p-2 -mr-2 rounded-full active:bg-gray-100"
          >
            <ChevronRight size={28} color="#cc66ff" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1">
        {step === 1 && 
          <Destination destination={destination} setDestination={setDestination} next={handleNext} />
        }
        {step === 2 && 
          <Origin origin={origin} setOrigin={setOrigin} next={handleNext} />
        }
      </View>
    </View>
  );
}