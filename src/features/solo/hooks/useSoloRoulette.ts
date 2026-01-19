import { useState, useEffect, useCallback } from 'react';
import type { SoloCandidate, SoloRouletteData } from '../model/solo-roulette.types';

const STORAGE_KEY = 'solo-roulette-data';

const DEFAULT_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e'
];

export interface UseSoloRouletteReturn {
  candidates: SoloCandidate[];
  history: SoloRouletteData['history'];
  addCandidate: (name: string) => void;
  removeCandidate: (id: string) => void;
  updateCandidate: (id: string, name: string) => void;
  addToHistory: (winners: SoloCandidate[]) => void;
  clearCandidates: () => void;
  clearHistory: () => void;
}

export function useSoloRoulette(): UseSoloRouletteReturn {
  // Load from sessionStorage on initialization
  const [data, setData] = useState<SoloRouletteData>(() => {
    if (typeof window === 'undefined') {
      return {
        candidates: [],
        history: []
      };
    }

    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as SoloRouletteData;
      } catch (err) {
        console.error('Failed to parse stored roulette data:', err);
      }
    }

    return {
      candidates: [],
      history: []
    };
  });

  // Save to sessionStorage whenever data changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // rerender-functional-setstate: 함수형 setState로 의존성 제거하여 안정적인 콜백 생성
  const addCandidate = useCallback((name: string): void => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setData(prev => {
      const newCandidate: SoloCandidate = {
        id: `candidate-${Date.now()}-${Math.random()}`,
        name: trimmedName,
        color: DEFAULT_COLORS[prev.candidates.length % DEFAULT_COLORS.length]
      };

      return {
        ...prev,
        candidates: [...prev.candidates, newCandidate]
      };
    });
  }, []);

  const removeCandidate = useCallback((id: string): void => {
    setData(prev => ({
      ...prev,
      candidates: prev.candidates.filter(c => c.id !== id)
    }));
  }, []);

  const updateCandidate = useCallback((id: string, name: string): void => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setData(prev => ({
      ...prev,
      candidates: prev.candidates.map(c => (c.id === id ? { ...c, name: trimmedName } : c))
    }));
  }, []);

  // 히스토리에 당첨자 추가 (애니메이션 완료 후 호출)
  const addToHistory = useCallback((winners: SoloCandidate[]): void => {
    if (winners.length === 0) return;

    setData(prev => ({
      ...prev,
      history: [
        {
          winners,
          timestamp: Date.now()
        },
        ...prev.history
      ]
    }));
  }, []);

  const clearCandidates = useCallback((): void => {
    setData(prev => ({
      ...prev,
      candidates: []
    }));
  }, []);

  const clearHistory = useCallback((): void => {
    setData(prev => ({
      ...prev,
      history: []
    }));
  }, []);

  return {
    candidates: data.candidates,
    history: data.history,
    addCandidate,
    removeCandidate,
    updateCandidate,
    addToHistory,
    clearCandidates,
    clearHistory
  };
}
