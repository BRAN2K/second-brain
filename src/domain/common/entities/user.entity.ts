/**
 * User entity
 * 
 * Represents a user in the system.
 */
export class User {
  private _id: number;
  private _username?: string;
  private _firstName?: string;
  private _lastName?: string;
  private _createdAt: Date;
  private _updatedAt?: Date;
  private _isActive: boolean;

  constructor(
    id: number,
    username?: string,
    firstName?: string,
    lastName?: string,
    isActive: boolean = true,
    createdAt: Date = new Date(),
    updatedAt?: Date
  ) {
    this.validateId(id);
    if (username) {
      this.validateUsername(username);
    }

    this._id = id;
    this._username = username;
    this._firstName = firstName;
    this._lastName = lastName;
    this._isActive = isActive;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // Validations
  private validateId(id: number): void {
    if (!id || id <= 0) {
      throw new Error('User ID must be a positive number');
    }
  }

  private validateUsername(username: string): void {
    if (!username || username.trim().length === 0) {
      throw new Error('Username cannot be empty');
    }
    
    if (username.length < 3 || username.length > 50) {
      throw new Error('Username must be between 3 and 50 characters');
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }
  }

  // Getters
  get id(): number {
    return this._id;
  }

  get username(): string | undefined {
    return this._username;
  }

  get firstName(): string | undefined {
    return this._firstName;
  }

  get lastName(): string | undefined {
    return this._lastName;
  }

  get fullName(): string | undefined {
    if (this._firstName && this._lastName) {
      return `${this._firstName} ${this._lastName}`;
    } else if (this._firstName) {
      return this._firstName;
    } else if (this._lastName) {
      return this._lastName;
    }
    return undefined;
  }

  get displayName(): string {
    return this.fullName || this._username || `User${this._id}`;
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
   * Updates the user's username
   */
  updateUsername(username?: string): void {
    if (username) {
      this.validateUsername(username);
    }
    this._username = username;
    this._updatedAt = new Date();
  }

  /**
   * Updates the user's first name
   */
  updateFirstName(firstName?: string): void {
    this._firstName = firstName;
    this._updatedAt = new Date();
  }

  /**
   * Updates the user's last name
   */
  updateLastName(lastName?: string): void {
    this._lastName = lastName;
    this._updatedAt = new Date();
  }

  /**
   * Activate the user
   */
  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Deactivate the user
   */
  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  /**
   * Creates a JSON representation of the user
   */
  toJSON(): Record<string, any> {
    return {
      id: this._id,
      username: this._username,
      firstName: this._firstName,
      lastName: this._lastName,
      fullName: this.fullName,
      displayName: this.displayName,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      isActive: this._isActive
    };
  }
}