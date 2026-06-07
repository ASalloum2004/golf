import { Settings, Trees, Zap } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Accordion } from '../controls/Accordion';
import { ObjectManagerPanel } from '../panels/ObjectManagerPanel';
import { ShotPanel } from '../panels/ShotPanel';
import { ClubPanel, BallPanel } from '../panels/ClubBallPanel';
import { EnvironmentPanel } from '../panels/EnvironmentPanel';
import { AerodynamicsPanel } from '../panels/AerodynamicsPanel';
import { TerrainPanel } from '../panels/TerrainPanel';
import { ObstaclesHolePanel } from '../panels/ObstaclesHolePanel';

interface RightSidebarProps {
  isOpen: boolean;
}

export function RightSidebar({ isOpen }: RightSidebarProps) {
  return (
    <div
      className={cn(
        'absolute top-0 right-0 h-full w-80 glass-panel border-r-0 border-y-0 border-l border-white/10 z-20 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out',
        !isOpen && 'translate-x-full',
      )}
    >
      <div className="p-5 border-b border-white/10 flex items-center gap-3 bg-slate-900/50">
        <Settings className="text-blue-500" size={20} />
        <h1 className="text-sm font-semibold text-slate-100 tracking-wide">PHYSICS ENGINE</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Accordion title="Object Manager" icon={Trees} defaultOpen>
          <ObjectManagerPanel />
        </Accordion>

        <Accordion title="Launch Conditions" icon={Zap}>
          <ShotPanel />
        </Accordion>

        <ClubPanel />
        <BallPanel />
        <EnvironmentPanel />
        <AerodynamicsPanel />
        <TerrainPanel />
        <ObstaclesHolePanel />
      </div>
    </div>
  );
}
