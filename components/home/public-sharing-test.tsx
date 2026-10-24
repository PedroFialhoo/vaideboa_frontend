import { Client } from "@stomp/stompjs";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { AppState, Linking, Share, Text, TouchableOpacity, View } from "react-native";
import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";
import { obterLinkCompartilhamento, LinkCompartilhamento } from "@/src/services/compartilhamento";
import { positionAt, routeLength, simulationRoute } from "./simulation-route";

const RIDE_ID = 21;
const SPEED = 40 / 3.6;

export default function PublicSharingTest() {
  const client = useRef<Client | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const generation = useRef(0);
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState("Simulação parada.");
  const [error, setError] = useState("");
  const [link, setLink] = useState<LinkCompartilhamento | null>(null);
  const [meters, setMeters] = useState(0);
  const [position, setPosition] = useState<typeof simulationRoute[number] | null>(null);

  const stop = useCallback(() => {
    generation.current++;
    running.current = false;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    const previous = client.current;
    client.current = null;
    if (previous) void previous.deactivate();
  }, []);

  useFocusEffect(useCallback(() => {
    setBusy(false);
    setActive(false);
    setStatus("Simulação parada. A carona não é finalizada ao parar.");
    const subscription = AppState.addEventListener("change", state => {
      if (state !== "active") {
        stop();
        setBusy(false);
        setActive(false);
        setStatus("Simulação interrompida ao sair do primeiro plano.");
      }
    });
    return () => { subscription.remove(); stop(); };
  }, [stop]));

  function fail(failure: unknown) {
    stop();
    setBusy(false);
    setActive(false);
    const response = (failure as { response?: { data?: unknown } })?.response;
    setError(typeof response?.data === "string" ? response.data
      : failure instanceof Error ? failure.message : "Falha ao executar o teste.");
    setStatus("Simulação interrompida. Confira o estado da carona antes de tentar novamente.");
  }

  async function start() {
    if (running.current) return;
    running.current = true;
    const id = ++generation.current;
    const current = () => generation.current === id;
    setBusy(true);
    setError("");
    setLink(null);
    setMeters(0);
    setPosition(null);
    try {
      const token = await getToken();
      if (!current()) return;
      if (!token) throw new Error("Entre com a conta do motorista da carona 21.");
      const options = { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 };
      setStatus("Verificando carona 21...");
      const { data } = await api.get(`/carona/buscar/${RIDE_ID}`, options);
      if (!current()) return;
      if (data.statusCarona !== "EM_ANDAMENTO") {
        setStatus("Iniciando carona 21...");
        await api.get(`/carona/iniciar/${RIDE_ID}`, options);
        if (!current()) return;
      }
      const sharing = await obterLinkCompartilhamento(RIDE_ID);
      if (!current()) return;
      setLink(sharing);
      console.log(`[Teste de compartilhamento • Carona ${RIDE_ID}] Link público: ${sharing.url}`);
      setStatus("Conectando ao envio de posições...");
      const socket = new Client({
        brokerURL: `${api.defaults.baseURL?.replace(/^http/, "ws").replace(/\/$/, "")}/ws`,
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 0, connectionTimeout: 10000,
        heartbeatIncoming: 0, heartbeatOutgoing: 10000,
        forceBinaryWSFrames: true, appendMissingNULLonIncoming: true,
      });
      client.current = socket;
      socket.onConnect = () => {
        if (!current()) return;
        setBusy(false);
        setActive(true);
        setStatus("Simulando a 40 km/h. Envio a cada 2 segundos.");
        let traveled = 0;
        let lastTick = Date.now();
        const publish = () => {
          if (!current() || !socket.connected) return;
          try {
            const now = Date.now();
            // Limita atrasos para não saltar o trajeto após suspensão do navegador.
            traveled = Math.min(routeLength, traveled + SPEED * Math.min((now - lastTick) / 1000, 2));
            lastTick = now;
            const point = positionAt(traveled);
            socket.publish({ destination: `/app/carona/${RIDE_ID}/localizacao`,
              headers: { "content-type": "application/json" }, body: JSON.stringify(point) });
            setMeters(traveled);
            setPosition(point);
            if (traveled >= routeLength) {
              if (timer.current) clearInterval(timer.current);
              timer.current = null;
              setStatus("Percurso concluído. A carona continua em andamento.");
              stop();
              setActive(false);
            }
          } catch (failure) { if (current()) fail(failure); }
        };
        publish();
        if (current()) timer.current = setInterval(publish, 2000);
      };
      socket.onStompError = frame => {
        if (current()) fail(new Error(frame.headers.message || "O servidor rejeitou o envio de posições."));
      };
      socket.onWebSocketError = () => {
        if (current()) fail(new Error("Falha no WebSocket. Verifique a conexão com o backend."));
      };
      socket.onWebSocketClose = () => {
        if (current()) fail(new Error("Conexão encerrada. Inicie novamente para repetir o percurso."));
      };
      socket.activate();
    } catch (failure) { if (current()) fail(failure); }
  }

  return (
    <View className="mx-6 mt-8 p-5 rounded-3xl bg-platinum-50 border border-purple-x11-200">
      <Text className="text-velvet-orchid-900 font-black text-lg">Teste público • Carona 21</Text>
      <Text className="text-velvet-orchid-700 mt-2">Usa o motorista logado e grava posições simuladas na carona 21. Mantenha a Home aberta em primeiro plano.</Text>
      <Text className="text-velvet-orchid-700 mt-2">{simulationRoute.length} pontos • {(routeLength / 1000).toFixed(2)} km • aproximadamente {Math.ceil(routeLength / SPEED / 60)} min a 40 km/h.</Text>
      <Text className="text-velvet-orchid-900 mt-3 font-bold" accessibilityLiveRegion="polite">{status}</Text>
      <Text className="text-velvet-orchid-700 mt-2">Progresso: {Math.floor(meters / routeLength * 100)}%{position ? ` • ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}` : ""}</Text>
      {link && <View className="mt-3">
        <Text selectable className="text-velvet-orchid-900">{link.url}</Text>
        <Text className="text-velvet-orchid-700 mt-1">Expira em: {new Date(link.expiraEm).toLocaleString("pt-BR")}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => { void Share.share({ message: link.url }).catch(failure => setError(String(failure))); }} className="mt-3 p-3 rounded-xl bg-purple-x11-100">
          <Text className="text-velvet-orchid-900 font-bold">Compartilhar link público</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="link" onPress={() => { void Linking.openURL(link.url).catch(() => setError("Não foi possível abrir o link.")); }} className="mt-3 p-3 rounded-xl bg-purple-x11-100">
          <Text className="text-velvet-orchid-900 font-bold">Abrir acompanhamento</Text>
        </TouchableOpacity>
      </View>}
      {!!error && <Text accessibilityRole="alert" className="text-velvet-orchid-900 mt-3 font-bold">{error}</Text>}
      <TouchableOpacity accessibilityRole="button" disabled={busy || active} onPress={() => void start()} className={`mt-4 p-4 rounded-2xl bg-purple-x11-700 items-center ${busy || active ? "opacity-50" : ""}`}>
        <Text className="text-white font-bold">Iniciar carona 21 e simular percurso</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" disabled={!busy && !active} onPress={() => { stop(); setBusy(false); setActive(false); setStatus("Envios interrompidos. A carona continua em andamento."); }} className={`mt-3 p-4 rounded-2xl bg-velvet-orchid-700 items-center ${!busy && !active ? "opacity-50" : ""}`}>
        <Text className="text-white font-bold">Parar simulação</Text>
      </TouchableOpacity>
      <Text className="text-velvet-orchid-700 mt-2">Parar ou concluir o percurso mantém a carona iniciada. Repetir começa do primeiro ponto. Abra o link em outro aparelho para acompanhar durante o teste.</Text>
    </View>
  );
}
