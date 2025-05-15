
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NAVER_CLIENT_ID: string;
  readonly VITE_SERVER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Naver Maps and GeoJSON global interfaces
interface Window {
  naver: any;
  initMap?: () => void;
  geoJsonLayer: {
    renderRoute: (nodeIds: string[], linkIds: string[], style?: any) => any[];
    renderAllNetwork: (style?: any) => any[]; // Ensure this method is present
    clearDisplayedFeatures: () => void;
    getNodeById: (id: string) => any;
    getLinkById: (id: string) => any;
  };
}
