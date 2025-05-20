
/**
 * Types for schedule API request payload
 */

import { SchedulePlace } from './base-types';

// Schedule creation API request payload
export interface SchedulePayload {
  selected_places: SchedulePlace[];
  candidate_places: SchedulePlace[];
  start_datetime: string; // ISO8601 timestamp
  end_datetime: string;   // ISO8601 timestamp
}
