
import { useGeoJsonData } from './useGeoJsonData';
import { useGeoJsonRendering } from './useGeoJsonRendering';
import { useGeoJsonGlobalInterface } from './useGeoJsonGlobalInterface';
// GeoNode, GeoLink, etc., are now imported by the individual hooks.

export const useGeoJsonState = (map: naver.maps.Map | null) => {
  const {
    isLoading,
    error,
    isLoaded,
    nodes,
    links,
    handleLoadSuccess,
    handleLoadError,
    getNodeById,
    getLinkById,
    getIsLoaded, // Renamed from isLoaded to avoid conflict, and it's a function
  } = useGeoJsonData();

  const {
    renderRoute,
    clearDisplayedFeatures,
  } = useGeoJsonRendering(map, isLoaded, getNodeById, getLinkById);

  useGeoJsonGlobalInterface(
    map,
    getIsLoaded, // Pass the function that returns the current isLoaded state
    renderRoute,
    clearDisplayedFeatures,
    getNodeById,
    getLinkById
  );

  return {
    isLoading,
    error,
    isLoaded, // This is the boolean state for consumers of useGeoJsonState
    nodes,
    links,
    handleLoadSuccess,
    handleLoadError,
    clearDisplayedFeatures,
    getNodeById,
    getLinkById,
    renderRoute,
  };
};

export default useGeoJsonState;
