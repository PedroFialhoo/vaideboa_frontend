import { useEffect, useState } from "react";
import { consultar, FalhaConsulta } from "../services/acompanhamento";
import type { Acompanhamento } from "../types/acompanhamento";

type Estado = { token: string; dados: Acompanhamento | null; situacao: "carregando" | "ativo" | "erro" | "encerrado" };
const lerToken = () => window.location.hash.slice(1);
export function useAcompanhamento() {
  const [token, setToken] = useState(lerToken);
  const [estado, setEstado] = useState<Estado>({ token, dados: null, situacao: "carregando" });
  const valido = /^[A-Za-z0-9_-]{43}$/.test(token);
  useEffect(() => {
    const mudar = () => setToken(lerToken());
    window.addEventListener("hashchange", mudar);
    return () => window.removeEventListener("hashchange", mudar);
  }, []);
  useEffect(() => {
    setEstado({ token, dados: null, situacao: "carregando" });
    if (!valido) return;
    let cancelado = false, encerrado = false, emConsulta = false, falhas = 0, proximaPermitida = 0;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController | undefined;
    const agendar = (delay: number) => { timer = setTimeout(() => void atualizar(), Math.min(delay, 2_147_483_647)); };
    async function atualizar() {
      if (cancelado || encerrado || emConsulta) return;
      clearTimeout(timer);
      if (Date.now() < proximaPermitida) { agendar(proximaPermitida - Date.now()); return; }
      emConsulta = true;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 15000);
      let delay = 5000;
      try {
        const dados = await consultar(token, controller.signal);
        if (!cancelado) setEstado({ token, dados, situacao: "ativo" });
        falhas = 0;
      } catch (error) {
        if (cancelado) return;
        if (error instanceof FalhaConsulta && error.status === 404) {
          encerrado = true;
          setEstado({ token, dados: null, situacao: "encerrado" });
          return;
        }
        delay = Math.min(60000, 5000 * 2 ** Math.min(++falhas, 4));
        if (error instanceof FalhaConsulta && error.status === 429) {
          delay = Math.max(delay, error.retryAfter);
          proximaPermitida = Date.now() + delay;
        }
        setEstado((anterior) => ({ ...anterior, situacao: "erro" }));
      } finally {
        clearTimeout(timeout);
        emConsulta = false;
        if (!cancelado && !encerrado) agendar(delay);
      }
    }
    const visibilidade = () => { if (!document.hidden) void atualizar(); };
    document.addEventListener("visibilitychange", visibilidade);
    void atualizar();
    return () => { cancelado = true; clearTimeout(timer); controller?.abort(); document.removeEventListener("visibilitychange", visibilidade); };
  }, [token, valido]);
  return { valido, ...(estado.token === token ? estado : { dados: null, situacao: "carregando" as const }) };
}
