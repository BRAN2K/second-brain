/**
 * FinancialAccount entity
 * 
 * Represents a financial account in the system.
 */
export class FinancialAccount {
  private _id?: number;
  private _userId: number;
  private _name: string;
  private _type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
  private _bank?: string;
  private _balance?: number;
  private _createdAt: Date;
  private _updatedAt?: Date;
  private _isActive: boolean;

  constructor(
    userId: number,
    name: string,
    type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash',
    bank?: string,
    balance?: number,
    isActive: boolean = true,
    createdAt: Date = new Date(),
    updatedAt?: Date,
    id?: number
  ) {
    this.validateUserId(userId);
    this.validateName(name);
    this.validateType(type);
    if (balance !== undefined) {
      this.validateBalance(balance);
    }

    this._id = id;
    this._userId = userId;
    this._name = name;
    this._type = type;
    this._bank = bank;
    this._balance = balance;
    this._isActive = isActive;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // Validations
  private validateUserId(userId: number): void {
    if (!userId || userId <= 0) {
      throw new Error('User ID must be a positive number');
    }
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Account name cannot be empty');
    }
  }

  private validateType(type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash'): void {
    const validTypes = ['checking', 'savings', 'credit', 'investment', 'cash'];
    if (!validTypes.includes(type)) {
      throw new Error('Account type must be checking, savings, credit, investment, or cash');
    }
  }

  private validateBalance(balance: number): void {
    if (isNaN(balance)) {
      throw new Error('Account balance must be a number');
    }
  }

  // Getters
  get id(): number | undefined {
    return this._id;
  }

  get userId(): number {
    return this._userId;
  }

  get name(): string {
    return this._name;
  }

  get type(): 'checking' | 'savings' | 'credit' | 'investment' | 'cash' {
    return this._type;
  }

  get bank(): string | undefined {
    return this._bank;
  }

  get balance(): number | undefined {
    return this._balance;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt ? new Date(this._updatedAt) : undefined;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  // Domain methods

  /**
   * Updates the account name
   */
  updateName(name: string): void {
    this.validateName(name);
    this._name = name;
    this._updatedAt = new Date();
  }

  /**
   * Updates the account type
   */
  updateType(type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash'): void {
    this.validateType(type);
    this._type = type;
    this._updatedAt = new Date();
  }

  /**
   * Updates the account bank
   */
  updateBank(bank?: string): void {
    this._bank = bank;
    this._updatedAt = new Date();
  }

  /**
   * Updates the account balance
   */
  updateBalance(balance?: number): void {
    if (balance !== undefined) {
      this.validateBalance(balance);
    }
    this._balance = balance;
    this._updatedAt = new Date();
  }

  /**
   * Deposit money into the account
   */
  deposit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Deposit amount must be greater than zero');
    }

    if (this._balance === undefined) {
      this._balance = amount;
    } else {
      this._balance += amount;
    }
    this._updatedAt = new Date();
  }

  /**
   * Withdraw money from the account
   */
  withdraw(amount: number): void {
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be greater than zero');
    }

    if (this._balance === undefined) {
      throw new Error('Cannot withdraw from account with undefined balance');
    }

    if (this._balance < amount) {
      throw new Error('Insufficient funds');
    }

    this._balance -= amount;
    this._updatedAt = new Date();
  }

  /**
   * Activate the account
   */
  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Deactivate the account
   */
  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  /**
   * Checks if the account is a credit account
   */
  isCreditAccount(): boolean {
    return this._type === 'credit';
  }

  /**
   * Creates a JSON representation of the financial account
   */
  toJSON(): Record<string, any> {
    return {
      id: this._id,
      userId: this._userId,
      name: this._name,
      type: this._type,
      bank: this._bank,
      balance: this._balance,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      isActive: this._isActive
    };
  }
}