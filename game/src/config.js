// TIDE POST — dawn mail run by seaplane. All tuning and mission data lives here;
// nothing in this file is copied from any other game.
export const CONFIG = {
  worldWidth: 9000,
  worldHeight: 5200,
  seaLevel: 0,
  maxAltitude: 900,
  cruiseSpeed: 170,
  maxSpeed: 320,
  minSpeed: 55,
  stallSpeed: 62,
  fuelCapacity: 100,
  fuelBurnBase: 0.08,
  fuelBurnThrottle: 0.16,
  turnRateMax: 2.6,
  climbRateMax: 95,
  damageCrash: 100,
  damageHardLanding: 34,
  damageScrape: 18,
  livesPerMission: 3,
  ringRadius: 90,
  parcelRadius: 30,
  runwayHalfWidth: 46,
};

// The four islands of the Gull Sound, in the order the mail run visits them.
export const ISLANDS = [
  { id: 'gull', name: 'Gull Rock', x: 700, y: 2600, r: 620, lighthouse: true, dock: true, runway: { x: 700, y: 2600, angle: 0, length: 560 }, home: true },
  { id: 'heron', name: 'Heron Cay', x: 3300, y: 1500, r: 480, lighthouse: true, dock: false, runway: null, dropZone: true },
  { id: 'seal', name: 'Seal Tooth', x: 5900, y: 3300, r: 540, lighthouse: false, dock: true, runway: null, rescue: true },
  { id: 'widow', name: "Widow's Light", x: 8100, y: 1700, r: 660, lighthouse: true, dock: false, runway: { x: 8100, y: 1700, angle: 0.5, length: 620 }, night: true },
];

// Missions: different goals, different pressures. Stars are earned on time, fuel and hull.
export const MISSIONS = [
  {
    id: 'first-light', num: 1, name: 'First Light', island: 'gull',
    brief: 'Dawn mail run. Thread all five storm rings over the Sound, then set her down on the Gull Rock strip.',
    rings: [
      { x: 1500, y: 2300, alt: 320 }, { x: 2300, y: 1900, alt: 420 },
      { x: 3100, y: 2400, alt: 300 }, { x: 4300, y: 2100, alt: 460 },
      { x: 5400, y: 2600, alt: 340 },
    ],
    parcels: [{ x: 1900, y: 2700 }, { x: 3900, y: 1600 }, { x: 5000, y: 3000 }],
    fuelStart: 100, timeLimit: 300, fragile: false, night: false, rescue: false,
    target: { type: 'land', island: 'gull' },
    parTime: 150, parFuel: 55,
  },
  {
    id: 'fragile-eggs', num: 2, name: 'Fragile — Eggs for Auntie', island: 'heron',
    brief: 'A crate of eggs for Auntie Brine on Heron Cay. Bank gently — never past 25 degrees — and drop it low and slow over the cay.',
    rings: [
      { x: 1500, y: 2000, alt: 300 }, { x: 2400, y: 1500, alt: 360 },
      { x: 3000, y: 1900, alt: 280 },
    ],
    parcels: [{ x: 2100, y: 2400 }, { x: 2800, y: 1200 }],
    fuelStart: 100, timeLimit: 300, fragile: true, night: false, rescue: false,
    target: { type: 'drop', island: 'heron' },
    parTime: 130, parFuel: 60,
  },
  {
    id: 'night-mail', num: 3, name: 'Night Mail', island: 'widow',
    brief: 'The last post leaves after dark. Follow the lit rings to Widow’s Light and land on the runway before dawn breaks.',
    rings: [
      { x: 1600, y: 2400, alt: 380 }, { x: 3200, y: 2000, alt: 320 },
      { x: 5200, y: 2300, alt: 420 }, { x: 6900, y: 1900, alt: 300 },
    ],
    parcels: [{ x: 2600, y: 2700 }, { x: 6000, y: 1600 }],
    fuelStart: 100, timeLimit: 270, fragile: false, night: true, rescue: false,
    target: { type: 'land', island: 'widow' },
    parTime: 165, parFuel: 50,
  },
  {
    id: 'the-rescue', num: 4, name: 'The Rescue', island: 'seal',
    brief: 'Keeper Odo is stranded on Seal Tooth and the tide is coming in. Land on the water beside him, take him aboard, and bring him home to Gull Rock — fuel is tight.',
    rings: [
      { x: 2000, y: 2300, alt: 340 }, { x: 3800, y: 2800, alt: 400 },
      { x: 5200, y: 3100, alt: 300 },
    ],
    parcels: [{ x: 3000, y: 1800 }],
    fuelStart: 78, timeLimit: 330, fragile: false, night: false, rescue: true,
    target: { type: 'rescue', island: 'seal', home: 'gull' },
    parTime: 200, parFuel: 25,
  },
];

export const PILOT = { name: 'Wren Halloway', plane: 'Kittiwake', callsign: 'Tide Post Seven' };
export const DAWN = { skyTop: '#7ec8ee', skyMid: '#bfe6f7', skyLow: '#ffe9b8', sea: '#2e7fa8', seaDeep: '#1d5c80', sun: '#ffd66e' };
export const NIGHT = { skyTop: '#0d1834', skyMid: '#1d3054', skyLow: '#3a4a6e', sea: '#1b3a56', seaDeep: '#10273c', sun: '#f4ead2' };
