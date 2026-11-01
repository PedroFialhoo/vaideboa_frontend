import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useFocusEffect } from "expo-router";
import { api } from "@/src/services/api";
import { getToken, subscribeToSession } from "@/src/services/storage";

import { invalidateAvatars } from "@/src/services/avatar";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PIXELS = 12_000_000;

async function readPhotoError(error: unknown) {
  if (!axios.isAxiosError(error)) return null;
  const data = error.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data.text === "function") return await data.text();
  if (data && typeof FileReader !== "undefined") {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsText(data);
    });
  }
  return null;
}

function photoDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) return "Sua sessão expirou. Faça login novamente.";
    if (status === 403) return "Você não tem permissão para alterar esta foto.";
    if (typeof error.response?.data === "string" && error.response.data.trim() && [400, 413, 415, 422].includes(status ?? 0)) return error.response.data;
    if (status === 413) return "A imagem excede os limites. Escolha um JPEG ou PNG de até 5 MB e 12 milhões de pixels.";
    if (status === 400 || status === 415 || status === 422) return "Imagem inválida. Escolha um JPEG ou PNG de até 5 MB e 12 milhões de pixels.";
  }
  return fallback;
}

export function useProfilePhoto() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const mounted = useRef(false);
  const locked = useRef(false);
  const request = useRef(0);

  const loadPhoto = useCallback(async () => {
    const current = ++request.current;
    const active = () => mounted.current && current === request.current;
    try {
      const token = await getToken();
      if (!active()) return;
      if (!token) {
        setPhotoUri(null);
        setMessage("Sua sessão expirou. Faça login novamente.");
        return;
      }
      const response = await api.get<Blob>("/fotos/me", {
        headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-cache" },
        responseType: "blob", timeout: 15000,
      });
      if (!active()) return;
      const uri = Platform.OS === "web"
        ? URL.createObjectURL(response.data)
        : await photoDataUrl(response.data);
      if (active()) setPhotoUri(uri);
      else if (Platform.OS === "web") URL.revokeObjectURL(uri);
    } catch (error) {
      const detail = await readPhotoError(error).catch(() => null);
      if (!active()) return;
      setPhotoUri(null);
      if (axios.isAxiosError(error) && error.response?.status === 400 && detail?.trim() === "Usuário sem foto") {
        setMessage(null);
      } else {
        setMessage(errorMessage(error, "Não foi possível carregar sua foto. Tente novamente."));
      }
    }
  }, []);


  useEffect(() => {
    mounted.current = true;
    const unsubscribe = subscribeToSession(() => { request.current++; setPhotoUri(null); setMessage(null); });
    return () => { mounted.current = false; request.current++; unsubscribe(); };
  }, []);

  useFocusEffect(useCallback(() => {
    setMessage(null);
    void loadPhoto();
    return () => { request.current++; };
  }, [loadPhoto]));

  useEffect(() => {
    return () => {
      if (photoUri && Platform.OS === "web" && photoUri.startsWith("blob:")) URL.revokeObjectURL(photoUri);
    };
  }, [photoUri]);

  const pickPhoto = useCallback(async () => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setMessage(null);
    try {
      // Open directly from the click, including on web (browser user activation).
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], allowsEditing: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const type = asset.mimeType?.toLowerCase() || asset.file?.type?.toLowerCase();
      if (type !== "image/jpeg" && type !== "image/png") {
        setMessage("Formato não permitido. Escolha uma imagem JPEG ou PNG.");
        return;
      }
      if (!Number.isFinite(asset.width) || !Number.isFinite(asset.height) || asset.width <= 0 || asset.height <= 0 || asset.width * asset.height > MAX_PIXELS) {
        setMessage("A imagem deve ter até 12 milhões de pixels (por exemplo, 4000 × 3000).");
        return;
      }
      let file = asset.file;
      let size = file?.size ?? asset.fileSize;
      if (size == null || (Platform.OS === "web" && !file)) {
        const blob = await (await fetch(asset.uri)).blob();
        size = blob.size;
        if (Platform.OS === "web") file = new File([blob], type === "image/png" ? "foto.png" : "foto.jpg", { type });
      }
      if (!size || size > MAX_BYTES) {
        setMessage("A imagem deve ter no máximo 5 MB. Escolha um arquivo menor.");
        return;
      }
      request.current++;
      if (mounted.current) setPhotoUri(asset.uri);
      const token = await getToken();
      if (!token) {
        setPhotoUri(null);
        setMessage("Entre novamente para cadastrar sua foto de perfil.");
        return;
      }
      const form = new FormData();
      if (Platform.OS === "web" && file) {
        form.append("arquivo", file, type === "image/png" ? "foto.png" : "foto.jpg");
      } else {
        form.append("arquivo", { uri: asset.uri, name: type === "image/png" ? "foto.png" : "foto.jpg", type } as unknown as Blob);
      }
      const response = await api.post("/fotos/perfil", form, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": false },
        // O backend retorna uma mensagem textual.
        responseType: "text",
      });
      invalidateAvatars();
      if (mounted.current) setMessage(response.data || "Foto cadastrada com sucesso");
      await loadPhoto();
    } catch (error) {
      if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) invalidateAvatars();
      if (mounted.current) {
        setPhotoUri(null);
        setMessage(errorMessage(error, "Não foi possível atualizar sua foto. Tente novamente."));
      }
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }, [loadPhoto]);

  return { photoUri, busy, message, pickPhoto, onImageError: () => { setPhotoUri(null); setMessage("Não foi possível exibir a foto."); } };
}
