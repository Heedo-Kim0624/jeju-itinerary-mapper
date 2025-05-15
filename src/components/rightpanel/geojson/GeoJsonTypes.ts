import * as React from "react"

export interface FeatureProperties {
  id: string
  name: string
  [key: string]: any
}

export interface GeoJsonFeature {
  type: "Feature"
  geometry: {
    type: "Point" | "LineString" | "Polygon"
    coordinates: number[] | number[][] | number[][][]
  }
  properties: FeatureProperties
}

export interface GeoJsonCollection {
  type: "FeatureCollection"
  features: GeoJsonFeature[]
}

export interface NodeProperties extends FeatureProperties {
  nodeId: string
  name: string
  category: string
  address: string
  tel: string
  operationHours: string
  imageUrl: string
  description: string
  kakaoId: string
  naverId: string
}

export interface LinkProperties extends FeatureProperties {
  linkId: string
  sourceNodeId: string
  targetNodeId: string
  distance: number
  travelTime: number
}

export interface GeoJsonNodeFeature extends GeoJsonFeature {
  properties: NodeProperties
}

export interface GeoJsonLinkFeature extends GeoJsonFeature {
  properties: LinkProperties
}

export interface GeoJsonNodeCollection extends GeoJsonCollection {
  features: GeoJsonNodeFeature[]
}

export interface GeoJsonLinkCollection extends GeoJsonCollection {
  features: GeoJsonLinkFeature[]
}

export interface MapContext {
  map: any;
  mapContainer: React.RefObject<HTMLDivElement>;
  initializeMap: () => Promise<void>;
  isMapInitialized: boolean;
  setIsMapInitialized: React.Dispatch<React.SetStateAction<boolean>>;
  addMarker: (options: any) => any;
  removeMarker: (marker: any) => void;
  panTo: (coordinates: [number, number], zoom?: number) => void;
  removeAllMarkers: () => void;
  centerMapToMarkers: () => void;
  renderRouteOnMap: (coordinates: [number, number][]) => void;
  clearRoute: () => void;
  geoJsonLayer: GeoJsonLayerRef;
}

// Define the GeoJsonLayerRef interface to match the expected structure
export interface GeoJsonLayerRef {
  renderRoute: (nodeIds: string[], linkIds: string[], style?: any) => any[];
  clearDisplayedFeatures: () => void;
  getNodeById: (id: string) => any;
  getLinkById: (id: string) => any;
  renderAllFeatures?: () => void;
}
