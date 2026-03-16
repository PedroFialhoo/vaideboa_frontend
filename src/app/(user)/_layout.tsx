import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons"

export default function UserLayout(){
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
                        return <FontAwesome name="search" color={color} size={size}/>
                    }
                }}  
            />
            <Tabs.Screen
                name="travels"
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => {
                        return <FontAwesome name="car" color={color} size={size}/>
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