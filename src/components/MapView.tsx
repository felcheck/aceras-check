"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { InstaQLEntity } from "@instantdb/react";
import { AppSchema } from "@/instant.schema";
import { useAutoGeolocation } from "@/hooks/useAutoGeolocation";
import { reverseGeocode } from "@/lib/nominatim";
import { SelectedLocation } from "@/types/location";

// Fix for default marker icons in React Leaflet
import "leaflet/dist/leaflet.css";

// Create default icon using CDN URLs (red for existing reports)
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Create blue icon for selection pin
const SelectionIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Set as default for all markers
L.Marker.prototype.options.icon = DefaultIcon;

type Report = InstaQLEntity<
  AppSchema,
  "reports",
  { author: {}; neighborhood: {}; photos: {} }
>;

const TILE_THEMES = {
  voyager: {
    id: "voyager",
    name: "Carto Voyager",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
  },
  darkMatter: {
    id: "darkMatter",
    name: "Carto Dark",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  },
} as const;

interface MapViewProps {
  reports: Report[];
  selectedLocation: SelectedLocation | null;
  onLocationSelect: (location: SelectedLocation) => void;
}

// Panama City center coordinates (Bella Vista area)
const PANAMA_CENTER: [number, number] = [8.983333, -79.516670];

const formatCoordinates = (lat: number, lng: number) =>
  `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

// Auto-geolocation handler - flies to user location on load
function AutoGeolocationHandler({
  autoLocation,
}: {
  autoLocation: [number, number] | null;
}) {
  const map = useMap();
  const hasFlown = useRef(false);

  useEffect(() => {
    if (autoLocation && !hasFlown.current) {
      map.flyTo(autoLocation, 16, { duration: 1.5 });
      hasFlown.current = true;
    }
  }, [autoLocation, map]);

  return null;
}

// Selection pin component with drop animation (tap to reposition)
function SelectionPin({
  position,
}: {
  position: [number, number];
}) {
  const [animate, setAnimate] = useState(true);

  // Reset animation when position changes (new pin drop)
  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 600); // Match animation duration
    return () => clearTimeout(timer);
  }, [position]);

  // Create animated div icon
  const animatedIcon = useMemo(() => {
    return L.divIcon({
      html: `
        <div class="${animate ? 'animate-pin-drop' : ''}" style="
          width: 25px;
          height: 41px;
        ">
          <img
            src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png"
            style="width: 25px; height: 41px;"
          />
        </div>
      `,
      className: '', // Remove default styling
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
  }, [animate]);

  return (
    <Marker
      position={position}
      draggable={false}
      icon={animatedIcon}
    >
      <Popup>
        <div className="text-center">
          <p className="font-semibold text-sm">Ubicación del Reporte</p>
          <p className="text-xs text-gray-500 mt-1">Toca el mapa para cambiar ubicación</p>
        </div>
      </Popup>
    </Marker>
  );
}

// Map click handler component
function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (location: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click: (e) => {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Blue pulsing dot for user location (Google Maps style)
function UserLocationIndicator({ position }: { position: [number, number] }) {
  const icon = useMemo(() => {
    return L.divIcon({
      html: `
        <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
          <!-- Pulsing ring -->
          <div class="animate-pulse-ring" style="
            position: absolute;
            width: 20px;
            height: 20px;
            background: rgba(66, 133, 244, 0.3);
            border-radius: 50%;
          "></div>
          <!-- Blue dot -->
          <div style="
            position: relative;
            width: 16px;
            height: 16px;
            background: #4285f4;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            z-index: 1;
          "></div>
        </div>
      `,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }, []);

  return <Marker position={position} icon={icon} />;
}

// Custom map controls - Responsive geolocation and zoom
function MapControls({
  isDark,
  hasBottomSheet,
  userLocation,
  onLocationFound
}: {
  isDark: boolean;
  hasBottomSheet: boolean;
  userLocation: [number, number] | null;
  onLocationFound: (location: [number, number]) => void;
}) {
  const map = useMap();
  const [isLoading, setIsLoading] = useState(false);
  const desktopControlsRef = useRef<HTMLDivElement>(null);
  const mobileControlsRef = useRef<HTMLDivElement>(null);

  // Disable click propagation using Leaflet's event system
  useEffect(() => {
    if (desktopControlsRef.current) {
      L.DomEvent.disableClickPropagation(desktopControlsRef.current);
    }
    if (mobileControlsRef.current) {
      L.DomEvent.disableClickPropagation(mobileControlsRef.current);
    }
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("La geolocalización no está soportada por tu navegador");
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location: [number, number] = [latitude, longitude];
        onLocationFound(location);
        map.flyTo(location, 16, { duration: 1.5 });
        setIsLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        let message = "No se pudo obtener tu ubicación";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Permiso de ubicación denegado. Por favor habilita el acceso en la configuración.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Información de ubicación no disponible.";
            break;
          case error.TIMEOUT:
            message = "La solicitud de ubicación expiró.";
            break;
        }
        alert(message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const buttonBaseClass = `
    ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-gray-50 text-gray-800'}
    disabled:opacity-50 disabled:cursor-not-allowed
    flex items-center justify-center border-none cursor-pointer
    shadow-lg transition-colors
  `;

  return (
    <>
      {/* Desktop: Zoom + Geolocation (top-right, vertical stack) */}
      <div
        ref={desktopControlsRef}
        className="hidden md:block absolute top-4 right-4 z-[400] flex flex-col gap-2"
      >
        {/* Zoom controls */}
        <div className="flex flex-col shadow-lg rounded-lg overflow-hidden">
          <button
            onClick={handleZoomIn}
            className={`${buttonBaseClass} w-10 h-10 rounded-t-lg border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
            title="Acercar"
          >
            <span className="text-xl font-semibold">+</span>
          </button>
          <button
            onClick={handleZoomOut}
            className={`${buttonBaseClass} w-10 h-10 rounded-b-lg`}
            title="Alejar"
          >
            <span className="text-xl font-semibold">−</span>
          </button>
        </div>

        {/* Geolocation button */}
        <button
          onClick={handleGetLocation}
          disabled={isLoading}
          className={`${buttonBaseClass} w-10 h-10 rounded-lg mt-2`}
          title="Usar mi ubicación"
        >
          {isLoading ? (
            <span className="text-lg">⌛</span>
          ) : (
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile: Geolocation only (bottom-right, Google Maps style) */}
      {/* Adjust position when bottom sheet is visible - clearance for 145px collapsed drawer */}
      <div
        ref={mobileControlsRef}
        className={`md:hidden absolute ${hasBottomSheet ? 'bottom-48' : 'bottom-6'} right-4 z-[400] transition-all duration-300`}
      >
        <button
          onClick={handleGetLocation}
          disabled={isLoading}
          className={`${buttonBaseClass} w-12 h-12 rounded-full`}
          title="Usar mi ubicación"
        >
          {isLoading ? (
            <span className="text-lg">⌛</span>
          ) : (
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
            </svg>
          )}
        </button>
      </div>

      {/* User location - blue pulsing dot (Google Maps style) */}
      {userLocation && <UserLocationIndicator position={userLocation} />}
    </>
  );
}

