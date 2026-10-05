# Chat por reserva

O botão **Abrir chat** fica no rodapé dos pedidos aceitos nos detalhes da carona (motorista). Para o passageiro, fica no card de Minhas Viagens e em Sua reserva nos detalhes. O identificador é sempre `idReserva`, nunca o ID do pedido ou da carona. Reservas sem ID não exibem o botão. O backend determina se o chat existe e se o envio é permitido; o histórico permanece acessível após cancelamento e expiração do prazo.

## Conexão e envio

A URL HTTP vem de `src/services/api.js`, atualmente `http://192.168.1.21:8080`. O WebSocket deriva dela (`ws://192.168.1.21:8080/ws`; HTTPS resulta em WSS). O dispositivo precisa alcançar essa máquina. Não se usa SockJS nem `/chat/iniciar`.

O cliente STOMP já instalado envia o token do armazenamento existente no header `Authorization` de CONNECT. Cada nova conexão lê o token novamente. Assina `/topic/chat/{idReserva}` e recupera o histórico depois de emitir SUBSCRIBE. Ao sair da tela, remove sua assinatura; a conexão compartilhada entre consumidores de chat só é encerrada quando não há consumidores. O teste de localização existente tem seu próprio ciclo de conexão e não é alterado.

O envio usa somente `POST /chat/enviarMensagem`, com `{ idReserva, mensagem }` e Bearer JWT. Texto vazio ou com apenas espaços, mais de 1.000 caracteres e reserva inválida são rejeitados. Um bloqueio síncrono impede cliques duplicados. O POST não é repetido automaticamente. Em falha, o rascunho permanece; consulte o histórico antes de repetir, pois a gravação pode ter ocorrido. Erros textuais e objetos com `mensagem` são apresentados.

## Histórico e recuperação

`GET /chat/{idReserva}/mensagens?page=0&size=30` abre a conversa. **Carregar mensagens antigas** busca a próxima página, mantendo tamanho 30, até `ultimaPagina`. Consultas da conversa são serializadas. Mensagens são unidas pelo ID e ordenadas por `enviadoEm`, depois ID. A lista invertida mostra as recentes no final visual e preserva a posição com `maintainVisibleContentPosition`. Novas mensagens aproximam a rolagem do final somente quando o usuário está perto dele.

Eventos recebidos durante a sincronização são armazenados e depois unidos ao histórico. Reconexão refaz a assinatura e busca páginas recentes até encontrar IDs conhecidos ou a última página. Se a recuperação falhar parcialmente, mantém os IDs anteriores como referência para a próxima tentativa. Há consulta HTTP a cada 10 segundos em primeiro plano e ao voltar ao app, para recuperar eventos perdidos. `enviadoEm` é exibido a partir dos campos do LocalDateTime, sem acrescentar Z ou converter para UTC. Mensagens são renderizadas em `Text`.

## Limitações do contrato atual

- `enableSimpleBroker` não confirma SUBSCRIBE com RECEIPT. Não é possível garantir confirmação da assinatura antes do histórico somente no frontend. A assinatura é emitida antes da consulta; a sincronização periódica recupera a janela de corrida. Referência: https://docs.spring.io/spring-framework/docs/5.3.32/reference/html/web.html (External Broker).
- O JWT não contém ID de usuário e `/user/me` também não o retorna. O frontend consulta `/carona/minhas` autenticado para determinar o papel: para motorista, usa `idMotorista`; para passageiro, verifica `idReserva` e identifica seu ID nas mensagens cujo autor difere do motorista, já que a reserva tem dois participantes. A resposta do próprio POST também confirma `idAutor`. As bolhas comparam esse ID com `idAutor`. Para obter o ID diretamente da autenticação, o contrato teria de expô-lo. O backend não foi alterado.
- O broker não guarda eventos desconectados. A recuperação usa o banco por HTTP. A paginação por número pode repetir mensagens e a união elimina esses IDs.

## Verificação

Executados `npx tsc --noEmit`, `git diff --check` e verificações locais com HTTP simulado: validação, JWT, endpoints, paginação, erros textuais/DTO, união/ordenação, formato de data e ausência de repetição de POST. Nenhuma dependência ou ferramenta de testes foi adicionada.

Ainda falta validação real entre app, WebSocket e banco. Roteiro manual:

1. Usar contas de motorista e passageiro; aceitar um pedido e verificar os botões para a reserva correta.
2. Abrir o chat nos dois dispositivos; enviar de ambos e conferir identificação, horário e ausência de duplicatas.
3. Criar mais de 30 mensagens, carregar antigas e conferir que a leitura não muda de posição. Receber novas enquanto lê mensagens antigas.
4. Desconectar um dispositivo, enviar mais de 30 mensagens no outro, reconectar e conferir recuperação completa. Interromper também uma consulta intermediária da recuperação.
5. Simular falha de POST: conferir preservação do texto, um único envio e histórico antes de tentar novamente.
6. Conferir histórico e erros de envio após cancelamento, prazo de dois dias, reserva pendente, usuário inativo e acesso por terceiro. NAO_COMPARECEU não é bloqueado pela interface.
7. Verificar rolagem e teclado no Android, iOS e web; sair e voltar à conversa e trocar de conta.
