import { Pressable, Text, View } from "react-native";
import "@/global.css"

export default function Search(){
    return(
        <View className="flex justify-center items-center h-full">
            <Text className="text-3xl text-red-600">
                Busca
            </Text>
        </View>
    )
}