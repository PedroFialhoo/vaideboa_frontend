import { useRef, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";

export default function CancelRideAction({ id, onRefresh, onMessage, onBlockedChange }: {
  id: number;
  onRefresh: () => Promise<void>;
  onMessage: (message: string) => void;
  onBlockedChange: (blocked: boolean) => void;
}) {
  const status = "EM_ESPERA";
  const lock = useRef(false);
  const [busy, setBusy] = useState<"cancel" | "refresh" | null>(null);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  async function refreshAfterFailure() {
    if (lock.current) return;
    lock.current = true;
    setBusy("refresh");
    try {
      await onRefresh();
      setNeedsRefresh(false);
      onBlockedChange(false);
      setError("");
    } catch {
      setError("Não foi possível atualizar os dados. Atualize antes de tentar novamente.");
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }

  async function cancelRide() {
    if (lock.current || needsRefresh) return;
    lock.current = true;
    setBusy("cancel");
    onBlockedChange(true);
    setError("");
    let cancelled = false;
    try {
      const token = await getToken();
      if (!token) {
        onBlockedChange(false);
        setError("Sessão expirada. Entre novamente para cancelar a carona.");
        return;
      }
      const response = await api.get(`/carona/cancelar/${id}`, {
        headers: { Authorization: `Bearer ${token}` }, timeout: 15000,
      });
      cancelled = true;
      setNeedsRefresh(true);
      setConfirmCancel(false);
      onMessage(typeof response.data === "string" ? response.data : "Carona cancelada com sucesso");
      await onRefresh();
    } catch (failure: any) {
      setConfirmCancel(false);
      if (cancelled) {
        setError("Carona cancelada. Não foi possível atualizar a lista. Atualize os dados.");
      } else if (failure.response) {
        onBlockedChange(false);
        setError(typeof failure.response.data === "string" ? failure.response.data : "Não foi possível cancelar a carona.");
      } else {
        setNeedsRefresh(true);
        setError("Não foi possível confirmar o cancelamento. Atualize os dados antes de tentar novamente.");
        try {
          await onRefresh();
          setNeedsRefresh(false);
      onBlockedChange(false);
        } catch { /* As ações permanecem bloqueadas até atualizar os dados. */ }
      }
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }

  return <View>
    {status === "EM_ESPERA" && <TouchableOpacity accessibilityRole="button" disabled={busy !== null || needsRefresh}
      onPress={() => setConfirmCancel(true)}
      className={`mt-3 p-3 rounded-2xl border border-velvet-orchid-200 items-center ${busy || needsRefresh ? "opacity-50" : ""}`}>
      <Text className="text-velvet-orchid-900 font-bold">{busy === "cancel" ? "Cancelando…" : "Cancelar carona"}</Text>
    </TouchableOpacity>}
    {needsRefresh && <TouchableOpacity accessibilityRole="button" disabled={busy !== null} onPress={() => void refreshAfterFailure()} className="mt-3 p-3 items-center">
      <Text className="text-velvet-orchid-900 font-bold">{busy === "refresh" ? "Atualizando…" : "Atualizar dados"}</Text>
    </TouchableOpacity>}
    <Modal visible={confirmCancel} transparent animationType="fade" onRequestClose={() => { if (!lock.current) setConfirmCancel(false); }}>
      <View className="flex-1 justify-center px-6 bg-black/50">
        <View className="bg-white rounded-3xl p-6">
          <Text className="text-velvet-orchid-900 text-xl font-bold mb-3">Deseja cancelar esta carona?</Text>
          <Text className="text-velvet-orchid-900 mb-5">As reservas aceitas e os pedidos pendentes serão cancelados.{"\n"}Os passageiros envolvidos serão notificados.</Text>
          <TouchableOpacity accessibilityRole="button" disabled={busy !== null} onPress={() => void cancelRide()} className="bg-velvet-orchid-700 rounded-2xl p-4 items-center">
            <Text className="text-white font-bold">{busy === "cancel" ? "Cancelando…" : "Cancelar carona"}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" disabled={busy !== null} onPress={() => setConfirmCancel(false)} className="p-4 items-center mt-2">
            <Text className="text-velvet-orchid-900 font-bold">Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    {!!error && <Text accessibilityRole="alert" className="text-velvet-orchid-900 mt-3 font-bold">{error}</Text>}
  </View>;
}
