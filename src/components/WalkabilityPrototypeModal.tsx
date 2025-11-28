"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, PanInfo, animate } from "framer-motion";
import { SelectedLocation } from "@/types/location";
import imageCompression from "browser-image-compression";
import { db } from "@/lib/db";

type BucketId = "utilidad" | "seguridad" | "comodidad" | "interesante";

interface WalkabilityPrototypeModalProps {
  location: SelectedLocation;
  isExpanded: boolean;
  onExpand: () => void;
  onClose: () => void;
  capturedImage?: string | null;
}

const UTILIDAD_OPTIONS = [
  { id: "park", label: "Parque" },
  { id: "market", label: "Supermercado" },
  { id: "clinic", label: "Hospital/Clínica" },
  { id: "shops", label: "Tiendas/Restaurantes" },
  { id: "work", label: "Trabajo/Escuela" },
] as const;

const SEGURIDAD_OBSTRUCTIONS = [
  { id: "holes", label: "Huecos/Baches" },
  { id: "interruptions", label: "Interrupciones" },
  { id: "cars", label: "Carros Mal Estacionados" },
] as const;

const COMODIDAD_CONTAMINANTS = [
  { id: "trash", label: "Basura" },
  { id: "smell", label: "Olores" },
  { id: "smoke", label: "Humo" },
  { id: "noise", label: "Ruido" },
] as const;

const WALKABILITY_META: Record<
  BucketId,
  { title: string; color: string; max: number; description: string }
> = {
  utilidad: {
    title: "UTILIDAD",
    color: "bg-emerald-500",
    max: 1,
    description: "Qué tan útil es el entorno (lugares a 15 min)",
  },
  seguridad: {
    title: "SEGURIDAD",
    color: "bg-red-500",
    max: 5,
    description: "Infraestructura básica para caminar seguro",
  },
  comodidad: {
    title: "COMODIDAD",
    color: "bg-sky-500",
    max: 2,
    description: "Sombra, ruido y confort climático",
  },
  interesante: {
    title: "INTERESANTE",
    color: "bg-purple-500",
    max: 2,
    description: "Qué tanto te invita a quedarte (comercio, vibra)",
  },
};

interface WalkabilityState {
  utilidad: {
    amenities: Record<(typeof UTILIDAD_OPTIONS)[number]["id"], boolean>;
  };
  seguridad: {
    hasSidewalk: boolean | null;
    widthRating: number;
    obstructions: string[];
    comfortSpaceRating: number;
    hasLighting: boolean | null;
    lightingRating: number;
  };
  comodidad: {
    shadeRating: number;
    contaminants: string[];
    contaminationSeverity: number;
  };
  interesante: {
    hasCommerce: boolean | null;
    commerceCount: number;
    vibeRating: number;
  };
}

const DEFAULT_STATE: WalkabilityState = {
  utilidad: {
    amenities: {
      park: false,
      market: false,
      clinic: false,
      shops: false,
      work: false,
    },
  },
  seguridad: {
    hasSidewalk: null,
    widthRating: 0,
    obstructions: [],
    comfortSpaceRating: 0,
    hasLighting: null,
    lightingRating: 0,
  },
  comodidad: {
    shadeRating: 0,
    contaminants: [],
    contaminationSeverity: 0,
  },
  interesante: {
    hasCommerce: null,
    commerceCount: 0,
    vibeRating: 0,
  },
};

function calculateUtilidadScore(state: WalkabilityState["utilidad"]) {
  const toggled = Object.values(state.amenities).filter(Boolean).length;
  return Math.min(1, toggled * 0.2);
}

function calculateSeguridadScore(state: WalkabilityState["seguridad"]) {
  let score = 0;
  if (state.hasSidewalk) score += 1;
  if (state.widthRating >= 4) score += 1;
  else if (state.widthRating === 3) score += 0.5;
  let obstructionScore = 1 - state.obstructions.length * 0.25;
  score += Math.max(0, obstructionScore);
  if (state.comfortSpaceRating >= 4) score += 1;
  else if (state.comfortSpaceRating === 3) score += 0.5;
  if (state.hasLighting && state.lightingRating >= 4) score += 1;
  else if (state.hasLighting && state.lightingRating >= 2) score += 0.5;
  return Math.min(5, score);
}

