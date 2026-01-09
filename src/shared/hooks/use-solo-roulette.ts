import { useState, useEffect, useCallback } from "react";
import type { SoloCandidate, SoloRouletteData } from "@/shared/types/solo-roulette.types";

const STORAGE_KEY = "solo-roulette-data";

const DEFAULT_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e",
];

export interface UseSoloRouletteReturn {
  candidates: SoloCandidate[];
  history: SoloRouletteData["history"];
  addCandidate: (name: string) => void;
  removeCandidate: (id: string) => void;
  updateCandidate: (id: string, name: string) => void;
  spin: () => SoloCandidate | null;
  clearCandidates: () => void;
  clearHistory: () => void;
}

export function useSoloRoulette(): UseSoloRouletteReturn {
  // Load from sessionStorage on initialization
  const [data, setData] = useState<SoloRouletteData>(() => {
    if (typeof window === "undefined") {
      return {
        candidates: [],
        history: [],
      };
    }
    
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as SoloRouletteData;
      } catch (err) {
        console.error("Failed to parse stored roulette data:", err);
      }
    }
    
    return {
      candidates: [],
      history: [],
    };
  });

  // Save to sessionStorage whenever data changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const addCandidate = useCallback((name: string): void => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const newCandidate: SoloCandidate = {
      id: `candidate-${Date.now()}-${Math.random()}`,
      name: trimmedName,
      color: DEFAULT_COLORS[data.candidates.length % DEFAULT_COLORS.length],
    };

    setData((prev) => ({
      ...prev,
      candidates: [...prev.candidates, newCandidate],
    }));
  }, [data.candidates.length]);

  const removeCandidate = useCallback((id: string): void => {
    setData((prev) => ({
      ...prev,
      candidates: prev.candidates.filter((c) => c.id !== id),
    }));
  }, []);

  const updateCandidate = useCallback((id: string, name: string): void => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setData((prev) => ({
      ...prev,
      candidates: prev.candidates.map((c) =>
        c.id === id ? { ...c, name: trimmedName } : c
      ),
    }));
  }, []);

  const spin = useCallback((): SoloCandidate | null => {
    if (data.candidates.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * data.candidates.length);
    const winner = data.candidates[randomIndex];

    setData((prev) => ({
      ...prev,
      history: [
        {
          winner,
          timestamp: Date.now(),
        },
        ...prev.history,
      ],
    }));

    return winner;
  }, [data.candidates]);

  const clearCandidates = useCallback((): void => {
    setData((prev) => ({
      ...prev,
      candidates: [],
    }));
  }, []);

  const clearHistory = useCallback((): void => {
    setData((prev) => ({
      ...prev,
      history: [],
    }));
  }, []);

  return {
    candidates: data.candidates,
    history: data.history,
    addCandidate,
    removeCandidate,
    updateCandidate,
    spin,
    clearCandidates,
    clearHistory,
  };
}
