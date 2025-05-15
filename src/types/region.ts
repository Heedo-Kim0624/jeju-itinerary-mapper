
// 지역 정보 관련 타입 정의
export interface RegionDetails {
  id: string;
  name: string;
  displayName?: string;
  parentId?: string;
  isPopular?: boolean;
  location?: {
    lat: number;
    lng: number;
  };
}
