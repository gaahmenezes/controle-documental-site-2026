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
- Modo backend: cópia local (IndexedDB `controle_documental_cache`) + fila de envio; sem conexão grava no aparelho e sincroniza depois (`ErroRede`, `sincronizar`). Fotos são reduzidas por `prepararFoto` antes de gravar.
- Aba Indicadores (`renderIndicadores`, `calcularIndicadores`): gráficos em SVG próprio (`graficoColunas`), cores validadas para daltonismo em `VZ` (azul #1755A0 / laranja #C0461E).
- Fotos de reprovação/reinspeção passam por `anotarFoto` (marcação) e `trocarFotoItem`.
- Ficha: botões de resultado coloridos, item da vez (`marcarItemAtual`) e aviso de salvo (`atualizarSalvo`). Aparência: Claro, Escuro (`tema-escuro`) ou Sol (`alto-contraste`) no body (`iniciarTema`; sem escolha segue o aparelho). Cores escuras de superfícies fixas usam `--chrome`; `.folha` é sempre clara. Espera do servidor: `#app.aguardando` + `#esqueletoTela` (`atualizarCarga`). Sem conexão e sem cópia local, `prepararBase` não cria modelos (evita duplicar no servidor).
- Nome oficial: `abrirRenomear` (Modelos e Repositório, só controle); `formatarNomeOficial` sugere o nome; guarda `tituloOriginal`/`nomeOriginal` e registra na auditoria. O título da FVS aparece no PDF por decisão do controle.
- Trava de edição simultânea: coleção `presencas` no backend (`DB.presencaObter/Gravar/Remover`, só online). `ocuparFicha` ao montar; `pulsoPresenca` a cada 30 s com a tela à vista; vence em 2 min; segunda pessoa vê `fichaAtiva.leitura` (somente consulta, `.trava-aviso`); controle pode `assumirFicha`. A mesma pessoa em dois aparelhos não se trava; sem conexão não trava.
- Salvamento: cada toque só altera a cópia em edição (`salvarFicha` = marca alterado + rascunho em localStorage `cd_rasc_<id>`); grava de verdade `gravarFicha("manual")` (botão Salvar) ou `gravarFicha("auto")` 10 min após a primeira alteração não salva (`AUTO_MS`). A ficha só é criada no servidor no primeiro salvamento (`edicao.existe`). Fechar/trocar obra/sair com alterações pergunta (`perguntar`, `#dlgPergunta`). Rascunho é oferecido ao reabrir se a base for a mesma. Foto trocada só é apagada ao salvar. Histórico (`eventos`) só é escrito ao salvar (`registrarHistoricoAoSalvar`, diferença contra `edicao.resBase`); o painel de histórico mostra a versão salva (`edicao.salvoResp`).
- Etapas do resultado (só na tela): item sem resposta/A/NA mostra A, R, NA; R ainda não travado pode ser desfeito sem virar ciclo; R travado = `travadoEm` (só o botão Salvar trava; o automático não) → só R e AR, aparece a reinspeção, não volta a A/NA. AR exige data + foto da reinspeção. AR→R por engano desfaz pelo AR (`vinhaDeAR`). Fichas antigas (`!p.salvoManual`): R gravados contam como travados.
- Retomar (`resumoRetomada`, `.retomar`, `#parouAqui`) e "Respondido por" (`respondidoHTML`) vêm de `eventos`; só na tela, nunca no PDF.
- Painel: fichas paradas (`fichasParadas`, `renderParadas`) por quadra. Indicadores: por equipe de execução (`porEquipe`, `chaveEquipe` junta grafias) e comparativo entre obras (`renderComparativo`, só controle). Topo dos Indicadores: situação das fichas em rosca (`situacaoHTML`, `roscaSVG`; hachura = concluída após reinspeção) e quadros de reinspeções (aguardando / corrigidas / fichas afetadas) — sem prazos, por decisão do usuário. `resumoObra(o,lista)` e `calcularIndicadores(fvs,semanas,o,lista)` aceitam outra obra.
- Ficha: pendências para gerar o documento (`pendenciasFicha`, `#pendLista`); controle desfaz R travado com motivo (`desfazerReprovacao`, guarda `reprovacoesDesfeitas`, sem evento de troca). Antes e depois (`mostrarAntesDepois`) no histórico e na ficha da casa.
- Ficha da casa (`abrirCasa`, `#dlgCasa`): tocar numa casa do mapa abre todas as FVS dela. Busca rápida (`#buscaRapida`, tecla /). Modo apresentação (`abrirApresentacao`, `#apres`) na aba Indicadores.
- Lixeira (coleção `lixeira`, `moverParaLixeira`, `renderLixeira`): fichas, documentos e modelos excluídos ficam 30 dias; arquivos dos documentos só são apagados ao vencer. Registro de operações com filtros (`filtrarLog`).
- Envios com problema: cada aparelho (`idAparelho`) informa à coleção `aparelhos` pendências, recusas (`cd_recusados`, com cópia local) e rascunhos (`relatarAparelho`); o controle vê em `renderEnvios` no Painel.
- Guia de primeiro uso (`GUIA_PASSOS`, `abrirGuia`, por e-mail em `cd_guia_<email>`) e Novidades (`NOVIDADES`, a mais recente primeiro — acrescente uma entrada a cada atualização visível para a equipe).
- Acessibilidade: janelas com foco preso e devolvido (observador das classes `show`); `--ink3` #5B6B73 (claro) / #98AAB3 (escuro) para contraste ≥ 4,5; campos da ficha com `aria-label`. `.folha` e o relatório mantêm as cores originais.
- Melhorias visuais de computador ficam em `@media (min-width:821px)` / `(hover:hover) and (pointer:fine)`; respeitar `prefers-reduced-motion`.

## Backend
- Fica em outro repositório: `gaahmenezes/controle-documental-backend-2026` (branch `master`).
- Mudanças na API precisam continuar compatíveis com o site publicado, e vice-versa.

## Antes de publicar
- Abrir o site e conferir que não há erro no console.
- Commits pequenos, com mensagem dizendo o que mudou para o usuário.
