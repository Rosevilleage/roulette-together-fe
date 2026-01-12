'use client';

import { useRoomStore } from '@/shared/store/room.store';
import { OwnerView } from './owner-view';
import { ParticipantView } from './participant-view';

export const RoomWaiting: React.FC = () => {
  const { isOwner, myNickname } = useRoomStore();

  if (!myNickname) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">방에 입장하는 중...</p>
        </div>
      </div>
    );
  }

  return isOwner ? <OwnerView /> : <ParticipantView />;
};
