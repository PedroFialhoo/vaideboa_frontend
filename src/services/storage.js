import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export async function setToken(token) {
  if (Platform.OS === 'web') {
    localStorage.setItem('token', token);
  } else {
    await SecureStore.setItemAsync('token', token);
  }
  console.log("Token guardado");
}

export async function getToken() {
  if (Platform.OS === 'web') {
    const token = localStorage.getItem('token');
    console.log("Pegando token");
    return token;
  } else {
    const token = await SecureStore.getItemAsync('token');
    console.log("Pegando token");
    return token;
  }
}

export async function resetToken() {
  if (Platform.OS === 'web') {
    localStorage.removeItem('token');
  } else {
    await SecureStore.deleteItemAsync('token');
  }
  console.log("Token resetado");
}