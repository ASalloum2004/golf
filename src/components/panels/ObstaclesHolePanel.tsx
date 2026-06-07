import { Shield } from 'lucide-react';
import { Accordion } from '../controls/Accordion';
import { NumberInput } from '../controls/NumberInput';
import { usePhysicsStore } from '../../store/usePhysicsStore';

export function ObstaclesHolePanel() {
  const obstacleRestitution = usePhysicsStore((state) => state.obstacleRestitution);
  const obstacleFriction = usePhysicsStore((state) => state.obstacleFriction);
  const vegDamping = usePhysicsStore((state) => state.vegDamping);
  const cupRestitution = usePhysicsStore((state) => state.cupRestitution);
  const flagstickRestitution = usePhysicsStore((state) => state.flagstickRestitution);
  const flagstickFriction = usePhysicsStore((state) => state.flagstickFriction);
  const updateParam = usePhysicsStore((state) => state.updateParam);

  return (
    <Accordion title="Obstacles & Hole" icon={Shield}>
      <NumberInput
        label="Obstacle Restitution"
        value={obstacleRestitution}
        onChange={(value) => updateParam('obstacleRestitution', value)}
        min={0}
        max={1}
        step={0.05}
      />
      <NumberInput
        label="Obstacle Friction"
        value={obstacleFriction}
        onChange={(value) => updateParam('obstacleFriction', value)}
        min={0}
        max={1}
        step={0.05}
      />
      <NumberInput
        label="Vegetation Damping"
        value={vegDamping}
        onChange={(value) => updateParam('vegDamping', value)}
        min={0}
        max={1}
        step={0.05}
      />
      <NumberInput
        label="Cup Restitution"
        value={cupRestitution}
        onChange={(value) => updateParam('cupRestitution', value)}
        min={0}
        max={1}
        step={0.05}
      />
      <NumberInput
        label="Flag Restitution"
        value={flagstickRestitution}
        onChange={(value) => updateParam('flagstickRestitution', value)}
        min={0}
        max={1}
        step={0.05}
      />
      <NumberInput
        label="Flag Friction"
        value={flagstickFriction}
        onChange={(value) => updateParam('flagstickFriction', value)}
        min={0}
        max={1}
        step={0.05}
      />
    </Accordion>
  );
}
