import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import carroUrl from "../../../assets/images/iconCarro.png";

const carroIcon = L.icon({ iconUrl: carroUrl, iconSize: [48, 48], iconAnchor: [24, 24], tooltipAnchor: [0, -24] });
import "leaflet/dist/leaflet.css";
import type { Coordenadas } from "../types/acompanhamento";

export function MapaLeaflet({ posicao, antiga }: { posicao: Coordenadas; antiga: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const [falhaTiles, setFalhaTiles] = useState(false);
  const tileUrl = import.meta.env.VITE_MAP_TILE_URL;
  const attribution = import.meta.env.VITE_MAP_ATTRIBUTION;
  useEffect(() => {
    if (!container.current || !tileUrl || !attribution) return;
    const instance = L.map(container.current);
    map.current = instance;
    L.tileLayer(tileUrl, { attribution, maxZoom: 19, referrerPolicy: "no-referrer" })
      .on("tileerror", () => setFalhaTiles(true)).addTo(instance);
    const resize = new ResizeObserver(() => instance.invalidateSize());
    resize.observe(container.current);
    return () => { resize.disconnect(); instance.remove(); map.current = null; marker.current = null; };
  }, [tileUrl, attribution]);
  useEffect(() => {
    if (!map.current) return;
    const coords: L.LatLngExpression = [posicao.latitude, posicao.longitude];
    if (!marker.current) {
      marker.current = L.marker(coords, { icon: carroIcon, title: "Motorista", keyboard: false }).addTo(map.current).bindTooltip("Motorista");
      map.current.setView(coords, 16);
    }
    marker.current.setLatLng(coords).setOpacity(antiga ? 0.55 : 1);
  }, [posicao, antiga]);
  return <section className="map-section" aria-label="Localização do motorista">
    {tileUrl && attribution ? <>
      <div className="map" ref={container} />
      <button className="center-button" onClick={() => map.current?.setView([posicao.latitude, posicao.longitude], 16)}>◎ Centralizar no motorista</button>
      {falhaTiles && <p className="map-warning" role="status">Não foi possível carregar parte do mapa.</p>}
    </> : <div className="placeholder"><strong>Mapa não configurado</strong><p>O serviço de mapas precisa ser configurado pelo responsável pela página.</p></div>}
  </section>;
}
