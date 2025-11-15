"use client";

import React, { useState } from "react";
import { db } from "@/lib/db";
import { id } from "@instantdb/react";
import { calculateSeguridadScore } from "@/lib/scoring";
import { SelectedLocation } from "@/types/location";

interface AddReportFormProps {
  location: SelectedLocation;
  onClose: () => void;
  onSuccess: () => void;
}

const REPORT_CATEGORIES = [
  { value: "missing_sidewalk", label: "Missing Sidewalk" },
  { value: "narrow_sidewalk", label: "Narrow Sidewalk" },
  { value: "broken_pavement", label: "Broken Pavement" },
  { value: "obstruction_vehicle", label: "Obstruction - Vehicle" },
  { value: "obstruction_vendor", label: "Obstruction - Vendor" },
  { value: "obstruction_construction", label: "Obstruction - Construction" },
  { value: "obstruction_business", label: "Obstruction - Business Encroachment" },
  { value: "missing_crossing", label: "Missing Crossing" },
  { value: "poor_lighting", label: "Poor Lighting" },
  { value: "safety_concern", label: "Safety Concern" },
  { value: "accessibility_issue", label: "Accessibility Issue" },
  { value: "positive_feedback", label: "Positive Feedback" },
];

const OBSTRUCTION_OPTIONS = [
  { value: "huecos", label: "Huecos/baches (holes/potholes)" },
  { value: "interrupciones", label: "Interrupciones (interruptions)" },
  { value: "carros_mal_estacionados", label: "Carros mal estacionados (illegally parked cars)" },
  { value: "construccion", label: "Construcción (construction)" },
  { value: "vendedores", label: "Vendedores (vendors)" },
];

