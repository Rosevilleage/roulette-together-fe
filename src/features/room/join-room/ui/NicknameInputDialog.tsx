'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/Dialog';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { Label } from '@/shared/ui/Label';

interface NicknameInputDialogProps {
  open: boolean;
  onSubmit: (nickname: string) => void;
}

export const NicknameInputDialog: React.FC<NicknameInputDialogProps> = ({ open, onSubmit }) => {
  const [nickname, setNickname] = useState<string>('');

  const handleSubmit = (): void => {
    onSubmit(nickname.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>닉네임 입력</DialogTitle>
          <DialogDescription>방에서 사용할 닉네임을 입력해주세요</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nickname">닉네임 (선택)</Label>
            <Input
              id="nickname"
              type="text"
              placeholder="닉네임을 입력하세요"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={20}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">입력하지 않으면 자동으로 닉네임이 생성됩니다</p>
          </div>
          <Button onClick={handleSubmit} className="w-full">
            입장하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
