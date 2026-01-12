'use client';

import { useState, useEffect, ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { useSoloRoulette } from '@/shared/hooks/use-solo-roulette';
import { ArrowLeftIcon, PlusIcon, XIcon } from 'lucide-react';
import PixelCard from '@/shared/ui/PixelCard';

export default function SoloPage(): ReactElement {
  const router = useRouter();
  const { candidates, history, addCandidate, removeCandidate, spin, clearCandidates, clearHistory } = useSoloRoulette();

  const [newCandidateName, setNewCandidateName] = useState<string>('');
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    // This pattern is necessary to prevent hydration errors when using localStorage
    // The server renders with empty state, then client updates on mount
    // eslint-disable-next-line
    setIsMounted(true);
  }, []);

  const handleAddCandidate = (): void => {
    if (newCandidateName.trim()) {
      addCandidate(newCandidateName);
      setNewCandidateName('');
    }
  };

  const handleSpin = async (): Promise<void> => {
    if (candidates.length === 0) {
      alert('후보를 최소 1개 이상 추가해주세요!');
      return;
    }

    setIsSpinning(true);
    setWinner(null);

    // Simulate spinning animation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = spin();
    if (result) {
      setWinner(result.name);
    }

    setIsSpinning(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container max-w-4xl mx-auto p-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">혼자 룰렛 돌리기</h1>
            <p className="text-xs text-muted-foreground">후보를 추가하고 룰렛을 돌려보세요</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container max-w-4xl mx-auto p-4 space-y-6">
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
            />
            <Button onClick={handleAddCandidate} size="icon">
              <PlusIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Candidates List */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">후보 목록 ({isMounted ? candidates.length : 0})</h2>
            {isMounted && candidates.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCandidates}>
                전체 삭제
              </Button>
            )}
          </div>

          {!isMounted || candidates.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">후보를 추가해주세요</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
              {candidates.map(candidate => (
                <div
                  key={candidate.id}
                  className="relative shrink-0 w-32 h-32 bg-card border border-border rounded-xl flex items-center justify-center group"
                  style={{
                    backgroundColor: `${candidate.color}20`,
                    borderColor: candidate.color
                  }}
                >
                  <button
                    onClick={() => removeCandidate(candidate.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                  <p
                    className="text-center text-sm font-semibold px-2 wrap-break-word"
                    style={{ color: candidate.color }}
                  >
                    {candidate.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Roulette Wheel */}
        <div className="rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-center">룰렛</h2>

          <div className="flex justify-center items-center">
            <div
              onClick={handleSpin}
              className={`relative w-full p-1 max-w-[300px] aspect-4/5 ${isSpinning || !isMounted || candidates.length === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105 transition-transform'}`}
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

              <PixelCard variant="blue" className="w-full bg-card" hasAnswer={!!winner} isSpinning={isSpinning}>
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                  {winner ? (
                    <div className="text-center space-y-2">
                      <p className="text-sm text-foreground/70">🎉 당첨! 🎉</p>
                      <p className="text-3xl font-bold text-foreground px-4">{winner}</p>
                    </div>
                  ) : isSpinning ? (
                    <div className="text-center space-y-2">
                      <span className="text-5xl animate-pulse">🎯</span>
                      <p className="text-lg font-semibold text-foreground">돌리는 중...</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <span className="text-5xl">🎯</span>
                      <p className="text-lg font-semibold text-foreground">룰렛 돌리기</p>
                    </div>
                  )}

                  {/* Small text at bottom */}
                  <p className="absolute bottom-8 text-xs text-foreground/50">
                    {winner ? '다시 돌리기' : '카드를 클릭하세요'}
                  </p>
                </div>
              </PixelCard>
            </div>
          </div>
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
                  <div className="flex items-center gap-3">
                    <Badge
                      style={{
                        backgroundColor: record.winner.color,
                        color: '#fff'
                      }}
                    >
                      {record.winner.name}
                    </Badge>
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
  );
}
