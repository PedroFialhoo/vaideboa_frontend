import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {

  useEffect(() => {
    async function configNavBar() {
      await NavigationBar.setPositionAsync("relative");
      await NavigationBar.setBackgroundColorAsync("#120e15");
      await NavigationBar.setButtonStyleAsync("light");
    }

    configNavBar();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar style="light" backgroundColor="#120e15" />
        <Slot />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}