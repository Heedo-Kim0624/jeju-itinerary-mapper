
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { type GeoJsonLayerRef } from "@/components/rightpanel/GeoJsonLayer";

export interface NodeFeature extends Feature {
  properties: {
    NODE_ID: string;
    NODE_TYPE: string;
    ROAD_RANK: string;
    NODE_NAME: string;
    x: number;
    y: number;
    [key: string]: any;
  };
}

export interface LinkFeature extends Feature {
  properties: {
    LINK_ID: string;
    F_NODE: string;
    T_NODE: string;
    ROAD_RANK: string;
    ROAD_TYPE: string;
    ROAD_NAME: string;
    MAX_SPD: number;
    REST_VEH: string;
    REST_W: number;
    REST_H: number;
    ROAD_CAPT: string;
    LANES: number;
    LINK_LEN: number;
    [key: string]: any;
  };
}

export interface NodeCollection extends FeatureCollection {
  features: NodeFeature[];
}

export interface LinkCollection extends FeatureCollection {
  features: LinkFeature[];
}

export interface GeoJsonData {
  nodes: NodeCollection | null;
  links: LinkCollection | null;
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
}

export interface GeoJsonState extends GeoJsonData {
  nodesById: Map<string, NodeFeature>;
  linksById: Map<string, LinkFeature>;
  linksByNodeId: Map<string, LinkFeature[]>;
  selectedNodeId: string | null;
  selectedLinkId: string | null;
  displayedNodeIds: Set<string>;
  displayedLinkIds: Set<string>;
  highlightedNodeIds: Set<string>;
  highlightedLinkIds: Set<string>;
}

export interface GeoJsonActions {
  setNodes: (nodes: NodeCollection | null) => void;
  setLinks: (links: LinkCollection | null) => void;
  setIsLoaded: (isLoaded: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  selectNode: (nodeId: string | null) => void;
  selectLink: (linkId: string | null) => void;
  addDisplayedNodeIds: (nodeIds: string[]) => void;
  addDisplayedLinkIds: (linkIds: string[]) => void;
  removeDisplayedNodeIds: (nodeIds: string[]) => void;
  removeDisplayedLinkIds: (linkIds: string[]) => void;
  clearDisplayedIds: () => void;
  addHighlightedNodeIds: (nodeIds: string[]) => void;
  addHighlightedLinkIds: (linkIds: string[]) => void;
  removeHighlightedNodeIds: (nodeIds: string[]) => void;
  removeHighlightedLinkIds: (linkIds: string[]) => void;
  clearHighlightedIds: () => void;
}

export interface GeoJsonContextType {
  state: GeoJsonState;
  actions: GeoJsonActions;
}

export interface RenderStyle {
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  radius?: number;
  opacity?: number;
  zIndex?: number;
}

export interface GeoJsonInterface {
  renderRoute: (nodeIds: string[], linkIds: string[], style?: RenderStyle) => any[];
  renderAllNetwork: (options?: {nodeStyle?: RenderStyle, linkStyle?: RenderStyle}) => any[];
  clearDisplayedFeatures: () => void;
  getNodeById: (id: string) => NodeFeature | undefined;
  getLinkById: (id: string) => LinkFeature | undefined;
}

declare global {
  interface Window {
    geoJsonLayer: GeoJsonLayerRef;
  }
}
