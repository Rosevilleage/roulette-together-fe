'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ResultCard } from './ResultCard';
import type { OwnerAnimationPhase } from '../../hooks/useOwnerCardAnimation';

interface CardStackProps {
  phase: OwnerAnimationPhase;
  participantCount: number;
  winners: Array<{ nickname: string; outcome: 'WIN' | 'LOSE' }>;
  isFlipped: boolean;
  cardSize: { width: number; height: number } | null;
}

export const CardStack: React.FC<CardStackProps> = ({ phase, participantCount, winners, isFlipped, cardSize }) => {
  // ResultCard는 stacked 이후부터 표시
  const isVisible = ['reveal-flip', 'result-shown', 'dispersing'].includes(phase);

  return (
    <AnimatePresence>
      {isVisible && cardSize && (
        <motion.div
          className="fixed inset-0 z-200 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Result card on top */}
          <motion.div
            className="relative"
            style={{ zIndex: participantCount + 100 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'dispersing' ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <ResultCard isFlipped={isFlipped} winners={winners} cardSize={cardSize} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
