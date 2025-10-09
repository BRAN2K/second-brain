export interface FinancialTransaction {
  id?: number;
  userId: number;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  description: string;
  date: Date;
  account?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt?: Date;
  metadata?: string; // JSON string para dados adicionais
}

export interface FinancialAccount {
  id?: number;
  userId: number;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
  bank?: string;
  balance?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface FinancialGoal {
  id?: number;
  userId: number;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date;
  category: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ExtractedFinancialData {
  transactions: Partial<FinancialTransaction>[];
  accounts: Partial<FinancialAccount>[];
  goals: Partial<FinancialGoal>[];
  notes: string[];
  confidence: number; // 0-1, confiança na extração
}

export interface FinanceExtractionMetadata {
  userId: number;
  username?: string;
  audioDuration?: number;
  transcriptionText: string;
  timestamp: Date;
}




