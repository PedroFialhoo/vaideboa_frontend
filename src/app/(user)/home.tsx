import { Pressable, Text, View } from "react-native";
import "@/global.css"
import { Link } from "expo-router";

export default function Home(){
    return(
        <View className="flex justify-center items-center h-full">
            <Text className="text-3xl text-red-600">
                Home
            </Text>
        </View>
    )
}