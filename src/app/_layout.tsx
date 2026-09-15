import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

const DARK_COLOR = "#1c1023";

function StatusBarBg() {
  const { top } = useSafeAreaInsets();
  return <View style={{ height: top, backgroundColor: DARK_COLOR }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>  
      <StatusBar style="light" />
      {Platform.OS !== "web" && <StatusBarBg />}
      <Slot />
    </SafeAreaProvider>
  );
}
