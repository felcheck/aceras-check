/**
 * Walkability scoring functions for Aceras Check
 * Based on intake criteria plan: thoughts/plans/2024-02-23-intake-criteria.md
 */

interface SeguridadData {
  hasSidewalk: boolean | null;
  widthRating: number | null;
  obstructions: string[];
  comfortSpaceRating: number | null;
  hasLighting: boolean | null;
  lightingRating: number | null;
}

/**
 * Calculate SEGURIDAD (Safety) score: 0-5 points
 *
 * Scoring breakdown:
 * 1. Sidewalk exists: 1 pt
 * 2. Width rating: 1 pt (≥4 → 1, 3 → 0.5, else 0)
 * 3. Obstructions: 1 pt minus 0.25 per obstruction (min 0)
 * 4. Comfort space rating: 1 pt (≥4 → 1, 3 → 0.5, else 0)
 * 5. Lighting: 1 pt (has lighting + rating ≥4 → 1, rating 2-3 → 0.5, else 0)
 */
export function calculateSeguridadScore(data: SeguridadData): number {
  let score = 0;

  // 1. Sidewalk exists (1 pt)
  if (data.hasSidewalk === true) {
    score += 1;
  }

  // 2. Width rating (1 pt)
  if (data.widthRating !== null) {
    if (data.widthRating >= 4) {
      score += 1;
    } else if (data.widthRating === 3) {
      score += 0.5;
    }
  }

  // 3. Obstructions (1 pt minus deductions)
  let obstructionScore = 1;
  obstructionScore -= data.obstructions.length * 0.25;
  score += Math.max(0, obstructionScore);

  // 4. Comfort space rating (1 pt)
  if (data.comfortSpaceRating !== null) {
    if (data.comfortSpaceRating >= 4) {
      score += 1;
    } else if (data.comfortSpaceRating === 3) {
      score += 0.5;
    }
  }

  // 5. Lighting (1 pt)
  if (data.hasLighting === true && data.lightingRating !== null) {
    if (data.lightingRating >= 4) {
      score += 1;
    } else if (data.lightingRating >= 2) {
      score += 0.5;
    }
  }

  return Math.min(5, score); // Cap at 5
}
