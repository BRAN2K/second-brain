import { Knex } from 'knex';
import { 
  FinancialTransaction, 
  FinancialAccount, 
  FinancialGoal, 
  ExtractedFinancialData 
} from '../../types/finance';
import { TranscriptionLog } from '../../types';
import DatabaseConnection from './knexConnection';

export class PostgresService {
  private knex: Knex;

  constructor() {
    this.knex = DatabaseConnection.getInstance().getKnex();
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await DatabaseConnection.getInstance().testConnection();
      await DatabaseConnection.getInstance().runMigrations();
    } catch (error) {
      console.error('❌ Erro ao inicializar banco de dados:', error);
      throw error;
    }
  }

  // ===== TRANSCRIÇÃO LOGS =====
  async insertTranscriptionLog(log: TranscriptionLog): Promise<void> {
    await this.knex('transcription_logs').insert({
      user_id: log.userId,
      username: log.username || null,
      text: log.text,
      audio_duration: log.audioDuration || null,
      created_at: log.createdAt,
      metadata: log.metadata || null
    });
  }

  async getTranscriptionLogs(userId?: number, limit: number = 100): Promise<TranscriptionLog[]> {
    let query = this.knex('transcription_logs').select('*');
    
    if (userId) {
      query = query.where('user_id', userId);
    }
    
    const rows = await query
      .orderBy('created_at', 'desc')
      .limit(limit);
    
    return rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      username: row.username,
      text: row.text,
      audioDuration: row.audio_duration,
      createdAt: new Date(row.created_at),
      metadata: row.metadata
    }));
  }

  // ===== TRANSAÇÕES FINANCEIRAS =====
  async insertFinancialTransaction(transaction: FinancialTransaction): Promise<number> {
    const [result] = await this.knex('financial_transactions')
      .insert({
        user_id: transaction.userId,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
        account: transaction.account || null,
        tags: transaction.tags || null,
        metadata: transaction.metadata || null
      })
      .returning('id');
    return result.id;
  }

  async getFinancialTransactions(userId: number, limit: number = 100): Promise<FinancialTransaction[]> {
    const rows = await this.knex('financial_transactions')
      .where('user_id', userId)
      .orderBy('date', 'desc')
      .orderBy('created_at', 'desc')
      .limit(limit);

    return rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      amount: parseFloat(row.amount),
      type: row.type,
      category: row.category,
      description: row.description,
      date: new Date(row.date),
      account: row.account,
      tags: row.tags,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      metadata: row.metadata
    }));
  }

  // ===== CONTAS FINANCEIRAS =====
  async insertFinancialAccount(account: FinancialAccount): Promise<number> {
    const [result] = await this.knex('financial_accounts')
      .insert({
        user_id: account.userId,
        name: account.name,
        type: account.type,
        bank: account.bank || null,
        balance: account.balance || null
      })
      .returning('id');
    return result.id;
  }

  async getFinancialAccounts(userId: number): Promise<FinancialAccount[]> {
    const rows = await this.knex('financial_accounts')
      .where('user_id', userId)
      .orderBy('created_at', 'desc');

    return rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      type: row.type,
      bank: row.bank,
      balance: row.balance ? parseFloat(row.balance) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }));
  }

  // ===== METAS FINANCEIRAS =====
  async insertFinancialGoal(goal: FinancialGoal): Promise<number> {
    const [result] = await this.knex('financial_goals')
      .insert({
        user_id: goal.userId,
        title: goal.title,
        description: goal.description || null,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount,
        target_date: goal.targetDate || null,
        category: goal.category
      })
      .returning('id');
    return result.id;
  }

  async getFinancialGoals(userId: number): Promise<FinancialGoal[]> {
    const rows = await this.knex('financial_goals')
      .where('user_id', userId)
      .orderBy('target_date', 'asc')
      .orderBy('created_at', 'desc');

    return rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      targetAmount: parseFloat(row.target_amount),
      currentAmount: parseFloat(row.current_amount),
      targetDate: row.target_date ? new Date(row.target_date) : undefined,
      category: row.category,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }));
  }

  // ===== LOGS DE EXTRAÇÃO FINANCEIRA =====
  async insertFinanceExtractionLog(
    userId: number,
    transcriptionText: string,
    extractedData: ExtractedFinancialData
  ): Promise<number> {
    const [result] = await this.knex('finance_extraction_logs')
      .insert({
        user_id: userId,
        transcription_text: transcriptionText,
        extracted_data: JSON.stringify(extractedData),
        confidence: extractedData.confidence
      })
      .returning('id');
    return result.id;
  }

  // ===== MÉTODOS DE BATCH =====
  async insertExtractedFinancialData(
    userId: number,
    extractedData: ExtractedFinancialData
  ): Promise<{
    transactions: number[];
    accounts: number[];
    goals: number[];
  }> {
    return this.knex.transaction(async trx => {
      const transactionIds: number[] = [];
      const accountIds: number[] = [];
      const goalIds: number[] = [];

      // Inserir transações
      for (const transaction of extractedData.transactions) {
        if (transaction.amount && transaction.type && transaction.category && transaction.description) {
          const transactionToInsert = {
            user_id: userId,
            amount: transaction.amount,
            type: transaction.type,
            category: transaction.category,
            description: transaction.description,
            date: transaction.date || new Date(),
            account: transaction.account,
            tags: transaction.tags,
            metadata: transaction.metadata
            // created_at e updated_at são gerenciados pelo banco de dados
          };
          
          const [result] = await trx('financial_transactions').insert(transactionToInsert).returning('id');
          transactionIds.push(result.id);
        }
      }

      // Inserir contas
      for (const account of extractedData.accounts) {
        if (account.name && account.type) {
          const fullAccount: FinancialAccount = {
            userId,
            name: account.name,
            type: account.type,
            bank: account.bank,
            balance: account.balance,
            createdAt: new Date()
          };
          
          const [result] = await trx('financial_accounts').insert(fullAccount).returning('id');
          accountIds.push(result.id);
        }
      }

      // Inserir metas
      for (const goal of extractedData.goals) {
        if (goal.title && goal.targetAmount !== undefined && goal.currentAmount !== undefined && goal.category) {
          const fullGoal: FinancialGoal = {
            userId,
            title: goal.title,
            description: goal.description,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount,
            targetDate: goal.targetDate ? new Date(goal.targetDate) : undefined,
            category: goal.category,
            createdAt: new Date()
          };
          
          const [result] = await trx('financial_goals').insert(fullGoal).returning('id');
          goalIds.push(result.id);
        }
      }

      return {
        transactions: transactionIds,
        accounts: accountIds,
        goals: goalIds
      };
    });
  }

  // ===== MÉTODOS DE ESTATÍSTICAS =====
  async getFinancialSummary(userId: number): Promise<{
    totalIncome: number;
    totalExpenses: number;
    accountCount: number;
    goalCount: number;
    recentTransactions: number;
  }> {
    const summary = await this.knex('financial_transactions')
      .where('user_id', userId)
      .select(
        this.knex.raw("COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income"),
        this.knex.raw("COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses")
      )
      .first();

    const accountCountResult = await this.knex('financial_accounts').where('user_id', userId).count('* as count').first();
    const goalCountResult = await this.knex('financial_goals').where('user_id', userId).count('* as count').first();
    const recentTransactionsResult = await this.knex('financial_transactions')
      .where('user_id', userId)
      .where('created_at', '>=', this.knex.raw("NOW() - INTERVAL '30 days'"))
      .count('* as count')
      .first();

    return {
      totalIncome: parseFloat(summary?.total_income ?? '0'),
      totalExpenses: parseFloat(summary?.total_expenses ?? '0'),
      accountCount: parseInt((accountCountResult?.count as string) ?? '0'),
      goalCount: parseInt((goalCountResult?.count as string) ?? '0'),
      recentTransactions: parseInt((recentTransactionsResult?.count as string) ?? '0')
    };
  }

  async close(): Promise<void> {
    await this.knex.destroy();
  }
}

