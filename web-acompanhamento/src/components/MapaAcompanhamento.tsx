import { useEffect, useRef, useState } from "react";
import type { Coordenadas } from "../types/acompanhamento";
import { GoogleCircle, GoogleMap, loadGoogleMaps, onGoogleMapsAuthFailure } from "../services/google-maps";
import { MapaLeaflet } from "./MapaLeaflet";

type Props = { posicao: Coordenadas; antiga: boolean };
const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();

export function MapaAcompanhamento(props: Props) {
  return key ? <MapaGoogle {...props} /> : <MapaLeaflet {...props} />;
}

function MapaGoogle({ posicao, antiga }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<GoogleMap | null>(null);
  const marker = useRef<GoogleCircle | null>(null);
  const latest = useRef({ posicao, antiga });
  latest.current = { posicao, antiga };
  const [status, setStatus] = useState("Carregando Google Maps...");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const authFailure = () => {
      if (cancelled) return;
      setFailed(true);
      setStatus("Google Maps não autorizado. Confira Maps JavaScript API, faturamento e restrições da chave no Google Cloud.");
    };
    const unsubscribe = onGoogleMapsAuthFailure(authFailure);
    void loadGoogleMaps(key!).then(maps => {
      if (cancelled || !container.current) return;
      const { posicao: point, antiga: old } = latest.current;
      const center = { lat: point.latitude, lng: point.longitude };
      map.current = new maps.Map(container.current, { center, zoom: 16, streetViewControl: false, mapTypeControl: false, fullscreenControl: true });
      marker.current = new maps.Circle({ map: map.current, center, radius: 12,
        strokeColor: "#f7e5ff", strokeWeight: 4, fillColor: old ? "#78718e" : "#660099", fillOpacity: 1, clickable: false });
      setStatus("");
    }).catch(error => {
      if (!cancelled) { setFailed(true); setStatus(error instanceof Error ? error.message : "Não foi possível carregar o mapa."); }
    });
    return () => {
      cancelled = true;
      unsubscribe();
      marker.current?.setMap(null);
      if (map.current) window.google?.maps.event.clearInstanceListeners(map.current);
      marker.current = null;
      map.current = null;
    };
  }, []);
  useEffect(() => {
    marker.current?.setCenter({ lat: posicao.latitude, lng: posicao.longitude });
    marker.current?.setOptions({ fillColor: antiga ? "#78718e" : "#660099" });
  }, [posicao, antiga]);
  return <section className="map-section" aria-label="Localização do motorista">
    <div className="map" ref={container} />
    {!status && <button className="center-button" onClick={() => {
      map.current?.setCenter({ lat: posicao.latitude, lng: posicao.longitude });
      map.current?.setZoom(16);
    }}>◎ Centralizar no motorista</button>}
    {status && <p className="map-warning" role={failed ? "alert" : "status"}>{status}</p>}
  </section>;
}
