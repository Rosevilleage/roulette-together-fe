'use client';

import { AnimatePresence, motion } from 'motion/react';
import { SoloResultCard } from './SoloResultCard';
import type { SoloAnimationPhase } from '../hooks/useSoloCardAnimation';
import type { SoloCandidate } from '../model/solo-roulette.types';

interface SoloCardStackProps {
  phase: SoloAnimationPhase;
  candidateCount: number;
  winners: SoloCandidate[];
  isFlipped: boolean;
  cardSize: { width: number; height: number } | null;
}

export const SoloCardStack: React.FC<SoloCardStackProps> = ({
  phase,
  candidateCount,
  winners,
  isFlipped,
  cardSize
}) => {
  // ResultCard는 reveal-flip 이후부터 표시
  const isVisible = ['reveal-flip', 'result-shown', 'dispersing'].includes(phase);

  return (
    <AnimatePresence>
      {isVisible && cardSize && (
        <motion.div
          className="fixed inset-0 z-9999 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Result card on top */}
          <motion.div
            className="relative"
            style={{ zIndex: candidateCount + 100 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'dispersing' ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <SoloResultCard isFlipped={isFlipped} winners={winners} cardSize={cardSize} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
