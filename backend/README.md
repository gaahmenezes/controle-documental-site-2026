# Backend — Controle Documental (Viva Construções)

API REST simples em Node.js + Express + PostgreSQL. Não usa SDK de nenhum
provedor específico — só `pg` (driver padrão do Postgres) e `express`. Isso
significa que ele roda em qualquer lugar que ofereça:

1. Um processo Node.js de longa duração (não é "serverless" de execução curta).
2. Um banco Postgres alcançável por `DATABASE_URL`.
3. Algum disco persistente para os arquivos enviados (pasta `uploads/`) — ou,
   mais adiante, trocar essa parte por um serviço de armazenamento de objetos
   (S3, R2, B2), se o volume de arquivos crescer muito.

## Rodando localmente (para testar antes de publicar)

```bash
cp .env.example .env
# edite o .env com um Postgres de teste (pode ser um Postgres local, ou já um
# banco gratuito na nuvem — veja as opções abaixo)
npm install
npm start
```

O servidor sobe em `http://localhost:3000`. Teste com:
```bash
curl http://localhost:3000/api/status
```

## Onde hospedar de graça

Nenhum provedor de "sempre grátis" é permanente por garantia contratual — todos
podem mudar o plano no futuro. Mas hoje, para o volume de uma obra (algumas
centenas de fichas, algumas dezenas de documentos, milhares de fotos ao longo
do tempo), qualquer uma destas combinações cobre a necessidade sem custo:

| Peça | Opções com plano gratuito |
|---|---|
| Banco Postgres | Neon.tech, Supabase (só o Postgres, sem usar o SDK deles), Render Postgres |
| Servidor Node (este backend) | Render (Web Service gratuito), Railway (créditos gratuitos), Fly.io |
| Domínio | O próprio subdomínio gratuito que o provedor já dá (ex.: `algo.onrender.com`) |

**Sugestão mais simples para começar:** Postgres no Neon.tech (gratuito,
sempre ligado) + este backend no Render (Web Service gratuito). Nenhum dos
dois pede cartão de crédito no plano free atual.

### Passo a passo (exemplo com Render + Neon)

1. Crie uma conta gratuita em neon.tech, crie um projeto, copie a
   "Connection string" (é o seu `DATABASE_URL`).
2. Suba a pasta deste backend para um repositório no GitHub (ou peça para eu
   deixar pronto como um `.zip` para você importar).
3. Em render.com, crie um "Web Service" novo apontando para esse repositório.
   - Build command: `npm install`
   - Start command: `npm start`
4. Em "Environment", adicione as variáveis do `.env.example`:
   `DATABASE_URL` (a do Neon), `API_KEY` (invente uma chave longa),
   `CORS_ORIGIN` (deixe `*` por enquanto).
5. Espere o deploy terminar. Render te dá uma URL do tipo
   `https://controle-documental-api.onrender.com`.
6. Teste: `https://SEU-ENDERECO.onrender.com/api/status` deve responder
   `{"ok":true,...}`.
7. Me avise com essa URL e a `API_KEY` que você escolheu — eu configuro o
   site para usar esse endereço (arquivo `controle-documental.html`,
   `CONFIG.apiBaseUrl` e `CONFIG.apiKey`, bem no topo do `<script>`).

⚠️ **Sobre o plano gratuito do Render especificamente:** o Web Service
gratuito "dorme" depois de alguns minutos sem uso e demora ~30s para acordar
na primeira requisição seguinte. Para uma ferramenta interna de obra isso
costuma ser aceitável (a pessoa espera uns segundos na primeira tela); se
incomodar, dá para trocar para um plano pago baixo ($7/mês) só para manter
sempre acordado, ou migrar para Railway/Fly.io.

## Endpoints

Todas as rotas abaixo (exceto `/api/status` e `/uploads/...`) exigem o
cabeçalho `X-Api-Key: <sua API_KEY>`.

- `GET/PUT/DELETE /api/colecoes/:colecao/:id` — um documento
  (`colecao` ∈ obras, documentos, modelos, preenchimentos, usuarios)
- `GET /api/colecoes/:colecao` — lista todos os documentos da coleção
- `GET/POST /api/auditoria` — registro de operações (log único, com limite de 500 eventos)
- `POST /api/arquivos-bin/:colecao` (multipart, campos `id`, `nome`, `arquivo`) —
  envia um arquivo binário (`colecao` ∈ arquivos, midias)
- `GET/DELETE /api/arquivos-bin/:colecao/:id` — metadados / remoção de um arquivo
- `GET /uploads/...` — download direto do arquivo (público, sem chave)

## Segurança — seja realista sobre os limites

A `API_KEY` fica visível no código-fonte da página (é um site estático, não
tem como esconder um segredo nele). Ela impede acesso casual de fora, mas não
é uma barreira contra alguém que abra o "Ver código-fonte" do site. Quem
controla **quem pode fazer o quê dentro do site** continua sendo a lógica do
próprio `controle-documental.html` (login institucional + a lista de contas
de controle) — o backend só garante que ninguém fora do endereço + chave
consiga ler ou escrever na base pela API diretamente.

## Atualização — trava de duplicidade e filtro por obra

Esta versão é compatível com a anterior (o banco não precisa de migração manual; o índice novo é criado sozinho na subida).

- `GET /api/colecoes/:colecao?obraId=58&modeloId=fvs111` — filtros opcionais; o celular baixa só a obra em uso.
- `PUT /api/colecoes/:colecao/:id` com o cabeçalho `If-None-Match: *` — **só cria**: se o id já existir, não sobrescreve e responde `409` com `{ existente }`. O site usa isso para impedir duas fichas da mesma obra + FVS + casa.

Para publicar: substitua a pasta `src/` no serviço do Render (ou peça ao Manus para trocar os arquivos `src/rotasColecoes.js` e `src/db.js`, sem alterar o resto) e faça o redeploy.
