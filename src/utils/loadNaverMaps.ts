export declare var naver: any;

export const loadNaverMaps = (callback: () => void) => {
  if (typeof window === 'undefined') {
    console.warn('Naver Maps can only be loaded in the browser.');
    return;
  }

  const existingScript = document.getElementById('naver-maps-script');
  if (existingScript) {
    console.log('Naver Maps script already exists.');
    callback();
    return;
  }

  const script = document.createElement('script');
  script.id = 'naver-maps-script';
  script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${
    import.meta.env.VITE_NAVER_CLIENT_ID
  }`;
  script.async = true;
  script.defer = true;

  script.onload = () => {
    console.log('Naver Maps script loaded.');
    callback();
  };

  script.onerror = () => {
    console.error('Failed to load Naver Maps script.');
  };

  document.head.appendChild(script);
};
