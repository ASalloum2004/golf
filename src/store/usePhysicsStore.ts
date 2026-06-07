import { create } from 'zustand';

export type SurfaceType = 'Green' | 'Fairway' | 'Rough' | 'Sand';
export type CameraMode = 'TeeBox' | 'Follow' | 'TopDown' | 'Free';

export interface Obstacle {
  id: string;
  type: 'Tree' | 'Wall';
  position: [number, number, number];
}

export interface PhysicsState {
  loftAngle: number;
  clubFriction: number;
  initialVelocity: number;
  verticalAngle: number;
  horizontalAngle: number;
  spinSpeed: number;
  spinAxis: number;
  mass: number;
  radius: number;
  inertiaConstant: number;
  gravity: number;
  airDensity: number;
  windSpeed: number;
  windDirection: number;
  buoyancy: boolean;
  dragCoeff: number;
  liftCoeff: number;
  sideForceCoeff: number;
  spinDamping: number;
  surface: SurfaceType;
  restitution: number;
  surfaceFriction: number;
  rollingResistance: number;
  obstacleRestitution: number;
  obstacleFriction: number;
  vegDamping: number;
  cupRestitution: number;
  flagstickRestitution: number;
  flagstickFriction: number;
  dynamicViscosity: number;
}

export const surfacePresets: Record<SurfaceType, { restitution: number; surfaceFriction: number; rollingResistance: number }> = {
  Green: { restitution: 0.3, surfaceFriction: 0.3, rollingResistance: 0.05 },
  Fairway: { restitution: 0.5, surfaceFriction: 0.4, rollingResistance: 0.1 },
  Rough: { restitution: 0.2, surfaceFriction: 0.6, rollingResistance: 0.25 },
  Sand: { restitution: 0.05, surfaceFriction: 0.8, rollingResistance: 0.4 },
};

const paramLimits: Partial<Record<keyof PhysicsState, [number, number]>> = {
  loftAngle: [0, 64],
  clubFriction: [0, 1],
  initialVelocity: [0, 100],
  verticalAngle: [-20, 90],
  horizontalAngle: [-45, 45],
  spinSpeed: [0, 1000],
  spinAxis: [-90, 90],
  mass: [1, 1000],
  radius: [0.001, 0.1],
  inertiaConstant: [0.01, 1],
  gravity: [0, 50],
  airDensity: [0, 3],
  windSpeed: [0, 100],
  windDirection: [0, 359],
  dragCoeff: [0, 2],
  liftCoeff: [0, 2],
  sideForceCoeff: [0, 2],
  spinDamping: [0, 5],
  restitution: [0, 1],
  surfaceFriction: [0, 1],
  rollingResistance: [0, 2],
  obstacleRestitution: [0, 1],
  obstacleFriction: [0, 1],
  vegDamping: [0, 1],
  cupRestitution: [0, 1],
  flagstickRestitution: [0, 1],
  flagstickFriction: [0, 1],
  dynamicViscosity: [1e-8, 1e-3],
};

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const next = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.min(max, Math.max(min, next));
}

function sanitizeParam<K extends keyof PhysicsState>(
  key: K,
  value: unknown,
  fallback: PhysicsState[K],
): PhysicsState[K] {
  if (key === 'buoyancy') return Boolean(value) as PhysicsState[K];
  if (key === 'surface') {
    const surface = String(value) as SurfaceType;
    return (surface in surfacePresets ? surface : fallback) as PhysicsState[K];
  }

  const limits = paramLimits[key];
  if (!limits) return fallback;

  const [min, max] = limits;
  const clamped = clampNumber(value, fallback as number, min, max);
  if (key === 'windDirection') return (((clamped % 360) + 360) % 360) as PhysicsState[K];
  return clamped as PhysicsState[K];
}

