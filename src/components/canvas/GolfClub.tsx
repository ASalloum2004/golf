import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { usePhysicsStore } from '../../store/usePhysicsStore';

interface GolfClubProps {
  radius: number;
  loftRotation: number;
}

export function GolfClub({ radius, loftRotation }: GolfClubProps) {
  const ref = useRef<THREE.Group>(null);
  const swingTime = useRef(-1);
  const wasActive = useRef(false);
  const simActive = usePhysicsStore((state) => state.simActive);

  useFrame((_, delta) => {
    if (simActive && !wasActive.current) {
      swingTime.current = 0;
    }
    wasActive.current = simActive;

    if (!ref.current) return;

    if (swingTime.current >= 0) {
      const duration = 0.58;
      swingTime.current += delta;
      const t = Math.min(swingTime.current / duration, 1);
      const windup = Math.sin(Math.min(t / 0.34, 1) * Math.PI * 0.5);
      const followThrough = Math.max(0, (t - 0.34) / 0.66);
      const angle = -0.72 * windup + 1.05 * followThrough;

      ref.current.rotation.z = angle;
      ref.current.position.z = 0.04 - Math.sin(t * Math.PI) * 0.08;

      if (t >= 1) swingTime.current = -1;
    } else {
      ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, 0, 10 * delta);
      ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, 0.04, 10 * delta);
    }
  });

  return (
    <group ref={ref} position={[0, radius, 0.04]}>
      <group rotation={[loftRotation, 0, 0]}>
        <mesh castShadow position={[-0.015, -0.005, 0]}>
          <boxGeometry args={[0.07, 0.015, 0.03]} />
          <meshStandardMaterial color="#e5e7eb" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
      <mesh castShadow position={[0.02, 0.45, 0]} rotation={[0, 0, -0.1]}>
        <cylinderGeometry args={[0.004, 0.004, 0.9]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh castShadow position={[0.065, 0.9, 0]} rotation={[0, 0, -0.1]}>
        <cylinderGeometry args={[0.006, 0.006, 0.25]} />
        <meshStandardMaterial color="#1f2937" roughness={0.8} />
      </mesh>
    </group>
  );
}
