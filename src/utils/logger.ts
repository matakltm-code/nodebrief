/**
 * Centralized application logger utility.
 * Suppresses noisy console logs in production environments while maintaining error traceability.
 */
class AppLogger {
  private isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'
    ? true
    : (typeof import.meta !== 'undefined' && import.meta.env ? Boolean(import.meta.env.DEV) : true);

  error(message: string, ...optionalParams: unknown[]): void {
    if (this.isDevelopment) {
      console.error(`[NodeBrief Error]: ${message}`, ...optionalParams);
    }
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    if (this.isDevelopment) {
      console.warn(`[NodeBrief Warning]: ${message}`, ...optionalParams);
    }
  }

  info(message: string, ...optionalParams: unknown[]): void {
    if (this.isDevelopment) {
      console.info(`[NodeBrief Info]: ${message}`, ...optionalParams);
    }
  }
}

export const logger = new AppLogger();
