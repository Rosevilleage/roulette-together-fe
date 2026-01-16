'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/shared/ui/Button';
import { Dialog, DialogContent, DialogTrigger } from '@/shared/ui/Dialog';
import { CreateRoomStepper } from '@/features/room/create-room/ui/CreateRoomStepper';
import { RoomList } from '@/features/room/create-room/ui/RoomList';
import { PlusIcon, QrCodeIcon, DicesIcon } from 'lucide-react';
import { InteractiveCardDeck } from '@/shared/ui/InteractiveCardDeck';
import Shuffle from '@/shared/ui/Shuffle';

export const HomePage: React.FC = () => {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleSoloRoulette = (): void => {
    router.push('/solo');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-linear-to-b from-background to-muted/20">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        {/* Logo/Title Section */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
            <div className="relative flex items-center gap-2">
              <Shuffle
                text="당첨?"
                tag="h1"
                className="normal-case! text-5xl sm:text-6xl font-bold **:bg-linear-to-r! **:from-primary! **:to-primary/60! **:bg-clip-text! **:text-transparent!"
                shuffleDirection="right"
                duration={0.5}
                stagger={0.05}
                triggerOnHover={true}
              />
              <span className="text-4xl sm:text-5xl">😱</span>
              <Shuffle
                text="당첨!"
                tag="h1"
                className="normal-case! text-5xl sm:text-6xl font-bold **:bg-linear-to-r! **:from-primary/60! **:to-primary! **:bg-clip-text! **:text-transparent!"
                shuffleDirection="left"
                duration={0.5}
                stagger={0.05}
                triggerOnHover={true}
              />
              <span className="text-4xl sm:text-5xl">🎉</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base max-w-sm">
            친구들과 함께 실시간으로 랜덤 뽑기를 해보세요
          </p>
        </div>

        {/* Interactive Card Deck */}
        <InteractiveCardDeck size={1.2} />

        {/* Room List */}
        <div className="w-full">
          <RoomList />
        </div>

        {/* Menu Options */}
        <div className="w-full flex flex-col gap-3">
          {/* Create Room */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger
              suppressHydrationWarning
              className="inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-14 px-8 w-full text-base"
            >
              <PlusIcon className="w-5 h-5" />방 만들기
            </DialogTrigger>
            <DialogContent
              showCloseButton={false}
              className="bg-transparent border-transparent shadow-none outline-none ring-0 p-0"
            >
              <CreateRoomStepper onComplete={() => setIsCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>

          {/* Join Room */}
          <Button
            size="lg"
            variant="outline"
            className="w-full h-14 text-base font-semibold gap-2"
            onClick={() => {
              // QR 스캔 기능은 별도 페이지에서 구현
              router.push('/join');
            }}
          >
            <QrCodeIcon className="w-5 h-5" />방 참가하기
          </Button>

          {/* Solo Roulette */}
          <Button
            size="lg"
            variant="secondary"
            className="w-full h-14 text-base font-semibold gap-2"
            onClick={handleSoloRoulette}
          >
            <DicesIcon className="w-5 h-5" />
            혼자 랜덤 뽑기
          </Button>
        </div>
      </div>
    </div>
  );
};
