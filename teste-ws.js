// teste-ws.js
// Simula exatamente o que o app faz, mas rodando no Node no seu PC.
// Isso isola se o problema é no backend ou é específico do celular/Expo.

const { Client } = require("@stomp/stompjs");
const WebSocket = require("ws");

// Cole aqui o MESMO token que apareceu no log do RN
const TOKEN = "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJ2YWlkZWJvYSIsInN1YiI6ImFsbGlzc29udGhvbWFzNjAwQGdtYWlsLmNvbSIsImV4cCI6MTc4OTY4ODUwMCwiaWF0IjoxNzg3MDk2NTAwLCJzY29wZSI6InJlYWQgRkFDVE9SX1BBU1NXT1JEIn0.Gp-49CcedrexE2jI5Dzu7kFSVsE3hy1eH_dKMGOcWpv_U7WX-2F6GyWYxF34etHhjpt3Wyyz73mH_oIa1DnA2tfgftn4UwTTvCGlDRCsimf1MCFUrcrsnCVEk7uF6sjX-ERqoKnEAKy5G5V7IlL3kEQlwcqDuC-jih_FIywQiAAoN3UrpN1h7bFKfO8XetufpbHjXbzInRGmKBcAO5vXU9oVAeuoGv5ZTfV-9f7WSjPiZlK1xjUrbAJFKmXo-UqF_Te4YDjfa9gUCBql4IMas2djnm2weT-FgKAT1pBTt5a3Vng8wxcyZNRLThEvhv5kGmVJSXbuUDAYGiXqD7xENg";

// Mesma URL que o app usa (IP da rede, não localhost)
const URL = "ws://192.168.1.21:8080/ws";

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
    process.exit(0);
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
    console.log("\n⚠️  WEBSOCKET FECHOU. Código:", event.code, "Motivo:", event.reason);
  },
});

client.activate();

// Timeout de segurança - se não conectar em 10s, avisa
setTimeout(() => {
  console.log("\n⏱️  TIMEOUT - nenhuma resposta em 10 segundos (nem CONNECTED nem ERROR).");
  console.log("Isso confirma que a conexão está travando sem resposta, igual no app.");
  process.exit(1);
}, 10000);