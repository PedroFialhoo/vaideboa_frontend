import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const sessionListeners = new Set();
export function subscribeToSession(listener) {
  sessionListeners.add(listener);
  return () => { sessionListeners.delete(listener); };
}
function sessionChanged() {
  sessionListeners.forEach(listener => listener());
}

export async function setToken(token) {
  if (Platform.OS === 'web') {
    localStorage.setItem('token', token);
  } else {
    await SecureStore.setItemAsync('token', token);
  }
  sessionChanged();
  console.log("Token guardado");
}

export async function getToken() {
  if (Platform.OS === 'web') {
    const token = localStorage.getItem('token');
    // console.log("Pegando token: ", token);
    return token;
  } else {
    const token = await SecureStore.getItemAsync('token');
    // console.log("Pegando token: ", token);
    return token;
  }
}

export async function resetToken() {
  if (Platform.OS === 'web') {
    localStorage.removeItem('token');
  } else {
    await SecureStore.deleteItemAsync('token');
  }
  sessionChanged();
  console.log("Token resetado");
}
// Another browser tab may also end or replace the session.
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key === 'token' || event.key === null) sessionChanged();
  });
}
