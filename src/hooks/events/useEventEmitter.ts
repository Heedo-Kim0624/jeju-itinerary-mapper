type Listener<T> = (data: T) => void;
type Unsubscribe = () => void;

export interface EventEmitterInstance {
  subscribe<T>(event: string, listener: Listener<T>): Unsubscribe;
  emit<T>(event: string, data: T): void;
  unsubscribeAll(event: string): void;
}

const PICO_EVENT_EMITTER_KEY = Symbol.for("PICO_EVENT_EMITTER_KEY_V2");

const getGlobalEmitter = (): EventEmitterInstance => {
  const global = globalThis as any;
  if (!global[PICO_EVENT_EMITTER_KEY]) {
    const listeners: Record<string, Set<Listener<any>>> = {};
    global[PICO_EVENT_EMITTER_KEY] = {
      subscribe: <T>(event: string, listener: Listener<T>): Unsubscribe => {
        if (!listeners[event]) {
          listeners[event] = new Set();
        }
        listeners[event].add(listener);
        return () => {
          listeners[event]?.delete(listener);
          if (listeners[event]?.size === 0) {
            delete listeners[event];
          }
        };
      },
      emit: <T>(event: string, data: T): void => {
        // console.log(`[EventEmitter] Emitting event: ${event}`, data);
        listeners[event]?.forEach(listener => {
          try {
            listener(data);
          } catch (error) {
            console.error(`[EventEmitter] Error in listener for event ${event}:`, error);
          }
        });
      },
      unsubscribeAll: (event: string): void => {
        if (listeners[event]) {
          delete listeners[event];
          // console.log(`[EventEmitter] Unsubscribed all listeners for event: ${event}`);
        }
      },
    };
  }
  return global[PICO_EVENT_EMITTER_KEY];
};

export const useEventEmitter = (): EventEmitterInstance => {
  return getGlobalEmitter();
};

export const GlobalEventEmitter = getGlobalEmitter();
