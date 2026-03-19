import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  texture: THREE.Texture;
  color: string;
  id: string;
}

const GasGiantMaterial: React.FC<Props> = ({ texture, color, id }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTexture: { value: texture },
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uIsJupiter: { value: id === 'jupiter' ? 1.0 : 0.0 },
  }), [texture, color, id]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `;

  const fragmentShader = `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uIsJupiter;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    // Simple hash-based noise for turbulence
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
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // Base texture with some horizontal movement for cloud bands
      float bandSpeed = 0.02;
      vec2 movingUv = vUv;
      
      // Different bands move at different speeds
      float bandIndex = floor(vUv.y * 12.0);
      float bandOffset = uTime * bandSpeed * (sin(bandIndex * 1.5) * 0.5 + 0.5);
      
      // Add turbulence to the UVs
      float turbulence = 0.0;
      if (uIsJupiter > 0.5) {
        // More turbulence for Jupiter
        turbulence = fbm(vUv * 15.0 + uTime * 0.1) * 0.02;
        // Add "wavy" bands
        movingUv.y += sin(vUv.x * 10.0 + uTime * 0.5) * 0.005;
      } else {
        turbulence = fbm(vUv * 10.0 + uTime * 0.05) * 0.01;
      }
      
      movingUv.x += bandOffset + turbulence;
      movingUv.y += turbulence;

      vec4 texColor = texture2D(uTexture, movingUv);
      
      // Mix with base color
      vec3 finalColor = mix(texColor.rgb, uColor, 0.15);

      // Add subtle color variations based on noise
      if (uIsJupiter > 0.5) {
        float colorNoise = fbm(vUv * 20.0 - uTime * 0.05);
        finalColor = mix(finalColor, finalColor * (0.8 + colorNoise * 0.4), 0.3);
        
        // Enhance band contrast
        float bandPattern = sin(vUv.y * 40.0 + fbm(vUv * 5.0) * 5.0);
        finalColor = mix(finalColor, finalColor * (0.9 + bandPattern * 0.1), 0.2);
      }

      // Add Great Red Spot for Jupiter
      if (uIsJupiter > 0.5) {
        // Jupiter's GRS is at ~22° S. In UV (0=South, 1=North), that's roughly 0.38
        vec2 spotPos = vec2(0.7, 0.38); 
        
        // The spot drifts slightly relative to the base rotation
        spotPos.x = mod(spotPos.x - uTime * 0.005, 1.0);
        
        // Elliptical shape for the spot (GRS is roughly twice as wide as it is tall)
        vec2 diff = vUv - spotPos;
        // Handle wrapping for x
        if (diff.x > 0.5) diff.x -= 1.0;
        if (diff.x < -0.5) diff.x += 1.0;
        
        // Scale coordinates for the elliptical shape
        vec2 ellipseCoords = diff * vec2(1.0, 2.2);
        float ellipseDist = length(ellipseCoords);
        
        if (ellipseDist < 0.06) {
          // Internal swirling vortex effect
          float angle = atan(ellipseCoords.y, ellipseCoords.x);
          // Swirl intensity increases towards the center
          float swirl = sin(angle * 2.0 + ellipseDist * 40.0 - uTime * 1.5) * 0.5 + 0.5;
          
          // Base spot intensity with soft edges
          float spotIntensity = smoothstep(0.06, 0.03, ellipseDist);
          
          // Multi-tone coloring for the storm
          vec3 coreColor = vec3(0.4, 0.02, 0.02);    // Deep dark red core
          vec3 midColor = vec3(0.7, 0.15, 0.05);    // Classic brick red
          vec3 edgeColor = vec3(0.9, 0.4, 0.2);     // Brighter orange-ish edge
          
          // Mix colors based on swirl and distance from center
          vec3 spotColor = mix(edgeColor, midColor, smoothstep(0.06, 0.02, ellipseDist));
          spotColor = mix(spotColor, coreColor, swirl * 0.4);
          
          // Add a subtle dark rim to make it "pop" from the bands
          float rim = smoothstep(0.055, 0.06, ellipseDist);
          spotColor = mix(spotColor, vec3(0.05, 0.02, 0.01), rim * 0.7);
          
          // Add some "turbulence" highlight
          float highlight = pow(1.0 - ellipseDist / 0.06, 2.0) * swirl * 0.2;
          spotColor += vec3(1.0, 0.8, 0.5) * highlight;
          
          finalColor = mix(finalColor, spotColor, spotIntensity);
        }
      }

      // Lighting relative to Sun at (0,0,0)
      vec3 lightDir = normalize(-vWorldPosition); // Vector from planet surface to Sun
      
      // Transform normal to world space for lighting calculation
      // Since we're using vNormal (view space), we need a consistent space.
      // Let's use world space for the light direction and transform normal to world space.
      // Actually, let's just use the dot product in a way that makes sense.
      
      // Simple diffuse
      float diffuse = max(dot(vNormal, normalize(vec3(0.0, 0.0, 1.0))), 0.0); // Approximation
      
      // Better: Use world position to determine light side
      vec3 worldNormal = normalize(vWorldPosition); // This is roughly the normal for a sphere at origin
      // But the planet is NOT at origin. It's at vWorldPosition.
      // The normal of a sphere at vWorldPosition is (pos - center).
      // If we assume the planet mesh is centered at its local origin:
      // We can pass the modelMatrix's position or just use the varying.
      
      // Let's stick to a simpler "ambient + diffuse" that ensures visibility
      float intensity = max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.25); // Increased minimum ambient to 0.25
      
      // Add a rim light effect to help visibility in the dark
      float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
      rim = pow(rim, 3.0) * 0.3;
      
      gl_FragColor = vec4(finalColor * intensity + (uColor * rim), 1.0);
    }
  `;

  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
    />
  );
};

export default GasGiantMaterial;
