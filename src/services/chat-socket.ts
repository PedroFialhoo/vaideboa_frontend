import { Client, StompSubscription } from "@stomp/stompjs";
import { api } from "@/src/services/api";
import { chatHeaders, Mensagem } from "./chat";

type Listener = { reserva: number; message: (m: Mensagem) => void; connected: () => void; status: (s: string) => void; subscription?: StompSubscription };
const listeners = new Set<Listener>();
let client: Client | undefined;
function subscribe(listener: Listener) {
  if (!client?.connected) return;
  listener.subscription = client.subscribe(`/topic/chat/${listener.reserva}`, frame => {
    try {
      const m: Mensagem = JSON.parse(frame.body);
      if (m.idReserva === listener.reserva && Number.isSafeInteger(m.id) && Number.isSafeInteger(m.idAutor) && typeof m.mensagem === "string" && typeof m.enviadoEm === "string") listener.message(m);
    } catch { listener.status("Mensagem inválida recebida. Sincronize o histórico."); }
  });
  // Spring SimpleBroker não suporta RECEIPT. A sincronização periódica cobre essa janela.
  listener.connected();
}
export function acompanharChat(listener: Listener) {
  listeners.add(listener);
  if (!client) {
    const activeClient = new Client({
      brokerURL: `${api.defaults.baseURL?.replace(/^http/, "ws").replace(/\/$/, "")}/ws`,
      reconnectDelay: 5000, connectionTimeout: 10000, heartbeatIncoming: 0, heartbeatOutgoing: 10000,
      forceBinaryWSFrames: true, appendMissingNULLonIncoming: true,
      beforeConnect: async () => {
        try { activeClient.connectHeaders = await chatHeaders(); }
        catch { listeners.forEach(l => l.status("Faça login novamente para conectar ao chat.")); await activeClient.deactivate(); }
      },
      onConnect: () => { if (client === activeClient) listeners.forEach(subscribe); },
      onWebSocketClose: () => { if (client === activeClient) listeners.forEach(l => { l.subscription = undefined; l.status("Desconectado. Tentando reconectar..."); }); },
      onStompError: frame => { if (client === activeClient) listeners.forEach(l => l.status(frame.headers.message || frame.body || "O servidor recusou o chat.")); },
      onWebSocketError: () => { if (client === activeClient) listeners.forEach(l => l.status("Falha na conexão. Tentando recuperar...")); },
    });
    client = activeClient;
    client.activate();
  } else subscribe(listener);
  return () => {
    listeners.delete(listener);
    if (client?.connected) listener.subscription?.unsubscribe();
    if (!listeners.size) { const old = client; client = undefined; void old?.deactivate(); }
  };
}
