'use client';

import { useState, useEffect, useMemo, useCallback, ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Badge } from '@/shared/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/Select';
import { useSoloRoulette } from '@/features/solo/hooks/useSoloRoulette';
import { useSoloCardAnimation } from '@/features/solo/hooks/useSoloCardAnimation';
import { useSoloCardDomAnimation } from '@/features/solo/hooks/useSoloCardDomAnimation';
import { useAlertStore } from '@/shared/store/alert.store';
import { ArrowLeftIcon, PlusIcon, XIcon, Users } from 'lucide-react';
import { SoloCandidateCard } from '@/features/solo/ui/SoloCandidateCard';
import { SoloCardStack } from '@/features/solo/ui/SoloCardStack';
import { OwnerAnimationOverlay } from '@/features/room/room-waiting/ui/owner/OwnerAnimationOverlay';

export default function SoloPage(): ReactElement {
  const router = useRouter();
  const showAlert = useAlertStore(state => state.showAlert);
  const { candidates, history, addCandidate, removeCandidate, addToHistory, clearCandidates, clearHistory } =
    useSoloRoulette();

  const [newCandidateName, setNewCandidateName] = useState<string>('');
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [winnerCount, setWinnerCount] = useState<number>(1);
  const [cardSize, setCardSize] = useState<{ width: number; height: number } | null>(null);

  // Animation hooks
  const { phase, showBackdrop, showLightBeams, isFlipped, winners, isSpinning, startSpin, dismissBackdrop } =
    useSoloCardAnimation();
  const { setCardRef, getFirstCardSize, animatePhase } = useSoloCardDomAnimation();

  // 당첨자 ID Set
  const winnerIds = useMemo(() => new Set(winners.map(w => w.id)), [winners]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // 카드 크기 캡처 (phase가 idle → gathering으로 변경될 때)
  useEffect(() => {
    if (phase === 'gathering') {
      requestAnimationFrame(() => {
        const size = getFirstCardSize();
        if (size) {
          setCardSize(size);
        }
      });
    }
  }, [phase, getFirstCardSize]);

  // Phase 변경 시 DOM 애니메이션 실행
  useEffect(() => {
    animatePhase(phase, candidates, winnerIds);
  }, [phase, candidates, winnerIds, animatePhase]);

  // 결과가 표시되면 히스토리에 추가
  useEffect(() => {
    if (phase === 'result-shown' && winners.length > 0) {
      addToHistory(winners);
    }
  }, [phase, winners, addToHistory]);

  // 카드가 뒤집혔는지 여부 (phase 기반)
  const isCardFlipped = phase === 'gathering' || phase === 'stacked' || phase === 'reveal-flip';
  const isAnimating = phase !== 'idle';

  // 애니메이션 중 스크롤 비활성화
  useEffect(() => {
    if (isAnimating) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isAnimating]);

  const handleAddCandidate = (): void => {
    if (newCandidateName.trim()) {
      addCandidate(newCandidateName);
      setNewCandidateName('');
    }
  };

  const handleSpin = useCallback((): void => {
    if (candidates.length === 0) {
      showAlert('후보를 최소 1개 이상 추가해주세요!');
      return;
    }

    if (winnerCount > candidates.length) {
      showAlert(`후보가 ${candidates.length}명이므로 당첨자 수를 조정해주세요!`);
      return;
    }

    startSpin(candidates, winnerCount);
  }, [candidates, winnerCount, startSpin, showAlert]);

  const handleToggleCandidateSelection = (candidateId: string): void => {
    if (isAnimating) return;

    setSelectedCandidateIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
      } else {
        newSet.add(candidateId);
      }
      return newSet;
    });
  };

  const handleDeleteSelectedCandidates = (): void => {
    selectedCandidateIds.forEach(id => {
      removeCandidate(id);
    });
    setSelectedCandidateIds(new Set());
  };

  const handleBackdropClick = useCallback((): void => {
    dismissBackdrop();
  }, [dismissBackdrop]);

  // 당첨자 수가 후보 수보다 많으면 조정
  useEffect(() => {
    if (winnerCount > candidates.length && candidates.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWinnerCount(candidates.length);
    }
  }, [candidates.length, winnerCount]);

  // 버튼 비활성화 조건
  const isSpinDisabled = isSpinning || candidates.length === 0 || phase !== 'idle';

  return (
    <>
      {/* Animation Overlay */}
      <OwnerAnimationOverlay
        showBackdrop={showBackdrop}
        showLightBeams={showLightBeams}
        onBackdropClick={handleBackdropClick}
      />

      {/* Card Stack - Result Card */}
      <SoloCardStack
        phase={phase}
        candidateCount={candidates.length}
        winners={winners}
        isFlipped={isFlipped}
        cardSize={cardSize}
      />

      <div className="min-h-screen flex flex-col bg-linear-to-b from-background to-muted/20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="container max-w-2xl mx-auto p-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">혼자 랜덤 뽑기</h1>
              <p className="text-xs text-muted-foreground">후보를 추가하고 랜덤 뽑기를 해보세요</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 container max-w-2xl mx-auto p-4 space-y-6">
          {/* Add Candidate */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">후보 추가</h2>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="후보 이름 입력"
                value={newCandidateName}
                onChange={e => setNewCandidateName(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    handleAddCandidate();
                  }
                }}
                maxLength={20}
                disabled={isAnimating}
              />
              <Button onClick={handleAddCandidate} size="icon" disabled={isAnimating}>
                <PlusIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Candidates List */}
          <div
            className={`bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-4 relative ${
              isAnimating ? 'z-50' : ''
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                후보 목록
                <Badge variant="secondary">{isMounted ? candidates.length : 0}</Badge>
              </h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {isMounted && selectedCandidateIds.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelectedCandidates}
                    disabled={isAnimating}
                  >
                    <XIcon className="w-4 h-4 mr-1" />
                    선택 삭제 ({selectedCandidateIds.size})
                  </Button>
                )}
                {isMounted && candidates.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCandidates} disabled={isAnimating}>
                    전체 삭제
                  </Button>
                )}
              </div>
            </div>

            {!isMounted || candidates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>후보를 추가해주세요</p>
                <p className="text-sm mt-2">위 입력창에서 이름을 입력하세요</p>
              </div>
            ) : (
              <div
                className={`flex gap-3 p-1 sm:grid sm:grid-cols-3 md:grid-cols-4 ${
                  phase === 'idle' ? 'overflow-x-auto sm:overflow-x-visible' : 'overflow-visible'
                }`}
              >
                {candidates.map(candidate => (
                  <div
                    key={candidate.id}
                    ref={setCardRef(candidate.id)}
                    className="shrink-0 w-36 aspect-4/5 sm:w-auto p-1 relative"
                    style={{
                      willChange: isAnimating ? 'transform, opacity' : 'auto'
                    }}
                  >
                    <SoloCandidateCard
                      candidate={candidate}
                      isSelected={selectedCandidateIds.has(candidate.id)}
                      isFlipped={isCardFlipped}
                      isAnimating={isAnimating}
                      onSelect={handleToggleCandidateSelection}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Spin Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Winner Count Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">당첨 수:</span>
              {isMounted ? (
                <Select
                  value={winnerCount}
                  onValueChange={value => setWinnerCount(value as number)}
                  disabled={isAnimating || candidates.length === 0}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: Math.max(1, candidates.length) }, (_, i) => i + 1).map(n => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="w-20 h-9 rounded-4xl border border-input bg-input/30 animate-pulse" />
              )}
            </div>

            {/* Spin Button */}
            {isMounted ? (
              <Button
                size="lg"
                onClick={handleSpin}
                disabled={isSpinDisabled}
                className="flex-1 h-14 text-lg font-semibold"
              >
                {isSpinning ? '뽑는 중...' : '🎯 랜덤 뽑기'}
              </Button>
            ) : (
              <div className="flex-1 h-14 rounded-md bg-primary/50 animate-pulse" />
            )}
          </div>

          {/* History */}
          {isMounted && history.length > 0 && (
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">당첨 기록 ({history.length})</h2>
                <Button variant="ghost" size="sm" onClick={clearHistory}>
                  기록 삭제
                </Button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {history.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 flex-wrap">
                      {record.winners.map(winner => (
                        <Badge
                          key={winner.id}
                          style={{
                            backgroundColor: winner.color,
                            color: '#fff'
                          }}
                        >
                          {winner.name}
                        </Badge>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(record.timestamp).toLocaleString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
