import { Loader2, Play, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/cn';
import { usePhysicsStore } from '../../store/usePhysicsStore';

export function LeftToolbar() {
  const simActive = usePhysicsStore((state) => state.simActive);
  const canShoot = usePhysicsStore((state) => state.canShoot);
  const hitBall = usePhysicsStore((state) => state.hitBall);
  const restartAttempt = usePhysicsStore((state) => state.restartAttempt);

  return (
    <div className="absolute bottom-8 left-8 z-10 flex flex-col gap-3">
      <button
        onClick={hitBall}
        disabled={!canShoot}
        className={cn(
          'flex items-center justify-center gap-2 text-white px-8 py-4 rounded-xl font-medium transition-all active:scale-95',
          !canShoot
            ? 'bg-blue-900/80 cursor-not-allowed shadow-none border border-blue-800/40'
            : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]',
        )}
      >
        {simActive ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            SIMULATING...
          </>
        ) : (
          <>
            <Play size={18} fill="currentColor" />
            HIT BALL
          </>
        )}
      </button>
      <button
        onClick={restartAttempt}
        className="flex items-center justify-center gap-2 glass-panel hover:bg-white/5 text-slate-300 px-6 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 border border-white/10"
      >
        <RotateCcw size={16} />
        Reset
      </button>
    </div>
  );
}
