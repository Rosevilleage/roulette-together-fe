'use client';

import { motion } from 'motion/react';
import PixelCard from '@/shared/ui/PixelCard';

interface ResultCardProps {
  isFlipped: boolean;
  winners: Array<{ nickname: string; outcome: 'WIN' | 'LOSE' }>;
}

export const ResultCard: React.FC<ResultCardProps> = ({ isFlipped, winners }) => {
  return (
    <div className="relative w-32 aspect-4/5 sm:w-36" style={{ perspective: '1000px' }}>
      {/* Card container with 3D transform */}
      <motion.div
        className="relative w-full h-full"
        initial={{ rotateY: 0 }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Face - Question Mark (픽셀 애니메이션 없음) */}
        <div className="absolute inset-0 bg-card rounded-[25px]" style={{ backfaceVisibility: 'hidden' }}>
          <PixelCard variant="default" doAnimation={false} className="h-full">
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-2">
              <span className="text-4xl mb-2">?</span>
              <p className="text-sm font-semibold text-foreground text-center">추첨 중...</p>
            </div>
          </PixelCard>
        </div>

        {/* Back Face - Winners List (뒤집힌 후에만 픽셀 애니메이션) */}
        <div
          className="absolute inset-0 bg-card rounded-[25px]"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <PixelCard variant="yellow" doAnimation={isFlipped} className="h-full">
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-2">
              <span className="text-2xl mb-1">🎉</span>
              <p className="text-sm font-bold text-foreground mb-2">당첨!</p>
              <div className="w-full max-h-20 overflow-y-auto px-1">
                {winners.map((winner, index) => (
                  <div
                    key={winner.nickname}
                    className={`text-xs text-foreground text-center py-1 ${
                      index < winners.length - 1 ? 'border-b border-foreground/20' : ''
                    }`}
                  >
                    {winner.nickname}
                  </div>
                ))}
              </div>
            </div>
          </PixelCard>
        </div>
      </motion.div>
    </div>
  );
};
