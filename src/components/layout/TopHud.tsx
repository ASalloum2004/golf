import { useState } from 'react';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/cn';
import { StatCard } from '../metrics/StatCard';
import { usePhysicsStore } from '../../store/usePhysicsStore';

interface TopHudProps {
  isSidebarOpen: boolean;
}

export function TopHud({ isSidebarOpen }: TopHudProps) {
  const [isHudVisible, setIsHudVisible] = useState(true);
  const [isImpactRowVisible, setIsImpactRowVisible] = useState(true);
  const metrics = usePhysicsStore((state) => state.metrics);
  const isWin = metrics.status === 'You Win';
  const isLose = metrics.status === 'You Lose';
  const isResult = isWin || isLose;

  const reynoldsDisplay =
    metrics.reynoldsNumber === 0
      ? '--'
      : metrics.reynoldsNumber >= 1000
        ? `${(metrics.reynoldsNumber / 1000).toFixed(0)}k`
        : metrics.reynoldsNumber.toFixed(0);

  return (
    <div
      className={cn(
        'absolute top-6 z-10 transition-all duration-300 ease-in-out px-6 pointer-events-none flex justify-center',
        isSidebarOpen ? 'left-0 right-80' : 'left-0 right-0',
      )}
    >
      {isHudVisible ? (
        <div className="w-full max-w-5xl glass-panel rounded-2xl flex flex-col px-8 py-4 shadow-2xl pointer-events-auto gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 pr-8">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  metrics.status === 'Stopped'
                    ? 'bg-slate-500'
                    : metrics.status === 'Flying'
                      ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]'
                      : metrics.status === 'Rolling'
                        ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                        : isLose
                          ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                          : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
                )}
              />
              <span
                className={cn(
                  'font-medium text-slate-200',
                  isResult ? 'text-lg font-semibold' : 'text-sm',
                  isWin && 'text-emerald-300',
                  isLose && 'text-red-300',
                )}
              >
                {metrics.status}
              </span>
            </div>

            <div className="flex flex-1 justify-between gap-8">
              <StatCard label="Flight Time" value={metrics.flightTime.toFixed(2)} unit="s" />
              <StatCard label="Carry" value={metrics.carryDistance.toFixed(1)} unit="m" />
              <StatCard label="Total" value={metrics.totalDistance.toFixed(1)} unit="m" />
              <StatCard label="Max Height" value={metrics.maxHeight.toFixed(1)} unit="m" />
              <StatCard label="Deviation" value={metrics.sideDeviation.toFixed(1)} unit="m" />
            </div>

            <div className="flex items-center gap-1.5 pl-6 shrink-0">
              <button
                onClick={() => setIsImpactRowVisible((visible) => !visible)}
                aria-label={isImpactRowVisible ? 'Hide Impact Row' : 'Show Impact Row'}
                title={isImpactRowVisible ? 'Hide impact row' : 'Show impact row'}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-slate-900/75 text-slate-200 shadow-sm shadow-black/20 transition-all hover:border-white/25 hover:bg-slate-800/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/60"
              >
                <ChevronDown
                  size={16}
                  className={cn('transition-transform duration-200', !isImpactRowVisible && '-rotate-90')}
                />
              </button>
              <button
                onClick={() => setIsHudVisible(false)}
                aria-label="Hide HUD"
                title="Hide HUD"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-slate-900/75 text-slate-200 shadow-sm shadow-black/20 transition-all hover:border-white/25 hover:bg-slate-800/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/60"
              >
                <EyeOff size={16} />
              </button>
            </div>
          </div>

          {isImpactRowVisible && (
            <div className="flex items-center gap-8 border-t border-white/5 pt-2">
              <span className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold shrink-0">
                Impact
              </span>
              <div className="flex gap-8">
                <StatCard label="Land Speed" value={metrics.landingSpeed.toFixed(1)} unit="m/s" compact />
                <StatCard label="Land Angle" value={metrics.landingAngle.toFixed(1)} unit="deg" compact />
                <StatCard label="Reynolds No" value={reynoldsDisplay} compact />
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsHudVisible(true)}
          className="glass-panel pointer-events-auto px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900/70 hover:bg-slate-800/90 border border-white/15 hover:border-white/25 transition-all shadow-lg"
        >
          <Eye size={13} />
          Show HUD
        </button>
      )}
    </div>
  );
}
