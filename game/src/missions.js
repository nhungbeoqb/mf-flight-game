// Mission flow: rings in order, parcel pickups, drop and rescue targets,
// landing verdicts, lives, stars and the end-of-mission tally.
import { CONFIG, ISLANDS } from './config.js';
import { planeOverIsland, planeOnRunway, landingVerdict } from './physics.js';

const ISLANDS_BY_ID = Object.fromEntries(ISLANDS.map((i) => [i.id, i]));
function worldIslandsAt(x, y) {
  return ISLANDS.find((isl) => Math.hypot(x - isl.x, y - isl.y) < isl.r * 0.92) || null;
}

export function createMissionState(mission, plane) {
  return {
    mission, ringIndex: 0, ringsDone: 0,
    parcelsGot: 0, parcelsLeft: mission.parcels.map((p) => ({ ...p, taken: false })),
    ringsLeft: mission.rings.map((r) => ({ ...r, done: false })),
    time: 0, lives: CONFIG.livesPerMission, phase: 'fly', // fly | done | failed
    message: '', messageUntil: 0, fragileBroken: false, rescued: false,
    dropped: false, landedAt: null, endReason: '', stars: 0, hardBankTime: 0,
  };
}

export function say(state, text, dur) {
  state.message = text; state.messageUntil = state.time + (dur || 3.5);
}

export function updateMission(state, plane, world, dt, sounds) {
  if (state.phase !== 'fly') return;
  state.time += dt;
  const m = state.mission;
  // Fragile cargo: a hard bank breaks the eggs.
  if (m.fragile && Math.abs(plane.bank) > 25) {
    state.hardBankTime += dt;
    if (state.hardBankTime > 1.2 && !state.fragileBroken) {
      state.fragileBroken = true;
      plane.damage += 20;
      say(state, 'Too hard a bank — the eggs are rattling! Ease off!', 4);
      sounds.warnBeep();
    }
  } else state.hardBankTime = Math.max(0, state.hardBankTime - dt * 2);
  // Next ring in order.
  const ring = state.ringsLeft[state.ringIndex];
  if (ring && !ring.done) {
    const d = Math.hypot(plane.x - ring.x, plane.y - ring.y);
    const altOk = Math.abs(plane.alt - ring.alt) < 150;
    if (d < CONFIG.ringRadius && altOk) {
      ring.done = true; state.ringsDone += 1; state.ringIndex += 1;
      sounds.ringChime();
      say(state, state.ringIndex >= state.ringsLeft.length ? 'All rings flown — head for the landing!' : `Ring ${state.ringsDone} of ${state.ringsLeft.length} — nice flying.`, 3);
    }
  }
  // Parcels: fly low over them to scoop them up.
  for (const pc of state.parcelsLeft) {
    if (pc.taken) continue;
    if (Math.hypot(plane.x - pc.x, plane.y - pc.y) < CONFIG.parcelRadius + 26 && plane.alt < 260) {
      pc.taken = true; state.parcelsGot += 1;
      sounds.parcelPop();
      say(state, `Parcel scooped — ${state.parcelsGot} in the bag.`, 2.5);
    }
  }
  // Drop target: low and slow over the cay.
  if (m.target.type === 'drop' && !state.dropped && state.ringIndex >= state.ringsLeft.length) {
    const isl = worldIslands(m.target.island);
    if (planeOverIsland(plane, isl) && plane.alt < 220 && plane.speed < 150) {
      state.dropped = true;
      sounds.fanfare();
      say(state, 'Parcel away — Auntie Brine has her eggs!', 4);
      finishMission(state, plane, 'delivered');
    }
  }
  // Rescue: land on the water by Seal Tooth, then fly home to Gull Rock.
  if (m.target.type === 'rescue') {
    const seal = worldIslands('seal');
    if (!state.rescued && plane.alt <= 2 && plane.speed < 60 && !planeOverIsland(plane, seal)
      && Math.hypot(plane.x - seal.x, plane.y - seal.y) < seal.r + 320) {
      state.rescued = true; plane.landed = false;
      sounds.fanfare();
      say(state, 'Keeper Odo is aboard — fly him home to Gull Rock, and mind the fuel!', 5);
    }
    if (state.rescued && state.ringIndex >= state.ringsLeft.length) {
      const home = worldIslands(m.target.home);
      const v = landingVerdict(plane, home);
      if (v && v.ok) finishMission(state, plane, 'rescued');
      else if (v) say(state, v.why, 2);
    }
  }
  // Land targets.
  if (m.target.type === 'land' && state.ringIndex >= state.ringsLeft.length) {
    const isl = worldIslands(m.target.island);
    if (plane.alt <= 2 && plane.speed < 160) {
      const v = landingVerdict(plane, isl);
      if (v && v.ok) finishMission(state, plane, 'landed');
      else if (v) say(state, v.why, 2);
    }
  }
  // Fuel out over open water: forced ditching.
  if (plane.fuel <= 0 && plane.alt <= 0 && !plane.landed) {
    loseLife(state, plane, 'Out of fuel — ditched in the Sound.', sounds);
  }
  // Timer.
  if (state.time > m.timeLimit) {
    state.phase = 'failed'; state.endReason = 'The tide turned — out of time.';
  }
  // Crash into an island while low.
  const isl = worldIslandsAt(plane.x, plane.y);
  if (isl && plane.alt < 60 && !plane.landed && !plane.crashed) {
    plane.crashed = true;
    loseLife(state, plane, `Clipped ${isl.name} — hull damage.`, sounds);
  }
}

