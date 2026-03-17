import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons"
import { CarFront, Search } from "lucide-react-native";
import Logo from "../../assets/images/logo-vdb.svg"
import { useEffect } from "react";

export default function UserLayout(){
    useEffect(() => (console.log("Logo: ", Logo)), [])
    return(
        <Tabs
            screenOptions={{
            tabBarActiveTintColor: "#a571c1", // cor do ícone ativo
            tabBarInactiveTintColor: "#f7e5ff", // cor do ícone inativo
            tabBarStyle: {
                backgroundColor: "#120e15",
            }
      }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => {
                        return <FontAwesome name="home" color={color} size={size}/>
                    }
                }}  
            />
            <Tabs.Screen
                name="search"
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => {
                        return <Search color={color} size={size}/>
                    }
                }}  
            />
            <Tabs.Screen
                name="travels"
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => {
                    return <Logo width={size} height={size} fill={color} />
                    }
                }}  
            />
            <Tabs.Screen
                name="profile"
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => {                     
                        return <FontAwesome name="user-circle" color={color} size={size}/>
                    }
                }}  
            />
        </Tabs>
    )
}