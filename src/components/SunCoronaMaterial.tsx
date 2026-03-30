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

    // 1D noise for streamer patterns (uses 2D noise for continuity)
    float noise1D(float x) {
      return noise(vec2(x, 0.0));
    }

    void main() {
      // Screen-space distance from sun center (in units of sun radius)
      float screenDist = length(vViewPos.xy);
      float normalizedDist = screenDist / uVisualRadius; // 1.0 = sun's limb, 1.2 = corona outer edge

      // --- Inner edge: where corona meets the sun's limb ---
      // Sun is at radius 1.0, corona starts at 1.0
      // Corona fades from bright at 1.0 to nothing at 1.2+
      float limbDist = normalizedDist - 1.0; // 0 at sun's limb, positive outward
      float coronaWidth = 0.2; // Corona extends 20% beyond sun's radius
      float radialFade = 1.0 - smoothstep(0.0, coronaWidth, limbDist);
      radialFade = pow(radialFade, 1.5); // Gentle curve, not too sharp

      // Kill corona inside the sun's disc (depth test handles overlap, but just in case)
      radialFade *= smoothstep(0.95, 1.05, normalizedDist);

      // --- Angle for streamer patterns ---
      float angle = atan(vViewPos.y, vViewPos.x); // -PI to PI
      float t = uTime * 0.02;

      // --- Streamers: asymmetric radial filaments ---
      // Predefined streamer angles (some long, some short) based on real corona
      // This creates the characteristic "starburst" pattern

      // Long streamers at specific angles (mimics real corona structure)
      float streamer1 = pow(max(0.0, cos(angle - 0.5)), 20.0);  // ~30° above horizontal
      float streamer2 = pow(max(0.0, cos(angle + 0.8)), 15.0);  // ~45° below left
      float streamer3 = pow(max(0.0, cos(angle - 2.5)), 25.0);  // upper left
      float streamer4 = pow(max(0.0, cos(angle + 2.8)), 18.0);  // lower right
      float streamer5 = pow(max(0.0, cos(angle)), 30.0);         // right
      float streamer6 = pow(max(0.0, cos(angle - PI)), 12.0);   // left (shorter)

      // Combine long streamers
      float longStreamers = streamer1 + streamer2 + streamer3 + streamer4 + streamer5 + streamer6;

      // Background: finer, shorter streamers everywhere
      float fineStreamers = 0.0;
      for (int i = 0; i < 8; i++) {
        float a = float(i) * PI * 0.25 + noise1D(float(i) * 3.7) * 0.5;
        fineStreamers += pow(max(0.0, cos(angle - a)), 8.0) * 0.15;
      }

      // Combine: long streamers extend further, fine streamers stay close to limb
      float streamerPattern = longStreamers + fineStreamers;

      // Streamer falloff: long streamers extend much further than base glow
      float streamerRadial = 1.0 - smoothstep(0.0, coronaWidth * 2.5, limbDist);
      streamerRadial = pow(streamerRadial, 2.0);

      // Fine streamers stay closer to limb
      float fineRadial = 1.0 - smoothstep(0.0, coronaWidth * 1.2, limbDist);
      float totalStreamers = longStreamers * streamerRadial + fineStreamers * fineRadial;

      // --- Bright inner ring at the limb (chromosphere transition) ---
      float innerRing = exp(-pow((normalizedDist - 1.0) * 15.0, 2.0));

      // --- Slow shimmer / animation ---
      float shimmer = noise(vec2(angle * 3.0 + uTime * 0.1, uTime * 0.05));
      shimmer = shimmer * 0.15 + 0.85;

      // --- Equatorial enhancement (real corona is brighter at equator) ---
      float equator = 1.0 - smoothstep(0.0, 0.6, abs(vViewPos.z));

      // --- Combine ---
      float glow = radialFade * 0.4 * shimmer;
      float streamers = totalStreamers * 0.6;
      float ring = innerRing * 0.8;

      float intensity = glow + streamers + ring * 0.5;
      intensity *= (0.7 + equator * 0.3); // Brighter at equator

      // --- Colors ---
      vec3 whiteColor = vec3(1.0, 0.98, 0.9);
      vec3 yellowColor = vec3(1.0, 0.85, 0.5);
      vec3 orangeColor = vec3(1.0, 0.5, 0.1);

      // Inner: white, middle: yellow, outer: orange
      vec3 color = mix(whiteColor, yellowColor, smoothstep(1.0, 1.1, normalizedDist));
      color = mix(color, orangeColor, smoothstep(1.1, 1.2, normalizedDist));

      // Streamers are slightly yellower
      color = mix(color, yellowColor, totalStreamers * 0.3);

      gl_FragColor = vec4(color * intensity, intensity * 0.9);
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
