import { api } from "./api";
import { getToken } from "./storage";

export type LinkCompartilhamento = { url: string; expiraEm: string };

export async function obterLinkCompartilhamento(idCarona: number): Promise<LinkCompartilhamento> {
  const token = await getToken();
  if (!token) throw new Error("Sessão expirada. Entre novamente para compartilhar.");
  try {
    const { data } = await api.post<LinkCompartilhamento>(`/carona/${idCarona}/compartilhamento`, undefined, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    });
    if (!data.url || !/^https?:\/\//i.test(data.url)) throw new Error("Link inválido");
    return data;
  } catch (error: any) {
    const status = error.response?.status;
    if (status === 401) throw new Error("Sessão expirada. Entre novamente para compartilhar.");
    if ([403, 404, 409].includes(status)) throw new Error("Compartilhamento indisponível para esta solicitação.");
    throw new Error("Não foi possível obter o link de acompanhamento. Tente novamente.");
  }
}