function calculateComodidadScore(state: WalkabilityState["comodidad"]) {
  let score = 0;
  if (state.shadeRating >= 4) score += 1;
  else if (state.shadeRating === 3) score += 0.5;
  let contaminationScore =
    1 - state.contaminants.length * 0.3 - (state.contaminationSeverity >= 4 ? 0.2 : 0);
  score += Math.max(0, contaminationScore);
  return Math.min(2, score);
}

function calculateInteresanteScore(state: WalkabilityState["interesante"]) {
  let score = 0;
  if (state.hasCommerce) {
    score += 1;
    if (state.commerceCount >= 3) {
      score += 0.5;
    }
  }
  score += Math.min(1, Math.max(0, state.vibeRating / 5));
  return Math.min(2, score);
}

function useWalkabilityState() {
  const [state, setState] = useState<WalkabilityState>(DEFAULT_STATE);

  const updateBucket = <K extends BucketId>(
    bucket: K,
    updater: (prev: WalkabilityState[K]) => WalkabilityState[K]
  ) => {
    setState((prev) => ({
      ...prev,
      [bucket]: updater(prev[bucket]),
    }));
  };

  const scores = useMemo(() => {
    const utilidadScore = calculateUtilidadScore(state.utilidad);
    const seguridadScore = calculateSeguridadScore(state.seguridad);
    const comodidadScore = calculateComodidadScore(state.comodidad);
    const interesanteScore = calculateInteresanteScore(state.interesante);

    return {
      utilidad: utilidadScore,
      seguridad: seguridadScore,
      comodidad: comodidadScore,
      interesante: interesanteScore,
      total: utilidadScore + seguridadScore + comodidadScore + interesanteScore,
    };
  }, [state]);

  return { state, scores, updateBucket };
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
      }`}
    >
      {children}
    </button>
  );
}

function StarInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (val: number) => void;
  label?: string;
}) {
  return (
    <div className="space-y-1">
      {label && <p className="text-xs text-gray-500">{label}</p>}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-2xl ${
              value >= star ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </button>
        ))}
        <span className="text-sm text-gray-500 ml-2">{value}/5</span>
      </div>
    </div>
  );
}

function BucketContent({
  bucket,
  state,
  updateBucket,
}: {
  bucket: BucketId;
  state: WalkabilityState;
  updateBucket: ReturnType<typeof useWalkabilityState>["updateBucket"];
}) {
  switch (bucket) {
    case "utilidad":
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Marca los lugares que puedes alcanzar caminando en 10-15 minutos.
          </p>
          <div className="flex flex-wrap gap-2">
            {UTILIDAD_OPTIONS.map((option) => (
              <ToggleChip
                key={option.id}
                active={state.utilidad.amenities[option.id]}
                onClick={() =>
                  updateBucket("utilidad", (prev) => ({
                    amenities: {
                      ...prev.amenities,
                      [option.id]: !prev.amenities[option.id],
                    },
                  }))
                }
              >
                {option.label}
              </ToggleChip>
            ))}
          </div>
        </div>
      );
    case "seguridad":
      return (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">¿Existe una acera?</p>
            <div className="flex gap-2">
              <ToggleChip
                active={state.seguridad.hasSidewalk === true}
                onClick={() =>
                  updateBucket("seguridad", (prev) => ({
                    ...prev,
                    hasSidewalk: true,
                  }))
                }
              >
                Sí
              </ToggleChip>
              <ToggleChip
                active={state.seguridad.hasSidewalk === false}
                onClick={() =>
                  updateBucket("seguridad", (prev) => ({
                    ...prev,
                    hasSidewalk: false,
                  }))
                }
              >
                No
              </ToggleChip>
            </div>
          </div>
          <StarInput
            value={state.seguridad.widthRating}
            label="¿Es lo suficientemente amplia?"
            onChange={(val) =>
              updateBucket("seguridad", (prev) => ({
                ...prev,
                widthRating: val,
              }))
            }
          />
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Obstáculos presentes (resta puntos)
            </p>
            <div className="flex flex-wrap gap-2">
              {SEGURIDAD_OBSTRUCTIONS.map((option) => (
                <ToggleChip
                  key={option.id}
                  active={state.seguridad.obstructions.includes(option.id)}
                  onClick={() =>
                    updateBucket("seguridad", (prev) => ({
                      ...prev,
                      obstructions: prev.obstructions.includes(option.id)
                        ? prev.obstructions.filter((id) => id !== option.id)
                        : [...prev.obstructions, option.id],
                    }))
                  }
                >
                  {option.label}
                </ToggleChip>
              ))}
            </div>
          </div>
          <StarInput
            value={state.seguridad.comfortSpaceRating}
            label="¿Se siente separada del tráfico?"
            onChange={(val) =>
              updateBucket("seguridad", (prev) => ({
                ...prev,
                comfortSpaceRating: val,
              }))
            }
          />
          <div>
            <p className="text-sm text-gray-600 mb-2">¿Hay luminaria?</p>
            <div className="flex gap-2">
              <ToggleChip
                active={state.seguridad.hasLighting === true}
                onClick={() =>
                  updateBucket("seguridad", (prev) => ({
                    ...prev,
                    hasLighting: true,
                  }))
                }
              >
                Sí
              </ToggleChip>
              <ToggleChip
                active={state.seguridad.hasLighting === false}
                onClick={() =>
                  updateBucket("seguridad", (prev) => ({
                    ...prev,
                    hasLighting: false,
                  }))
                }
              >
                No
              </ToggleChip>
            </div>
          </div>
          {state.seguridad.hasLighting && (
            <StarInput
              value={state.seguridad.lightingRating}
              label="¿Qué tan buena es la iluminación?"
              onChange={(val) =>
                updateBucket("seguridad", (prev) => ({
                  ...prev,
                  lightingRating: val,
                }))
              }
            />
          )}
        </div>
      );
    case "comodidad":
      return (
        <div className="space-y-4">
          <StarInput
            value={state.comodidad.shadeRating}
            label="¿Qué tanta sombra/cobertura existe?"
            onChange={(val) =>
              updateBucket("comodidad", (prev) => ({
                ...prev,
                shadeRating: val,
              }))
            }
          />
          <div>
            <p className="text-sm text-gray-600 mb-2">
              ¿Percibes algún tipo de contaminación?
            </p>
            <div className="flex flex-wrap gap-2">
              {COMODIDAD_CONTAMINANTS.map((option) => (
                <ToggleChip
                  key={option.id}
                  active={state.comodidad.contaminants.includes(option.id)}
                  onClick={() =>
                    updateBucket("comodidad", (prev) => ({
                      ...prev,
                      contaminants: prev.contaminants.includes(option.id)
                        ? prev.contaminants.filter((id) => id !== option.id)
                        : [...prev.contaminants, option.id],
                    }))
                  }
                >
                  {option.label}
                </ToggleChip>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">¿Qué tan fuerte es?</p>
            <input
              type="range"
              min={1}
              max={5}
              value={state.comodidad.contaminationSeverity}
              onChange={(e) =>
                updateBucket("comodidad", (prev) => ({
                  ...prev,
                  contaminationSeverity: Number(e.target.value),
                }))
              }
              className="w-full accent-sky-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Suave</span>
              <span>Muy fuerte</span>
            </div>
          </div>
        </div>
      );
    case "interesante":
      return (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              ¿Hay comercios en planta baja?
            </p>
            <div className="flex gap-2">
              <ToggleChip
                active={state.interesante.hasCommerce === true}
                onClick={() =>
                  updateBucket("interesante", (prev) => ({
                    ...prev,
                    hasCommerce: true,
                  }))
                }
              >
                Sí
              </ToggleChip>
              <ToggleChip
                active={state.interesante.hasCommerce === false}
                onClick={() =>
                  updateBucket("interesante", (prev) => ({
                    ...prev,
                    hasCommerce: false,
                  }))
                }
              >
                No
              </ToggleChip>
            </div>
          </div>
          {state.interesante.hasCommerce && (
            <div className="space-y-1">
              <p className="text-sm text-gray-600">¿Cuántos negocios ves?</p>
              <input
                type="number"
                min={0}
                max={10}
                value={state.interesante.commerceCount}
                onChange={(e) =>
                  updateBucket("interesante", (prev) => ({
                    ...prev,
                    commerceCount: Number(e.target.value),
                  }))
                }
                className="w-24 rounded-md border border-gray-300 px-3 py-1"
              />
            </div>
          )}
          <StarInput
            value={state.interesante.vibeRating}
            label="¿Qué tan interesante se siente?"
            onChange={(val) =>
              updateBucket("interesante", (prev) => ({
                ...prev,
                vibeRating: val,
              }))
            }
          />
        </div>
      );
    default:
      return null;
  }
}

function AccordionPrototype({
  openBuckets,
  toggleBucket,
  state,
  scores,
  updateBucket,
}: {
  openBuckets: Record<BucketId, boolean>;
  toggleBucket: (id: BucketId) => void;
  state: WalkabilityState;
  scores: ReturnType<typeof useWalkabilityState>["scores"];
  updateBucket: ReturnType<typeof useWalkabilityState>["updateBucket"];
}) {
  // Define section order with SEGURIDAD first (per intake criteria priority)
  const BUCKET_ORDER: BucketId[] = ['seguridad', 'utilidad', 'comodidad', 'interesante'];

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {BUCKET_ORDER.map((bucket) => {
        const meta = WALKABILITY_META[bucket];
        const isOpen = openBuckets[bucket];
        const currentScore = (scores as Record<BucketId, number>)[bucket];
        const isComplete = currentScore >= meta.max * 0.5; // Simple completion check

        return (
          <div key={bucket} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <button
              type="button"
              onClick={() => toggleBucket(bucket)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              aria-expanded={isOpen}
            >
              {/* Left: Icon + Label + Score */}
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    {meta.title}
                    {isComplete && (
                      <span className="text-green-600 text-lg">✓</span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {currentScore.toFixed(1)} / {meta.max}
                  </p>
                </div>
              </div>

              {/* Right: Chevron with rotation */}
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Panel content */}
            <div
              hidden={!isOpen}
              className="px-6 py-4 bg-gray-50 dark:bg-gray-900"
            >
              <BucketContent
                bucket={bucket}
                state={state}
                updateBucket={updateBucket}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StepperPrototype({
  activeStep,
  setActiveStep,
  state,
  updateBucket,
}: {
  activeStep: number;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  state: WalkabilityState;
  updateBucket: ReturnType<typeof useWalkabilityState>["updateBucket"];
}) {
  const bucketIds = Object.keys(WALKABILITY_META) as BucketId[];

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap gap-2 mb-6">
        {bucketIds.map((bucket, index) => {
          const meta = WALKABILITY_META[bucket];
          const isActive = index === activeStep;
          return (
            <button
              key={bucket}
              className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
              }`}
              onClick={() => setActiveStep(index)}
            >
              {meta.title}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto">
        <BucketContent
          bucket={bucketIds[activeStep]}
          state={state}
          updateBucket={updateBucket}
        />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
          disabled={activeStep === 0}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-50"
        >
          ← Regresar
        </button>
        <p className="text-sm text-gray-500">Paso {activeStep + 1} de 4</p>
        <button
          type="button"
          onClick={() => setActiveStep((prev) => Math.min(bucketIds.length - 1, prev + 1))}
          disabled={activeStep === bucketIds.length - 1}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}

