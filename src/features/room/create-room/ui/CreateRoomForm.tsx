'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Label } from '@/shared/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/Select';
import { useCreateRoomMutation } from '@/entities/room/api/room.queries';
import { saveOwnedRoom } from '@/entities/room/lib/room_storage';
import type { WinSentiment } from '@/entities/room/model/room.types';
import { UsersIcon, TrophyIcon } from 'lucide-react';

export const CreateRoomForm: React.FC = () => {
  const router = useRouter();
  const [nickname, setNickname] = useState<string>('');
  const [winnersCount, setWinnersCount] = useState<number>(1);
  const [winSentiment, setWinSentiment] = useState<WinSentiment>('POSITIVE');

  const { mutate: createRoom, isPending, error } = useCreateRoomMutation();

  const handleCreateRoom = (): void => {
    createRoom(
      {
        ...(nickname.trim() && { nickname: nickname.trim() }),
        winnersCount,
        winSentiment
      },
      {
        onSuccess: response => {
          // localStorage에 생성한 방 정보 저장
          saveOwnedRoom(response.roomId);

          // 방으로 이동 (쿠키에 토큰이 자동으로 설정됨)
          router.push(`/room/${response.roomId}?role=owner`);
        }
      }
    );
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

      {/* 당첨자 수 */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="winners-count">
          <UsersIcon className="w-4 h-4" />
          당첨자 수
        </Label>
        <Select value={String(winnersCount)} onValueChange={v => setWinnersCount(Number(v))} disabled={isPending}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
              <SelectItem key={num} value={String(num)}>
                {num}명
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">최대 10명까지 선택 가능 (방에서 변경 가능)</p>
      </div>

      {/* 당첨 감정 */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="win-sentiment">
          <TrophyIcon className="w-4 h-4" />
          당첨 감정
        </Label>
        <Select value={winSentiment} onValueChange={v => setWinSentiment(v as WinSentiment)} disabled={isPending}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="POSITIVE">긍정적 (당첨 = 좋은 것)</SelectItem>
            <SelectItem value="NEGATIVE">부정적 (당첨 = 벌칙)</SelectItem>
          </SelectContent>
        </Select>
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
