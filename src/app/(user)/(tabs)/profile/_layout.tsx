import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';

const { Navigator } = createMaterialTopTabNavigator();

const TopTabs = withLayoutContext(Navigator);

export default function ProfileLayout() {
  return (
    <TopTabs
      screenOptions={{
        tabBarActiveTintColor: "#a571c1", // cor do ícone ativo
        tabBarInactiveTintColor: "#f7e5ff", // cor do ícone inativo
        tabBarStyle: {
          backgroundColor: "#120e15",
        }}}
    >
      <TopTabs.Screen name="account" options={{ title: "Perfil" }} />
      <TopTabs.Screen name="config" options={{ title: "Configurações" }} />
    </TopTabs>
  );
}