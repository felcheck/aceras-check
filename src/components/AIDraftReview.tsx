"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { SidewalkAnalysis } from "@/app/api/analyze-sidewalk/route";

interface AIDraftReviewProps {
  imageSrc: string;
  analysis: SidewalkAnalysis;
  onSubmit: (analysis: SidewalkAnalysis, userModified: boolean) => void;
  onRetake: () => void;
  onClose: () => void;
}

export default function AIDraftReview({
  imageSrc,
  analysis,
  onSubmit,
  onRetake,
  onClose,
}: AIDraftReviewProps) {
  const [mounted, setMounted] = useState(false);
  const [editedAnalysis, setEditedAnalysis] = useState<SidewalkAnalysis>(analysis);
  const [isModified, setIsModified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  const handleFieldChange = <K extends keyof SidewalkAnalysis>(
    field: K,
    value: SidewalkAnalysis[K]
  ) => {
    setEditedAnalysis((prev) => ({ ...prev, [field]: value }));
    setIsModified(true);
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onSubmit(editedAnalysis, isModified);
  };

  if (!mounted) return null;

  const RatingSelector = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => onChange(rating)}
            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
              value === rating
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Malo</span>
        <span>Excelente</span>
      </div>
    </div>
  );

  return createPortal(
    <div
      className="fixed inset-0 bg-gray-100 overflow-y-auto"
      style={{ height: "100dvh", width: "100vw", zIndex: 9999 }}
    >
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Revisar Análisis</h1>
          <div className="w-6" /> {/* Spacer */}
        </div>
      </div>

      <div className="p-4 pb-32 max-w-lg mx-auto">
        {/* AI Confidence Banner */}
        {analysis.retakeRecommended && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <span className="text-amber-500 text-xl">⚠️</span>
              <div>
                <p className="text-amber-800 font-medium text-sm">
                  La IA recomienda tomar otra foto
                </p>
                <p className="text-amber-700 text-xs mt-1">
                  {analysis.qualityIssues.join(", ")}
                </p>
                <button
                  onClick={onRetake}
                  className="mt-2 text-amber-700 underline text-sm"
                >
                  Tomar otra foto
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photo Preview */}
        <div className="bg-white rounded-xl shadow-sm p-3 mb-4">
          <img
            src={imageSrc}
            alt="Captured sidewalk"
            className="w-full h-40 object-cover rounded-lg"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Confianza del análisis: {Math.round(analysis.confidence * 100)}%
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                analysis.imageQuality === "good"
                  ? "bg-green-100 text-green-700"
                  : analysis.imageQuality === "acceptable"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {analysis.imageQuality === "good"
                ? "Buena calidad"
                : analysis.imageQuality === "acceptable"
                ? "Calidad aceptable"
                : "Baja calidad"}
            </span>
          </div>
        </div>

        {/* AI Description */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción del AI
          </label>
          <textarea
            value={editedAnalysis.description}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            className="w-full p-3 border rounded-lg text-sm resize-none"
            rows={3}
          />
        </div>

        {/* Sidewalk Existence */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ¿Existe acera?
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => handleFieldChange("hasSidewalk", true)}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                editedAnalysis.hasSidewalk === true
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Sí
            </button>
            <button
              onClick={() => handleFieldChange("hasSidewalk", false)}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                editedAnalysis.hasSidewalk === false
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              No
            </button>
          </div>
        </div>

        {/* Width */}
        {editedAnalysis.hasSidewalk && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ancho de la acera
            </label>
            <div className="flex gap-2">
              {(["narrow", "adequate", "wide"] as const).map((width) => (
                <button
                  key={width}
                  onClick={() => handleFieldChange("sidewalkWidth", width)}
                  className={`flex-1 py-3 rounded-lg font-medium text-sm transition-colors ${
                    editedAnalysis.sidewalkWidth === width
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {width === "narrow"
                    ? "Angosta"
                    : width === "adequate"
                    ? "Adecuada"
                    : "Amplia"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ratings */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h3 className="font-medium text-gray-800 mb-4">Calificaciones</h3>

          <RatingSelector
            label="Condición del pavimento"
            value={editedAnalysis.conditionRating}
            onChange={(v) => handleFieldChange("conditionRating", v)}
          />

          <RatingSelector
            label="Seguridad general"
            value={editedAnalysis.safetyRating}
            onChange={(v) => handleFieldChange("safetyRating", v)}
          />

          <RatingSelector
            label="Accesibilidad (silla de ruedas/carriola)"
            value={editedAnalysis.accessibilityRating}
            onChange={(v) => handleFieldChange("accessibilityRating", v)}
          />

          <RatingSelector
            label="Ancho"
            value={editedAnalysis.widthRating}
            onChange={(v) => handleFieldChange("widthRating", v)}
          />
        </div>

        {/* Detected Issues */}
        {editedAnalysis.detectedIssues.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Problemas detectados
            </label>
            <div className="flex flex-wrap gap-2">
              {editedAnalysis.detectedIssues.map((issue, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm"
                >
                  {issue}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Obstructions */}
        {editedAnalysis.obstructions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Obstrucciones detectadas
            </label>
            <div className="flex flex-wrap gap-2">
              {editedAnalysis.obstructions.map((obs, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm"
                >
                  {obs}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-8">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={onRetake}
            className="flex-1 py-4 rounded-xl font-medium bg-gray-100 text-gray-700"
          >
            Tomar Otra Foto
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex-1 py-4 rounded-xl font-medium ${
              isSubmitting
                ? "bg-blue-400 text-white/80 cursor-not-allowed"
                : "bg-blue-500 text-white"
            }`}
          >
            {isSubmitting ? "Enviando..." : "Confirmar y Enviar"}
          </button>
        </div>
        {isModified && (
          <p className="text-center text-xs text-gray-500 mt-2">
            Has modificado el análisis del AI
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}
