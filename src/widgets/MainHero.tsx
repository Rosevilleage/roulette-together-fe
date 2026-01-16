import { CreateRoomForm } from '@/features/room/create-room/ui/CreateRoomForm';

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
            친구들과 함께 실시간으로 랜덤 뽑기를 해보세요
          </p>
        </div>

        {/* Decorative Gacha Machine Icon */}
        <div className="relative w-40 h-48 sm:w-48 sm:h-56">
          <svg
            viewBox="0 0 120 150"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-lg"
          >
            {/* Machine Body */}
            <rect x="15" y="50" width="90" height="90" rx="8" className="fill-primary/90" />
            {/* Machine Top Dome */}
            <ellipse cx="60" cy="50" rx="45" ry="20" className="fill-primary" />
            {/* Glass Globe */}
            <circle cx="60" cy="40" r="32" className="fill-background/80 stroke-primary/60" strokeWidth="3" />
            {/* Balls inside */}
            <circle cx="48" cy="35" r="8" className="fill-red-400 animate-pulse" />
            <circle cx="68" cy="32" r="7" className="fill-yellow-400" />
            <circle cx="55" cy="48" r="6" className="fill-blue-400" />
            <circle cx="72" cy="45" r="7" className="fill-green-400 animate-pulse" />
            <circle cx="45" cy="50" r="5" className="fill-purple-400" />
            <circle cx="62" cy="55" r="6" className="fill-pink-400" />
            {/* Dispenser Hole */}
            <rect x="45" y="100" width="30" height="20" rx="4" className="fill-background/90" />
            {/* Coin Slot */}
            <rect x="80" y="70" width="15" height="4" rx="2" className="fill-yellow-500" />
            {/* Handle/Knob */}
            <circle cx="95" cy="85" r="8" className="fill-primary/70 stroke-primary" strokeWidth="2" />
            <circle cx="95" cy="85" r="4" className="fill-background" />
            {/* Base */}
            <rect x="10" y="140" width="100" height="10" rx="4" className="fill-primary/80" />
            {/* Legs */}
            <rect x="20" y="130" width="10" height="15" rx="2" className="fill-primary/70" />
            <rect x="90" y="130" width="10" height="15" rx="2" className="fill-primary/70" />
            {/* Shine effect on globe */}
            <ellipse cx="48" cy="28" rx="8" ry="4" className="fill-white/40" />
          </svg>
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
