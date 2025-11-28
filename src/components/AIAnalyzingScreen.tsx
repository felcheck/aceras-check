"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface AIAnalyzingScreenProps {
  onCancel: () => void;
  error?: string | null;
  onRetry?: () => void;
}

export default function AIAnalyzingScreen({
  onCancel,
  error,
  onRetry,
}: AIAnalyzingScreenProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center p-6"
      style={{ height: "100dvh", width: "100vw", zIndex: 9999 }}
    >
      {error ? (
        // Error state
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-white text-xl font-semibold mb-2">
            Error al analizar
          </h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-6 bg-gray-700 text-white rounded-xl font-medium"
            >
              Cancelar
            </button>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 py-3 px-6 bg-blue-500 text-white rounded-xl font-medium"
              >
                Reintentar
              </button>
            )}
          </div>
        </div>
      ) : (
        // Loading state
        <div className="text-center">
          <div className="relative mb-6">
            {/* Outer ring */}
            <div className="w-24 h-24 rounded-full border-4 border-gray-700" />
            {/* Spinning ring */}
            <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
            {/* Inner icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">🔍</span>
            </div>
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">
            Analizando foto...
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            La IA está evaluando la condición de la acera
          </p>
          <button
            onClick={onCancel}
            className="text-gray-500 text-sm underline"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
