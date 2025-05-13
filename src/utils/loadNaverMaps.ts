
/**
 * 네이버 지도 API를 동적으로 로드하는 함수
 * @returns Promise that resolves when the Naver Maps API is loaded
 */
export const loadNaverMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 이미 로드되어 있고, Map 객체도 사용 가능하고 GeoJSON 서브모듈도 사용 가능한 경우 바로 resolve
    if (window.naver && window.naver.maps && window.naver.maps.Map && 
        window.naver.maps.GeoJSON && typeof window.naver.maps.GeoJSON.read === 'function') {
      console.log("Naver Maps API와 GeoJSON 서브모듈이 이미 완전히 로드되어 있습니다.");
      resolve();
      return;
    }
    
    // 스크립트는 있지만 아직 완전히 초기화되지 않은 경우
    if (window.naver) {
      console.log("Naver Maps 스크립트는 로드되었으나 초기화 대기 중...");
      const checkInterval = setInterval(() => {
        if (window.naver?.maps?.Map) {
          if (window.naver.maps.GeoJSON && typeof window.naver.maps.GeoJSON.read === 'function') {
            clearInterval(checkInterval);
            console.log("Naver Maps API와 GeoJSON 서브모듈 초기화 완료");
            resolve();
          } else {
            // GeoJSON 서브모듈만 로드되지 않음
            console.log("기본 지도는 로드됨, GeoJSON 서브모듈 대기 중...");
            // 서브모듈만 추가로 로드 시도
            loadGeoJsonSubmodule();
          }
        }
      }, 100);
      
      // 최대 20초 대기 후 타임아웃 (GeoJSON 서브모듈이 로드되는 시간 추가 고려, 대기 시간 증가)
      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.naver?.maps?.Map) {
          console.log("Naver Maps API 초기화 완료 (타임아웃 후)");
          
          // GeoJSON 서브모듈이 없는 경우, 서브모듈만 다시 로드 시도
          if (!(window.naver.maps.GeoJSON && typeof window.naver.maps.GeoJSON.read === 'function')) {
            console.warn("GeoJSON 서브모듈이 로드되지 않았습니다. 서브모듈만 추가로 로드합니다.");
            loadGeoJsonSubmodule();
          }
          
          // 그래도 기본 지도는 사용 가능하므로 resolve
          resolve();
        } else {
          console.error("Naver Maps API 초기화 타임아웃");
          reject(new Error("Naver Maps API 초기화 타임아웃"));
        }
      }, 20000);
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
    // 명시적으로 모든 서브모듈을 로드하도록 설정
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder,drawing,visualization,geojson`;

    script.onload = () => {
      console.log("Naver Maps 스크립트 로드 완료. 초기화 대기 중...");
      
      // 네이버 지도 API가 로드된 후 초기화가 완료될 때까지 대기
      const checkInterval = setInterval(() => {
        if (window.naver?.maps?.Map) {
          if (window.naver.maps.GeoJSON && typeof window.naver.maps.GeoJSON.read === 'function') {
            clearInterval(checkInterval);
            console.log("Naver Maps API와 GeoJSON 서브모듈 초기화 완료");
            resolve();
          } else {
            // GeoJSON 서브모듈만 로드되지 않음
            console.log("기본 지도는 로드됨, GeoJSON 서브모듈 대기 중...");
          }
        }
      }, 100);

      // 최대 15초 대기 후 타임아웃
      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.naver?.maps?.Map) {
          // GeoJSON 서브모듈이 없는 경우, 서브모듈만 다시 로드 시도
          if (!(window.naver.maps.GeoJSON && typeof window.naver.maps.GeoJSON.read === 'function')) {
            console.warn("GeoJSON 서브모듈이 로드되지 않았습니다. 서브모듈만 추가로 로드합니다.");
            loadGeoJsonSubmodule();
          }
          
          console.log("Naver Maps API 초기화 완료 (타임아웃 후)");
          resolve();
        } else {
          console.error("Naver Maps API 초기화 타임아웃");
          reject(new Error("Naver Maps API 초기화 타임아웃"));
        }
      }, 15000);
    };

    script.onerror = (error) => {
      console.error("Naver Maps 스크립트 로드 실패:", error);
      reject(error);
    };

    document.head.appendChild(script);
  });
};

// GeoJSON 서브모듈만 별도로 로드하는 헬퍼 함수
function loadGeoJsonSubmodule() {
  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
  if (!clientId) return;
  
  console.log("GeoJSON 서브모듈만 별도로 로드 시도...");
  const geoJsonScript = document.createElement('script');
  geoJsonScript.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geojson`;
  geoJsonScript.async = true;
  
  geoJsonScript.onload = () => {
    console.log("GeoJSON 서브모듈 스크립트 로드 완료");
  };
  
  geoJsonScript.onerror = (err) => {
    console.error("GeoJSON 서브모듈 로드 실패:", err);
  };
  
  document.head.appendChild(geoJsonScript);
}

// naver 객체를 위한 전역 타입 선언 추가
declare global {
  interface Window {
    naver: any;
  }
}
