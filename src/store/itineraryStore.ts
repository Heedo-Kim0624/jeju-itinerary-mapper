
import { atom } from 'jotai';
import type { ItineraryDay, NewServerScheduleResponse, ServerRouteResponse } from '@/types/schedule';

// TripDetailsState는 @/types/index.ts 에서 가져옵니다.
import type { TripDetailsState } from '@/types/index';


export const tripDetailsAtom = atom<TripDetailsState | null>(null);
export const itineraryAtom = atom<ItineraryDay[]>([]);
export const selectedDayAtom = atom<number | null>(null);
export const isLoadingAtom = atom<boolean>(false); // 일정 생성 또는 데이터 로딩 상태
export const rawServerResponseAtom = atom<NewServerScheduleResponse | null>(null); // 서버 원본 응답 저장
export const serverRoutesAtom = atom<Record<number, ServerRouteResponse>>({}); // 일자별 서버 경로 데이터

// UI 상태 관련
export const showItineraryPanelAtom = atom<boolean>(false);
export const currentLeftPanelAtom = atom<string>('category'); // 'category', 'region', 'itinerary'
