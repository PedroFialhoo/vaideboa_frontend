import { View, Text, Image, KeyboardAvoidingView, Platform, ScrollView, Pressable, TouchableOpacity } from "react-native";
import "@/global.css"
import { Input, InputField } from "@/components/ui/input";
import { Link } from "expo-router";
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react-native';
import { useState } from "react";

export default function Signup() {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="bg-platinum"
      >
        <View className="flex-1 px-8 pt-12 pb-10 justify-between">
          
          <View className="items-center">
            <View className="bg-white p-3 rounded-3xl shadow-sm mb-4">
              <Image
                source={require("../../assets/images/logo-vdb.png")}
                className="w-28 h-28"
                resizeMode="contain"
                alt="logo"
              />
            </View>
            <Text className="font-light text-xl text-purple-x11-600 text-center leading-relaxed">
              Crie sua conta e comece a <Text className="font-bold text-velvet-orchid-700">economizar tempo.</Text>
            </Text>
          </View>

          <View className="w-full mt-6">
            <Text className="font-black text-3xl text-velvet-orchid-700 mb-6">
              Cadastre-se
            </Text>

            <View className="mb-4">
              <Text className="text-velvet-orchid-700 font-semibold mb-1 ml-1 text-sm">Nome Completo</Text>
              <Input
                variant="rounded"
                className="border-velvet-orchid-300 bg-white h-12 px-4 focus:border-velvet-orchid-700"
              >
                <User size={18} color="#7b4d91" className="mr-2" />
                <InputField
                  placeholder="Como quer ser chamado?"
                  className="text-velvet-orchid-900"
                />
              </Input>
            </View>

            <View className="mb-4">
              <Text className="text-velvet-orchid-700 font-semibold mb-1 ml-1 text-sm">E-mail</Text>
              <Input
                variant="rounded"
                className="border-velvet-orchid-300 bg-white h-12 px-4 focus:border-velvet-orchid-700"
              >
                <Mail size={18} color="#7b4d91" className="mr-2" />
                <InputField
                  placeholder="Seu melhor e-mail"
                  keyboardType="email-address"
                  className="text-velvet-orchid-900"
                />
              </Input>
            </View>
            
            <View className="mb-8">
              <Text className="text-velvet-orchid-700 font-semibold mb-1 ml-1 text-sm">Senha</Text>
              <Input
                variant="rounded"
                className="border-velvet-orchid-300 bg-white h-12 px-4 focus:border-velvet-orchid-700"
              >
                <Lock size={18} color="#7b4d91" className="mr-2" />
                <InputField
                  placeholder="Crie uma senha forte"
                  secureTextEntry={!passwordVisible}
                  className="text-velvet-orchid-900 flex-1"
                />
                <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} className="pr-2">
                  {passwordVisible ? 
                    <EyeOff size={20} color="#7b4d91" /> : 
                    <Eye size={20} color="#7b4d91" />
                  }
                </TouchableOpacity>
              </Input>
            </View>
            
            <Pressable className="bg-velvet-orchid-700 w-full h-14 rounded-2xl flex items-center justify-center shadow-lg active:opacity-90 active:scale-[0.98] transition-all">
              <Text className="text-white font-bold text-lg">Criar minha conta</Text>
            </Pressable>
          </View>

          <View className="mt-8 mb-5">
            <Text className="text-center text-velvet-orchid-700 text-base">
              Já possui uma conta? {" "}
              <Link href={"/login"} className="font-bold text-purple-x11-700 underline">
                Faça o login
              </Link>
            </Text>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}