
import { useCallback } from 'react';

type EventCallback = (data?: any) => void;

class EventEmitter {
  private events: Record<string, EventCallback[]> = {};

  on(event: string, callback: EventCallback): () => void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    // Return an unsubscribe function
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
    if (this.events[event].length === 0) {
      delete this.events[event];
    }
  }

  emit(event: string, data?: any): void {
    if (!this.events[event]) {
      // console.warn(`[EventEmitter] No listeners for event: ${event}`);
      return;
    }
    // console.log(`[EventEmitter] Emitting event: ${event}`, data);
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[EventEmitter] Error in listener for event ${event}:`, error);
      }
    });
  }

  clear(event?: string): void {
    if (event) {
      delete this.events[event];
      // console.log(`[EventEmitter] Cleared listeners for event: ${event}`);
    } else {
      this.events = {};
      // console.log('[EventEmitter] All event listeners cleared.');
    }
  }
}

export const eventEmitter = new EventEmitter();

// React hook for convenience
export const useEventEmitter = () => {
  const emit = useCallback((event: string, data?: any) => {
    eventEmitter.emit(event, data);
  }, []);

  const subscribe = useCallback((event: string, callback: EventCallback) => {
    return eventEmitter.on(event, callback);
  }, []);

  return { emit, subscribe };
};

// Static methods for non-hook usage if needed, though hook is preferred in components
useEventEmitter.emit = (event: string, data?: any) => eventEmitter.emit(event, data);
useEventEmitter.subscribe = (event: string, callback: EventCallback) => eventEmitter.on(event, callback);
