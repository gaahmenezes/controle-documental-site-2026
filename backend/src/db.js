// Camada de acesso ao Postgres. Um único banco relacional simples: uma tabela
// de "documentos JSON" (uma coleção + um id + um corpo JSON), igual ao modelo
// de coleções/documentos que o site já usa — então o site não precisa mudar
// de forma de pensar, só de para onde manda os dados.
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error(
    "ERRO: variável de ambiente DATABASE_URL não definida. " +
    "Aponte para o seu banco Postgres (Render, Railway, Neon, Supabase-como-Postgres, ou um Postgres próprio)."
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // A maioria dos provedores de Postgres gerenciado (Render, Railway, Neon, Supabase)
  // exige SSL; isso funciona para eles e para um Postgres local sem TLS configurado.
  ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false },
});

async function migrar() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS colecoes (
      colecao      TEXT NOT NULL,
      id           TEXT NOT NULL,
      dados        JSONB NOT NULL,
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (colecao, id)
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_colecoes_colecao ON colecoes (colecao);
  `);
  // acelera a listagem filtrada por obra (?obraId=58)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_colecoes_obra ON colecoes (colecao, (dados->>'obraId'));
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS arquivos_binarios (
      id           TEXT PRIMARY KEY,
      colecao      TEXT NOT NULL,       -- 'arquivos' (documentos originais) ou 'midias' (fotos)
      nome         TEXT NOT NULL,
      tipo         TEXT NOT NULL,
      tamanho      BIGINT NOT NULL,
      caminho      TEXT NOT NULL,       -- caminho relativo dentro de /uploads
      criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log("Schema verificado/criado com sucesso.");
}

module.exports = { pool, migrar };
