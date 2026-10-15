# Publicação e manutenção

## Peças e onde estão

| Peça | Onde | Quem acessa |
|---|---|---|
| Código do site | Este repositório (`main`) | Conta do Gabriel |
| Código da API | `gaahmenezes/controle-documental-backend-2026` (`master`, privado) | Conta do Gabriel |
| Site (`index.html`) | Render — Static Site `controle-documental-site-2026` | Conta Render |
| Backend (API) | Render — Web Service `controle-documental-api` (Ohio), `https://controle-documental-api-vrbc.onrender.com` | Conta Render |
| Banco | Neon (Postgres, Ohio, branch `production`) | Conta Neon |
| Despertador do Render | cron-job.org chamando `/api/status` a cada ~10 min | Conta cron-job.org |

Mantenha uma segunda pessoa da empresa com acesso a GitHub, Render e Neon
(convite como membro), para o sistema não depender de uma única conta.

## Atualizar o site

1. Edite `index.html` (direto aqui, pelo Claude, ou pelo Manus).
2. Faça o commit na branch `main`. Se o Render não publicar sozinho, use **Manual Deploy → Deploy latest commit** no Static Site.
3. Abra o site, force a atualização (Ctrl+F5) e confira.

> Se o Manus também envia commits para este repositório, ele precisa partir da
> versão mais recente da `main`. Caso contrário, pode sobrescrever mudanças
> feitas por outro caminho.

## Atualizar o backend

O código fica no repositório `controle-documental-backend-2026`. No Render, o Web Service
aponta para ele (branch `master`), Build `npm install`, Start `npm start`. Com o
auto-deploy ligado, cada commit publica sozinho; senão, use Manual Deploy.

Variáveis de ambiente (painel do Render, **nunca** no repositório):

| Variável | Valor |
|---|---|
| `DATABASE_URL` | Connection string do Neon |
| `API_KEY` | Mesma chave que está em `CONFIG.apiKey` no `index.html` |
| `CORS_ORIGIN` | `*` (ou o endereço do site, para restringir) |

As tabelas e índices são criados sozinhos quando o servidor sobe (`src/db.js` do repositório da API).

## Verificação rápida

- `https://controle-documental-api-vrbc.onrender.com/api/status` → `{"ok":true,...}`
- No site: abrir uma obra, criar uma ficha de teste em um celular e ver se aparece no computador.

## Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Primeira tela demora ~30 s | Render gratuito "dormiu" | Conferir se o cron-job.org está ativo |
| Site mostra "modo local" | API fora do ar ou chave diferente | Testar `/api/status`; conferir `API_KEY` × `CONFIG.apiKey` |
| Erro 500 na API | Banco inacessível | Ver logs no Render; conferir `DATABASE_URL` e o painel do Neon |
| Foto antiga não abre | Foi enviada antes de 14/10/2026, quando as fotos ficavam no disco do Render | Fotos novas ficam no banco; as perdidas aparecem listadas no log do servidor |
| Pílula "Sem conexão · N para enviar" | Aparelho sem internet ou servidor acordando | Nada a fazer: o site envia sozinho quando a conexão volta (tocar na pílula tenta na hora) |

## Segurança

- Senha do banco e `API_KEY` ficam só no painel do Render.
- A `API_KEY` também aparece no `index.html` (o navegador precisa dela). Ela
  não substitui login: a autenticação real por e-mail @vivaconstrucoes.com.br
  ainda está pendente.
- Se uma senha vazar, troque no Neon/Render e atualize a variável.

## Ativar o login Microsoft 365

Preparado nas branches `login-365` dos dois repositórios (ainda não publicado).

1. **TI** devolve o *client ID* e o *tenant ID* do aplicativo no Entra ID.
2. **Site** (`index.html`, bloco `CONFIG`): preencher `msalClientId` e `msalTenantId`.
   Com o client ID preenchido, a entrada por e-mail some e o login passa a ser só pelo 365.
3. **API** (painel do Render, Environment): `AZURE_TENANT_ID`, `AZURE_CLIENT_ID` e `AUTH_MODO=ambos`.
4. Juntar as branches `login-365` na `main` (site) e na `master` (API). O Render publica sozinho.
5. Testar com a conta de controle e com uma pessoa de campo, no computador e no celular.
6. **Fase final:** `AUTH_MODO=login` no Render e apagar `apiKey` do `CONFIG` do site.
   A partir daí, a API só responde a quem entrou com conta @vivaconstrucoes.com.br.

Voltar atrás: `AUTH_MODO=chave` no Render (e o `apiKey` de volta no site, se já tiver sido apagado).

## Sem internet na obra

Com o servidor configurado, o site guarda no próprio aparelho tudo o que
recebe e tudo o que é gravado. Sem conexão, as alterações (respostas, fotos,
fichas novas) entram numa fila no aparelho e são enviadas sozinhas quando a
internet volta — mesmo que o site tenha sido fechado e aberto de novo.

- A pílula no topo mostra "Sem conexão · N para enviar" e some quando tudo foi enviado.
- Se a mesma ficha foi criada em dois aparelhos sem internet, fica a versão alterada por último.
- Limpar os dados do navegador apaga a fila: com pendências na pílula, não limpe antes de enviar.

## Backup

Cópia diária automática do banco (dados e fotos) na branch `backup` do
repositório da API — veja o README de lá. Precisa do segredo `DATABASE_URL`
configurado no GitHub (Settings → Secrets and variables → Actions).
