import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { SimulationState, CelestialBodyData } from './types';
import { SOLAR_SYSTEM_DATA, SCALE_FACTORS } from './constants';
import CelestialBody from './components/CelestialBody';
import Sun from './components/Sun';
import HUD from './components/HUD';
import Starfield from './components/Starfield';
import CameraManager from './components/CameraManager';

const App: React.FC = () => {
  const [state, setState] = useState<SimulationState>({
    timeScale: 0.1,
    visualEnhancement: 200,
    showOrbits: true,
    focusedBodyId: 'sun',
    isPaused: false,
    ambientIntensity: 0.5,
  });

  const focusedBody = useMemo(() => 
    SOLAR_SYSTEM_DATA.find(b => b.id === state.focusedBodyId) || null
  , [state.focusedBodyId]);

  const handleJumpTo = (id: string) => {
    setState(s => ({ ...s, focusedBodyId: id }));
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden select-none">
      <Canvas shadows gl={{ antialias: true, logarithmicDepthBuffer: true }}>
        <PerspectiveCamera makeDefault position={[0, 400, 800]} fov={45} near={0.1} far={100000} />
        
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          panSpeed={0.5}
          makeDefault
        />

        <Starfield />
        
        <group>
          {SOLAR_SYSTEM_DATA.map((body) => {
            if (body.type === 'star') {
              return (
                <group key={body.id} name={body.id}>
                  <Sun radius={body.radius} state={state} />
                </group>
              );
            }
            return (
              <CelestialBody
                key={body.id}
                data={body}
                state={state}
                onSelect={handleJumpTo}
              />
            );
          })}
        </group>

        {/* Camera Manager for smooth transitions */}
        <CameraManager focusedBodyId={state.focusedBodyId} visualEnhancement={state.visualEnhancement} />
      </Canvas>

      <HUD 
        state={state} 
        setState={setState} 
        focusedBody={focusedBody} 
        onJumpTo={handleJumpTo} 
      />

      {/* Global styles for scrollbar and UI */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        input[type='range'] {
          -webkit-appearance: none;
          background: rgba(255, 255, 255, 0.1);
          height: 4px;
          border-radius: 2px;
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
      `}} />
    </div>
  );
};

export default App;
