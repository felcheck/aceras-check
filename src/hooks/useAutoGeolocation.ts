import { useEffect, useState, useCallback } from 'react';

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

  // Define getCurrentPosition first so it can be used in useEffect
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    console.log('[Geolocation] Requesting position...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location: [number, number] = [latitude, longitude];

        console.log('[Geolocation] Got position:', latitude, longitude);

        // Store successful permission grant
        localStorage.setItem('geolocation-permission', 'granted');

        setState({
          location,
          hasRequested: true,
          permissionStatus: 'granted',
        });
      },
      (error) => {
        console.warn('[Geolocation] Error:', error);

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
  }, []);

  useEffect(() => {
    // Check if we've already requested and stored the decision
    const storedPermission = localStorage.getItem('geolocation-permission');
    console.log('[Geolocation] Stored permission:', storedPermission);

    if (storedPermission === 'denied') {
      setState(prev => ({ ...prev, hasRequested: true, permissionStatus: 'denied' }));
      return;
    }

    // If we've already granted, get position immediately (no prompt needed)
    if (storedPermission === 'granted') {
      console.log('[Geolocation] Previously granted, requesting position...');
      setState(prev => ({ ...prev, hasRequested: true, permissionStatus: 'granted' }));
      getCurrentPosition();
      return;
    }

    // If already requesting, don't prompt again (handles double-mount in dev mode)
    if (storedPermission === 'requesting') {
      console.log('[Geolocation] Already requesting, skipping...');
      return;
    }

    // First time - request geolocation directly
    // The browser will show its own permission dialog
    console.log('[Geolocation] First time, requesting permission...');
    localStorage.setItem('geolocation-permission', 'requesting');
    getCurrentPosition();
  }, [getCurrentPosition]);

  return state;
}
