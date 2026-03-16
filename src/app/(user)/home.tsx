import { Pressable, Text, View } from "react-native";
import "@/global.css"
import { Link } from "expo-router";

export default function Home(){
    return(
        <View className="flex justify-center items-center h-full">
            <Link href={"/login"}>
                <Text className="text-3xl text-red-600">
                    Sair
                </Text>
            </Link>
        </View>
    )
}