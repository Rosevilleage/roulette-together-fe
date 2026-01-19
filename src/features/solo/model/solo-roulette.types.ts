/**
 * Solo Roulette related types
 */

export interface SoloCandidate {
  id: string;
  name: string;
  color?: string;
}

export interface SoloRouletteData {
  candidates: SoloCandidate[];
  history: Array<{
    winners: SoloCandidate[];
    timestamp: number;
  }>;
}
