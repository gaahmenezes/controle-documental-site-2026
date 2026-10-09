const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const COLECOES_BLOB = new Set(["arquivos", "midias"]);

module.exports = function rotasArquivos(pool, pastaUploads) {
  const router = express.Router();

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const sub = path.join(pastaUploads, req.params.colecao);
      fs.mkdirSync(sub, { recursive: true });
      cb(null, sub);
    },
    filename: (req, file, cb) => {
      const idSeguro = req.body.id || crypto.randomUUID();
      const ext = path.extname(file.originalname) || "";
      cb(null, idSeguro + ext);
    },
  });
  const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } }); // 25 MB

  function validarColecao(req, res, next) {
    if (!COLECOES_BLOB.has(req.params.colecao)) {
      return res.status(404).json({ erro: "Coleção de arquivo desconhecida: " + req.params.colecao });
    }
    next();
  }
  router.use("/:colecao", validarColecao);

  // Lista os metadados de todos os arquivos de uma coleção (sem os bytes).
  router.get("/:colecao", async (req, res) => {
    try {
      const r = await pool.query(
        "SELECT id, nome, tipo, tamanho, caminho FROM arquivos_binarios WHERE colecao=$1 ORDER BY criado_em DESC",
        [req.params.colecao]
      );
      res.json(r.rows.map(row => ({
        id: row.id, nome: row.nome, tipo: row.tipo, tamanho: Number(row.tamanho),
        url: "/uploads/" + row.caminho.replace(/\\/g, "/"),
      })));
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: "Falha ao listar arquivos." });
    }
  });

  // Envia (ou substitui) o arquivo de um id.
  router.post("/:colecao", upload.single("arquivo"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ erro: "Nenhum arquivo enviado." });
      const id = req.body.id;
      if (!id) return res.status(400).json({ erro: "Campo 'id' é obrigatório." });

      const caminhoRelativo = path.join(req.params.colecao, req.file.filename);
      await pool.query(
        `INSERT INTO arquivos_binarios (id, colecao, nome, tipo, tamanho, caminho, criado_em)
         VALUES ($1,$2,$3,$4,$5,$6, now())
         ON CONFLICT (id) DO UPDATE SET nome=$3, tipo=$4, tamanho=$5, caminho=$6, criado_em=now()`,
        [id, req.params.colecao, req.body.nome || req.file.originalname, req.file.mimetype, req.file.size, caminhoRelativo]
      );
      res.json({
        ok: true,
        id,
        url: "/uploads/" + caminhoRelativo.replace(/\\/g, "/"),
        nome: req.body.nome || req.file.originalname,
        tipo: req.file.mimetype,
        tamanho: req.file.size,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: "Falha ao enviar o arquivo." });
    }
  });

  // Metadados de um arquivo (sem baixar o conteúdo).
  router.get("/:colecao/:id", async (req, res) => {
    try {
      const r = await pool.query(
        "SELECT * FROM arquivos_binarios WHERE colecao=$1 AND id=$2",
        [req.params.colecao, req.params.id]
      );
      if (!r.rows.length) return res.status(404).json({ erro: "Não encontrado." });
      const row = r.rows[0];
      res.json({
        id: row.id, nome: row.nome, tipo: row.tipo, tamanho: Number(row.tamanho),
        url: "/uploads/" + row.caminho.replace(/\\/g, "/"),
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: "Falha ao consultar." });
    }
  });

  // Remove o arquivo (registro + bytes em disco).
  router.delete("/:colecao/:id", async (req, res) => {
    try {
      const r = await pool.query(
        "SELECT caminho FROM arquivos_binarios WHERE colecao=$1 AND id=$2",
        [req.params.colecao, req.params.id]
      );
      if (r.rows.length) {
        const caminhoAbsoluto = path.join(pastaUploads, r.rows[0].caminho);
        fs.promises.unlink(caminhoAbsoluto).catch(() => {});
      }
      await pool.query("DELETE FROM arquivos_binarios WHERE colecao=$1 AND id=$2", [req.params.colecao, req.params.id]);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: "Falha ao remover." });
    }
  });

  return router;
};
