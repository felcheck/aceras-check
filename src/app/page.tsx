"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { db } from "@/lib/db";
import AddReportForm from "@/components/AddReportForm";

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
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);

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
      <header className="bg-white shadow-sm z-10 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Aceras Check</h1>
          <p className="text-sm text-gray-600">
            Panama City Walkability Reporter
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {numUsers} user{numUsers > 1 ? "s" : ""} online
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative">
        <MapView
          reports={data?.reports || []}
          onLocationSelect={setSelectedLocation}
        />
      </div>

      {/* Report Button */}
      {selectedLocation && !showReportForm && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[500]">
          <button
            onClick={() => setShowReportForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg font-semibold"
          >
            Report Issue at this Location
          </button>
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
