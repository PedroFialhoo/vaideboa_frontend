import "@/global.css";
import { Camera, ChevronRight, Cigarette, Music, PawPrint, Speech } from "lucide-react-native";
import { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
  Radio,
  RadioGroup,
  RadioIndicator,
  RadioIcon,
  RadioLabel,
} from '@/components/ui/radio';
import Preferences from "@/components/account/preferences";

export default function Account() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const [preferences, setPreferences] = useState({
    conversa: "",
    musica: "",
    cigarro: "",
    pet: "",
  });

  const toggleItem = (item: string) => {
    setOpenItem(openItem === item ? null : item);
  };

  const handleChange = (key: string, value: string) => {
    setPreferences({ ...preferences, [key]: value });
  };

  return (
    <ScrollView className="flex-1 bg-vintage-grape-300">
      <View className="bg-velvet-orchid-700 pt-16 pb-24 items-center rounded-b-[1000px] shadow-xl">
        <View className="relative">
          <View className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-platinum">
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200" }} 
              className="w-full h-full"
            />
          </View>

          <TouchableOpacity className="absolute bottom-0 right-0 bg-purple-x11-600 p-2 rounded-full border-2 border-white shadow-md">
            <Camera size={20} color="white" />
          </TouchableOpacity>
        </View>

        <Text className="text-white font-black text-2xl mt-4">
          Pedro Henrique
        </Text>

        <Text className="text-purple-x11-50 font-medium">
          <Text className="text-purple-x11-200 text-lg">Nível:</Text> Chega inteiro
        </Text>
      </View>

      <Preferences />
    </ScrollView>
  );
}