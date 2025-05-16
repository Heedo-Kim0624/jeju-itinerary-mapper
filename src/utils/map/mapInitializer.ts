
import { toast } from "sonner";

// Jeju Island center coordinates
export const JEJU_CENTER = { lat: 33.3617, lng: 126.5292 };

export const initializeNaverMap = (mapContainer: HTMLDivElement | null) => {
  if (!mapContainer) {
    console.error("Map container is not available");
    return null;
  }
  
  if (!window.naver || !window.naver.maps) {
    console.error("Naver Maps API is not loaded");
    return null;
  }

  try {
    console.log("Creating new Naver Map instance with container:", mapContainer);
    
    // 명시적인 지도 컨테이너 크기 확인
    if (mapContainer.clientWidth === 0 || mapContainer.clientHeight === 0) {
      console.warn("Map container has zero width or height. Setting minimum dimensions.");
      mapContainer.style.minWidth = "300px";
      mapContainer.style.minHeight = "300px";
    }
    
    // 디버깅: 컨테이너 크기 로그
    console.log("Map container dimensions:", {
      width: mapContainer.clientWidth,
      height: mapContainer.clientHeight,
      offsetWidth: mapContainer.offsetWidth,
      offsetHeight: mapContainer.offsetHeight,
      style: mapContainer.style
    });
    
    const mapOptions = {
      center: new window.naver.maps.LatLng(JEJU_CENTER.lat, JEJU_CENTER.lng),
      zoom: 10,
      minZoom: 9,
      maxZoom: 18,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT
      }
    };

    // Naver Map 인스턴스 생성
    const map = new window.naver.maps.Map(mapContainer, mapOptions);
    
    // 디버깅: 지도 객체 상태 확인
    console.log("Map instance created:", map);
    
    // Event listener for debugging map initialization
    window.naver.maps.Event.once(map, 'init_stylemap', () => {
      console.log("지도 초기화 완료 이벤트 발생");
      toast.success("제주도 지도가 로드되었습니다");
    });
    
    // 백업: 지도 로딩 완료 여부 확인을 위한 타이머
    setTimeout(() => {
      // 지도 중심점을 읽어서 초기화 여부 확인
      try {
        const center = map.getCenter();
        console.log("Map center verified after timeout:", center);
        
        // 지도가 실제로 렌더링되었는지 확인하기 위한 추가 검증
        if (mapContainer.querySelector('.btns_act')
            || mapContainer.querySelector('path')
            || mapContainer.querySelector('.btn_compass')) {
          console.log("지도 UI 엘리먼트 감지됨, 초기화 성공");
        } else {
          console.warn("지도 초기화되었으나 UI 엘리먼트가 감지되지 않음");
        }
      } catch (err) {
        console.error("지도 초기화 확인 중 오류:", err);
      }
    }, 2000);
    
    return map;
  } catch (error) {
    console.error("Error initializing map:", error);
    toast.error("지도 초기화에 실패했습니다.");
    return null;
  }
};

// GeoJSON 노드 ID와 좌표 간 매핑 디버깅 함수
export const debugGeoJsonMapping = (nodeIds: string[], nodes: any[]) => {
  if (!nodeIds || nodeIds.length === 0) {
    console.warn("디버깅: nodeIds가 비어 있습니다.");
    return;
  }
  
  if (!nodes || nodes.length === 0) {
    console.warn("디버깅: GeoJSON 노드 데이터가 비어 있습니다.");
    return;
  }
  
  // 주요 정보 로깅
  console.log(`디버깅: nodeIds 배열 길이 = ${nodeIds.length}, 노드 배열 길이 = ${nodes.length}`);
  
  // 첫 5개 nodeId에 대한 매핑 확인
  const sampleNodeIds = nodeIds.slice(0, 5);
  
  console.log("디버깅: ID 매핑 샘플");
  sampleNodeIds.forEach(id => {
    const foundNode = nodes.find(node => node.id === id || node.getId() === id);
    console.log(`ID ${id}: ${foundNode ? '매칭됨' : '매칭 실패'}`);
    
    if (foundNode) {
      const coords = foundNode.coordinates || [];
      console.log(`좌표: [${coords.join(', ')}]`);
    }
  });
};
