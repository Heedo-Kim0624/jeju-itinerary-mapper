
export interface ServerRouteResponse {
  date?: string;
  nodeIds: number[];
  linkIds?: number[];
}

export interface ExtractedRouteData {
  nodeIds: string[];
  linkIds: string[];
}