export default function MapView({
  reports,
  selectedLocation,
  onLocationSelect,
}: MapViewProps) {
  const [isDark, setIsDark] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const latestSelectionRef = useRef<SelectedLocation | null>(selectedLocation);
  const [reportAddressCache, setReportAddressCache] = useState<Record<string, string>>({});

  useEffect(() => {
    latestSelectionRef.current = selectedLocation;
  }, [selectedLocation]);

  const commitSelection = useCallback(
    (payload: SelectedLocation) => {
      latestSelectionRef.current = payload;
      onLocationSelect(payload);
    },
    [onLocationSelect]
  );

  const handleManualLocation = useCallback(
    (coords: { lat: number; lng: number }) => {
      const baseSelection: SelectedLocation = {
        lat: coords.lat,
        lng: coords.lng,
        addressLabel: null,
        roadName: null,
        isAddressLoading: true,
        source: "map",
      };
      commitSelection(baseSelection);

      (async () => {
        try {
          const result = await reverseGeocode(coords.lat, coords.lng);
          const latest = latestSelectionRef.current;
          if (
            !latest ||
            latest.lat !== coords.lat ||
            latest.lng !== coords.lng
          ) {
            return;
          }

          if (result) {
            commitSelection({
              lat: coords.lat,
              lng: coords.lng,
              addressLabel: result.addressLabel,
              roadName: result.roadName ?? result.addressLabel,
              isAddressLoading: false,
              source: "map",
            });
          } else {
            commitSelection({
              lat: coords.lat,
              lng: coords.lng,
              addressLabel: null,
              roadName: null,
              isAddressLoading: false,
              source: "map",
            });
          }
        } catch (error) {
          console.warn("Reverse geocode error", error);
          const latest = latestSelectionRef.current;
          if (
            !latest ||
            latest.lat !== coords.lat ||
            latest.lng !== coords.lng
          ) {
            return;
          }
          commitSelection({
            lat: coords.lat,
            lng: coords.lng,
            addressLabel: null,
            roadName: null,
            isAddressLoading: false,
            source: "map",
          });
        }
      })();
    },
    [commitSelection]
  );

  const fetchReportAddress = useCallback(
    async (report: Report) => {
      if (report.roadName || reportAddressCache[report.id]) {
        return;
      }
      const result = await reverseGeocode(report.lat, report.lng);
      if (result?.addressLabel) {
        setReportAddressCache((prev) => ({
          ...prev,
          [report.id]: result.addressLabel,
        }));
      }
    },
    [reportAddressCache]
  );

  // Auto-geolocation hook - single source of truth for user location
  const { location: autoLocation, permissionStatus } = useAutoGeolocation();

  // When auto-geolocation succeeds, set it as user location for blue dot
  useEffect(() => {
    if (autoLocation && permissionStatus === 'granted') {
      setUserLocation(autoLocation);
    }
  }, [autoLocation, permissionStatus]);

  // Detect dark mode from document class
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    // Check on mount
    checkDarkMode();

    // Watch for changes to dark mode
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const tileConfig = useMemo(
    () => (isDark ? TILE_THEMES.darkMatter : TILE_THEMES.voyager),
    [isDark]
  );

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={PANAMA_CENTER}
        zoom={14}
        className="h-full w-full"
        scrollWheelZoom={true}
        zoomControl={false}
        touchZoom={true}
        doubleClickZoom={true}
      >
        <TileLayer attribution={tileConfig.attribution} url={tileConfig.url} />

        <AutoGeolocationHandler autoLocation={autoLocation} />
        <MapClickHandler onMapClick={handleManualLocation} />
        <MapControls
          isDark={isDark}
          hasBottomSheet={Boolean(selectedLocation)}
          userLocation={userLocation}
          onLocationFound={setUserLocation}
        />

        {/* Render selection pin if location is selected */}
        {selectedLocation && (
          <SelectionPin
            position={[selectedLocation.lat, selectedLocation.lng]}
          />
        )}

        {/* Render existing reports as markers */}
        {reports.map((report) => {
          const cachedAddress = reportAddressCache[report.id];
          const displayAddress =
            report.roadName || cachedAddress || formatCoordinates(report.lat, report.lng);

          return (
            <Marker
              key={report.id}
              position={[report.lat, report.lng]}
              eventHandlers={{
                click: () => fetchReportAddress(report),
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-sm mb-1">
                    {report.category.replace(/_/g, " ").toUpperCase()}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {report.description}
                  </p>
                  {displayAddress && (
                    <p className="text-xs text-gray-500 mb-2">{displayAddress}</p>
                  )}
                  <div className="mt-2 flex gap-2 text-xs">
                    {report.conditionRating && (
                      <span>Condición: {report.conditionRating}/5</span>
                    )}
                    {report.safetyRating && (
                      <span>Seguridad: {report.safetyRating}/5</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
