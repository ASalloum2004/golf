import { usePhysicsStore } from '../../store/usePhysicsStore';
import { NumberInput } from '../controls/NumberInput';
import { cn } from '../../lib/cn';

export function ShotPanel() {
  const initialVelocity = usePhysicsStore((state) => state.initialVelocity);
  const verticalAngle = usePhysicsStore((state) => state.verticalAngle);
  const horizontalAngle = usePhysicsStore((state) => state.horizontalAngle);
  const spinSpeed = usePhysicsStore((state) => state.spinSpeed);
  const spinAxis = usePhysicsStore((state) => state.spinAxis);
  const updateParam = usePhysicsStore((state) => state.updateParam);

  const spinTypeInfo = (() => {
    const absSpinAxis = Math.abs(spinAxis);
    if (absSpinAxis <= 20) return { text: 'Backspin', color: 'text-blue-400' };
    if (absSpinAxis >= 70) return { text: 'Sidespin', color: 'text-purple-400' };
    return { text: 'Mixed Spin', color: 'text-amber-400' };
  })();

  return (
    <>
      <NumberInput
        label="Initial Velocity"
        value={initialVelocity}
        onChange={(value) => updateParam('initialVelocity', value)}
        min={0}
        max={100}
        unit="m/s"
      />
      <NumberInput
        label="Vertical Angle"
        value={verticalAngle}
        onChange={(value) => updateParam('verticalAngle', value)}
        min={-20}
        max={90}
        unit="deg"
      />
      <NumberInput
        label="Horizontal Angle"
        value={horizontalAngle}
        onChange={(value) => updateParam('horizontalAngle', value)}
        min={-90}
        max={90}
        unit="deg"
      />
      <NumberInput
        label="Spin Speed"
        value={spinSpeed}
        onChange={(value) => updateParam('spinSpeed', value)}
        min={0}
        max={1000}
        unit="rad/s"
      />
      <NumberInput
        label="Spin Axis Tilt"
        value={spinAxis}
        onChange={(value) => updateParam('spinAxis', value)}
        min={-90}
        max={90}
        unit="deg"
      />
      <div className="flex items-center justify-between -mt-2 px-0.5">
        <span className="text-[10px] text-slate-600">Spin Type</span>
        <span className={cn('text-[10px] font-semibold', spinTypeInfo.color)}>{spinTypeInfo.text}</span>
      </div>
    </>
  );
}
