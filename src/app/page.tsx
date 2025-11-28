"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { db } from "@/lib/db";
import Header from "@/components/Header";
import WalkabilityPrototypeModal from "@/components/WalkabilityPrototypeModal";
import CameraCapture from "@/components/CameraCapture";
import PhotoQualityCheck from "@/components/PhotoQualityCheck";
import { SelectedLocation } from "@/types/location";

// Flow states for the camera-first assessment
type FlowState =
  | "map"           // Default - viewing map
  | "camera"        // Camera open
  | "quality-check" // Reviewing photo quality
  | "analyzing"     // AI processing (Phase 2)
  | "review"        // Editing AI draft (Phase 3)
  | "submitting";   // Saving to DB

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
  const [flowState, setFlowState] = useState<FlowState>("map");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleLocationSelect = (location: SelectedLocation) => {
    setSelectedLocation(location);
  };

  // Camera flow handlers
  const handleStartCamera = () => {
    setFlowState("camera");
  };

  const handleCameraCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setFlowState("quality-check");
  };

  const handleCameraClose = () => {
    setFlowState("map");
    setCapturedImage(null);
  };

  const handleRetakePhoto = () => {
    setCapturedImage(null);
    setFlowState("camera");
  };

  const handleQualityConfirmed = () => {
    // Phase 2 will add AI analysis here
    // For now, go directly to the manual form with the photo
    setFlowState("map");
    setShowReportForm(true);
  };

  const handleCloseAll = () => {
    setShowReportForm(false);
    setSelectedLocation(null);
    setFlowState("map");
    setCapturedImage(null);
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
    <>
      <div className="h-dvh w-full flex flex-col">
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
        {selectedLocation && flowState === "map" && (
          <WalkabilityPrototypeModal
            location={selectedLocation}
            isExpanded={showReportForm}
            onExpand={handleStartCamera}
            onClose={handleCloseAll}
            capturedImage={capturedImage}
          />
        )}
      </div>

      {/* Camera Capture Screen - rendered outside main flex container for proper fixed positioning */}
      {flowState === "camera" && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={handleCameraClose}
        />
      )}

      {/* Photo Quality Check Screen - rendered outside main flex container */}
      {flowState === "quality-check" && capturedImage && (
        <PhotoQualityCheck
          imageSrc={capturedImage}
          onRetake={handleRetakePhoto}
          onContinue={handleQualityConfirmed}
        />
      )}
    </>
  );
}

export default App;
