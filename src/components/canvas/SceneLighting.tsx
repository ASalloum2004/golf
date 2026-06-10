import { Sky, Environment } from '@react-three/drei';
import { CUP_CENTER, WATER_POND } from '../../physics/constants';

interface SceneLightingProps {
  isNight: boolean;
  isGreenView: boolean;
}

export function SceneLighting({ isNight, isGreenView }: SceneLightingProps) {
  const fogArgs: [string, number, number] = isNight
    ? isGreenView ? ['#07111f', 460, 920] : ['#07111f', 70, 180]
    : isGreenView ? ['#d8f1ff', 420, 900] : ['#d8f1ff', 35, 95];

  return (
    <>
      <color attach="background" args={[isNight ? '#07111f' : '#d8f1ff']} />
      <fog
        key={`${isNight ? 'night' : 'day'}-${isGreenView ? 'green-view' : 'course'}-fog`}
        attach="fog"
        args={fogArgs}
      />

      {!isNight && <Sky sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.8} />}

      <ambientLight intensity={isNight ? 0.32 : 0.4} color={isNight ? '#9fb7ff' : '#ffffff'} />
      {isNight && <hemisphereLight color="#9fb7ff" groundColor="#16361f" intensity={0.45} />}

      <directionalLight
        castShadow
        position={isNight ? [-18, 26, 16] : [10, 15, 10]}
        intensity={isNight ? 0.9 : 2}
        color={isNight ? '#b9c8ff' : '#ffffff'}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-30, 30, 30, -30, 0.1, 100]} />
      </directionalLight>

      {isNight && (
        <>
          <pointLight position={[0, 2.2, 0]} intensity={1.2} distance={12} color="#dbeafe" />
          <pointLight position={[CUP_CENTER.x, 2.4, CUP_CENTER.z]} intensity={1.5} distance={16} color="#bbf7d0" />
          <pointLight position={[WATER_POND.center.x, 2, WATER_POND.center.z]} intensity={0.8} distance={18} color="#7dd3fc" />
        </>
      )}

      <Environment preset={isNight ? 'night' : 'park'} />
    </>
  );
}
