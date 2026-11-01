import "@/global.css";
import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";
import { ChevronRight, Cigarette, Music, PawPrint, Save, Speech, MapPin } from "lucide-react-native";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

type PreferencesType = {
  conversa: string;
  musica: string;
  cigarro: string;
  pet: string;
  raioDeslocamentoKm: string;
};

type Props = {
  preferences: PreferencesType;
  setPreferences: React.Dispatch<React.SetStateAction<PreferencesType>>;
};

// Componente interno para os botões de opção
const OptionButton = ({ label, value, current, onSelect }: { label: string, value: string, current: string, onSelect: (v: string) => void }) => {
  const isSelected = current === value;
  return (
    <TouchableOpacity
      onPress={() => onSelect(value)}
      className={`flex-1 mx-1 p-3 rounded-xl border items-center justify-center ${
        isSelected ? 'bg-velvet-orchid-700 border-velvet-orchid-700' : 'bg-platinum/20 border-platinum'
      }`}
    >
      <Text className={`text-[10px] font-black text-center ${isSelected ? 'text-white' : 'text-velvet-orchid-900'}`}>
        {label.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
};

export default function Preferences({ preferences, setPreferences }: Props) {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [message, setMessage] = useState("")
  const [goodMessage, setGoodMessage] = useState(true)

  const toggleItem = (item: string) => {
    setOpenItem(openItem === item ? null : item);
  };

  const handleChange = (key: keyof PreferencesType, value: string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const renderOptions = (key: keyof PreferencesType, options: {label: string, value: string}[]) => (
    <View className="flex flex-col">
      <View className="flex-row justify-between px-2 pt-2 pb-4 animate-in fade-in duration-300">
        {options.map((opt) => (
          <OptionButton 
            key={opt.value}
            label={opt.label}
            value={opt.value}
            current={preferences[key]}
            onSelect={(v) => handleChange(key, v)}
          />
        ))}     
      </View>
      <TouchableOpacity className="bg-velvet-orchid-700 rounded-xl p-3 flex-row items-center justify-center mb-2"
        onPress={updatePreferences}
      >
        <Save size={18} color="white" className="mr-2" />
        <Text className="text-white font-bold">Salvar Alterações</Text>
      </TouchableOpacity>
      {message.length > 0 && (
        <View className={`mb-2 p-3 rounded-2xl border ${goodMessage ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <Text className={`text-center font-bold text-xs ${goodMessage ? 'text-green-700' : 'text-red-700'}`}>
            {message}
          </Text>
        </View>
      )}
    </View>
  );


  const updatePreferences = () => {
    setMessage("")
    const valor = preferences.raioDeslocamentoKm.trim().replace(",", ".");
    const raioKm = Number(valor);
    const raioMetros = Math.round(raioKm * 1000);
    if (!/^\d+(?:\.\d+)?$/.test(valor) || !Number.isFinite(raioKm) || raioKm < 0.001
        || !Number.isSafeInteger(raioMetros) || raioMetros <= 0) {
      setMessage("Informe um raio válido em km, maior que zero (mínimo de 0,001 km).");
      setGoodMessage(false);
      return;
    }
    console.log("Preferencias: ", preferences)
    getToken().then(token => {
      api.put("user/preferencias",
        {
          conversa: preferences.conversa,
          musica: preferences.musica,
          cigarro: preferences.cigarro,
          animais: preferences.pet,
          raioDeslocamentoMetros: raioMetros,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      )
      .then(response => {
        console.log("Sucesso: ",response.data)
        setMessage("Preferências atualizadas!")
        setGoodMessage(true)
      })
      .catch(err => {
        console.log("Erro: ", err.response?.data)
        setMessage(typeof err.response?.data === "string" ? err.response.data : "Não foi possível salvar as preferências. Tente novamente.")
        setGoodMessage(false)
      })
    })
  }

  return (
    <View className="px-6 mt-6">
      <View className="bg-white rounded-[32px] p-6 shadow-lg border border-purple-x11-50">
        <Text className="text-velvet-orchid-900 font-black text-xl mb-4">
          Preferências
        </Text>

        {/* CONVERSA */}
        <View className="border-b border-platinum/50">
          <TouchableOpacity onPress={() => {toggleItem("conversa"), setMessage("")}} className="flex-row items-center py-4">
            <View className="bg-purple-x11-100 p-2.5 rounded-2xl mr-4">
              <Speech size={24} color="#7b4d91" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-velvet-orchid-900 text-[15px]">Conversa</Text>
              <Text className="text-gray-600 text-[13px]">Interação social no carro</Text>
            </View>
            <ChevronRight size={18} color="#7b4d91" style={{ transform: [{ rotate: openItem === "conversa" ? "90deg" : "0deg" }] }} />
          </TouchableOpacity>
          {openItem === "conversa" && renderOptions("conversa", [
            { label: "Tagarela", value: "SEM_PROBLEMA" },
            { label: "Moderado", value: "TALVEZ" },
            { label: "Quietinho", value: "NUNCA" }
          ])}
        </View>

        {/* MÚSICA */}
        <View className="border-b border-platinum/50">
          <TouchableOpacity onPress={() => {toggleItem("musica"), setMessage("")}} className="flex-row items-center py-4">
            <View className="bg-purple-x11-100 p-2.5 rounded-2xl mr-4">
              <Music size={24} color="#7b4d91" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-velvet-orchid-900 text-[15px]">Música</Text>
              <Text className="text-gray-600 text-[13px]">Som durante o trajeto</Text>
            </View>
            <ChevronRight size={18} color="#7b4d91" style={{ transform: [{ rotate: openItem === "musica" ? "90deg" : "0deg" }] }} />
          </TouchableOpacity>
          {openItem === "musica" && renderOptions("musica", [
            { label: "DJ On", value: "SEM_PROBLEMA" },
            { label: "DEPENDE", value: "TALVEZ" },
            { label: "Sem Som", value: "NUNCA" }
          ])}
        </View>

        {/* CIGARRO */}
        <View className="border-b border-platinum/50">
          <TouchableOpacity onPress={() => {toggleItem("cigarro"), setMessage("")}} className="flex-row items-center py-4">
            <View className="bg-purple-x11-100 p-2.5 rounded-2xl mr-4">
              <Cigarette size={24} color="#7b4d91" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-velvet-orchid-900 text-[15px]">Fumo</Text>
              <Text className="text-gray-600 text-[13px]">Uso de tabaco/vape</Text>
            </View>
            <ChevronRight size={18} color="#7b4d91" style={{ transform: [{ rotate: openItem === "cigarro" ? "90deg" : "0deg" }] }} />
          </TouchableOpacity>
          {openItem === "cigarro" && renderOptions("cigarro", [
            { label: "Pode", value: "SEM_PROBLEMA" },
            { label: "Depende", value: "TALVEZ" },
            { label: "Não", value: "NUNCA" }
          ])}
        </View>

        {/* PET */}
        <View>
          <TouchableOpacity onPress={() => {toggleItem("pet"), setMessage("")}} className="flex-row items-center py-4">
            <View className="bg-purple-x11-100 p-2.5 rounded-2xl mr-4">
              <PawPrint size={24} color="#7b4d91" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-velvet-orchid-900 text-[15px]">Pets</Text>
              <Text className="text-gray-600 text-[13px]">Ocupando vaga e com caixa de transporte</Text>
            </View>
            <ChevronRight size={18} color="#7b4d91" style={{ transform: [{ rotate: openItem === "pet" ? "90deg" : "0deg" }] }} />
          </TouchableOpacity>
          {openItem === "pet" && renderOptions("pet", [
            { label: "Amo", value: "SEM_PROBLEMA" },
            { label: "Pequenos", value: "TALVEZ" },
            { label: "Não", value: "NUNCA" }
          ])}
        </View>
        {/* RAIO DE DESLOCAMENTO */}
        <View className="border-t border-platinum/50">
          <TouchableOpacity onPress={() => { toggleItem("raio"); setMessage(""); }} className="flex-row items-center py-4">
            <View className="bg-purple-x11-100 p-2.5 rounded-2xl mr-4">
              <MapPin size={24} color="#7b4d91" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-velvet-orchid-900 text-[15px]">Raio de deslocamento</Text>
              <Text className="text-gray-600 text-[13px]">Distância máxima até o trajeto da carona</Text>
            </View>
            <ChevronRight size={18} color="#7b4d91" style={{ transform: [{ rotate: openItem === "raio" ? "90deg" : "0deg" }] }} />
          </TouchableOpacity>
          {openItem === "raio" && (
            <View className="pb-2">
              <Text className="text-velvet-orchid-900 font-semibold mb-2">Informe a distância em quilômetros</Text>
              <View className="flex-row items-center border border-platinum rounded-xl px-4 mb-2">
                <TextInput
                  accessibilityLabel="Raio de deslocamento em quilômetros"
                  keyboardType="decimal-pad"
                  value={preferences.raioDeslocamentoKm}
                  onChangeText={(value) => { handleChange("raioDeslocamentoKm", value); setMessage(""); }}
                  placeholder="Ex.: 0,5, 1 ou 50"
                  className="flex-1 py-3 text-velvet-orchid-900"
                />
                <Text className="text-velvet-orchid-900 font-bold ml-2">km</Text>
              </View>
              <Text className="text-gray-600 text-xs mb-4">0,5 km = 500 metros · 50 = 50 km. O raio considera a distância em linha reta até o trajeto.</Text>
              <TouchableOpacity onPress={updatePreferences} className="bg-velvet-orchid-700 rounded-xl p-3 flex-row items-center justify-center mb-2">
                <Save size={18} color="white" className="mr-2" />
                <Text className="text-white font-bold">Salvar Alterações</Text>
              </TouchableOpacity>
              {message.length > 0 && (
                <View className={`mb-2 p-3 rounded-2xl border ${goodMessage ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <Text accessibilityLiveRegion="polite" className={`text-center font-bold text-xs ${goodMessage ? 'text-green-700' : 'text-red-700'}`}>{message}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}