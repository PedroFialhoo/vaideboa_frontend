import { useEffect, useRef, useState } from "react";
import type { Coordenadas } from "../types/acompanhamento";

// A consulta pública ocorre a cada cinco segundos. Interpola apenas posições
// recebidas, sem prever deslocamentos quando o motorista deixa de atualizar.
export function usePosicaoSuave(posicao: Coordenadas, antiga: boolean) {
  const [exibida, setExibida] = useState(posicao);
  const atual = useRef(posicao);
  useEffect(() => {
    const destino = { latitude: posicao.latitude, longitude: posicao.longitude };
    const origem = atual.current;
    if (origem.latitude === destino.latitude && origem.longitude === destino.longitude) return;
    const mostrar = (ponto: Coordenadas) => {
      atual.current = ponto;
      setExibida(ponto);
    };
    if (antiga || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      mostrar(destino);
      return;
    }
    const inicio = performance.now();
    let frame: number;
    const animar = (agora: number) => {
      const progresso = Math.min(1, (agora - inicio) / 5000);
      mostrar({
        latitude: origem.latitude + (destino.latitude - origem.latitude) * progresso,
        longitude: origem.longitude + (destino.longitude - origem.longitude) * progresso,
      });
      if (progresso < 1) frame = requestAnimationFrame(animar);
    };
    frame = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(frame);
  }, [posicao.latitude, posicao.longitude, antiga]);
  return exibida;
}
