
import { RegionDetails } from '@/types/region';

// 제주도 지역 데이터
export const REGIONS_DATA: RegionDetails[] = [
  {
    id: 'jeju_entire',
    name: '제주도 전체',
    displayName: '제주도 전체',
    isPopular: true,
    location: { lat: 33.389, lng: 126.552 }
  },
  {
    id: 'jeju_city',
    name: '제주시',
    displayName: '제주시',
    isPopular: true,
    location: { lat: 33.4996, lng: 126.5312 }
  },
  {
    id: 'seogwipo',
    name: '서귀포시',
    displayName: '서귀포시',
    isPopular: true,
    location: { lat: 33.2534, lng: 126.5598 }
  },
  {
    id: 'jungmun',
    name: '중문',
    displayName: '중문/색달',
    parentId: 'seogwipo',
    isPopular: true,
    location: { lat: 33.2546, lng: 126.4109 }
  },
  {
    id: 'aewol',
    name: '애월',
    displayName: '애월읍',
    parentId: 'jeju_city',
    isPopular: true,
    location: { lat: 33.4614, lng: 126.3367 }
  },
  {
    id: 'hallim',
    name: '한림',
    displayName: '한림읍',
    parentId: 'jeju_city',
    isPopular: false,
    location: { lat: 33.4137, lng: 126.2661 }
  },
  {
    id: 'gujwa',
    name: '구좌',
    displayName: '구좌읍',
    parentId: 'jeju_city',
    isPopular: true,
    location: { lat: 33.5518, lng: 126.7163 }
  },
  {
    id: 'seongsan',
    name: '성산',
    displayName: '성산읍',
    parentId: 'seogwipo',
    isPopular: true,
    location: { lat: 33.3868, lng: 126.8799 }
  },
  {
    id: 'pyoseon',
    name: '표선',
    displayName: '표선면',
    parentId: 'seogwipo',
    isPopular: false,
    location: { lat: 33.3268, lng: 126.8317 }
  },
  {
    id: 'namwon',
    name: '남원',
    displayName: '남원읍',
    parentId: 'seogwipo',
    isPopular: false,
    location: { lat: 33.2778, lng: 126.7034 }
  },
  {
    id: 'andeok',
    name: '안덕',
    displayName: '안덕면',
    parentId: 'seogwipo',
    isPopular: false,
    location: { lat: 33.2522, lng: 126.3486 }
  },
  {
    id: 'hangyeong',
    name: '한경',
    displayName: '한경면',
    parentId: 'jeju_city',
    isPopular: false,
    location: { lat: 33.3489, lng: 126.1689 }
  },
  {
    id: 'jocheon',
    name: '조천',
    displayName: '조천읍',
    parentId: 'jeju_city',
    isPopular: false,
    location: { lat: 33.5339, lng: 126.6339 }
  },
  {
    id: 'daejong',
    name: '대정',
    displayName: '대정읍',
    parentId: 'seogwipo',
    isPopular: false,
    location: { lat: 33.2375, lng: 126.2507 }
  }
];

// 지역 ID로 지역 찾기
export const findRegionById = (id: string): RegionDetails | undefined => {
  return REGIONS_DATA.find(region => region.id === id);
};

// 인기 지역만 필터링
export const getPopularRegions = (): RegionDetails[] => {
  return REGIONS_DATA.filter(region => region.isPopular);
};

// 부모 지역에 속한 서브 지역 찾기
export const getSubRegions = (parentId: string): RegionDetails[] => {
  return REGIONS_DATA.filter(region => region.parentId === parentId);
};

// 한국어 지역 이름으로 지역 찾기
export const findRegionByName = (name: string): RegionDetails | undefined => {
  return REGIONS_DATA.find(region => 
    region.name === name || region.displayName === name
  );
};

// 지역 이름 목록 반환
export const getRegionNames = (): string[] => {
  return REGIONS_DATA.map(region => region.name);
};
