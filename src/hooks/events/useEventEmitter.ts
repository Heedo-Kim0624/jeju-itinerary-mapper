
type EventHandler = (data?: any) => void;

interface EventListeners {
  [eventName: string]: EventHandler[];
}

const listeners: EventListeners = {};

export const useEventEmitter = () => {
  const subscribe = (eventName: string, handler: EventHandler): (() => void) => {
    if (!listeners[eventName]) {
      listeners[eventName] = [];
    }
    listeners[eventName].push(handler);

    // Return an unsubscribe function
    return () => {
      listeners[eventName] = listeners[eventName].filter(h => h !== handler);
    };
  };

  const emit = (eventName: string, data?: any) => {
    if (listeners[eventName]) {
      listeners[eventName].forEach(handler => handler(data));
    }
  };

  return { subscribe, emit };
};

// Static access for components that might not be functional components or for global emits
// Be cautious with static usage, prefer the hook where possible.
export const EventEmitter = {
  subscribe: (eventName: string, handler: EventHandler): (() => void) => {
    if (!listeners[eventName]) {
      listeners[eventName] = [];
    }
    listeners[eventName].push(handler);
    return () => {
      listeners[eventName] = listeners[eventName].filter(h => h !== handler);
    };
  },
  emit: (eventName: string, data?: any) => {
    if (listeners[eventName]) {
      listeners[eventName].forEach(handler => handler(data));
    }
  }
};
