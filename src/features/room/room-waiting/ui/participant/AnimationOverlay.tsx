'use client';

import { motion, AnimatePresence } from 'motion/react';
import type { AnimationPhase } from '@/features/room/room-waiting/hooks/useParticipantCardAnimation';

interface AnimationOverlayProps {
  phase: AnimationPhase;
  showBackdrop: boolean;
  showLightBeam: boolean;
  onBackdropClick: () => void;
}

export const AnimationOverlay: React.FC<AnimationOverlayProps> = ({
  phase,
  showBackdrop,
  showLightBeam,
  onBackdropClick
}) => {
  return (
    <>
      {/* Backdrop overlay */}
      <AnimatePresence>
        {showBackdrop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 overflow-hidden"
          >
            <div
              className={`absolute inset-0 bg-black/60 ${phase === 'landed' ? 'cursor-pointer' : ''}`}
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                if (phase === 'landed') {
                  onBackdropClick();
                }
              }}
            />
            <p className="absolute bottom-8 left-0 right-0 text-xs text-center text-foreground">클릭하여 결과 닫기</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Light beam effect */}
      <AnimatePresence>
        {showLightBeam && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed top-0 left-1/2 -translate-x-1/2 w-[200px] h-[60vh] z-50 pointer-events-none origin-top"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)',
              filter: 'blur(20px)'
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};
