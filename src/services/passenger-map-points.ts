export type PassengerMapData = {
  idPedidoCarona: number;
  nome: string;
  statusPedido: string;
  statusReserva?: string | null;
  latSaida: number;
  lonSaida: number;
  latDestino: number;
  lonDestino: number;
};

export function isValidMapCoordinate(latitude: unknown, longitude: unknown): boolean {
  return typeof latitude === "number" && Number.isFinite(latitude) && Math.abs(latitude) <= 90
    && typeof longitude === "number" && Number.isFinite(longitude) && Math.abs(longitude) <= 180;
}

export function passengerMapPoints(passengers: PassengerMapData[], screen: "details" | "tracking") {
  return passengers.filter((passenger) => screen === "details"
    ? ["PENDENTE", "ACEITO"].includes(passenger.statusPedido)
      && !["CANCELADA", "NAO_COMPARECEU"].includes(passenger.statusReserva ?? "")
    : passenger.statusPedido === "ACEITO"
      && ["ACEITA", "EMBARQUE_LIBERADO", "EMBARCADO"].includes(passenger.statusReserva ?? ""))
    .flatMap((passenger) => [
      { key: `${passenger.idPedidoCarona}-embarque`, nome: passenger.nome, kind: "embarque" as const,
        coordinate: { latitude: passenger.latSaida, longitude: passenger.lonSaida } },
      { key: `${passenger.idPedidoCarona}-destino`, nome: passenger.nome, kind: "destino" as const,
        coordinate: { latitude: passenger.latDestino, longitude: passenger.lonDestino } },
    ].filter(({ coordinate }) => isValidMapCoordinate(coordinate.latitude, coordinate.longitude)));
}

export type PassengerMapPoint = ReturnType<typeof passengerMapPoints>[number];
