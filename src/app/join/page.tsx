"use client";

import { useState, useCallback, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ArrowLeftIcon, QrCodeIcon } from "lucide-react";

export default function JoinPage(): ReactElement {
  const router = useRouter();
  const [roomUrl, setRoomUrl] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const handleJoinByUrl = useCallback((): void => {
    try {
      // Parse URL to extract roomId and other params
      const url = new URL(roomUrl);
      const pathname = url.pathname;
      
      // Expected format: /room/:roomId?role=participant
      if (pathname.startsWith("/room/")) {
        router.push(`${pathname}${url.search || "?role=participant"}`);
      } else {
        alert("올바른 방 링크가 아닙니다.");
      }
    } catch {
      alert("올바른 URL 형식이 아닙니다.");
    }
  }, [roomUrl, router]);

  const handleQrScan = (): void => {
    setIsScanning(true);
    // QR 스캔 기능은 추후 구현
    // 카메라 권한 요청 및 QR 코드 스캔
    alert("QR 코드 스캔 기능은 개발 중입니다.");
    setIsScanning(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-linear-to-b from-background to-muted/20">
      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">방 참가하기</h1>
            <p className="text-sm text-muted-foreground">
              QR 코드를 스캔하거나 링크를 입력하세요
            </p>
          </div>
        </div>

        {/* QR Scan Section */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-full aspect-square max-w-[280px] bg-muted/30 rounded-xl flex items-center justify-center border-2 border-dashed border-border">
              {isScanning ? (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    카메라로 QR 코드를 비춰주세요
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <QrCodeIcon className="w-16 h-16 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    QR 코드 스캔 영역
                  </p>
                </div>
              )}
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={handleQrScan}
              disabled={isScanning}
            >
              <QrCodeIcon className="w-5 h-5 mr-2" />
              {isScanning ? "스캔 중..." : "QR 코드 스캔하기"}
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              또는
            </span>
          </div>
        </div>

        {/* URL Input Section */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-url">방 링크 입력</Label>
            <Input
              id="room-url"
              type="text"
              placeholder="https://example.com/room/..."
              value={roomUrl}
              onChange={(e) => setRoomUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              방장에게 받은 링크를 입력해주세요
            </p>
          </div>
          <Button
            size="lg"
            className="w-full"
            onClick={handleJoinByUrl}
            disabled={!roomUrl.trim()}
          >
            링크로 참가하기
          </Button>
        </div>
      </div>
    </div>
  );
}
