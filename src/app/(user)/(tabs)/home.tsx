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

export default function Home() {

  const router = useRouter();

  const [name, setName] =
    useState<string | null>(null);

  const [conectado, setConectado] =
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
        "/app/carona/10/localizacao";

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

    // evita duplicar interval se já tiver um rodando
    if (locationInterval.current) {

      clearInterval(locationInterval.current);

      locationInterval.current = null;

    }

    // manda a primeira imediatamente, sem esperar os 5s
    enviarLocalizacaoAtual(client);

    locationInterval.current = setInterval(() => {

      enviarLocalizacaoAtual(client);

    }, 5000);

  }


  // =========================================================
  // TESTE WEBSOCKET
  // =========================================================

  async function testarWebSocket() {

    console.log("");
    console.log(
      "=========================================="
    );
    console.log(
      "INICIANDO TESTE WEBSOCKET"
    );
    console.log(
      "=========================================="
    );


    // -------------------------------------------------------
    // EVITAR DUPLICAR CONEXÃO
    // -------------------------------------------------------

    if (stompClient.current) {

      console.log(
        "Já existe um cliente STOMP."
      );

      return;

    }


    // -------------------------------------------------------
    // PEGAR TOKEN ANTES DE CONECTAR
    // -------------------------------------------------------

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

    console.log(
      "Token obtido, iniciando conexão STOMP com Authorization header."
    );


    // -------------------------------------------------------
    // PEDIR PERMISSÃO DE LOCALIZAÇÃO
    // -------------------------------------------------------

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


    // -------------------------------------------------------
    // CRIAR CLIENTE STOMP
    // -------------------------------------------------------

    console.log(
      "Criando cliente STOMP..."
    );


    const client = new Client({

      // =====================================================
      // WEBSOCKET NATIVO
      // =====================================================

      webSocketFactory: () => {

        console.log(
          "=========================================="
        );

        console.log(
          "CRIANDO WEBSOCKET NATIVO"
        );

        console.log(
          "URL: ws://192.168.1.21:8080/ws"
        );

        console.log(
          "=========================================="
        );


        const ws = new WebSocket(
          "ws://10.216.175.231:8080/ws"
        );


        // ---------------------------------------------------
        // EVENTOS NATIVOS DO WEBSOCKET
        // ---------------------------------------------------

        ws.onopen = () => {

          console.log(
            "=========================================="
          );

          console.log(
            "WEBSOCKET NATIVO ABRIU"
          );

          console.log(
            "=========================================="
          );

        };


        ws.onerror = (error) => {

          console.error(
            "=========================================="
          );

          console.error(
            "ERRO NO WEBSOCKET NATIVO"
          );

          console.error(
            error
          );

          console.error(
            "=========================================="
          );

        };


        ws.onclose = (event) => {

          console.log(
            "=========================================="
          );

          console.log(
            "WEBSOCKET NATIVO FECHOU"
          );

          console.log(
            "Código:",
            event.code
          );

          console.log(
            "Motivo:",
            event.reason
          );

          console.log(
            "=========================================="
          );

        };


        return ws;

      },


      // =====================================================
      // AUTENTICAÇÃO STOMP (JWT)
      // =====================================================

      /*
       * Segundo teste:
       *
       * Agora mandamos o Authorization no CONNECT via
       * connectHeaders. O JwtChannelInterceptor no backend
       * exige esse header em toda conexão STOMP, então sem
       * isso o servidor derruba a conexão com "Token ausente".
       */

      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },


      // =====================================================
      // WORKAROUND PARA BUG CONHECIDO RN + stompjs
      // =====================================================

      /*
       * O WebSocket nativo do React Native (fora do modo debug)
       * tem um bug que corta o caractere NULL usado pelo STOMP
       * para terminar cada frame. Isso faz o CONNECT sair
       * "incompleto" e o backend nunca responde - trava em
       * silêncio, sem CONNECTED e sem ERROR.
       *
       * Referência: https://stomp-js.github.io/workaround/stompjs/rx-stomp/react-native-additional-notes.html
       */

      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,


      reconnectDelay: 0,


      // =====================================================
      // DEBUG
      // =====================================================

      debug: (message) => {

        console.log(
          "[STOMP]",
          message
        );

      },


      // =====================================================
      // STOMP CONECTOU
      // =====================================================

      onConnect: (frame) => {

        console.log("");
        console.log(
          "=========================================="
        );

        console.log(
          "STOMP CONECTADO COM SUCESSO!"
        );

        console.log(
          "=========================================="
        );


        console.log(
          "Headers:"
        );

        console.log(
          frame.headers
        );


        setConectado(true);


        // ===================================================
        // INICIAR ENVIO PERIÓDICO DA LOCALIZAÇÃO REAL
        // ===================================================

        console.log("");
        console.log(
          "=========================================="
        );

        console.log(
          "INICIANDO ENVIO PERIÓDICO (a cada 5s)"
        );

        console.log(
          "=========================================="
        );


        iniciarEnvioPeriodico(client);

      },


      // =====================================================
      // ERRO STOMP
      // =====================================================

      onStompError: (frame) => {

        console.error("");
        console.error(
          "=========================================="
        );

        console.error(
          "ERRO STOMP"
        );

        console.error(
          "=========================================="
        );

        console.error(
          "Headers:",
          frame.headers
        );

        console.error(
          "Body:",
          frame.body
        );

        console.error(
          "=========================================="
        );


        if (locationInterval.current) {

          clearInterval(locationInterval.current);

          locationInterval.current = null;

        }


        setConectado(false);

      },


      // =====================================================
      // ERRO WEBSOCKET
      // =====================================================

      onWebSocketError: (event) => {

        console.error("");
        console.error(
          "=========================================="
        );

        console.error(
          "ERRO WEBSOCKET"
        );

        console.error(
          "=========================================="
        );

        console.error(
          event
        );

        console.error(
          "=========================================="
        );


        setConectado(false);

      },


      // =====================================================
      // WEBSOCKET FECHOU
      // =====================================================

      onWebSocketClose: (event) => {

        console.log("");
        console.log(
          "=========================================="
        );

        console.log(
          "WEBSOCKET FECHADO"
        );

        console.log(
          "Código:",
          event.code
        );

        console.log(
          "Motivo:",
          event.reason
        );

        console.log(
          "=========================================="
        );


        if (locationInterval.current) {

          clearInterval(locationInterval.current);

          locationInterval.current = null;

        }


        stompClient.current = null;

        setConectado(false);

      },

    });


    // =====================================================
    // SALVAR CLIENTE
    // =====================================================

    stompClient.current =
      client;


    // =====================================================
    // ATIVAR
    // =====================================================

    console.log(
      "Chamando client.activate()..."
    );


    client.activate();


    console.log(
      "client.activate() executado."
    );

  }


  // =========================================================
  // DESCONECTAR
  // =========================================================

  async function desconectar() {

    console.log("");
    console.log(
      "=========================================="
    );

    console.log(
      "DESCONECTANDO WEBSOCKET"
    );

    console.log(
      "=========================================="
    );


    // -------------------------------------------------------
    // PARAR O ENVIO PERIÓDICO
    // -------------------------------------------------------

    if (locationInterval.current) {

      clearInterval(locationInterval.current);

      locationInterval.current = null;

      console.log(
        "Envio periódico de localização parado."
      );

    }


    if (stompClient.current) {

      try {

        await stompClient.current.deactivate();

        console.log(
          "STOMP desconectado."
        );

      } catch (error) {

        console.error(
          "Erro ao desconectar:",
          error
        );

      }

    }


    stompClient.current = null;

    setConectado(false);


    console.log(
      "Conexão encerrada."
    );

  }


  // =========================================================
  // INTERFACE
  // =========================================================

  return (

    <ScrollView
      className="flex-1 bg-vintage-grape-200"
      bounces={false}
    >

      {/* =====================================================
          HEADER
      ====================================================== */}

      <View className="bg-velvet-orchid-900 pt-20 pb-12 px-8 rounded-b-[50px] shadow-2xl">

        <View className="flex-row justify-between items-center mb-6">

          <View>

            <Text className="text-purple-x11-200 text-lg font-medium">

              Olá,{" "}

              {name
                ? name.split(" ")[0]
                : "Universitário"}

              !

            </Text>


            <Text className="text-white text-3xl font-black">

              Bem-vindo ao VDB

            </Text>

          </View>


          <View className="bg-white/10 p-3 rounded-2xl border border-white/20">

            <Logo
              width={28}
              height={28}
              fill="white"
            />

          </View>

        </View>


        <Text className="text-purple-x11-100 text-sm leading-5 font-medium opacity-80">

          Teste de conexão WebSocket e STOMP.

        </Text>

      </View>


      {/* =====================================================
          TESTE WEBSOCKET
      ====================================================== */}

      <View className="px-8 mt-10">

        <Text className="text-velvet-orchid-900 font-black text-xl mb-4">

          Teste WebSocket

        </Text>


        <TouchableOpacity
          activeOpacity={0.9}

          onPress={() => {

            if (conectado) {

              desconectar();

            } else {

              testarWebSocket();

            }

          }}

          className="bg-velvet-orchid-700 p-5 rounded-2xl flex-row items-center"
        >

          <View className="bg-white/20 p-3 rounded-xl mr-4">

            <Navigation
              size={26}
              color="white"
            />

          </View>


          <View className="flex-1">

            <Text className="text-white font-black text-lg">

              {conectado
                ? "Parar"
                : "Iniciar compartilhamento"}

            </Text>


            <Text className="text-white/70 text-xs mt-1">

              {conectado
                ? "Enviando localização a cada 5s"
                : "Compartilhar localização em tempo real"}

            </Text>

          </View>

        </TouchableOpacity>


        {/* ===================================================
            STATUS
        ==================================================== */}

        <View className="mt-5 bg-platinum-50 p-5 rounded-2xl">

          <Text className="text-velvet-orchid-900 font-black">

            Status

          </Text>


          <Text className="mt-2 text-gray-600">

            {conectado
              ? "🟢 STOMP conectado"
              : "🔴 Desconectado"}

          </Text>

        </View>

      </View>


      {/* =====================================================
          AÇÕES
      ====================================================== */}

      <View className="px-6 mt-10 flex-row gap-4">

        {/* BUSCAR */}

        <TouchableOpacity
          activeOpacity={0.9}

          onPress={() =>
            router.push("/search")
          }

          className="flex-1 bg-platinum-50 p-6 rounded-[32px] shadow-lg border border-purple-x11-50 items-center"
        >

          <View className="bg-purple-x11-100 p-4 rounded-2xl mb-4">

            <Search
              size={32}
              color="#7b4d91"
            />

          </View>


          <Text className="text-velvet-orchid-900 font-black text-center text-lg">

            Buscar Carona

          </Text>

        </TouchableOpacity>


        {/* OFERECER */}

        <TouchableOpacity
          activeOpacity={0.9}

          onPress={() =>
            router.push("/offer")
          }

          className="flex-1 bg-platinum-50 p-6 rounded-[32px] shadow-lg border border-purple-x11-50 items-center"
        >

          <View className="bg-velvet-orchid-700 p-4 rounded-2xl mb-4">

            <PlusCircle
              size={32}
              color="white"
            />

          </View>


          <Text className="text-velvet-orchid-900 font-black text-center text-lg">

            Iniciar Carona

          </Text>

        </TouchableOpacity>

      </View>


      {/* =====================================================
          DESTAQUES
      ====================================================== */}

      <View className="px-8 mt-10 mb-10">

        <Text className="text-velvet-orchid-900 font-black text-xl mb-6">

          Por que usar o VDB?

        </Text>


        {/* SEGURANÇA */}

        <View className="flex-row items-center bg-platinum-50 p-4 rounded-2xl border border-white mb-3">

          <View className="bg-green-100 p-2 rounded-xl mr-4">

            <Star
              size={20}
              color="#16a34a"
            />

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


        {/* ROTAS */}

        <View className="flex-row items-center bg-platinum-50 p-4 rounded-2xl border border-white mb-3">

          <View className="bg-blue-100 p-2 rounded-xl mr-4">

            <MapPin
              size={20}
              color="#2563eb"
            />

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


        {/* PONTUALIDADE */}

        <View className="flex-row items-center bg-platinum-50 p-4 rounded-2xl border border-white">

          <View className="bg-orange-100 p-2 rounded-xl mr-4">

            <Clock
              size={20}
              color="#ea580c"
            />

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
