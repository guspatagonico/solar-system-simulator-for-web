import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  isPaused: boolean;
  timeScale: number;
  visualRadius: number;
}

const SunCoronaMaterial: React.FC<Props> = ({ isPaused, timeScale, visualRadius }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uVisualRadius: { value: visualRadius },
  }), [visualRadius]);

  useFrame((state, delta) => {
    if (!isPaused) {
      timeRef.current += delta * timeScale;
    }
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = timeRef.current;
    }
  });

  const vertexShader = `
    varying vec3 vViewPos;
    varying vec3 vNormal;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPos = mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform float uVisualRadius;
    varying vec3 vViewPos;
    varying vec3 vNormal;

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

    // Turbulent plasma noise: multi-scale warped fbm
    float plasma(vec2 p, float t) {
      // Slow large-scale swirls
      vec2 q1 = vec2(
        fbm(p + vec2(0.0, 0.0) + t * 0.02),
        fbm(p + vec2(5.2, 1.3) + t * 0.025)
      );
      vec2 r1 = vec2(
        fbm(p + 3.0 * q1 + vec2(1.7, 9.2) + t * 0.015),
        fbm(p + 3.0 * q1 + vec2(8.3, 2.8) + t * 0.02)
      );
      float large = fbm(p + 3.0 * r1);

      // Medium-scale detail
      vec2 q2 = vec2(
        fbm(p * 2.0 + vec2(3.1, 7.4) + t * 0.03),
        fbm(p * 2.0 + vec2(1.9, 4.8) + t * 0.035)
      );
      float medium = fbm(p * 2.0 + 2.0 * q2);

      // Small-scale texture
      float small = fbm(p * 4.0 + t * 0.04);

      return large * 0.5 + medium * 0.3 + small * 0.2;
    }

    void main() {
      // Screen-space distance from sun center
      float screenDist = length(vViewPos.xy);
      float normalizedDist = screenDist / uVisualRadius;
      float limbDist = max(normalizedDist - 1.0, 0.0); // 0 at limb, positive outward

      // --- SMOOTH BASE GLOW: the luminous shell ---
      // Extends 20% beyond the sun's limb
      float coronaWidth = 0.2;
      float baseGlow = 1.0 - smoothstep(0.0, coronaWidth, limbDist);
      baseGlow = pow(baseGlow, 1.2);

      // Kill inside sun's disc
      baseGlow *= smoothstep(0.98, 1.02, normalizedDist);

      // --- TURBULENT PLASMA: organic flowing patterns ---
      float angle = atan(vViewPos.y, vViewPos.x);
      float t = uTime * 0.006; // VERY SLOW: majestic plasma

      // Map to polar-like coordinates for plasma
      // Angle wraps naturally, radial goes from 0 (at limb) to 1 (at outer edge)
      float radialNorm = clamp(limbDist / coronaWidth, 0.0, 1.0);
      vec2 plasmaCoord = vec2(angle * 2.5, radialNorm * 4.0);

      float turb = plasma(plasmaCoord, t);

      // Plasma creates bright/dark patches on top of the base glow
      // Turbulent regions are slightly brighter, calm regions slightly dimmer
      float plasmaMod = 0.7 + turb * 0.6;

      // --- FINE FILAMENTS: hair-like radial streaks ---
      // These flow with the turbulence, not at fixed angles
      float filaments = 0.0;

      // Radial noise displacement creates the filament look
      for (int i = 0; i < 3; i++) {
        float scale = float(i + 1) * 12.0;
        float shift = float(i) * 1.7;
        // Angle-variation creates thin radial lines
        float f = sin(angle * scale + turb * 3.0 + shift + t * 0.5);
        f = pow(abs(f), 12.0 - float(i) * 2.0); // Very thin lines
        filaments += f * (0.1 - float(i) * 0.02);
      }

      // Filaments fade with distance from limb
      filaments *= baseGlow;

      // --- LONG STREAMERS: subtle, organic extensions ---
      // Much softer than before - just slightly longer bright regions
      float streamers = 0.0;
      // Use noise to create uneven bright regions along the angle
      float streamerPattern = fbm(vec2(angle * 3.0, t * 0.2));
      streamerPattern = pow(streamerPattern, 2.0); // Sharpen slightly
      // These extend further but are subtle
      float streamerReach = 1.0 - smoothstep(0.0, coronaWidth * 1.8, limbDist);
      streamers = streamerPattern * streamerReach * 0.25;

      // --- INNER RING: bright chromosphere transition ---
      float innerRing = exp(-pow((normalizedDist - 1.0) * 25.0, 2.0));

      // --- Combine ---
      float intensity = baseGlow * plasmaMod + filaments * 0.15 + streamers + innerRing * 0.6;

      // Slow global brightness pulsation
      float breathe = sin(t * 0.3) * 0.05 + 1.0;
      intensity *= breathe;

      intensity = clamp(intensity, 0.0, 2.0);

      // --- COLORS: white-hot inner, golden middle, orange outer ---
      vec3 whiteHot = vec3(1.0, 0.98, 0.9);
      vec3 golden = vec3(1.0, 0.85, 0.45);
      vec3 orange = vec3(1.0, 0.5, 0.1);
      vec3 deepOrange = vec3(0.8, 0.25, 0.03);

      // Color gradient by distance from limb
      float colorT = radialNorm;
      vec3 color = mix(whiteHot, golden, smoothstep(0.0, 0.15, colorT));
      color = mix(color, orange, smoothstep(0.15, 0.5, colorT));
      color = mix(color, deepOrange, smoothstep(0.5, 1.0, colorT));

      // Turbulent regions get slightly hotter (whiter) color
      color = mix(color, whiteHot, (turb - 0.5) * 0.15);

      gl_FragColor = vec4(color * intensity, intensity * 0.85);
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
