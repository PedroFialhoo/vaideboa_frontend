import { useEffect, useRef, useState } from "react";
import type { Coordenadas } from "../types/acompanhamento";
import { GoogleMarker, GoogleMap, loadGoogleMaps, onGoogleMapsAuthFailure } from "../services/google-maps";
import carroUrl from "../../../assets/images/iconCarro.png";
import { usePosicaoSuave } from "../hooks/usePosicaoSuave";
import { MapaLeaflet } from "./MapaLeaflet";

type Props = { posicao: Coordenadas; antiga: boolean };
const key = import.meta.env.GOOGLE_MAPS_API_KEY?.trim();

export function MapaAcompanhamento(props: Props) {
  const posicao = usePosicaoSuave(props.posicao, props.antiga);
  return key ? <MapaGoogle posicao={posicao} antiga={props.antiga} /> : <MapaLeaflet posicao={posicao} antiga={props.antiga} />;
}

function MapaGoogle({ posicao, antiga }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<GoogleMap | null>(null);
  const marker = useRef<GoogleMarker | null>(null);
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
      marker.current = new maps.Marker({ map: map.current, position: center,
        icon: { url: carroUrl, scaledSize: new maps.Size(48, 48), anchor: new maps.Point(24, 24) },
        title: "Motorista", opacity: old ? 0.55 : 1, clickable: false });
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
    marker.current?.setPosition({ lat: posicao.latitude, lng: posicao.longitude });
    marker.current?.setOpacity(antiga ? 0.55 : 1);
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
