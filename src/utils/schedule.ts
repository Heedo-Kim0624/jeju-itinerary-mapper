
import { Place } from '@/types/supabase';
import { PlaceWithUsedFlag } from './schedule-types';

// Use 'export type' for type re-exports when isolatedModules is enabled
export type { PlaceWithUsedFlag } from './schedule-types';
export { findNearestPlace, categorizeAndFlagPlaces, createEmptyScheduleTable } from './schedule-operations';
