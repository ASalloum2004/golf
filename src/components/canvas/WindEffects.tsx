import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { usePhysicsStore } from '../../store/usePhysicsStore';
import { DEG2RAD } from '../../physics/constants';

// --- 1. Flapping Flag (Custom ShaderMaterial) ---
const flagVertexShader = `
  uniform float time;
  uniform float windSpeed;
  
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    vec3 pos = position;
    
    // UV x goes from 0 (at the pole) to 1 (at the tip of the flag).
    // The flap amount scales up the further we are from the pole.
    // We scale by windSpeed so stronger wind = more aggressive flap.
    float flapAmount = vUv.x * windSpeed * 0.015;
    
    // A sine wave driven by position along the flag (vUv.x) and time.
    // The frequency of the wave and its speed are driven by the wind.
    float wave = sin(vUv.x * 8.0 - time * windSpeed * 0.4) * flapAmount;
    
    // Displace the vertex along the local Z axis (perpendicular to the flag surface)
    pos.z += wave;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const flagFragmentShader = `
  varying vec2 vUv;
  void main() {
    // Beautiful vibrant red for the flag
    gl_FragColor = vec4(0.937, 0.267, 0.267, 1.0); // #ef4444
  }
`;

export function FlappingFlag() {
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const groupRef = useRef<THREE.Group>(null);
    
    // Subscribe to the Zustand store. This pulls our global state directly into the component.
    const { windSpeed, windDirection } = usePhysicsStore();

    // Memoize the uniforms so we don't recreate them every render frame.
    const uniforms = useMemo(() => ({
        time: { value: 0 },
        windSpeed: { value: 0 }
    }), []);

    // useFrame acts as our Render Loop (the game tick). 
    useFrame((_state, delta) => { 
        if (materialRef.current) {
            materialRef.current.uniforms.time.value += delta;
            materialRef.current.uniforms.windSpeed.value = windSpeed;
        }
        
        if (groupRef.current) {
            // Rotate the group so the flag blows exactly away from the wind.
            groupRef.current.rotation.y = (windDirection * DEG2RAD) - Math.PI / 2;
        }
    });

    return (
        <group ref={groupRef} position={[0, 1.86, 0]}>
            <mesh position={[0.275, 0, 0]} castShadow>
                <planeGeometry args={[0.55, 0.32, 16, 16]} />
                <shaderMaterial 
                    ref={materialRef}
                    vertexShader={flagVertexShader}
                    fragmentShader={flagFragmentShader}
                    uniforms={uniforms}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

// --- 2. Moving Clouds (Texture Panning) ---
// const cloudTextureUrl = new URL('I:/3-th YEAR \'25-26\'/حسابات/golf/texture/cloud/cloud.png', import.meta.url).href;

export function MovingClouds() {
  const textureRef = useRef<THREE.Texture | null>(null);

  // 1. استدعاء الصورة مباشرة من مجلد public (أكثر أماناً)
  const loadedTexture = useTexture('/texture/cloud/cloud.png');
  
  // Clone the texture so we can mutate its wrap properties and offset independently
  const texture = useMemo(() => {
    const t = loadedTexture.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    
    // تقليل التكرار لتبدو الغيوم طبيعية (توزيع مألوف) وغير مكررة بشكل مزعج
    t.repeat.set(2.5, 2.5); 
    
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [loadedTexture]);

  useEffect(() => {
    textureRef.current = texture;
    return () => {
      if (textureRef.current === texture) {
        textureRef.current = null;
      }
    };
  }, [texture]);

  const { windSpeed, windDirection } = usePhysicsStore();

  useFrame((_state, delta) => { 
    const cloudTexture = textureRef.current;
    if (!cloudTexture) return;

    const a = windDirection * DEG2RAD;
    // زيادة سرعة تحريك الغيوم مع سرعة الرياح لتكون ملحوظة
    const moveSpeed = 0.002 + (windSpeed * 0.002);
    cloudTexture.offset.x += Math.sin(a) * moveSpeed * delta;
    cloudTexture.offset.y += Math.cos(a) * moveSpeed * delta;
  });

  return (
    <mesh position={[0, 80, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
      {/* مسطح ضخم يغطي الملعب */}
      <planeGeometry args={[800, 800]} />
      <meshStandardMaterial 
        map={texture}
        transparent={true}
        // alphaTest: إذا كانت شفافية البيكسل أقل من 0.05، اعتبره غير موجود ولا ترمِ له ظلاً
        alphaTest={0.05} 
        depthWrite={false}
        // السر الثاني: جعل المسطح مرئياً من الأسفل (جهة اللاعب) ومن الأعلى (جهة الشمس)
        side={THREE.DoubleSide} 
      />
    </mesh>
  );
}

// --- 3. Wind Streaks (Particle System) ---
const STREAK_COUNT = 80;

export function WindStreaks() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { windSpeed, windDirection } = usePhysicsStore();
  
  // We use a ref to hold mutable streak data to satisfy the immutability linter.
  // We initialize it inside a useEffect to satisfy the purity linter (Math.random is impure).
  const streaksDataRef = useRef<{position: THREE.Vector3, speed: number}[]>(null);
  
  useEffect(() => {
    streaksDataRef.current = Array.from({ length: STREAK_COUNT }).map(() => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 150,
        Math.random() * 8 + 0.5, // Distribute closer to the ground (0.5m to 8.5m high)
        (Math.random() - 0.5) * 150
      ),
      speed: Math.random() * 0.8 + 0.4,
    }));
  }, []);

  // Dummy object used to calculate transformation matrices efficiently
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_state, delta) => { 
    // Only render streaks if wind is actually blowing and data is ready
    if (!meshRef.current || !streaksDataRef.current || windSpeed < 2) {
      if (meshRef.current) meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;

    const a = windDirection * DEG2RAD;
    const windDirVec = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
    
    // Scale length of streaks based on how fast the wind is blowing
    const streakLength = Math.max(1, windSpeed * 0.15);

    for (let i = 0; i < STREAK_COUNT; i++) {
      const data = streaksDataRef.current[i];
      
      // Integrate Position: New Pos = Old Pos + (Velocity * dt)
      data.position.addScaledVector(windDirVec, windSpeed * data.speed * delta);
      
      // Boundary checks to wrap streaks endlessly around the level
      if (data.position.x > 100) data.position.x -= 200;
      if (data.position.x < -100) data.position.x += 200;
      if (data.position.z > 100) data.position.z -= 250;
      if (data.position.z < -150) data.position.z += 250;

      dummy.position.copy(data.position);
      // Orient the streak to perfectly face the wind direction
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), windDirVec);
      // Scale it to be a long, thin streak
      dummy.scale.set(0.03, 0.03, streakLength);
      
      dummy.updateMatrix();
      
      // Set the matrix back into the instanced array
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    // Flag to the GPU that matrices have changed and need re-rendering
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    // الإجبار الآمن لأنواع البيانات بدلاً من استخدام any
    <instancedMesh 
      ref={meshRef} 
      args={[
        undefined as unknown as THREE.BufferGeometry, 
        undefined as unknown as THREE.Material, 
        STREAK_COUNT
      ]}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial 
        color="#e0e5ec" 
        transparent={true} 
        opacity={0.8} 
        blending={THREE.AdditiveBlending} 
        depthWrite={false} 
      />
    </instancedMesh>
  );
}
