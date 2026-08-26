import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Clock,
  MapPin,
  Navigation,
  PlusCircle,
  Search,
  Star,
} from "lucide-react-native";

import { useFocusEffect, useRouter } from "expo-router";

import "@/global.css";

import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Logo from "../../../assets/images/logo-vdb.svg";

import { Client } from "@stomp/stompjs";

import * as Location from "expo-location";

// ID da carona usado no teste (depois isso vem de navegação/params)
const ID_CARONA = 10;

export default function Home() {

  const router = useRouter();

  const [name, setName] =
    useState<string | null>(null);

  const [conectado, setConectado] =
    useState(false);

  const [caronaIniciada, setCaronaIniciada] =
    useState(false);

  const [carregando, setCarregando] =
    useState(false);

  const stompClient =
    useRef<Client | null>(null);

  const locationInterval =
    useRef<ReturnType<typeof setInterval> | null>(null);


  // =========================================================
  // BUSCAR USUÁRIO
  // =========================================================

  function getUser() {

    getToken().then((token) => {

      if (!token) {
        return;
      }

      api.get("/user/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {

        setName(response.data.nome);

      })
      .catch((error) => {

        console.error(
          "Erro ao buscar usuário:",
          error
        );

      });

    });

  }


  useEffect(() => {

    getUser();

  }, []);


  useFocusEffect(
    useCallback(() => {

      getUser();

    }, [])
  );


  // =========================================================
  // ENVIAR LOCALIZAÇÃO REAL (uma vez)
  // =========================================================

  async function enviarLocalizacaoAtual(client: Client) {

    try {

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const destino =
        `/app/carona/${ID_CARONA}/localizacao`;

      const corpo =
        JSON.stringify({

          latitude: location.coords.latitude,

          longitude: location.coords.longitude,

        });

      console.log(
        "[LOCALIZAÇÃO] Enviando:",
        corpo
      );

      client.publish({

        destination:
          destino,

        body:
          corpo,

      });

    } catch (error) {

      console.error(
        "[LOCALIZAÇÃO] Erro ao obter/enviar localização:",
        error
      );

    }

  }


  // =========================================================
  // INICIAR ENVIO PERIÓDICO (a cada 5s)
  // =========================================================

  function iniciarEnvioPeriodico(client: Client) {

    if (locationInterval.current) {

      clearInterval(locationInterval.current);

      locationInterval.current = null;

    }

    enviarLocalizacaoAtual(client);

    locationInterval.current = setInterval(() => {

      enviarLocalizacaoAtual(client);

    }, 5000);

  }


  // =========================================================
  // CONECTAR WEBSOCKET / STOMP
  // =========================================================

  async function conectarWebSocket() {

    if (stompClient.current) {

      console.log(
        "Já existe um cliente STOMP."
      );

      return;

    }

    const token = await getToken();

    if (!token) {

      console.error(
        "Nenhum token encontrado. Faça login antes de testar o WebSocket."
      );

      Alert.alert(
        "Erro",
        "Você precisa estar logado para testar o WebSocket."
      );

      return;

    }

    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {

      console.error(
        "Permissão de localização negada."
      );

      Alert.alert(
        "Permissão necessária",
        "Precisamos da sua localização para compartilhar durante a carona."
      );

      return;

    }

    // Monta a URL do WebSocket a partir da mesma baseURL usada pelo axios,
    // trocando http -> ws / https -> wss. Assim só mexe no api.ts.
    const wsUrl =
      (api.defaults.baseURL as string)
        .replace(/^http/, "ws") + "/ws";

    console.log(
      "[WS] Conectando em:",
      wsUrl
    );

    const client = new Client({

      webSocketFactory: () => {

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("WEBSOCKET NATIVO ABRIU");
        };

        ws.onerror = (error) => {
          console.error("ERRO NO WEBSOCKET NATIVO", error);
        };

        ws.onclose = (event) => {
          console.log(
            "WEBSOCKET NATIVO FECHOU",
            event.code,
            event.reason
          );
        };

        return ws;

      },

      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,

      reconnectDelay: 0,

      debug: (message) => {
        console.log("[STOMP]", message);
      },

      onConnect: (frame) => {

        console.log("STOMP CONECTADO COM SUCESSO!", frame.headers);

        setConectado(true);

        iniciarEnvioPeriodico(client);

      },

      onStompError: (frame) => {

        console.error("ERRO STOMP", frame.headers, frame.body);

        if (locationInterval.current) {
          clearInterval(locationInterval.current);
          locationInterval.current = null;
        }

        setConectado(false);

      },

      onWebSocketError: (event) => {

        console.error("ERRO WEBSOCKET", event);

        setConectado(false);

      },

      onWebSocketClose: (event) => {

        console.log("WEBSOCKET FECHADO", event.code, event.reason);

        if (locationInterval.current) {
          clearInterval(locationInterval.current);
          locationInterval.current = null;
        }

        stompClient.current = null;

        setConectado(false);

      },

    });

    stompClient.current = client;

    client.activate();

  }


  // =========================================================
  // DESCONECTAR WEBSOCKET
  // =========================================================

  async function desconectarWebSocket() {

    if (locationInterval.current) {

      clearInterval(locationInterval.current);

      locationInterval.current = null;

    }

    if (stompClient.current) {

      try {

        await stompClient.current.deactivate();

        console.log("STOMP desconectado.");

      } catch (error) {

        console.error("Erro ao desconectar:", error);

      }

    }

    stompClient.current = null;

    setConectado(false);

  }


  // =========================================================
  // INICIAR CARONA (GET /iniciar/{idCarona})
  // =========================================================

  async function handleIniciarCarona() {

    const token = await getToken();

    if (!token) {

      Alert.alert(
        "Erro",
        "Você precisa estar logado para iniciar a carona."
      );

      return;

    }

    setCarregando(true);

    try {

    const response = await api.get(
      `/carona/iniciar/${ID_CARONA}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

      console.log(
        "[INICIAR CARONA] Sucesso:",
        response.data
      );

      setCaronaIniciada(true);

      // Depois de liberar no backend, conecta o WS e começa a enviar localização
      await conectarWebSocket();

    } catch (error: any) {

      console.error(
        "[INICIAR CARONA] Erro:",
        error?.response?.data ?? error
      );

      Alert.alert(
        "Erro ao iniciar carona",
        error?.response?.data ?? "Tente novamente."
      );

    } finally {

      setCarregando(false);

    }

  }


  // =========================================================
  // FINALIZAR CARONA (GET /finalizar/{idCarona})
  // =========================================================

  async function handleFinalizarCarona() {

    const token = await getToken();

    if (!token) {

      Alert.alert(
        "Erro",
        "Você precisa estar logado para finalizar a carona."
      );

      return;

    }

    setCarregando(true);

    try {

    const response = await api.get(
      `/carona/finalizar/${ID_CARONA}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

      console.log(
        "[FINALIZAR CARONA] Sucesso:",
        response.data
      );

      Alert.alert(
        "Carona finalizada",
        response.data
      );

    } catch (error: any) {

      console.error(
        "[FINALIZAR CARONA] Erro:",
        error?.response?.data ?? error
      );

      Alert.alert(
        "Erro ao finalizar carona",
        error?.response?.data ?? "Tente novamente."
      );

    } finally {

      // Independente do resultado, para de mandar localização e desconecta
      await desconectarWebSocket();

      setCaronaIniciada(false);

      setCarregando(false);

    }

  }


  // =========================================================
  // INTERFACE
  // =========================================================

  return (

    <ScrollView
      className="flex-1 bg-vintage-grape-200"
      bounces={false}
    >

      {/* HEADER */}

      <View className="bg-velvet-orchid-900 pt-20 pb-12 px-8 rounded-b-[50px] shadow-2xl">

        <View className="flex-row justify-between items-center mb-6">

          <View>

            <Text className="text-purple-x11-200 text-lg font-medium">
              Olá,{" "}
              {name ? name.split(" ")[0] : "Universitário"}!
            </Text>

            <Text className="text-white text-3xl font-black">
              Bem-vindo ao VDB
            </Text>

          </View>

          <View className="bg-white/10 p-3 rounded-2xl border border-white/20">
            <Logo width={28} height={28} fill="white" />
          </View>

        </View>

        <Text className="text-purple-x11-100 text-sm leading-5 font-medium opacity-80">
          Teste de conexão WebSocket e STOMP.
        </Text>

      </View>


      {/* TESTE DE CARONA (INICIAR / FINALIZAR) */}

      <View className="px-8 mt-10">

        <Text className="text-velvet-orchid-900 font-black text-xl mb-4">
          Teste de Carona (ID {ID_CARONA})
        </Text>

        {!caronaIniciada && (

          <TouchableOpacity
            activeOpacity={0.9}
            disabled={carregando}
            onPress={handleIniciarCarona}
            className="bg-velvet-orchid-700 p-5 rounded-2xl flex-row items-center"
          >

            <View className="bg-white/20 p-3 rounded-xl mr-4">
              <Navigation size={26} color="white" />
            </View>

            <View className="flex-1">
              <Text className="text-white font-black text-lg">
                {carregando ? "Iniciando..." : "Iniciar Carona"}
              </Text>
              <Text className="text-white/70 text-xs mt-1">
                Chama /iniciar e começa a enviar localização a cada 5s
              </Text>
            </View>

          </TouchableOpacity>

        )}

        {caronaIniciada && (

          <TouchableOpacity
            activeOpacity={0.9}
            disabled={carregando}
            onPress={handleFinalizarCarona}
            className="bg-red-600 p-5 rounded-2xl flex-row items-center"
          >

            <View className="bg-white/20 p-3 rounded-xl mr-4">
              <Navigation size={26} color="white" />
            </View>

            <View className="flex-1">
              <Text className="text-white font-black text-lg">
                {carregando ? "Finalizando..." : "Finalizar Carona"}
              </Text>
              <Text className="text-white/70 text-xs mt-1">
                Chama /finalizar e para o envio de localização
              </Text>
            </View>

          </TouchableOpacity>

        )}


        {/* STATUS */}

        <View className="mt-5 bg-platinum-50 p-5 rounded-2xl">

          <Text className="text-velvet-orchid-900 font-black">
            Status
          </Text>

          <Text className="mt-2 text-gray-600">
            Carona: {caronaIniciada ? "🟢 iniciada" : "🔴 não iniciada"}
          </Text>

          <Text className="mt-1 text-gray-600">
            WebSocket: {conectado ? "🟢 conectado" : "🔴 desconectado"}
          </Text>

        </View>

      </View>


      {/* AÇÕES */}

      <View className="px-6 mt-10 flex-row gap-4">

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/search")}
          className="flex-1 bg-platinum-50 p-6 rounded-[32px] shadow-lg border border-purple-x11-50 items-center"
        >
          <View className="bg-purple-x11-100 p-4 rounded-2xl mb-4">
            <Search size={32} color="#7b4d91" />
          </View>
          <Text className="text-velvet-orchid-900 font-black text-center text-lg">
            Buscar Carona
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/offer")}
          className="flex-1 bg-platinum-50 p-6 rounded-[32px] shadow-lg border border-purple-x11-50 items-center"
        >
          <View className="bg-velvet-orchid-700 p-4 rounded-2xl mb-4">
            <PlusCircle size={32} color="white" />
          </View>
          <Text className="text-velvet-orchid-900 font-black text-center text-lg">
            Iniciar Carona
          </Text>
        </TouchableOpacity>

      </View>


      {/* DESTAQUES */}

      <View className="px-8 mt-10 mb-10">

        <Text className="text-velvet-orchid-900 font-black text-xl mb-6">
          Por que usar o VDB?
        </Text>

        <View className="flex-row items-center bg-platinum-50 p-4 rounded-2xl border border-white mb-3">
          <View className="bg-green-100 p-2 rounded-xl mr-4">
            <Star size={20} color="#16a34a" />
          </View>
          <View className="flex-1">
            <Text className="text-velvet-orchid-900 font-bold">
              Segurança
            </Text>
            <Text className="text-gray-500 text-xs font-medium">
              Compartilhamento de localização em tempo real.
            </Text>
          </View>
        </View>

        <View className="flex-row items-center bg-platinum-50 p-4 rounded-2xl border border-white mb-3">
          <View className="bg-blue-100 p-2 rounded-xl mr-4">
            <MapPin size={20} color="#2563eb" />
          </View>
          <View className="flex-1">
            <Text className="text-velvet-orchid-900 font-bold">
              Rotas Inteligentes
            </Text>
            <Text className="text-gray-500 text-xs font-medium">
              Caronas que passam exatamente no seu caminho.
            </Text>
          </View>
        </View>

        <View className="flex-row items-center bg-platinum-50 p-4 rounded-2xl border border-white">
          <View className="bg-orange-100 p-2 rounded-xl mr-4">
            <Clock size={20} color="#ea580c" />
          </View>
          <View className="flex-1">
            <Text className="text-velvet-orchid-900 font-bold">
              Pontualidade
            </Text>
            <Text className="text-gray-500 text-xs font-medium">
              Acompanhe a localização da carona.
            </Text>
          </View>
        </View>

      </View>

    </ScrollView>

  );

}