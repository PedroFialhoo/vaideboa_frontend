import { createMaterialTopTabNavigator } from 'expo-router/js-top-tabs';
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
          backgroundColor: "#1c1023",
        }}}
    >
      <TopTabs.Screen name="account" options={{ title: "Perfil" }} />
      <TopTabs.Screen name="vehicles" options={{ title: "Veículos" }} />
      <TopTabs.Screen name="config" options={{ title: "Configurações" }} />
    </TopTabs>
  );
}
