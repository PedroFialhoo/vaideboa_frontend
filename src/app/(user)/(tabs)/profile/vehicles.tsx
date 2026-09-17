import "@/global.css";
import { Car, Check, Plus, RefreshCw } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "expo-router/react-navigation";
import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";

type FipeOption = { codigo: string; nome: string };
type Vehicle = {
  id: number;
  marca: string;
  modelo: string;
  cor: string;
  placa: string;
  ano: number;
  vagas: number;
  arCondicionado: boolean | null;
  descricao: string | null;
};

const FIPE_URL = "https://parallelum.com.br/fipe/api/v1/carros";

function cleanPlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [brands, setBrands] = useState<FipeOption[]>([]);
  const [models, setModels] = useState<FipeOption[]>([]);
  const [years, setYears] = useState<FipeOption[]>([]);
  const [brandCode, setBrandCode] = useState("");
  const [modelCode, setModelCode] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [plate, setPlate] = useState("");
  const [seats, setSeats] = useState("4");
  const [airConditioning, setAirConditioning] = useState(false);
  const [description, setDescription] = useState("");
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingFipe, setLoadingFipe] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const loadVehicles = useCallback(async () => {
    setLoadingVehicles(true);
    try {
      const token = await getToken();
      const response = await api.get<Vehicle[]>("/carro/meus", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVehicles(response.data);
    } catch {
      setMessage("Não foi possível carregar seus veículos.");
      setSuccess(false);
    } finally {
      setLoadingVehicles(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
    fetch(`${FIPE_URL}/marcas`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: FipeOption[]) => setBrands(data))
      .catch(() => undefined);
  }, [loadVehicles]);

  useFocusEffect(useCallback(() => {
    void loadVehicles();
  }, [loadVehicles]));

  async function selectBrand(option: FipeOption) {
    setBrand(option.nome);
    setBrandCode(option.codigo);
    setModel("");
    setModelCode("");
    setYear("");
    setModels([]);
    setYears([]);
    setLoadingFipe(true);
    try {
      const response = await fetch(`${FIPE_URL}/marcas/${option.codigo}/modelos`);
      if (!response.ok) throw new Error();
      const data = await response.json() as { modelos: FipeOption[] };
      setModels(data.modelos);
    } catch {
      setMessage("Não foi possível buscar os modelos FIPE. Você pode preencher manualmente.");
      setSuccess(false);
    } finally {
      setLoadingFipe(false);
    }
  }

  async function selectModel(option: FipeOption) {
    setModel(option.nome);
    setModelCode(option.codigo);
    setYear("");
    setYears([]);
    setLoadingFipe(true);
    try {
      const response = await fetch(`${FIPE_URL}/marcas/${brandCode}/modelos/${option.codigo}/anos`);
      if (!response.ok) throw new Error();
      setYears(await response.json() as FipeOption[]);
    } catch {
      setMessage("Não foi possível buscar os anos FIPE. Você pode preencher manualmente.");
      setSuccess(false);
    } finally {
      setLoadingFipe(false);
    }
  }

  function selectYear(option: FipeOption) {
    setYear(option.nome.slice(0, 4));
  }

  async function saveVehicle() {
    setMessage("");
    const normalizedPlate = cleanPlate(plate);
    const parsedYear = Number(year);
    const parsedSeats = Number(seats);
    const validPlate = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(normalizedPlate);

    if (!brand.trim() || !model.trim() || !color.trim() || !validPlate || !Number.isInteger(parsedYear) || !Number.isInteger(parsedSeats)) {
      setMessage("Preencha marca, modelo, cor, placa válida, ano e vagas.");
      setSuccess(false);
      return;
    }
    if (parsedYear < 1900 || parsedYear > 2100 || parsedSeats < 1 || parsedSeats > 7) {
      setMessage("Informe um ano válido e entre 1 e 7 vagas.");
      setSuccess(false);
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const response = await api.post("/carro/cadastrar", {
        marca: brand.trim(), modelo: model.trim(), cor: color.trim(), placa: normalizedPlate,
        ano: parsedYear, vagas: parsedSeats, arCondicionado: airConditioning,
        descricao: description.trim() || null,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage(response.data);
      setSuccess(true);
      setBrand(""); setBrandCode(""); setModel(""); setModelCode(""); setYear("");
      setColor(""); setPlate(""); setSeats("4"); setAirConditioning(false); setDescription("");
      setModels([]); setYears([]);
      await loadVehicles();
    } catch (error: any) {
      setMessage(error.response?.data || "Não foi possível cadastrar o veículo.");
      setSuccess(false);
    } finally {
      setSaving(false);
    }
  }

  const filteredBrands = brands.filter((item) => item.nome.toLowerCase().includes(brand.toLowerCase())).slice(0, 6);
  const filteredModels = models.filter((item) => item.nome.toLowerCase().includes(model.toLowerCase())).slice(0, 6);

  return (
    <ScrollView className="flex-1 bg-vintage-grape-200" contentContainerStyle={{ padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
      <View className="flex-row items-center gap-3">
        <View className="bg-purple-x11-100 p-3 rounded-2xl"><Car size={24} color="#7b4d91" /></View>
        <View className="flex-1"><Text className="text-velvet-orchid-900 font-black text-xl">Meus veículos</Text><Text className="text-gray-500 text-xs">Escolha um veículo ao oferecer uma carona.</Text></View>
        <TouchableOpacity onPress={loadVehicles} className="p-2"><RefreshCw size={20} color="#7b4d91" /></TouchableOpacity>
      </View>

      {loadingVehicles ? <ActivityIndicator color="#7b4d91" /> : vehicles.length === 0 ? (
        <Text className="text-gray-500 text-center py-4">Você ainda não cadastrou nenhum veículo.</Text>
      ) : vehicles.map((vehicle) => (
        <View key={vehicle.id} className="bg-white rounded-2xl p-4 border border-purple-x11-100">
          <Text className="font-black text-velvet-orchid-900">{vehicle.marca} {vehicle.modelo}</Text>
          <Text className="text-gray-500 text-sm">{vehicle.ano} · {vehicle.cor} · {vehicle.placa} · {vehicle.vagas} vagas</Text>
        </View>
      ))}

      <View className="bg-white rounded-3xl p-5 gap-3">
        <View className="flex-row items-center gap-2"><Plus size={20} color="#7b4d91" /><Text className="font-black text-velvet-orchid-900 text-lg">Cadastrar veículo</Text></View>
        <Text className="text-gray-500 text-xs">Use as sugestões FIPE ou preencha os dados manualmente.</Text>

        <Field label="MARCA" value={brand} onChangeText={(value) => { setBrand(value); setBrandCode(""); }} placeholder="Ex.: Honda" />
        {brand.length > 0 && !brandCode && filteredBrands.map((option) => <Suggestion key={option.codigo} label={option.nome} onPress={() => selectBrand(option)} />)}
        <Field label="MODELO" value={model} onChangeText={(value) => { setModel(value); setModelCode(""); }} placeholder="Ex.: Civic" />
        {model.length > 0 && modelCode === "" && filteredModels.map((option) => <Suggestion key={option.codigo} label={option.nome} onPress={() => selectModel(option)} />)}
        <Field label="ANO" value={year} onChangeText={setYear} placeholder="Ex.: 2020" keyboardType="number-pad" />
        {years.length > 0 && !year && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{years.slice(0, 20).map((option) => <Suggestion key={option.codigo} label={option.nome} onPress={() => selectYear(option)} />)}</ScrollView>}
        <Field label="COR" value={color} onChangeText={setColor} placeholder="Ex.: Prata" />
        <Field label="PLACA" value={plate} onChangeText={(value) => setPlate(cleanPlate(value))} placeholder="ABC1D23" autoCapitalize="characters" />
        <Field label="VAGAS DISPONÍVEIS" value={seats} onChangeText={setSeats} placeholder="Ex.: 4" keyboardType="number-pad" />
        <Field label="DESCRIÇÃO (OPCIONAL)" value={description} onChangeText={setDescription} placeholder="Ex.: Porta-malas amplo" />
        <View className="flex-row items-center justify-between pt-1"><Text className="font-bold text-velvet-orchid-900">Ar-condicionado</Text><Switch value={airConditioning} onValueChange={setAirConditioning} trackColor={{ false: "#d1d5db", true: "#7b4d91" }} /></View>
        {loadingFipe && <ActivityIndicator color="#7b4d91" />}
        {message && <Text className={`text-center text-xs font-bold ${success ? "text-green-700" : "text-red-600"}`}>{message}</Text>}
        <TouchableOpacity onPress={saveVehicle} disabled={saving} className="bg-velvet-orchid-700 rounded-xl p-4 flex-row justify-center items-center gap-2">
          {saving ? <ActivityIndicator color="white" /> : <Check size={18} color="white" />}<Text className="text-white font-bold">Cadastrar veículo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, ...inputProps } = props;
  return <View><Text className="text-velvet-orchid-700 font-bold text-xs mb-1">{label}</Text><TextInput {...inputProps} className="border border-platinum rounded-xl px-3 py-3 text-velvet-orchid-900" /></View>;
}

function Suggestion({ label, onPress }: { label: string; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} className="bg-purple-x11-50 border border-purple-x11-100 rounded-xl px-3 py-2"><Text className="text-velvet-orchid-900 text-xs font-semibold">{label}</Text></TouchableOpacity>;
}
