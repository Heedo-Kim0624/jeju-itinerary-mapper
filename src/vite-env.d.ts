
/// <reference types="vite/client" />

// Add global type declaration for geoJsonLayer
declare global {
  interface Window {
    geoJsonLayer?: any;
  }
}
