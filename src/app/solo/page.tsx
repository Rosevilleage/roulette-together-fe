"use client";

import { useState, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { useSoloRoulette } from "@/shared/hooks/use-solo-roulette";
import { ArrowLeftIcon, PlusIcon, RotateCwIcon, XIcon } from "lucide-react";

export default function SoloPage(): ReactElement {
  const router = useRouter();
  const {
    candidates,
    history,
    addCandidate,
    removeCandidate,
    spin,
    clearCandidates,
    clearHistory,
  } = useSoloRoulette();

  const [newCandidateName, setNewCandidateName] = useState<string>("");
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);

  const handleAddCandidate = (): void => {
    if (newCandidateName.trim()) {
      addCandidate(newCandidateName);
      setNewCandidateName("");
    }
  };

  const handleSpin = async (): Promise<void> => {
    if (candidates.length === 0) {
      alert("후보를 최소 1개 이상 추가해주세요!");
      return;
    }

    setIsSpinning(true);
    setWinner(null);

    // Simulate spinning animation
    await new Promise((resolve) => setTimeout(resolve, 2000));

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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">혼자 룰렛 돌리기</h1>
            <p className="text-xs text-muted-foreground">
              후보를 추가하고 룰렛을 돌려보세요
            </p>
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
              onChange={(e) => setNewCandidateName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
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
            <h2 className="text-lg font-semibold">
              후보 목록 ({candidates.length})
            </h2>
            {candidates.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCandidates}
              >
                전체 삭제
              </Button>
            )}
          </div>

          {candidates.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              후보를 추가해주세요
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {candidates.map((candidate) => (
                <Badge
                  key={candidate.id}
                  className="text-sm px-3 py-1.5 gap-2"
                  style={{
                    backgroundColor: candidate.color,
                    color: "#fff",
                  }}
                >
                  {candidate.name}
                  <button
                    onClick={() => removeCandidate(candidate.id)}
                    className="hover:opacity-70"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Roulette Wheel */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-center">룰렛</h2>
          
          <div className="relative w-full aspect-square max-w-[300px] mx-auto">
            <div
              className={`absolute inset-0 border-8 border-primary/30 rounded-full ${
                isSpinning ? "animate-spin" : ""
              }`}
            />
            <div className="absolute inset-4 border-4 border-primary/50 rounded-full" />
            <div className="absolute inset-8 bg-linear-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
              {winner ? (
                <div className="text-center">
                  <p className="text-sm text-primary-foreground/70">당첨!</p>
                  <p className="text-2xl font-bold text-primary-foreground">
                    {winner}
                  </p>
                </div>
              ) : isSpinning ? (
                <span className="text-4xl animate-pulse">🎯</span>
              ) : (
                <span className="text-4xl">🎯</span>
              )}
            </div>
          </div>

          <Button
            size="lg"
            className="w-full gap-2"
            onClick={handleSpin}
            disabled={isSpinning || candidates.length === 0}
          >
            <RotateCwIcon className={`w-5 h-5 ${isSpinning ? "animate-spin" : ""}`} />
            {isSpinning ? "돌리는 중..." : "룰렛 돌리기"}
          </Button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                당첨 기록 ({history.length})
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
              >
                기록 삭제
              </Button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {history.map((record, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      style={{
                        backgroundColor: record.winner.color,
                        color: "#fff",
                      }}
                    >
                      {record.winner.name}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(record.timestamp).toLocaleString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
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
