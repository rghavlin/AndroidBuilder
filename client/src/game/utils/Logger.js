/**
 * Logger - Centralized logging utility with environment-based gating.
 * 
 * Supports different log levels:
 * - DEBUG: Transient diagnostic info (Development only)
 * - INFO: General application milestones (Development only)
 * - WARN: Unexpected but non-fatal issues (All environments)
 * - ERROR: Fatal or critical failures (All environments)
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Determine environment
const isDev = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.DEV : (process.env.NODE_ENV === 'development');

class Logger {
  constructor(moduleName = 'App') {
    this.moduleName = moduleName;
  }

  /**
   * Create a scoped logger for a specific module
   * @param {string} name - Module name (e.g., 'PlayerContext')
   * @returns {Logger}
   */
  static scope(name) {
    return new Logger(name);
  }

  _formatMessage(msg) {
    return `[${this.moduleName}] ${msg}`;
  }

  debug(msg, ...args) {
    if (isDev) {
      console.debug(this._formatMessage(msg), ...args);
    }
  }

  info(msg, ...args) {
    if (isDev) {
      console.log(this._formatMessage(msg), ...args);
    }
  }

  warn(msg, ...args) {
    console.warn(this._formatMessage(msg), ...args);
  }

  error(msg, ...args) {
    console.error(this._formatMessage(msg), ...args);
  }
}

// Export a default instance and the class for scoping
export const logger = new Logger();
export default Logger;
