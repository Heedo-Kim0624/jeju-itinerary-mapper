import { useEffect } from 'react';

interface JejuOSMLayerProps {
  map: any;
}

const JejuOSMLayer: React.FC<JejuOSMLayerProps> = ({ map }) => {
  useEffect(() => {
    if (!map || !window.naver || !window.naver.maps || !window.naver.maps.drawing) return;

    const loadGeoJson = async (url: string, style: any) => {
      try {
        const response = await fetch(url);
        const geojson = await response.json();
        const reader = new window.naver.maps.drawing.JSONReader(geojson, style);
        const layer = reader.read();
        layer.setMap(map);
      } catch (error) {
        console.error("GeoJSON 파일 로드 실패:", error);
      }
    };

    const linkStyle = {
      strokeColor: '#555',
      strokeWeight: 2,
      strokeOpacity: 0.7
    };

    const nodeStyle = {
      fillColor: '#ff0000',
      radius: 3,
      strokeWeight: 1,
      strokeColor: '#ffffff'
    };

    loadGeoJson('/LINK_JSON.geojson', linkStyle);
    loadGeoJson('/NODE_JSON.geojson', nodeStyle);
  }, [map]);

  return null;
};

export default JejuOSMLayer;
