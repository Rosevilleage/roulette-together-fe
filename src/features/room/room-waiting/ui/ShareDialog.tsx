'use client';

import { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { QrCodeIcon, LinkIcon, CopyIcon, CheckIcon, Share2Icon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
}

type TabType = 'qr' | 'link';

// Web Share API 지원 여부 (클라이언트에서만 확인)
const getCanShare = (): boolean => typeof navigator !== 'undefined' && !!navigator.share;

export const ShareDialog: React.FC<ShareDialogProps> = ({ open, onOpenChange, roomId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('qr');
  const [copied, setCopied] = useState(false);
  const [canShare] = useState(getCanShare);

  const shareUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/room/${roomId}?role=participant`;

  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 복사 실패 시 fallback
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const handleShare = useCallback(async (): Promise<void> => {
    if (!navigator.share) return;

    try {
      await navigator.share({
        title: '룰렛 투게더',
        text: '함께 룰렛을 돌려봐요!',
        url: shareUrl
      });
    } catch {
      // 사용자가 공유 취소하거나 실패 시 무시
    }
  }, [shareUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>방 공유하기</DialogTitle>
          <DialogDescription>QR 코드를 스캔하거나 링크를 공유하세요.</DialogDescription>
        </DialogHeader>

        {/* 탭 버튼 */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === 'qr'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <QrCodeIcon className="w-4 h-4" />
            QR 코드
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === 'link'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LinkIcon className="w-4 h-4" />
            링크 공유
          </button>
        </div>

        {/* 탭 내용 */}
        <div className="min-h-[200px] flex flex-col items-center justify-center">
          {activeTab === 'qr' ? (
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-xl">
                <QRCodeSVG value={shareUrl} size={160} level="M" />
              </div>
              <p className="text-sm text-muted-foreground text-center">스캔하여 방에 참가하세요</p>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-4">
              <div className="p-3 bg-muted rounded-lg break-all text-sm font-mono">{shareUrl}</div>
              <div className="flex gap-2">
                {canShare && (
                  <Button onClick={handleShare} className="flex-1 gap-2">
                    <Share2Icon className="w-4 h-4" />
                    공유하기
                  </Button>
                )}
                <Button onClick={handleCopy} variant={canShare ? 'outline' : 'default'} className="flex-1 gap-2">
                  {copied ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      복사됨!
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-4 h-4" />
                      복사하기
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
