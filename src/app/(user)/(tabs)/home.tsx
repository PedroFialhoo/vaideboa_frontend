import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { Car, Search, MapPin, Star, Clock } from "lucide-react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
import "@/global.css";
import { getToken } from "@/src/services/storage";
import { api } from "@/src/services/api";
import { useCallback, useEffect, useState } from "react";
import Logo from "../../../assets/images/logo-vdb.svg";

export default function Home() {
  const router = useRouter();
    const [name, setName] = useState<string | null>(null);

  function getUser(){
      getToken().then(token => {
        api.get("/user/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then(response => {
          setName(response.data.nome)
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
    <ScrollView className="flex-1 bg-platinum" bounces={false}>
      {/* Header com Boas-vindas */}
      <View className="bg-velvet-orchid-900 pt-20 pb-12 px-8 rounded-b-[50px] shadow-2xl">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-purple-x11-200 text-lg font-medium">Olá, {name ? name?.split(" ")[0] : "Universitário"}!</Text>
            <Text className="text-white text-3xl font-black">Bem-vindo ao VDB</Text>
          </View>
          <View className="bg-white/10 p-3 rounded-2xl border border-white/20">
            <Logo width={28} height={28} fill="white" />
          </View>
        </View>
        
        <Text className="text-purple-x11-100 text-sm leading-5 font-medium opacity-80">
          A plataforma de caronas feita por estudantes, para estudantes. 
          Economize tempo, divida custos e chegue na facul com segurança.
        </Text>
      </View>

      {/* Grid de Ações Principais */}
      <View className="px-6 -mt-8 flex-row gap-4">
        {/* Iniciar Carona (Motorista) */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => router.push("/offer")}
          className="flex-1 bg-white p-6 rounded-[32px] shadow-lg border border-purple-x11-50 items-center"
        >
          <View className="bg-velvet-orchid-700 p-4 rounded-2xl mb-4">
            <Logo width={32} height={32} fill="white" />
          </View>
          <Text className="text-velvet-orchid-900 font-black text-center text-lg">Iniciar Carona</Text>
          <Text className="text-gray-400 text-[10px] text-center mt-1 font-bold uppercase tracking-widest">Eu vou dirigir</Text>
        </TouchableOpacity>

        {/* Buscar Carona (Passageiro) */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => router.push("/search")}
          className="flex-1 bg-white p-6 rounded-[32px] shadow-lg border border-purple-x11-50 items-center"
        >
          <View className="bg-purple-x11-100 p-4 rounded-2xl mb-4">
            <Search size={32} color="#7b4d91" />
          </View>
          <Text className="text-velvet-orchid-900 font-black text-center text-lg">Buscar Carona</Text>
          <Text className="text-gray-400 text-[10px] text-center mt-1 font-bold uppercase tracking-widest">Quero uma vaga</Text>
        </TouchableOpacity>
      </View>

      {/* Destaques / Info */}
      <View className="px-8 mt-10">
        <Text className="text-velvet-orchid-900 font-black text-xl mb-6">Por que usar o VDB?</Text>
        
        <View className="space-y-4">
          {/* Card 1 */}
          <View className="flex-row items-center bg-white/50 p-4 rounded-2xl border border-white mb-3">
            <View className="bg-green-100 p-2 rounded-xl mr-4">
              <Star size={20} color="#16a34a" />
            </View>
            <View className="flex-1">
              <Text className="text-velvet-orchid-900 font-bold">Segurança</Text>
              <Text className="text-gray-500 text-xs font-medium">Modo feminino e botão de emergência.</Text>
            </View>
          </View>

          {/* Card 2 */}
          <View className="flex-row items-center bg-white/50 p-4 rounded-2xl border border-white mb-3">
            <View className="bg-blue-100 p-2 rounded-xl mr-4">
              <MapPin size={20} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-velvet-orchid-900 font-bold">Rotas Inteligentes</Text>
              <Text className="text-gray-500 text-xs font-medium">Caronas que passam exatamente no seu caminho.</Text>
            </View>
          </View>

          {/* Card 3 */}
          <View className="flex-row items-center bg-white/50 p-4 rounded-2xl border border-white mb-10">
            <View className="bg-orange-100 p-2 rounded-xl mr-4">
              <Clock size={20} color="#ea580c" />
            </View>
            <View className="flex-1">
              <Text className="text-velvet-orchid-900 font-bold">Pontualidade</Text>
              <Text className="text-gray-500 text-xs font-medium">Combine horários direto com quem estuda com você.</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}