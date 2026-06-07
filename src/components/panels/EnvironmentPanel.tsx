import { Wind } from 'lucide-react';
import { Accordion } from '../controls/Accordion';
import { NumberInput } from '../controls/NumberInput';
import { Toggle } from '../controls/Toggle';
import { usePhysicsStore } from '../../store/usePhysicsStore';

export function EnvironmentPanel() {
  const gravity = usePhysicsStore((state) => state.gravity);
  const airDensity = usePhysicsStore((state) => state.airDensity);
  const windSpeed = usePhysicsStore((state) => state.windSpeed);
  const windDirection = usePhysicsStore((state) => state.windDirection);
  const dynamicViscosity = usePhysicsStore((state) => state.dynamicViscosity);
  const buoyancy = usePhysicsStore((state) => state.buoyancy);
  const updateParam = usePhysicsStore((state) => state.updateParam);

  return (
    <Accordion title="Environment" icon={Wind}>
      <NumberInput
        label="Gravity"
        value={gravity}
        onChange={(value) => updateParam('gravity', value)}
        min={1}
        max={25}
        step={0.1}
        unit="m/s^2"
      />
      <NumberInput
        label="Air Density"
        value={airDensity}
        onChange={(value) => updateParam('airDensity', value)}
        min={0}
        max={2}
        step={0.05}
        unit="kg/m^3"
      />
      <NumberInput
        label="Wind Speed"
        value={windSpeed}
        onChange={(value) => updateParam('windSpeed', value)}
        min={0}
        max={30}
        step={0.5}
        unit="m/s"
      />
      <NumberInput
        label="Wind Direction"
        value={windDirection}
        onChange={(value) => updateParam('windDirection', value)}
        min={0}
        max={359}
        unit="deg"
      />
      <NumberInput
        label="Dynamic Viscosity (mu)"
        value={dynamicViscosity}
        onChange={(value) => updateParam('dynamicViscosity', value)}
        min={0.00001}
        max={0.00003}
        step={0.000001}
        unit="Pa*s"
      />
      <div className="pt-2">
        <Toggle label="Buoyancy" checked={buoyancy} onChange={(value) => updateParam('buoyancy', value)} />
      </div>
    </Accordion>
  );
}
