"use client";

import React, { useMemo, useState, useRef } from "react";
import { SelectedLocation } from "@/types/location";

type BucketId = "utilidad" | "seguridad" | "comodidad" | "interesante";

interface WalkabilityPrototypeModalProps {
  location: SelectedLocation;
  onClose: () => void;
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
      park: true,
      market: false,
      clinic: false,
      shops: true,
      work: false,
    },
  },
  seguridad: {
    hasSidewalk: true,
    widthRating: 4,
    obstructions: ["cars"],
    comfortSpaceRating: 3,
    hasLighting: true,
    lightingRating: 4,
  },
  comodidad: {
    shadeRating: 3,
    contaminants: ["noise"],
    contaminationSeverity: 2,
  },
  interesante: {
    hasCommerce: true,
    commerceCount: 2,
    vibeRating: 4,
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
  openBucket,
  setOpenBucket,
  state,
  scores,
  updateBucket,
}: {
  openBucket: BucketId;
  setOpenBucket: (id: BucketId) => void;
  state: WalkabilityState;
  scores: ReturnType<typeof useWalkabilityState>["scores"];
  updateBucket: ReturnType<typeof useWalkabilityState>["updateBucket"];
}) {
  return (
    <div className="divide-y divide-gray-200">
      {(Object.keys(WALKABILITY_META) as BucketId[]).map((bucket) => {
        const meta = WALKABILITY_META[bucket];
        const isOpen = bucket === openBucket;
        const currentScore = (scores as Record<BucketId, number>)[bucket];
        return (
          <div key={bucket}>
            <button
              type="button"
              onClick={() => setOpenBucket(bucket)}
              className="w-full flex items-center justify-between py-4"
            >
              <div>
                <p className="text-sm font-semibold">{meta.title}</p>
                <p className="text-xs text-gray-500">{meta.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">
                  {currentScore.toFixed(1)} / {meta.max}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs text-white ${meta.color}`}
                >
                  {isOpen ? "Abierto" : "Abrir"}
                </span>
              </div>
            </button>
            {isOpen && (
              <div className="pb-6">
                <BucketContent
                  bucket={bucket}
                  state={state}
                  updateBucket={updateBucket}
                />
              </div>
            )}
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

export default function WalkabilityPrototypeModal({
  location,
  onClose,
}: WalkabilityPrototypeModalProps) {
  const { state, scores, updateBucket } = useWalkabilityState();
  const [variant, setVariant] = useState<"accordion" | "stepper" | "dual">("accordion");
  const [openBucket, setOpenBucket] = useState<BucketId>("seguridad");
  const [activeStep, setActiveStep] = useState(1);

  const totalMax =
    WALKABILITY_META.utilidad.max +
    WALKABILITY_META.seguridad.max +
    WALKABILITY_META.comodidad.max +
    WALKABILITY_META.interesante.max;

  return (
    <div className="fixed inset-0 z-[1100] bg-black/50 flex items-start justify-center p-2 md:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl shadow-2xl animate-slide-up flex flex-col max-h-[calc(100vh-1rem)] md:max-h-[calc(100vh-3rem)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-xs uppercase text-gray-500 tracking-wide">
              Ubicación seleccionada
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {location.addressLabel || "Coordenadas seleccionadas"}
            </p>
            <p className="text-xs text-gray-500">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Puntaje total</p>
            <p className="text-lg font-bold text-blue-600">
              {scores.total.toFixed(1)} / {totalMax}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-sm font-semibold mb-2 text-gray-700">
            Explora variantes del flujo
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                variant === "accordion"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 text-gray-600"
              }`}
              onClick={() => setVariant("accordion")}
            >
              Acordeón
            </button>
            <button
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                variant === "stepper"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 text-gray-600"
              }`}
              onClick={() => setVariant("stepper")}
            >
              Stepper
            </button>
            <button
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                variant === "dual"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 text-gray-600"
              }`}
              onClick={() => setVariant("dual")}
            >
              Panel Dual
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {variant === "accordion" && (
            <AccordionPrototype
              openBucket={openBucket}
              setOpenBucket={setOpenBucket}
              state={state}
              scores={scores}
              updateBucket={updateBucket}
            />
          )}
          {variant === "stepper" && (
            <StepperPrototype
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              state={state}
              updateBucket={updateBucket}
            />
          )}
          {variant === "dual" && (
            <DualPanePrototype
              state={state}
              updateBucket={updateBucket}
              scores={scores}
            />
          )}
        </div>
      </div>
    </div>
  );
}
