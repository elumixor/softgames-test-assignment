export interface MinDimensions {
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;
}

export type SceneDimensions = MinDimensions | { portrait: MinDimensions; landscape: MinDimensions };

export interface ComputedDimensions {
  portrait: MinDimensions;
  landscape: MinDimensions;
}

/**
 * Normalizes SceneDimensions into a consistent format with both portrait and landscape dimensions.
 * If a single MinDimensions object is provided, it's used for both orientations.
 */
export function computeDimensions(dimensions: SceneDimensions): ComputedDimensions {
  if ("portrait" in dimensions) {
    return {
      portrait: dimensions.portrait,
      landscape: dimensions.landscape,
    };
  }

  // Single dimensions object - use for both orientations
  return {
    portrait: dimensions,
    landscape: dimensions,
  };
}
