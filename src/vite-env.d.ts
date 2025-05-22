/// <reference types="vite/client" />

// GeoJsonTypes에서 RouteStyle을 가져오기 위해 import 추가
// 경로 수정: vite-env.d.ts는 src 폴더에 있으므로, components 폴더는 같은 레벨에서 접근
import type { RouteStyle as GeoJsonInternalRouteStyle } from './components/rightpanel/geojson/GeoJsonTypes';

interface ImportMetaEnv {
  readonly VITE_NAVER_CLIENT_ID: string;
  readonly VITE_SERVER_URL: string;
  readonly VITE_SCHEDULE_API: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  namespace naver.maps {
    // 사용자 가이드 기반 상세 타입 정의 시작
    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
      // 추가적으로 필요한 메서드들이 있다면 여기에 정의할 수 있습니다.
      // 예: equals(other: LatLng): boolean;
      // 예: clone(): LatLng;
      // 예: toString(): string;
    }

    class Point {
      constructor(x: number, y: number);
      x: number;
      y: number;
      // 예: equals(other: Point): boolean;
      // 예: clone(): Point;
    }

    class Size {
      constructor(width: number, height: number);
      width: number;
      height: number;
      // 예: equals(other: Size): boolean;
      // 예: clone(): Size;
    }

    interface MapOptions {
      center?: LatLng;
      zoom?: number;
      minZoom?: number;
      maxZoom?: number;
      zoomControl?: boolean;
      zoomControlOptions?: {
        position?: Position; // naver.maps.Position으로 변경
        style?: ZoomControlStyle; // Enum 타입으로 변경
        // KVO properties
        // position?: PositionId; // Naver Docs V3 에서는 Position enum 사용
        // legendDisabled?: boolean;
      };
      mapDataControl?: boolean; // Naver Docs V3 에서는 mapTypeControl
      mapTypeControl?: boolean;
      mapTypeControlOptions?: {
        // style?: MapTypeControlStyle; // Naver Docs V3 에서는 style로 MapTypeId 지정
        position?: Position; // naver.maps.Position으로 변경
        mapTypeIds?: MapTypeId[];
      };
      scaleControl?: boolean;
      scaleControlOptions?: {
        position?: Position; // naver.maps.Position으로 변경
      };
      logoControl?: boolean;
      logoControlOptions?: {
        position?: Position; // naver.maps.Position으로 변경
      };
      // ... 기타 옵션들
      // bounds?: LatLngBounds;
      // draggable?: boolean;
      // scrollWheel?: boolean;
      // keyboardShortcuts?: boolean;
      // disableDoubleTapZoom?: boolean;
      // disableDoubleClickZoom?: boolean;
      // disableTwoFingerTapZoom?: boolean;
      // tileTransition?: boolean;
      // pinchZoom?: boolean;
      // baseTileOpacity?: number;
      // blankTileImage?: string;
      // त्राnsitionOptions?: TransitionOptions;
    }
    
    // naver.maps.Position enum (실제 값은 Naver 문서나 SDK에서 확인 필요)
    enum Position {
      TOP_LEFT,
      TOP_CENTER,
      TOP_RIGHT,
      LEFT_TOP, // Official docs might use different naming or values
      LEFT_CENTER,
      LEFT_BOTTOM,
      RIGHT_TOP,
      RIGHT_CENTER,
      RIGHT_BOTTOM,
      BOTTOM_LEFT,
      BOTTOM_CENTER,
      BOTTOM_RIGHT,
      CENTER // Not always present for controls
    }

    enum ZoomControlStyle {
      LARGE,
      SMALL
    }
    
    enum MapTypeId {
      NORMAL,
      TERRAIN,
      SATELLITE,
      HYBRID
      // 사용자 정의 타입도 가능
    }


    class Map {
      constructor(mapDiv: string | HTMLElement, mapOptions?: MapOptions);
      setCenter(latlng: LatLng): void;
      getCenter(): LatLng;
      setZoom(zoom: number, useEffect?: boolean): void;
      getZoom(): number;
      fitBounds(bounds: LatLngBounds | LatLng[] | LatLng[][], margin?: number | {top?: number, right?: number, bottom?: number, left?: number}): void;
      panTo(latlng: LatLng, transitionOptions?: any): void; // TransitionOptions can be more specific
      panToBounds(bounds: LatLngBounds, transitionOptions?: any, margin?: number): void;
      destroy(): void;
      getElement(): HTMLElement;
      // ... 기타 Map 메서드들 (예: addListener, setOptions, etc.)
      addListener(eventName: string, listener: (...args: any[]) => void): MapEventListener;
      setOptions(newOptions: Partial<MapOptions> | string, value?: any): void;
      getBounds(): LatLngBounds;
      getMapTypeId(): MapTypeId;
      setMapTypeId(mapTypeId: MapTypeId): void;
    }
    
    interface MapEventListener {
        eventName: string;
        target: any;
        listener: (...args: any[]) => void;
        remove(): void; // 리스너 제거 함수
    }


