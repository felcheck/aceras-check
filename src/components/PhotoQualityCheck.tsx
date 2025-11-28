"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface PhotoQualityCheckProps {
  imageSrc: string;
  onRetake: () => void;
  onContinue: () => void;
}

export default function PhotoQualityCheck({
  imageSrc,
  onRetake,
  onContinue,
}: PhotoQualityCheckProps) {
  const [sidewalkVisible, setSidewalkVisible] = useState<boolean | null>(null);
  const [notBlurry, setNotBlurry] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount before using portal
  useEffect(() => {
    setMounted(true);
  }, []);

  const canContinue = sidewalkVisible === true && notBlurry === true;
  const shouldRetake = sidewalkVisible === false || notBlurry === false;

  // Don't render until mounted (for portal)
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-gray-900 flex flex-col"
      style={{ height: '100dvh', width: '100vw', zIndex: 9999 }}
    >
      {/* Header */}
      <div className="p-4 pt-12 text-center">
        <h2 className="text-white text-xl font-semibold">Revisa tu Foto</h2>
        <p className="text-gray-400 text-sm mt-1">
          Confirma que la foto es clara antes de continuar
        </p>
      </div>

      {/* Photo Preview */}
      <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
        <img
          src={imageSrc}
          alt="Captured sidewalk"
          className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
        />
      </div>

      {/* Quality Questions */}
      <div className="bg-white rounded-t-3xl p-6 pb-10 space-y-4">
        {/* Question 1: Sidewalk visible */}
        <div>
          <p className="text-gray-800 font-medium mb-3">
            ¿Se puede ver claramente la acera?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setSidewalkVisible(true)}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                sidewalkVisible === true
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Sí
            </button>
            <button
              onClick={() => setSidewalkVisible(false)}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                sidewalkVisible === false
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              No
            </button>
          </div>
        </div>

        {/* Question 2: Not blurry */}
        <div>
          <p className="text-gray-800 font-medium mb-3">
            ¿No está borrosa la foto?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setNotBlurry(true)}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                notBlurry === true
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Sí, está clara
            </button>
            <button
              onClick={() => setNotBlurry(false)}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                notBlurry === false
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              No, está borrosa
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onRetake}
            className="flex-1 py-4 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Tomar Otra Foto
          </button>
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className={`flex-1 py-4 rounded-xl font-medium transition-colors ${
              canContinue
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Continuar
          </button>
        </div>

        {/* Helper message */}
        {shouldRetake && (
          <p className="text-center text-sm text-amber-600 mt-2">
            Por favor, toma otra foto donde se vea claramente la acera
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}
