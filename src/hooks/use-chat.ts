import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { AppState } from "react-native";
import { api } from "@/src/services/api";
import { acompanharChat } from "@/src/services/chat-socket";
import { buscarMensagens, chatHeaders, enviarMensagem, erroChat, Mensagem, reservaValida, unirMensagens } from "@/src/services/chat";

export function useChat(idReserva: number, idCarona: number) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [idUsuario, setIdUsuario] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);
  const [olderLoading, setOlderLoading] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sendError, setSendError] = useState("");
  const [status, setStatus] = useState("Conectando...");
  const [attempt, setAttempt] = useState(0);
  const session = useRef<{
    active: boolean; controller: AbortController; busy: boolean; page: number; last: boolean;
    messages: Mensagem[]; buffered: Mensagem[]; syncing: boolean; counterpart?: number; own?: number;
    recoveryKnown?: Set<number>;
    merge: (messages: Mensagem[]) => void; sync: () => Promise<void>;
  } | null>(null);
  const sendingRef = useRef(false);

  useFocusEffect(useCallback(() => {
    setMensagens([]); setIdUsuario(undefined); setError(""); setLoading(true); setHasOlder(false);
    setStatus("Conectando..."); setOlderLoading(false); setRecovering(false);
    if (!reservaValida(idReserva) || !reservaValida(idCarona)) {
      setError("Reserva inválida."); setLoading(false); return;
    }
    const s: NonNullable<typeof session.current> = {
      active: true, controller: new AbortController(), busy: false, page: -1, last: false,
      messages: [], buffered: [], syncing: false,
      merge: messages => {
        if (!s.active) return;
        s.messages = unirMensagens(s.messages, messages.filter(m => m.idReserva === idReserva));
        // /user/me e JWT não expõem id. Na reserva há somente dois participantes.
        if (!s.own && s.counterpart) s.own = s.messages.find(m => m.idAutor !== s.counterpart)?.idAutor;
        setIdUsuario(s.own); setMensagens(s.messages);
      },
      sync: async () => {
        if (!s.active || s.busy) return;
        s.busy = true; s.syncing = true; setRecovering(true);
        // Manter a referência anterior até terminar: uma falha na página 2 não
        // pode transformar a página 0 recém-carregada no ponto de recuperação.
        const known = s.recoveryKnown ?? new Set(s.messages.map(m => m.id));
        s.recoveryKnown = known;
        try {
          let page = 0;
          while (s.active) {
            const result = await buscarMensagens(idReserva, page, s.controller.signal);
            if (!s.active) return;
            s.merge(result.mensagens);
            if (s.page < 0) { s.page = 0; s.last = result.ultimaPagina; setHasOlder(!s.last); }
            if (result.ultimaPagina || !known.size || result.mensagens.some(m => known.has(m.id))) break;
            page++;
          }
          if (s.active) { s.recoveryKnown = undefined; setError(""); }
        } catch (failure) { if (s.active) setError(erroChat(failure)); }
        finally {
          s.syncing = false; s.busy = false;
          if (s.active) { s.merge(s.buffered); s.buffered = []; setLoading(false); setRecovering(false); }
        }
      },
    };
    session.current = s;
    let stop: (() => void) | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    void (async () => {
      try {
        const headers = await chatHeaders();
        const options = { headers, signal: s.controller.signal, timeout: 15000 };
        const [minhas, ride] = await Promise.all([api.get("/carona/minhas", options), api.get(`/carona/buscar/${idCarona}`, options)]);
        if (!s.active) return;
        const minha = minhas.data.find((r: { id: number }) => r.id === idCarona);
        if (!minha) throw new Error("Você não participa desta carona.");
        if (minha.papel === "MOTORISTA") s.own = ride.data.idMotorista;
        else {
          if (minha.idReserva !== idReserva) throw new Error("Reserva inválida para esta carona.");
          s.counterpart = ride.data.idMotorista;
        }
        setIdUsuario(s.own);
        stop = acompanharChat({ reserva: idReserva,
          message: m => { if (s.syncing) s.buffered.push(m); else s.merge([m]); },
          connected: () => { if (s.active) { setStatus("Conectado"); void s.sync(); } },
          status: value => { if (s.active) setStatus(value); },
        });
        // Recuperação HTTP também funciona quando WS não conecta ou o app volta do segundo plano.
        timer = setInterval(() => { if (AppState.currentState === "active") void s.sync(); }, 10000);
      } catch (failure) { if (s.active) { setError(erroChat(failure)); setLoading(false); } }
    })();
    const appListener = AppState.addEventListener("change", state => { if (state === "active") void s.sync(); });
    return () => { s.active = false; s.controller.abort(); stop?.(); clearInterval(timer); appListener.remove(); if (session.current === s) session.current = null; };
  }, [idReserva, idCarona, attempt]));

  async function carregarAntigas() {
    const s = session.current;
    if (!s || s.busy || s.last || s.page < 0) return;
    s.busy = true; setOlderLoading(true);
    try {
      const result = await buscarMensagens(idReserva, s.page + 1, s.controller.signal);
      if (!s.active) return;
      s.merge(result.mensagens); s.page = result.pagina; s.last = result.ultimaPagina;
      setHasOlder(!s.last); setError("");
    } catch (failure) { if (s.active) setError(erroChat(failure)); }
    finally { s.busy = false; if (s.active) setOlderLoading(false); }
  }
  async function enviar(text: string) {
    const s = session.current;
    if (!s || sendingRef.current) return false;
    sendingRef.current = true; setSending(true); setSendError("");
    try {
      const message = await enviarMensagem(idReserva, text);
      if (!s.active) return false;
      s.own = message.idAutor; s.merge([message]); return true;
    } catch (failure) {
      if (s.active) setSendError(`${erroChat(failure)} Verifique o histórico antes de tentar enviar novamente.`);
      return false;
    } finally { sendingRef.current = false; setSending(false); }
  }
  return { mensagens, idUsuario, loading, recovering, olderLoading, hasOlder, sending, error, sendError, status, carregarAntigas, enviar,
    sincronizar: () => { const s = session.current; if (s && (s.own || s.counterpart)) void s.sync(); else setAttempt(a => a + 1); } };
}
