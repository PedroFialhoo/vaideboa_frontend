import "@/global.css";
import { Car, ChevronRight, User } from "lucide-react-native";
import { useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Svg, { ClipPath, Defs, Path, Rect } from "react-native-svg";
import Logo from "../../src/assets/images/logo-vdb.svg";

type ScoreProps = {
  mediaMotorista: number | null;
  numAvaliacoesMotorista: number | null;
  mediaPassageiro: number | null;
  numAvaliacoesPassageiro: number | null;
};

const STAR_PATH = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

const FractionalStar = ({ fillPercent, uid }: { fillPercent: number; uid: string }) => {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Defs>
        <ClipPath id={uid}>
          <Rect x={0} y={0} width={24 * fillPercent} height={24} />
        </ClipPath>
      </Defs>
      <Path d={STAR_PATH} fill="#e5d5ed" stroke="#a571c1" strokeWidth={1} />
      <Path d={STAR_PATH} fill="#a571c1" clipPath={`url(#${uid})`} />
    </Svg>
  );
};

const StarDisplay = ({ rating }: { rating: number }) => {
  const ids = useRef(Array.from({ length: 5 }, () => Math.random().toString(36).substring(2, 9))).current;
  const fullStars = Math.floor(rating);
  const partial = rating - fullStars;

  return (
    <View className="flex-row items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => {
        let fill = 0;
        if (i < fullStars) fill = 1;
        else if (i === fullStars && partial > 0) fill = partial;
        return <FractionalStar key={i} fillPercent={fill} uid={ids[i]} />;
      })}
      <Text className="text-velvet-orchid-900 font-black text-lg ml-2">
        {rating.toFixed(1)}
      </Text>
    </View>
  );
};

export default function Score({
  mediaMotorista,
  numAvaliacoesMotorista,
  mediaPassageiro,
  numAvaliacoesPassageiro,
}: ScoreProps) {
  const [open, setOpen] = useState(false);

  return (
    <View className="px-6 mt-6 mb-2">
      <View className="bg-white rounded-[32px] p-6 shadow-lg border border-purple-x11-50">
        <TouchableOpacity
          onPress={() => setOpen(!open)}
          className="flex-row items-center"
        >
          <Text className="text-velvet-orchid-900 font-black text-xl flex-1">
            Score
          </Text>
          <ChevronRight
            size={20}
            color="#7b4d91"
            style={{ transform: [{ rotate: open ? "90deg" : "0deg" }] }}
          />
        </TouchableOpacity>

        {open && (
          <View className="mt-4">
            {/* MOTORISTA */}
            <View className="bg-vintage-grape-100/50 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center mb-3">
                <View className="bg-purple-x11-100 p-2 rounded-xl mr-3">
                  <Logo width={20} height={20} fill="#7b4d91" />
                </View>
                <Text className="text-velvet-orchid-900 font-bold text-base">
                  Motorista
                </Text>
              </View>

              {mediaMotorista !== null ? (
                <View className="ml-1">
                  <Text className="text-gray-680 text-sm mb-1">Média de avaliações</Text>
                  <StarDisplay rating={mediaMotorista} />
                  <Text className="text-gray-680 text-sm mt-2">
                    {numAvaliacoesMotorista} {numAvaliacoesMotorista === 1 ? "avaliação recebida" : "avaliações recebidas"}
                  </Text>
                </View>
              ) : (
                <Text className="text-gray-400 text-sm italic ml-1">
                  Ainda não atuou como motorista
                </Text>
              )}
            </View>

            {/* PASSAGEIRO */}
            <View className="bg-vintage-grape-100/50 rounded-2xl p-4">
              <View className="flex-row items-center mb-3">
                <View className="bg-purple-x11-100 p-2 rounded-xl mr-3">
                  <User size={20} color="#7b4d91" />
                </View>
                <Text className="text-velvet-orchid-900 font-bold text-base">
                  Passageiro
                </Text>
              </View>

              {mediaPassageiro !== null ? (
                <View className="ml-1">
                  <Text className="text-gray-680 text-sm mb-1">Média de avaliações</Text>
                  <StarDisplay rating={mediaPassageiro} />
                  <Text className="text-gray-680 text-sm mt-2">
                    {numAvaliacoesPassageiro} {numAvaliacoesPassageiro === 1 ? "avaliação recebida" : "avaliações recebidas"}
                  </Text>
                </View>
              ) : (
                <Text className="text-gray-400 text-sm italic ml-1">
                  Ainda não viajou como passageiro
                </Text>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
