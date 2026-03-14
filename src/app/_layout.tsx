import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";

export default function RootLayout() {

  useEffect(() => {
    async function configNavBar() {
      await NavigationBar.setPositionAsync("relative");
      await NavigationBar.setBackgroundColorAsync("#440066");
      await NavigationBar.setButtonStyleAsync("light");
    }

    configNavBar();
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor="#440066" />
      <Slot />
    </>
  );
}