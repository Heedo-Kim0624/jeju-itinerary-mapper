
import { useEffect, useRef } from 'react';

// 이벤트 리스너 등록 및 제거를 관리하는 훅
export const useEventListener = <T extends Event>(
  eventName: string,
  handler: (event: T) => void,
  element: EventTarget = window,
  options?: boolean | AddEventListenerOptions
) => {
  // 핸들러를 ref로 저장하여 리렌더링 시 안정성 보장
  const savedHandler = useRef<(event: T) => void>();
  
  // 핸들러 업데이트 시 ref 업데이트
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);
  
  useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;
    
    // 이벤트 핸들러 래퍼
    const eventListener = (event: Event) => {
      if (savedHandler.current) {
        savedHandler.current(event as T);
      }
    };
    
    // 이벤트 리스너 등록
    element.addEventListener(eventName, eventListener, options);
    console.log(`[EventListener] Registered for: ${eventName} on element`, element);
    
    // 클린업 함수
    return () => {
      element.removeEventListener(eventName, eventListener, options);
      console.log(`[EventListener] Removed for: ${eventName} on element`, element);
    };
  }, [eventName, element, options]);
};

// 커스텀 이벤트 리스너 훅
export const useCustomEventListener = <T extends CustomEvent>(
  eventName: string,
  handler: (event: T) => void,
  options?: boolean | AddEventListenerOptions
) => {
  useEventListener<T>(eventName, handler, window, options);
};
