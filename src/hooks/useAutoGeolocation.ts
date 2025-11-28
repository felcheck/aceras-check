import { useEffect, useState } from 'react';

interface GeolocationState {
  location: [number, number] | null;
  hasRequested: boolean;
  permissionStatus: 'prompt' | 'granted' | 'denied' | null;
}

export function useAutoGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    hasRequested: false,
    permissionStatus: null,
  });

  useEffect(() => {
    // Check if we've already requested and stored the decision
    const storedPermission = localStorage.getItem('geolocation-permission');

    if (storedPermission === 'denied') {
      setState(prev => ({ ...prev, hasRequested: true, permissionStatus: 'denied' }));
      return;
    }

    // If we've already granted, we can try to get the position without prompting
    if (storedPermission === 'granted') {
      setState(prev => ({ ...prev, hasRequested: true, permissionStatus: 'granted' }));
      getCurrentPosition();
      return;
    }

    // If already requesting, don't prompt again (handles double-mount in dev mode)
    if (storedPermission === 'requesting') {
      return;
    }

    // First time - request geolocation directly
    // The browser will show its own permission dialog
    // (window.confirm doesn't work well on mobile, especially iOS Safari)
    if (!storedPermission || storedPermission === 'prompt') {
      // Mark as requested immediately to prevent double-prompt
      localStorage.setItem('geolocation-permission', 'requesting');
      getCurrentPosition();
    }
  }, []);

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location: [number, number] = [latitude, longitude];

        // Store successful permission grant
        localStorage.setItem('geolocation-permission', 'granted');

        setState({
          location,
          hasRequested: true,
          permissionStatus: 'granted',
        });
      },
      (error) => {
        console.warn('Geolocation error:', error);

        // Store denial
        localStorage.setItem('geolocation-permission', 'denied');

        setState(prev => ({
          ...prev,
          hasRequested: true,
          permissionStatus: 'denied',
        }));

        // Show error message in Spanish
        let message = 'No se pudo obtener tu ubicación';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permiso de ubicación denegado. Por favor habilita el acceso a la ubicación en la configuración de tu navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Información de ubicación no disponible.';
            break;
          case error.TIMEOUT:
            message = 'La solicitud de ubicación expiró.';
            break;
        }

        // Only show alert if user explicitly denied after our dialog
        if (error.code === error.PERMISSION_DENIED) {
          alert(message);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  };

  return state;
}
