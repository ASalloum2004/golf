import { cn } from '../../lib/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  compact?: boolean;
}

export function StatCard({ label, value, unit, compact = false }: StatCardProps) {
  return (
    <div className="flex flex-col justify-end border-l border-white/10 pl-4 py-1">
      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{label}</span>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span className={cn('font-light text-slate-100 font-mono leading-none', compact ? 'text-base' : 'text-xl')}>
          {value}
        </span>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}
