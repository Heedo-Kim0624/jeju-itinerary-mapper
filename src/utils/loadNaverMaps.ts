
// 네이버 API Client ID

/**
 * 네이버 지도 API를 동적으로 로드하는 함수
 * @returns Promise that resolves when the Naver Maps API is loaded
 */
export const loadNaverMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 이미 로드되어 있는 경우 바로 resolve
    if (window.naver && window.naver.maps) {
      console.log("Naver Maps already loaded");
      resolve();
      return;
    }

    const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;

    if (!clientId) {
      console.error("VITE_NAVER_CLIENT_ID is not defined");
      reject(new Error("Missing NAVER client ID"));
      return;
    }

    console.log("Loading Naver Maps script...");
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder,drawing,geojson`;

    script.onload = () => {
      console.log("Naver Maps script loaded successfully");
      
      // 네이버 지도 API가 로드된 후 초기화가 완료될 때까지 대기
      if (window.naver && window.naver.maps && window.naver.maps.Map) {
        resolve();
      } else {
        // 만약 window.naver.maps.Map이 바로 사용 가능하지 않다면 추가 대기
        const checkInterval = setInterval(() => {
          if (window.naver && window.naver.maps && window.naver.maps.Map) {
            clearInterval(checkInterval);
            console.log("Naver Maps API fully initialized");
            resolve();
          }
        }, 100);

        // 최대 3초 대기 후 타임아웃
        setTimeout(() => {
          clearInterval(checkInterval);
          if (window.naver && window.naver.maps && window.naver.maps.Map) {
            console.log("Naver Maps API initialized after timeout");
            resolve();
          } else {
            console.error("Naver Maps API initialization timed out");
            reject(new Error("Naver Maps API initialization timed out"));
          }
        }, 3000);
      }
    };

    script.onerror = (error) => {
      console.error("Failed to load Naver Maps script:", error);
      reject(error);
    };

    document.head.appendChild(script);
  });
};


// naver 객체를 위한 전역 타입 선언 추가
declare global {
  interface Window {
    naver: any;
  }
}
