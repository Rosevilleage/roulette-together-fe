'use client';

import { motion } from 'motion/react';
import PixelCard from '@/shared/ui/PixelCard';
import type { WinSentiment } from '@/entities/room/model/room.types';

interface ResultCardProps {
  isFlipped: boolean;
  winners: Array<{ nickname: string; outcome: 'WIN' | 'LOSE' }>;
  cardSize: { width: number; height: number };
  winSentiment: WinSentiment;
}

export const ResultCard: React.FC<ResultCardProps> = ({ isFlipped, winners, cardSize, winSentiment }) => {
  const isPositive = winSentiment === 'POSITIVE';
  const variant = isPositive ? 'yellow' : 'pink';
  const emoji = isPositive ? '🎉' : '😱';
  const label = isPositive ? '당첨!' : '걸렸다!';

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
        {/* Front Face - Question Mark (픽셀 애니메이션 없음) */}
        <div className="absolute inset-0 bg-card rounded-[25px]" style={{ backfaceVisibility: 'hidden' }}>
          <PixelCard variant="default" doAnimation={false} className="h-full">
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-2">
              <span className="text-4xl mb-2">?</span>
            </div>
          </PixelCard>
        </div>

        {/* Back Face - Winners List (뒤집힌 후에만 픽셀 애니메이션) */}
        <div
          className="absolute inset-0 bg-background rounded-[25px]"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <PixelCard variant={variant} doAnimation={isFlipped} className="h-full">
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-2">
              <span className="text-2xl mb-1">{emoji}</span>
              <p className="text-sm font-bold text-foreground mb-2">{label}</p>
              <div className="w-full overflow-y-auto px-1 pointer-events-auto custom-scrollbar">
                {winners.map((winner, index) => (
                  <motion.div
                    key={winner.nickname}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={isFlipped ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.2, delay: isFlipped ? 0.6 + index * 0.1 : 0 }}
                    className="text-xs text-foreground text-center py-1 px-2 bg-background/80 rounded-md mb-1"
                  >
                    {winner.nickname}
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
