import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { Check, X } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming, 
  Easing
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import "@/global.css";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function PageStatus() {
  const router = useRouter();
  const { sucess, message, to } = useLocalSearchParams<{
    sucess: string;
    message: string;
    to: string;
  }>();

  const isSucess = sucess === "true";
  const progress = useSharedValue(0);

  const size = 120;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    // animação
    progress.value = withTiming(1, { 
      duration: 3000, 
      easing: Easing.linear 
    });

    // navegação (JS thread)
    const timer = setTimeout(() => {
      if (to) {
        router.push(to as any);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: circumference * (1 - progress.value),
    };
  });

  return (
    <View className="flex-1 bg-platinum items-center justify-center px-10">
      <View className="items-center justify-center relative">
        <Svg width={size} height={size} className="rotate-[-90deg]">
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isSucess ? "#7b4d91" : "#EF4444"}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </Svg>

        <View 
          className={`absolute w-20 h-20 rounded-full items-center justify-center ${
            isSucess ? "bg-velvet-orchid-700" : "bg-red-500"
          } shadow-xl`}
        >
          {isSucess ? (
            <Check size={45} color="white" strokeWidth={3} />
          ) : (
            <X size={45} color="white" strokeWidth={3} />
          )}
        </View>
      </View>

      <View className="mt-8 items-center">
        <Text className="text-velvet-orchid-900 font-black text-2xl text-center mb-2">
          {isSucess ? "Tudo certo!" : "Ops, algo deu errado"}
        </Text>
        <Text className="text-gray-500 text-center text-lg leading-6">
          {message}
        </Text>
      </View>

      <View className="absolute bottom-20 items-center">
        <Text className="text-gray-400 text-xs uppercase font-bold tracking-widest">
          Redirecionando em instantes...
        </Text>
      </View>
    </View>
  );
}