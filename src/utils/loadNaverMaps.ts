
// Declare global naver variable
declare global {
  interface Window {
    naver: any;
  }
}

/**
 * 네이버 맵 스크립트를 비동기적으로 불러오는 함수
 */
export const loadNaverMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우
    if (window.naver && window.naver.maps) {
      console.log('Naver Maps API가 이미 로드되어 있습니다.');
      resolve();
      return;
    }

    // 클라이언트 ID 가져오기
    const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
    if (!clientId) {
      reject(new Error('Naver Maps API 클라이언트 ID가 설정되지 않았습니다.'));
      return;
    }

    // 스크립트 요소 생성
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;

    // 로딩 완료 이벤트
    script.onload = () => {
      console.log('Naver Maps API가 성공적으로 로드되었습니다.');
      resolve();
    };

    // 오류 이벤트
    script.onerror = () => {
      reject(new Error('Naver Maps API 로딩 중 오류가 발생했습니다.'));
    };

    // head에 스크립트 추가
    document.head.appendChild(script);
  });
};
