
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

  on(eventType, callback) {
    const safeCallback = (...args) => {
      try {
        return callback(...args);
      } catch (error) {
        console.error(`[SafeEventEmitter] Error in ${eventType} listener:`, error);
      }
    };
    return super.on(eventType, safeCallback);
  }
}

export default SafeEventEmitter;
