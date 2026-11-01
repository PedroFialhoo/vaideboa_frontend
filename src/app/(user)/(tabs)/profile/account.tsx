import "@/global.css";
import { Camera, User } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Preferences from "@/components/account/preferences"
import Score from "@/components/account/score"
import { getToken } from "@/src/services/storage"
import { api } from "@/src/services/api"
import { useFocusEffect } from "expo-router/react-navigation";

import { colors } from "@/src/styles/colors";
import { useProfilePhoto } from "@/src/hooks/useProfilePhoto";

export default function Account() {
  const { photoUri, busy, message, pickPhoto, onImageError } = useProfilePhoto();
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
    raioDeslocamentoKm: "2",
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
          raioDeslocamentoKm: String((pref.raioDeslocamentoMetros ?? 2000) / 1000).replace(".", ","),
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
    <ScrollView className="flex-1 bg-vintage-grape-200" bounces={false}>
      <View className="bg-velvet-orchid-900 pt-12 pb-12 items-center rounded-b-[100px] shadow-xl">
        <View className="relative">
          <View className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-platinum">
            {photoUri ? (
              <Image key={photoUri} source={{ uri: photoUri }} onError={onImageError} className="w-full h-full" />
            ) : (
              <View className="flex-1 items-center justify-center"><User size={64} color={colors["velvet-orchid"][600]} /></View>
            )}
          </View>

          <TouchableOpacity onPress={pickPhoto} disabled={busy} accessibilityRole="button" accessibilityLabel="Alterar foto de perfil" accessibilityState={{ disabled: busy, busy }} className="absolute bottom-0 right-0 bg-purple-x11-600 p-2 rounded-full border-2 border-white shadow-md">
            {busy ? <ActivityIndicator size="small" color="white" /> : <Camera size={20} color="white" />}
          </TouchableOpacity>
        </View>

        {message && <Text accessibilityLiveRegion="polite" className="text-white text-center mt-3 px-6">{message}</Text>}

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

      <View className="h-12" />
    </ScrollView>
  );
}
