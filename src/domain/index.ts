/**
 * Domain layer
 * 
 * This is the core of the application containing all business rules
 * organized by features. The domain layer has no dependencies on
 * external frameworks or libraries and defines interfaces (ports)
 * that are implemented by the infrastructure layer.
 */

// Export all domain features
export * from './common';
export * from './finance';
export * from './transcription';