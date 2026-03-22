import { View, Text, ScrollView, Image, TouchableOpacity, Switch } from "react-native";
import { User, Mail, Bell, ShieldCheck, LogOut, ChevronRight, Camera } from "lucide-react-native";
import { useState } from "react";
import "@/global.css"
import { router } from "expo-router";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const logout = () => {
    router.replace("/")
  }

  return (
    <View>
       <View className="px-6 pt-6 bg-vintage-grape-300 h-full">
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-6">
          <Text className="text-velvet-orchid-900 font-black text-lg mb-4">Configurações da Conta</Text>
          
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

        <TouchableOpacity 
          className="bg-white rounded-3xl p-6 shadow-sm flex-row items-center justify-center active:bg-red-50"
          onPress={logout}  
        >
          <LogOut size={22} color="#EF4444" className="mr-2" />
          <Text className="text-red-500 font-black text-lg">Sair da Conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}