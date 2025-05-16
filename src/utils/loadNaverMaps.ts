
/**
 * 네이버 맵 스크립트를 비동기적으로 불러오는 함수
 */

// Script loading state flags - moved outside to module scope to prevent multiple loads
let scriptLoadingStarted = false;
let scriptLoadedSuccessfully = false;
const loadCallbacks: Array<(value: void | PromiseLike<void>) => void> = [];
const errorCallbacks: Array<(reason?: any) => void> = [];

export const loadNaverMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우
    if (scriptLoadedSuccessfully && window.naver && window.naver.maps) {
      console.log('Naver Maps API가 이미 로드되어 있습니다.');
      
      // 추가: 완전히 초기화되었는지 한번 더 확인
      if (typeof window.naver.maps.Map === 'function') {
        console.log('Naver Maps API 객체가 완전히 초기화되었습니다.');
        resolve();
        return;
      } else {
        console.log('Naver Maps API 객체가 있지만 완전히 초기화되지 않았습니다. 다시 로드합니다.');
      }
    }

    // Add callbacks for pending load
    if (scriptLoadingStarted) {
      console.log('Naver Maps API가 이미 로드 중입니다. 완료 대기 중...');
      loadCallbacks.push(resolve);
      errorCallbacks.push(reject);
      return;
    }

    // 클라이언트 ID 가져오기
    const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
    if (!clientId) {
      console.error('Naver Maps API 클라이언트 ID가 설정되지 않았습니다.');
      reject(new Error('Naver Maps API 클라이언트 ID가 설정되지 않았습니다.'));
      return;
    }

    // Set loading started flag
    scriptLoadingStarted = true;

    // 이미 존재하는 스크립트 태그를 확인하고 삭제
    const mapScriptId = "naver-maps-api-script";
    const existingScripts = document.querySelectorAll(`script[id="${mapScriptId}"], script[src*="openapi.map.naver.com"]`);
    if (existingScripts.length > 0) {
      console.log('기존 Naver Maps 스크립트 태그를 제거합니다.');
      existingScripts.forEach(script => script.remove());
    }

    // 스크립트 요소 생성
    const script = document.createElement('script');
    script.id = mapScriptId;
    script.type = 'text/javascript';
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;

    // 로드 타임아웃 설정 (10초)
    const timeoutId = setTimeout(() => {
      console.warn('Naver Maps API 로딩 시간이 초과되었습니다. 10초 경과.');
      if (!window.naver || !window.naver.maps) {
        scriptLoadingStarted = false; // Reset flag to allow retry
        reject(new Error('Naver Maps API 로딩 시간이 초과되었습니다.'));
        
        // Notify all waiting callbacks about failure
        errorCallbacks.forEach(callback => callback('Timeout exceeded'));
        loadCallbacks.length = 0;
        errorCallbacks.length = 0;
      }
    }, 10000);

    // 로딩 완료 이벤트
    script.onload = () => {
      console.log('Naver Maps API 스크립트가 로드되었습니다.');
      clearTimeout(timeoutId);
      
      // API가 실제로 사용 가능한지 확인하는 짧은 타임아웃
      const readyCheckTimeout = setTimeout(() => {
        if (window.naver && window.naver.maps && typeof window.naver.maps.Map === 'function') {
          console.log('Naver Maps API가 사용 가능합니다.');
          scriptLoadedSuccessfully = true;
          
          // Resolve all waiting promises
          resolve();
          loadCallbacks.forEach(callback => callback());
          loadCallbacks.length = 0;
          errorCallbacks.length = 0;
        } else {
          console.error('Naver Maps API가 로드되었지만 Map 객체를 사용할 수 없습니다.');
          scriptLoadingStarted = false; // Reset flag to allow retry
          
          const error = new Error('Naver Maps API가 로드되었지만 Map 객체를 사용할 수 없습니다.');
          reject(error);
          
          // Notify all waiting callbacks about failure
          errorCallbacks.forEach(callback => callback(error));
          loadCallbacks.length = 0;
          errorCallbacks.length = 0;
        }
      }, 500);
    };

    // 오류 이벤트
    script.onerror = (error) => {
      console.error('Naver Maps API 로딩 중 오류가 발생했습니다:', error);
      clearTimeout(timeoutId);
      scriptLoadingStarted = false; // Reset flag to allow retry
      
      reject(new Error('Naver Maps API 로딩 중 오류가 발생했습니다.'));
      
      // Notify all waiting callbacks about failure
      errorCallbacks.forEach(callback => callback(error));
      loadCallbacks.length = 0;
      errorCallbacks.length = 0;
    };

    // head에 스크립트 추가
    document.head.appendChild(script);
  });
};
