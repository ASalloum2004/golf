import { Target } from 'lucide-react';
import { Accordion } from '../controls/Accordion';
import { NumberInput } from '../controls/NumberInput';
import { usePhysicsStore } from '../../store/usePhysicsStore';

export function AerodynamicsPanel() {
  const dragCoeff = usePhysicsStore((state) => state.dragCoeff);
  const liftCoeff = usePhysicsStore((state) => state.liftCoeff);
  const sideForceCoeff = usePhysicsStore((state) => state.sideForceCoeff);
  const spinDamping = usePhysicsStore((state) => state.spinDamping);
  const updateParam = usePhysicsStore((state) => state.updateParam);

  return (
    <Accordion title="Aerodynamics" icon={Target}>
      <NumberInput
        label="Drag Coefficient (Cd)"
        value={dragCoeff}
        onChange={(value) => updateParam('dragCoeff', value)}
        min={0}
        max={1}
        step={0.01}
      />
      <NumberInput
        label="Lift Coefficient (Cl)"
        value={liftCoeff}
        onChange={(value) => updateParam('liftCoeff', value)}
        min={0}
        max={1}
        step={0.01}
      />
      <NumberInput
        label="Side Force Coeff (Cs)"
        value={sideForceCoeff}
        onChange={(value) => updateParam('sideForceCoeff', value)}
        min={0}
        max={1}
        step={0.01}
      />
      <NumberInput
        label="Spin Damping (k_spin)"
        value={spinDamping}
        onChange={(value) => updateParam('spinDamping', value)}
        min={0}
        max={0.5}
        step={0.005}
        unit="1/s"
      />
    </Accordion>
  );
}
