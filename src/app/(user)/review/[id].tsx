import "@/global.css";
import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ShieldCheck, Star, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Ride = {
  data: string;
  destinoTexto: string;
  hora: string;
  nome: string;
  saidaTexto: string;
};

const NOTA_LABELS = ["Péssima", "Ruim", "Razoável", "Boa", "Ótima"];

export default function Review() {
  const { id, idReserva, nome } = useLocalSearchParams<{
    id: string;
    idReserva?: string;
    nome?: string;
  }>();
  const router = useRouter();
  const [ride, setRide] = useState<Ride | null>(null);
  const [avaliadoNome, setAvaliadoNome] = useState("");
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messageError, setMessageError] = useState("");

  const idReservaNum = idReserva ? Number(idReserva) : null;

  useEffect(() => {
    if (!id) return;

    getToken().then((token) => {
      if (!token) return;

      api
        .get(`/carona/buscar/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          console.log("Carona:", response.data);
          setRide(response.data);
        })
        .catch((error) => console.log(error))
        .finally(() => setLoading(false));
    });
  }, [id]);

  useEffect(() => {
    if (nome) setAvaliadoNome(nome);
  }, [nome]);

  const handleSubmit = () => {
    setMessageError("");

    if (!idReservaNum) {
      setMessageError(
        "Não foi possível identificar sua reserva. Tente novamente mais tarde."
      );
      return;
    }

    if (nota < 1) {
      setMessageError("Dê uma nota de 1 a 5 para enviar a avaliação!");
      return;
    }

    setSaving(true);
    getToken().then((token) => {
      api
        .post(
          "/avaliacao/cadastrar",
          { idReserva: idReservaNum, estrela: nota, mensagem: comentario },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        .then(() => {
          router.replace({
            pathname: "/page-sucess",
            params: {
              sucess: "true",
              message: "Avaliação enviada com sucesso!",
              to: `/ride-details/${id}`,
            },
          });
        })
        .catch((error) => {
          console.log("Erro ao enviar avaliação:", error);
          setMessageError(
            error.response?.data || "Erro ao enviar avaliação. Tente novamente."
          );
        })
        .finally(() => setSaving(false));
    });
  };

  if (loading || !ride) {
    return (
      <View className="flex-1 items-center justify-center bg-platinum">
        <ActivityIndicator size="large" color="#7b4d91" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-platinum">
      <TouchableOpacity
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/travels");
          }
        }}
        className="absolute top-12 left-6 z-20 bg-white/90 p-2 rounded-xl shadow-md"
      >
        <ChevronLeft size={24} color="#391f47" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        className="bg-platinum"
      >
        {/* HEADER */}
        <View className="bg-velvet-orchid-900 pt-20 pb-12 px-8 rounded-b-[40px] shadow-xl">
          <Text className="text-white font-black text-3xl">Avaliar Carona</Text>
          <Text className="text-purple-x11-200 text-sm font-medium mt-1">
            Como foi sua experiência com{" "}
            {avaliadoNome ? avaliadoNome.split(" ")[0] : "o usuário"}?
          </Text>
        </View>

        {/* CARD DE AVALIAÇÃO */}
        <View className="flex-1 px-6 -mt-6 pb-12">
          <View className="bg-white rounded-[32px] p-6 shadow-lg border border-purple-x11-50">
            {/* QUEM ESTÁ SENDO AVALIADO */}
            <View className="flex-row items-center mb-8">
              <View className="bg-purple-x11-100 w-16 h-16 rounded-full items-center justify-center mr-4">
                <User size={28} color="#7b4d91" />
              </View>
              <View className="flex-1">
                <Text
                  numberOfLines={1}
                  className="text-velvet-orchid-900 font-black text-xl"
                >
                  {avaliadoNome || "Usuário"}
                </Text>
                <View className="flex-row items-center">
                  <ShieldCheck size={12} color="#7b4d91" />
                  <Text className="text-gray-600 text-[10px] font-bold uppercase ml-1">
                    Outro participante
                  </Text>
                </View>
              </View>
            </View>

            {/* DETALHES DA CARONA */}
            <View className="bg-platinum/40 rounded-3xl p-4 mb-8 border border-purple-x11-50">
              <Text className="text-purple-x11-400 text-[10px] font-black uppercase tracking-widest mb-1">
                {ride.data.split("-").reverse().join("/")} •{" "}
                {ride.hora.slice(0, 5)}
              </Text>
              <Text
                numberOfLines={1}
                className="text-velvet-orchid-900 font-bold text-sm"
              >
                {ride.saidaTexto} → {ride.destinoTexto}
              </Text>
            </View>

            {/* AVISO: RESERVA NÃO IDENTIFICADA */}
            {!idReservaNum && (
              <View className="mb-6 p-3 rounded-2xl border bg-amber-50 border-amber-200">
                <Text className="text-center font-bold text-xs text-amber-700">
                  Não foi possível identificar sua reserva desta carona. O envio
                  da avaliação será liberado quando o idReserva estiver
                  disponível (integração com o backend pendente).
                </Text>
              </View>
            )}

            {/* NOTA 1-5 */}
            <Text className="text-velvet-orchid-900 font-black text-lg mb-3">
              Sua nota
            </Text>
            <View className="flex-row justify-between mb-2 px-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <TouchableOpacity
                  key={value}
                  activeOpacity={0.8}
                  onPress={() => setNota(value)}
                >
                  <Star
                    size={40}
                    color={value <= nota ? "#8e4eb1" : "#e4e3e8"}
                    fill={value <= nota ? "#8e4eb1" : "transparent"}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text className="text-center text-gray-600 font-bold text-sm mb-6">
              {nota > 0 ? NOTA_LABELS[nota - 1] : "Toque para avaliar"}
            </Text>

            {/* COMENTÁRIO */}
            <Text className="text-velvet-orchid-900 font-black text-lg mb-3">
              Comentário (opcional)
            </Text>
            <TextInput
              value={comentario}
              onChangeText={setComentario}
              multiline
              numberOfLines={4}
              placeholder="Conte como foi sua experiência..."
              placeholderTextColor="#a571c1"
              textAlignVertical="top"
              className="bg-platinum/40 border border-purple-x11-100 rounded-3xl p-4 h-28 text-velvet-orchid-900 font-semibold mb-6 text-base"
            />

            {/* MENSAGEM DE ERRO */}
            {messageError && (
              <View className="mb-4 p-3 rounded-2xl border bg-red-50 border-red-200">
                <Text className="text-center font-bold text-xs text-red-700">
                  {messageError}
                </Text>
              </View>
            )}

            {/* BOTÃO ENVIAR */}
            <Pressable
              onPress={handleSubmit}
              disabled={saving || nota < 1 || !idReservaNum}
              className="bg-velvet-orchid-700 h-16 rounded-2xl items-center justify-center shadow-lg active:scale-[0.97]"
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-black text-lg">
                  Enviar Avaliação
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