    interface MarkerOptions {
      position: LatLng;
      map?: Map | null;
      icon?: string | ImageIcon | SymbolIcon | HtmlIcon;
      shape?: MarkerShape;
      title?: string;
      cursor?: string;
      clickable?: boolean;
      draggable?: boolean;
      visible?: boolean;
      zIndex?: number;
      animation?: Animation; // naver.maps.Animation
    }
    
    enum Animation {
        BOUNCE,
        DROP
    }

    interface ImageIcon {
      url: string;
      size?: Size;
      scaledSize?: Size; // scaledSize for HiDPI
      origin?: Point;
      anchor?: Point | Position;
      // Other properties like 'optimized', 'shadow', etc.
    }

    interface SymbolIcon {
      path: SymbolPath | string; // SymbolPath or predefined symbol string
      style?: SymbolStyle; // default, circle, path
      radius?: number;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeWeight?: number;
      strokeOpacity?: number;
      // Other properties like 'rotation', 'scale', etc.
      anchor?: Point | Position;
    }
    
    type SymbolPath = number[][]; // Array of coordinates for custom path

    enum SymbolStyle {
        CIRCLE,
        PATH,
        CLOSED_PATH
    }

    interface HtmlIcon {
      content: string | HTMLElement;
      size?: Size; // Naver docs mention size is determined by content, but API might accept it
      anchor?: Point | Position;
    }
    
