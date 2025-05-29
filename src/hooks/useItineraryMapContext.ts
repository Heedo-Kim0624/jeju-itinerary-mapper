import { useContext } from 'react';
import { ItineraryMapContext } from '@/contexts/ItineraryMapContext';

// 컨텍스트 사용 훅
export const useItineraryMapContext = () => useContext(ItineraryMapContext);
