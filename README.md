# Controle Documental — Viva Construções

Site do setor de Qualidade para preenchimento digital das FVS (Fichas de
Verificação de Serviço) das obras **58 – Viva Mais Barra** (362 casas) e
**60 – Viva Club da Ilha** (240 casas).

## Estrutura

| Caminho | O que é |
|---|---|
| `index.html` | O site inteiro (HTML + CSS + JS em um arquivo só). **Fica na raiz** porque é o arquivo publicado. |
| API (backend) | Repositório separado e privado: [`gaahmenezes/controle-documental-backend-2026`](https://github.com/gaahmenezes/controle-documental-backend-2026). |
| `docs/DEPLOY.md` | Como publicar o site e o backend, e o que fazer quando algo quebra. |
| `CLAUDE.md` | Regras do projeto para quem edita o código (pessoas ou IA). |

## Arquitetura em uma linha

Navegador (`index.html`, Static Site no Render) → API no Render (repositório do backend)
→ banco Postgres no Neon. Sem backend configurado, o site funciona só com a base
local do navegador (IndexedDB).

## Responsável

Gabriel Carvalho — Qualidade (gabriel.carvalho@vivaconstrucoes.com.br).
