import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Grid, useTexture } from '@react-three/drei';
import { PLAY_AREA } from '../../physics/constants';
import type { SurfaceType } from '../../store/usePhysicsStore';

const sandTextureUrl = new URL('../../../texture/image.png', import.meta.url).href;
const greenTextureUrl = new URL('../../../texture/green/image.png', import.meta.url).href;
const fairwayTextureUrl = new URL('../../../texture/fairway/istockphoto-1066907944-170667a.jpg', import.meta.url).href;
const roughTextureUrl = new URL('../../../texture/rough/OIP.webp', import.meta.url).href;
const SAND_TILE_LENGTH = 5.5;
const GREEN_TILE_LENGTH = 4.5;
const FAIRWAY_TILE_LENGTH = 6;
const ROUGH_TILE_LENGTH = 3.75;

const surfaceConfig: Record<SurfaceType, { color: string; roughness: number; grid: string }> = {
  Green: { color: '#4ade80', roughness: 0.3, grid: '#166534' },
  Fairway: { color: '#16a34a', roughness: 0.6, grid: '#14532d' },
  Rough: { color: '#14532d', roughness: 0.9, grid: '#064e3b' },
  Sand: { color: '#f5dfb7', roughness: 0.96, grid: '#bba87f' },
};

interface GolfCourseProps {
  surface: SurfaceType;
  isNight: boolean;
  isGreenView: boolean;
}

function createTerrainTexture(
  loadedTexture: THREE.Texture,
  courseWidth: number,
  courseLength: number,
  tileLength: number,
): THREE.Texture {
  const texture = loadedTexture.clone();
  const image = texture.image as { width?: number; height?: number } | undefined;
  const imageAspect = image?.width && image?.height ? image.width / image.height : 1;
  const tileWidth = tileLength * imageAspect;

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(courseWidth / tileWidth, courseLength / tileLength);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  return texture;
}

export function GolfCourse({ surface, isNight, isGreenView }: GolfCourseProps) {
  const terrain = surfaceConfig[surface];
  const loadedSandTexture = useTexture(sandTextureUrl);
  const loadedGreenTexture = useTexture(greenTextureUrl);
  const loadedFairwayTexture = useTexture(fairwayTextureUrl);
  const loadedRoughTexture = useTexture(roughTextureUrl);

  const courseWidth = PLAY_AREA.maxX - PLAY_AREA.minX;
  const courseLength = PLAY_AREA.maxZ - PLAY_AREA.minZ;
  const courseCenterX = (PLAY_AREA.minX + PLAY_AREA.maxX) / 2;
  const courseCenterZ = (PLAY_AREA.minZ + PLAY_AREA.maxZ) / 2;
  const gridFadeDistance = isGreenView ? 260 : 50;
  const gridColor = isNight ? '#86efac' : terrain.grid;

  const greenTexture = useMemo(() => {
    return createTerrainTexture(loadedGreenTexture, courseWidth, courseLength, GREEN_TILE_LENGTH);
  }, [courseLength, courseWidth, loadedGreenTexture]);

  const fairwayTexture = useMemo(() => {
    return createTerrainTexture(loadedFairwayTexture, courseWidth, courseLength, FAIRWAY_TILE_LENGTH);
  }, [courseLength, courseWidth, loadedFairwayTexture]);

  const roughTexture = useMemo(() => {
    return createTerrainTexture(loadedRoughTexture, courseWidth, courseLength, ROUGH_TILE_LENGTH);
  }, [courseLength, courseWidth, loadedRoughTexture]);

  const sandTexture = useMemo(() => {
    return createTerrainTexture(loadedSandTexture, courseWidth, courseLength, SAND_TILE_LENGTH);
  }, [courseLength, courseWidth, loadedSandTexture]);

  useEffect(() => () => greenTexture.dispose(), [greenTexture]);
  useEffect(() => () => fairwayTexture.dispose(), [fairwayTexture]);
  useEffect(() => () => roughTexture.dispose(), [roughTexture]);
  useEffect(() => () => sandTexture.dispose(), [sandTexture]);

  const terrainTexture = {
    Green: greenTexture,
    Fairway: fairwayTexture,
    Rough: roughTexture,
    Sand: sandTexture,
  }[surface];

  return (
    <>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[courseCenterX, 0, courseCenterZ]}>
        <planeGeometry args={[courseWidth, courseLength]} />
        <meshStandardMaterial
          key={`${surface.toLowerCase()}-terrain`}
          color="#ffffff"
          map={terrainTexture}
          roughness={terrain.roughness}
          metalness={0.03}
        />
      </mesh>

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
