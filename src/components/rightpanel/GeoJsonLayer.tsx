
import React from 'react';
import { GeoJsonLayerProps } from './geojson/GeoJsonTypes';

const GeoJsonLayer: React.FC<GeoJsonLayerProps> = () => {
  // GeoJSON 경로 렌더링을 완전히 비활성화
  console.log('[GeoJsonLayer] GeoJSON 경로 렌더링이 비활성화되었습니다.');
  return null;
};

export default GeoJsonLayer;
