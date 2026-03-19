import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CelestialBodyData, SimulationState } from '../types';
import { SCALE_FACTORS } from '../constants';
import GasGiantMaterial from './GasGiantMaterial';

interface Props {
  data: CelestialBodyData;
  state: SimulationState;
  onSelect: (id: string) => void;
}

const CelestialBody: React.FC<Props> = ({ data, state, onSelect }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Calculate visual radius with scale distortion
  // Smaller bodies get a relative boost to remain visible
  const baseRadius = data.radius * SCALE_FACTORS.PLANET_SIZE;
  const distortionFactor = data.type === 'star' ? 1 : Math.pow(6371 / data.radius, 0.3);
  const enhancement = data.type === 'star' ? 1 : state.visualEnhancement;
  const visualRadius = baseRadius * enhancement * distortionFactor;
  
  // Calculate orbital parameters with compressed distance scaling
  // This makes the outer planets much closer to the sun for better visibility
  const rawDistance = data.distanceFromParent;
  let compressedDistance = 0;
  
  if (rawDistance > 0) {
    if (data.type === 'moon') {
      // For moons, use a simpler scaling to keep them close to their planets
      compressedDistance = rawDistance * 20 * SCALE_FACTORS.DISTANCE;
    } else {
      // For planets, use a power scale (d^0.6) to compress large distances
      compressedDistance = Math.pow(rawDistance, 0.6) * 10 * SCALE_FACTORS.DISTANCE;
    }
  }
  
  const a = compressedDistance; // semi-major axis
  const e = data.eccentricity || 0; // eccentricity
  const b = a * Math.sqrt(1 - e * e); // semi-minor axis
  const focusOffset = a * e; // distance from center to focus

  // Load textures
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);
  const texture = useMemo(() => textureLoader.load(data.textureUrl), [data.textureUrl]);
  
  const cloudTexture = useMemo(() => {
    if (data.atmosphere?.cloudsUrl) {
      return textureLoader.load(data.atmosphere.cloudsUrl);
    }
    return null;
  }, [data.atmosphere?.cloudsUrl]);

  // Use a persistent time value to handle pausing and scaling
  const timeRef = useRef(0);

  useFrame((threeState, delta) => {
    if (!state.isPaused) {
      timeRef.current += delta * state.timeScale;
    }

    const time = timeRef.current;

    // Update orbital position using elliptical parametric equations
    if (data.orbitalPeriod > 0 && groupRef.current) {
      const angle = (time / (data.orbitalPeriod * SCALE_FACTORS.TIME)) * Math.PI * 2;
      
      // Parametric ellipse equations relative to focus (the parent)
      const x = a * Math.cos(angle) - focusOffset;
      const z = b * Math.sin(angle);
      
      groupRef.current.position.set(x, 0, z);
    }

    // Update rotation
    if (meshRef.current) {
      const rotationSpeed = (delta * state.timeScale) / (data.rotationPeriod / 24);
      meshRef.current.rotation.y += rotationSpeed;
    }

    // Update clouds rotation (slightly faster)
    if (cloudRef.current) {
      cloudRef.current.rotation.y += (delta * state.timeScale * 1.2) / (data.rotationPeriod / 24);
    }
  });

  // Create elliptical path for visualization
  const orbitPoints = useMemo(() => {
    if (data.orbitalPeriod <= 0) return [];
    const points = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      const x = a * Math.cos(angle) - focusOffset;
      const z = b * Math.sin(angle);
      points.push(new THREE.Vector3(x, 0, z));
    }
    return points;
  }, [a, b, focusOffset, data.orbitalPeriod]);

  const isGasGiant = ['jupiter', 'saturn', 'uranus', 'neptune'].includes(data.id);

  return (
    <group name={`${data.id}_container`}>
      {/* Orbit Path (Static relative to parent) */}
      {state.showOrbits && data.distanceFromParent > 0 && (
        <line>
          <bufferGeometry attach="geometry" setFromPoints={orbitPoints} />
          <lineBasicMaterial attach="material" color="#ffffff" opacity={0.8} transparent />
        </line>
      )}

      {/* The Body and its children (Moons) */}
      <group ref={groupRef} name={data.id}>
        <mesh
          ref={meshRef}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            onSelect(data.id);
          }}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'auto')}
        >
          <sphereGeometry args={[visualRadius, 64, 64]} />
          {data.type === 'star' ? (
            <meshBasicMaterial map={texture} color={data.color} />
          ) : isGasGiant ? (
            <GasGiantMaterial texture={texture} color={data.color} id={data.id} />
          ) : (
            <meshStandardMaterial 
              map={texture} 
              roughness={0.7} 
              metalness={0.2} 
              emissive={data.color}
              emissiveIntensity={0.05}
            />
          )}
        </mesh>

        {/* Atmosphere/Clouds */}
        {cloudTexture && (
          <mesh ref={cloudRef} castShadow receiveShadow>
            <sphereGeometry args={[visualRadius * 1.02, 64, 64]} />
            <meshStandardMaterial
              map={cloudTexture}
              transparent
              opacity={data.atmosphere?.opacity || 0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* Rings */}
        {data.rings && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[
                data.rings.innerRadius * SCALE_FACTORS.PLANET_SIZE * enhancement * distortionFactor,
                data.rings.outerRadius * SCALE_FACTORS.PLANET_SIZE * enhancement * distortionFactor,
                128
              ]}
            />
            <meshStandardMaterial
              map={textureLoader.load(data.rings.textureUrl)}
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        )}

        {/* Moons (Nested inside the mover group) */}
        {data.moons?.map((moon) => (
          <CelestialBody
            key={moon.id}
            data={moon}
            state={state}
            onSelect={onSelect}
          />
        ))}
      </group>
    </group>
  );
};

export default CelestialBody;