function worldIslands(id) {
  return ISLANDS_BY_ID[id];
}

export function loseLife(state, plane, reason, sounds) {
  state.lives -= 1;
  plane.damage = Math.min(100, plane.damage + 30);
  sounds.thump();
  if (state.lives <= 0) {
    state.phase = 'failed'; state.endReason = reason;
  } else {
    say(state, `${reason} ${state.lives} ${state.lives === 1 ? 'life' : 'lives'} left — back in the air!`, 4);
    resetPlaneAfterCrash(state, plane);
  }
}

function resetPlaneAfterCrash(state, plane) {
  const home = ISLANDS_BY_ID[state.mission.target.home || 'gull'] || ISLANDS_BY_ID.gull;
  plane.x = home.x; plane.y = home.y + home.r + 140; plane.alt = 260; plane.speed = 120;
  plane.throttle = 55; plane.heading = -Math.PI / 2; plane.bank = 0;
  plane.crashed = false; plane.landed = false; plane.fuel = Math.max(plane.fuel, 45);
}

export function finishMission(state, plane, how) {
  state.phase = 'done';
  state.endReason = how;
  let stars = 1;
  if (state.time <= state.mission.parTime) stars += 1;
  if (plane.fuel >= state.mission.parFuel && plane.damage < 25) stars += 1;
  if (state.fragileBroken) stars = Math.min(stars, 2);
  state.stars = Math.max(1, Math.min(3, stars));
  state.landedAt = how;
}

export function missionObjectiveText(state) {
  const m = state.mission;
  if (state.phase === 'done') return 'Mission complete!';
  if (state.phase === 'failed') return 'Mission failed.';
  if (state.ringIndex < state.ringsLeft.length) return `Ring ${state.ringIndex + 1} of ${state.ringsLeft.length} — follow the glow`;
  if (m.target.type === 'land') return `Land on ${ISLANDS_BY_ID[m.target.island].name}`;
  if (m.target.type === 'drop') return 'Drop the parcel low and slow over Heron Cay';
  if (m.target.type === 'rescue') return state.rescued ? 'Fly Keeper Odo home to Gull Rock' : 'Land on the water by Seal Tooth';
  return '';
}
