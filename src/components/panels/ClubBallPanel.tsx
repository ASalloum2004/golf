import { Activity, Circle as CircleIcon } from 'lucide-react';
import { Accordion } from '../controls/Accordion';
import { NumberInput } from '../controls/NumberInput';
import { usePhysicsStore } from '../../store/usePhysicsStore';

export function ClubPanel() {
  const loftAngle = usePhysicsStore((state) => state.loftAngle);
  const clubFriction = usePhysicsStore((state) => state.clubFriction);
  const updateParam = usePhysicsStore((state) => state.updateParam);

  return (
    <Accordion title="Club Impact" icon={Activity}>
      <NumberInput
        label="Loft Angle"
        value={loftAngle}
        onChange={(value) => updateParam('loftAngle', value)}
        min={0}
        max={64}
        unit="deg"
      />
      <NumberInput
        label="Club Friction"
        value={clubFriction}
        onChange={(value) => updateParam('clubFriction', value)}
        min={0}
        max={1}
        step={0.05}
      />
    </Accordion>
  );
}

export function BallPanel() {
  const mass = usePhysicsStore((state) => state.mass);
  const radius = usePhysicsStore((state) => state.radius);
  const inertiaConstant = usePhysicsStore((state) => state.inertiaConstant);
  const updateParam = usePhysicsStore((state) => state.updateParam);

  return (
    <Accordion title="Ball Properties" icon={CircleIcon}>
      <NumberInput
        label="Mass"
        value={mass}
        onChange={(value) => updateParam('mass', value)}
        min={30}
        max={60}
        step={0.1}
        unit="g"
      />
      <NumberInput
        label="Radius"
        value={radius}
        onChange={(value) => updateParam('radius', value)}
        min={0.015}
        max={0.03}
        step={0.001}
        unit="m"
      />
      <NumberInput
        label="Inertia Constant (k)"
        value={inertiaConstant}
        onChange={(value) => updateParam('inertiaConstant', value)}
        min={0.1}
        max={0.4}
        step={0.01}
      />
    </Accordion>
  );
}
