/**
 * IUserRepository
 * 
 * Repository interface for User entity operations
 */
import { User } from '../entities';

export interface IUserRepository {
  /**
   * Find a user by their ID
   * @param id The user ID
   * @returns The user if found, or null
   */
  findById(id: number): Promise<User | null>;
  
  /**
   * Find a user by their username
   * @param username The username
   * @returns The user if found, or null
   */
  findByUsername(username: string): Promise<User | null>;
  
  /**
   * Save or update a user
   * @param user The user to save or update
   * @returns The saved user
   */
  save(user: User): Promise<User>;
  
  /**
   * Find all active users
   * @returns Array of active users
   */
  findAllActive(): Promise<User[]>;
}