
/// <reference types="vite/client" />

// Add global type declaration for geoJsonLayer
declare global {
  interface Window {
    geoJsonLayer?: {
      renderRoute: (nodeIds: string[], linkIds: string[], style?: any) => any[];
      clearDisplayedFeatures: () => void;
      getNodeById: (id: string) => any;
      getLinkById: (id: string) => any;
    };
  }
}

export {};
