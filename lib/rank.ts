export const BELT_FILTERS = ['White', 'Blue', 'Purple', 'Brown', 'Black'] as const;

const BELT_COLOURS = ['red', 'coral', 'black', 'brown', 'purple', 'blue', 'green', 'orange', 'yellow', 'white'] as const;

/** Collapses a detailed rank ("Black Belt 2nd Degree") to its base colour ("Black"). */
export const baseBelt = (rank?: string) => {
  const r = (rank || '').toLowerCase();
  // Red-and-White / Coral ranks read as their own tier, not "white".
  if (r.includes('coral') || r.includes('red-and-white')) return 'Coral';
  const match = BELT_COLOURS.find(c => r.includes(c));
  return match ? match[0].toUpperCase() + match.slice(1) : rank || 'White';
};

export const beltClass = (rank?: string) => `belt-${baseBelt(rank).toLowerCase()}`;
