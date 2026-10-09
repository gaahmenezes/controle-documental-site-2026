# Regras do projeto — Controle Documental

## Regras que não podem ser quebradas
- **O PDF/documento gerado de cada FVS não pode ter mudança de texto, ordem ou conteúdo.** Só mude a aparência do site, nunca o documento.
- Cada colaborador pertence a uma obra. O fluxo começa pela escolha da obra.
- Nada de segredo no repositório: `DATABASE_URL`, senhas e `.env` ficam fora (já no `.gitignore`).
- `index.html` fica na raiz (é o arquivo publicado). Não mover.

## Código
- Site: um arquivo só (`index.html`), HTML/CSS/JS puro, sem build. Textos em português.
- Módulo `DB` com 3 modos: `remoto` (backend próprio), `claude` (inativo), `local` (IndexedDB).
- ID de ficha determinístico: `idFicha(obraId, modeloId, unidade)`; criação com `DB.criar` (PUT `If-None-Match: *`, 409 se já existir).
- Histórico por item: `ciclos` (reprovações arquivadas) e `eventos` (trocas de resultado).
- Listagens filtram por obra (`?obraId=`). Não recarregar listas inteiras depois de salvar.
- Melhorias visuais de computador ficam em `@media (min-width:821px)` / `(hover:hover) and (pointer:fine)`; respeitar `prefers-reduced-motion`.

## Backend
- Fica em outro repositório: `gaahmenezes/controle-documental-backend-2026` (branch `master`).
- Mudanças na API precisam continuar compatíveis com o site publicado, e vice-versa.

## Antes de publicar
- Abrir o site e conferir que não há erro no console.
- Commits pequenos, com mensagem dizendo o que mudou para o usuário.
