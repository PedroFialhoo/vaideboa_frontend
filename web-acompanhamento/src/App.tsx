import { useAcompanhamento } from "./hooks/useAcompanhamento";
import { MapaAcompanhamento } from "./components/MapaAcompanhamento";

export default function App() {
  const { valido, dados, situacao } = useAcompanhamento();
  const antiga = situacao === "erro" || dados?.estadoLocalizacao === "DESATUALIZADA";
  let titulo = "Conectando à carona…";
  let descricao = "Buscando a localização do motorista.";
  if (!valido) { titulo = "Link de acompanhamento inválido"; descricao = "Abra o link completo enviado por quem está na carona."; }
  else if (situacao === "encerrado") { titulo = "Acompanhamento encerrado ou indisponível"; descricao = "Este link não está mais disponível. Solicite um novo link a quem compartilhou a carona."; }
  else if (situacao === "erro") { titulo = "Conexão temporariamente indisponível"; descricao = dados?.localizacao ? "A posição exibida é antiga. Tentaremos atualizar automaticamente." : "Tentaremos novamente em instantes. Mantenha esta página aberta."; }
  else if (dados?.estadoLocalizacao === "AGUARDANDO_PRIMEIRA_LOCALIZACAO") { titulo = "Aguardando o motorista"; descricao = "A posição aparecerá assim que o motorista enviar a primeira localização."; }
  else if (dados) { titulo = antiga ? "Localização desatualizada" : "Motorista em deslocamento"; descricao = antiga ? "Esta é a última posição recebida. Aguardando uma nova atualização." : "Acompanhe a última posição do motorista. A atualização é automática."; }
  return <div className="page">
    <header><a href="/v" aria-label="Vai de Boa"><img src="/logo-vdb.svg" alt="" /><span>vai de boa<span className="brand-dot">.</span></span></a><span className="header-label">ACOMPANHAMENTO DE CARONA</span></header>
    <main>
      <div className="intro"><span className="eyebrow">JUNTOS, MESMO DE LONGE</span><h1>De olho no caminho.<br /><span>Vai de boa.</span></h1><p>Acompanhe a carona de quem compartilhou este link com você.</p></div>
      <article className="tracking-card">
        <div className="status" role="status" aria-live="polite"><span className={`status-dot ${antiga ? "old" : ""}`} /><div><h2>{titulo}</h2><p>{descricao}</p>{dados?.ultimaAtualizacaoEm && <p className="timestamp">Última posição: <time dateTime={dados.ultimaAtualizacaoEm}>{new Date(dados.ultimaAtualizacaoEm).toLocaleString("pt-BR")}</time>{antiga && " · Posição antiga"}</p>}</div></div>
        {valido && dados?.localizacao ? <MapaAcompanhamento posicao={dados.localizacao} antiga={antiga} /> : <div className="placeholder"><span className="location-symbol" aria-hidden="true">◎</span><p>{valido && situacao === "carregando" ? "Carregando acompanhamento…" : "Nenhuma localização disponível"}</p></div>}
        <div className="card-footer">Apenas a última posição do motorista é compartilhada.</div>
      </article>
      <p className="privacy">Você não precisa entrar em uma conta nem compartilhar sua localização.<br />Este link dá acesso à posição da carona. Compartilhe com cuidado.</p>
    </main><footer>Vai de Boa · Mais tranquilidade em cada caminho.</footer>
  </div>;
}
