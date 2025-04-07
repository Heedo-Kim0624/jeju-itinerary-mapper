import { useEffect } from "react";

declare global {
  interface Window {
    naver: any;
  }
}

const NaverMap = () => {
  useEffect(() => {
    // ✅ 네이버 지도 SDK script 로드
    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${import.meta.env.VITE_NAVER_CLIENT_ID}`;
    script.async = true;
    script.onload = () => {
      if (window.naver) {
        const map = new window.naver.maps.Map("map", {
          center: new window.naver.maps.LatLng(33.3617, 126.5292),
          zoom: 10,
        });
      }
    };
    document.head.appendChild(script);
  }, []);

  return (
    <div
      id="map"
      style={{
        width: "100%",
        height: "500px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    ></div>
  );
};

export default NaverMap;
