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
      // With BackSide rendering: fresnel is HIGH at inner edge (limb), LOW at outer edge
      float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);

      // Polar coordinates
      float angle = vUv.x * PI * 2.0;
      float radialPos = abs(vUv.y - 0.5) * 2.0; // 0 at equator, 1 at poles

      float t = uTime * 0.05;

      // --- Radial falloff: bright at inner edge, fading to nothing ---
      // fresnel ≈ 1 at inner edge (near sun), ≈ 0 at outer edge
      // Use power curve for sharp falloff — corona mostly lives near the sun
      float radialFade = pow(fresnel, 3.5);

      // --- Streamers: thin filaments that extend further than the glow ---
      float s1 = smoothNoise(vec2(angle * 3.0, t));
      float s2 = smoothNoise(vec2(angle * 7.0 + 5.0, t * 0.7));
      float s3 = smoothNoise(vec2(angle * 2.0 + 10.0, t * 0.3));
      float streamerPattern = s1 * 0.5 + s2 * 0.3 + s3 * 0.2;
      streamerPattern = pow(streamerPattern, 2.0);

      // Filaments: thin bright lines
      float filaments = pow(smoothNoise(vec2(angle * 25.0, fresnel * 8.0 + t * 0.15)), 3.0);

      // Streamer length: some extend much further outward
      float lengthNoise = smoothNoise(vec2(angle * 4.0 + 3.0, t * 0.12));
      float maxReach = 0.15 + lengthNoise * 0.85;
      float streamerReach = pow(fresnel, 1.0 + (1.0 - maxReach) * 4.0);

      float streamers = streamerPattern * filaments * streamerReach;

      // --- Equatorial glow: real corona is brighter at equator ---
      float equatorGlow = pow(1.0 - smoothstep(0.0, 0.4, radialPos), 3.0) * 0.5;

      // --- Polar enhancement: streamers longer at poles ---
      float polarBoost = smoothstep(0.3, 0.8, radialPos) * 0.4;
      streamers *= (1.0 + polarBoost);

      // --- Slow rotation ---
      float rotation = smoothNoise(vec2(angle + uTime * 0.015, 0.5));
      float rotMod = 0.8 + rotation * 0.4;

      // --- Combine: base glow + streamers ---
      float glow = radialFade * rotMod * 0.6;
      float intensity = glow + streamers * 0.8 + equatorGlow * radialFade;

      // --- Colors ---
      vec3 innerColor = vec3(1.0, 0.95, 0.75);
      vec3 midColor = vec3(1.0, 0.55, 0.1);
      vec3 tipColor = vec3(0.9, 0.25, 0.02);

      vec3 color = mix(innerColor, midColor, smoothstep(0.0, 0.5, 1.0 - fresnel));
      color = mix(color, tipColor, smoothstep(0.5, 1.0, 1.0 - fresnel));
      color = mix(color, vec3(1.0, 0.75, 0.3), streamers * 0.25);

      gl_FragColor = vec4(color * intensity, intensity);
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
