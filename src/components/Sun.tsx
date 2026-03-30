import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { SCALE_FACTORS } from '../constants';
import { SimulationState } from '../types';
import SunSurfaceMaterial from './SunSurfaceMaterial';
import SunCoronaMaterial from './SunCoronaMaterial';

interface Props {
  radius: number;
  state: SimulationState;
}

const Sun: React.FC<Props> = ({ radius, state }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const visualRadius = radius * SCALE_FACTORS.PLANET_SIZE;

  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);
  const texture = useMemo(() => textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/9/99/Map_of_the_full_sun.jpg'), [textureLoader]);

  useFrame((threeState, delta) => {
    if (!state.isPaused) {
      if (meshRef.current) {
        const rotationSpeed = (delta * state.timeScale * Math.PI * 2) / (25.4 * SCALE_FACTORS.TIME);
        meshRef.current.rotation.y += rotationSpeed;
      }
      if (glowRef.current) {
        glowRef.current.rotation.y -= 0.002 * state.timeScale;
      }
    }
  });

  return (
    <group>
      {/* Sun Core */}
      <mesh ref={meshRef} renderOrder={-1}>
        <sphereGeometry args={[visualRadius, 64, 64]} />
        <SunSurfaceMaterial texture={texture} isPaused={state.isPaused} timeScale={state.timeScale} />
      </mesh>

      {/* Sun Glow/Corona */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[visualRadius * 1.2, 64, 64]} />
        <SunCoronaMaterial isPaused={state.isPaused} timeScale={state.timeScale} visualRadius={visualRadius} />
      </mesh>

      {/* Point Light - The main light source for the solar system */}
      <pointLight
        intensity={2 * (state.ambientIntensity * 2)}
        distance={0}
        decay={0}
        color="#ffffff"
      />
      <ambientLight intensity={state.ambientIntensity} />
      <directionalLight intensity={0.3 * (state.ambientIntensity * 2)} position={[5, 5, 5]} />

      {/* Floating Label */}
      {state.showLabels && (
        <Html
          position={[0, visualRadius + 5, 0]}
          center
          occlude
          zIndexRange={[10, 0]}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
            <div className="flex flex-col items-center">
              <div className="px-3 py-1 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/40 rounded-full whitespace-nowrap shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                <span className="text-xs font-bold text-yellow-100 uppercase tracking-[0.2em]">
                  SUN
                </span>
              </div>
              <div className="w-px h-4 bg-gradient-to-b from-yellow-500/60 to-transparent" />
            </div>
          </Html>
      )}
    </group>
  );
};

export default Sun;
