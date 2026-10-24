# Acompanhamento público · Vai de Boa

Projeto React + TypeScript + Vite independente do Expo. Não usa login, armazenamento do aplicativo ou WebSocket. Todos os links abrem `/v#TOKEN`.

## Executar

Use Node.js 22.12+ ou 24 e npm. Dentro desta pasta:

```sh
npm install
cp .env.example .env
npm run dev
```

Configure `VITE_API_BASE_URL` com a API em execução. Configure `VITE_MAP_TILE_URL` e `VITE_MAP_ATTRIBUTION` com um provedor de tiles compatível com `no-referrer`. Sem essas duas opções, a página informa que o mapa não está configurado. A atribuição aceita HTML confiável definido pelo operador. As variáveis `VITE_*` são públicas e entram no build; não use credenciais secretas. Reinicie o servidor após modificar `.env`.

O serviço padrão `tile.openstreetmap.org` não permite suprimir Referer, portanto não o utilize com a política de privacidade desta página. Consulte as condições do provedor escolhido. Referências: [política OSM](https://operations.osmfoundation.org/policies/tiles/), [Leaflet](https://leafletjs.com/reference.html).

No backend, configure:

```dotenv
COMPARTILHAMENTO_PUBLICO_URL_BASE=http://localhost:5173
COMPARTILHAMENTO_PUBLICO_ORIGENS=http://localhost:5173
```

O botão na tela autenticada de acompanhamento solicita o link ao backend e compartilha exatamente a URL recebida. A permissão é decidida pela API, para motorista e passageiros elegíveis.

## Publicação

```sh
npm run build
npm run preview
```

Publique `dist/` com HTTPS. Configure as variáveis de produção **antes** do build. A URL pública e a origem permitida no backend devem apontar para o domínio real. O provedor deve servir `index.html` em `/v`, inclusive em acesso direto e atualização. `_redirects` e `_headers` estão incluídos para provedores que suportam esses arquivos; outros exigem configuração equivalente. Exemplo Nginx:

```nginx
location / {
    try_files $uri $uri/ /index.html;
    add_header Referrer-Policy no-referrer always;
    add_header Cache-Control no-store always;
    add_header X-Content-Type-Options nosniff always;
}
```

Não adicione analytics que capturem fragmentos, tokens ou coordenadas. A API deve expor `Retry-After` via CORS (`Access-Control-Expose-Headers`) para o navegador conseguir respeitar esse cabeçalho. Sem ele, usa-se recuo de até 60 segundos. Cada consulta tem timeout de 15 segundos e a próxima começa cinco segundos após o término da anterior. A posição anterior é identificada como antiga durante falhas; 404 remove a posição e encerra consultas até trocar o token ou recarregar.

## Validação manual

- Abra `/v` e um token malformado: mensagem de link inválido, sem consulta pública.
- Abra `/v#TOKEN` em janela anônima e atualize a página.
- Confira espera antes da primeira posição, marcador disponível e aviso de posição desatualizada.
- Mova e amplie o mapa; novas posições preservam a câmera. Use o botão para centralizar.
- Troque o fragmento com a página aberta: a posição anterior deve desaparecer.
- Simule falha de rede/503, 429 com `Retry-After` e 404. Só o último encerra o acompanhamento e remove a posição.
- Volte de outra aba: uma consulta é iniciada, sem sobreposição nem antecipação do `Retry-After`.
- Abra dois tokens em janelas distintas e confira as respectivas posições em celular e computador.
- No aplicativo, confira compartilhamento, cancelamento e respostas de sessão expirada/permissão negada.

Referência de [publicação estática do Vite](https://vite.dev/guide/static-deploy.html). A publicação não é executada por este projeto automaticamente.
