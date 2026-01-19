'use client';

import { memo } from 'react';
import PixelCard from '@/shared/ui/PixelCard';
import type { SoloCandidate } from '../model/solo-roulette.types';

interface SoloCandidateCardProps {
  candidate: SoloCandidate;
  isSelected: boolean;
  isFlipped: boolean;
  isAnimating: boolean;
  onSelect: (id: string) => void;
}

// 솔로 모드 후보 카드 컴포넌트 (CSS 기반 3D 플립)
export const SoloCandidateCard = memo(function SoloCandidateCard({
  candidate,
  isSelected,
  isFlipped,
  isAnimating,
  onSelect
}: SoloCandidateCardProps): React.ReactElement {
  const handleClick = (): void => {
    if (!isAnimating) {
      onSelect(candidate.id);
    }
  };

  // 애니메이션 중에는 단순 카드 사용 (성능 최적화)
  if (isAnimating) {
    return (
      <div className="w-full h-full" style={{ perspective: '1000px' }}>
        <div
          className="relative w-full h-full transition-transform duration-400 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* 앞면 - 불투명 배경 */}
          <div
            className="absolute inset-0 rounded-[25px] border-2 border-border bg-card shadow-lg"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
              <div
                className="w-10 h-10 rounded-full mb-2 flex items-center justify-center text-white text-lg font-bold shadow-md"
                style={{ backgroundColor: candidate.color }}
              >
                {candidate.name.charAt(0)}
              </div>
              <p className="text-sm font-semibold text-foreground text-center truncate w-full px-2">{candidate.name}</p>
            </div>
          </div>

          {/* 뒷면 - 불투명 배경 */}
          <div
            className="absolute inset-0 bg-card rounded-[25px] border-2 border-primary shadow-xl"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-primary/20 rounded-[23px]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
              <span className="text-4xl text-primary drop-shadow-lg">?</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 일반 카드 (idle 상태) - PixelCard 사용
  return (
    <div
      className={`w-full h-full cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-[25px]' : ''
      }`}
      style={{ perspective: '1000px' }}
      onClick={handleClick}
    >
      <div
        className="relative w-full h-full transition-transform duration-400 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* 앞면 - 후보 정보 */}
        <div className="absolute inset-0 bg-background rounded-[25px]" style={{ backfaceVisibility: 'hidden' }}>
          <PixelCard variant={isSelected ? 'blue' : 'default'} doAnimation={isSelected} className="h-full">
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-2">
              <div
                className="w-12 h-12 rounded-full mb-2 flex items-center justify-center text-white text-xl font-bold shadow-lg"
                style={{ backgroundColor: candidate.color }}
              >
                {candidate.name.charAt(0)}
              </div>
              <p className="text-sm font-semibold text-foreground text-center truncate w-full px-2">{candidate.name}</p>
              {isSelected && <p className="text-xs text-primary mt-1">선택됨</p>}
            </div>
          </PixelCard>
        </div>

        {/* 뒷면 - 물음표 */}
        <div
          className="absolute inset-0 bg-card rounded-[25px]"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <PixelCard variant="default" doAnimation={false} className="h-full">
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-2">
              <span className="text-4xl">?</span>
            </div>
          </PixelCard>
        </div>
      </div>
    </div>
  );
});
