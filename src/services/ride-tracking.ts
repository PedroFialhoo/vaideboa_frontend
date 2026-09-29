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

    const client = new Client({
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      webSocketFactory: () => new WebSocket(getWebSocketUrl()),
    });

    client.onConnect = () => {
      connected = true;

      if (onLocation) {
        subscription = client.subscribe(`/topic/carona/${idCarona}`, (message: IMessage) => {
          try {
            onLocation(JSON.parse(message.body) as RideLocation);
          } catch {
            // Ignore malformed real-time messages without interrupting the connection.
          }
        });
      }

      resolve({
        publishLocation: (location) => {
          if (client.connected) {
            client.publish({
              destination: `/app/carona/${idCarona}/localizacao`,
              body: JSON.stringify(location),
            });
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
      if (!connected) {
        void client.deactivate();
        reject(new Error(frame.headers.message || "Não foi possível autenticar o rastreio"));
      }
    };

    client.onWebSocketError = () => {
      if (!connected) {
        void client.deactivate();
        reject(new Error("Não foi possível conectar ao rastreio"));
      }
    };

    client.onWebSocketClose = () => {
      if (!connected) {
        void client.deactivate();
        reject(new Error("A conexão com o rastreio foi encerrada"));
      }
    };

    client.activate();
  });
}
