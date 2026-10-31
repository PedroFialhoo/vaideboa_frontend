// Superfície da API utilizada pela página, sem dependências adicionais.
export type LatLng = { lat: number; lng: number };
export type GoogleMap = { setCenter(center: LatLng): void; setZoom(zoom: number): void };
export type GoogleMarker = {
  setPosition(position: LatLng): void;
  setOpacity(opacity: number): void;
  setMap(map: GoogleMap | null): void;
};
type Maps = {
  Map: new (element: HTMLElement, options: { center: LatLng; zoom: number; streetViewControl: boolean; mapTypeControl: boolean; fullscreenControl: boolean }) => GoogleMap;
  Marker: new (options: { map: GoogleMap; position: LatLng; icon: { url: string; scaledSize: object; anchor: object }; title: string; opacity: number; clickable: boolean }) => GoogleMarker;
  Size: new (width: number, height: number) => object;
  Point: new (x: number, y: number) => object;
  event: { clearInstanceListeners(instance: object): void };
};
declare global {
  interface Window {
    google?: { maps: Maps };
    vdbGoogleMapsReady?: () => void;
    gm_authFailure?: () => void;
  }
}
let loading: Promise<Maps> | undefined;
const authListeners = new Set<() => void>();
export function onGoogleMapsAuthFailure(listener: () => void) {
  authListeners.add(listener);
  return () => { authListeners.delete(listener); };
}
export function loadGoogleMaps(key: string): Promise<Maps> {
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    let settled = false;
    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      script.remove();
      delete window.vdbGoogleMapsReady;
      reject(new Error(message));
    };
    const timeout = window.setTimeout(() => fail("Tempo esgotado ao carregar o Google Maps. Recarregue a página."), 20000);
    const previousAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      previousAuthFailure?.();
      authListeners.forEach(listener => listener());
      fail("Google Maps não autorizado. Confira a chave, a API habilitada, o faturamento e os sites permitidos.");
    };
    window.vdbGoogleMapsReady = () => {
      if (settled) return;
      if (!window.google?.maps) { fail("Google Maps indisponível."); return; }
      settled = true;
      clearTimeout(timeout);
      delete window.vdbGoogleMapsReady;
      resolve(window.google.maps);
    };
    const params = new URLSearchParams({ key, loading: "async", callback: "vdbGoogleMapsReady", v: "quarterly", language: "pt-BR", region: "BR", auth_referrer_policy: "origin" });
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    script.async = true;
    // Autoriza a chave por origem sem enviar caminho, token público ou coordenadas no Referer.
    script.referrerPolicy = "strict-origin";
    script.onerror = () => fail("Não foi possível carregar o Google Maps. Verifique a conexão e recarregue a página.");
    document.head.appendChild(script);
  });
  return loading;
}