function nextObstacleId(obstacles: Obstacle[], type: Obstacle['type']): string {
  const prefix = type.toLowerCase();
  const maxId = obstacles.reduce((max, obstacle) => {
    const match = obstacle.id.match(new RegExp(`^${prefix}-(\\d+)$`));
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}-${maxId + 1}`;
}

function nextObstaclePosition(obstacles: Obstacle[], type: Obstacle['type']): [number, number, number] {
  const count = obstacles.filter(obstacle => obstacle.type === type).length;
  const lane = [0, -5, 5, -10, 10, -15, 15][count % 7];
  const distance = type === 'Tree' ? -18 - count * 9 : -26 - count * 11;
  return [lane, 0, distance];
}

const initialPhysicsState: PhysicsState = {
  loftAngle: 45, clubFriction: 0.8,
  initialVelocity: 32, verticalAngle: 24, horizontalAngle: 0, spinSpeed: 500, spinAxis: 0,
  mass: 45.93, radius: 0.02135, inertiaConstant: 0.4,
  gravity: 9.81, airDensity: 1.225, windSpeed: 0, windDirection: 0, buoyancy: true,
  dragCoeff: 0.24, liftCoeff: 0.15, sideForceCoeff: 0, spinDamping: 0.05,
  surface: 'Fairway', restitution: 0.5, surfaceFriction: 0.4, rollingResistance: 0.1,
  obstacleRestitution: 0.3, obstacleFriction: 0.3, vegDamping: 0.8,
  cupRestitution: 0.1, flagstickRestitution: 0.2, flagstickFriction: 0.5,
  dynamicViscosity: 0.0000181
};

interface PhysicsStore extends PhysicsState {
  // Dynamic Scene State
  cameraMode: CameraMode;
  ballPosition: [number, number, number];
  obstacles: Obstacle[];
  selectedObstacle: string | null;
  
  // Real-time Metrics (updated by Physics loop)
  metrics: {
    status: string;
    flightTime: number;
    maxHeight: number;
    carryDistance: number;
    totalDistance: number;
    sideDeviation: number;
    landingSpeed: number;
    landingAngle: number;
    reynoldsNumber: number;
  };

  // Actions
  updateParam: (key: keyof PhysicsState, value: unknown) => void;
  setSurface: (surface: SurfaceType) => void;
  resetParams: () => void;
  
  setCameraMode: (mode: CameraMode) => void;
  updateBallPosition: (pos: [number, number, number]) => void;
  
  // Simulation control
  simActive: boolean;
  hitBall: () => void;
  stopSim: () => void;
  updateMetrics: (patch: Partial<PhysicsStore['metrics']>) => void;

  addObstacle: (type: 'Tree' | 'Wall') => void;
  shiftSelectedObstacle: (dx: number) => void;
  shiftObstacleZ: (dz: number) => void;
  removeSelectedObstacle: () => void;
  setSelectedObstacle: (id: string | null) => void;
}

const emptyMetrics = {
  status: 'Stopped',
  flightTime: 0, maxHeight: 0, carryDistance: 0,
  totalDistance: 0, sideDeviation: 0,
  landingSpeed: 0, landingAngle: 0, reynoldsNumber: 0,
} as const;

export const usePhysicsStore = create<PhysicsStore>((set) => ({
  ...initialPhysicsState,

  cameraMode: 'TeeBox',
  ballPosition: [0, initialPhysicsState.radius, 0],
  obstacles: [],
  selectedObstacle: null,
  simActive: false,

  metrics: { ...emptyMetrics },

  updateParam: (key, value) => set((state) => {
    const nextValue = sanitizeParam(key, value, state[key]);
    const patch: Partial<PhysicsStore> = { [key]: nextValue } as Partial<PhysicsStore>;

    if (key === 'radius' && !state.simActive) {
      patch.ballPosition = [state.ballPosition[0], nextValue as number, state.ballPosition[2]];
    }

    return patch;
  }),
  setSurface: (surface) => set((state) => {
    const safeSurface = surface in surfacePresets ? surface : state.surface;
    return { surface: safeSurface, ...surfacePresets[safeSurface] };
  }),

  resetParams: () => set((state) => ({
    ...initialPhysicsState,
    simActive: false,
    ballPosition: [0, initialPhysicsState.radius, 0] as [number, number, number],
    metrics: { ...emptyMetrics },
    // keep obstacles & camera as they are
    obstacles: state.obstacles,
    cameraMode: state.cameraMode,
  })),

  hitBall: () => set((state) => ({
    simActive: true,
    ballPosition: [0, state.radius, 0] as [number, number, number],
    metrics: { ...emptyMetrics, status: 'Flying' },
  })),

  stopSim: () => set({ simActive: false }),

  updateMetrics: (patch) => set((state) => ({
    metrics: { ...state.metrics, ...patch },
  })),
  
  setCameraMode: (mode) => set({ cameraMode: mode }),
  updateBallPosition: (pos) => set({ ballPosition: pos }),
  
  addObstacle: (type) => set((state) => {
    const safeType = type === 'Wall' ? 'Wall' : 'Tree';
    const newObs: Obstacle = {
      id: nextObstacleId(state.obstacles, safeType),
      type: safeType,
      position: nextObstaclePosition(state.obstacles, safeType)
    };
    return { obstacles: [...state.obstacles, newObs], selectedObstacle: newObs.id };
  }),
  
  shiftSelectedObstacle: (dx) => set((state) => ({
    obstacles: state.obstacles.map(o => 
      o.id === state.selectedObstacle 
        ? { ...o, position: [o.position[0] + dx, o.position[1], o.position[2]] } 
        : o
    )
  })),

  shiftObstacleZ: (dz) => set((state) => ({
    obstacles: state.obstacles.map(o =>
      o.id === state.selectedObstacle
        ? { ...o, position: [o.position[0], o.position[1], o.position[2] + dz] }
        : o
    )
  })),
  
  removeSelectedObstacle: () => set((state) => ({
    obstacles: state.obstacles.filter(o => o.id !== state.selectedObstacle),
    selectedObstacle: null
  })),
  
  setSelectedObstacle: (id) => set({ selectedObstacle: id })
}));
