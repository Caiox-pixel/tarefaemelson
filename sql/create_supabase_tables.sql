-- Criação da tabela de atendimentos para uso com Supabase
-- Cole esse SQL no editor SQL do Supabase ou no seu banco PostgreSQL.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.atendimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cpf text NOT NULL,
  idade integer NOT NULL,
  contato text NOT NULL,
  "tipoProblema" text NOT NULL,
  descricao text NOT NULL,
  data text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  hash text UNIQUE,
  "dataSync" timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índice opcional para pesquisar por status ou data
CREATE INDEX IF NOT EXISTS idx_atendimentos_status ON public.atendimentos (status);
CREATE INDEX IF NOT EXISTS idx_atendimentos_data ON public.atendimentos (data);

-- Se a tabela já existia antes, adiciona colunas que podem estar faltando
ALTER TABLE IF EXISTS public.atendimentos
  ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE IF EXISTS public.atendimentos
  ADD COLUMN IF NOT EXISTS idade integer;
ALTER TABLE IF EXISTS public.atendimentos
  ADD COLUMN IF NOT EXISTS contato text;
ALTER TABLE IF EXISTS public.atendimentos
  ADD COLUMN IF NOT EXISTS "tipoProblema" text;
ALTER TABLE IF EXISTS public.atendimentos
  ADD COLUMN IF NOT EXISTS hash text UNIQUE;
ALTER TABLE IF EXISTS public.atendimentos
  ADD COLUMN IF NOT EXISTS "dataSync" timestamptz NOT NULL DEFAULT now();
ALTER TABLE IF EXISTS public.atendimentos
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE IF EXISTS public.atendimentos
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
