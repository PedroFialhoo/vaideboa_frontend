import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";
import axios from "axios";

export type PlaceType = "casa" | "faculdade";
export type PlaceCoordinates = { latitude: number; longitude: number };
export type Local = PlaceCoordinates & { id: number; descricao: string };
export type LocaisUsuario = { casa: Local | null; faculdade: Local | null };
export type PlaceShortcut = {
  description: string;
  geometry: { location: { lat: number; lng: number } };
};

export function locaisParaAtalhos(locais: LocaisUsuario): PlaceShortcut[] {
  const shortcuts: PlaceShortcut[] = [];
  for (const tipo of ["casa", "faculdade"] as const) {
    const local = locais[tipo];
    if (local) shortcuts.push({
      description: `${tipo === "casa" ? "Casa" : "Faculdade"} · ${local.descricao}`,
      geometry: { location: { lat: local.latitude, lng: local.longitude } },
    });
  }
  return shortcuts;
}

export async function buscarLocais(): Promise<LocaisUsuario> {
  const token = await getToken();
  if (!token) throw new Error("Faça login novamente.");
  const { data } = await api.get<LocaisUsuario>("/user/locais", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export function localErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (typeof data?.mensagem === "string") return data.mensagem;
    if (error.response?.status === 401) return "Sua sessão expirou. Faça login novamente.";
    return "Não foi possível salvar o local. Verifique sua conexão e tente novamente.";
  }
  return error instanceof Error ? error.message : "Não foi possível salvar o local.";
}

export async function cadastrarLocal(tipo: PlaceType, descricao: string, coordinates: PlaceCoordinates) {
  const description = descricao.trim();
  if (!description || description.length > 255) {
    throw new Error("Informe uma descrição de até 255 caracteres.");
  }
  const { latitude, longitude } = coordinates;
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error("Selecione um ponto válido no mapa.");
  }
  const token = await getToken();
  if (!token) throw new Error("Faça login novamente.");

  const response = await api.post<string>(`/${tipo}/cadastrar`,
    { descricao: description, latitude, longitude },
    { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
}
