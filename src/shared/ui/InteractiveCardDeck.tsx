'use client';

import { useState } from 'react';

interface InteractiveCardDeckProps {
  size?: number;
  className?: string;
}

// 테마에 맞는 카드 색상 (primary 기반 그라데이션 + 포인트 색상)
const CARD_STYLES = [
  { bg: 'bg-primary/70', border: 'border-primary/40' },
  { bg: 'bg-primary/80', border: 'border-primary/50' },
  { bg: 'bg-primary/90', border: 'border-primary/60' },
  { bg: 'bg-primary', border: 'border-primary/70' },
  { bg: 'bg-primary', border: 'border-primary-foreground/30' }
];

export const InteractiveCardDeck: React.FC<InteractiveCardDeckProps> = ({ size = 1, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cardOffsets, setCardOffsets] = useState<{ x: number; y: number }[]>(
    Array.from({ length: 5 }, () => ({ x: 0, y: 0 }))
  );

  const handleClick = (): void => {
    setIsOpen(prev => !prev);
    if (isOpen) {
      setCardOffsets(Array.from({ length: 5 }, () => ({ x: 0, y: 0 })));
    }
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number): void => {
    if (!isOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (e.clientX - centerX) * 0.12;
    const offsetY = (e.clientY - centerY) * 0.12;
    setCardOffsets(prev => {
      const newOffsets = [...prev];
      newOffsets[index] = { x: offsetX, y: offsetY };
      return newOffsets;
    });
  };

  const handleCardMouseLeave = (index: number): void => {
    setCardOffsets(prev => {
      const newOffsets = [...prev];
      newOffsets[index] = { x: 0, y: 0 };
      return newOffsets;
    });
  };

  const getOpenTransform = (index: number): string => {
    // 중심(-50%)을 기준으로 좌우로 펼쳐지도록 설정
    const transforms = [
      'translateX(-50%) translate(-70px, -20px) rotate(-25deg)',
      'translateX(-50%) translate(-35px, -50px) rotate(-12deg)',
      'translateX(-50%) translate(0px, -60px) rotate(0deg)',
      'translateX(-50%) translate(35px, -50px) rotate(12deg)',
      'translateX(-50%) translate(70px, -20px) rotate(25deg)'
    ];
    return transforms[index] || '';
  };

  const getClosedStyle = (index: number): React.CSSProperties => ({
    transform: `translateX(-50%) translateY(${index * -4}px) rotate(${(index - 2) * 3}deg)`,
    zIndex: index + 1
  });

  return (
    <div style={{ transform: `scale(${size})` }} className={className}>
      <div
        className={`group relative cursor-pointer transition-transform duration-300 ease-out ${
          !isOpen ? 'hover:-translate-y-2' : ''
        }`}
        style={{ transform: isOpen ? 'translateY(-8px)' : undefined }}
        onClick={handleClick}
      >
        {/* Card stack container */}
        <div className="relative w-28 h-40">
          {CARD_STYLES.map((style, index) => {
            const openTransform = isOpen
              ? `${getOpenTransform(index)} translate(${cardOffsets[index].x}px, ${cardOffsets[index].y}px)`
              : undefined;

            return (
              <div
                key={index}
                onMouseMove={e => handleCardMouseMove(e, index)}
                onMouseLeave={() => handleCardMouseLeave(index)}
                className={`absolute left-1/2 bottom-0 w-20 h-28 rounded-xl border shadow-lg
                  transition-all duration-300 ease-out backdrop-blur-sm
                  ${isOpen ? 'hover:scale-110 hover:shadow-xl hover:shadow-primary/20' : 'group-hover:translate-y-[-4px]'}
                  ${style.bg} ${style.border}`}
                style={isOpen ? { transform: openTransform, zIndex: index + 10 } : getClosedStyle(index)}
              >
                {/* Card inner design */}
                <div className="absolute inset-2 rounded-lg bg-background/10 border border-white/10 flex items-center justify-center">
                  {/* Card pattern */}
                  <div className="relative">
                    <span className="text-primary-foreground text-3xl font-bold drop-shadow-md">?</span>
                  </div>
                </div>
                {/* Card shine effect */}
                <div className="absolute top-2 left-2 w-6 h-8 rounded-md bg-white/20 blur-sm" />
              </div>
            );
          })}
        </div>

        {/* Subtle hint text */}
        <p
          className={`absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap
            transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          {isOpen ? '클릭해서 접기' : '클릭해서 펼치기'}
        </p>
      </div>
    </div>
  );
};
