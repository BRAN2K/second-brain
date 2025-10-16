/**
 * FinancialTransaction entity
 * 
 * Represents a financial transaction in the system.
 */
export class FinancialTransaction {
  private _id?: number;
  private _userId: number;
  private _amount: number;
  private _type: 'income' | 'expense' | 'transfer';
  private _category: string;
  private _description: string;
  private _date: Date;
  private _account?: string;
  private _tags?: string[];
  private _createdAt: Date;
  private _updatedAt?: Date;
  private _metadata?: Record<string, any>;

  constructor(
    userId: number,
    amount: number,
    type: 'income' | 'expense' | 'transfer',
    category: string,
    description: string,
    date: Date,
    account?: string,
    tags?: string[],
    metadata?: Record<string, any>,
    createdAt: Date = new Date(),
    updatedAt?: Date,
    id?: number
  ) {
    this.validateUserId(userId);
    this.validateAmount(amount);
    this.validateType(type);
    this.validateCategory(category);
    this.validateDescription(description);
    this.validateDate(date);

    this._id = id;
    this._userId = userId;
    this._amount = amount;
    this._type = type;
    this._category = category;
    this._description = description;
    this._date = date;
    this._account = account;
    this._tags = tags;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._metadata = metadata;
  }

  // Validations
  private validateUserId(userId: number): void {
    if (!userId || userId <= 0) {
      throw new Error('User ID must be a positive number');
    }
  }

  private validateAmount(amount: number): void {
    if (amount <= 0) {
      throw new Error('Transaction amount must be greater than zero');
    }
  }

  private validateType(type: 'income' | 'expense' | 'transfer'): void {
    const validTypes = ['income', 'expense', 'transfer'];
    if (!validTypes.includes(type)) {
      throw new Error('Transaction type must be income, expense, or transfer');
    }
  }

  private validateCategory(category: string): void {
    if (!category || category.trim().length === 0) {
      throw new Error('Transaction category cannot be empty');
    }
  }

  private validateDescription(description: string): void {
    if (!description || description.trim().length === 0) {
      throw new Error('Transaction description cannot be empty');
    }
  }

  private validateDate(date: Date): void {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Transaction date must be a valid date');
    }
  }

  // Getters
  get id(): number | undefined {
    return this._id;
  }

  get userId(): number {
    return this._userId;
  }

  get amount(): number {
    return this._amount;
  }

  get type(): 'income' | 'expense' | 'transfer' {
    return this._type;
  }

  get category(): string {
    return this._category;
  }

  get description(): string {
    return this._description;
  }

  get date(): Date {
    return new Date(this._date);
  }

  get account(): string | undefined {
    return this._account;
  }

  get tags(): string[] | undefined {
    return this._tags ? [...this._tags] : undefined;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt ? new Date(this._updatedAt) : undefined;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata ? { ...this._metadata } : undefined;
  }

  // Domain methods
  
  /**
   * Updates the transaction amount
   */
  updateAmount(amount: number): void {
    this.validateAmount(amount);
    this._amount = amount;
    this._updatedAt = new Date();
  }

  /**
   * Updates the transaction category
   */
  updateCategory(category: string): void {
    this.validateCategory(category);
    this._category = category;
    this._updatedAt = new Date();
  }

  /**
   * Updates the transaction description
   */
  updateDescription(description: string): void {
    this.validateDescription(description);
    this._description = description;
    this._updatedAt = new Date();
  }

  /**
   * Updates the transaction date
   */
  updateDate(date: Date): void {
    this.validateDate(date);
    this._date = date;
    this._updatedAt = new Date();
  }

  /**
   * Updates the transaction account
   */
  updateAccount(account?: string): void {
    this._account = account;
    this._updatedAt = new Date();
  }

  /**
   * Updates the transaction tags
   */
  updateTags(tags?: string[]): void {
    this._tags = tags;
    this._updatedAt = new Date();
  }

  /**
   * Checks if the transaction is an income
   */
  isIncome(): boolean {
    return this._type === 'income';
  }

  /**
   * Checks if the transaction is an expense
   */
  isExpense(): boolean {
    return this._type === 'expense';
  }

  /**
   * Checks if the transaction is a transfer
   */
  isTransfer(): boolean {
    return this._type === 'transfer';
  }

  /**
   * Creates a JSON representation of the financial transaction
   */
  toJSON(): Record<string, any> {
    return {
      id: this._id,
      userId: this._userId,
      amount: this._amount,
      type: this._type,
      category: this._category,
      description: this._description,
      date: this._date,
      account: this._account,
      tags: this._tags,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      metadata: this._metadata
    };
  }
}