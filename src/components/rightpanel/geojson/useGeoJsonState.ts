
import { useGeoJsonData } from './useGeoJsonData';
import { useGeoJsonRendering } from './useGeoJsonRendering';
import { useGeoJsonGlobalInterface } from './useGeoJsonGlobalInterface';

const useGeoJsonState = (map: naver.maps.Map | null) => {
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
    getIsLoaded,
  } = useGeoJsonData();

  const {
    renderRoute,
    clearDisplayedFeatures,
  } = useGeoJsonRendering(map, isLoaded, getNodeById, getLinkById);

  useGeoJsonGlobalInterface(
    map,
    getIsLoaded,
    renderRoute,
    clearDisplayedFeatures,
    getNodeById,
    getLinkById
  );

  return {
    isLoading,
    error,
    isLoaded,
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
