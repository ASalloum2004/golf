import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react';

interface AccordionProps {
  title: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function Accordion({ title, icon: Icon, defaultOpen = false, children }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-xs font-medium text-slate-300 hover:bg-white/[0.02] transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-slate-500" />
          <span className="uppercase tracking-wider">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown size={14} className="text-slate-600" />
        ) : (
          <ChevronRight size={14} className="text-slate-600" />
        )}
      </button>
      {isOpen && <div className="p-4 pt-0 space-y-4">{children}</div>}
    </div>
  );
}
