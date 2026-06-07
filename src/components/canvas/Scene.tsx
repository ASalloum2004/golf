import { useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, ContactShadows, Sky } from '@react-three/drei';
import { usePhysicsStore } from '../../store/usePhysicsStore';
import { CUP_CENTER, PLAY_AREA, WATER_POND } from '../../physics/constants';
import { usePhysicsLoop } from '../../physics/usePhysicsLoop';

/** Runs the custom physics engine inside the R3F Canvas context. */
function PhysicsController() {
  usePhysicsLoop();
  return null;
}

function Tree() {
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

function Wall() {
  return (
    <mesh castShadow position={[0, 0.6, 0]}>
      <boxGeometry args={[2.5, 1.2, 0.4]} />
      <meshStandardMaterial color="#71717a" roughness={0.9} />
    </mesh>
  );
}

function TargetHole({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[6, 64]} />
        <meshStandardMaterial color="#4ade80" roughness={0.3} metalness={0.05} />
      </mesh>
      <mesh receiveShadow position={[0, 0.004, 0]}>
        <cylinderGeometry args={[0.054, 0.054, 0.1, 32]} />
        <meshStandardMaterial color="#020617" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[0.065, 0.12, 48]} />
        <meshBasicMaterial color="#f8fafc" side={THREE.DoubleSide} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 1, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 2]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.2} />
      </mesh>
      <mesh castShadow position={[0.25, 1.8, 0]}>
        <planeGeometry args={[0.5, 0.3]} />
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
        <mesh key={`${x}-${z}`} rotation={[-Math.PI / 2, 0, 0]} scale={[sx * WATER_POND.radiusX, sz * WATER_POND.radiusZ, 1]} position={[x, 0.008 + index * 0.001, z]}>
          <ringGeometry args={[0.78, 0.82, 64]} />
          <meshBasicMaterial color="#c7f9ff" transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[2.6, 0.72, 1]} position={[0.25, 0.01, -0.16]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#ecfeff" transparent opacity={0.11} depthWrite={false} />
      </mesh>
      {stones.map(([x, z, scale]) => (
        <mesh key={`${x}-${z}`} castShadow receiveShadow position={[x, 0.035, z]} scale={[scale * 1.4, scale * 0.45, scale]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#64748b" roughness={0.95} />
        </mesh>
      ))}
      {reeds.map(([x, z], index) => (
        <group key={`${x}-${z}`} position={[x, 0.13, z]} rotation={[0, index * 0.8, 0]}>
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

function GrassStripes() {
  const courseWidth = PLAY_AREA.maxX - PLAY_AREA.minX;
  const courseLength = PLAY_AREA.maxZ - PLAY_AREA.minZ;
  const centerX = (PLAY_AREA.minX + PLAY_AREA.maxX) / 2;
  const stripeCount = Math.ceil(courseLength / 4);
  const stripeDepth = courseLength / stripeCount;
  const stripes = Array.from({ length: stripeCount }, (_, index) => PLAY_AREA.maxZ - stripeDepth / 2 - index * stripeDepth);

  return (
    <group>
      {stripes.map((z, index) => (
        <mesh key={z} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.006 + index * 0.0001, z]}>
          <planeGeometry args={[courseWidth, stripeDepth * 0.52]} />
          <meshBasicMaterial
            color={index % 2 === 0 ? '#d9f99d' : '#14532d'}
            transparent
            opacity={index % 2 === 0 ? 0.07 : 0.05}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function seededNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function CameraRig() {
  const mode = usePhysicsStore(state => state.cameraMode);
  const ballPosition = usePhysicsStore(state => state.ballPosition);
  
  const vec = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (mode === 'Free') return;

    const smoothTime = 4 * delta;

    if (mode === 'TeeBox') {
      state.camera.position.lerp(vec.set(0, 1.5, 4), smoothTime);
      target.lerp(vec.set(0, ballPosition[1], 0), smoothTime);
      state.camera.lookAt(target);
    } else if (mode === 'Follow') {
      state.camera.position.lerp(vec.set(ballPosition[0], ballPosition[1] + 1.5, ballPosition[2] + 4), smoothTime);
      target.lerp(vec.set(ballPosition[0], ballPosition[1], ballPosition[2]), smoothTime);
      state.camera.lookAt(target);
    } else if (mode === 'TopDown') {
      state.camera.position.lerp(vec.set(0, 150, (PLAY_AREA.minZ + PLAY_AREA.maxZ) / 2), smoothTime);
      target.lerp(vec.set(0, 0, (PLAY_AREA.minZ + PLAY_AREA.maxZ) / 2), smoothTime);
      state.camera.lookAt(target);
    }
  });

  return mode === 'Free' ? <OrbitControls makeDefault dampingFactor={0.05} /> : null;
}

export default function Scene() {
  const { 
    surface, horizontalAngle, loftAngle, radius, 
    obstacles, ballPosition 
  } = usePhysicsStore();

  const grassTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1f8a3a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 4500; i++) {
      const shade = 72 + Math.floor(seededNoise(i + 1) * 88);
      const green = 120 + Math.floor(seededNoise(i + 2) * 80);
      const blue = 45 + Math.floor(seededNoise(i + 3) * 50);
      const alpha = 0.08 + seededNoise(i + 4) * 0.12;
      const x = seededNoise(i + 5) * canvas.width;
      const y = seededNoise(i + 6) * canvas.height;
      const height = 2 + seededNoise(i + 7) * 3;
      ctx.fillStyle = `rgba(${shade}, ${green}, ${blue}, ${alpha})`;
      ctx.fillRect(x, y, 1, height);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(36, 36);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  const surfaceConfig = {
    Green: { color: '#4ade80', roughness: 0.3, grid: '#166534' },
    Fairway: { color: '#16a34a', roughness: 0.6, grid: '#14532d' },
    Rough: { color: '#14532d', roughness: 0.9, grid: '#064e3b' },
    Sand: { color: '#d4d487', roughness: 1.0, grid: '#a1a1aa' },
  };
  const terrain = surfaceConfig[surface];
  const courseWidth = PLAY_AREA.maxX - PLAY_AREA.minX;
  const courseLength = PLAY_AREA.maxZ - PLAY_AREA.minZ;
  const courseCenterX = (PLAY_AREA.minX + PLAY_AREA.maxX) / 2;
  const courseCenterZ = (PLAY_AREA.minZ + PLAY_AREA.maxZ) / 2;

  const aimRotation = horizontalAngle * (Math.PI / 180);
  const loftRotation = loftAngle * (Math.PI / 180);

  return (
    <Canvas shadows camera={{ position: [0, 1.5, 4], fov: 45 }}>
      {/* Physics controller must be first so its useFrame runs before CameraRig */}
      <PhysicsController />
      <CameraRig />

      <fog attach="fog" args={['#d8f1ff', 35, 95]} />
      <Sky sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.8} />
      <ambientLight intensity={0.4} />
      <directionalLight 
        castShadow 
        position={[10, 15, 10]} 
        intensity={2} 
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-30, 30, 30, -30, 0.1, 100]} />
      </directionalLight>
      <Environment preset="park" />

      <WaterPond />
      <BoundaryWall />
      <TargetHole position={[CUP_CENTER.x, CUP_CENTER.y, CUP_CENTER.z]} />

      {obstacles.map(obs => (
        <group key={obs.id} position={obs.position}>
          {obs.type === 'Tree' ? <Tree /> : <Wall />}
        </group>
      ))}

      <group rotation={[0, -aimRotation, 0]}>
        <group position={[0, 0.005, -2.5]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.02, 5]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.3} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0, -2.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 0.25, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} depthWrite={false} />
          </mesh>
        </group>

        <group position={[0, radius, 0.04]}>
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
      </group>

      <mesh castShadow receiveShadow position={ballPosition}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhysicalMaterial 
          color="#ffffff"
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[courseCenterX, 0, courseCenterZ]}>
        <planeGeometry args={[courseWidth, courseLength]} />
        <meshStandardMaterial color={terrain.color} map={grassTexture} roughness={terrain.roughness} metalness={0.03} />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[courseCenterX, 0.003, courseCenterZ]}>
        <planeGeometry args={[courseWidth * 0.55, courseLength * 0.86]} />
        <meshStandardMaterial color="#2f9e44" roughness={0.55} transparent opacity={0.26} depthWrite={false} />
      </mesh>
      <GrassStripes />

      <Grid 
        infiniteGrid 
        fadeDistance={50} 
        sectionColor={terrain.grid} 
        cellColor={terrain.grid} 
        position={[0, 0.001, 0]} 
        cellSize={1}
        sectionSize={5}
        fadeStrength={1.5}
      />

      <ContactShadows position={[ballPosition[0], 0.002, ballPosition[2]]} opacity={0.6} scale={0.3} blur={1.5} far={0.1} />
    </Canvas>
  );
}
