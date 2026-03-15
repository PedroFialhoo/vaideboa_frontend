import { View, Text, Image, KeyboardAvoidingView, Platform, ScrollView, Pressable, TouchableOpacity, Alert } from "react-native";
import "@/global.css"
import { Input, InputField } from "@/components/ui/input";
import { Link, router } from "expo-router";
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import { useState } from "react";

export default function Login() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const forgetPassword = () =>{
    if (!email) {
      Alert.alert(
        "Campo vazio",
        "Digite seu email para recuperar a senha."
      );
      return;
    }
    router.replace("/forget-password")
  }

  const login = () => {
    router.replace("/home")
  }

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
                source={require("../../assets/images/logo-vdb.png")}
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
              Login
            </Text>

            <View className="mb-5">
              <Text className="text-velvet-orchid-700 font-semibold mb-2 ml-1">E-mail</Text>
              <Input
                variant="rounded"
                className="border-velvet-orchid-300 bg-white h-14 px-4 focus:border-velvet-orchid-700"
              >
                <Mail size={20} color="#7b4d91" className="mr-2" />
                <InputField
                  placeholder="E-mail"
                  keyboardType="email-address"
                  className="text-velvet-orchid-900"
                  value={email}
                  onChangeText={setEmail}
                />
              </Input>
            </View>
            
            <View className="mb-2">
              <Text className="text-velvet-orchid-700 font-semibold mb-2 ml-1">Senha</Text>
              <Input
                variant="rounded"
                className="border-velvet-orchid-300 bg-white h-14 px-4 focus:border-velvet-orchid-700"
              >
                <Lock size={20} color="#7b4d91" className="mr-2" />
                <InputField
                  placeholder="Senha "
                  secureTextEntry={!passwordVisible}
                  className="text-velvet-orchid-900 flex-1"
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} className="pr-2">
                  {passwordVisible ? 
                    <EyeOff size={22} color="#7b4d91" /> : 
                    <Eye size={22} color="#7b4d91" />
                  }
                </TouchableOpacity>
              </Input>
            </View>

            <TouchableOpacity className="self-end mb-10" onPress={forgetPassword}>
              <Text className=" text-purple-x11-700 underline">
                Esqueceu a senha?
              </Text>
            </TouchableOpacity>
            
            <Pressable 
              className="bg-velvet-orchid-700 w-full h-14 rounded-2xl flex items-center justify-center shadow-lg active:opacity-90 active:scale-[0.98] transition-all"
              onPress={login}
            >
              <Text className="text-white font-bold text-lg">Entrar na conta</Text>
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