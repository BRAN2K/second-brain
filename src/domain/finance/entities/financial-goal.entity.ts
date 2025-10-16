/**
 * FinancialGoal entity
 * 
 * Represents a financial goal in the system.
 */
export class FinancialGoal {
  private _id?: number;
  private _userId: number;
  private _title: string;
  private _description?: string;
  private _targetAmount: number;
  private _currentAmount: number;
  private _targetDate?: Date;
  private _category: string;
  private _status: 'active' | 'completed' | 'paused' | 'cancelled';
  private _createdAt: Date;
  private _updatedAt?: Date;

  constructor(
    userId: number,
    title: string,
    targetAmount: number,
    currentAmount: number,
    category: string,
    description?: string,
    targetDate?: Date,
    status: 'active' | 'completed' | 'paused' | 'cancelled' = 'active',
    createdAt: Date = new Date(),
    updatedAt?: Date,
    id?: number
  ) {
    this.validateUserId(userId);
    this.validateTitle(title);
    this.validateTargetAmount(targetAmount);
    this.validateCurrentAmount(currentAmount);
    this.validateCategory(category);
    if (targetDate) {
      this.validateTargetDate(targetDate);
    }

    this._id = id;
    this._userId = userId;
    this._title = title;
    this._description = description;
    this._targetAmount = targetAmount;
    this._currentAmount = currentAmount;
    this._targetDate = targetDate;
    this._category = category;
    this._status = status;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // Validations
  private validateUserId(userId: number): void {
    if (!userId || userId <= 0) {
      throw new Error('User ID must be a positive number');
    }
  }

  private validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Goal title cannot be empty');
    }
  }

  private validateTargetAmount(targetAmount: number): void {
    if (targetAmount <= 0) {
      throw new Error('Goal target amount must be greater than zero');
    }
  }

  private validateCurrentAmount(currentAmount: number): void {
    if (currentAmount < 0) {
      throw new Error('Goal current amount cannot be negative');
    }
  }

  private validateCategory(category: string): void {
    if (!category || category.trim().length === 0) {
      throw new Error('Goal category cannot be empty');
    }
  }

  private validateTargetDate(targetDate: Date): void {
    if (!(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
      throw new Error('Goal target date must be a valid date');
    }
  }

  // Getters
  get id(): number | undefined {
    return this._id;
  }

  get userId(): number {
    return this._userId;
  }

  get title(): string {
    return this._title;
  }

  get description(): string | undefined {
    return this._description;
  }

  get targetAmount(): number {
    return this._targetAmount;
  }

  get currentAmount(): number {
    return this._currentAmount;
  }

  get targetDate(): Date | undefined {
    return this._targetDate ? new Date(this._targetDate) : undefined;
  }

  get category(): string {
    return this._category;
  }

  get status(): 'active' | 'completed' | 'paused' | 'cancelled' {
    return this._status;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt ? new Date(this._updatedAt) : undefined;
  }

  // Domain methods
  
  /**
   * Updates the goal title
   */
  updateTitle(title: string): void {
    this.validateTitle(title);
    this._title = title;
    this._updatedAt = new Date();
  }

  /**
   * Updates the goal description
   */
  updateDescription(description?: string): void {
    this._description = description;
    this._updatedAt = new Date();
  }

  /**
   * Updates the goal target amount
   */
  updateTargetAmount(targetAmount: number): void {
    this.validateTargetAmount(targetAmount);
    this._targetAmount = targetAmount;
    this._updatedAt = new Date();
    
    // Check if goal is completed with the new target
    if (this._currentAmount >= targetAmount && this._status === 'active') {
      this._status = 'completed';
    }
  }

  /**
   * Updates the goal current amount
   */
  updateCurrentAmount(currentAmount: number): void {
    this.validateCurrentAmount(currentAmount);
    this._currentAmount = currentAmount;
    this._updatedAt = new Date();
    
    // Check if goal is completed with the new amount
    if (currentAmount >= this._targetAmount && this._status === 'active') {
      this._status = 'completed';
    }
  }

  /**
   * Add progress to the goal
   */
  addProgress(amount: number): void {
    if (amount <= 0) {
      throw new Error('Progress amount must be greater than zero');
    }
    
    this._currentAmount += amount;
    this._updatedAt = new Date();
    
    // Check if goal is completed with the new amount
    if (this._currentAmount >= this._targetAmount && this._status === 'active') {
      this._status = 'completed';
    }
  }

  /**
   * Updates the goal target date
   */
  updateTargetDate(targetDate?: Date): void {
    if (targetDate) {
      this.validateTargetDate(targetDate);
    }
    this._targetDate = targetDate;
    this._updatedAt = new Date();
  }

  /**
   * Updates the goal category
   */
  updateCategory(category: string): void {
    this.validateCategory(category);
    this._category = category;
    this._updatedAt = new Date();
  }

  /**
   * Mark the goal as active
   */
  markAsActive(): void {
    this._status = 'active';
    this._updatedAt = new Date();
  }

  /**
   * Mark the goal as completed
   */
  markAsCompleted(): void {
    this._status = 'completed';
    this._updatedAt = new Date();
  }

  /**
   * Mark the goal as paused
   */
  markAsPaused(): void {
    this._status = 'paused';
    this._updatedAt = new Date();
  }

  /**
   * Mark the goal as cancelled
   */
  markAsCancelled(): void {
    this._status = 'cancelled';
    this._updatedAt = new Date();
  }

  /**
   * Calculate progress percentage
   */
  getProgressPercentage(): number {
    return (this._currentAmount / this._targetAmount) * 100;
  }

  /**
   * Checks if the goal is completed
   */
  isCompleted(): boolean {
    return this._status === 'completed';
  }

  /**
   * Checks if the goal is overdue
   */
  isOverdue(): boolean {
    if (!this._targetDate) return false;
    const now = new Date();
    return this._targetDate < now && this._status === 'active';
  }

  /**
   * Creates a JSON representation of the financial goal
   */
  toJSON(): Record<string, any> {
    return {
      id: this._id,
      userId: this._userId,
      title: this._title,
      description: this._description,
      targetAmount: this._targetAmount,
      currentAmount: this._currentAmount,
      targetDate: this._targetDate,
      category: this._category,
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      progressPercentage: this.getProgressPercentage()
    };
  }
}