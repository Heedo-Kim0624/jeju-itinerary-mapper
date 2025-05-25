
// Event debugging utility to track all custom events
export const setupEventDebugger = () => {
  if (typeof window === 'undefined') return;
  
  console.log('[EventDebugger] Setting up event monitoring...');
  
  // Store original methods
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;
  const originalDispatchEvent = window.dispatchEvent;
  
  // Only monitor specific events we care about
  const eventsToMonitor = [
    'startScheduleGeneration',
    'itineraryDaySelected',
    'clearAllMapElements',
    'forceRerender',
    'itineraryCreated'
  ];
  
  // Monkey-patch addEventListener
  window.addEventListener = function(type, listener, options) {
    if (eventsToMonitor.includes(type)) {
      console.log(`[EventDebugger] Registered listener for: ${type}`);
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
  
  // Monkey-patch removeEventListener
  window.removeEventListener = function(type, listener, options) {
    if (eventsToMonitor.includes(type)) {
      console.log(`[EventDebugger] Removed listener for: ${type}`);
    }
    return originalRemoveEventListener.call(this, type, listener, options);
  };
  
  // Monkey-patch dispatchEvent
  window.dispatchEvent = function(event) {
    if (eventsToMonitor.includes(event.type)) {
      console.log(`[EventDebugger] Event dispatched: ${event.type}`, 
        event instanceof CustomEvent ? event.detail : '');
    }
    return originalDispatchEvent.call(this, event);
  };
  
  console.log(`[EventDebugger] Now monitoring events: ${eventsToMonitor.join(', ')}`);
};

export const initEventDebugger = () => {
  if (import.meta.env.DEV) {
    setupEventDebugger();
    console.log('[CHANGE_APPLIED_20250525] Event debugger has been initialized!');
  }
};
