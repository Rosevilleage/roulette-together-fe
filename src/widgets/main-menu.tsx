'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/shared/ui/dialog';
import { CreateRoomStepper } from '@/features/room/create-room-stepper';
import { PlusIcon, QrCodeIcon, DicesIcon } from 'lucide-react';
import Shuffle from '@/shared/ui/Shuffle';

export const MainMenu: React.FC = () => {
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
            <Shuffle
              text="룰렛 투게더"
              tag="h1"
              className="normal-case! relative text-5xl sm:text-6xl font-bold **:bg-linear-to-r! **:from-primary! **:to-primary/60! **:bg-clip-text! **:text-transparent!"
              shuffleDirection="right"
              duration={0.5}
              stagger={0.05}
              triggerOnce={false}
              loop={false}
              triggerOnHover={true}
              textAlign="center"
            />
          </div>
          <p className="text-muted-foreground text-sm sm:text-base max-w-sm">
            친구들과 함께 실시간으로 룰렛을 돌려보세요
          </p>
        </div>

        {/* Decorative Roulette Icon */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40">
          <div className="absolute inset-0 border-8 border-primary/20 rounded-full animate-spin-slow" />
          <div className="absolute inset-4 border-4 border-primary/40 rounded-full animate-spin-reverse-slow" />
          <div className="absolute inset-8 bg-linear-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
            <span className="text-4xl">🎯</span>
          </div>
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
            혼자 룰렛 돌리기
          </Button>
        </div>

        {/* Info Section */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-primary">✓</span>
            <span>실시간 동기화</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary">✓</span>
            <span>쉬운 링크 공유</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary">✓</span>
            <span>무료 사용</span>
          </div>
        </div>
      </div>
    </div>
  );
};
