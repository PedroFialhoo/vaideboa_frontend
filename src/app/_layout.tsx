import { Slot } from "expo-router";
import { StatusBar, setStatusBarBackgroundColor } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

const DARK_COLOR = "#1c1023";

function StatusBarBg() {
  const { top } = useSafeAreaInsets();
  return <View style={{ height: top, backgroundColor: DARK_COLOR }} />;
}

export default function RootLayout() {

  useEffect(() => {
    async function configNavBar() {
      await NavigationBar.setPositionAsync("relative");
      await NavigationBar.setBackgroundColorAsync(DARK_COLOR);
      await NavigationBar.setButtonStyleAsync("light");
      if (Platform.OS === "android") {
        await setStatusBarBackgroundColor(DARK_COLOR, true);
      }
    }
    configNavBar();
  }, []);

  return (
    <SafeAreaProvider>  
      <StatusBar style="light" backgroundColor={DARK_COLOR} />
      {Platform.OS !== "web" && <StatusBarBg />}
      <Slot />
    </SafeAreaProvider>
  );
}