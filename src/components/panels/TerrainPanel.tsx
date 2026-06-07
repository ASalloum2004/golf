import { Layers } from 'lucide-react';
import { Accordion } from '../controls/Accordion';
import { NumberInput } from '../controls/NumberInput';
import { SelectControl } from '../controls/SelectControl';
import { usePhysicsStore, type SurfaceType } from '../../store/usePhysicsStore';

const surfaceOptions = ['Green', 'Fairway', 'Rough', 'Sand'] as const satisfies readonly SurfaceType[];

export function TerrainPanel() {
  const surface = usePhysicsStore((state) => state.surface);
  const restitution = usePhysicsStore((state) => state.restitution);
  const surfaceFriction = usePhysicsStore((state) => state.surfaceFriction);
  const rollingResistance = usePhysicsStore((state) => state.rollingResistance);
  const setSurface = usePhysicsStore((state) => state.setSurface);
  const updateParam = usePhysicsStore((state) => state.updateParam);

  return (
    <Accordion title="Surfaces & Terrain" icon={Layers}>
      <SelectControl label="Terrain Type" value={surface} options={surfaceOptions} onChange={setSurface} />
      <div className="mt-4 space-y-4">
        <NumberInput
          label="Restitution (e)"
          value={restitution}
          onChange={(value) => updateParam('restitution', value)}
          min={0}
          max={1}
          step={0.05}
        />
        <NumberInput
          label="Friction (mu)"
          value={surfaceFriction}
          onChange={(value) => updateParam('surfaceFriction', value)}
          min={0}
          max={1}
          step={0.05}
        />
        <NumberInput
          label="Rolling Resistance (k_roll)"
          value={rollingResistance}
          onChange={(value) => updateParam('rollingResistance', value)}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
    </Accordion>
  );
}
