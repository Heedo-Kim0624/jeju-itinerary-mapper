
export * from '@/types/travel';
export * from './dbMapping';
export * from './promptParser';
export * from './weightCalculator';
// Remove placeNormalizer import

// Avoid re-exporting placeScoring directly to prevent ambiguity
// Instead, import specific functions
export * from './interfaces';

// Explicitly re-export PlaceResult to resolve ambiguity
export type { PlaceResult } from '@/types/travel';

// Re-export functions needed by components but not already exported from other files
export { calculatePlaceScore } from './placeScoring';
export { convertToPlaceResult } from './placeScoring';

// Add a normalizeField function directly here to avoid dependency on placeNormalizer
export function normalizeField(object: any, possibleFields: string[]): any {
  if (!object) return null;

  for (const field of possibleFields) {
    if (object[field] !== undefined) {
      return object[field];
    }
  }

  return null;
}
