import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CelestialBodyData, SimulationState } from '../types';
import { SOLAR_SYSTEM_DATA } from '../constants';
import { 
  Info, 
  Settings, 
  Play, 
  Pause, 
  Eye, 
  EyeOff, 
  FastForward, 
  Rewind, 
  ChevronRight, 
  Search,
  Maximize,
  Minimize,
  Type
} from 'lucide-react';

interface Props {
  state: SimulationState;
  setState: React.Dispatch<React.SetStateAction<SimulationState>>;
  focusedBody: CelestialBodyData | null;
  onJumpTo: (id: string) => void;
}

const HUD: React.FC<Props> = ({ state, setState, focusedBody, onJumpTo }) => {
  const [showSettings, setShowSettings] = React.useState(false);
  const [showPlanets, setShowPlanets] = React.useState(false);

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col justify-between p-6 z-50">
      {/* Top Bar: Title & Quick Actions */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            SOLAR SYSTEM <span className="text-xs font-mono text-white/40">V1.0</span>
          </h1>
          <p className="text-xs text-white/60 font-mono mt-1 uppercase tracking-widest">Educational Simulation</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setShowPlanets(!showPlanets)}
            className="p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
          >
            <Search size={20} />
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Center: Planet Info */}
      <AnimatePresence>
        {focusedBody && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="absolute left-6 top-32 w-80 pointer-events-auto"
          >
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">{focusedBody.name}</h2>
                  <span className="text-[10px] font-mono text-blue-400 uppercase tracking-[0.3em]">{focusedBody.type}</span>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center overflow-hidden">
                  <div 
                    className="w-full h-full" 
                    style={{ backgroundColor: focusedBody.color, opacity: 0.8 }} 
                  />
                </div>
              </div>

              <p className="text-sm text-white/80 leading-relaxed mb-6 font-serif italic">
                {focusedBody.description}
              </p>

              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                <div className="space-y-1">
                  <p className="text-[10px] text-white/40 uppercase font-mono">Radius</p>
                  <p className="text-sm text-white font-mono">{focusedBody.radius.toLocaleString()} km</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-white/40 uppercase font-mono">Orbital Period</p>
                  <p className="text-sm text-white font-mono">{focusedBody.orbitalPeriod} Days</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-white/40 uppercase font-mono">Rotation</p>
                  <p className="text-sm text-white font-mono">{Math.abs(focusedBody.rotationPeriod)} Hours</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-white/40 uppercase font-mono">Distance</p>
                  <p className="text-sm text-white font-mono">{focusedBody.distanceFromParent}M km</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom: Controls */}
      <div className="flex justify-center items-end pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-2 rounded-2xl flex items-center gap-4">
          <div className="flex items-center gap-1 px-2">
            <button 
              onClick={() => setState(s => ({ ...s, timeScale: Math.max(1, s.timeScale / 10) }))}
              className="p-2 text-white/60 hover:text-white transition-colors"
            >
              <Rewind size={18} />
            </button>
            <button 
              onClick={() => setState(s => ({ ...s, isPaused: !s.isPaused }))}
              className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center hover:scale-105 transition-transform"
            >
              {state.isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
            </button>
            <button 
              onClick={() => setState(s => ({ ...s, timeScale: Math.min(1000000, s.timeScale * 10) }))}
              className="p-2 text-white/60 hover:text-white transition-colors"
            >
              <FastForward size={18} />
            </button>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex items-center gap-4 px-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] font-mono text-white/40 uppercase">Time Speed</span>
              <span className="text-xs text-white font-mono">{state.timeScale.toLocaleString()}x</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] font-mono text-white/40 uppercase">Scale Distortion</span>
              <span className="text-xs text-white font-mono">{state.visualEnhancement}x</span>
            </div>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <button 
            onClick={() => setState(s => ({ ...s, showOrbits: !s.showOrbits }))}
            className={`p-3 rounded-xl transition-colors ${state.showOrbits ? 'bg-blue-500/20 text-blue-400' : 'text-white/60 hover:text-white'}`}
            title="Toggle Orbits"
          >
            {state.showOrbits ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>

          <button 
            onClick={() => setState(s => ({ ...s, showLabels: !s.showLabels }))}
            className={`p-3 rounded-xl transition-colors ${state.showLabels ? 'bg-blue-500/20 text-blue-400' : 'text-white/60 hover:text-white'}`}
            title="Toggle Labels"
          >
            <Type size={20} />
          </button>
        </div>
      </div>

      {/* Side Panel: Planet List */}
      <AnimatePresence>
        {showPlanets && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="absolute right-6 top-32 w-64 pointer-events-auto"
          >
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-3xl overflow-hidden">
              <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-4 px-2">Navigation</h3>
              <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {SOLAR_SYSTEM_DATA.map(planet => (
                  <button
                    key={planet.id}
                    onClick={() => onJumpTo(planet.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${
                      state.focusedBodyId === planet.id ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: planet.color }} />
                      <span className="text-sm font-medium">{planet.name}</span>
                    </div>
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-6 top-32 w-64 pointer-events-auto"
          >
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
              <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-6">Simulation Settings</h3>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/80">Scale Distortion</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setState(s => ({ ...s, visualEnhancement: 1 }))}
                        className="text-[8px] font-mono px-2 py-1 bg-white/10 rounded-md hover:bg-white/20 text-white/60 hover:text-white transition-all"
                      >
                        REALISTIC
                      </button>
                      <span className="text-[10px] font-mono text-blue-400">{state.visualEnhancement}x</span>
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="500" 
                    value={state.visualEnhancement}
                    onChange={(e) => setState(s => ({ ...s, visualEnhancement: parseInt(e.target.value) }))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/80">Time Scale</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setState(s => ({ ...s, timeScale: 1 }))}
                        className="text-[8px] font-mono px-2 py-1 bg-white/10 rounded-md hover:bg-white/20 text-white/60 hover:text-white transition-all"
                      >
                        REALTIME
                      </button>
                      <span className="text-[10px] font-mono text-blue-400">{state.timeScale.toLocaleString()}x</span>
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="6" 
                    step="0.1"
                    value={Math.log10(state.timeScale)}
                    onChange={(e) => setState(s => ({ ...s, timeScale: Math.pow(10, parseFloat(e.target.value)) }))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/80">Sunlight Intensity</span>
                    <span className="text-[10px] font-mono text-blue-400">{(state.ambientIntensity * 100).toFixed(0)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="1.0" 
                    max="4.0" 
                    step="0.05"
                    value={state.ambientIntensity}
                    onChange={(e) => setState(s => ({ ...s, ambientIntensity: parseFloat(e.target.value) }))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-xs text-white/80">Show Orbits</span>
                  <button 
                    onClick={() => setState(s => ({ ...s, showOrbits: !s.showOrbits }))}
                    className={`w-10 h-5 rounded-full transition-colors relative ${state.showOrbits ? 'bg-blue-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${state.showOrbits ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/80">Show Labels</span>
                  <button 
                    onClick={() => setState(s => ({ ...s, showLabels: !s.showLabels }))}
                    className={`w-10 h-5 rounded-full transition-colors relative ${state.showLabels ? 'bg-blue-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${state.showLabels ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HUD;
