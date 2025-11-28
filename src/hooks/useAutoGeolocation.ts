import { useEffect, useState, useRef } from 'react';

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

  // Use ref to track if we've already initiated a request this session
  const hasInitiated = useRef(false);

  useEffect(() => {
    // Prevent double-execution in React Strict Mode
    if (hasInitiated.current) {
      console.log('[Geolocation] Already initiated this session, skipping...');
      return;
    }
    hasInitiated.current = true;

    if (!navigator.geolocation) {
      console.warn('[Geolocation] Not supported');
      return;
    }

    const requestPosition = () => {
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
          console.warn('[Geolocation] Error:', error.code, error.message);

          // Only store denial if it was actually permission denied
          if (error.code === error.PERMISSION_DENIED) {
            localStorage.setItem('geolocation-permission', 'denied');
          }

          setState(prev => ({
            ...prev,
            hasRequested: true,
            permissionStatus: error.code === error.PERMISSION_DENIED ? 'denied' : prev.permissionStatus,
          }));

          // Show error message in Spanish only for permission denied
          if (error.code === error.PERMISSION_DENIED) {
            alert('Permiso de ubicación denegado. Por favor habilita el acceso a la ubicación en la configuración de tu navegador.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout for mobile
          maximumAge: 60000, // 1 minute cache (reduced from 5)
        }
      );
    };

    // Check stored permission
    const storedPermission = localStorage.getItem('geolocation-permission');
    console.log('[Geolocation] Stored permission:', storedPermission);

    if (storedPermission === 'denied') {
      setState(prev => ({ ...prev, hasRequested: true, permissionStatus: 'denied' }));
      return;
    }

    // Use Permissions API if available to check actual browser state
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        console.log('[Geolocation] Browser permission state:', result.state);

        if (result.state === 'denied') {
          localStorage.setItem('geolocation-permission', 'denied');
          setState(prev => ({ ...prev, hasRequested: true, permissionStatus: 'denied' }));
          return;
        }

        if (result.state === 'granted') {
          // Permission already granted - request position
          localStorage.setItem('geolocation-permission', 'granted');
          setState(prev => ({ ...prev, permissionStatus: 'granted' }));
          requestPosition();
        } else {
          // 'prompt' state - will show browser dialog
          console.log('[Geolocation] Will prompt for permission...');
          requestPosition();
        }
      }).catch(() => {
        // Permissions API failed (e.g., iOS Safari doesn't support it)
        // Fall back to just requesting position
        console.log('[Geolocation] Permissions API not available, requesting directly...');
        requestPosition();
      });
    } else {
      // No Permissions API - just request position
      // The browser will show its own permission dialog if needed
      console.log('[Geolocation] No Permissions API, requesting directly...');
      requestPosition();
    }
  }, []);

  return state;
}
