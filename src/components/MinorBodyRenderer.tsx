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
  return (
    <>
      <AsteroidBelt state={state} />
      {MINOR_BODIES_DATA.map((body) =>
        body.type === 'comet' ? (
          <Comet key={body.id} data={body} state={state} onSelect={onSelect} />
        ) : (
          <CelestialBody key={body.id} data={body} state={state} onSelect={onSelect} />
        )
      )}
    </>
  );
};

export default MinorBodyRenderer;
