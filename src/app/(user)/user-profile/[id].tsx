import "@/global.css";
import { ArrowLeft, Car, Cigarette, MessageCircle, Music, PawPrint, Star, User } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { type ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { api } from "@/src/services/api";
import { getToken } from "@/src/services/storage";

type Profile = {
  id: number;
  nome: string;
  foto: string | null;
  genero: string;
  preferenciasDto: { conversa: string; musica: string; cigarro: string; animais: string };
  rankingDto: {
    notaMotorista: number | null;
    notaPassageiro: number | null;
    numAvaliacoesMotorista: number;
    numAvaliacoesPassageiro: number;
    numViagensMotorista: number;
    numViagensPassageiro: number;
    rankingMotorista: string | null;
  };
};

const preferenceLabel: Record<string, string> = {
  SEM_PROBLEMA: "Sem problema",
  TALVEZ: "Depende",
  NUNCA: "Não",
};

export default function UserProfile() {
  const { id, idCarona } = useLocalSearchParams<{ id: string; idCarona: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = await getToken();
        const response = await api.get<Profile>(`/user/perfil/${id}`, {
          params: { idCarona },
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(response.data);
      } catch (requestError: any) {
        setError(requestError.response?.data || "Não foi possível carregar este perfil.");
      } finally {
        setLoading(false);
      }
    }
    if (id && idCarona) void loadProfile();
  }, [id, idCarona]);

  if (loading) return <View className="flex-1 bg-vintage-grape-200 items-center justify-center"><ActivityIndicator color="#7b4d91" /></View>;
  if (!profile) return <View className="flex-1 bg-vintage-grape-200 items-center justify-center px-8 gap-4"><Text className="text-velvet-orchid-900 text-center font-bold">{error || "Perfil não encontrado."}</Text><TouchableOpacity onPress={() => router.back()} className="bg-velvet-orchid-700 px-5 py-3 rounded-xl"><Text className="text-white font-bold">Voltar</Text></TouchableOpacity></View>;

  const ranking = profile.rankingDto;
  const preferences = [
    { label: "Conversa", value: profile.preferenciasDto.conversa, icon: MessageCircle },
    { label: "Música", value: profile.preferenciasDto.musica, icon: Music },
    { label: "Fumo", value: profile.preferenciasDto.cigarro, icon: Cigarette },
    { label: "Animais", value: profile.preferenciasDto.animais, icon: PawPrint },
  ];

  return <ScrollView className="flex-1 bg-vintage-grape-200" contentContainerStyle={{ paddingBottom: 36 }}>
    <View className="bg-velvet-orchid-900 pt-12 pb-10 px-6 rounded-b-[48px] items-center">
      <TouchableOpacity onPress={() => router.back()} className="absolute left-6 top-12 p-2"><ArrowLeft size={24} color="white" /></TouchableOpacity>
      <View className="w-28 h-28 rounded-full border-4 border-white bg-platinum overflow-hidden items-center justify-center">
        {profile.foto && !imageError ? <Image source={{ uri: profile.foto }} onError={() => setImageError(true)} className="w-full h-full" /> : <User size={48} color="#7b4d91" />}
      </View>
      <Text className="text-white font-black text-2xl mt-4 text-center">{profile.nome}</Text>
      <Text className="text-purple-x11-100 font-bold text-sm mt-1">{profile.genero?.replaceAll("_", " ")}</Text>
      {ranking.rankingMotorista && <Text className="text-purple-x11-50 text-sm mt-1">Nível no volante: {ranking.rankingMotorista.toLowerCase()}</Text>}
    </View>

    <View className="px-6 mt-6 gap-4">
      <View className="bg-white rounded-3xl p-5 border border-purple-x11-50">
        <Text className="font-black text-velvet-orchid-900 text-lg mb-4">Reputação</Text>
        <ScoreRow title="Motorista" icon={<Car size={20} color="#7b4d91" />} rating={ranking.notaMotorista} count={ranking.numAvaliacoesMotorista} trips={ranking.numViagensMotorista} />
        <View className="h-px bg-platinum my-4" />
        <ScoreRow title="Passageiro" icon={<User size={20} color="#7b4d91" />} rating={ranking.notaPassageiro} count={ranking.numAvaliacoesPassageiro} trips={ranking.numViagensPassageiro} />
      </View>

      <View className="bg-white rounded-3xl p-5 border border-purple-x11-50">
        <Text className="font-black text-velvet-orchid-900 text-lg mb-2">Preferências de viagem</Text>
        {preferences.map(({ label, value, icon: Icon }) => <View key={label} className="flex-row items-center py-3 border-b border-platinum last:border-b-0"><View className="bg-purple-x11-100 p-2 rounded-xl mr-3"><Icon size={18} color="#7b4d91" /></View><Text className="flex-1 font-bold text-velvet-orchid-900">{label}</Text><Text className="text-gray-500 text-sm">{preferenceLabel[value] || "Depende"}</Text></View>)}
      </View>
    </View>
  </ScrollView>;
}

function ScoreRow({ title, icon, rating, count, trips }: { title: string; icon: ReactNode; rating: number | null; count: number; trips: number }) {
  return <View><View className="flex-row items-center gap-2"><View className="bg-purple-x11-100 p-2 rounded-xl">{icon}</View><Text className="font-bold text-velvet-orchid-900">{title}</Text></View><View className="flex-row items-center mt-3"><Star size={18} fill="#a571c1" color="#a571c1" /><Text className="font-black text-velvet-orchid-900 ml-2">{rating === null ? "Sem avaliações" : rating.toFixed(1)}</Text><Text className="text-gray-500 text-xs ml-2">{count || 0} avaliações · {trips || 0} viagens</Text></View></View>;
}
