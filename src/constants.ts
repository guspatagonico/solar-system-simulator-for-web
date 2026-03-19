import { CelestialBodyData } from './types';

export const SOLAR_SYSTEM_DATA: CelestialBodyData[] = [
  {
    id: 'sun',
    name: 'Sun',
    type: 'star',
    radius: 696340,
    distanceFromParent: 0,
    orbitalPeriod: 0,
    rotationPeriod: 609.6,
    color: '#ffcc33',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg', // Fallback, will use shader
    description: 'The Sun is the star at the center of the Solar System. It is a nearly perfect sphere of hot plasma, heated to incandescence by nuclear fusion reactions in its core.',
  },
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'planet',
    radius: 2439.7,
    distanceFromParent: 57.9,
    orbitalPeriod: 88,
    rotationPeriod: 1407.6,
    eccentricity: 0.205,
    color: '#A5A5A5',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mercury.jpg',
    description: 'Mercury is the smallest planet in the Solar System and the closest to the Sun. Its orbit around the Sun takes 87.97 Earth days, the shortest of all the Sun\'s planets.',
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'planet',
    radius: 6051.8,
    distanceFromParent: 108.2,
    orbitalPeriod: 224.7,
    rotationPeriod: -5832.5, // Retrograde
    eccentricity: 0.007,
    color: '#E3BB76',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/venus_surface.jpg',
    description: 'Venus is the second planet from the Sun. It is sometimes called Earth\'s "sister" or "twin" planet as it is almost as large and has a similar composition.',
    atmosphere: {
      color: '#E3BB76',
      opacity: 0.8,
      cloudsUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/venus_atmosphere.jpg',
    }
  },
  {
    id: 'earth',
    name: 'Earth',
    type: 'planet',
    radius: 6371,
    distanceFromParent: 149.6,
    orbitalPeriod: 365.25,
    rotationPeriod: 23.9,
    eccentricity: 0.017,
    color: '#2233FF',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
    description: 'Earth is the third planet from the Sun and the only astronomical object known to harbor life. About 71% of Earth\'s surface is covered with water.',
    atmosphere: {
      color: '#4488FF',
      opacity: 0.5,
      cloudsUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_2048.jpg',
    },
    moons: [
      {
        id: 'moon',
        name: 'Moon',
        type: 'moon',
        radius: 1737.4,
        distanceFromParent: 30, // Adjusted for visibility
        orbitalPeriod: 27.3,
        rotationPeriod: 655.7,
        eccentricity: 0.055,
        color: '#CCCCCC',
        textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg',
        description: 'The Moon is Earth\'s only natural satellite. It is the fifth-largest satellite in the Solar System and the largest and most massive relative to its parent planet.',
      }
    ]
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'planet',
    radius: 3389.5,
    distanceFromParent: 227.9,
    orbitalPeriod: 687,
    rotationPeriod: 24.6,
    eccentricity: 0.093,
    color: '#E27B58',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mars.jpg',
    description: 'Mars is the fourth planet from the Sun and the second-smallest planet in the Solar System. It is often referred to as the "Red Planet".',
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'planet',
    radius: 69911,
    distanceFromParent: 778.6,
    orbitalPeriod: 4333,
    rotationPeriod: 9.9,
    eccentricity: 0.048,
    color: '#D39C7E',
    textureUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Jupiter_and_its_shades.jpg/1024px-Jupiter_and_its_shades.jpg',
    description: 'Jupiter is the fifth planet from the Sun and the largest in the Solar System. It is a gas giant with a mass more than two and a half times that of all the other planets combined.',
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'planet',
    radius: 58232,
    distanceFromParent: 1433.5,
    orbitalPeriod: 10759,
    rotationPeriod: 10.7,
    eccentricity: 0.056,
    color: '#C5AB6E',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/saturn.jpg',
    description: 'Saturn is the sixth planet from the Sun and the second-largest in the Solar System. It is a gas giant with an average radius of about nine times that of Earth.',
    rings: {
      innerRadius: 74500,
      outerRadius: 140220,
      textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/saturn_ring_alpha.png',
    },
    moons: [
      {
        id: 'titan',
        name: 'Titan',
        type: 'moon',
        radius: 2574.7,
        distanceFromParent: 150,
        orbitalPeriod: 15.9,
        rotationPeriod: 382.7,
        eccentricity: 0.028,
        color: '#E3BB76',
        textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/venus_surface.jpg', // Fallback
        description: 'Titan is the largest moon of Saturn and the second-largest natural satellite in the Solar System. It is the only moon known to have a dense atmosphere.',
      },
      {
        id: 'rhea',
        name: 'Rhea',
        type: 'moon',
        radius: 763.8,
        distanceFromParent: 80,
        orbitalPeriod: 4.5,
        rotationPeriod: 108.4,
        eccentricity: 0.001,
        color: '#CCCCCC',
        textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg',
        description: 'Rhea is the second-largest moon of Saturn and the ninth-largest moon in the Solar System.',
      }
    ]
  },
  {
    id: 'uranus',
    name: 'Uranus',
    type: 'planet',
    radius: 25362,
    distanceFromParent: 2872.5,
    orbitalPeriod: 30687,
    rotationPeriod: -17.2, // Retrograde
    eccentricity: 0.046,
    color: '#B5E3E3',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/uranus.jpg', // Fallback
    description: 'Uranus is the seventh planet from the Sun. Its name is a reference to the Greek god of the sky, Uranus. It has the third-largest planetary radius and fourth-largest planetary mass.',
  },
  {
    id: 'neptune',
    name: 'Neptune',
    type: 'planet',
    radius: 24622,
    distanceFromParent: 4495.1,
    orbitalPeriod: 60190,
    rotationPeriod: 16.1,
    eccentricity: 0.011,
    color: '#4B70DD',
    textureUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/neptune.jpg', // Fallback
    description: 'Neptune is the eighth and farthest-known solar planet from the Sun. In the Solar System, it is the fourth-largest planet by diameter, the third-most-massive planet.',
  }
];

// Scale factors for visualization
export const SCALE_FACTORS = {
  PLANET_SIZE: 0.00001, // 1km = 0.00001 units
  DISTANCE: 1.0, // 1 million km = 1.0 units
  TIME: 0.01, // 1 Earth day = 0.01 simulation units
  VISUAL_ENHANCEMENT: 100, // Multiplier for planet sizes to make them visible
};
