import { View, Text, Image, KeyboardAvoidingView, ScrollView, Pressable, TouchableOpacity, Alert } from "react-native";
import "@/global.css"
import { Input, InputField } from "@/components/ui/input";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { Eye, EyeOff, MailOpen, Lock } from 'lucide-react-native';
import { useState, useEffect } from "react";
import { api } from "@/src/services/api";
import { setToken } from "@/src/services/storage";

export default function ForgetPassword() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();

  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(true);
  const [messageError, setMessageError] = useState("");

  useEffect(() => {
    if (!email) return;
    api.get(`/recuperarSenha/enviarEmail?email=${email}`)
      .then(() => setSendingEmail(false))
      .catch(() => setSendingEmail(false));
  }, [email]);

  const handleReenviarCodigo = () => {
    if (!email) return;
    setSendingEmail(true);
    api.get(`/recuperarSenha/enviarEmail?email=${email}`)
      .then(() => {
        Alert.alert("Sucesso", "Um novo código foi enviado para seu e-mail.");
        setSendingEmail(false);
      })
      .catch(() => {
        Alert.alert("Erro", "Não foi possível enviar o código. Tente novamente.");
        setSendingEmail(false);
      });
  };

  const handleAlterarSenha = () => {
    setMessageError("");

    if (!codigo) {
      return setMessageError("Digite o código enviado no seu e-mail.");
    }
    if (!novaSenha) {
      return setMessageError("Digite a nova senha.");
    }
    if (novaSenha !== confirmarSenha) {
      return setMessageError("As senhas não coincidem.");
    }

    setLoading(true);

    api.post("/recuperarSenha/validarCodigo", { email, codigo })
      .then(response => {
        const tokenReset = response.data;
        return api.post("/recuperarSenha/alterarSenha", {
          senha: novaSenha,
          confirmarSenha,
          tokenReset,
        });
      })
      .then(() => {
        return api.post("/authenticate", { username: email, password: novaSenha });
      })
      .then(async response => {
        await setToken(response.data);
        router.replace("/home");
      })
      .catch(error => {
        setMessageError(error.response?.data || "Erro ao alterar senha. Tente novamente.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
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
            <Text className="font-black text-4xl text-velvet-orchid-700 mb-4">
              Recuperar senha
            </Text>

            <View className="mb-6 p-3 rounded-2xl border bg-purple-x11-50 border-purple-x11-100">
              <Text className="text-center font-bold text-xs text-purple-x11-700">
                {sendingEmail
                  ? "Enviando código para seu e-mail..."
                  : `Um código foi enviado para ${email}`}
              </Text>
            </View>

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
                  className="text-velvet-orchid-900 placeholder:text-velvet-orchid-600"
                  value={codigo}
                  onChangeText={setCodigo}
                />
              </Input>
            </View>
            
            <View className="mb-5">
              <Text className="text-velvet-orchid-700 font-semibold mb-2 ml-1">Nova senha</Text>
              <Input
                variant="rounded"
                className="border-velvet-orchid-300 bg-white h-14 px-4 focus:border-velvet-orchid-700"
              >
                <Lock size={20} color="#7b4d91" className="mr-2" />
                <InputField
                  placeholder="Crie uma senha forte"
                  secureTextEntry={!passwordVisible}
                  className="text-velvet-orchid-900 flex-1 placeholder:text-velvet-orchid-600"
                  value={novaSenha}
                  onChangeText={setNovaSenha}
                />
                <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} className="pr-2">
                  {passwordVisible ? 
                    <EyeOff size={22} color="#7b4d91" /> : 
                    <Eye size={22} color="#7b4d91" />
                  }
                </TouchableOpacity>
              </Input>
            </View>

            <View className="mb-2">
              <Text className="text-velvet-orchid-700 font-semibold mb-2 ml-1">Confirmar senha</Text>
              <Input
                variant="rounded"
                className="border-velvet-orchid-300 bg-white h-14 px-4 focus:border-velvet-orchid-700"
              >
                <Lock size={20} color="#7b4d91" className="mr-2" />
                <InputField
                  placeholder="Repita a nova senha"
                  secureTextEntry={!passwordVisible}
                  className="text-velvet-orchid-900 flex-1 placeholder:text-velvet-orchid-600"
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                />
              </Input>
            </View>

            <TouchableOpacity className="self-end mb-10 mt-2">
              <Link href={"/login"} className=" text-purple-x11-700 underline">
                Lembrou a senha?
              </Link>
            </TouchableOpacity>

            <TouchableOpacity className="self-end mb-6" onPress={handleReenviarCodigo} disabled={sendingEmail}>
              <Text className={`font-bold text-xs underline ${sendingEmail ? "text-gray-400" : "text-purple-x11-700"}`}>
                Reenviar código
              </Text>
            </TouchableOpacity>
            
            <Pressable
              className="bg-velvet-orchid-700 w-full h-14 rounded-2xl flex items-center justify-center shadow-lg active:opacity-90 active:scale-[0.98] transition-all"
              onPress={handleAlterarSenha}
              disabled={loading}
            >
              {loading ? (
                <Text className="text-white font-bold text-lg">Carregando...</Text>
              ) : (
                <Text className="text-white font-bold text-lg">Alterar senha</Text>
              )}
            </Pressable>

            {messageError ? (
              <View className="mt-4 mb-5 p-3 rounded-2xl border bg-red-50 border-red-200">
                <Text className="text-center font-bold text-xs text-red-700">
                  {messageError}
                </Text>
              </View>
            ) : null}
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
