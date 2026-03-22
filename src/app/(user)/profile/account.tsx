import { View, Text, ScrollView, Image, TouchableOpacity, Switch } from "react-native";
import { User, Mail, Bell, ShieldCheck, LogOut, ChevronRight, Camera } from "lucide-react-native";
import { useState } from "react";
import "@/global.css"

export default function Account() {
  const [notifications, setNotifications] = useState(true);

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
        <Text className="text-white font-black text-2xl mt-4">Pedro Henrique</Text>
        <Text className="text-purple-x11-50 font-medium"><Text className="text-purple-x11-200 font-medium text-lg">Nível:</Text> Chega inteiro</Text>
      </View>

      <View className="px-6 mt-6">
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-6">
          <Text className="text-velvet-orchid-900 font-black text-lg mb-4">Preferências da Conta</Text>
          
          <TouchableOpacity className="flex-row items-center py-4 border-b border-platinum">
            <View className="bg-purple-x11-100 p-2 rounded-xl mr-4">
              <User size={22} color="#7b4d91" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-velvet-orchid-900">Dados Pessoais</Text>
              <Text className="text-gray-500 text-xs">Nome, e-mail e telefone</Text>
            </View>
            <ChevronRight size={20} color="#391f47" opacity={0.3} />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center py-4 border-b border-platinum">
            <View className="bg-purple-x11-100 p-2 rounded-xl mr-4">
              <ShieldCheck size={22} color="#7b4d91" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-velvet-orchid-900">Segurança</Text>
              <Text className="text-gray-500 text-xs">Alterar senha e autenticação</Text>
            </View>
            <ChevronRight size={20} color="#391f47" opacity={0.3} />
          </TouchableOpacity>

          <View className="flex-row items-center py-4">
            <View className="bg-purple-x11-100 p-2 rounded-xl mr-4">
              <Bell size={22} color="#7b4d91" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-velvet-orchid-900">Notificações</Text>
              <Text className="text-gray-500 text-xs">Alertas de carona e mensagens</Text>
            </View>
            <Switch 
              value={notifications} 
              onValueChange={setNotifications}
              trackColor={{ false: "#D1D5DB", true: "#7b4d91" }}
              thumbColor="white"
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}