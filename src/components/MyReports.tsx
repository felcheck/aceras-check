"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { db } from "@/lib/db";

interface MyReportsProps {
  userId: string;
  onClose: () => void;
  onSelectReport: (lat: number, lng: number) => void;
}

export default function MyReports({ userId, onClose, onSelectReport }: MyReportsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Query reports for this user
  const { isLoading, data } = db.useQuery({
    reports: {
      $: {
        where: {
          "author.id": userId,
        },
      },
      photos: {},
    },
  });

  const reports = data?.reports || [];

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col"
      style={{ height: "100dvh", width: "100vw", zIndex: 9998 }}
    >
      {/* Header */}
      <div
        className="bg-white dark:bg-gray-800 shadow-md px-4 py-4 flex items-center gap-4"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <button
          onClick={onClose}
          className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Mis Reportes
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📍</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No tienes reportes aún
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Toca en el mapa para crear tu primer reporte de acera
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium"
            >
              Ir al mapa
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const photo = report.photos?.[0];
              const date = report.createdAt
                ? new Date(report.createdAt).toLocaleDateString("es-PA", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "";

              return (
                <button
                  key={report.id}
                  onClick={() => onSelectReport(report.lat, report.lng)}
                  className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 flex gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  {/* Photo thumbnail */}
                  {photo?.url ? (
                    <img
                      src={photo.url}
                      alt="Report photo"
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">📷</span>
                    </div>
                  )}

                  {/* Report info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {report.address || "Sin dirección"}
                      </p>
                      {report.totalScore !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                            report.totalScore >= 70
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : report.totalScore >= 40
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {report.totalScore}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {report.description || "Sin descripción"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {date}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
