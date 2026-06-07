import { cn } from '../../lib/cn';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-[11px] text-slate-400 font-medium">{label}</label>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-4 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none',
          checked ? 'bg-blue-500' : 'bg-slate-700',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-2' : '-translate-x-2',
          )}
        />
      </button>
    </div>
  );
}
