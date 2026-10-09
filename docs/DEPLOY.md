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
| Fotos antigas sumiram | Disco do Render gratuito é apagado a cada deploy | Pendente: mover fotos para armazenamento durável |

## Segurança

- Senha do banco e `API_KEY` ficam só no painel do Render.
- A `API_KEY` também aparece no `index.html` (o navegador precisa dela). Ela
  não substitui login: a autenticação real por e-mail @vivaconstrucoes.com.br
  ainda está pendente.
- Se uma senha vazar, troque no Neon/Render e atualize a variável.
