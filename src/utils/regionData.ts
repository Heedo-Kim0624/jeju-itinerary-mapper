
export interface RegionDetails {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  isLeaf: boolean;
}

// Helper function to convert RegionDetails[] to string[] (for backwards compatibility)
export function getRegionNames(regions: RegionDetails[]): string[] {
  return regions.map(region => region.name);
}
