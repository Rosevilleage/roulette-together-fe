import type { ReactElement } from 'react';
import { Suspense } from 'react';
import { RoomClientContent } from '@/app/room/RoomClientContent';

function RoomPageFallback(): ReactElement {
  return <div className="min-h-dvh bg-background" />;
}

export default function RoomRoutePage(): ReactElement {
  return (
    <Suspense fallback={<RoomPageFallback />}>
      <RoomClientContent />
    </Suspense>
  );
}
