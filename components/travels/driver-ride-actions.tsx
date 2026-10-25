import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Share, Text, TouchableOpacity, View } from "react-native";
import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";
import { obterLinkCompartilhamento } from "@/src/services/compartilhamento";
import PublicSharingTest from "./public-sharing-test";

export default function DriverRideActions({ id }: { id: number }) {
  const router = useRouter();
  const lock = useRef(false);
  const [busy, setBusy] = useState<"start" | "share" | null>(null);
  const [error, setError] = useState("");
  const [showTest, setShowTest] = useState(false);

  async function perform(action: "start" | "share") {
    if (lock.current) return;
    lock.current = true;
    setBusy(action);
    setError("");
    try {
      if (action === "share") {
        const { url } = await obterLinkCompartilhamento(id);
        await Share.share({ message: `Acompanhe minha carona no Vai de Boa: ${url}` });
      } else {
        const token = await getToken();
        if (!token) throw new Error("Sessão expirada. Entre novamente para iniciar a carona.");
        const options = { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 };
        const { data } = await api.get(`/carona/buscar/${id}`, options);
        if (data.statusCarona === "CANCELADA" || data.statusCarona === "CONCLUIDA") throw new Error("Esta carona não pode ser iniciada.");
        if (data.realizado) throw new Error("Esta carona já foi realizada.");
        if (data.statusCarona !== "EM_ANDAMENTO") {
          await api.get(`/carona/iniciar/${id}`, options);
        }
        router.push({ pathname: "/ride-tracking/[id]", params: { id: String(id) } });
      }
    } catch (failure: any) {
      setError(typeof failure.response?.data === "string" ? failure.response.data
        : failure instanceof Error ? failure.message : "Não foi possível concluir a ação.");
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }

  return <View className="px-5 pb-5">
    {!showTest && <TouchableOpacity accessibilityRole="button" disabled={busy !== null} onPress={() => void perform("start")}
      className={`p-4 rounded-2xl bg-purple-x11-700 items-center ${busy ? "opacity-50" : ""}`}>
      <Text className="text-white font-bold">{busy === "start" ? "Abrindo carona..." : "Iniciar / acompanhar carona"}</Text>
    </TouchableOpacity>}
    <TouchableOpacity accessibilityRole="button" disabled={busy !== null} onPress={() => void perform("share")}
      className={`mt-3 p-4 rounded-2xl bg-velvet-orchid-700 items-center ${busy ? "opacity-50" : ""}`}>
      <Text className="text-white font-bold">{busy === "share" ? "Obtendo link..." : "Compartilhar carona"}</Text>
    </TouchableOpacity>
    {!!error && <Text accessibilityRole="alert" className="text-velvet-orchid-900 mt-3 font-bold">{error}</Text>}
    {__DEV__ && id === 21 && <>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: showTest }} disabled={busy !== null}
        onPress={() => setShowTest(value => !value)} className="mt-3 p-3 rounded-xl bg-purple-x11-100 items-center">
        <Text className="text-velvet-orchid-900 font-bold">{showTest ? "Fechar e parar teste" : "Teste de compartilhamento público"}</Text>
      </TouchableOpacity>
      {showTest && <PublicSharingTest />}
    </>}
  </View>;
}
