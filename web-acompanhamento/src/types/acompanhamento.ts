export type Coordenadas = { latitude: number; longitude: number };
export type Acompanhamento = {
  statusViagem: "EM_ANDAMENTO";
  estadoLocalizacao: "AGUARDANDO_PRIMEIRA_LOCALIZACAO" | "DISPONIVEL" | "DESATUALIZADA";
  localizacao: Coordenadas | null;
  ultimaAtualizacaoEm: string | null;
};
