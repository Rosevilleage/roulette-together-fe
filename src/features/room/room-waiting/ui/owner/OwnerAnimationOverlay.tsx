'use client';

import { AnimatePresence, motion } from 'motion/react';
import LightRays from '@/shared/ui/LightRays';

interface OwnerAnimationOverlayProps {
  showBackdrop: boolean;
  showLightBeams: boolean;
  onBackdropClick?: () => void;
}

export const OwnerAnimationOverlay: React.FC<OwnerAnimationOverlayProps> = ({
  showBackdrop,
  showLightBeams,
  onBackdropClick
}) => {
  return (
    <AnimatePresence>
      {showBackdrop && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-40 bg-black/60"
          onClick={onBackdropClick}
        >
          {/* Left LightRays */}
          <AnimatePresence>
            {showLightBeams && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 pointer-events-none"
              >
                <LightRays
                  raysOrigin="left"
                  raysColor="#fef08a"
                  raysSpeed={6}
                  lightSpread={0.4}
                  rayLength={150}
                  pulsating={true}
                  followMouse={false}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right LightRays */}
          <AnimatePresence>
            {showLightBeams && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 pointer-events-none"
              >
                <LightRays
                  raysOrigin="right"
                  raysColor="#fef08a"
                  raysSpeed={6}
                  lightSpread={0.4}
                  rayLength={150}
                  pulsating={true}
                  followMouse={false}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
