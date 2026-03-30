import React from 'react';
import { MINOR_BODIES_DATA } from '../constants';
import { SimulationState } from '../types';
import CelestialBody from './CelestialBody';
import AsteroidBelt from './AsteroidBelt';
import Comet from './Comet';

interface Props {
  state: SimulationState;
  onSelect: (id: string) => void;
}

const MinorBodyRenderer: React.FC<Props> = ({ state, onSelect }) => {
  const dwarfPlanets = MINOR_BODIES_DATA.filter(b => b.type === 'dwarf-planet' && state.showDwarfPlanets);
  const kbos = MINOR_BODIES_DATA.filter(b => b.type === 'kbo' && state.showKBOs);
  const comets = MINOR_BODIES_DATA.filter(b => b.type === 'comet' && state.showComets);

  return (
    <>
      <AsteroidBelt state={state} />
      {dwarfPlanets.map((body) => (
        <CelestialBody key={body.id} data={body} state={state} onSelect={onSelect} />
      ))}
      {kbos.map((body) => (
        <CelestialBody key={body.id} data={body} state={state} onSelect={onSelect} />
      ))}
      {comets.map((body) => (
        <Comet key={body.id} data={body} state={state} onSelect={onSelect} />
      ))}
    </>
  );
};

export default MinorBodyRenderer;
