/**
 * Service for logging and tracking errors
 */
export class ErrorLogService {
  private static errors: ErrorRecord[] = [];
  private static maxErrors = 100;
  
  /**
   * Log an error
   * @param error Error object or string
   * @param context Additional context
   */
  static logError(error: unknown, context?: string): void {
    const errorRecord: ErrorRecord = {
      timestamp: new Date(),
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context
    };
    
    // Add to in-memory log
    this.errors.unshift(errorRecord);
    
    // Keep log size manageable
    if (this.errors.length > this.maxErrors) {
      this.errors.pop();
    }
  }
  
  /**
   * Get recent errors
   * @param limit Number of errors to return (default: 10)
   */
  static getRecentErrors(limit: number = 10): ErrorRecord[] {
    return this.errors.slice(0, limit);
  }
  
  /**
   * Clear all logged errors
   */
  static clearErrors(): void {
    this.errors = [];
  }
  
  /**
   * Format an error for user display
   * @param error Error object or string
   */
  static formatErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      // Extract just the main message without stack trace for user display
      return error.message;
    } else if (typeof error === 'string') {
      return error;
    } else {
      return 'Ocorreu um erro desconhecido';
    }
  }
}

export interface ErrorRecord {
  timestamp: Date;
  message: string;
  stack?: string;
  context?: string;
}