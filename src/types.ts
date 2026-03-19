export interface CelestialBodyData {
  id: string;
  name: string;
  type: 'star' | 'planet' | 'moon';
  radius: number; // in km
  distanceFromParent: number; // in million km
  orbitalPeriod: number; // in Earth days
  rotationPeriod: number; // in Earth hours
  eccentricity?: number; // orbital eccentricity
  color: string;
  textureUrl: string;
  description: string;
  moons?: CelestialBodyData[];
  rings?: {
    innerRadius: number;
    outerRadius: number;
    textureUrl: string;
  };
  atmosphere?: {
    color: string;
    opacity: number;
    cloudsUrl?: string;
  };
}

export interface SimulationState {
  timeScale: number;
  visualEnhancement: number; // 1 = realistic, higher = visual enhancement (scale distortion)
  showOrbits: boolean;
  focusedBodyId: string | null;
  isPaused: boolean;
  ambientIntensity: number;
}
