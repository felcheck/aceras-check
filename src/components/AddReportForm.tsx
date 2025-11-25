"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/db";
import { id } from "@instantdb/react";
import { calculateSeguridadScore } from "@/lib/scoring";
import { SelectedLocation } from "@/types/location";
import imageCompression from "browser-image-compression";

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
  const [severity, setSeverity] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photo upload state
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SEGURIDAD fields
  const [hasSidewalk, setHasSidewalk] = useState<boolean | null>(null);
  const [hasLighting, setHasLighting] = useState<boolean | null>(null);
  const [comfortSpaceRating, setComfortSpaceRating] = useState<number | null>(null);
  const [obstructions, setObstructions] = useState<string[]>([]);

  // Accordion state
  const [seguridadOpen, setSeguridadOpen] = useState(true);
  const [otrosOpen, setOtrosOpen] = useState(true);

  // Completion checkers
  const isSeguridadComplete = (): boolean => {
    // Base fields (always required)
    if (hasSidewalk === null) return false;
    if (widthRating === null) return false;
    if (comfortSpaceRating === null) return false;
    if (hasLighting === null) return false;

    // Lighting quality (conditionally required)
    if (hasLighting === true && lightingRating === null) return false;

    return true;
  };

  const isOtrosComplete = (): boolean => {
    return (
      category !== "" &&
      description.trim() !== "" &&
      conditionRating !== null &&
      accessibilityRating !== null &&
      severity !== null
    );
  };

  // Cleanup photo preview on unmount
  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  // Auto-close effects
  useEffect(() => {
    if (isSeguridadComplete() && seguridadOpen) {
      const timer = setTimeout(() => setSeguridadOpen(false), 300);
      return () => clearTimeout(timer);
    }
  }, [hasSidewalk, widthRating, obstructions, comfortSpaceRating, hasLighting, lightingRating, seguridadOpen]);

  useEffect(() => {
    if (isOtrosComplete() && otrosOpen) {
      const timer = setTimeout(() => setOtrosOpen(false), 300);
      return () => clearTimeout(timer);
    }
  }, [category, description, conditionRating, accessibilityRating, severity, otrosOpen]);

  // Photo selection and compression handler
  const handlePhotoSelect = async (file: File) => {
    setIsCompressing(true);
    setUploadError("");

    // Clean up previous preview
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    try {
      // Validate file size (max 10MB original)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error("La foto es demasiado grande (máximo 10MB)");
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Tipo de archivo no soportado. Por favor selecciona una imagen.");
      }

      console.log(`Original photo: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/jpeg",
        initialQuality: 0.85,
      };

      const compressedFile = await imageCompression(file, options);

      console.log(
        `Compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
      );

      // Set compressed file and create preview
      setPhoto(compressedFile);
      const previewUrl = URL.createObjectURL(compressedFile);
      setPhotoPreview(previewUrl);
    } catch (error) {
      console.error("Photo compression error:", error);
      setUploadError(
        error instanceof Error ? error.message : "Error al procesar la foto. Intenta de nuevo."
      );
    } finally {
      setIsCompressing(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoSelect(file);
    }
  };

  const handleRemovePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhoto(null);
    setPhotoPreview(null);
    setUploadError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !description) {
      alert("Please fill in category and description");
      return;
    }

    if (severity === null) {
      alert("Please set the severity level");
      return;
    }

    setIsSubmitting(true);

    try {
      const reportId = id();
      let photoId: string | null = null;

      // Upload photo if present (already compressed)
      if (photo) {
        try {
          const path = `reports/${reportId}/${Date.now()}.jpg`;
          const { data } = await db.storage.uploadFile(path, photo, {
            contentType: "image/jpeg",
            contentDisposition: "inline",
          });
          photoId = data.id;
          console.log("Photo uploaded successfully:", photoId);
        } catch (uploadError) {
          console.error("Photo upload failed:", uploadError);
          setUploadError("No se pudo subir la foto, pero el reporte se guardará.");
        }
      }

      // Calculate SEGURIDAD score
      const seguridadScore = calculateSeguridadScore({
        hasSidewalk,
        widthRating,
        obstructions,
        comfortSpaceRating,
        hasLighting,
        lightingRating,
      });

      // Create report and link photo if uploaded
      const transactions = [
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
      ];

      // Add photo link if upload succeeded
      if (photoId) {
        transactions.push(db.tx.reports[reportId].link({ photos: photoId }));
      }

      await db.transact(transactions);

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating report:", error);
      alert("Failed to create report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  interface AccordionSectionProps {
    title: string;
    isComplete: boolean;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }

  const AccordionSection = ({
    title,
    isComplete,
    isOpen,
    onToggle,
    children,
  }: AccordionSectionProps) => {
    return (
      <div
        className={`border-2 rounded-lg mb-4 transition-colors ${
          isComplete ? "border-green-500" : "border-gray-300"
        }`}
      >
        {/* Header */}
        <button
          type="button"
          onClick={onToggle}
          className={`w-full px-4 py-3 flex items-center justify-between text-left font-semibold text-gray-800 ${
            isComplete && !isOpen ? "hover:bg-green-50" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {isOpen ? "▼" : "▶"}
            </span>
            <span>{title}</span>
            {isComplete && (
              <span className="text-green-600 text-xl">✓</span>
            )}
          </div>
        </button>

        {/* Content */}
        {isOpen && (
          <div className="px-4 py-4 border-t-2 border-gray-200">
            {children}
          </div>
        )}
      </div>
    );
  };

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

          {/* Photo Upload Section */}
          <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📸 Foto del Problema (opcional)
            </label>

            {!photo && !isCompressing && (
              <div className="flex flex-col items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/heic,image/heif,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photo-input"
                />
                <label
                  htmlFor="photo-input"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  + Tomar/Subir Foto
                </label>
                <p className="text-xs text-gray-500 text-center">
                  ℹ️ La foto se optimizará para envío rápido
                </p>
              </div>
            )}

            {isCompressing && (
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-sm text-gray-600">Procesando foto...</p>
              </div>
            )}

            {photo && photoPreview && !isCompressing && (
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-md"
                  />
                </div>
                <div className="flex gap-2">
                  <label
                    htmlFor="photo-input"
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer text-center text-sm"
                  >
                    Cambiar Foto
                  </label>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="flex-1 px-3 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors text-sm"
                  >
                    Quitar
                  </button>
                </div>
                <p className="text-xs text-green-600 text-center">
                  ✓ Foto lista para subir (~{(photo.size / 1024).toFixed(0)}KB)
                </p>
              </div>
            )}

            {uploadError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {uploadError}
              </div>
            )}
          </div>

          {/* SEGURIDAD Section */}
          <AccordionSection
            title="SEGURIDAD (Infraestructura)"
            isComplete={isSeguridadComplete()}
            isOpen={seguridadOpen}
            onToggle={() => setSeguridadOpen(!seguridadOpen)}
          >
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
          </AccordionSection>

          {/* Other Details Section */}
          <AccordionSection
            title="Otros Detalles"
            isComplete={isOtrosComplete()}
            isOpen={otrosOpen}
            onToggle={() => setOtrosOpen(!otrosOpen)}
          >
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
                Severidad: {severity !== null ? `${severity}/5` : "No seleccionado"}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={severity ?? 3}
                onChange={(e) => setSeverity(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Baja</span>
                <span>Alta</span>
              </div>
            </div>
          </AccordionSection>

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
              disabled={isSubmitting || isCompressing}
            >
              {isSubmitting
                ? photo
                  ? "Subiendo foto y reporte..."
                  : "Enviando reporte..."
                : "Enviar Reporte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
