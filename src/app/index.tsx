import { View, Text, Image, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import "../../global.css";
import { Input, InputField } from "@/components/ui/input";
import { Link } from "expo-router";
import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from "react";


export default function Login() {

  const [visible, setVisible ] = useState(false)
  const changeVisibility = () =>{
    setVisible(!visible)
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 bg-platinum items-center justify-start">

          <View className="w-full self-center p-12">
            <Image
              source={require("../assets/images/logo-vdb.png")}
              className="self-center mb-3"
              alt="logo"
              style={{ width: 156, height: 156 }}
            />

            <Text className="font-thin text-2xl w-60 self-center text-purple-x11-600 text-center">
              Chegar na facul nunca foi tão fácil.
            </Text>
          </View>

          <View className="h-[1px] bg-velvet-orchid-700 w-[93%] self-center" />

          <Text className="font-bold text-2xl w-60 self-center text-velvet-orchid-700 text-center mt-20">
            Login
          </Text>

          <View className="w-[80%] self-center flex mt-14">

            <Input
              variant="rounded"
              className="border-velvet-orchid-700 mb-4"
            >
              <InputField
                placeholder="Email"
                keyboardType="email-address"
              />
            </Input>
            
            <View className="flex-row items-center gap-2">
              <Input
                variant="rounded"
                className="border-velvet-orchid-700 flex-1"
              >
                <InputField
                  placeholder="Senha"
                  secureTextEntry = {visible}
                />
              </Input>

              {visible ?
                <Pressable onPress={changeVisibility}>
                  <Eye size={22} color="#391f47" />
                </Pressable> 
                : 
                <Pressable onPress={changeVisibility}>
                  <EyeOff size={22} color="#391f47" />
                </Pressable>
              }
            </View>            

            <Text className="ml-4 text-purple-x11-700 mt-2">
              Esqueceu a senha?
            </Text>
            
            <Pressable className="bg-velvet-orchid-700 w-full self-center active:bg-velvet-orchid-500 rounded-full mt-10 h-10 flex items-center justify-center">
              <Text className="text-white font-bold">Entrar</Text>
            </Pressable>

            <Text className="ml-4 text-velvet-orchid-700 mt-2 text-lg">
              Não tem uma conta? {" "}
              <Link href={"/signup"} className="text-purple-x11-700">
                Cadastre-se aqui
              </Link>
            </Text>

          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}