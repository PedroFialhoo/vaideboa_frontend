import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import { api } from "@/src/services/api";

export type RideLocation = {
  latitude: number;
  longitude: number;
};

export type RideTrackingConnection = {
  publishLocation: (location: RideLocation) => void;
  disconnect: () => Promise<void>;
};

function getWebSocketUrl() {
  const baseUrl = api.defaults.baseURL;

  if (!baseUrl) {
    throw new Error("URL da API não configurada");
  }

  return `${baseUrl.replace(/^http/, "ws").replace(/\/$/, "")}/ws`;
}

export function connectRideTracking({
  idCarona,
  token,
  onLocation,
}: {
  idCarona: string | number;
  token: string;
  onLocation?: (location: RideLocation) => void;
}): Promise<RideTrackingConnection> {
  return new Promise((resolve, reject) => {
    let subscription: StompSubscription | undefined;
    let connected = false;
    let settled = false;

    const failConnection = (error: Error) => {
      if (settled) return;
      settled = true;
      void client.deactivate();
      reject(error);
    };

    const client = new Client({
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      webSocketFactory: () => new WebSocket(getWebSocketUrl()),
      // O WebSocket do React Native pode descartar o terminador nulo de frames STOMP textuais.
      forceBinaryWSFrames: true,
      debug: (message) => {
        console.log(
          "[Rastreamento][STOMP]",
          message.replace(/Authorization:\s*Bearer [^\r\n]*/g, "Authorization: Bearer [oculto]"),
        );
      },
    });

    const connectionTimeout = setTimeout(() => {
      failConnection(new Error("Tempo esgotado ao autenticar o WebSocket de rastreamento"));
    }, 10000);

    client.onConnect = () => {
      connected = true;
      settled = true;
      clearTimeout(connectionTimeout);
      console.log(`[Rastreamento] WebSocket conectado à carona ${idCarona}`);

        if (onLocation) {
          subscription = client.subscribe(`/topic/carona/${idCarona}`, (message: IMessage) => {
            try {
              const location = JSON.parse(message.body) as RideLocation;
              console.log("[Rastreamento] Localização recebida:", location);
              onLocation(location);
            } catch {
              console.warn("[Rastreamento] Mensagem de localização inválida recebida.");
            }
          });
          console.log(`[Rastreamento] Inscrito na carona ${idCarona}`);
        }

      resolve({
        publishLocation: (location) => {
          if (client.connected) {
            console.log("[Rastreamento] Publicando localização:", location);
            client.publish({
              destination: `/app/carona/${idCarona}/localizacao`,
              body: JSON.stringify(location),
            });
          } else {
            console.warn("[Rastreamento] Localização não publicada: WebSocket desconectado.");
          }
        },
        disconnect: async () => {
          subscription?.unsubscribe();
          if (client.active) {
            await client.deactivate();
          }
        },
      });
    };

    client.onStompError = (frame) => {
      console.error("[Rastreamento] Erro STOMP:", frame.headers.message || frame.body);
      if (!connected) {
        clearTimeout(connectionTimeout);
        failConnection(new Error(frame.headers.message || "Não foi possível autenticar o rastreio"));
      }
    };

    client.onWebSocketError = () => {
      console.error("[Rastreamento] Erro na conexão WebSocket.");
      if (!connected) {
        clearTimeout(connectionTimeout);
        failConnection(new Error("Não foi possível conectar ao rastreio"));
      }
    };

    client.onWebSocketClose = () => {
      console.warn("[Rastreamento] Conexão WebSocket encerrada.");
      if (!connected) {
        clearTimeout(connectionTimeout);
        failConnection(new Error("A conexão com o rastreio foi encerrada"));
      }
    };

    client.activate();
  });
}
