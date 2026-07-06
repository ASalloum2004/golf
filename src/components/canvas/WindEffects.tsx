import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { usePhysicsStore } from '../../store/usePhysicsStore';
import { DEG2RAD } from '../../physics/constants';


const flagVertexShader = `
 
  
  
`;

const flagFragmentShader = `
  
  }
`;

export function FlappingFlag() {
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const groupRef = useRef<THREE.Group>(null);
    

    const { windSpeed, windDirection } = usePhysicsStore();


    const uniforms = useMemo(() => ({
        time: { value: 0 },
        windSpeed: { value: 0 }
    }), []);


    useFrame((_state, delta) => { 
        if (materialRef.current) {
            materialRef.current.uniforms.time.value += delta;
            materialRef.current.uniforms.windSpeed.value = windSpeed;
        }
        
        if (groupRef.current) {

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




export function MovingClouds() {
  const textureRef = useRef<THREE.Texture | null>(null);


  const loadedTexture = useTexture('/texture/cloud/cloud.png');
  

  const texture = useMemo(() => {
    const t = loadedTexture.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    

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

    const moveSpeed = 0.002 + (windSpeed * 0.002);
    cloudTexture.offset.x += Math.sin(a) * moveSpeed * delta;
    cloudTexture.offset.y += Math.cos(a) * moveSpeed * delta;
  });

  return (
    <mesh position={[0, 80, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>

      <planeGeometry args={[800, 800]} />
      <meshStandardMaterial 
        map={texture}
        transparent={true}

        alphaTest={0.05} 
        depthWrite={false}

        side={THREE.DoubleSide} 
      />
    </mesh>
  );
}


const STREAK_COUNT = 80;

export function WindStreaks() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { windSpeed, windDirection } = usePhysicsStore();
  


  const streaksDataRef = useRef<{position: THREE.Vector3, speed: number}[]>(null);
  
  useEffect(() => {
    streaksDataRef.current = Array.from({ length: STREAK_COUNT }).map(() => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 150,
        Math.random() * 8 + 0.5,
        (Math.random() - 0.5) * 150
      ),
      speed: Math.random() * 0.8 + 0.4,
    }));
  }, []);


  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_state, delta) => { 

    if (!meshRef.current || !streaksDataRef.current || windSpeed < 2) {
      if (meshRef.current) meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;

    const a = windDirection * DEG2RAD;
    const windDirVec = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
    

    const streakLength = Math.max(1, windSpeed * 0.15);

    for (let i = 0; i < STREAK_COUNT; i++) {
      const data = streaksDataRef.current[i];
      

      data.position.addScaledVector(windDirVec, windSpeed * data.speed * delta);
      

      if (data.position.x > 100) data.position.x -= 200;
      if (data.position.x < -100) data.position.x += 200;
      if (data.position.z > 100) data.position.z -= 250;
      if (data.position.z < -150) data.position.z += 250;

      dummy.position.copy(data.position);

      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), windDirVec);

      dummy.scale.set(0.03, 0.03, streakLength);
      
      dummy.updateMatrix();
      

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (

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
