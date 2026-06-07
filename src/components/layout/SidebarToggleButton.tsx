import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { cn } from '../../lib/cn';

interface SidebarToggleButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function SidebarToggleButton({ isOpen, onToggle }: SidebarToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'absolute top-6 z-30 glass-panel p-2.5 rounded-xl text-slate-400 hover:text-white transition-all duration-300 shadow-lg border border-white/10 hover:bg-white/5',
        isOpen ? 'right-[340px]' : 'right-6',
      )}
    >
      {isOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
    </button>
  );
}
