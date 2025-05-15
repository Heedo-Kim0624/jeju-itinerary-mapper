
import { toast } from "sonner";

// 네이버 지도 API 로드 상태를 추적하는 변수
let naverMapsSdkLoading = false;
let naverMapsSdkLoaded = false;
const loadCallbacks: ((success: boolean) => void)[] = [];

// 전역 window 객체에 naver 타입 선언 (한 곳에서만 관리)
declare global {
  interface Window {
    naver?: any; // Naver Maps SDK
    initMap?: () => void; // 콜백 함수 타입
  }
}

export const loadNaverMaps = (clientId?: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (naverMapsSdkLoaded && window.naver && window.naver.maps) {
      console.log("Naver Maps API already loaded.");
      resolve();
      return;
    }

    if (naverMapsSdkLoading) {
      console.log("Naver Maps API is currently loading. Waiting...");
      loadCallbacks.push((success) => {
        if (success) resolve();
        else reject(new Error("Naver Maps API failed to load (callback)."));
      });
      return;
    }

    naverMapsSdkLoading = true;
    console.log("Loading Naver Maps API...");

    const mapClientId = clientId || import.meta.env.VITE_NAVER_CLIENT_ID;
    if (!mapClientId) {
      console.error("Naver Maps Client ID is not configured.");
      toast.error("지도 서비스 설정 오류입니다. (Client ID 누락)");
      naverMapsSdkLoading = false;
      reject(new Error("Naver Maps Client ID is missing."));
      return;
    }

    const scriptId = "naver-maps-sdk";
    if (document.getElementById(scriptId)) {
      // 스크립트 태그는 있지만, window.naver.maps가 없을 수 있음 (로딩 실패 후 재시도 등)
      console.warn("Naver Maps script tag already exists. Checking loaded state.");
      // 로드 상태를 명확히 하기 위해, 로딩 완료/실패 콜백에 의존
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "text/javascript";
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${mapClientId}&submodules=geocoder,drawing,visualization`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.naver && window.naver.maps) {
          console.log("Naver Maps API loaded successfully via script.onload.");
          naverMapsSdkLoaded = true;
          naverMapsSdkLoading = false;
          toast.success("지도 API 로드 성공");
          resolve();
          loadCallbacks.forEach(cb => cb(true));
          loadCallbacks.length = 0;
        } else {
          // onload가 호출되었지만 window.naver.maps가 없는 경우 (매우 드문 케이스)
          console.error("Naver Maps API script loaded, but window.naver.maps is not available.");
          toast.error("지도 API 초기화 실패 (1)");
          naverMapsSdkLoading = false;
          reject(new Error("Naver Maps API loaded but not initialized."));
          loadCallbacks.forEach(cb => cb(false));
          loadCallbacks.length = 0;
        }
      };
  
      script.onerror = (error) => {
        console.error("Error loading Naver Maps API script:", error);
        toast.error("지도 API 로드 실패");
        naverMapsSdkLoading = false;
        reject(error);
        loadCallbacks.forEach(cb => cb(false));
        loadCallbacks.length = 0;
        // 실패 시 스크립트 태그 제거하여 재시도 가능하게 함
        const existingScript = document.getElementById(scriptId);
        if (existingScript) {
          existingScript.remove();
        }
      };
      
      document.head.appendChild(script);
    }

    // 추가적인 안전장치: 일정 시간 후 로드 상태 확인 (스크립트 onload가 불안정할 경우 대비)
    // 보통은 onload/onerror로 충분하지만, 네트워크 환경에 따라 필요할 수 있음
    let checkAttempts = 0;
    const maxCheckAttempts = 20; // 약 10초간 확인
    const checkInterval = setInterval(() => {
        if (window.naver && window.naver.maps) {
            if (!naverMapsSdkLoaded) { // 중복 호출 방지
                console.log("Naver Maps API initialized (checked via interval).");
                naverMapsSdkLoaded = true;
                naverMapsSdkLoading = false;
                clearInterval(checkInterval);
                resolve(); // 이미 resolve된 경우 무시됨
                loadCallbacks.forEach(cb => cb(true));
                loadCallbacks.length = 0;
            }
        }
        checkAttempts++;
        if (checkAttempts >= maxCheckAttempts && !naverMapsSdkLoaded) {
            clearInterval(checkInterval);
            if (!naverMapsSdkLoading) return; // 이미 onerror 등에서 처리된 경우
            
            console.error(`Naver Maps API did not load after ${maxCheckAttempts * 0.5} seconds.`);
            if (document.getElementById(scriptId) && !naverMapsSdkLoaded) { // 스크립트는 있는데 로드 안된 경우
                toast.error("지도 API 초기화 실패 (2)");
            }
            // reject는 script.onerror에서 주로 처리되므로, 여기서는 중복 reject 피함
            // 단, reject가 호출되지 않은 상태라면 여기서 호출
            if (naverMapsSdkLoading) { // 아직 로딩 중 상태라면 실패로 간주
                naverMapsSdkLoading = false;
                reject(new Error("Naver Maps API timed out."));
                loadCallbacks.forEach(cb => cb(false));
                loadCallbacks.length = 0;
            }
        }
    }, 500);


  });
};
