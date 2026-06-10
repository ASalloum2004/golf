import { useMemo } from 'react';
import * as THREE from 'three';
import { Grid } from '@react-three/drei';
import { PLAY_AREA } from '../../physics/constants';
import type { SurfaceType } from '../../store/usePhysicsStore';

function seededNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const surfaceConfig: Record<SurfaceType, { color: string; roughness: number; grid: string }> = {
  Green: { color: '#4ade80', roughness: 0.3, grid: '#166534' },
  Fairway: { color: '#16a34a', roughness: 0.6, grid: '#14532d' },
  Rough: { color: '#14532d', roughness: 0.9, grid: '#064e3b' },
  Sand: { color: '#f5dfb7', roughness: 0.96, grid: '#bba87f' },
};

function GrassStripes() {
  const courseWidth = PLAY_AREA.maxX - PLAY_AREA.minX;
  const courseLength = PLAY_AREA.maxZ - PLAY_AREA.minZ;
  const centerX = (PLAY_AREA.minX + PLAY_AREA.maxX) / 2;
  const stripeCount = Math.ceil(courseLength / 4);
  const stripeDepth = courseLength / stripeCount;
  const stripes = Array.from(
    { length: stripeCount },
    (_, index) => PLAY_AREA.maxZ - stripeDepth / 2 - index * stripeDepth,
  );

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

interface GolfCourseProps {
  surface: SurfaceType;
  isNight: boolean;
  isGreenView: boolean;
}

export function GolfCourse({ surface, isNight, isGreenView }: GolfCourseProps) {
  const terrain = surfaceConfig[surface];
  const isSand = surface === 'Sand';

  const courseWidth = PLAY_AREA.maxX - PLAY_AREA.minX;
  const courseLength = PLAY_AREA.maxZ - PLAY_AREA.minZ;
  const courseCenterX = (PLAY_AREA.minX + PLAY_AREA.maxX) / 2;
  const courseCenterZ = (PLAY_AREA.minZ + PLAY_AREA.maxZ) / 2;
  const gridFadeDistance = isGreenView ? 260 : 50;
  const gridColor = isNight ? '#86efac' : terrain.grid;

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

  const terrainTexture = isSand ? sandTextures.color : grassTexture;

  return (
    <>
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
        fadeDistance={gridFadeDistance}
        sectionColor={gridColor}
        cellColor={gridColor}
        position={[0, 0.001, 0]}
        cellSize={1}
        sectionSize={5}
        fadeStrength={1.5}
      />
    </>
  );
}
