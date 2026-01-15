'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ResultCard } from './ResultCard';
import type { OwnerAnimationPhase } from '../../hooks/useOwnerCardAnimation';

interface CardStackProps {
  phase: OwnerAnimationPhase;
  participantCount: number;
  winners: Array<{ nickname: string; outcome: 'WIN' | 'LOSE' }>;
  isFlipped: boolean;
}

export const CardStack: React.FC<CardStackProps> = ({ phase, participantCount, winners, isFlipped }) => {
  // ResultCard는 stacked 이후부터 표시
  const isVisible = ['stacked', 'reveal-flip', 'result-shown', 'dispersing'].includes(phase);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Result card on top */}
          <motion.div
            className="relative"
            style={{ zIndex: participantCount + 1 }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: phase === 'dispersing' ? 0.8 : 1,
              opacity: phase === 'dispersing' ? 0 : 1
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <ResultCard isFlipped={isFlipped} winners={winners} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
