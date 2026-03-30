import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CelestialBodyData, SimulationState } from '../types';
import { SCALE_FACTORS } from '../constants';
import GasGiantMaterial from './GasGiantMaterial';
import RingMaterial from './RingMaterial';

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
      // For moons, use real physical scale relative to the planet's base radius
      // Independent of visual enhancement and distortion factors
      compressedDistance = rawDistance * SCALE_FACTORS.PLANET_SIZE;
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
  
  const bumpMap = useMemo(() => data.bumpUrl ? textureLoader.load(data.bumpUrl) : null, [data.bumpUrl]);
  const specularMap = useMemo(() => data.specularUrl ? textureLoader.load(data.specularUrl) : null, [data.specularUrl]);

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
    if (meshRef.current && data.rotationPeriod !== 0) {
      const rotationSpeed = (delta * state.timeScale * Math.PI * 2) / ((data.rotationPeriod / 24) * SCALE_FACTORS.TIME);
      meshRef.current.rotation.y += rotationSpeed;
    }

    // Update clouds rotation (slightly faster)
    if (cloudRef.current && data.rotationPeriod !== 0) {
      const cloudRotationSpeed = (delta * state.timeScale * 1.2 * Math.PI * 2) / ((data.rotationPeriod / 24) * SCALE_FACTORS.TIME);
      cloudRef.current.rotation.y += cloudRotationSpeed;
    }
  });

  // Create elliptical path for visualization
  const orbitGeometry = useMemo(() => {
    if (data.orbitalPeriod <= 0) return null;
    const curve = new THREE.EllipseCurve(
      -focusOffset,
      0,
      a,
      b,
      0,
      2 * Math.PI,
      false,
      0
    );
    const points2D = curve.getPoints(512);
    const points = points2D.map(p => new THREE.Vector3(p.x, 0, p.y));
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [a, b, focusOffset, data.orbitalPeriod]);

  const isGasGiant = ['jupiter', 'saturn', 'uranus', 'neptune'].includes(data.id);

  const orbitColor = data.type === 'planet' ? '#00ffff' : '#ff44ff';

  return (
    <group name={`${data.id}_container`}>
      {/* Orbit Path (Static relative to parent) */}
      {state.showOrbits && data.distanceFromParent > 0 && orbitGeometry && (
        <line geometry={orbitGeometry}>
          <lineBasicMaterial color={orbitColor} transparent opacity={0.8} />
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
            <meshBasicMaterial map={texture} color="#ffffff" />
          ) : isGasGiant ? (
            <GasGiantMaterial texture={texture} color={data.color} id={data.id} />
          ) : (
            <meshPhongMaterial 
              map={texture} 
              bumpMap={bumpMap || undefined}
              bumpScale={0.05}
              specularMap={specularMap || undefined}
              specular={new THREE.Color(0x333333)}
              shininess={25}
              emissive={data.color}
              emissiveIntensity={0.05}
            />
          )}
        </mesh>

        {/* Sun Glow */}
        {data.type === 'star' && (
          <mesh>
            <sphereGeometry args={[visualRadius * 1.2, 32, 32]} />
            <meshBasicMaterial
              color={data.color}
              transparent
              opacity={0.15}
              side={THREE.BackSide}
            />
          </mesh>
        )}

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
            <RingMaterial 
              texture={textureLoader.load(data.rings.textureUrl)} 
              color={data.color} 
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

        {/* Floating Label */}
        {state.showLabels && (
          <Html
            position={[0, visualRadius + 2, 0]}
            center
            occlude
            zIndexRange={[10, 0]}
          >
            <div 
              className="flex flex-col items-center cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(data.id);
              }}
            >
              <div className="px-2 py-0.5 bg-black/60 backdrop-blur-sm border border-white/20 rounded-full whitespace-nowrap">
                <span className="text-[10px] font-mono text-white/90 uppercase tracking-wider">
                  {data.name}
                </span>
              </div>
              <div className="w-px h-2 bg-gradient-to-b from-white/40 to-transparent" />
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

export default CelestialBody;
