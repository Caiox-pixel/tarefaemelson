-- Criação da tabela de atendimentos para uso com Supabase
-- Cole esse SQL no editor SQL do Supabase ou no seu banco PostgreSQL.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.atendimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text NOT NULL,
  data text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  hash text UNIQUE,
  dataSync timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índice opcional para pesquisar por status ou data
CREATE INDEX IF NOT EXISTS idx_atendimentos_status ON public.atendimentos (status);
CREATE INDEX IF NOT EXISTS idx_atendimentos_data ON public.atendimentos (data);
