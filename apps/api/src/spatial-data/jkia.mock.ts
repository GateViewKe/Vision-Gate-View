// spatial-data/jkia.mock.ts

import { Airport, POI } from '@vision/shared';

export const jkiaAirport: Airport = {
  id: 'jkia',
  name: 'Jomo Kenyatta International Airport',
  location: { lat: -1.3192, lng: 36.9278 },
  floors: 2,
  pois: [
    {
      id: 'security_main',
      name: 'Main Security',
      type: 'security',
      position: [0, 0, 0],
      floor: 1,
    },
    {
      id: 'gate_a1',
      name: 'Gate A1',
      type: 'gate',
      position: [20, 0, 5],
      floor: 1,
    },
    {
      id: 'toilet_1',
      name: 'Restroom 1',
      type: 'toilet',
      position: [10, 0, -5],
      floor: 1,
    },
    {
      id: 'lounge_1',
      name: 'Lounge',
      type: 'lounge',
      position: [-15, 0, 10],
      floor: 1,
    },
  ],
};

export const jkiaConnections = [
  { from: 'security_main', to: 'gate_a1' },
  { from: 'security_main', to: 'toilet_1' },
  { from: 'security_main', to: 'lounge_1' },
];