import { useEffect, useState } from 'react';
import * as THREE from 'three';
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
import { MovingClouds, WindStreaks } from './WindEffects';

function PhysicsController() {
  usePhysicsLoop();
  return null;
}




function createAimArrowGeometry(
  length: number,
  shaftWidth: number,
  headWidth: number,
  headLength: number,
): THREE.ShapeGeometry {
  const halfLen = length / 2;
  const sw = shaftWidth / 2;
  const hw = headWidth / 2;
  const yTail = -halfLen;
  const yHeadBase = halfLen - headLength;
  const yTip = halfLen;

  const shape = new THREE.Shape();
  shape.moveTo(sw, yTail);
  shape.lineTo(sw, yHeadBase);
  shape.lineTo(hw, yHeadBase);
  shape.lineTo(0, yTip);
  shape.lineTo(-hw, yHeadBase);
  shape.lineTo(-sw, yHeadBase);
  shape.lineTo(-sw, yTail);
  shape.absarc(0, yTail, sw, Math.PI, 2 * Math.PI, false);
  shape.closePath();

  return new THREE.ShapeGeometry(shape, 24);
}

const greenAimArrowGeometry = createAimArrowGeometry(12, 0.5, 1.5, 3.2);

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

      <PhysicsController />
      <CameraRig />

      <SceneLighting isNight={isNight} isGreenView={isGreenView} />
      {!isGreenView && <MovingClouds />}
      <WindStreaks />
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

            <group position={[0, 0.08, -6]}>

              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                scale={[1.55, 1.06, 1]}
                geometry={greenAimArrowGeometry}
                renderOrder={20}
              >
                <meshBasicMaterial color="#0b1220" depthTest={false} depthWrite={false} />
              </mesh>
              <mesh
                position={[0, 0.001, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                geometry={greenAimArrowGeometry}
                renderOrder={21}
              >
                <meshBasicMaterial color="#facc15" depthTest={false} depthWrite={false} />
              </mesh>
            </group>
          ) : (
            <group position={[0, 0.005, -2.5]}>

              <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={20}>
                <planeGeometry args={[0.11, 5.08]} />
                <meshBasicMaterial color="#fde68a" transparent opacity={0.12} depthTest={false} depthWrite={false} />
              </mesh>

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
