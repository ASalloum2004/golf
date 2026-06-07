import { useMemo, useRef } from 'react';
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

function GolfBall({ position, radius }: { position: [number, number, number]; radius: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const dropProgress = useRef(-1);
  const wasWin = useRef(false);
  const status = usePhysicsStore((state) => state.metrics.status);

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
      ref.current.position.set(position[0], position[1], position[2]);
      return;
    }

    dropProgress.current = Math.min(1, Math.max(0, dropProgress.current) + delta / 0.58);

    const t = dropProgress.current;
    const eased = 1 - Math.pow(1 - t, 3);
    const lateSink = Math.max(0, (eased - 0.32) / 0.68);
    const dropDepth = Math.max(radius * 6.5, 0.14);

    ref.current.position.set(
      THREE.MathUtils.lerp(position[0], CUP_CENTER.x, eased),
      THREE.MathUtils.lerp(position[1], -dropDepth, eased),
      THREE.MathUtils.lerp(position[2], CUP_CENTER.z, eased),
    );
    ref.current.scale.setScalar(THREE.MathUtils.lerp(1, 0.42, lateSink));
    ref.current.visible = eased < 0.86;
  });

  return (
    <mesh ref={ref} castShadow receiveShadow position={position}>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshPhysicalMaterial
        color="#ffffff"
        clearcoat={1.0}
        clearcoatRoughness={0.1}
        roughness={0.2}
        metalness={0.1}
      />
    </mesh>
  );
}

function GolfClub({ radius, loftRotation }: { radius: number; loftRotation: number }) {
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

  const sandTextures = useMemo(() => {
    const size = 512;
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = size;
    colorCanvas.height = size;
    const colorCtx = colorCanvas.getContext('2d')!;
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    const bumpCtx = bumpCanvas.getContext('2d')!;

    colorCtx.fillStyle = '#e8d0a3';
    colorCtx.fillRect(0, 0, size, size);
    bumpCtx.fillStyle = '#808080';
    bumpCtx.fillRect(0, 0, size, size);

    for (let i = 0; i < 12000; i++) {
      const n = seededNoise(i + 41);
      const x = seededNoise(i + 42) * size;
      const y = seededNoise(i + 43) * size;
      const alpha = 0.045 + seededNoise(i + 44) * 0.055;
      const grain = Math.floor(185 + n * 42);
      colorCtx.fillStyle = `rgba(${grain}, ${Math.floor(grain * 0.84)}, ${Math.floor(grain * 0.58)}, ${alpha})`;
      colorCtx.fillRect(x, y, 1, 1);
    }

    for (let row = -12; row < size + 24; row += 11) {
      const phase = seededNoise(row + 101) * Math.PI * 2;
      const wobble = 3.2 + seededNoise(row + 102) * 2.7;

      const traceRipple = (ctx: CanvasRenderingContext2D, offsetY: number) => {
        ctx.beginPath();
        for (let x = -12; x <= size + 12; x += 8) {
          const wave =
            Math.sin(x * 0.041 + phase) * wobble
            + Math.sin(x * 0.017 + row * 0.09) * 2.3
            + Math.sin((x + row) * 0.067) * 0.75;
          const y = row + wave + offsetY;
          if (x === -12) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      };

      traceRipple(colorCtx, 1.3);
      colorCtx.strokeStyle = 'rgba(138, 103, 55, 0.15)';
      colorCtx.lineWidth = 2.2;
      colorCtx.stroke();

      traceRipple(colorCtx, -1.1);
      colorCtx.strokeStyle = 'rgba(255, 246, 220, 0.22)';
      colorCtx.lineWidth = 1.7;
      colorCtx.stroke();

      traceRipple(bumpCtx, 1.2);
      bumpCtx.strokeStyle = 'rgba(55, 55, 55, 0.45)';
      bumpCtx.lineWidth = 2.4;
      bumpCtx.stroke();

      traceRipple(bumpCtx, -1.2);
      bumpCtx.strokeStyle = 'rgba(220, 220, 220, 0.5)';
      bumpCtx.lineWidth = 1.8;
      bumpCtx.stroke();
    }

    const colorTexture = new THREE.CanvasTexture(colorCanvas);
    colorTexture.wrapS = THREE.RepeatWrapping;
    colorTexture.wrapT = THREE.RepeatWrapping;
    colorTexture.repeat.set(18, 30);
    colorTexture.colorSpace = THREE.SRGBColorSpace;
    colorTexture.minFilter = THREE.LinearMipmapLinearFilter;
    colorTexture.magFilter = THREE.LinearFilter;

    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    bumpTexture.wrapS = THREE.RepeatWrapping;
    bumpTexture.wrapT = THREE.RepeatWrapping;
    bumpTexture.repeat.copy(colorTexture.repeat);
    bumpTexture.minFilter = THREE.LinearMipmapLinearFilter;
    bumpTexture.magFilter = THREE.LinearFilter;

    return { color: colorTexture, bump: bumpTexture };
  }, []);

  const surfaceConfig = {
    Green: { color: '#4ade80', roughness: 0.3, grid: '#166534' },
    Fairway: { color: '#16a34a', roughness: 0.6, grid: '#14532d' },
    Rough: { color: '#14532d', roughness: 0.9, grid: '#064e3b' },
    Sand: { color: '#f5dfb7', roughness: 0.96, grid: '#bba87f' },
  };
  const terrain = surfaceConfig[surface];
  const isSand = surface === 'Sand';
  const terrainTexture = isSand ? sandTextures.color : grassTexture;
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
      <CourseDecor />
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

        <GolfClub radius={radius} loftRotation={loftRotation} />
      </group>

      <GolfBall position={ballPosition} radius={radius} />

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[courseCenterX, 0, courseCenterZ]}>
        <planeGeometry args={[courseWidth, courseLength]} />
        <meshStandardMaterial
          color={terrain.color}
          map={terrainTexture}
          bumpMap={isSand ? sandTextures.bump : undefined}
          bumpScale={isSand ? 0.045 : 0}
          roughness={terrain.roughness}
          metalness={0.03}
        />
      </mesh>

      {!isSand && (
        <>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[courseCenterX, 0.003, courseCenterZ]}>
            <planeGeometry args={[courseWidth * 0.55, courseLength * 0.86]} />
            <meshStandardMaterial color="#2f9e44" roughness={0.55} transparent opacity={0.26} depthWrite={false} />
          </mesh>
          <GrassStripes />
        </>
      )}

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
