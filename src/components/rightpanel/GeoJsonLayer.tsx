
import { useEffect, useRef } from 'react';

interface GeoJsonLayerProps {
  map: any;
  visible: boolean;
}

const GeoJsonLayer: React.FC<GeoJsonLayerProps> = ({ map, visible }) => {
  const linkFeatures = useRef<any[]>([]);
  const nodeFeatures = useRef<any[]>([]);

  useEffect(() => {
    if (!map || !window.naver || !window.naver.maps) return;

    const loadGeoJson = async () => {
      try {
        const [linkRes, nodeRes] = await Promise.all([
          fetch('/data/LINK_JSON.geojson'),
          fetch('/data/NODE_JSON.geojson')
        ]);
    
        const [linkGeoJson, nodeGeoJson] = await Promise.all([
          linkRes.json(),
          nodeRes.json()
        ]);
    
        console.log('🧪 linkGeoJson loaded');
        console.log('🧪 nodeGeoJson loaded');
    
        linkFeatures.current = window.naver.maps.GeoJSON.read(linkGeoJson);
        nodeFeatures.current = window.naver.maps.GeoJSON.read(nodeGeoJson);
    
        console.log('✅ GeoJSON 메모리에 저장 완료', {
          linkCount: linkFeatures.current.length,
          nodeCount: nodeFeatures.current.length
        });

        if (visible) {
          showGeoJsonOnMap();
        }
      } catch (err) {
        console.error('❌ GeoJSON 파일 로드 오류:', err);
      }
    };

    loadGeoJson();

    return () => {
      hideGeoJsonFromMap();
    };
  }, [map]);

  useEffect(() => {
    if (visible) {
      showGeoJsonOnMap();
    } else {
      hideGeoJsonFromMap();
    }
  }, [visible]);

  const showGeoJsonOnMap = () => {
    if (!map) return;
    linkFeatures.current.forEach(f => f.setMap(map));
    nodeFeatures.current.forEach(f => f.setMap(map));
  };
  
  const hideGeoJsonFromMap = () => {
    linkFeatures.current.forEach(f => f.setMap(null));
    nodeFeatures.current.forEach(f => f.setMap(null));
  };

  return null;
};

export default GeoJsonLayer;
