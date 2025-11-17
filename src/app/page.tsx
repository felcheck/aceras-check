"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { db } from "@/lib/db";
import Header from "@/components/Header";
import WalkabilityPrototypeModal from "@/components/WalkabilityPrototypeModal";
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

      {/* Unified Expandable Drawer */}
      {selectedLocation && (
        <WalkabilityPrototypeModal
          location={selectedLocation}
          isExpanded={showReportForm}
          onExpand={() => setShowReportForm(true)}
          onClose={() => {
            setShowReportForm(false);
            setSelectedLocation(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
