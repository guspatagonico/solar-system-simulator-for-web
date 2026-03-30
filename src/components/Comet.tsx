import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
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

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const tailFragmentShader = `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;

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
      // vUv.x: 0 = head, 1 = tip (along tail length)
      // vUv.y: 0 = bottom edge, 1 = top edge (across tail width)

      // Fade from head to tip
      float fade = 1.0 - smoothstep(0.0, 1.0, vUv.x);
      fade = pow(fade, 1.5);

      // Fan out at the tip: widen the tail as it extends
      float fanFactor = 1.0 + vUv.x * 1.5;

      // Flowing noise animation along the tail
      float flowSpeed = 2.0;
      vec2 noiseCoord = vec2(vUv.x * 4.0 - uTime * flowSpeed, vUv.y * 3.0 + uTime * 0.5);
      float n = fbm(noiseCoord);

      // Secondary noise for detail
      vec2 noiseCoord2 = vec2(vUv.x * 8.0 - uTime * flowSpeed * 0.7, vUv.y * 6.0);
      float n2 = fbm(noiseCoord2) * 0.5;

      // Center-weighted: tail is brightest in the middle, fading at edges
      float centerDist = abs(vUv.y - 0.5) * 2.0;
      float centerFade = 1.0 - smoothstep(0.0, 1.0, centerDist / fanFactor);

      // Combine: fade * noise * center weight
      float alpha = fade * (n * 0.7 + n2 * 0.3) * centerFade;
      alpha = clamp(alpha, 0.0, 1.0);

      // Color variation: brighter near head, dimmer at tip
      vec3 color = uColor * (0.8 + n * 0.4);
      color = mix(color, uColor * 1.2, fade * 0.3);

      // Add subtle blue-white streaks near the head
      float streaks = smoothstep(0.6, 0.0, vUv.x) * n2 * 0.3;
      color += vec3(0.3, 0.4, 0.5) * streaks;

      gl_FragColor = vec4(color, alpha * 0.7);
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
        tailRef.current.position.copy(awayDir).multiplyScalar(visualRadius * 2 + tailLength / 2);
        tailRef.current.quaternion.setFromUnitVectors(xAxis, awayDir);
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

  const orbitPoints = useMemo(() => {
    if (data.orbitalPeriod <= 0) return [];
    const points = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      const px = a * Math.cos(angle) - focusOffset;
      const pz = b * Math.sin(angle);
      points.push(new THREE.Vector3(px, 0, pz));
    }
    return points;
  }, [a, b, focusOffset, data.orbitalPeriod]);

  const tailGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(tailLength, tailWidth, 32, 8);
    return geo;
  }, [tailLength, tailWidth]);

  return (
    <group name={`${data.id}_container`}>
      {state.showOrbits && data.distanceFromParent > 0 && (
        <Line
          points={orbitPoints}
          color="#00ffff"
          lineWidth={1.5}
          transparent
          opacity={0.5}
        />
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
              pointerEvents: 'none',
              userSelect: 'none',
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
