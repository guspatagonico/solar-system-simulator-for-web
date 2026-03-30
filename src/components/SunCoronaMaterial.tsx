import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  isPaused: boolean;
  timeScale: number;
}

const SunCoronaMaterial: React.FC<Props> = ({ isPaused, timeScale }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  useFrame((state, delta) => {
    if (!isPaused) {
      timeRef.current += delta * timeScale;
    }
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = timeRef.current;
    }
  });

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewDir = normalize(-mvPosition.xyz);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    #define PI 3.14159265359

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

    // Smooth value noise for streamer modulation
    float smoothNoise(vec2 p) {
      return fbm(p);
    }

    void main() {
      // Fresnel: bright at edges, dim at center (BackSide inverts)
      float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);
      fresnel = pow(fresnel, 1.8);

      // Polar coordinates from UV (sphere mapping)
      // vUv.x = longitude (0-1), vUv.y = latitude (0-1)
      float angle = vUv.x * PI * 2.0;
      float radialPos = abs(vUv.y - 0.5) * 2.0; // 0 at equator, 1 at poles

      // --- INNER CORONA: smooth, bright glow ---
      float innerGlow = fresnel * 0.9;

      // --- RADIAL STREAMERS: long thin filaments ---
      // Streamer base pattern: varies with angle
      // Use noise along angle to create asymmetric streamers
      float t = uTime * 0.05;
      float streamerNoise1 = smoothNoise(vec2(angle * 3.0, t));
      float streamerNoise2 = smoothNoise(vec2(angle * 7.0 + 5.0, t * 0.7));
      float streamerNoise3 = smoothNoise(vec2(angle * 2.0 + 10.0, t * 0.3));

      // Combine noise to create streamer intensity per angle
      // Some angles get strong streamers, others are dim
      float streamerIntensity = streamerNoise1 * 0.5 + streamerNoise2 * 0.3 + streamerNoise3 * 0.2;
      streamerIntensity = pow(streamerIntensity, 1.5); // Sharpen contrast

      // Radial falloff: streamers extend outward from the sun
      // Inner region: dense, outer region: thin filaments
      float radialFalloff = 1.0 - smoothstep(0.0, 1.0, fresnel);
      radialFalloff = pow(radialFalloff, 0.8);

      // Thin filament modulation: create narrow bright lines
      // Use high-frequency angular noise to thin out the streamers
      float filamentNoise = smoothNoise(vec2(angle * 20.0, fresnel * 5.0 + t * 0.2));
      float filaments = pow(filamentNoise, 2.5); // Very sharp = very thin

      // Streamer length variation: some extend further
      float lengthNoise = smoothNoise(vec2(angle * 4.0 + 3.0, t * 0.15));
      float maxLength = 0.3 + lengthNoise * 0.7; // Varies from 30% to 100%
      float lengthMask = 1.0 - smoothstep(0.0, maxLength, fresnel);

      // Combine streamers
      float streamers = streamerIntensity * filaments * lengthMask * 1.2;

      // --- EQUATORIAL BRIGHTENING: real corona is brighter at equator ---
      float equatorBright = 1.0 - smoothstep(0.0, 0.5, radialPos);
      equatorBright = pow(equatorBright, 2.0) * 0.4;

      // --- POLAR STREAMERS: longer at poles, real magnetic field effect ---
      float polarBoost = smoothstep(0.3, 0.8, radialPos) * 0.3;
      streamers *= (1.0 + polarBoost);

      // --- Combine everything ---
      float totalIntensity = innerGlow + streamers + equatorBright;

      // Slow rotation of the whole corona
      float slowRotate = smoothNoise(vec2(angle + uTime * 0.02, 0.5));
      totalIntensity *= 0.85 + slowRotate * 0.3;

      // Color: white-yellow core, orange-red streamers
      vec3 coreColor = vec3(1.0, 0.97, 0.8);
      vec3 streamerColor = vec3(1.0, 0.6, 0.15);
      vec3 outerColor = vec3(1.0, 0.35, 0.05);

      vec3 color = mix(coreColor, streamerColor, smoothstep(0.0, 0.3, fresnel));
      color = mix(color, outerColor, smoothstep(0.3, 0.8, fresnel));

      // Streamers get a slightly different tint
      color = mix(color, vec3(1.0, 0.7, 0.3), streamers * 0.3);

      gl_FragColor = vec4(color * totalIntensity, totalIntensity * 0.75);
    }
  `;

  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
      side={THREE.BackSide}
      transparent
    />
  );
};

export default SunCoronaMaterial;
