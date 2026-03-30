import "@/global.css";
import { Camera } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Preferences from "@/components/account/preferences"
import { getToken } from "@/src/services/storage"
import { api } from "@/src/services/api"

export default function Account() {
  const [name, setName] = useState<string | null>(null);

  const [preferences, setPreferences] = useState({
    conversa: "",
    musica: "",
    cigarro: "",
    pet: "",
  });

  useEffect(() => {
  getToken().then(token => {
    api.get("/user/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then(response => {
      setName(response.data.nome)
      const pref = response.data.preferenciasDto
      setPreferences({
        conversa: pref.conversa?.toUpperCase(),
        musica: pref.musica?.toUpperCase(),
        cigarro: pref.cigarro?.toUpperCase(),
        pet: pref.animais?.toUpperCase(),
      })
    })
  })
}, [])

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
          {name}
        </Text>

        <Text className="text-purple-x11-50 font-medium">
          <Text className="text-purple-x11-200 text-lg">Nível:</Text> Chega inteiro
        </Text>
      </View>

      <Preferences preferences={preferences} setPreferences={setPreferences}/>
    </ScrollView>
  );
}