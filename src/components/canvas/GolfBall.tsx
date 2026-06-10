import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { usePhysicsStore } from '../../store/usePhysicsStore';
import { CUP_CENTER } from '../../physics/constants';

interface GolfBallProps {
  position: [number, number, number];
  radius: number;
  isGreenView?: boolean;
}

export function GolfBall({ position, radius, isGreenView = false }: GolfBallProps) {
  const ref = useRef<THREE.Mesh>(null);
  const dropProgress = useRef(-1);
  const wasWin = useRef(false);
  const status = usePhysicsStore((state) => state.metrics.status);

  // In green view: render a large visible sphere centered at ground level
  const visualRadius = isGreenView ? 1.2 : radius;
  const visualY = isGreenView ? visualRadius : position[1];

  useFrame((_, delta) => {
    const isWin = status === 'You Win';

    if (isWin && !wasWin.current) {
      dropProgress.current = 0;
    }
    wasWin.current = isWin;

    if (!ref.current) return;

    if (!isWin) {
      dropProgress.current = -1;
      ref.current.visible = true;
      ref.current.scale.setScalar(1);
      ref.current.position.set(position[0], visualY, position[2]);
      return;
    }

    dropProgress.current = Math.min(1, Math.max(0, dropProgress.current) + delta / 0.58);

    const t = dropProgress.current;
    const eased = 1 - Math.pow(1 - t, 3);
    const lateSink = Math.max(0, (eased - 0.32) / 0.68);
    const dropDepth = Math.max(radius * 6.5, 0.14);

    ref.current.position.set(
      THREE.MathUtils.lerp(position[0], CUP_CENTER.x, eased),
      THREE.MathUtils.lerp(visualY, -dropDepth, eased),
      THREE.MathUtils.lerp(position[2], CUP_CENTER.z, eased),
    );
    ref.current.scale.setScalar(THREE.MathUtils.lerp(1, 0.42, lateSink));
    ref.current.visible = eased < 0.86;
  });

  return (
    <mesh ref={ref} castShadow receiveShadow position={[position[0], visualY, position[2]]}>
      <sphereGeometry args={[visualRadius, isGreenView ? 16 : 64, isGreenView ? 16 : 64]} />
      {isGreenView ? (
        <meshBasicMaterial color="#facc15" />
      ) : (
        <meshPhysicalMaterial
          color="#ffffff"
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          roughness={0.2}
          metalness={0.1}
        />
      )}
    </mesh>
  );
}
