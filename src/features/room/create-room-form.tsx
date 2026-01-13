'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useCreateRoomMutation } from '@/shared/api/room.queries';
import { saveOwnedRoom } from '@/shared/lib/room-storage';

export const CreateRoomForm: React.FC = () => {
  const router = useRouter();
  const [nickname, setNickname] = useState<string>('');

  const { mutate: createRoom, isPending, error } = useCreateRoomMutation();

  const handleCreateRoom = (): void => {
    createRoom(nickname.trim() ? { nickname: nickname.trim() } : {}, {
      onSuccess: response => {
        // localStorage에 생성한 방 정보 저장
        saveOwnedRoom(response.roomId);

        // ownerUrl을 사용하여 방으로 이동 (쿠키에 토큰이 자동으로 설정됨)
        const url = new URL(response.ownerUrl, window.location.origin);
        router.push(url.pathname + url.search);
      }
    });
  };

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
          disabled={isPending}
          maxLength={20}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">입력하지 않으면 자동으로 닉네임이 생성됩니다</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">방 생성에 실패했습니다. 다시 시도해주세요.</p>
        </div>
      )}

      <Button size="lg" onClick={handleCreateRoom} disabled={isPending} className="w-full h-12 text-base font-semibold">
        {isPending ? '방 만드는 중...' : '방 만들기'}
      </Button>
    </div>
  );
};
