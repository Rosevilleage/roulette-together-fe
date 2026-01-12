'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { createRoom } from '@/shared/api/room.api';
import { saveOwnedRoom } from '@/shared/lib/room-storage';

export const CreateRoomForm: React.FC = () => {
  const router = useRouter();
  const [nickname, setNickname] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await createRoom(nickname.trim() ? { nickname: nickname.trim() } : {});

      // localStorage에 생성한 방 정보 저장
      saveOwnedRoom(response.roomId);

      // ownerUrl을 사용하여 방으로 이동 (쿠키에 토큰이 자동으로 설정됨)
      // ownerUrl 형식: /room/{roomId}?role=owner
      const url = new URL(response.ownerUrl, window.location.origin);
      router.push(url.pathname + url.search);
    } catch (err) {
      setError(err instanceof Error ? err.message : '방 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [nickname, router]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <Label htmlFor="nickname" className="text-sm font-medium">
          닉네임 (선택)
        </Label>
        <Input
          id="nickname"
          type="text"
          placeholder="닉네임을 입력하세요"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          disabled={isLoading}
          maxLength={20}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">입력하지 않으면 자동으로 닉네임이 생성됩니다</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Button size="lg" onClick={handleCreateRoom} disabled={isLoading} className="w-full h-12 text-base font-semibold">
        {isLoading ? '방 만드는 중...' : '방 만들기'}
      </Button>
    </div>
  );
};
