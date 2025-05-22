/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NAVER_CLIENT_ID: string;
  readonly VITE_SERVER_URL: string;
  readonly VITE_SCHEDULE_API: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  // Define the naver.maps namespace and its constituent types.
  // Using 'any' as a placeholder; replace with more specific types if available from Naver's SDK or @types.
  namespace naver.maps {
    type Map = any;
    type LatLng = any;
    type Marker = any;
    type Polyline = any;
    type Point = any;
    type InfoWindow = any;
    type LatLngBounds = any;
    type Size = any;
    type Position = any; // Typically an object with static properties like TOP_RIGHT

    interface Event {
      addListener(target: any, eventName: string, handler: (...args: any[]) => void): any;
      once(target: any, eventName: string, handler: (...args: any[]) => void): any;
      removeListener(listener: any): void;
      // Add other static methods if used
    }
  }

  interface Window {
    naver?: {
      maps: {
        Map: new (element: string | HTMLElement, options?: any) => naver.maps.Map;
        LatLng: new (lat: number, lng: number) => naver.maps.LatLng;
        Marker: new (options?: any) => naver.maps.Marker;
        Polyline: new (options?: any) => naver.maps.Polyline;
        Point: new (x: number, y: number) => naver.maps.Point;
        InfoWindow: new (options?: any) => naver.maps.InfoWindow;
        LatLngBounds: new (sw?: naver.maps.LatLng, ne?: naver.maps.LatLng) => naver.maps.LatLngBounds;
        Size: new (width: number, height: number) => naver.maps.Size;
        Position: naver.maps.Position; // Refers to the naver.maps.Position type
        Event: naver.maps.Event; // Refers to the naver.maps.Event interface
        // Add other naver.maps classes/objects used, e.g., zoomControlOptions, drawing
        drawing: {
            DrawingManager: any; // if used
        };
        // Other specific types like ControlPosition
        PositionId: {
            TOP_LEFT: number;
            TOP_CENTER: number;
            TOP_RIGHT: number;
            LEFT_CENTER: number;
            CENTER: number;
            RIGHT_CENTER: number;
            BOTTOM_LEFT: number;
            BOTTOM_CENTER: number;
            BOTTOM_RIGHT: number;
        };
      };
    };
    initMap?: () => void;
    geoJsonLayer?: {
      renderRoute: (nodeIds: string[], linkIds: string[], style?: any) => any[];
      clearDisplayedFeatures: () => void;
      getNodeById: (id: string) => any;
      getLinkById: (id: string) => any;
      isLoaded: () => boolean;
    };
  }
}
