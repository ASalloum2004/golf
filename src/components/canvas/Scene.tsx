import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { usePhysicsStore } from '../../store/usePhysicsStore';
import { getShotReferenceAngle } from '../../physics/initialState';
import { usePhysicsLoop } from '../../physics/usePhysicsLoop';
import { CameraRig } from './CameraRig';
import { SceneLighting } from './SceneLighting';
import { GolfCourse } from './GolfCourse';
import { CourseObjects, Tree, Wall } from './CourseObjects';
import { GolfBall } from './GolfBall';
import { GolfClub } from './GolfClub';

function PhysicsController() {
  usePhysicsLoop();
  return null;
}

export default function Scene() {
  const [isNight, setIsNight] = useState(false);
  const {
    cameraMode, surface, horizontalAngle, loftAngle, radius,
    obstacles, ballPosition, shotStartPosition, isBallMoving,
    canShoot, gameWon, gameLost, metrics,
  } = usePhysicsStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.code !== 'KeyN' || event.altKey || event.ctrlKey || event.metaKey) return;
      setIsNight((night) => !night);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isGreenView = cameraMode === 'TopDown';
  const loftRotation = loftAngle * (Math.PI / 180);
  const aimPosition = isBallMoving ? shotStartPosition : ballPosition;
  const aimRotation = getShotReferenceAngle(aimPosition) + horizontalAngle * (Math.PI / 180);
  const shouldShowShotSetup =
    !gameWon &&
    !gameLost &&
    metrics.status !== 'You Win' &&
    metrics.status !== 'You Lose' &&
    (canShoot || isBallMoving);

  return (
    <Canvas shadows camera={{ position: [0, 1.5, 4], fov: 45, near: 0.1, far: 2000 }}>
      {/* Physics tick must run before CameraRig so position is up to date each frame */}
      <PhysicsController />
      <CameraRig />

      <SceneLighting isNight={isNight} isGreenView={isGreenView} />
      <CourseObjects />
      <GolfCourse surface={surface} isNight={isNight} isGreenView={isGreenView} />

      {obstacles.map((obs) => (
        <group key={obs.id} position={obs.position}>
          {obs.type === 'Tree' ? <Tree /> : <Wall />}
        </group>
      ))}

      {shouldShowShotSetup && (
        <group position={[aimPosition[0], 0, aimPosition[2]]} rotation={[0, -aimRotation, 0]}>
          {isGreenView ? (
            // Large yellow direction arrow visible from overhead
            <group position={[0, 0.08, -6]}>
              {/* dark outline keeps the arrow readable on light surfaces */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={20}>
                <planeGeometry args={[1.04, 12.24]} />
                <meshBasicMaterial color="#0b1220" depthTest={false} depthWrite={false} />
              </mesh>
              <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={21}>
                <planeGeometry args={[0.8, 12]} />
                <meshBasicMaterial color="#facc15" depthTest={false} depthWrite={false} />
              </mesh>
              <mesh position={[0, 0.002, -6]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={22}>
                <ringGeometry args={[1.12, 1.8, 32]} />
                <meshBasicMaterial color="#facc15" depthTest={false} depthWrite={false} />
              </mesh>
            </group>
          ) : (
            <group position={[0, 0.005, -2.5]}>
              {/* soft halo gives the line a gentle, faded edge */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={20}>
                <planeGeometry args={[0.11, 5.08]} />
                <meshBasicMaterial color="#fde68a" transparent opacity={0.12} depthTest={false} depthWrite={false} />
              </mesh>
              {/* thin, calm core line */}
              <mesh position={[0, 0.0005, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={21}>
                <planeGeometry args={[0.035, 5]} />
                <meshBasicMaterial color="#fcd34d" transparent opacity={0.55} depthTest={false} depthWrite={false} />
              </mesh>
              <mesh position={[0, 0.001, -2.5]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={22}>
                <ringGeometry args={[0.2, 0.27, 48]} />
                <meshBasicMaterial color="#fcd34d" transparent opacity={0.55} depthTest={false} depthWrite={false} />
              </mesh>
            </group>
          )}
          {!isGreenView && <GolfClub radius={radius} loftRotation={loftRotation} />}
        </group>
      )}

      <GolfBall position={ballPosition} radius={radius} isGreenView={isGreenView} />
      <ContactShadows
        position={[ballPosition[0], 0.002, ballPosition[2]]}
        opacity={0.6}
        scale={0.3}
        blur={1.5}
        far={0.1}
      />
    </Canvas>
  );
}
