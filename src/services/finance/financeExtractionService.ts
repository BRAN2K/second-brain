import { GoogleGenerativeAI, GenerativeModel, SchemaType } from '@google/generative-ai';
import { ExtractedFinancialData, FinanceExtractionMetadata } from '../../types/finance';

export class FinanceExtractionService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            transactions: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  amount: { type: SchemaType.NUMBER, description: "Valor da transação" },
                  type: { 
                    type: SchemaType.STRING, 
                    enum: ["income", "expense", "transfer"],
                    description: "Tipo da transação: income (receita), expense (despesa), transfer (transferência)"
                  },
                  category: { type: SchemaType.STRING, description: "Categoria da transação (ex: alimentação, transporte, salário)" },
                  description: { type: SchemaType.STRING, description: "Descrição detalhada da transação" },
                  date: { type: SchemaType.STRING, description: "Data da transação no formato YYYY-MM-DD" },
                  account: { type: SchemaType.STRING, description: "Conta ou banco mencionado" },
                  tags: { 
                    type: SchemaType.ARRAY, 
                    items: { type: SchemaType.STRING },
                    description: "Tags ou palavras-chave relacionadas"
                  }
                },
                required: ["amount", "type", "category", "description"]
              }
            },
            accounts: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  name: { type: SchemaType.STRING, description: "Nome da conta" },
                  type: { 
                    type: SchemaType.STRING, 
                    enum: ["checking", "savings", "credit", "investment", "cash"],
                    description: "Tipo da conta"
                  },
                  bank: { type: SchemaType.STRING, description: "Nome do banco" },
                  balance: { type: SchemaType.NUMBER, description: "Saldo atual da conta" }
                },
                required: ["name", "type"]
              }
            },
            goals: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING, description: "Título da meta" },
                  description: { type: SchemaType.STRING, description: "Descrição da meta" },
                  targetAmount: { type: SchemaType.NUMBER, description: "Valor alvo da meta" },
                  currentAmount: { type: SchemaType.NUMBER, description: "Valor atual da meta" },
                  targetDate: { type: SchemaType.STRING, description: "Data alvo no formato YYYY-MM-DD" },
                  category: { type: SchemaType.STRING, description: "Categoria da meta" }
                },
                required: ["title", "targetAmount", "currentAmount", "category"]
              }
            },
            notes: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "Observações gerais sobre finanças mencionadas"
            },
            confidence: {
              type: SchemaType.NUMBER,
              description: "Nível de confiança na extração dos dados (0-1)"
            }
          },
          required: ["transactions", "accounts", "goals", "notes", "confidence"]
        }
      }
    });
  }

  async extractFinancialData(
    transcriptionText: string, 
    metadata: FinanceExtractionMetadata
  ): Promise<ExtractedFinancialData> {
    try {
      const prompt = this.buildExtractionPrompt(transcriptionText);

      const result = await this.model.generateContent([{
        text: prompt
      }]);

      const response = await result.response;
      const jsonText = response.text();

      if (!jsonText) {
        throw new Error('Resposta vazia do modelo Gemini');
      }

      const extractedData = JSON.parse(jsonText) as ExtractedFinancialData;

      // Validar e limpar os dados extraídos
      return this.validateAndCleanData(extractedData);

    } catch (error) {
      console.error('Erro na extração de dados financeiros:', error);
      
      // Retornar estrutura vazia em caso de erro
      return {
        transactions: [],
        accounts: [],
        goals: [],
        notes: [],
        confidence: 0
      };
    }
  }

  private buildExtractionPrompt(transcriptionText: string): string {
    return `
Analise o seguinte texto transcrito de um áudio e extraia informações financeiras estruturadas.

TEXTO TRANSCRITO:
"${transcriptionText}"

INSTRUÇÕES:
1. Identifique transações financeiras mencionadas (receitas, despesas, transferências)
2. Identifique contas bancárias ou financeiras mencionadas
3. Identifique metas ou objetivos financeiros
4. Capture observações gerais sobre finanças
5. Para valores monetários, use números decimais (ex: 150.50 para R$ 150,50)
6. Para datas, use o formato YYYY-MM-DD. Se não houver data específica, use a data atual
7. Seja conservador na extração - só inclua informações claramente mencionadas
8. Defina a confiança baseada na clareza das informações financeiras no texto

CATEGORIAS SUGERIDAS PARA TRANSAÇÕES:
- Alimentação: supermercado, restaurante, delivery
- Transporte: gasolina, uber, transporte público
- Saúde: farmácia, médico, plano de saúde
- Educação: curso, livro, mensalidade
- Lazer: cinema, viagem, entretenimento
- Casa: aluguel, condomínio, energia, água
- Salário: renda do trabalho
- Investimento: aplicação, renda fixa, ações
- Outros: categorias não listadas

Se não houver informações financeiras claras no texto, retorne arrays vazios e confiança 0.
`;
  }

  private validateAndCleanData(data: ExtractedFinancialData): ExtractedFinancialData {
    // Validar transações
    const validTransactions = data.transactions.filter(transaction => {
      return transaction.amount && 
             transaction.type && 
             transaction.category && 
             transaction.description &&
             typeof transaction.amount === 'number' &&
             transaction.amount > 0;
    });

    // Validar contas
    const validAccounts = data.accounts.filter(account => {
      return account.name && 
             account.type &&
             typeof account.name === 'string' &&
             account.name.trim().length > 0;
    });

    // Validar metas
    const validGoals = data.goals.filter(goal => {
      return goal.title && 
             goal.targetAmount && 
             goal.currentAmount !== undefined &&
             goal.category &&
             typeof goal.targetAmount === 'number' &&
             typeof goal.currentAmount === 'number' &&
             goal.targetAmount > 0;
    });

    // Validar confiança
    const confidence = typeof data.confidence === 'number' && 
                      data.confidence >= 0 && 
                      data.confidence <= 1 ? data.confidence : 0;

    return {
      transactions: validTransactions,
      accounts: validAccounts,
      goals: validGoals,
      notes: Array.isArray(data.notes) ? data.notes.filter(note => typeof note === 'string') : [],
      confidence
    };
  }
}