export default function AddReportForm({
  location,
  onClose,
  onSuccess,
}: AddReportFormProps) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [conditionRating, setConditionRating] = useState<number | null>(null);
  const [widthRating, setWidthRating] = useState<number | null>(null);
  const [safetyRating, setSafetyRating] = useState<number | null>(null);
  const [lightingRating, setLightingRating] = useState<number | null>(null);
  const [accessibilityRating, setAccessibilityRating] = useState<number | null>(null);
  const [severity, setSeverity] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SEGURIDAD fields
  const [hasSidewalk, setHasSidewalk] = useState<boolean | null>(null);
  const [hasLighting, setHasLighting] = useState<boolean | null>(null);
  const [comfortSpaceRating, setComfortSpaceRating] = useState<number | null>(null);
  const [obstructions, setObstructions] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !description) {
      alert("Please fill in category and description");
      return;
    }

    setIsSubmitting(true);

    try {
      const reportId = id();

      // Calculate SEGURIDAD score
      const seguridadScore = calculateSeguridadScore({
        hasSidewalk,
        widthRating,
        obstructions,
        comfortSpaceRating,
        hasLighting,
        lightingRating,
      });

      await db.transact([
        db.tx.reports[reportId].update({
          category,
          description,
          lat: location.lat,
          lng: location.lng,
          status: "pending",
          verified: false,
          createdAt: Date.now(),
          severity,
          // Optional ratings with defaults
          conditionRating: conditionRating || 0,
          widthRating: widthRating || 0,
          safetyRating: safetyRating || 0,
          lightingRating: lightingRating || 0,
          accessibilityRating: accessibilityRating || 0,
          // SEGURIDAD fields
          hasSidewalk: hasSidewalk,
          hasLighting: hasLighting,
          comfortSpaceRating: comfortSpaceRating,
          obstructions: obstructions,
          seguridadScore: seguridadScore,
          // Optional fields with defaults
          roadId: "",
          roadName: location.roadName || location.addressLabel || "",
          distanceFromRoad: 0,
          updatedAt: Date.now(),
        }),
      ]);

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating report:", error);
      alert("Failed to create report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const SectionHeading = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-base font-bold text-gray-800 mb-3 pb-2 border-b-2 border-blue-500">
      {children}
    </h3>
  );

  const BooleanToggle = ({
    value,
    onChange,
    label,
  }: {
    value: boolean | null;
    onChange: (val: boolean) => void;
    label: string;
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-4 py-2 rounded-md border-2 transition-colors ${
            value === true
              ? "bg-green-500 text-white border-green-600"
              : "bg-white text-gray-700 border-gray-300 hover:border-green-400"
          }`}
        >
          Sí
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-4 py-2 rounded-md border-2 transition-colors ${
            value === false
              ? "bg-red-500 text-white border-red-600"
              : "bg-white text-gray-700 border-gray-300 hover:border-red-400"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );

  const CheckboxGroup = ({
    value,
    onChange,
    label,
    options,
  }: {
    value: string[];
    onChange: (val: string[]) => void;
    label: string;
    options: { value: string; label: string }[];
  }) => {
    const handleToggle = (optionValue: string) => {
      if (value.includes(optionValue)) {
        onChange(value.filter((v) => v !== optionValue));
      } else {
        onChange([...value, optionValue]);
      }
    };

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="space-y-2">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={() => handleToggle(option.value)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const StarRating = ({
    value,
    onChange,
    label,
  }: {
    value: number | null;
    onChange: (val: number) => void;
    label: string;
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-2xl ${
              value && value >= star ? "text-yellow-400" : "text-gray-300"
            } hover:text-yellow-400 transition-colors`}
          >
            ★
          </button>
        ))}
        {value && (
          <span className="ml-2 text-sm text-gray-600 self-center">
            {value}/5
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            Report Walkability Issue
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Location Display */}
          <div className="mb-6 p-3 bg-gray-50 rounded text-sm text-gray-600">
            <p className="font-semibold text-gray-800">
              📍{" "}
              {location.isAddressLoading
                ? "Cargando dirección..."
                : location.addressLabel || "Ubicación seleccionada"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          </div>

          {/* SEGURIDAD Section */}
          <div className="mb-6">
            <SectionHeading>SEGURIDAD (Infraestructura)</SectionHeading>

            <BooleanToggle
              label="1. ¿Existe la acera?"
              value={hasSidewalk}
              onChange={setHasSidewalk}
            />

            <StarRating
              label="2. ¿Es lo suficientemente amplia?"
              value={widthRating}
              onChange={setWidthRating}
            />

            <CheckboxGroup
              label="3. ¿Hay obstáculos?"
              value={obstructions}
              onChange={setObstructions}
              options={OBSTRUCTION_OPTIONS}
            />

            <StarRating
              label="4. ¿Es de buen tamaño relativo a la carretera?"
              value={comfortSpaceRating}
              onChange={setComfortSpaceRating}
            />

            <BooleanToggle
              label="5. ¿Hay luminaria?"
              value={hasLighting}
              onChange={setHasLighting}
            />

            {hasLighting === true && (
              <div className="ml-4 pl-4 border-l-2 border-gray-300">
                <StarRating
                  label="¿Qué tan buena es la iluminación?"
                  value={lightingRating}
                  onChange={setLightingRating}
                />
              </div>
            )}
          </div>

          {/* Other Details Section */}
          <div className="mb-6 border-t pt-6">
            <SectionHeading>Otros Detalles</SectionHeading>

            {/* Category */}
            <div className="mb-4">
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Categoría del problema
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona una categoría...</option>
                {REPORT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <StarRating
              label="Condición general"
              value={conditionRating}
              onChange={setConditionRating}
            />

            <StarRating
              label="Accesibilidad (silla de ruedas)"
              value={accessibilityRating}
              onChange={setAccessibilityRating}
            />

            {/* Description */}
            <div className="mb-4">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Notas adicionales
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe el problema en detalle..."
              />
            </div>

            {/* Severity */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severidad: {severity}/5
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={severity}
                onChange={(e) => setSeverity(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Baja</span>
                <span>Alta</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar Reporte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
