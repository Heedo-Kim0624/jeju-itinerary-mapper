
import { 
  NewServerScheduleResponse, 
  ServerScheduleItem, 
  ServerRouteSummaryItem,
  PlannerServerRouteResponse,
  isNewServerScheduleResponse,
  isPlannerServerRouteResponseArray
} from '@/types/schedule';

const exampleServerScheduleItem: ServerScheduleItem = {
  time_block: 'Mon_10',
  place_type: 'restaurant',
  place_name: '맛집1',
  id: '123',
  node_id: 101,
  address: '제주시 무슨동',
  x: 127.0,
  y: 33.0,
};

const exampleServerRouteSummaryItem: ServerRouteSummaryItem = {
  day: 'Mon',
  status: 'OK',
  total_distance_m: 5000,
  interleaved_route: [101, 'link1', 102],
};

const exampleNewServerResponse: NewServerScheduleResponse = {
  schedule: [exampleServerScheduleItem],
  route_summary: [exampleServerRouteSummaryItem],
  total_reward: 100,
  start_datetime: "2025-05-20T09:00:00"
};

console.log('Is exampleNewServerResponse valid?', isNewServerScheduleResponse(exampleNewServerResponse));

const examplePlannerResponseItem: PlannerServerRouteResponse = {
  date: '2025-05-21',
  nodeIds: [1, 2, 3]
};
const examplePlannerResponseArray: PlannerServerRouteResponse[] = [examplePlannerResponseItem];

console.log('Is examplePlannerResponseArray valid?', isPlannerServerRouteResponseArray(examplePlannerResponseArray));
console.log('Is empty array valid for PlannerServerRouteResponse[]?', isPlannerServerRouteResponseArray([]));

export const typeTestLog = () => {
  console.log("Type tests run with example data:", {
    exampleNewServerResponse,
    examplePlannerResponseArray
  });
};
