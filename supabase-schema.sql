-- ============================================================
-- Schema do banco de dados - Piquete Tropeiros da Lealdade
-- Cole este SQL no Supabase: SQL Editor > New Query > Run
-- ============================================================

-- Tabela de membros
CREATE TABLE IF NOT EXISTS "Membros" (
  id             BIGSERIAL PRIMARY KEY,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  cpf            BIGINT NOT NULL UNIQUE,
  nome           TEXT NOT NULL,
  sobrenome      TEXT NOT NULL,
  "dataNascimento" DATE,
  email          TEXT,
  telefone       BIGINT,
  status         BOOLEAN DEFAULT TRUE
);

-- Tabela de mensalidades
CREATE TABLE IF NOT EXISTS "Mensalidade" (
  id             BIGSERIAL PRIMARY KEY,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  "anoReferencia"  INT NOT NULL,
  "mesReferencia"  INT NOT NULL CHECK ("mesReferencia" BETWEEN 1 AND 12),
  "valorDevido"    NUMERIC(10,2) NOT NULL,
  "dataVencimento" DATE NOT NULL,
  statuspg       BOOLEAN DEFAULT FALSE,
  id_membro      BIGINT NOT NULL REFERENCES "Membros"(cpf) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_mensalidade_membro ON "Mensalidade"(id_membro);
CREATE INDEX IF NOT EXISTS idx_mensalidade_status ON "Mensalidade"(statuspg);

-- ============================================================
-- Permissões de acesso (Row Level Security)
-- O app usa a anon key, então libera acesso total para anon.
-- Se quiser restringir no futuro, troque por políticas por usuário.
-- ============================================================

ALTER TABLE "Membros" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Mensalidade" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_membros" ON "Membros" FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_mensalidade" ON "Mensalidade" FOR ALL TO anon USING (true) WITH CHECK (true);
