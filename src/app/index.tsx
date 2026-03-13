import { View, Text, Image, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import "../../global.css";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText } from "@/components/ui/button";
import { Link } from "expo-router";

export default function Login() {
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

            <Input
              variant="rounded"
              className="border-velvet-orchid-700"
            >
              <InputField
                placeholder="Senha"
                secureTextEntry
              />
            </Input>

            <Text className="ml-4 text-purple-x11-700 mt-2">
              Esqueceu a senha?
            </Text>
            <Text className="ml-4 text-velvet-orchid-700 mt-2">
              Não tem uma conta? {" "}
              <Link href={"/signup"} className="text-purple-x11-700">
                Cadastre-se aqui
              </Link>
            </Text>

            <Button className="bg-velvet-orchid-700 w-[50%] self-center active:bg-velvet-orchid-600 rounded-full mt-6">
              <ButtonText className="text-white">
                Entrar
              </ButtonText>
            </Button>

          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}