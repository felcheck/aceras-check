"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { db } from "@/lib/db";
import { id } from "@instantdb/react";
import Header from "@/components/Header";
import WalkabilityPrototypeModal from "@/components/WalkabilityPrototypeModal";
import CameraCapture from "@/components/CameraCapture";
import PhotoQualityCheck from "@/components/PhotoQualityCheck";
import AIDraftReview from "@/components/AIDraftReview";
import AIAnalyzingScreen from "@/components/AIAnalyzingScreen";
import AuthModal from "@/components/AuthModal";
import MyReports from "@/components/MyReports";
import { SelectedLocation } from "@/types/location";
import { SidewalkAnalysis } from "@/app/api/analyze-sidewalk/route";

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
  const [aiAnalysis, setAiAnalysis] = useState<SidewalkAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMyReports, setShowMyReports] = useState(false);

  // Auth state
  const { isLoading: authLoading, user, error: authError } = db.useAuth();

  const handleLocationSelect = (location: SelectedLocation) => {
    setSelectedLocation(location);
  };

  // Camera flow handlers
  const handleStartCamera = () => {
    // Require auth before starting camera flow
    if (!user) {
      setShowAuthModal(true);
      return;
    }
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
    setAiAnalysis(null);
    setAnalysisError(null);
    setFlowState("camera");
  };

  const handleQualityConfirmed = async () => {
    if (!capturedImage) return;

    // Start AI analysis
    setFlowState("analyzing");
    setAnalysisError(null);

    try {
      const response = await fetch("/api/analyze-sidewalk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: capturedImage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze image");
      }

      setAiAnalysis(data.analysis);
      setFlowState("review");
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysisError(
        error instanceof Error ? error.message : "Error al analizar la imagen"
      );
    }
  };

  const handleRetryAnalysis = () => {
    handleQualityConfirmed();
  };

  const handleCancelAnalysis = () => {
    setFlowState("quality-check");
    setAnalysisError(null);
  };

  const handleReviewSubmit = async (
    analysis: SidewalkAnalysis,
    userModified: boolean
  ) => {
    if (!selectedLocation || !capturedImage || !user) return;

    setFlowState("submitting");

    try {
      // Create report in InstantDB
      const reportId = id();
      const photoId = id();

      await db.transact([
        db.tx.reports[reportId].update({
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          address: selectedLocation.addressLabel || "",
          roadName: selectedLocation.roadName || null,
          // AI analysis fields
          hasSidewalk: analysis.hasSidewalk,
          widthRating: analysis.widthRating,
          conditionRating: analysis.conditionRating,
          safetyRating: analysis.safetyRating,
          accessibilityRating: analysis.accessibilityRating,
          description: analysis.description,
          // AI tracking
          aiGenerated: true,
          aiConfidence: analysis.confidence,
          aiModel: "gpt-4o-mini",
          userModified: userModified,
          aiProcessedAt: Date.now(),
          aiRawResponse: JSON.stringify(analysis),
          // Computed scores (simplified)
          seguridadScore: analysis.safetyRating * 20,
          totalScore: Math.round(
            (analysis.conditionRating +
              analysis.safetyRating +
              analysis.accessibilityRating +
              analysis.widthRating) *
              5
          ),
          // Meta
          status: "pending",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }),
        db.tx.$files[photoId].update({
          url: capturedImage,
          path: `reports/${reportId}/${photoId}.jpg`,
        }),
        db.tx.reports[reportId].link({ photos: photoId, author: user.id }),
      ]);

      // Success - close everything
      handleCloseAll();
    } catch (error) {
      console.error("Submit error:", error);
      setAnalysisError("Error al guardar el reporte");
      setFlowState("review");
    }
  };

  const handleReviewClose = () => {
    setFlowState("map");
    setCapturedImage(null);
    setAiAnalysis(null);
  };

  const handleCloseAll = () => {
    setShowReportForm(false);
    setSelectedLocation(null);
    setFlowState("map");
    setCapturedImage(null);
    setAiAnalysis(null);
    setAnalysisError(null);
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
        <Header
          numUsers={numUsers}
          user={user}
          onLoginClick={() => setShowAuthModal(true)}
          onLogoutClick={() => db.auth.signOut()}
          onMyReportsClick={() => setShowMyReports(true)}
        />

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

      {/* AI Analyzing Screen */}
      {flowState === "analyzing" && (
        <AIAnalyzingScreen
          onCancel={handleCancelAnalysis}
          error={analysisError}
          onRetry={handleRetryAnalysis}
        />
      )}

      {/* AI Draft Review Screen */}
      {flowState === "review" && capturedImage && aiAnalysis && (
        <AIDraftReview
          imageSrc={capturedImage}
          analysis={aiAnalysis}
          onSubmit={handleReviewSubmit}
          onRetake={handleRetakePhoto}
          onClose={handleReviewClose}
        />
      )}

      {/* Submitting overlay */}
      {flowState === "submitting" && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center"
          style={{ zIndex: 9999 }}
        >
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-4" />
            <p>Guardando reporte...</p>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            // If user was trying to start camera, continue the flow
            if (selectedLocation) {
              setFlowState("camera");
            }
          }}
        />
      )}

      {/* My Reports */}
      {showMyReports && user && (
        <MyReports
          userId={user.id}
          onClose={() => setShowMyReports(false)}
          onSelectReport={(lat, lng) => {
            setShowMyReports(false);
            // Could pan to the report location on map
          }}
        />
      )}
    </>
  );
}

export default App;
