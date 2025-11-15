"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { db } from "@/lib/db";
import AddReportForm from "@/components/AddReportForm";
import Header from "@/components/Header";
import { SelectedLocation } from "@/types/location";

// Dynamic import for Map component to avoid SSR issues with Leaflet
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex items-center justify-center bg-gray-100">
      <div className="text-gray-600">Loading map...</div>
    </div>
  ),
});

const room = db.room("main");

function App() {
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const handleLocationSelect = (location: SelectedLocation) => {
    setSelectedLocation(location);
  };

  const { peers } = db.rooms.usePresence(room);
  const numUsers = 1 + Object.keys(peers).length;

  // Query all reports
  const { isLoading, error, data } = db.useQuery({
    reports: {
      author: {},
      neighborhood: {},
      photos: {},
    },
  });

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Header */}
      <Header numUsers={numUsers} />

      {/* Main Content */}
      <div className="flex-1 relative bg-gray-50 dark:bg-gray-900">
        <MapView
          reports={data?.reports || []}
          selectedLocation={selectedLocation}
          onLocationSelect={handleLocationSelect}
        />
      </div>

      {/* Google Maps-style Bottom Sheet */}
      {selectedLocation && !showReportForm && (
        <div className="absolute bottom-0 left-0 right-0 z-[500] animate-slide-up">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl mx-auto max-w-2xl">
            {/* Handle bar for mobile */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Content */}
            <div className="px-6 pb-6 pt-2">
              {/* Location coordinates */}
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {selectedLocation.isAddressLoading
                  ? "Cargando dirección..."
                  : selectedLocation.addressLabel ||
                    `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`}
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReportForm(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-lg font-semibold shadow-md transition-colors"
                >
                  Reportar Problema Aquí
                </button>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="px-4 py-3.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Report Form Modal */}
      {showReportForm && selectedLocation && (
        <AddReportForm
          location={selectedLocation}
          onClose={() => {
            setShowReportForm(false);
            setSelectedLocation(null);
          }}
          onSuccess={() => {
            setSelectedLocation(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
