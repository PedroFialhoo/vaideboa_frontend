import type { Acompanhamento } from "../types/acompanhamento";

export class FalhaConsulta extends Error {
  constructor(public status: number, public retryAfter = 0) { super("Consulta indisponível"); }
}

export async function consultar(token: string, signal: AbortSignal): Promise<Acompanhamento> {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");
  if (!base) throw new Error("API não configurada");
  const response = await fetch(`${base}/compartilhamento/publico/${token}`, {
    signal, cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer",
  });
  if (!response.ok) {
    const header = response.headers.get("Retry-After");
    const delay = header ? (/^\d+$/.test(header) ? Number(header) * 1000 : Date.parse(header) - Date.now()) : 0;
    throw new FalhaConsulta(response.status, Number.isFinite(delay) ? Math.max(0, delay) : 0);
  }
  const data: Acompanhamento = await response.json();
  if (data.statusViagem !== "EM_ANDAMENTO" || !["AGUARDANDO_PRIMEIRA_LOCALIZACAO", "DISPONIVEL", "DESATUALIZADA"].includes(data.estadoLocalizacao)) throw new Error("Resposta inválida");
  if (data.estadoLocalizacao === "AGUARDANDO_PRIMEIRA_LOCALIZACAO") return { ...data, localizacao: null, ultimaAtualizacaoEm: null };
  const p = data.localizacao;
  if (!p || !Number.isFinite(p.latitude) || Math.abs(p.latitude) > 90 || !Number.isFinite(p.longitude) || Math.abs(p.longitude) > 180 || !data.ultimaAtualizacaoEm || !Number.isFinite(Date.parse(data.ultimaAtualizacaoEm))) throw new Error("Posição inválida");
  return data;
}
