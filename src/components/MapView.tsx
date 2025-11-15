"use client";

import React, { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { InstaQLEntity } from "@instantdb/react";
import { AppSchema } from "@/instant.schema";

// Fix for default marker icons in React Leaflet
import "leaflet/dist/leaflet.css";

// Create default icon using CDN URLs
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
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
  onLocationSelect: (location: { lat: number; lng: number }) => void;
}

// Panama City center coordinates (Bella Vista area)
const PANAMA_CENTER: [number, number] = [8.983333, -79.516670];

// Map click handler component
function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click: (e) => {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Geolocation button component
function GeolocationButton() {
  const map = useMap();
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location: [number, number] = [latitude, longitude];
        setUserLocation(location);
        map.flyTo(location, 16, { duration: 1.5 });
        setIsLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        let message = "Unable to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location permission denied. Please enable location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
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

  return (
    <>
      <div className="leaflet-top leaflet-right" style={{ marginTop: "80px", marginRight: "10px" }}>
        <div className="leaflet-control leaflet-bar">
          <button
            onClick={handleGetLocation}
            disabled={isLoading}
            className="bg-white hover:bg-gray-50 disabled:bg-gray-100 w-[30px] h-[30px] flex items-center justify-center border-none cursor-pointer text-lg"
            title="Use my location"
            style={{ borderRadius: "4px" }}
          >
            {isLoading ? "⌛" : "📍"}
          </button>
        </div>
      </div>
      {userLocation && (
        <Marker position={userLocation} icon={DefaultIcon}>
          <Popup>
            <div className="text-center">
              <p className="font-semibold">You are here</p>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
}

export default function MapView({ reports, onLocationSelect }: MapViewProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [theme, setTheme] = useState<keyof typeof TILE_THEMES>("voyager");

  const tileConfig = useMemo(() => TILE_THEMES[theme], [theme]);

  return (
    <div className="h-full w-full">
      <MapContainer
        center={PANAMA_CENTER}
        zoom={14}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer attribution={tileConfig.attribution} url={tileConfig.url} />

        <MapClickHandler onLocationSelect={onLocationSelect} />
        <GeolocationButton />

        <div className="leaflet-top leaflet-left" style={{ marginTop: "80px", marginLeft: "10px" }}>
          <div className="leaflet-control leaflet-bar bg-white rounded">
            {Object.values(TILE_THEMES).map((tile) => (
              <button
                key={tile.id}
                type="button"
                className={`px-3 py-1 text-xs border-b last:border-b-0 ${
                  theme === tile.id ? "bg-blue-600 text-white" : "text-gray-700"
                }`}
                onClick={() => setTheme(tile.id)}
              >
                {tile.name}
              </button>
            ))}
          </div>
        </div>

        {/* Render existing reports as markers */}
        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.lat, report.lng]}
            eventHandlers={{
              click: () => setSelectedReport(report),
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
                {report.roadName && (
                  <p className="text-xs text-gray-500">
                    <strong>Road:</strong> {report.roadName}
                  </p>
                )}
                <div className="mt-2 flex gap-2 text-xs">
                  {report.conditionRating && (
                    <span>Condition: {report.conditionRating}/5</span>
                  )}
                  {report.safetyRating && (
                    <span>Safety: {report.safetyRating}/5</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
