
import { Place } from '@/types/supabase';

export interface LeftPanelProps {
  onToggleRegionPanel?: () => void;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
}

export interface KeywordMapping {
  [key: string]: string;
}

export type CategoryType = '숙소' | '관광지' | '음식점' | '카페';
