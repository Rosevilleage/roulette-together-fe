'use client';

import { motion } from 'motion/react';
import PixelCard from '@/shared/ui/PixelCard';
import type { SoloCandidate } from '../model/solo-roulette.types';

interface SoloResultCardProps {
  isFlipped: boolean;
  winners: SoloCandidate[];
  cardSize: { width: number; height: number };
}

export const SoloResultCard: React.FC<SoloResultCardProps> = ({ isFlipped, winners, cardSize }) => {
  return (
    <div className="relative" style={{ width: cardSize.width, height: cardSize.height, perspective: '1000px' }}>
      {/* Card container with 3D transform */}
      <motion.div
        className="relative w-full h-full"
        initial={{ rotateY: 0 }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Face - Question Mark (SoloCandidateCard 뒷면과 동일한 스타일) */}
        <div
          className="absolute inset-0 bg-card rounded-[25px] border-2 border-primary shadow-xl"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-primary/20 rounded-[23px]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
            <span className="text-4xl text-primary drop-shadow-lg">?</span>
          </div>
        </div>

        {/* Back Face - Winners List */}
        <div
          className="absolute inset-0 bg-background rounded-[25px]"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <PixelCard variant="yellow" doAnimation={isFlipped} className="h-full">
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-2">
              <span className="text-2xl mb-1">🎉</span>
              <p className="text-sm font-bold text-foreground mb-2">당첨!</p>
              <div className="w-full overflow-y-auto px-1 pointer-events-auto custom-scrollbar">
                {winners.map((winner, index) => (
                  <motion.div
                    key={winner.id}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={isFlipped ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.2, delay: isFlipped ? 0.6 + index * 0.1 : 0 }}
                    className="text-xs text-foreground text-center py-1 px-2 rounded-md mb-1"
                    style={{ backgroundColor: `${winner.color}40` }}
                  >
                    {winner.name}
                  </motion.div>
                ))}
              </div>
            </div>
          </PixelCard>
        </div>
      </motion.div>
    </div>
  );
};
