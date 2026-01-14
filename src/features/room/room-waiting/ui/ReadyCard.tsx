import { cn } from '@/shared/lib/utils';
import PixelCard from '@/shared/ui/PixelCard';
import React, { ReactNode } from 'react';

interface ReadyCardProps {
  handleSpin: () => void;
  isSpinning: boolean;
  isMounted: boolean;
  candidates: string[];
  hasAnswer: boolean;
  cardContent: ReactNode;
  className?: string;
}

export default function ReadyCard({
  handleSpin,
  isSpinning,
  isMounted,
  candidates,
  cardContent,
  hasAnswer,
  className
}: ReadyCardProps) {
  return (
    <div
      onClick={handleSpin}
      className={cn(
        `relative w-full p-1 max-w-[400px] aspect-4/5`,
        isSpinning || !isMounted || candidates.length === 0
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:scale-105 transition-transform',
        className
      )}
    >
      {isSpinning && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[25px] overflow-hidden"
          style={{
            maskImage: 'linear-gradient(white, white)',
            WebkitMaskImage: 'linear-gradient(white, white)'
          }}
        >
          <div
            className="absolute inset-[-50%] animate-[spin_3s_linear_infinite]"
            style={{
              background: `conic-gradient(
                from 0deg,
                transparent 0deg,
                transparent 40deg,
                rgba(59, 130, 246, 0.8) 50deg,
                rgba(147, 197, 253, 1) 60deg,                  
                rgba(59, 130, 246, 0.8) 70deg,                  
                transparent 80deg,                  
                transparent 220deg,                  
                rgba(59, 130, 246, 0.8) 230deg,                  
                rgba(147, 197, 253, 1) 240deg,                  
                rgba(59, 130, 246, 0.8) 250deg,                  
                transparent 260deg,                  
                transparent 360deg                  
                )`,
              filter: 'blur(20px)'
            }}
          />
        </div>
      )}

      <PixelCard variant="blue" className="w-full bg-card" hasAnswer={hasAnswer} isSpinning={isSpinning}>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          {cardContent}
        </div>
      </PixelCard>
    </div>
  );
}
