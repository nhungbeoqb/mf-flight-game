// The flight model. Throttle sets target speed; pitch (up/down) trades
// speed for altitude; banking (left/right) turns the heading and, past
// 25 degrees, is a hard bank — the thing the fragile-cargo mission forbids.
// Flying below stall speed with the nose up bleeds altitude fast.
import { CONFIG } from './config.js';

export function createPlane(island) {
  // Air start: already off the water at 260 ft, on her way to the first ring.
  return {
    x: island.x, y: island.y + island.r + 140, alt: 260, heading: -Math.PI / 2,
    bank: 0, pitch: 0, throttle: 55, speed: 140,
    fuel: 100, damage: 0, landed: false, crashed: false,
    verticalSpeed: 0, onWater: false,
  };
}

export function updatePlane(p, input, dt, mission) {
  if (p.crashed || p.landed) return;
  // Throttle: W / Up raises, S / Down lowers.
  if (input.down('w', 'arrowup')) p.throttle = Math.min(100, p.throttle + 55 * dt);
  if (input.down('s', 'arrowdown')) p.throttle = Math.max(0, p.throttle - 70 * dt);
  // Pitch: I / K climb and descend (arrow keys are throttle, so pitch is I/K too).
  let pitchInput = 0;
  if (input.down('i')) pitchInput += 1;
  if (input.down('k')) pitchInput -= 1;
  // Banking: A / Left and D / Right.
  let bankInput = 0;
  if (input.down('a', 'arrowleft')) bankInput -= 1;
  if (input.down('d', 'arrowright')) bankInput += 1;
  p.bank += (bankInput * 38 - p.bank) * Math.min(1, 6 * dt);
  const bankRad = (p.bank * Math.PI) / 180;
  p.heading += Math.sin(bankRad) * CONFIG.turnRateMax * dt * (0.35 + (p.speed / CONFIG.maxSpeed) * 0.65);
  // Speed chases the throttle; climbing costs speed, descending gains it.
  const targetSpeed = CONFIG.minSpeed + (p.throttle / 100) * (CONFIG.maxSpeed - CONFIG.minSpeed);
  const climbCost = Math.max(0, pitchInput) * 26;
  p.speed += ((targetSpeed - climbCost) - p.speed) * Math.min(1, 0.9 * dt);
  if (p.speed < 0) p.speed = 0;
  // Altitude: pitch climbs, stall sinks.
  const climb = pitchInput * CONFIG.climbRateMax * (p.speed / CONFIG.cruiseSpeed);
  const stallSink = p.speed < CONFIG.stallSpeed ? (CONFIG.stallSpeed - p.speed) * 1.6 : 0;
  p.verticalSpeed = climb - stallSink;
  p.alt += p.verticalSpeed * dt;
  if (p.alt < 0) p.alt = 0;
  if (p.alt > CONFIG.maxAltitude) p.alt = CONFIG.maxAltitude;
  // Move over the water.
  p.x += Math.cos(p.heading) * p.speed * dt;
  p.y += Math.sin(p.heading) * p.speed * dt;
  p.x = Math.max(60, Math.min(CONFIG.worldWidth - 60, p.x));
  p.y = Math.max(60, Math.min(CONFIG.worldHeight - 60, p.y));
  // Fuel: throttle burns it; idling sips.
  const burn = (CONFIG.fuelBurnBase + (p.throttle / 100) * CONFIG.fuelBurnThrottle) * dt;
  p.fuel = Math.max(0, p.fuel - burn);
  if (p.fuel <= 0 && p.throttle > 0) p.throttle = Math.max(0, p.throttle - 40 * dt);
}

export function planeOverIsland(p, island) {
  const dx = p.x - island.x, dy = p.y - island.y;
  return Math.hypot(dx, dy) < island.r * 0.92;
}

export function planeOnRunway(p, island) {
  if (!island.runway) return false;
  const dx = p.x - island.runway.x, dy = p.y - island.runway.y;
  const ca = Math.cos(-island.runway.angle), sa = Math.sin(-island.runway.angle);
  const lx = dx * ca - dy * sa, ly = dx * sa + dy * ca;
  return Math.abs(lx) < island.runway.length / 2 && Math.abs(ly) < CONFIG.runwayHalfWidth;
}

// Landing reads like a landing: slow, level, gentle descent, lined up
// with the strip — or on open water beside a dock, slow and level.
export function landingVerdict(p, island) {
  const onStrip = planeOnRunway(p, island);
  const onWaterDock = island.dock && !planeOverIsland(p, island) && p.alt <= 2;
  if (!onStrip && !onWaterDock) return null;
  if (p.speed > 95) return { ok: false, why: 'Too fast to set down — under 95 knots.' };
  if (Math.abs(p.bank) > 12) return { ok: false, why: 'Wings not level — bank under 12°.' };
  if (p.verticalSpeed < -70) return { ok: false, why: 'Too steep a descent — flare gently.' };
  if (onStrip) {
    const stripAngle = island.runway.angle;
    let diff = Math.abs(((p.heading - stripAngle) % Math.PI + Math.PI * 3) % (Math.PI * 2) - Math.PI);
    const aligned = diff < 0.5 || diff > Math.PI - 0.5;
    if (!aligned) return { ok: false, why: 'Not lined up with the strip.' };
  }
  return { ok: true, why: onStrip ? 'Wheels on the strip — beautiful.' : 'Floats on the water — tied up safe.' };
}

export function headingDegrees(p) {
  let d = ((p.heading * 180) / Math.PI + 360) % 360;
  return d;
}

export function compassPoint(deg) {
  const pts = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return pts[Math.round(deg / 22.5) % 16];
}
