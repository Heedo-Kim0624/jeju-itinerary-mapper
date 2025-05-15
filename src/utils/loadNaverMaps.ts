
// 네이버 맵 SDK를 동적으로 로드하는 유틸리티
import { toast } from 'sonner';

declare global {
  interface Window {
    naver?: any;
  }
}

let isLoaded = false;
let isLoading = false;
let loadPromise: Promise<boolean> | null = null;

export const loadNaverMaps = (): Promise<boolean> => {
  // 이미 로드되었으면 바로 성공 반환
  if (isLoaded && window.naver) {
    return Promise.resolve(true);
  }
  
  // 이미 로딩 중이면 기존 Promise 반환
  if (isLoading && loadPromise) {
    return loadPromise;
  }
  
  isLoading = true;
  
  // 새 Promise 생성
  loadPromise = new Promise((resolve, reject) => {
    try {
      // NAVER 지도 API 클라이언트 ID
      const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
      
      if (!clientId) {
        console.error('VITE_NAVER_CLIENT_ID 환경 변수가 설정되지 않았습니다.');
        toast.error('네이버 지도 API 키가 설정되지 않았습니다.');
        isLoading = false;
        reject(new Error('NAVER API 클라이언트 ID가 설정되지 않았습니다.'));
        return;
      }
      
      // 네이버 지도 스크립트 엘리먼트 생성
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&callback=initNaverMap`;
      script.async = true;
      
      // 콜백 함수 정의
      window.initNaverMap = () => {
        isLoaded = true;
        isLoading = false;
        console.log('네이버 지도 API 로드 완료');
        resolve(true);
      };
      
      // 로드 오류 처리
      script.onerror = () => {
        isLoading = false;
        console.error('네이버 지도 API 로드 실패');
        toast.error('네이버 지도를 불러오는 데 실패했습니다.');
        reject(new Error('네이버 지도 API 로드 실패'));
      };
      
      // 스크립트 추가
      document.head.appendChild(script);
    } catch (error) {
      isLoading = false;
      console.error('네이버 지도 API 로드 중 오류 발생:', error);
      reject(error);
    }
  });
  
  return loadPromise;
};

// TypeScript 문법 오류 수정
export const getNaverMaps = (): any => {
  return isLoaded && window.naver ? window.naver.maps : null;
};

// 네이버 지도 로드 상태 확인
export const isNaverMapsLoaded = (): boolean => {
  return isLoaded && !!window.naver;
};

// 글로벌 네임스페이스 확장
declare global {
  interface Window {
    initNaverMap: () => void;
  }
}
