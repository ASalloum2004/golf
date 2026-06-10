import * as THREE from 'three';
import { CUP_CENTER, PLAY_AREA, WATER_POND } from '../../physics/constants';

export function Tree() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.8, 0]} castShadow>
        <coneGeometry args={[1.2, 2, 8]} />
        <meshStandardMaterial color="#14532d" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.8, 0]} castShadow>
        <coneGeometry args={[0.8, 1.5, 8]} />
        <meshStandardMaterial color="#166534" roughness={0.8} />
      </mesh>
    </group>
  );
}

export function Wall() {
  return (
    <mesh castShadow position={[0, 0.6, 0]}>
      <boxGeometry args={[2.5, 1.2, 0.4]} />
      <meshStandardMaterial color="#71717a" roughness={0.9} />
    </mesh>
  );
}

function Bush({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={[scale, scale, scale]}>
      <mesh castShadow receiveShadow position={[0, 0.26, 0]} scale={[0.85, 0.55, 0.7]}>
        <sphereGeometry args={[0.55, 16, 10]} />
        <meshStandardMaterial color="#166534" roughness={0.92} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.34, 0.22, 0.12]} scale={[0.62, 0.46, 0.58]}>
        <sphereGeometry args={[0.5, 14, 8]} />
        <meshStandardMaterial color="#15803d" roughness={0.94} />
      </mesh>
      <mesh castShadow receiveShadow position={[0.36, 0.24, -0.08]} scale={[0.6, 0.48, 0.55]}>
        <sphereGeometry args={[0.48, 14, 8]} />
        <meshStandardMaterial color="#14532d" roughness={0.94} />
      </mesh>
    </group>
  );
}

function CourseDecor() {
  const trees = [
    [PLAY_AREA.minX - 3.1, 0, PLAY_AREA.maxZ - 12, 0.9, 0.2],
    [PLAY_AREA.maxX + 3.3, 0, PLAY_AREA.maxZ - 28, 1.0, -0.5],
    [PLAY_AREA.minX - 3.5, 0, PLAY_AREA.minZ + 26, 1.05, 0.8],
    [PLAY_AREA.maxX + 3.4, 0, PLAY_AREA.minZ + 18, 0.9, -0.9],
    [-22, 0, PLAY_AREA.minZ - 3.2, 0.95, 0.25],
    [24, 0, PLAY_AREA.minZ - 3.1, 1.08, -0.35],
  ] as const;
  const bushes = [
    [PLAY_AREA.minX - 1.0, 0, 2, 0.74],
    [PLAY_AREA.maxX + 1.0, 0, -15, 0.82],
    [PLAY_AREA.minX - 1.05, 0, -36, 0.7],
    [PLAY_AREA.maxX + 1.05, 0, -54, 0.78],
    [PLAY_AREA.minX - 1.0, 0, -82, 0.86],
    [PLAY_AREA.maxX + 1.0, 0, -92, 0.72],
    [-28, 0, PLAY_AREA.maxZ + 1.0, 0.7],
    [18, 0, PLAY_AREA.maxZ + 1.0, 0.78],
    [-12, 0, PLAY_AREA.minZ - 1.0, 0.82],
    [10, 0, PLAY_AREA.minZ - 1.0, 0.72],
  ] as const;

  return (
    <group>
      {trees.map(([x, y, z, scale, rotation]) => (
        <group key={`decor-tree-${x}-${z}`} position={[x, y, z]} scale={[scale, scale, scale]} rotation={[0, rotation, 0]}>
          <Tree />
        </group>
      ))}
      {bushes.map(([x, y, z, scale]) => (
        <group key={`decor-bush-${x}-${z}`} position={[x, y, z]}>
          <Bush scale={scale} />
        </group>
      ))}
    </group>
  );
}

