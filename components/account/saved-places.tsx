import "@/global.css";
import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router/react-navigation";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight, GraduationCap, House, X } from "lucide-react-native";
import SavedPlaceMap from "./saved-place-map";
import { buscarLocais, cadastrarLocal, localErrorMessage, LocaisUsuario, PlaceCoordinates, PlaceType } from "@/src/services/saved-places";
import { colors } from "@/src/styles/colors";

const labels = { casa: "Casa", faculdade: "Faculdade" };

export default function SavedPlaces() {
  const [type, setType] = useState<PlaceType | null>(null);
  const [description, setDescription] = useState("");
  const [point, setPoint] = useState<PlaceCoordinates | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [places, setPlaces] = useState<LocaisUsuario>({ casa: null, faculdade: null });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    buscarLocais().then((data) => { if (active) setPlaces(data); })
      .catch(() => { if (active) setLoadError("Não foi possível carregar seus locais salvos."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]));

  function open(value: PlaceType) {
    const local = places[value];
    setDescription(local?.descricao ?? "");
    setPoint(local ? { latitude: local.latitude, longitude: local.longitude } : null);
    setError("");
    setSuccess("");
    setType(value);
  }

  async function save() {
    if (!type || !point || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    let saved = false;
    try {
      const message = await cadastrarLocal(type, description, point);
      saved = true;
      const updated = await buscarLocais();
      setPlaces(updated);
      setSuccess(message || "Local salvo com sucesso!");
      setType(null);
    } catch (err) {
      setError(saved
        ? "Local salvo, mas não foi possível recarregar os dados. Seus dados digitados foram mantidos; tente salvar novamente para atualizar a tela."
        : localErrorMessage(err));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <View className="mx-5 mt-6 rounded-3xl bg-platinum-50 p-5">
      <Text className="text-xl font-bold text-velvet-orchid-900">Locais salvos</Text>
      <Text className="text-platinum-600 mt-1 mb-3">Cadastre sua casa e sua faculdade pelo mapa.</Text>
      {loading && <ActivityIndicator color={colors["velvet-orchid"][600]} />}
      {!!loadError && <View>
        <Text accessibilityRole="alert" className="text-velvet-orchid-800">{loadError}</Text>
        <Pressable onPress={() => setReload((value) => value + 1)} accessibilityRole="button" className="py-3">
          <Text className="font-bold text-velvet-orchid-700">Tentar novamente</Text>
        </Pressable>
      </View>}
      {(["casa", "faculdade"] as const).map((value) => {
        const Icon = value === "casa" ? House : GraduationCap;
        return <Pressable key={value} disabled={loading || !!loadError} onPress={() => open(value)} accessibilityRole="button"
          accessibilityState={{ disabled: loading || !!loadError }}
          accessibilityLabel={`${places[value] ? "Editar" : "Cadastrar"} ${labels[value].toLowerCase()}`}
          className="flex-row items-center gap-3 py-4 border-b border-platinum-200">
          <Icon size={24} color={colors["velvet-orchid"][600]} />
          <View className="flex-1">
            <Text className="font-bold text-velvet-orchid-900">{labels[value]}</Text>
            <Text numberOfLines={2} className="text-platinum-600">{places[value]?.descricao ?? "Cadastrar localização"}</Text>
          </View>
          <ChevronRight size={20} color={colors["velvet-orchid"][600]} />
        </Pressable>;
      })}
      {!!success && <Text accessibilityLiveRegion="polite" className="mt-3 text-velvet-orchid-700">{success}</Text>}

      <Modal visible={type !== null} animationType="slide" onRequestClose={() => { if (!busy) setType(null); }}>
        {type && <SafeAreaView className="flex-1 bg-platinum-50">
          <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View className="flex-row items-center justify-between px-5 py-3">
              <Text className="text-xl font-bold text-velvet-orchid-900">{places[type] ? "Editar" : "Cadastrar"} {labels[type].toLowerCase()}</Text>
              <Pressable disabled={busy} onPress={() => setType(null)} accessibilityRole="button" accessibilityLabel="Fechar cadastro" className="p-3">
                <X color={colors["velvet-orchid"][700]} />
              </Pressable>
            </View>
            <Text className="px-5 pb-3 text-platinum-600">Toque no mapa para marcar o local. Arraste o marcador para ajustar.</Text>
            <View className="flex-1" pointerEvents={busy ? "none" : "auto"}>
              <SavedPlaceMap point={point} onSelect={setPoint} />
            </View>
            <View className="p-5">
              <Text className="mb-2 font-bold text-velvet-orchid-900">Descrição</Text>
              <TextInput value={description} onChangeText={setDescription} editable={!busy} maxLength={255}
                accessibilityLabel="Descrição do local" placeholder="Dê um nome para o local"
                placeholderTextColor={colors.platinum[500]}
                className="border border-platinum-300 rounded-xl px-4 py-3 text-velvet-orchid-900" />
              <Text className="text-platinum-600 mt-2">
                {point ? `Ponto selecionado: ${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}` : "Selecione um ponto no mapa para continuar."}
              </Text>
              {!!error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="mt-3 text-velvet-orchid-800">{error}</Text>}
              <Pressable onPress={save} disabled={busy || !point || !description.trim()}
                accessibilityRole="button" accessibilityState={{ disabled: busy || !point || !description.trim(), busy }}
                className={`mt-4 rounded-xl py-4 items-center ${busy || !point || !description.trim() ? "bg-platinum-300" : "bg-velvet-orchid-700"}`}>
                {busy ? <ActivityIndicator color={colors.platinum[50]} /> : <Text className="text-white font-bold">Salvar {labels[type].toLowerCase()}</Text>}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>}
      </Modal>
    </View>
  );
}
