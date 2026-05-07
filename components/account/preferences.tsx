import "@/global.css";
import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";
import { ChevronRight, Cigarette, Music, PawPrint, Save, Speech } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type PreferencesType = {
  conversa: string;
  musica: string;
  cigarro: string;
  pet: string;
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
    console.log("Preferencias: ", preferences)
    getToken().then(token => {
      api.put("user/preferencias",
        {
          conversa: preferences.conversa,
          musica: preferences.musica,
          cigarro: preferences.cigarro,
          animais: preferences.pet,
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
        setMessage(err.response?.data)
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
              <Speech size={22} color="#7b4d91" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-velvet-orchid-900">Conversa</Text>
              <Text className="text-gray-400 text-[10px]">Interação social no carro</Text>
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
              <Music size={22} color="#7b4d91" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-velvet-orchid-900">Música</Text>
              <Text className="text-gray-400 text-[10px]">Som durante o trajeto</Text>
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
              <Cigarette size={22} color="#7b4d91" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-velvet-orchid-900">Fumo</Text>
              <Text className="text-gray-400 text-[10px]">Uso de tabaco/vape</Text>
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
              <PawPrint size={22} color="#7b4d91" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-velvet-orchid-900">Pets</Text>
              <Text className="text-gray-400 text-[10px]">Animais de estimação</Text>
            </View>
            <ChevronRight size={18} color="#7b4d91" style={{ transform: [{ rotate: openItem === "pet" ? "90deg" : "0deg" }] }} />
          </TouchableOpacity>
          {openItem === "pet" && renderOptions("pet", [
            { label: "Amo", value: "SEM_PROBLEMA" },
            { label: "Pequenos", value: "TALVEZ" },
            { label: "Não", value: "NUNCA" }
          ])}
        </View>
      </View>
    </View>
  );
}