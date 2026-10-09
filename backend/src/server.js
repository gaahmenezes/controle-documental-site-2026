require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const { pool, migrar } = require("./db");
const { exigirChave } = require("./auth");
const rotasColecoes = require("./rotasColecoes");
const rotasAuditoria = require("./rotasAuditoria");
const rotasArquivos = require("./rotasArquivos");

const PORTA = process.env.PORT || 3000;
const PASTA_UPLOADS = path.join(__dirname, "..", "uploads");

const app = express();

// CORS: por padrão libera qualquer origem (site estático pode estar em outro domínio/host).
// Para travar a um domínio específico, defina CORS_ORIGIN=https://seusite.com no ambiente.
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "2mb" }));

// Arquivos enviados ficam acessíveis publicamente em /uploads/... (sem exigir chave,
// já que são fotos/documentos que o próprio site precisa exibir em <img>/link direto).
app.use("/uploads", express.static(PASTA_UPLOADS));

// Verificação simples de saúde do servidor (não exige chave — útil para o site
// checar se o backend está de pé antes de tentar usar).
app.get("/api/status", (req, res) => res.json({ ok: true, servico: "controle-documental-backend" }));

// Todas as rotas abaixo exigem a chave de API (cabeçalho X-Api-Key).
app.use("/api/colecoes", exigirChave, rotasColecoes(pool));
app.use("/api/auditoria", exigirChave, rotasAuditoria(pool));
app.use("/api/arquivos-bin", exigirChave, rotasArquivos(pool, PASTA_UPLOADS));

app.use((req, res) => res.status(404).json({ erro: "Rota não encontrada." }));

migrar()
  .then(() => {
    app.listen(PORTA, () => console.log("Controle Documental — backend ouvindo na porta " + PORTA));
  })
  .catch(err => {
    console.error("Falha ao preparar o banco de dados:", err);
    process.exit(1);
  });
