import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CelestialBodyData, SimulationState } from '../types';
import { SCALE_FACTORS } from '../constants';

interface Props {
  data: CelestialBodyData;
  state: SimulationState;
  onSelect: (id: string) => void;
}

const Comet: React.FC<Props> = ({ data, state, onSelect }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const tailMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const xAxis = useMemo(() => new THREE.Vector3(1, 0, 0), []);
  const awayDir = useMemo(() => new THREE.Vector3(), []);

  const baseRadius = data.radius * SCALE_FACTORS.PLANET_SIZE;
  const distortionFactor = Math.pow(6371 / data.radius, 0.3);
  const enhancement = state.visualEnhancement;
  const visualRadius = baseRadius * enhancement * distortionFactor;

  const rawDistance = data.distanceFromParent;
  let compressedDistance = 0;

  if (rawDistance > 0) {
    compressedDistance = Math.pow(rawDistance, 0.6) * 10 * SCALE_FACTORS.DISTANCE;
  }

  const a = compressedDistance;
  const e = THREE.MathUtils.clamp(data.eccentricity || 0, 0, 0.999);
  const b = a * Math.sqrt(1 - e * e);
  const focusOffset = a * e;

  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);
  const texture = useMemo(() => textureLoader.load(data.textureUrl), [data.textureUrl]);

  const tailColor = useMemo(() => new THREE.Color(data.tailColor || '#88CCFF'), [data.tailColor]);
  const tailLength = visualRadius * 12;
  const tailWidth = visualRadius * 3;

  const tailUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: tailColor },
  }), [tailColor]);

  const tailVertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const tailFragmentShader = `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;
    varying vec3 vPosition;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // For cone: vUv.y goes from 0 at base to 1 at tip (along length)
      // Radial distance from center axis in vPosition.xz
      
      float distFromAxis = length(vPosition.xz);
      float maxRadius = 0.5; // cone radius at base
      
      // Fade along length: bright at comet, fades to tip
      float lengthFade = 1.0 - vUv.y;
      lengthFade = pow(lengthFade, 0.8);
      
      // Radial fade: center is bright, edges fade
      float radialFade = 1.0 - smoothstep(0.0, maxRadius * (1.0 - vUv.y * 0.8), distFromAxis);
      
      // Animated noise for gas/dust effect
      float flowSpeed = 3.0;
      vec2 noiseCoord = vec2(vUv.y * 6.0 - uTime * flowSpeed, atan(vPosition.x, vPosition.z) * 2.0);
      float n = fbm(noiseCoord);
      
      vec2 noiseCoord2 = vec2(vUv.y * 12.0 - uTime * flowSpeed * 0.8, atan(vPosition.x, vPosition.z) * 4.0);
      float n2 = fbm(noiseCoord2) * 0.5;
      
      // Combine fades
      float alpha = lengthFade * radialFade * (0.6 + n * 0.4 + n2 * 0.2);
      alpha = clamp(alpha, 0.0, 1.0);
      
      // Color: brighter at head, slight variation with noise
      vec3 color = uColor * (0.7 + n * 0.3);
      color = mix(color, uColor * 1.3, lengthFade * 0.4);
      
      gl_FragColor = vec4(color, alpha * 0.6);
    }
  `;

  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!state.isPaused) {
      timeRef.current += delta * state.timeScale;
    }

    const time = timeRef.current;

    if (data.orbitalPeriod > 0 && groupRef.current) {
      const angle = (time / (data.orbitalPeriod * SCALE_FACTORS.TIME)) * Math.PI * 2;
      const x = a * Math.cos(angle) - focusOffset;
      const z = b * Math.sin(angle);
      groupRef.current.position.set(x, 0, z);

      if (tailRef.current) {
        awayDir.copy(groupRef.current.position);
        if (awayDir.lengthSq() < 1e-8) {
          awayDir.set(1, 0, 0);
        } else {
          awayDir.normalize();
        }
        tailRef.current.position.copy(awayDir).multiplyScalar(visualRadius * 1.5);
        tailRef.current.lookAt(groupRef.current.position.clone().add(awayDir));
      }
    }

    if (!state.isPaused && meshRef.current && data.rotationPeriod !== 0) {
      const rotationSpeed = (delta * state.timeScale * Math.PI * 2) / ((data.rotationPeriod / 24) * SCALE_FACTORS.TIME);
      meshRef.current.rotation.y += rotationSpeed;
    }

    if (tailMaterialRef.current) {
      tailMaterialRef.current.uniforms.uTime.value = time;
    }
  });

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
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [a, b, focusOffset, data.orbitalPeriod]);

  const tailGeometry = useMemo(() => {
    const geo = new THREE.ConeGeometry(tailWidth * 0.5, tailLength, 32, 8, true);
    geo.rotateX(Math.PI / 2);
    geo.translate(0, 0, tailLength / 2);
    return geo;
  }, [tailLength, tailWidth]);

  return (
    <group name={`${data.id}_container`}>
      {state.showOrbits && data.distanceFromParent > 0 && orbitGeometry && (
        <line geometry={orbitGeometry}>
          <lineBasicMaterial color="#00ff88" transparent opacity={0.8} />
        </line>
      )}

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
          <sphereGeometry args={[visualRadius, 32, 32]} />
          <meshPhongMaterial
            map={texture}
            emissive={data.color}
            emissiveIntensity={0.1}
          />
        </mesh>

        {/* Comet tail: plane extending away from the Sun */}
        <mesh
          ref={tailRef}
          position={[-visualRadius * 2 - tailLength / 2, 0, 0]}
        >
          <primitive object={tailGeometry} attach="geometry" />
          <shaderMaterial
            ref={tailMaterialRef}
            uniforms={tailUniforms}
            vertexShader={tailVertexShader}
            fragmentShader={tailFragmentShader}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {state.showLabels && (
          <Html
            position={[0, visualRadius + 2, 0]}
            center
            occlude
            zIndexRange={[10, 0]}
            style={{
              pointerEvents: 'auto',
              userSelect: 'none',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(data.id);
            }}
          >
            <div className="flex flex-col items-center">
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

export default Comet;
