'use client';

import { useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { useQrScanner } from '../hooks/useQrScanner';
import { validateQrScanResult } from '@/shared/lib/url_validator';
import { useAlertStore } from '@/shared/store/alert.store';
import { Loader2Icon, CameraOffIcon, RefreshCwIcon } from 'lucide-react';

interface QrScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (roomPath: string) => void;
}

export const QrScannerDialog: React.FC<QrScannerDialogProps> = ({ open, onOpenChange, onScanSuccess }) => {
  const showAlert = useAlertStore(state => state.showAlert);

  const handleScanResult = useCallback(
    (scannedText: string): void => {
      const validation = validateQrScanResult(scannedText);

      if (!validation.isValid) {
        showAlert(validation.reason || '잘못된 QR 코드입니다.');
        return;
      }

      // 성공 시 다이얼로그 닫고 이동
      onOpenChange(false);
      onScanSuccess(validation.sanitizedPath!);
    },
    [showAlert, onOpenChange, onScanSuccess]
  );

  const { videoRef, isScanning, isLoading, error, startScanning, stopScanning } = useQrScanner({
    onScanSuccess: handleScanResult
  });

  // 다이얼로그 열릴 때 스캔 시작
  useEffect(() => {
    if (open) {
      startScanning();
    } else {
      stopScanning();
    }
  }, [open, startScanning, stopScanning]);

  const handleRetry = (): void => {
    startScanning();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR 코드 스캔</DialogTitle>
          <DialogDescription>카메라로 QR 코드를 비춰주세요</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* 카메라 프리뷰 영역 */}
          <div className="relative w-full aspect-square bg-muted/30 rounded-xl overflow-hidden">
            {/* 비디오 엘리먼트 */}
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted autoPlay />

            {/* 로딩 상태 */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80">
                <Loader2Icon className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">카메라 준비 중...</p>
              </div>
            )}

            {/* 에러 상태 */}
            {error && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 p-4">
                <CameraOffIcon className="w-12 h-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground text-center">{error}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={handleRetry}>
                  <RefreshCwIcon className="w-4 h-4 mr-2" />
                  다시 시도
                </Button>
              </div>
            )}

            {/* 스캔 가이드 오버레이 */}
            {isScanning && !isLoading && !error && (
              <div className="absolute inset-0 pointer-events-none">
                {/* 중앙 스캔 영역 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 relative">
                    {/* 모서리 인디케이터 */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />

                    {/* 스캔 애니메이션 라인 */}
                    <div className="absolute left-2 right-2 h-0.5 bg-primary/50 animate-scan-line" />
                  </div>
                </div>

                {/* 외곽 어두운 영역 */}
                <div
                  className="absolute inset-0 bg-black/40"
                  style={{
                    clipPath:
                      'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, calc(50% - 96px) calc(50% - 96px), calc(50% - 96px) calc(50% + 96px), calc(50% + 96px) calc(50% + 96px), calc(50% + 96px) calc(50% - 96px), calc(50% - 96px) calc(50% - 96px))'
                  }}
                />
              </div>
            )}
          </div>

          {/* 안내 메시지 */}
          {isScanning && !error && (
            <p className="text-xs text-muted-foreground text-center">QR 코드를 사각형 안에 맞춰주세요</p>
          )}

          {/* 닫기 버튼 */}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
