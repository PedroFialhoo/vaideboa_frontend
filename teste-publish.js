// teste-publish.js
// Testa o fluxo completo: CONNECT + publish em /app/carona/{id}/localizacao
// Roda no Node, no seu PC, pra isolar se o problema é no backend ou no celular/Expo.

const { Client } = require("@stomp/stompjs");
const WebSocket = require("ws");

const TOKEN =
  "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJ2YWlkZWJvYSIsInN1YiI6ImFsbGlzc29udGhvbWFzNjAwQGdtYWlsLmNvbSIsImV4cCI6MTc4OTY4OTkwOCwiaWF0IjoxNzg3MDk3OTA4LCJzY29wZSI6InJlYWQgRkFDVE9SX1BBU1NXT1JEIn0.Hs_Q27jJWKjdGmKr5-68JhxD5NiJn7uzCz3BvZw6CZfipALPcnTOwdRzCRHR0kCR7padJcnEMtL0UHAh7qOK28M5HD5NNrCuAzT8j5nc6uc-cvQcBNq7B2Cfh6fSDRFhYtGixqoRpOEHUhiOYt_N4T5nq5HVf11Syn-C-OLTH-v86CA1-UC8Z4qX7Jd1miLHHhtRep7wF_M5qbzAUP6WEBRlN-AJleWEECtVxeLN3IsYKtv6C2ebtN9CX4LAPG-r-jNYjEPBd240LjQ6GnYe55yvlv9c86Vyx5AO_0kjVvwmZEf5SbzrjO4iQJC38bUo16XsLXfIzAXjTh1FryhHJA";

// Troque para "ws://localhost:8080/ws" se estiver usando adb reverse,
// ou "ws://192.168.1.21:8080/ws" se for direto pela rede.
const URL = "ws://localhost:8080/ws";

// ID de carona de teste (ajuste se precisar de um id válido no banco)
const ID_CARONA = 10;

console.log("Conectando em:", URL);

const client = new Client({
  webSocketFactory: () => new WebSocket(URL),
  connectHeaders: {
    Authorization: `Bearer ${TOKEN}`,
  },
  reconnectDelay: 0,
  debug: (msg) => console.log("[STOMP]", msg),

  onConnect: (frame) => {
    console.log("\n✅ CONECTOU! Headers:", frame.headers);

    // -----------------------------------------------------
    // Se inscreve no tópico pra ver a mensagem voltando
    // (o CompartilhamentoService manda de volta pra /topic/carona/{id})
    // -----------------------------------------------------
    client.subscribe(`/topic/carona/${ID_CARONA}`, (message) => {
      console.log("\n📩 MENSAGEM RECEBIDA NO TÓPICO:");
      console.log(message.body);
      console.log("\n✅ FLUXO COMPLETO FUNCIONOU (publish -> controller -> service -> broadcast -> subscribe).");
      process.exit(0);
    });

    // -----------------------------------------------------
    // Publica a localização de teste
    // -----------------------------------------------------
    const destino = `/app/carona/${ID_CARONA}/localizacao`;
    const corpo = JSON.stringify({
      latitude: -22.788865,
      longitude: -45.211388,
    });

    console.log("\nEnviando localização...");
    console.log("DESTINO:", destino);
    console.log("CORPO:", corpo);

    try {
      client.publish({ destination: destino, body: corpo });
      console.log("PUBLISH EXECUTADO COM SUCESSO");
    } catch (error) {
      console.error("ERRO AO EXECUTAR PUBLISH:", error);
    }
  },

  onStompError: (frame) => {
    console.log("\n❌ ERRO STOMP:", frame.headers, frame.body);
    process.exit(1);
  },

  onWebSocketError: (event) => {
    console.log("\n❌ ERRO WEBSOCKET:", event.message || event);
    process.exit(1);
  },

  onWebSocketClose: (event) => {
    console.log(
      "\n⚠️  WEBSOCKET FECHOU. Código:",
      event.code,
      "Motivo:",
      event.reason
    );
  },
});

client.activate();

// Timeout de segurança
setTimeout(() => {
  console.log(
    "\n⏱️  TIMEOUT - nada aconteceu em 10 segundos (nem CONNECTED, nem mensagem no tópico, nem erro)."
  );
  process.exit(1);
}, 10000);
