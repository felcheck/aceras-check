"use client";

import React, { useState } from "react";
import { db } from "@/lib/db";
import { id } from "@instantdb/react";

interface AddReportFormProps {
  location: { lat: number; lng: number };
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !description) {
      alert("Please fill in category and description");
      return;
    }

    setIsSubmitting(true);

    try {
      const reportId = id();

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
          // Optional fields with defaults
          roadId: "",
          roadName: "",
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
          <div className="mb-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
            📍 Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </div>

          {/* Category */}
          <div className="mb-4">
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Issue Category *
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a category...</option>
              {REPORT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the issue in detail..."
              required
            />
          </div>

          {/* Severity */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity: {severity}/5
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
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Ratings Section */}
          <div className="border-t pt-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Optional Ratings
            </h3>

            <StarRating
              label="Sidewalk Condition"
              value={conditionRating}
              onChange={setConditionRating}
            />

            <StarRating
              label="Sidewalk Width"
              value={widthRating}
              onChange={setWidthRating}
            />

            <StarRating
              label="Safety"
              value={safetyRating}
              onChange={setSafetyRating}
            />

            <StarRating
              label="Lighting"
              value={lightingRating}
              onChange={setLightingRating}
            />

            <StarRating
              label="Accessibility (Wheelchair)"
              value={accessibilityRating}
              onChange={setAccessibilityRating}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
