'use client';

import { memo } from 'react';
import PixelCard from '@/shared/ui/PixelCard';

interface FlippableCardProps {
  nickname: string;
  ready: boolean;
  isFlipped: boolean;
  isAnimating: boolean;
}

// 뒤집히는 참가자 카드 컴포넌트 (CSS 기반 플립)
export const FlippableCard = memo(function FlippableCard({
  nickname,
  ready,
  isFlipped,
  isAnimating
}: FlippableCardProps): React.ReactElement {
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
          {/* 앞면 - 단순 배경 */}
          <div
            className="absolute inset-0 rounded-[25px] border border-[#27272a] bg-background"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
              <span className="text-3xl mb-2">{ready ? '✅' : '⏳'}</span>
              <p className="text-sm font-semibold text-foreground text-center truncate w-full px-2">{nickname}</p>
              <p className="text-xs text-foreground/60 mt-1">{ready ? '준비 완료' : '대기 중'}</p>
            </div>
          </div>

          {/* 뒷면 - 단순 배경 */}
          <div
            className="absolute inset-0 bg-card rounded-[25px] border border-[#27272a]"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
              <span className="text-4xl">?</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 일반 카드 (idle 상태) - PixelCard 사용
  return (
    <div className="w-full h-full" style={{ perspective: '1000px' }}>
      <div
        className="relative w-full h-full transition-transform duration-400 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* 앞면 - 참가자 정보 */}
        <div className="absolute inset-0 bg-background rounded-[25px]" style={{ backfaceVisibility: 'hidden' }}>
          <PixelCard variant={ready ? 'blue' : 'default'} doAnimation={ready && !isFlipped} className="h-full">
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-2">
              <span className="text-3xl mb-2">{ready ? '✅' : '⏳'}</span>
              <p className="text-sm font-semibold text-foreground text-center truncate w-full px-2">{nickname}</p>
              <p className="text-xs text-foreground/60 mt-1">{ready ? '준비 완료' : '대기 중'}</p>
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
