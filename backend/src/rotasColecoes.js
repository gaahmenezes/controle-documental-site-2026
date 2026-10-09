const express = require("express");

// Nomes de coleção aceitos — trava contra alguém mandar um nome de tabela
// arbitrário na URL.
const COLECOES_VALIDAS = new Set([
  "obras", "documentos", "modelos", "preenchimentos", "usuarios",
]);

function validarColecao(req, res, next) {
  if (!COLECOES_VALIDAS.has(req.params.colecao)) {
    return res.status(404).json({ erro: "Coleção desconhecida: " + req.params.colecao });
  }
  next();
}

module.exports = function rotasColecoes(pool) {
  const router = express.Router();
  router.use("/:colecao", validarColecao);

  // Lista os documentos de uma coleção. Aceita filtros opcionais por campo
  // (?obraId=58, ?modeloId=fvs111) para o celular baixar só a obra em uso.
  const FILTROS_VALIDOS = ["obraId", "modeloId"];
  router.get("/:colecao", async (req, res) => {
    try {
      const params = [req.params.colecao];
      let where = "colecao = $1";
      for (const campo of FILTROS_VALIDOS) {
        if (req.query[campo] != null && req.query[campo] !== "") {
          params.push(campo, String(req.query[campo]));
          where += ` AND dados->>$${params.length - 1} = $${params.length}`;
        }
      }
      const r = await pool.query(
        `SELECT id, dados FROM colecoes WHERE ${where} ORDER BY atualizado_em DESC`,
        params
      );
      res.json(r.rows.map(row => ({ ...row.dados, id: row.id })));
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: "Falha ao listar." });
    }
  });

  // Lê um documento específico.
  router.get("/:colecao/:id", async (req, res) => {
    try {
      const r = await pool.query(
        "SELECT id, dados FROM colecoes WHERE colecao = $1 AND id = $2",
        [req.params.colecao, req.params.id]
      );
      if (!r.rows.length) return res.status(404).json({ erro: "Não encontrado." });
      res.json({ ...r.rows[0].dados, id: r.rows[0].id });
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: "Falha ao ler." });
    }
  });

  // Grava (cria ou substitui por completo) um documento — mesmo comportamento
  // do "put" que o site já usava no IndexedDB local.
  // Com o cabeçalho "If-None-Match: *" só CRIA: se o id já existir, não
  // sobrescreve e responde 409 com o documento existente. É o que impede
  // dois aparelhos de criarem a mesma ficha (obra + FVS + casa) ao mesmo tempo.
  router.put("/:colecao/:id", async (req, res) => {
    try {
      const dados = req.body || {};
      if (req.get("If-None-Match") === "*") {
        const ins = await pool.query(
          `INSERT INTO colecoes (colecao, id, dados, atualizado_em)
           VALUES ($1, $2, $3, now())
           ON CONFLICT (colecao, id) DO NOTHING`,
          [req.params.colecao, req.params.id, dados]
        );
        if (ins.rowCount === 0) {
          const r = await pool.query(
            "SELECT id, dados FROM colecoes WHERE colecao = $1 AND id = $2",
            [req.params.colecao, req.params.id]
          );
          const existente = r.rows.length ? { ...r.rows[0].dados, id: r.rows[0].id } : null;
          return res.status(409).json({ erro: "Já existe.", existente });
        }
        return res.json({ ok: true, criado: true });
      }
      await pool.query(
        `INSERT INTO colecoes (colecao, id, dados, atualizado_em)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (colecao, id) DO UPDATE SET dados = $3, atualizado_em = now()`,
        [req.params.colecao, req.params.id, dados]
      );
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: "Falha ao gravar." });
    }
  });

  // Remove um documento.
  router.delete("/:colecao/:id", async (req, res) => {
    try {
      await pool.query(
        "DELETE FROM colecoes WHERE colecao = $1 AND id = $2",
        [req.params.colecao, req.params.id]
      );
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: "Falha ao remover." });
    }
  });

  return router;
};
