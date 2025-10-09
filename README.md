# Second Brain - Bot de Transcrição e Análise Financeira

Um bot do Telegram que transcreve áudios e extrai informações financeiras usando IA, com armazenamento estruturado em PostgreSQL.

## 🚀 Funcionalidades

- **Transcrição de Áudio**: Converte áudios em texto usando Gemini AI
- **Extração Financeira**: Identifica automaticamente:
  - Transações (receitas, despesas, transferências)
  - Contas bancárias mencionadas
  - Metas financeiras
  - Observações sobre finanças
- **Armazenamento Estruturado**: Dados organizados em PostgreSQL
- **Interface Intuitiva**: Bot do Telegram fácil de usar

## 🛠️ Tecnologias

- **Node.js + TypeScript**
- **Telegraf** (Bot do Telegram)
- **Gemini AI** (Transcrição e análise)
- **PostgreSQL** (Banco de dados)
- **Docker** (Containerização)

## 📋 Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- Chave da API do Telegram Bot
- Chave da API do Gemini

## 🔧 Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd second-brain
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp env.example .env
# Edite o arquivo .env com suas chaves
```

4. **Inicie o PostgreSQL com Docker**
```bash
npm run docker:up
```

5. **Migre dados existentes (se houver)**
```bash
npm run migrate:data
```

6. **Compile o projeto**
```bash
npm run build
```

7. **Inicie o bot**
```bash
npm start
```

## 🐳 Docker

### Comandos úteis:
```bash
# Iniciar containers
npm run docker:up

# Parar containers
npm run docker:down

# Ver logs
npm run docker:logs
```

### Acessar pgAdmin:
- URL: http://localhost:8080
- Email: admin@secondbrain.com
- Senha: admin123

## 📊 Estrutura do Banco de Dados

### Tabelas principais:
- `transcription_logs`: Logs de transcrições
- `financial_transactions`: Transações extraídas
- `financial_accounts`: Contas mencionadas
- `financial_goals`: Metas financeiras
- `finance_extraction_logs`: Logs de extração

## 🎯 Como Usar

1. **Inicie uma conversa** com o bot no Telegram
2. **Envie um áudio** (MP3, WAV, OGG, etc.) ou mensagem de voz
3. **Aguarde o processamento** (transcrição + análise)
4. **Receba os resultados** organizados por categoria

### Exemplo de uso:
```
Usuário: [Envia áudio falando: "Gastei 50 reais no almoço hoje e recebi 2000 de salário"]
Bot: 
📝 Transcrição:
Gastei 50 reais no almoço hoje e recebi 2000 de salário

💰 Transações identificadas:
📉 Gastei 50 reais no almoço - R$ 50
📈 Recebi 2000 de salário - R$ 2000

🔍 Confiança na extração: 95%
```

## 🔧 Desenvolvimento

### Scripts disponíveis:
```bash
npm run dev          # Desenvolvimento com ts-node
npm run dev:watch    # Desenvolvimento com watch mode
npm run build        # Compilar TypeScript
npm run start        # Executar versão compilada
npm run migrate:data # Migrar dados do SQLite
```

### Estrutura do projeto:
```
src/
├── bot.ts                    # Bot principal
├── handlers/
│   └── audioHandler.ts       # Processamento de áudio
├── services/
│   ├── database/
│   │   ├── postgresService.ts # Serviço PostgreSQL
│   │   └── sqliteService.ts   # Serviço SQLite (legado)
│   ├── finance/
│   │   └── financeExtractionService.ts # Extração financeira
│   ├── logging/
│   │   ├── ILogger.ts
│   │   └── pinoLogger.ts
│   └── speechToText/
│       ├── ISpeechToText.ts
│       └── geminiSpeechService.ts
└── types/
    ├── index.ts              # Tipos gerais
    └── finance.ts            # Tipos financeiros
```

## 🔒 Variáveis de Ambiente

```env
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token

# Gemini AI
GEMINI_API_KEY=your_gemini_key

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=second_brain
POSTGRES_USER=second_brain_user
POSTGRES_PASSWORD=second_brain_password

# Logging
LOG_LEVEL=info
```

## 📈 Roadmap

- [ ] Dashboard web para visualização de dados
- [ ] Relatórios financeiros automáticos
- [ ] Integração com APIs bancárias
- [ ] Categorização automática melhorada
- [ ] Backup automático de dados
- [ ] Suporte a múltiplos idiomas

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do Docker: `npm run docker:logs`
2. Verifique as variáveis de ambiente
3. Teste a conexão com PostgreSQL
4. Abra uma issue no repositório