
export interface SchedulePlace {
  id: number;
  name: string;
}

export interface SchedulePayload {
  selected_places: SchedulePlace[];
  candidate_places: SchedulePlace[];
  start_datetime: string;
  end_datetime: string;
}

export interface ScheduleItem {
  time_block: string;
  place_type: string;
  place_name: string;
}

export interface DaySchedule {
  day: number;
  items: ScheduleItem[];
}