function DualPanePrototype({
  state,
  updateBucket,
  scores,
}: {
  state: WalkabilityState;
  updateBucket: ReturnType<typeof useWalkabilityState>["updateBucket"];
  scores: ReturnType<typeof useWalkabilityState>["scores"];
}) {
  const bucketIds = Object.keys(WALKABILITY_META) as BucketId[];
  const bucketRefs = useRef<Record<BucketId, HTMLDivElement | null>>({
    utilidad: null,
    seguridad: null,
    comodidad: null,
    interesante: null,
  });

  return (
    <div className="md:flex gap-6 h-full">
      <div className="md:w-1/3 mb-4 md:mb-0">
        <div className="space-y-3">
          {bucketIds.map((bucket) => {
            const meta = WALKABILITY_META[bucket];
            const currentScore = (scores as Record<BucketId, number>)[bucket];
            const percentage = (currentScore / meta.max) * 100;
            return (
              <button
                key={bucket}
                type="button"
                onClick={() => bucketRefs.current[bucket]?.scrollIntoView({ behavior: "smooth" })}
                className="w-full rounded-xl border border-gray-200 p-3 text-left shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{meta.title}</p>
                  <span className="text-xs text-gray-500">
                    {currentScore.toFixed(1)} / {meta.max}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${meta.color}`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{meta.description}</p>
              </button>
            );
          })}
        </div>
      </div>
      <div className="md:w-2/3 h-full overflow-y-auto space-y-8 pr-1">
        {bucketIds.map((bucket) => (
          <div
            key={bucket}
            ref={(node) => {
              bucketRefs.current[bucket] = node;
            }}
            className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold">{WALKABILITY_META[bucket].title}</p>
                <p className="text-xs text-gray-500">{WALKABILITY_META[bucket].description}</p>
              </div>
              <span className="text-sm font-semibold text-gray-600">
                {(scores as Record<BucketId, number>)[bucket].toFixed(1)} /{" "}
                {WALKABILITY_META[bucket].max}
              </span>
            </div>
            <BucketContent bucket={bucket} state={state} updateBucket={updateBucket} />
          </div>
        ))}
      </div>
    </div>
  );
}

type DrawerState = 'collapsed' | 'expanded';

// Walkability Drawer Component (renamed from WalkabilityPrototypeModal)
export default function WalkabilityDrawer({
  location,
  isExpanded,
  onExpand,
  onClose,
  capturedImage,
}: WalkabilityPrototypeModalProps) {
  const { state, scores, updateBucket } = useWalkabilityState();
  const [openBuckets, setOpenBuckets] = useState<Record<BucketId, boolean>>({
    utilidad: true,
    seguridad: true,
    comodidad: true,
    interesante: true,
  });

  // Photo upload state
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(capturedImage || null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPhotoDragging, setIsPhotoDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Internal state for 3-snap-point system
  const [drawerState, setDrawerState] = useState<DrawerState>('collapsed');

  // Height-based animation (keeps bottom anchored)
  const isDragging = useRef(false);
  const height = useMotionValue(145); // Start at collapsed height

  // Calculate target heights for each state (two-state system)
  const getTargetHeight = (state: DrawerState): number => {
    if (state === 'collapsed') return 145; // px - compact to avoid blocking mobile geolocation button
    return window.innerHeight; // 100vh for expanded
  };

  // Sync with parent's isExpanded prop
  useEffect(() => {
    if (isExpanded) {
      setDrawerState('expanded');
    } else if (drawerState === 'expanded') {
      // When parent closes, go to collapsed (skip half)
      setDrawerState('collapsed');
    }
  }, [isExpanded]);

  const toggleBucket = (bucket: BucketId) => {
    setOpenBuckets(prev => ({ ...prev, [bucket]: !prev[bucket] }));
  };

  // Sync photoPreview with capturedImage prop
  useEffect(() => {
    if (capturedImage) {
      setPhotoPreview(capturedImage);
    }
  }, [capturedImage]);

  // Photo cleanup effect
  useEffect(() => {
    return () => {
      // Only revoke if it's an object URL (not a base64 data URL from camera)
      if (photoPreview && photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  // Photo compression handler
  const handlePhotoSelect = async (file: File) => {
    setIsCompressing(true);
    setUploadError("");

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    try {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error("La foto es demasiado grande (máximo 10MB)");
      }

      if (!file.type.startsWith("image/")) {
        throw new Error("Tipo de archivo no soportado. Por favor selecciona una imagen.");
      }

      console.log(`Original photo: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/jpeg" as const,
        initialQuality: 0.85,
      };

      const compressedFile = await imageCompression(file, options);

      console.log(`Compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);

      setPhoto(compressedFile);
      const previewUrl = URL.createObjectURL(compressedFile);
      setPhotoPreview(previewUrl);
    } catch (error) {
      console.error("Photo compression error:", error);
      setUploadError(error instanceof Error ? error.message : "Error al procesar la foto. Intenta de nuevo.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handlePhotoRemove = () => {
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

  const handlePhotoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPhotoDragging(true);
  };

  const handlePhotoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPhotoDragging(false);
  };

  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPhotoDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        handlePhotoSelect(file);
      } else {
        setUploadError("Por favor arrastra una imagen válida");
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setUploadError("");

    try {
      // Generate report ID
      const reportId = crypto.randomUUID();

      // Upload photo if present
      let photoId: string | null = null;
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

      // Create report with walkability scores
      const transactions: any[] = [
        db.tx.reports[reportId].update({
          lat: location.lat,
          lng: location.lng,
          address: location.addressLabel || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
          utilidadScore: scores.utilidad,
          seguridadScore: scores.seguridad,
          comodidadScore: scores.comodidad,
          interesanteScore: scores.interesante,
          totalScore: scores.total,
          walkabilityState: JSON.stringify(state),
          createdAt: Date.now(),
        }),
      ];

      // Link photo if uploaded
      if (photoId) {
        transactions.push(db.tx.reports[reportId].link({ photos: photoId }));
      }

      await db.transact(transactions);

      console.log("Walkability check saved successfully");

      // Close drawer and reset
      onClose();
      handlePhotoRemove();
    } catch (error) {
      console.error("Submit error:", error);
      setUploadError(error instanceof Error ? error.message : "Error al guardar. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lock body scroll whenever drawer is mounted (prevent page scroll on mobile during all interactions)
  useEffect(() => {
    // Save original overflow
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;

    // Lock scroll - applies to ALL drawer states to prevent scroll during drag
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    // Cleanup: restore scroll on unmount
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
    };
  }, []); // Empty deps - lock for entire component lifetime

  const totalMax =
    WALKABILITY_META.utilidad.max +
    WALKABILITY_META.seguridad.max +
    WALKABILITY_META.comodidad.max +
    WALKABILITY_META.interesante.max;

  // Research-based spring physics (Google Maps feel)
  const springConfig = {
    type: "spring" as const,
    stiffness: 350,  // More responsive (was 200)
    damping: 35,     // Tuned for 0.8 damping ratio (was 30)
    mass: 0.8,       // Lighter feel (was 1)
    restDelta: 0.001, // Stricter settle threshold
    restSpeed: 0.01   // Stop spring sooner
  };

  // Animate height when state changes
  useEffect(() => {
    if (!isDragging.current) {
      const targetHeight = getTargetHeight(drawerState);
      animate(height, targetHeight, springConfig);
    }
  }, [drawerState]);

  // Handle pan (drag) - adjusts height in real-time
  const handlePan = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isDragging.current = true;

    // Dragging up (negative delta.y) should INCREASE height
    // Dragging down (positive delta.y) should DECREASE height
    const currentHeight = height.get();
    const newHeight = currentHeight - info.delta.y; // Subtract because up is negative

    // Clamp between min and max with rubber banding effect
    const minHeight = 145; // Match collapsed height
    const maxHeight = window.innerHeight;

    if (newHeight < minHeight) {
      // Rubber band below minimum
      const excess = minHeight - newHeight;
      const damped = minHeight - excess * 0.3; // 30% resistance
      height.set(damped);
    } else if (newHeight > maxHeight) {
      // Rubber band above maximum
      const excess = newHeight - maxHeight;
      const damped = maxHeight + excess * 0.3; // 30% resistance
      height.set(damped);
    } else {
      height.set(newHeight);
    }
  };

  // Handle pan end - binary snap (two-state system)
  const handlePanEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isDragging.current = false;

    // Get current height and velocity
    const currentHeight = height.get();
    const velocity = -info.velocity.y; // Invert: up is positive velocity

    // Two-state thresholds (simpler, more predictable)
    const VELOCITY_THRESHOLD = 500;   // px/s - commit to state change
    const DISTANCE_THRESHOLD = 0.25;  // 25% of screen height

    const collapsedHeight = getTargetHeight('collapsed');
    const expandedHeight = getTargetHeight('expanded');
    const screenHeight = window.innerHeight;

    // Calculate how far we've dragged from starting position
    const draggedDistance = Math.abs(currentHeight - getTargetHeight(drawerState));
    const dragRatio = draggedDistance / screenHeight;

    // Determine target state based on velocity OR distance
    let targetState: DrawerState;

    if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
      // Strong fling - follow the direction
      if (velocity > 0) {
        // Fling up = expand
        targetState = 'expanded';
        if (drawerState !== 'expanded') onExpand();
      } else {
        // Fling down = collapse (NOT close)
        targetState = 'collapsed';
        // Don't call onClose() - just collapse
      }
    } else if (dragRatio > DISTANCE_THRESHOLD) {
      // Dragged far enough - toggle state
      if (drawerState === 'collapsed') {
        targetState = 'expanded';
        onExpand();
      } else {
        // Collapse (NOT close)
        targetState = 'collapsed';
        // Don't call onClose() - just collapse
      }
    } else {
      // Small movement - snap back to current state
      targetState = drawerState;
    }

    setDrawerState(targetState);
  };

  // Single unified drawer - smoothly transitions between 2 states (collapsed ↔ expanded)
  return (
    <>
      {/* Backdrop - visible only when expanded, closes drawer completely */}
      {drawerState === 'expanded' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={springConfig}
          className="fixed inset-0 z-[499] bg-black/50"
          onClick={onClose}
        />
      )}

      {/* Bottom-anchored drawer - height animates, bottom stays at 0 */}
      <div
        className={`fixed z-[500] bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:w-[768px]`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <motion.div
          style={{ height, touchAction: 'none' }}  // Height animates - bottom stays fixed! touchAction prevents browser scroll
          onPan={handlePan}
          onPanEnd={handlePanEnd}
          className={`bg-white dark:bg-gray-900 mx-auto shadow-2xl ${
            drawerState === 'expanded'
              ? 'rounded-t-3xl md:rounded-3xl overflow-hidden flex flex-col'
              : 'rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col'
          }`}
        >
            {/* Handle bar - visual indicator for drag */}
            <div className="flex justify-center pt-3 pb-2 w-full cursor-grab active:cursor-grabbing select-none touch-none relative">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              {/* X button - consistent position in both states */}
              <button
                onClick={onClose}
                className="absolute right-4 top-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

          {drawerState === 'collapsed' ? (
            // Collapsed: Location + CTA Button (compact to avoid blocking geolocation button)
            <div
              className="px-6 pt-1"
              style={{ paddingBottom: 'max(1rem, calc(1rem + env(safe-area-inset-bottom)))' }}
            >
              {/* Location coordinates */}
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {location.isAddressLoading
                  ? "Cargando dirección..."
                  : location.addressLabel ||
                    `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </div>
              </div>

              {/* Action button */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDrawerState('expanded');
                    onExpand();
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-colors"
                >
                  Chequear Acera Aquí
                </button>
              </div>
            </div>
          ) : (
            // Expanded: Full form
            <>
        <div className="px-6 pt-4 pb-2 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Nuevo Chequeo de Acera
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {location.addressLabel || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}
          </p>
        </div>

              <div
                className="flex-1 overflow-y-auto px-6 pt-4"
                style={{ paddingBottom: 'max(1rem, calc(1rem + env(safe-area-inset-bottom)))' }}
              >
                <AccordionPrototype
                  openBuckets={openBuckets}
                  toggleBucket={toggleBucket}
                  state={state}
                  scores={scores}
                  updateBucket={updateBucket}
                />

                {/* Photo Upload Section */}
                <div
                  className={`mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 transition-colors ${
                    isPhotoDragging ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                  onDragOver={handlePhotoDragOver}
                  onDragLeave={handlePhotoDragLeave}
                  onDrop={handlePhotoDrop}
                >
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    📸 Foto del Problema (opcional)
                  </h3>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoSelect(file);
                    }}
                    disabled={isCompressing || isSubmitting}
                  />

                  {!photoPreview && !isCompressing && (
                    <button
                      type="button"
                      onClick={handleOpenFilePicker}
                      disabled={isSubmitting}
                      className={`w-full border-2 border-dashed rounded-lg px-4 py-8 text-center transition-colors disabled:opacity-50 ${
                        isPhotoDragging
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                          : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
                      }`}
                    >
                      <span className="text-4xl mb-2 block">📷</span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        {isPhotoDragging ? "Suelta la imagen aquí" : "+ Tomar/Subir Foto"}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {isPhotoDragging
                          ? "Suelta para subir"
                          : "Arrastra una foto aquí o haz clic para seleccionar"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Max 10MB • Se comprimirá automáticamente
                      </p>
                    </button>
                  )}

                  {isCompressing && (
                    <div className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Procesando foto...</p>
                    </div>
                  )}

                  {photoPreview && !isCompressing && (
                    <div className="space-y-3">
                      <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img src={photoPreview} alt="Preview" className="w-full h-auto" />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleOpenFilePicker}
                          disabled={isSubmitting}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                          Cambiar Foto
                        </button>
                        <button
                          type="button"
                          onClick={handlePhotoRemove}
                          disabled={isSubmitting}
                          className="px-4 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        >
                          Quitar
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Foto lista para subir ({(photo!.size / 1024).toFixed(0)} KB)
                      </p>
                    </div>
                  )}

                  {uploadError && (
                    <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="mt-6 mb-8">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isCompressing || isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-semibold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Guardando..." : "Guardar Chequeo"}
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </>
  );
}
