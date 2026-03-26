import { Pressable, Text, View, StyleSheet } from "react-native";
import MapView, {Marker} from "react-native-maps";
import "@/global.css";
import {
  requestForegroundPermissionsAsync,
  LocationObject,
  getCurrentPositionAsync,
  watchPositionAsync,
  LocationAccuracy
} from "expo-location";
import { useEffect, useRef, useState } from "react";

export default function Offer() {
  const [location, setLocation] = useState<LocationObject | null>(null);

  const mapRef = useRef<MapView>(null)
  async function requestLocationPermission() {
    const { granted } = await requestForegroundPermissionsAsync();

    if (granted) {
      const currentPosition = await getCurrentPositionAsync();
      setLocation(currentPosition);
      console.log("LOCALIZAÇÂO ATUAl => ", currentPosition)
    }
  }

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    watchPositionAsync({
        accuracy: LocationAccuracy.Highest,
        timeInterval: 1000,
        distanceInterval: 1
    }, (response) => {
        setLocation(response)
        mapRef.current?.animateCamera({
        center: {
            latitude: response.coords.latitude,
            longitude: response.coords.longitude,
        }
        })
        console.log("LOCALIZAÇÂO ATUAl => ", response)
    })
  }, []);

  return (
    <View style={styles.container}>
        {location &&
        <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
            }}
        >
            <Marker
                coordinate={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                }}
            />
        </ MapView>
        }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "50%"
  },
});