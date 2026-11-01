import axios from "axios";
import { Platform } from "react-native";
import { api } from "@/src/services/api";
import { getToken, subscribeToSession } from "@/src/services/storage";

type Photo = { uri: string | null; error: string | null };
type Entry = { refs: number; controller: AbortController; promise: Promise<Photo>; uri?: string; disposed: boolean };
const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();
let revision = 0;
export const avatarRevision = () => revision;
export function subscribeAvatars(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function dispose(entry: Entry) {
  entry.disposed = true;
  entry.controller.abort();
  if (entry.uri && Platform.OS === "web") URL.revokeObjectURL(entry.uri);
}
export function invalidateAvatars() {
  entries.forEach(dispose);
  entries.clear();
  revision++;
  listeners.forEach(listener => listener());
}
subscribeToSession(invalidateAvatars);

export function avatarError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) return null;
    if (error.response?.status === 401) return "Sua sessão expirou. Faça login novamente.";
    if (error.response?.status === 403) return "Você não tem permissão para visualizar esta foto.";
  }
  return "Não foi possível carregar a foto.";
}
function dataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Não foi possível ler a foto."));
    reader.readAsDataURL(blob);
  });
}

// Only API-relative routes are accepted: never internal storage paths or external hosts.
export function acquireAvatar(path: string) {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return { promise: Promise.resolve<Photo>({ uri: null, error: "Rota de foto inválida." }), release: () => {} };
  }
  let entry = entries.get(path);
  if (!entry) {
    const current: Entry = { refs: 0, controller: new AbortController(), disposed: false, promise: Promise.resolve({ uri: null, error: null }) };
    current.promise = (async (): Promise<Photo> => {
      try {
        const token = await getToken();
        if (current.disposed) return { uri: null, error: null };
        if (!token) return { uri: null, error: "Faça login novamente para visualizar a foto." };
        const response = await api.get<Blob>(path, {
          headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-cache" },
          responseType: "blob", signal: current.controller.signal, timeout: 15000,
        });
        if (current.disposed) return { uri: null, error: null };
        const type = String(response.headers["content-type"] || response.data.type).split(";")[0].trim();
        if (type !== "image/jpeg" && type !== "image/png") throw new Error("Formato de foto inválido.");
        const uri = Platform.OS === "web" ? URL.createObjectURL(response.data) : await dataUrl(response.data);
        if (current.disposed) {
          if (Platform.OS === "web") URL.revokeObjectURL(uri);
          return { uri: null, error: null };
        }
        current.uri = uri;
        return { uri, error: null };
      } catch (error) {
        return { uri: null, error: current.disposed ? null : avatarError(error) };
      }
    })();
    entries.set(path, current);
    entry = current;
  }
  const acquired = entry;
  acquired.refs++;
  return { promise: acquired.promise, release: () => {
    acquired.refs--;
    // Allow another consumer (or Strict Mode remount) to reuse the pending request.
    queueMicrotask(() => {
      if (acquired.refs === 0) {
        dispose(acquired);
        if (entries.get(path) === acquired) entries.delete(path);
      }
    });
  } };
}

export function profilePhotoPath(idUsuario: unknown, idCarona: unknown): string | null {
  const user = Number(idUsuario);
  const ride = Number(idCarona);
  return Number.isSafeInteger(user) && user > 0 && Number.isSafeInteger(ride) && ride > 0
    ? `/fotos/perfil/${user}?idCarona=${ride}` : null;
}
