import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Plus, Square, Trash2, Trees } from 'lucide-react';
import { cn } from '../../lib/cn';
import { usePhysicsStore } from '../../store/usePhysicsStore';

export function ObjectManagerPanel() {
  const obstacles = usePhysicsStore((state) => state.obstacles);
  const selectedObstacle = usePhysicsStore((state) => state.selectedObstacle);
  const addObstacle = usePhysicsStore((state) => state.addObstacle);
  const shiftSelectedObstacle = usePhysicsStore((state) => state.shiftSelectedObstacle);
  const shiftObstacleZ = usePhysicsStore((state) => state.shiftObstacleZ);
  const removeSelectedObstacle = usePhysicsStore((state) => state.removeSelectedObstacle);
  const setSelectedObstacle = usePhysicsStore((state) => state.setSelectedObstacle);

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => addObstacle('Tree')}
          className="flex-1 py-2 glass-panel hover:bg-white/10 border border-white/5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-400 active:scale-95 transition-all"
        >
          <Plus size={14} /> Add Tree
        </button>
        <button
          onClick={() => addObstacle('Wall')}
          className="flex-1 py-2 glass-panel hover:bg-white/10 border border-white/5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium text-slate-300 active:scale-95 transition-all"
        >
          <Plus size={14} /> Add Wall
        </button>
      </div>

      {obstacles.length > 0 && (
        <div className="mt-4 p-3 glass-panel rounded-xl border border-white/5 bg-slate-900/30">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2 block">
            Scene Objects
          </label>
          <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1 mb-3">
            {obstacles.map((obstacle) => (
              <div
                key={obstacle.id}
                onClick={() => setSelectedObstacle(obstacle.id)}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border',
                  selectedObstacle === obstacle.id
                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-200'
                    : 'bg-white/5 hover:bg-white/10 border-transparent text-slate-400',
                )}
              >
                <div className="flex items-center gap-2">
                  {obstacle.type === 'Tree' ? (
                    <Trees size={14} className="text-emerald-500" />
                  ) : (
                    <Square size={14} className="text-slate-400" />
                  )}
                  <span className="text-xs font-medium">
                    {obstacle.type} {obstacle.id}
                  </span>
                </div>

                {selectedObstacle === obstacle.id && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      removeSelectedObstacle();
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {selectedObstacle && (
            <div className="pt-2 border-t border-white/10 space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 font-semibold mb-2 block">Shift Position (L / R)</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => shiftSelectedObstacle(-0.5)}
                    className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg flex justify-center text-slate-300 active:scale-95 transition-all border border-white/5"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    onClick={() => shiftSelectedObstacle(0.5)}
                    className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg flex justify-center text-slate-300 active:scale-95 transition-all border border-white/5"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-semibold mb-2 block">
                  Shift Distance (Fwd / Back)
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => shiftObstacleZ(-0.5)}
                    className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center gap-1.5 text-[11px] text-slate-300 active:scale-95 transition-all border border-white/5"
                  >
                    <ArrowUp size={14} />
                    <span>Fwd</span>
                  </button>
                  <button
                    onClick={() => shiftObstacleZ(0.5)}
                    className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center gap-1.5 text-[11px] text-slate-300 active:scale-95 transition-all border border-white/5"
                  >
                    <ArrowDown size={14} />
                    <span>Back</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
