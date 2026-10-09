const express = require("express");

const LIMITE_EVENTOS = 500;

module.exports = function rotasAuditoria(pool) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const r = await pool.query(
        "SELECT dados FROM colecoes WHERE colecao = 'auditoria' AND id = 'log'"
      );
      res.json(r.rows.length ? (r.rows[0].dados.eventos || []) : []);
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: "Falha ao ler o registro de operações." });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const evento = req.body;
      const r = await pool.query(
        "SELECT dados FROM colecoes WHERE colecao = 'auditoria' AND id = 'log'"
      );
      const eventos = r.rows.length ? (r.rows[0].dados.eventos || []) : [];
      eventos.push(evento);
      while (eventos.length > LIMITE_EVENTOS) eventos.shift();
      await pool.query(
        `INSERT INTO colecoes (colecao, id, dados, atualizado_em)
         VALUES ('auditoria', 'log', $1, now())
         ON CONFLICT (colecao, id) DO UPDATE SET dados = $1, atualizado_em = now()`,
        [{ eventos }]
      );
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: "Falha ao gravar o evento." });
    }
  });

  return router;
};