function TargetHole({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh receiveShadow position={[0, -0.115, 0]}>
        <cylinderGeometry args={[0.148, 0.108, 0.26, 64, 1, true]} />
        <meshStandardMaterial color="#dbe5ef" roughness={0.72} side={THREE.DoubleSide} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.21, 0]}>
        <circleGeometry args={[0.106, 64]} />
        <meshStandardMaterial color="#020617" roughness={1} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.124, 64]} />
        <meshStandardMaterial color="#030712" roughness={1} />
      </mesh>
      <mesh position={[0, 0.018, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.148, 0.011, 12, 64]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.48} />
      </mesh>
      <mesh castShadow receiveShadow position={[0.025, 1.05, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 2.1, 12]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.2} />
      </mesh>
      <mesh castShadow position={[0.3, 1.86, 0]} rotation={[0, 0.04, 0]}>
        <planeGeometry args={[0.55, 0.32]} />
        <meshStandardMaterial color="#ef4444" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function WaterPond() {
  const bankScale: [number, number, number] = [WATER_POND.radiusX + 0.8, WATER_POND.radiusZ + 0.45, 1];
  const reeds = [
    [-2.6, -0.8],
    [-2.2, 0.9],
    [2.4, -0.7],
    [2.1, 0.8],
    [0.5, 1.15],
  ] as const;
  const stones = [
    [-3.1, -0.35, 0.24],
    [-2.4, 1.1, 0.18],
    [1.8, -1.05, 0.2],
    [3.05, 0.35, 0.16],
    [0.4, 1.28, 0.12],
  ] as const;
  const waves = [
    [0, 0, 0.45, 0.2],
    [-0.9, -0.18, 0.28, 0.14],
    [1.0, 0.28, 0.34, 0.16],
  ] as const;

  return (
    <group position={[WATER_POND.center.x, WATER_POND.surfaceY, WATER_POND.center.z]} rotation={[0, WATER_POND.rotationY, 0]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} scale={bankScale}>
        <circleGeometry args={[1, 64]} />
        <meshStandardMaterial color="#2f5f35" roughness={0.92} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[WATER_POND.radiusX, WATER_POND.radiusZ, 1]}>
        <circleGeometry args={[1, 64]} />
        <meshPhysicalMaterial
          color="#1b8db6"
          roughness={0.03}
          metalness={0}
          transparent
          opacity={0.78}
          clearcoat={1}
          clearcoatRoughness={0.05}
          reflectivity={0.8}
        />
      </mesh>
      {waves.map(([x, z, sx, sz], index) => (
        <mesh
          key={`wave-${x}-${z}`}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[sx * WATER_POND.radiusX, sz * WATER_POND.radiusZ, 1]}
          position={[x, 0.008 + index * 0.001, z]}
        >
          <ringGeometry args={[0.78, 0.82, 64]} />
          <meshBasicMaterial color="#c7f9ff" transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[2.6, 0.72, 1]} position={[0.25, 0.01, -0.16]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#ecfeff" transparent opacity={0.11} depthWrite={false} />
      </mesh>
      {stones.map(([x, z, scale]) => (
        <mesh key={`stone-${x}-${z}`} castShadow receiveShadow position={[x, 0.035, z]} scale={[scale * 1.4, scale * 0.45, scale]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#64748b" roughness={0.95} />
        </mesh>
      ))}
      {reeds.map(([x, z], index) => (
        <group key={`reed-${x}-${z}`} position={[x, 0.13, z]} rotation={[0, index * 0.8, 0]}>
          <mesh castShadow position={[0, 0.16, 0]} rotation={[0.2, 0, -0.15]}>
            <cylinderGeometry args={[0.012, 0.018, 0.42, 5]} />
            <meshStandardMaterial color="#365314" roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0.08, 0.13, 0.04]} rotation={[-0.18, 0, 0.2]}>
            <cylinderGeometry args={[0.01, 0.015, 0.34, 5]} />
            <meshStandardMaterial color="#4d7c0f" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function BoundaryWall() {
  const width = PLAY_AREA.maxX - PLAY_AREA.minX;
  const length = PLAY_AREA.maxZ - PLAY_AREA.minZ;
  const centerX = (PLAY_AREA.minX + PLAY_AREA.maxX) / 2;
  const centerZ = (PLAY_AREA.minZ + PLAY_AREA.maxZ) / 2;
  const height = 1.15;
  const thickness = 0.34;
  const y = height / 2;

  return (
    <group>
      <mesh castShadow receiveShadow position={[centerX, y, PLAY_AREA.minZ - thickness / 2]}>
        <boxGeometry args={[width + thickness * 2, height, thickness]} />
        <meshStandardMaterial color="#8b8f7a" roughness={0.78} metalness={0.02} />
      </mesh>
      <mesh castShadow receiveShadow position={[centerX, y, PLAY_AREA.maxZ + thickness / 2]}>
        <boxGeometry args={[width + thickness * 2, height, thickness]} />
        <meshStandardMaterial color="#8b8f7a" roughness={0.78} metalness={0.02} />
      </mesh>
      <mesh castShadow receiveShadow position={[PLAY_AREA.minX - thickness / 2, y, centerZ]}>
        <boxGeometry args={[thickness, height, length]} />
        <meshStandardMaterial color="#7f846f" roughness={0.8} metalness={0.02} />
      </mesh>
      <mesh castShadow receiveShadow position={[PLAY_AREA.maxX + thickness / 2, y, centerZ]}>
        <boxGeometry args={[thickness, height, length]} />
        <meshStandardMaterial color="#7f846f" roughness={0.8} metalness={0.02} />
      </mesh>
      <mesh receiveShadow position={[centerX, height + 0.035, PLAY_AREA.minZ - thickness / 2]}>
        <boxGeometry args={[width + thickness * 2, 0.07, thickness + 0.04]} />
        <meshStandardMaterial color="#b7b9a3" roughness={0.7} />
      </mesh>
      <mesh receiveShadow position={[centerX, height + 0.035, PLAY_AREA.maxZ + thickness / 2]}>
        <boxGeometry args={[width + thickness * 2, 0.07, thickness + 0.04]} />
        <meshStandardMaterial color="#b7b9a3" roughness={0.7} />
      </mesh>
      <mesh receiveShadow position={[PLAY_AREA.minX - thickness / 2, height + 0.035, centerZ]}>
        <boxGeometry args={[thickness + 0.04, 0.07, length]} />
        <meshStandardMaterial color="#b7b9a3" roughness={0.7} />
      </mesh>
      <mesh receiveShadow position={[PLAY_AREA.maxX + thickness / 2, height + 0.035, centerZ]}>
        <boxGeometry args={[thickness + 0.04, 0.07, length]} />
        <meshStandardMaterial color="#b7b9a3" roughness={0.7} />
      </mesh>
    </group>
  );
}

export function CourseObjects() {
  return (
    <>
      <WaterPond />
      <CourseDecor />
      <BoundaryWall />
      <TargetHole position={[CUP_CENTER.x, CUP_CENTER.y, CUP_CENTER.z]} />
    </>
  );
}
