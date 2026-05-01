import { View, Text, TouchableOpacity, Switch, TextInput, ScrollView } from "react-native";
import { User, Bell, ShieldCheck, LogOut, ChevronRight, Save, Lock, Smartphone, Contact } from "lucide-react-native";
import { useEffect, useState } from "react";
import "@/global.css"
import { router } from "expo-router";
import { resetToken } from "@/src/services/storage";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [showPersonalForm, setShowPersonalForm] = useState(false);
  const [showSecurityForm, setShowSecurityForm] = useState(false);
  const [gender, setGender] = useState("NÃO_INFORMADO");
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("") 

  

  const logout = async () => {
    await resetToken();
    router.replace("/");
  };

  return (
    <View className="flex-1 bg-vintage-grape-300">
      <ScrollView className="px-6 pt-6" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-6">
          <Text className="text-velvet-orchid-900 font-black text-lg mb-4">Configurações da Conta</Text>
          
          {/* SEÇÃO: DADOS PESSOAIS */}
          <View className="border-b border-platinum">
            <TouchableOpacity 
              onPress={() => {
                setShowPersonalForm(!showPersonalForm);
                setShowSecurityForm(false);
              }}
              className="flex-row items-center py-4"
            >
              <View className="bg-purple-x11-100 p-2 rounded-xl mr-4">
                <User size={22} color="#7b4d91" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-velvet-orchid-900">Dados Pessoais</Text>
                <Text className="text-gray-500 text-xs">Nome, telefone e gênero</Text>
              </View>
              <View style={{ transform: [{ rotate: showPersonalForm ? '90deg' : '0deg' }] }}>
                <ChevronRight size={20} color="#391f47" opacity={0.3} />
              </View>
            </TouchableOpacity>

            {showPersonalForm && (
              <View className="pb-6 px-2 animate-in fade-in duration-300">
                <View className="space-y-4">
                  <View>
                    <Text className="text-velvet-orchid-700 font-bold text-xs mb-1 ml-1">NOME</Text>
                    <TextInput placeholder="Seu nome" className="bg-platinum/30 rounded-xl p-3 text-velvet-orchid-900 border border-platinum" />
                  </View>
                  <View className="mt-3">
                    <Text className="text-velvet-orchid-700 font-bold text-xs mb-1 ml-1">TELEFONE</Text>
                    <TextInput placeholder="(00) 00000-0000" keyboardType="phone-pad" className="bg-platinum/30 rounded-xl p-3 text-velvet-orchid-900 border border-platinum" />
                  </View>
                  <View className="mt-3">
                    <Text className="text-velvet-orchid-700 font-bold text-xs mb-2 ml-1">GÊNERO</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {["MASCULINO", "FEMININO", "OUTROS", "NÃO_INFORMADO"].map((option) => {
                        const isSelected = gender === option;
                        return (
                          <TouchableOpacity
                            key={option}
                            onPress={() => setGender(option)}
                            className={`px-3 py-2 rounded-xl border ${
                              isSelected 
                                ? "bg-velvet-orchid-700 border-velvet-orchid-700" 
                                : "bg-platinum/30 border-platinum"
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-bold ${
                                isSelected ? "text-white" : "text-velvet-orchid-900"
                              }`}
                            >
                              {option.replace("_", " ")}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                </View>
                  <TouchableOpacity className="bg-velvet-orchid-700 rounded-xl p-3 flex-row items-center justify-center mt-2">
                    <Save size={18} color="white" className="mr-2" />
                    <Text className="text-white font-bold">Salvar Alterações</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* SEÇÃO: SEGURANÇA */}
          <View className="border-b border-platinum">
            <TouchableOpacity 
              onPress={() => {
                setShowSecurityForm(!showSecurityForm);
                setShowPersonalForm(false);
              }}
              className="flex-row items-center py-4"
            >
              <View className="bg-purple-x11-100 p-2 rounded-xl mr-4">
                <ShieldCheck size={22} color="#7b4d91" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-velvet-orchid-900">Segurança</Text>
                <Text className="text-gray-500 text-xs">Alterar sua senha</Text>
              </View>
              <View style={{ transform: [{ rotate: showSecurityForm ? '90deg' : '0deg' }] }}>
                <ChevronRight size={20} color="#391f47" opacity={0.3} />
              </View>
            </TouchableOpacity>

            {showSecurityForm && (
              <View className="pb-6 px-2">
                <View className="space-y-4">
                  <View>
                    <Text className="text-velvet-orchid-700 font-bold text-xs mb-1 ml-1">SENHA ANTIGA</Text>
                    <TextInput 
                      secureTextEntry 
                      placeholder="••••••••" 
                      className="bg-platinum/30 rounded-xl p-3 text-velvet-orchid-900 border border-platinum" 
                    />
                  </View>
                  <View className="mt-3">
                    <Text className="text-velvet-orchid-700 font-bold text-xs mb-1 ml-1">NOVA SENHA</Text>
                    <TextInput 
                      secureTextEntry 
                      placeholder="••••••••" 
                      className="bg-platinum/30 rounded-xl p-3 text-velvet-orchid-900 border border-platinum" 
                    />
                  </View>
                  <TouchableOpacity className="bg-velvet-orchid-700 rounded-xl p-3 flex-row items-center justify-center mt-2">
                    <Lock size={18} color="white" className="mr-2" />
                    <Text className="text-white font-bold">Atualizar Senha</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* NOTIFICAÇÕES */}
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
          className="bg-white rounded-3xl p-6 shadow-sm flex-row items-center justify-center active:bg-red-50 mb-10"
          onPress={logout}  
        >
          <LogOut size={22} color="#EF4444" className="mr-2" />
          <Text className="text-red-500 font-black text-lg">Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}