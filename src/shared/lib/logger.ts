/**
 * Logger utility for environment-aware logging
 * Development: All logs are output to console
 * Production: Only critical errors are output (without sensitive information)
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Development-only log
   * @param args - Arguments to log
   */
  log: (...args: unknown[]): void => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Development-only error log
   * @param args - Arguments to log
   */
  error: (...args: unknown[]): void => {
    if (isDev) {
      console.error(...args);
    }
  },

  /**
   * Development-only warning log
   * @param args - Arguments to log
   */
  warn: (...args: unknown[]): void => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Development-only info log
   * @param args - Arguments to log
   */
  info: (...args: unknown[]): void => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Critical error log that outputs in both development and production
   * Use sparingly and avoid including sensitive information
   * @param message - Generic error message without sensitive details
   */
  critical: (message: string): void => {
    console.error(message);
  }
};
