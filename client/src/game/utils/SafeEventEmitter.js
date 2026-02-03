
import { EventEmitter } from './EventEmitter.js';

/**
 * Safe EventEmitter that catches and logs errors in event handlers
 */
export class SafeEventEmitter extends EventEmitter {
  emit(eventType, ...args) {
    try {
      return super.emit(eventType, ...args);
    } catch (error) {
      console.error(`[SafeEventEmitter] Error in ${eventType} handler:`, error);
      // Don't re-throw to prevent cascading failures
      return false;
    }
  }


  // No need to override on() anymore as EventEmitter.emit() already handles try-catch.
  // Overriding on() with a wrapper breaks off() because the wrapper != the original callback.
}

export default SafeEventEmitter;
