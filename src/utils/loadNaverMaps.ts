
// 네이버 API Client ID
const NAVER_CLIENT_ID = "w2r5am4bmr";

/**
 * 네이버 지도 API를 동적으로 로드하는 함수
 * @returns Promise that resolves when the Naver Maps API is loaded
 */
export const loadNaverMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.naver && window.naver.maps) {
      console.log("Naver Maps already loaded");
      resolve();
      return;
    }

    const clientId = import.meta.env.VITE_NAVER_CLIENT_ID || "w2r5am4bmr";
    if (!clientId) {
      console.error("VITE_NAVER_CLIENT_ID is not defined");
      reject("Missing NAVER client ID");
      return;
    }

    console.log("Loading Naver Maps script...");
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${NAVER_CLIENT_ID}&submodules=geocoder,drawing`;
    
    script.onload = () => {
      console.log("Naver Maps script loaded successfully");
      resolve();
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
