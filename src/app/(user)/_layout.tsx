import { FontAwesome } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Search } from "lucide-react-native";
import { useEffect } from "react";
import Logo from "../../assets/images/logo-vdb.svg";

export default function UserLayout() {
  useEffect(() => console.log("Logo: ", Logo), []);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#a571c1", // cor do ícone ativo
        tabBarInactiveTintColor: "#f7e5ff", // cor do ícone inativo
        tabBarStyle: {
          backgroundColor: "#120e15",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            return <FontAwesome name="home" color={color} size={size} />;
          },
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Buscar",
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            return <Search color={color} size={size} />;
          },
        }}
      />
      <Tabs.Screen
        name="travels"
        options={{
          title: "Minhas Caronas",
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            return <Logo width={size} height={size} fill={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            return <FontAwesome name="user-circle" color={color} size={size} />;
          },
        }}
      />
    </Tabs>
  );
}
