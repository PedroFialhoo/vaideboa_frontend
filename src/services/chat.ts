import axios from "axios";
import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";

export type Mensagem = { id: number; idReserva: number; idAutor: number; mensagem: string; enviadoEm: string };
export type PaginaMensagens = { mensagens: Mensagem[]; pagina: number; tamanho: number; totalMensagens: number; totalPaginas: number; ultimaPagina: boolean };
export const CHAT_PAGE_SIZE = 30;
export function reservaValida(id: number) { return Number.isSafeInteger(id) && id > 0; }
export async function chatHeaders() {
  const token = await getToken();
  if (!token) throw new Error("Faça login novamente para acessar o chat.");
  return { Authorization: `Bearer ${token}` };
}
export async function buscarMensagens(idReserva: number, page: number, signal?: AbortSignal) {
  if (!reservaValida(idReserva) || !Number.isInteger(page) || page < 0) throw new Error("Reserva ou página inválida.");
  return (await api.get<PaginaMensagens>(`/chat/${idReserva}/mensagens`, {
    headers: await chatHeaders(), params: { page, size: CHAT_PAGE_SIZE }, signal, timeout: 15000,
  })).data;
}
export async function enviarMensagem(idReserva: number, mensagem: string) {
  if (!reservaValida(idReserva)) throw new Error("Reserva inválida.");
  if (!mensagem.trim()) throw new Error("Digite uma mensagem.");
  if (mensagem.length > 1000) throw new Error("A mensagem deve ter no máximo 1000 caracteres.");
  return (await api.post<Mensagem>("/chat/enviarMensagem", { idReserva, mensagem }, {
    headers: { ...await chatHeaders(), "Content-Type": "application/json" }, timeout: 15000,
  })).data;
}
export function erroChat(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (typeof data?.mensagem === "string") return data.mensagem;
    if (typeof data?.message === "string" && data.message) return data.message;
    if (error.response?.status === 401) return "Sua sessão expirou. Faça login novamente.";
    if (error.response?.status === 403) return "Você não tem acesso a esta conversa.";
    if (error.response?.status === 404) return "Conversa não encontrada.";
    return "Não foi possível confirmar a operação. Verifique sua conexão.";
  }
  return error instanceof Error ? error.message : "Não foi possível acessar o chat.";
}
export function unirMensagens(atuais: Mensagem[], novas: Mensagem[]) {
  return [...new Map([...atuais, ...novas].map(m => [m.id, m])).values()]
    .sort((a, b) => a.enviadoEm.localeCompare(b.enviadoEm) || a.id - b.id);
}
// LocalDateTime: mostrar os campos do contrato sem converter para UTC ou fuso do aparelho.
export function horarioMensagem(value: string) {
  const [data, hora] = value.split("T");
  return `${data.split("-").reverse().join("/")} ${hora?.slice(0, 5) ?? ""}`;
}
