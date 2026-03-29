# Solar System Simulator

An interactive 3D solar system simulator built with React, Three.js, and TypeScript. Explore all eight planets, their moons, and the Sun with realistic orbital mechanics, custom shaders, and a responsive HUD.

## Features

- **Full Solar System** — Sun, all 8 planets, and key moons (Moon, Titan, Rhea)
- **Realistic Orbits** — Elliptical orbital paths with configurable eccentricity
- **Custom Shaders** — Gas giant turbulence with Jupiter's Great Red Spot, planetary rings with backscatter lighting, animated Sun surface
- **Atmosphere & Clouds** — Layered cloud meshes with independent rotation for Earth and Venus
- **Saturn & Uranus Rings** — Procedural ring shaders with dust streaks and radial bands
- **Interactive HUD** — Pause/play, time scale slider, orbit/label toggles, planet navigation
- **Smooth Camera Transitions** — Cubic ease-out camera movement between celestial bodies
- **Visual Scale Distortion** — Adjustable scale factor to make small bodies visible without losing orbital proportions

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI Framework | React 19 |
| 3D Engine | Three.js via @react-three/fiber + @react-three/drei |
| Styling | Tailwind CSS v4 |
| Animations | Motion (Framer Motion) |
| Language | TypeScript |
| Build Tool | Vite |
| Package Manager | pnpm |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
pnpm install
```

### Environment

Copy `.env.example` to `.env.local` and set your Gemini API key (optional — used for AI features):

```bash
cp .env.example .env.local
```

### Development

```bash
pnpm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
pnpm run build
pnpm run preview
```

## Usage

- **Click** a planet to focus on it and see its info panel
- **Drag** to orbit the camera around the focused body
- **Scroll** to zoom in/out
- Use the **bottom control bar** to pause, adjust time scale, toggle orbits and labels
- Open **Settings** (gear icon) for scale distortion and sunlight intensity
- Open **Navigation** (search icon) to jump to any celestial body

## Project Structure

```
src/
├── main.tsx                Entry point
├── App.tsx                 Root component, Canvas, state
├── types.ts                TypeScript interfaces
├── constants.ts            Solar system data & scale factors
├── index.css               Tailwind import
└── components/
    ├── CelestialBody.tsx   Planet/moon rendering & orbital mechanics
    ├── Sun.tsx             Sun with animated shader
    ├── HUD.tsx             UI overlay & controls
    ├── CameraManager.tsx   Smooth camera transitions
    ├── GasGiantMaterial.tsx  Custom shader for gas giants
    ├── RingMaterial.tsx      Custom shader for planetary rings
    └── Starfield.tsx       Background star field
```

## License

MIT
