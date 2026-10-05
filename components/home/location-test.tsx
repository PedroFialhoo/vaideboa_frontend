import { Client } from "@stomp/stompjs";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";

const RIDE_ID = 10;
type Position = { latitude: number; longitude: number };

function errorMessage(error: unknown) {
  const response = (error as { response?: { data?: unknown } })?.response;
  if (typeof response?.data === "string") return response.data;
  return error instanceof Error ? error.message : "Não foi possível concluir o teste.";
}

export default function LocationTest() {
  const clientRef = useRef<Client | null>(null);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const generationRef = useRef(0);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState("Compartilhamento parado.");
  const [error, setError] = useState("");
  const [sent, setSent] = useState<Position | null>(null);
  const [received, setReceived] = useState<Position | null>(null);
  const [points, setPoints] = useState(0);

  const stop = useCallback(() => {
    generationRef.current += 1;
    watcherRef.current?.remove();
    watcherRef.current = null;
    const client = clientRef.current;
    clientRef.current = null;
    if (client) void client.deactivate();
  }, []);

  useFocusEffect(useCallback(() => {
    setActive(false);
    setStatus("Compartilhamento parado.");
    setBusy(false);
    busyRef.current = false;
    return stop;
  }, [stop]));

  async function start() {
    if (busyRef.current || clientRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setSent(null);
    setReceived(null);
    setPoints(0);
    const generation = ++generationRef.current;
    const current = () => generationRef.current === generation;
    let started = false;
    try {
      const token = await getToken();
      if (!current()) return;
      if (!token) throw new Error("Faça login para testar a carona 10.");
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!current()) return;
      if (!permission.granted) throw new Error("Permita o acesso à localização para iniciar o teste.");
      setStatus("Iniciando carona 10...");
      await api.get(`/carona/iniciar/${RIDE_ID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!current()) return;
      started = true;
      setStatus("Carona iniciada. Conectando ao compartilhamento...");
      const client = new Client({
        brokerURL: `${api.defaults.baseURL?.replace(/^http/, "ws").replace(/\/$/, "")}/ws`,
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        connectionTimeout: 10000,
        heartbeatIncoming: 0,
        heartbeatOutgoing: 10000,
        forceBinaryWSFrames: true,
        appendMissingNULLonIncoming: true,
      });
      clientRef.current = client;
      const publish = (position: Position) => {
        if (!current() || !client.connected) return;
        client.publish({
          destination: `/app/carona/${RIDE_ID}/localizacao`,
          body: JSON.stringify({ latitude: position.latitude, longitude: position.longitude }),
          headers: { "content-type": "application/json" },
        });
        setSent({ latitude: position.latitude, longitude: position.longitude });
      };
      const readPosition = (body: string): Position => {
        const value = JSON.parse(body);
        if (!Number.isFinite(value.latitude) || !Number.isFinite(value.longitude)) {
          throw new Error("Coordenadas inválidas recebidas do servidor.");
        }
        return { latitude: value.latitude, longitude: value.longitude };
      };
      client.onConnect = () => {
        if (!current()) return;
        setError("");
        setStatus("Conectado. Enviando localização em primeiro plano.");
        client.subscribe(`/topic/carona/${RIDE_ID}`, (message) => {
          if (!current()) return;
          try { setReceived(readPosition(message.body)); }
          catch (failure) { setError(errorMessage(failure)); }
        });
        client.subscribe(`/user/queue/carona/${RIDE_ID}/trajeto`, (message) => {
          if (!current()) return;
          try {
            const route: unknown = JSON.parse(message.body);
            if (!Array.isArray(route)) throw new Error("Trajeto inválido recebido do servidor.");
            setPoints(route.length);
          } catch (failure) { setError(errorMessage(failure)); }
        });
        client.publish({ destination: `/app/carona/${RIDE_ID}/trajeto`, body: "" });
        void Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
          .then((location) => publish(location.coords))
          .catch((failure) => { if (current()) setError(errorMessage(failure)); });
      };
      client.onStompError = (frame) => {
        if (!current()) return;
        setError(frame.headers.message || frame.body || "O backend rejeitou a conexão STOMP.");
        setStatus("Compartilhamento rejeitado pelo servidor.");
        stop();
        setActive(false);
      };
      client.onWebSocketClose = () => {
        if (current()) setStatus("Conexão interrompida. Tentando reconectar...");
      };
      client.onWebSocketError = () => {
        if (current()) setError("Falha no WebSocket. Verifique o backend e a conexão de rede.");
      };
      client.activate();
      const watcher = await Location.watchPositionAsync({
        accuracy: Location.Accuracy.High,
        distanceInterval: 0,
        timeInterval: 5000,
      }, (location) => publish(location.coords));
      if (!current()) { watcher.remove(); return; }
      watcherRef.current = watcher;
      setActive(true);
    } catch (failure) {
      if (current()) {
        stop();
        setActive(false);
        setStatus(started ? "Carona iniciada, mas o compartilhamento falhou. Tente iniciar novamente." : "Não foi possível iniciar a carona.");
        setError(errorMessage(failure));
      }
    } finally {
      if (current() || generationRef.current === generation + 1) {
        busyRef.current = false;
        setBusy(false);
      }
    }
  }

  async function finish() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    const generation = generationRef.current;
    try {
      const token = await getToken();
      if (generationRef.current !== generation) return;
      if (!token) throw new Error("Faça login para finalizar a carona 10.");
      await api.get(`/carona/finalizar/${RIDE_ID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (generationRef.current !== generation) return;
      stop();
      setActive(false);
      setStatus("Carona 10 realizada e compartilhamento finalizado.");
    } catch (failure) {
      if (generationRef.current === generation) setError(errorMessage(failure));
    } finally {
      if (generationRef.current === generation || generationRef.current === generation + 1) {
        busyRef.current = false;
        setBusy(false);
      }
    }
  }

  return (
    <View className="mx-6 mt-8 p-5 rounded-3xl bg-platinum-50 border border-purple-x11-200">
      <Text className="text-velvet-orchid-900 font-black text-lg">Teste de localização • Carona 10</Text>
      <Text className="text-velvet-orchid-700 mt-2">Use a conta do motorista. O envio funciona com a Home aberta e o app em primeiro plano.</Text>
      <Text className="text-velvet-orchid-900 mt-3 font-bold">{status}</Text>
      <Text className="text-velvet-orchid-700 mt-2">Último envio: {sent ? `${sent.latitude.toFixed(6)}, ${sent.longitude.toFixed(6)}` : "aguardando"}</Text>
      <Text className="text-velvet-orchid-700 mt-1">Recebido do servidor: {received ? `${received.latitude.toFixed(6)}, ${received.longitude.toFixed(6)}` : "aguardando"}</Text>
      <Text className="text-velvet-orchid-700 mt-1">Pontos recuperados do trajeto: {points}</Text>
      {!!error && <Text accessibilityRole="alert" className="text-velvet-orchid-900 mt-3 font-bold">{error}</Text>}
      <TouchableOpacity accessibilityRole="button" disabled={busy || active} onPress={() => void start()} className={`mt-4 p-4 rounded-2xl bg-purple-x11-700 items-center ${busy || active ? "opacity-50" : ""}`}>
        <Text className="text-white font-bold">Iniciar carona 10</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => void finish()} className={`mt-3 p-4 rounded-2xl bg-velvet-orchid-700 items-center ${busy ? "opacity-50" : ""}`}>
        <Text className="text-white font-bold">Finalizar compartilhamento</Text>
      </TouchableOpacity>
      <Text className="text-velvet-orchid-700 mt-2">Ao finalizar, a carona 10 também será marcada como realizada.</Text>
    </View>
  );
}