    interface MarkerShape { // For click detection area
        coords: number[];
        type: string; // "rect", "circle", "poly"
    }


    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
      getMap(): Map | null;
      setPosition(position: LatLng): void;
      getPosition(): LatLng;
      setIcon(icon: string | ImageIcon | SymbolIcon | HtmlIcon): void;
      getIcon(): string | ImageIcon | SymbolIcon;
      setZIndex(zIndex: number): void;
      getZIndex(): number;
      setVisible(visible: boolean): void;
      getVisible(): boolean;
      setTitle(title: string): void;
      getTitle(): string;
      // ... 기타 Marker 메서드들 (예: setAnimation, setClickable, addListener)
      addListener(eventName: string, listener: (...args: any[]) => void): MapEventListener;
      setAnimation(animation: Animation | null): void;
    }

    interface PolylineOptions {
      map?: Map | null;
      path: LatLng[] | LatLng[][]; // Array of LatLng or Array of Array of LatLng for multi-part lines
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      strokeStyle?: StrokeStyle; // Naver specific styles
      strokeLineCap?: "butt" | "round" | "square";
      strokeLineJoin?: "round" | "miter" | "bevel";
      clickable?: boolean;
      visible?: boolean;
      zIndex?: number;
      // startIcon?: PointingIcon;
      // endIcon?: PointingIcon;
      // ...
    }
    
    type StrokeStyle = "solid" | "shortdash" | "shortdot" | "shortdashdot" | "shortdashdotdot" | "dot" | "dash" | "longdash" | "dashdot" | "longdashdot" | "longdashdotdot";


    class Polyline {
      constructor(options: PolylineOptions);
      setMap(map: Map | null): void;
      getMap(): Map | null;
      setPath(path: LatLng[] | LatLng[][]): void;
      getPath(): LatLng[]; // Or LatLng[][]
      setOptions(options: Partial<PolylineOptions>): void;
      getOptions(key?: keyof PolylineOptions): any; // Can be more specific
      // ...
      getDistance(): number;
      getBounds(): LatLngBounds;
      setVisible(visible: boolean): void;
      getVisible(): boolean;
      setZIndex(zIndex: number): void;
      getZIndex(): number;
      addListener(eventName: string, listener: (...args: any[]) => void): MapEventListener;
    }
    
    interface PolygonOptions {
        map?: Map | null;
        paths: LatLng[] | LatLng[][] | LatLng[][][]; // Array<LatLng> or Array<Array<LatLng>> or Array<Array<Array<LatLng>>>
        strokeColor?: string;
        strokeOpacity?: number;
        strokeWeight?: number;
        strokeStyle?: StrokeStyle;
        fillColor?: string;
        fillOpacity?: number;
        clickable?: boolean;
        visible?: boolean;
        zIndex?: number;
    }

    class Polygon {
        constructor(options: PolygonOptions);
        setMap(map: Map | null): void;
        // ... other methods similar to Polyline
        getPaths(): LatLng[][] | LatLng[][][]; // Depending on input
        setPaths(paths: LatLng[] | LatLng[][] | LatLng[][][]): void;
        getAreaSize(): number;
        addListener(eventName: string, listener: (...args: any[]) => void): MapEventListener;

    }


    interface InfoWindowOptions {
      content: string | HTMLElement;
      position?: LatLng; // Can be omitted if opened on a marker
      map?: Map | null; // Can be set later with open()
      maxWidth?: number;
      backgroundColor?: string; // CSS color
      borderColor?: string; // CSS color
      borderWidth?: number; // Pixels
      disableAnchor?: boolean;
      pixelOffset?: Point;
      zIndex?: number;
      // anchorSkew?: boolean;
      // anchorSize?: Size;
      // anchorPath?: string; // SVG path
    }

    class InfoWindow {
      constructor(options: InfoWindowOptions);
      open(map: Map, anchor?: Marker | LatLng): void;
      close(): void;
      getContent(): string | HTMLElement;
      setContent(content: string | HTMLElement): void;
      getPosition(): LatLng | null; // Null if not set or closed
      setPosition(position: LatLng): void;
      setZIndex(zIndex: number): void;
      getZIndex(): number;
      getMap(): Map | null;
      // ...
      setOptions(options: Partial<InfoWindowOptions>): void;
      addListener(eventName: string, listener: (...args: any[]) => void): MapEventListener;

    }

    class LatLngBounds {
      constructor(sw?: LatLng, ne?: LatLng);
      extend(latlng: LatLng | LatLngBounds): this;
      getCenter(): LatLng;
      isEmpty(): boolean;
      hasLatLng(latlng: LatLng): boolean;
      intersects(other: LatLngBounds): boolean;
      union(other: LatLngBounds): LatLngBounds;
      getSW(): LatLng; // SouthWest
      getNE(): LatLng; // NorthEast
      // ...
    }

    // naver.maps.Event (static object with methods)
    // This is defined as an interface in the existing code, which is fine.
    // The methods are what matter.
    interface Event {
      addListener(target: any, eventName: string, handler: (...args: any[]) => void): MapEventListener;
      once(target: any, eventName: string, handler: (...args: any[]) => void): MapEventListener;
      removeListener(listener: MapEventListener | MapEventListener[]): void; // Can accept array of listeners
      trigger(target: any, eventName: string, eventArgs?: any): void;
      // Add other static methods if used (hasListener, clearInstanceListeners)
      hasListener(target: any, eventName: string): boolean;
      clearInstanceListeners(target: any): void;
    }
    
    // DrawingManager (if using drawing submodule)
    namespace drawing {
        class DrawingManager {
            constructor(options: any); // Define DrawingManagerOptions if needed
            // Methods like setMap, addListener, etc.
        }
    }

    // Position constants (e.g., naver.maps.Position.TOP_RIGHT)
    // This is correctly typed as naver.maps.Position an enum, 
    // but Naver also uses PositionId in some contexts (like control options)
    // This was: type Position = any; Let's use the enum defined above.

    // Other specific types like ControlPosition (likely covered by Position enum)
    // PositionId was for older API versions or specific controls.
    // For mapOptions.zoomControlOptions.position, it's naver.maps.Position.
    // Let's ensure PositionId below matches the enum values or typical usage.
    // It seems the previous PositionId was an object with string keys and number values.
    // The enum Position above is more idiomatic for TypeScript.

    // For clarity, if PositionId is truly a distinct type used somewhere:
    type PositionId = 
        | "TOP_LEFT" | "TOP_CENTER" | "TOP_RIGHT"
        | "LEFT_CENTER" | "CENTER" | "RIGHT_CENTER"
        | "BOTTOM_LEFT" | "BOTTOM_CENTER" | "BOTTOM_RIGHT"
        | "LEFT_TOP" | "LEFT_BOTTOM" | "RIGHT_TOP" | "RIGHT_BOTTOM";


    // END of user guide based detailed types
  } // End of namespace naver.maps

  interface Window {
    naver?: {
      maps: {
        Map: new (element: string | HTMLElement, options?: naver.maps.MapOptions) => naver.maps.Map;
        LatLng: new (lat: number, lng: number) => naver.maps.LatLng;
        Marker: new (options?: naver.maps.MarkerOptions) => naver.maps.Marker;
        Polyline: new (options?: naver.maps.PolylineOptions) => naver.maps.Polyline;
        Polygon: new (options: naver.maps.PolygonOptions) => naver.maps.Polygon;
        Point: new (x: number, y: number) => naver.maps.Point;
        InfoWindow: new (options?: naver.maps.InfoWindowOptions) => naver.maps.InfoWindow;
        LatLngBounds: new (sw?: naver.maps.LatLng, ne?: naver.maps.LatLng) => naver.maps.LatLngBounds;
        Size: new (width: number, height: number) => naver.maps.Size;
        Position: typeof naver.maps.Position; // Refers to the naver.maps.Position enum
        Event: naver.maps.Event; // Refers to the naver.maps.Event interface/static object
        
        drawing?: { // Optional drawing module
            DrawingManager: new (options: any) => naver.maps.drawing.DrawingManager;
        };
        // MapTypeId should refer to the enum for use with map.setMapTypeId()
        MapTypeId: typeof naver.maps.MapTypeId; 
        // Animation enum for marker animations
        Animation: typeof naver.maps.Animation;
      };
    };
    initMap?: () => void; // Keep this if used by HTML script
    geoJsonLayer?: {
      renderRoute: (nodeIds: string[], linkIds: string[], style?: GeoJsonInternalRouteStyle) => (naver.maps.Marker | naver.maps.Polyline)[]; // Use imported RouteStyle
      clearDisplayedFeatures: () => void;
      getNodeById: (id:string) => any; // Consider defining GeoNode type here or importing
      getLinkById: (id: string) => any; // Consider defining GeoLink type here or importing
      isLoaded: () => boolean;
    };
  }
}

</edits_to_apply>
