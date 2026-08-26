import "@/global.css";
import { Camera } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Preferences from "@/components/account/preferences"
import Score from "@/components/account/score"
import { getToken } from "@/src/services/storage"
import { api } from "@/src/services/api"
import { useFocusEffect } from "@react-navigation/native";

export default function Account() {
  const [name, setName] = useState<string | null>(null);
  const [ranking, setRanking] = useState<string | null>(null);
  const [numViagensMotorista, setNumViagensMotorista] = useState<number | null>(null);
  const [mediaMotorista, setMediaMotorista] = useState<number | null>(null);
  const [numViagensPassageiro, setNumViagensPassageiro] = useState<number | null>(null);
  const [mediaPassageiro, setMediaPassageiro] = useState<number | null>(null);
  const [numAvaliacoesMotorista, setNumAvaliacoesMotorista] = useState<number | null>(null);
  const [numAvaliacoesPassageiro, setNumAvaliacoesPassageiro] = useState<number | null>(null);
  const [preferences, setPreferences] = useState({
    conversa: "",
    musica: "",
    cigarro: "",
    pet: "",
  });

  function getUser(){
    getToken().then(token => {
      api.get("/user/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(response => {
        setName(response.data.nome)
        setRanking(response.data.rankingDto.rankingMotorista)
        setNumViagensMotorista(response.data.rankingDto.numViagensMotorista)
        setMediaMotorista(response.data.rankingDto.notaMotorista)
        setMediaPassageiro(response.data.rankingDto.notaPassageiro)
        setNumAvaliacoesMotorista(response.data.rankingDto.numAvaliacoesMotorista)
        setNumAvaliacoesPassageiro(response.data.rankingDto.numAvaliacoesPassageiro)
        const pref = response.data.preferenciasDto
        setPreferences({
          conversa: pref.conversa?.toUpperCase(),
          musica: pref.musica?.toUpperCase(),
          cigarro: pref.cigarro?.toUpperCase(),
          pet: pref.animais?.toUpperCase(),
        })
        console.log(response.data)
        console.log(preferences)
      })
    })
  }
  useEffect(() => {
    getUser()
  }, [])

  useFocusEffect(
    useCallback(() => {
      getUser()
    }, [])
  );

  return (
    <ScrollView className="flex-1 bg-vintage-grape-200">
      <View className="bg-velvet-orchid-900 pt-12 pb-12 items-center rounded-b-[100px] shadow-xl">
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

        <Text className="text-white font-black text-2xl mt-4 max-w-[80%] text-center">
          {name}
        </Text>

        {(numViagensMotorista !== 0 && ranking) && (
          <Text className="text-purple-x11-50 text-lg">
            <Text className="text-purple-x11-200 text-lg">Nível no volante:</Text> {ranking?.charAt(0).toUpperCase() + ranking?.slice(1).toLowerCase()}
          </Text>
        )}
      </View>

      <Score
        mediaMotorista={mediaMotorista}
        numAvaliacoesMotorista={numAvaliacoesMotorista}
        mediaPassageiro={mediaPassageiro}
        numAvaliacoesPassageiro={numAvaliacoesPassageiro}
      />

      <Preferences preferences={preferences} setPreferences={setPreferences} />
    </ScrollView>
  );
}