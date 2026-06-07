import { Camera, Eye, Map, Play, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { usePhysicsStore, type CameraMode } from '../../store/usePhysicsStore';

const cameraModes: Array<{ id: CameraMode; label: string; icon: LucideIcon }> = [
  { id: 'TeeBox', label: 'Tee Box', icon: Camera },
  { id: 'Follow', label: 'Follow', icon: Play },
  { id: 'TopDown', label: 'Green View', icon: Map },
  { id: 'Free', label: 'Free Cam', icon: Eye },
];

export function CameraControlBar() {
  const cameraMode = usePhysicsStore((state) => state.cameraMode);
  const setCameraMode = usePhysicsStore((state) => state.setCameraMode);

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 p-1.5 glass-panel rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.4)] border border-white/10">
      {cameraModes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => setCameraMode(mode.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95',
            cameraMode === mode.id
              ? 'bg-blue-600 text-white shadow-md border border-blue-500/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/10 border border-transparent',
          )}
        >
          <mode.icon size={16} />
          {mode.label}
        </button>
      ))}
    </div>
  );
}
