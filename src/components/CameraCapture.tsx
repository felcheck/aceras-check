"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Webcam from "react-webcam";

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isCapturing, setIsCapturing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount before using portal
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUserMedia = useCallback(() => {
    setHasPermission(true);
  }, []);

  const handleUserMediaError = useCallback(() => {
    setHasPermission(false);
  }, []);

  const capture = useCallback(() => {
    if (webcamRef.current && !isCapturing) {
      setIsCapturing(true);
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        onCapture(imageSrc);
      }
      setIsCapturing(false);
    }
  }, [onCapture, isCapturing]);

  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  const videoConstraints = {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    facingMode: facingMode,
  };

  // Don't render until mounted (for portal)
  if (!mounted) return null;

  // Permission denied state
  if (hasPermission === false) {
    return createPortal(
      <div
        className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6"
        style={{ height: '100dvh', width: '100vw', zIndex: 9999 }}
      >
        <div className="text-white text-center max-w-sm">
          <div className="text-6xl mb-4">📷</div>
          <h2 className="text-xl font-semibold mb-2">Permiso de Cámara Requerido</h2>
          <p className="text-gray-300 mb-6">
            Para tomar fotos de las aceras, necesitamos acceso a tu cámara.
            Por favor, habilita el permiso en la configuración de tu navegador.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white text-black rounded-full font-medium"
          >
            Volver al Mapa
          </button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black overflow-hidden"
      style={{ height: '100dvh', width: '100vw', zIndex: 9999 }}
    >
      {/* Camera View - force video to fill entire viewport */}
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        screenshotQuality={0.92}
        videoConstraints={videoConstraints}
        onUserMedia={handleUserMedia}
        onUserMediaError={handleUserMediaError}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100dvh',
          objectFit: 'cover',
        }}
      />

      {/* Overlay Instructions */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top gradient for text readability */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />

        {/* Instructions at top */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-12 text-center">
          <h2 className="text-white text-lg font-semibold drop-shadow-lg">
            Fotografía la Acera
          </h2>
          <p className="text-white/90 text-sm mt-1 drop-shadow">
            Incluye la calle y la acera en la foto
          </p>
        </div>

        {/* Viewfinder guide */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[85%] max-w-md aspect-[4/3] border-2 border-white/50 rounded-lg">
            {/* Corner markers */}
            <div className="absolute -top-[2px] -left-[2px] w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <div className="absolute -top-[2px] -right-[2px] w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
            <div className="absolute -bottom-[2px] -left-[2px] w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <div className="absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
          </div>
        </div>

        {/* Tip at center-bottom of viewfinder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[85%] max-w-md aspect-[4/3] flex items-end justify-center pb-2">
            <span className="text-white/80 text-xs bg-black/40 px-3 py-1 rounded-full">
              Apunta hacia la acera
            </span>
          </div>
        </div>

        {/* Bottom gradient for controls */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-10">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Capture button */}
          <button
            onClick={capture}
            disabled={isCapturing || hasPermission === null}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center disabled:opacity-50 transition-transform active:scale-95"
          >
            <div className="w-16 h-16 rounded-full border-4 border-gray-800" />
          </button>

          {/* Flip camera button */}
          <button
            onClick={toggleCamera}
            className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading overlay while waiting for camera */}
      {hasPermission === null && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-4" />
            <p>Iniciando cámara...</p>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
