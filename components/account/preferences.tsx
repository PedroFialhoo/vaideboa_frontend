import {
  Radio,
  RadioGroup,
  RadioIcon,
  RadioIndicator,
  RadioLabel,
} from '@/components/ui/radio';
import "@/global.css";
import { ChevronRight, Cigarette, Music, PawPrint, Speech } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { CircleIcon } from '@/components/ui/icon';

export default function Preferences(){
  const [openItem, setOpenItem] = useState<string | null>(null);

  const [preferences, setPreferences] = useState({
    conversa: "",
    musica: "",
    cigarro: "",
    pet: "",
  });

  const toggleItem = (item: string) => {
    setOpenItem(openItem === item ? null : item);
  };

  const handleChange = (key: string, value: string) => {
    setPreferences({ ...preferences, [key]: value });
  };

  return(
    <View className="px-6 mt-6">
      <View className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <Text className="text-velvet-orchid-900 font-black text-lg mb-4">
          Preferências da Carona
        </Text>

        {/* CONVERSA */}
        <TouchableOpacity onPress={() => toggleItem("conversa")} className="flex-row items-center py-4 border-b border-platinum">
          <View className="bg-purple-x11-100 p-2 rounded-xl mr-4">
            <Speech size={22} color="#7b4d91" />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-velvet-orchid-900">Conversa</Text>
            <Text className="text-gray-500 text-xs">Curte trocar ideia ou prefere silêncio?</Text>
          </View>
          <ChevronRight size={20} color="#391f47"
            style={{ transform: [{ rotate: openItem === "conversa" ? "90deg" : "0deg" }] }}
          />
        </TouchableOpacity>

        {openItem === "conversa" && (
          <View className="pl-8 pt-1 pb-2">
            <RadioGroup value={preferences.conversa} onChange={(v) => handleChange("conversa", v)}>
              <Radio value="SEM_PROBLEMA" className="flex-row items-center py-1">
                <RadioIndicator className="mr-2 w-4 h-4"><RadioIcon as={CircleIcon} className="w-1.5 h-1.5" /></RadioIndicator>
                <RadioLabel className="text-gray-500 text-sm">Bora trocar ideia a viagem toda</RadioLabel>
              </Radio>
              <Radio value="TALVEZ" className="flex-row items-center py-1">
                <RadioIndicator className="mr-2 w-4 h-4"><RadioIcon as={CircleIcon} className="w-1.5 h-1.5" /></RadioIndicator>
                <RadioLabel className="text-gray-500 text-sm">Falo se puxar assunto</RadioLabel>
              </Radio>
              <Radio value="NUNCA" className="flex-row items-center py-1">
                <RadioIndicator className="mr-2 w-4 h-4"><RadioIcon as={CircleIcon} className="w-1.5 h-1.5" /></RadioIndicator>
                <RadioLabel className="text-gray-500 text-sm">Prefiro silêncio</RadioLabel>
              </Radio>
            </RadioGroup>
          </View>
        )}

        {/* MUSICA */}
        <TouchableOpacity onPress={() => toggleItem("musica")} className="flex-row items-center py-4 border-b border-platinum">
          <View className="bg-purple-x11-100 p-2 rounded-xl mr-4">
            <Music size={22} color="#7b4d91" />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-velvet-orchid-900">Música</Text>
            <Text className="text-gray-500 text-xs">Vai rolar som na viagem?</Text>
          </View>
          <ChevronRight size={20} color="#391f47"
            style={{ transform: [{ rotate: openItem === "musica" ? "90deg" : "0deg" }] }}
          />
        </TouchableOpacity>

        {openItem === "musica" && (
          <View className="pl-8 pt-1 pb-2">
            <RadioGroup value={preferences.musica} onChange={(v) => handleChange("musica", v)}>
              <Radio value="SEM_PROBLEMA" className="flex-row items-center py-1">
                <RadioIndicator className="mr-2 w-4 h-4"><RadioIcon as={CircleIcon} className="w-1.5 h-1.5" /></RadioIndicator>
                <RadioLabel className="text-gray-500 text-sm">DJ da viagem sou eu</RadioLabel>
              </Radio>
              <Radio value="TALVEZ" className="flex-row items-center py-1">
                <RadioIndicator className="mr-2 w-4 h-4"><RadioIcon as={CircleIcon} className="w-1.5 h-1.5" /></RadioIndicator>
                <RadioLabel className="text-gray-500 text-sm">Depende do clima</RadioLabel>
              </Radio>
              <Radio value="NUNCA" className="flex-row items-center py-1">
                <RadioIndicator className="mr-2 w-4 h-4"><RadioIcon as={CircleIcon} className="w-1.5 h-1.5" /></RadioIndicator>
                <RadioLabel className="text-gray-500 text-sm">Prefiro silêncio</RadioLabel>
              </Radio>
            </RadioGroup>
          </View>
        )}

        {/* CIGARRO */}
        <TouchableOpacity onPress={() => toggleItem("cigarro")} className="flex-row items-center py-4 border-b border-platinum">
          <View className="bg-purple-x11-100 p-2 rounded-xl mr-4">
            <Cigarette size={22} color="#7b4d91" />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-velvet-orchid-900">Cigarro</Text>
            <Text className="text-gray-500 text-xs">Pode fumar no carro?</Text>
          </View>
          <ChevronRight size={20} color="#391f47"
            style={{ transform: [{ rotate: openItem === "cigarro" ? "90deg" : "0deg" }] }}
          />
        </TouchableOpacity>

        {openItem === "cigarro" && (
          <View className="pl-8 pt-1 pb-2">
            <RadioGroup value={preferences.cigarro} onChange={(v) => handleChange("cigarro", v)}>
              <Radio value="SEM_PROBLEMA" className="flex-row items-center py-1">
                <RadioIndicator className="mr-2 w-4 h-4"><RadioIcon as={CircleIcon} className="w-1.5 h-1.5" /></RadioIndicator>
                <RadioLabel className="text-gray-500 text-sm">Liberado</RadioLabel>
              </Radio>
              <Radio value="TALVEZ" className="flex-row items-center py-1">
                <RadioIndicator className="mr-2 w-4 h-4"><RadioIcon as={CircleIcon} className="w-1.5 h-1.5" /></RadioIndicator>
                <RadioLabel className="text-gray-500 text-sm">Só com janela aberta</RadioLabel>
              </Radio>
              <Radio value="NUNCA" className="flex-row items-center py-1">
                <RadioIndicator className="mr-2 w-4 h-4"><RadioIcon as={CircleIcon} className="w-1.5 h-1.5" /></RadioIndicator>
                <RadioLabel className="text-gray-500 text-sm">Nem pensar</RadioLabel>
              </Radio>
            </RadioGroup>
          </View>
        )}

        {/* PET */}
        <TouchableOpacity onPress={() => toggleItem("pet")} className="flex-row items-center py-4">
          <View className="bg-purple-x11-100 p-2 rounded-xl mr-4">
            <PawPrint size={22} color="#7b4d91" />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-velvet-orchid-900">Pet</Text>
            <Text className="text-gray-500 text-xs">Libera os pets ou só gente mesmo?</Text>
          </View>
          <ChevronRight size={20} color="#391f47"
            style={{ transform: [{ rotate: openItem === "pet" ? "90deg" : "0deg" }] }}
          />
        </TouchableOpacity>

        {openItem === "pet" && (
          <View className="pl-8 pt-1 pb-2">
            <RadioGroup value={preferences.pet} onChange={(v) => handleChange("pet", v)}>
              <Radio value="SEM_PROBLEMA" className="flex-row items-center py-1">
                <RadioIndicator className="mr-2 w-4 h-4"><RadioIcon as={CircleIcon} className="w-1.5 h-1.5" /></RadioIndicator>
                <RadioLabel className="text-gray-500 text-sm">Pet é bem-vindo</RadioLabel>
              </Radio>
              <Radio value="TALVEZ" className="flex-row items-center py-1">
                <RadioIndicator className="mr-2 w-4 h-4"><RadioIcon as={CircleIcon} className="w-1.5 h-1.5" /></RadioIndicator>
                <RadioLabel className="text-gray-500 text-sm">Depende do pet</RadioLabel>
              </Radio>
              <Radio value="NUNCA" className="flex-row items-center py-1">
                <RadioIndicator className="mr-2 w-4 h-4"><RadioIcon as={CircleIcon} className="w-1.5 h-1.5" /></RadioIndicator>
                <RadioLabel className="text-gray-500 text-sm">Melhor não</RadioLabel>
              </Radio>
            </RadioGroup>
          </View>
        )}

      </View>
    </View>
  )
}