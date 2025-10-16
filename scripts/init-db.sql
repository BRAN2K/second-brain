-- Script de inicialização do banco de dados PostgreSQL
-- Este script é executado automaticamente quando o container PostgreSQL é criado
-- Criar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tabela de logs de transcrição (migrada do SQLite)
CREATE TABLE IF NOT EXISTS transcription_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  username VARCHAR(255),
  text TEXT NOT NULL,
  audio_duration REAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_transcription_logs_user_id ON transcription_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_transcription_logs_created_at ON transcription_logs(created_at)
);

-- Tabela de transações financeiras
CREATE TABLE IF NOT EXISTS financial_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  TYPE VARCHAR(20) NOT NULL CHECK (TYPE IN ('income', 'expense', 'transfer')),
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  DATE DATE NOT NULL,
  account VARCHAR(100),
  tags TEXT [ ],
  -- Array de strings para tags
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT -- JSON string para dados adicionais
);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON financial_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(DATE);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(TYPE);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON financial_transactions(category)
);

-- Tabela de contas financeiras
CREATE TABLE IF NOT EXISTS financial_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  NAME VARCHAR(100) NOT NULL,
  TYPE VARCHAR(20) NOT NULL CHECK (
    TYPE IN (
      'checking',
      'savings',
      'credit',
      'investment',
      'cash'
    )
  ),
  bank VARCHAR(100),
  balance DECIMAL(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_financial_accounts_user_id ON financial_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_financial_accounts_type ON financial_accounts(TYPE)
);

-- Tabela de metas financeiras
CREATE TABLE IF NOT EXISTS financial_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  target_amount DECIMAL(15, 2) NOT NULL,
  current_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  target_date DATE,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id ON financial_goals(user_id);

CREATE INDEX IF NOT EXISTS idx_financial_goals_target_date ON financial_goals(target_date);

CREATE INDEX IF NOT EXISTS idx_financial_goals_category ON financial_goals(category)
);

-- Tabela de logs de extração financeira
CREATE TABLE IF NOT EXISTS finance_extraction_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  transcription_text TEXT NOT NULL,
  extracted_data JSONB NOT NULL,
  confidence DECIMAL(3, 2) NOT NULL CHECK (
    confidence >= 0
    AND confidence <= 1
  ),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_finance_extraction_logs_user_id ON finance_extraction_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_finance_extraction_logs_created_at ON finance_extraction_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_finance_extraction_logs_confidence ON finance_extraction_logs(confidence)
);

-- Função para atualizar updated_at automaticamente
CREATE
OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN
  NEW .updated_at = CURRENT_TIMESTAMP;

RETURN NEW;

END;

$$ LANGUAGE 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_financial_transactions_updated_at BEFORE
UPDATE
  ON financial_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_accounts_updated_at BEFORE
UPDATE
  ON financial_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_goals_updated_at BEFORE
UPDATE
  ON financial_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE transcription_logs IS 'Logs de transcrições de áudio do Telegram';

COMMENT ON TABLE financial_transactions IS 'Transações financeiras extraídas dos áudios';

COMMENT ON TABLE financial_accounts IS 'Contas financeiras mencionadas nos áudios';

COMMENT ON TABLE financial_goals IS 'Metas financeiras extraídas dos áudios';

COMMENT ON TABLE finance_extraction_logs IS 'Logs de extração de dados financeiros';

-- Inserir dados de exemplo (opcional - remover em produção)
-- INSERT INTO financial_accounts (user_id, name, type, bank) VALUES 
-- (1, 'Conta Corrente', 'checking', 'Banco do Brasil'),
-- (1, 'Poupança', 'savings', 'Banco do Brasil');
-- INSERT INTO financial_goals (user_id, title, target_amount, current_amount, category) VALUES
-- (1, 'Viagem para Europa', 10000.00, 2500.00, 'viagem');