/**
 * Logger utility for standardized error and event logging
 * This provides a consistent way to log errors and events across the application
 * In production, this would be connected to a proper logging service
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  action: string;
  message?: string;
  errorType?: string;
  data?: Record<string, any>;
}

// In production, this would be configured based on environment
const LOG_LEVEL: Record<string, number> = {
  'debug': 0,
  'info': 1,
  'warn': 2,
  'error': 3
};

// Current log level - would be set from environment config in production
const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? 'error' : 'debug';

/**
 * Log an event or error with standardized format
 */
export function log(
  level: LogLevel,
  component: string,
  action: string,
  message?: string,
  error?: Error | unknown,
  additionalData?: Record<string, any>
): void {
  // Check if we should log this level
  if (LOG_LEVEL[level] < LOG_LEVEL[CURRENT_LOG_LEVEL]) {
    return;
  }

  // Create log entry with standard fields
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    component,
    action
  };

  // Add optional fields if provided
  if (message) {
    logEntry.message = message;
  }

  if (error) {
    logEntry.errorType = error instanceof Error 
      ? error.constructor.name 
      : typeof error;
    
    // In development, include error details for debugging
    if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
      logEntry.data = {
        ...additionalData,
        errorMessage: error.message,
        stack: error.stack
      };
    }
  }
  
  if (additionalData && !logEntry.data) {
    logEntry.data = additionalData;
  }

  // In production, this would send logs to a service like Sentry, LogRocket, etc.
  // For now, use console with appropriate log level
  switch (level) {
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;
    case 'info':
      console.info(JSON.stringify(logEntry));
      break;
    case 'debug':
      console.debug(JSON.stringify(logEntry));
      break;
  }
}

// Convenience methods for common log levels
export const logger = {
  error: (component: string, action: string, message?: string, error?: Error | unknown, data?: Record<string, any>) => 
    log('error', component, action, message, error, data),
    
  warn: (component: string, action: string, message?: string, error?: Error | unknown, data?: Record<string, any>) => 
    log('warn', component, action, message, error, data),
    
  info: (component: string, action: string, message?: string, data?: Record<string, any>) => 
    log('info', component, action, message, undefined, data),
    
  debug: (component: string, action: string, message?: string, data?: Record<string, any>) => 
    log('debug', component, action, message, undefined, data)
}; 