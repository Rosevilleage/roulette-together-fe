import { CreateRoomForm } from "@/features/room/create-room-form";

export const MainHero: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-linear-to-b from-background to-muted/20">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        {/* Logo/Title Section */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
            <h1 className="relative text-5xl sm:text-6xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              룰렛 투게더
            </h1>
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

        {/* Form Section */}
        <div className="w-full bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
          <CreateRoomForm />
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
