import { View, Text, Image, KeyboardAvoidingView, Platform, ScrollView, Pressable, TouchableOpacity } from "react-native";
import "../../global.css";
import { Input, InputField } from "@/components/ui/input";
import { Link } from "expo-router";
import { Eye, EyeOff, Mail, Lock, MailOpen } from 'lucide-react-native';
import { useState } from "react";

export default function ForgetPassword() {
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
        <View className="flex-1 px-8 pt-16 pb-10 justify-between">
          
          <View className="items-center">
            <View className="bg-white p-4 rounded-3xl shadow-sm mb-6">
              <Image
                source={require("../assets/images/logo-vdb.png")}
                className="w-32 h-32"
                resizeMode="contain"
                alt="logo"
              />
            </View>
            <Text className="font-light text-2xl text-purple-x11-600 text-center leading-relaxed px-4">
              Chegar na facul nunca foi <Text className="font-bold text-velvet-orchid-700">tão fácil.</Text>
            </Text>
          </View>

          <View className="w-full mt-8">
            <Text className="font-black text-4xl text-velvet-orchid-700 mb-8">
              Recuperar senha
            </Text>

            <View className="mb-5">
              <Text className="text-velvet-orchid-700 font-semibold mb-2 ml-1">Código</Text>
              <Input
                variant="rounded"
                className="border-velvet-orchid-300 bg-white h-14 px-4 focus:border-velvet-orchid-700"
              >
                <MailOpen size={20} color="#7b4d91" className="mr-2" />
                <InputField
                  placeholder="Confira o código enviado no seu e-mail"
                  keyboardType="numeric"
                  className="text-velvet-orchid-900"
                />
              </Input>
            </View>
            
            <View className="mb-2">
              <Text className="text-velvet-orchid-700 font-semibold mb-2 ml-1">Nova senha</Text>
              <Input
                variant="rounded"
                className="border-velvet-orchid-300 bg-white h-14 px-4 focus:border-velvet-orchid-700"
              >
                <Lock size={20} color="#7b4d91" className="mr-2" />
                <InputField
                  placeholder="Crie uma senha forte"
                  secureTextEntry={!passwordVisible}
                  className="text-velvet-orchid-900 flex-1"
                />
                <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} className="pr-2">
                  {passwordVisible ? 
                    <EyeOff size={22} color="#7b4d91" /> : 
                    <Eye size={22} color="#7b4d91" />
                  }
                </TouchableOpacity>
              </Input>
            </View>

            <TouchableOpacity className="self-end mb-10">
              <Link href={"/"} className=" text-purple-x11-700 underline">
                Lembrou a senha?
              </Link>
            </TouchableOpacity>
            
            <Pressable className="bg-velvet-orchid-700 w-full h-14 rounded-2xl flex items-center justify-center shadow-lg active:opacity-90 active:scale-[0.98] transition-all">
              <Text className="text-white font-bold text-lg">Alterar senha</Text>
            </Pressable>
          </View>

          <View className="mt-auto mb-5">
            <Text className="text-center text-velvet-orchid-700 text-base">
              Não tem uma conta? {" "}
              <Link href={"/signup"} className="font-bold text-purple-x11-700 underline">
                Cadastre-se aqui
              </Link>
            </Text>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}