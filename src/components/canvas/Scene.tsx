import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, ContactShadows, Sky } from '@react-three/drei';
import { usePhysicsStore } from '../../store/usePhysicsStore';
import { usePhysicsLoop } from '../../physics/usePhysicsLoop';

/** Runs the custom physics engine inside the R3F Canvas context. */
function PhysicsController() {
  usePhysicsLoop();
  return null;
}

function LerpGroup({ position, children }: { position: [number, number, number], children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  const vec = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    vec.set(...position);
    ref.current.position.lerp(vec, 10 * delta);
  });
  return <group ref={ref}>{children}</group>;
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
      state.camera.position.lerp(vec.set(0, 15, -25), smoothTime);
      target.lerp(vec.set(0, 0, -30), smoothTime);
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

  const surfaceConfig = {
    Green: { color: '#4ade80', roughness: 0.3, grid: '#166534' },
    Fairway: { color: '#16a34a', roughness: 0.6, grid: '#14532d' },
    Rough: { color: '#14532d', roughness: 0.9, grid: '#064e3b' },
    Sand: { color: '#d4d487', roughness: 1.0, grid: '#a1a1aa' },
  };
  const terrain = surfaceConfig[surface];

  const aimRotation = horizontalAngle * (Math.PI / 180);
  const loftRotation = loftAngle * (Math.PI / 180);

  return (
    <Canvas shadows camera={{ position: [0, 1.5, 4], fov: 45 }}>
      {/* Physics controller must be first so its useFrame runs before CameraRig */}
      <PhysicsController />
      <CameraRig />

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

      <TargetHole position={[0, 0, -30]} />

      {obstacles.map(obs => (
        <LerpGroup key={obs.id} position={obs.position}>
          {obs.type === 'Tree' ? <Tree /> : <Wall />}
        </LerpGroup>
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

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={terrain.color} roughness={terrain.roughness} metalness={0.05} />
      </mesh>

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
