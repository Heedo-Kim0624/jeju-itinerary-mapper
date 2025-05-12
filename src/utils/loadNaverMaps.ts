
/**
 * 네이버 지도 API를 동적으로 로드하는 함수
 * @returns Promise that resolves when the Naver Maps API is loaded
 */
export const loadNaverMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 이미 로드되어 있고, Map 객체도 사용 가능한 경우 바로 resolve
    if (window.naver && window.naver.maps && window.naver.maps.Map) {
      console.log("Naver Maps API가 이미 완전히 로드되어 있습니다.");
      resolve();
      return;
    }
    
    // 스크립트는 있지만 아직 완전히 초기화되지 않은 경우
    if (window.naver) {
      console.log("Naver Maps 스크립트는 로드되었으나 초기화 대기 중...");
      const checkInterval = setInterval(() => {
        if (window.naver?.maps?.Map) {
          clearInterval(checkInterval);
          console.log("Naver Maps API 초기화 완료");
          resolve();
        }
      }, 100);
      
      // 최대 5초 대기 후 타임아웃
      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.naver?.maps?.Map) {
          console.log("Naver Maps API 초기화 완료 (타임아웃 후)");
          resolve();
        } else {
          console.error("Naver Maps API 초기화 타임아웃");
          reject(new Error("Naver Maps API 초기화 타임아웃"));
        }
      }, 5000);
      return;
    }

    const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;

    if (!clientId) {
      console.error("VITE_NAVER_CLIENT_ID가 정의되지 않았습니다");
      reject(new Error("네이버 클라이언트 ID가 없습니다"));
      return;
    }

    console.log("Naver Maps 스크립트 로드 중...");
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder,drawing,geojson`;

    script.onload = () => {
      console.log("Naver Maps 스크립트 로드 완료. 초기화 대기 중...");
      
      // 네이버 지도 API가 로드된 후 초기화가 완료될 때까지 대기
      if (window.naver?.maps?.Map) {
        console.log("Naver Maps API 즉시 초기화됨");
        resolve();
      } else {
        // Map이 바로 사용 가능하지 않다면 추가 대기
        const checkInterval = setInterval(() => {
          if (window.naver?.maps?.Map) {
            clearInterval(checkInterval);
            console.log("Naver Maps API 초기화 완료");
            resolve();
          }
        }, 100);

        // 최대 5초 대기 후 타임아웃
        setTimeout(() => {
          clearInterval(checkInterval);
          if (window.naver?.maps?.Map) {
            console.log("Naver Maps API 초기화 완료 (타임아웃 후)");
            resolve();
          } else {
            console.error("Naver Maps API 초기화 타임아웃");
            reject(new Error("Naver Maps API 초기화 타임아웃"));
          }
        }, 5000);
      }
    };

    script.onerror = (error) => {
      console.error("Naver Maps 스크립트 로드 실패:", error);
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
