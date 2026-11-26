// Screenshot staging: ?shot=<name>&seed=<n> puts the game into a fixed,
// good-looking state so the maker's screenshots are real renders of the
// game's own code — a paused frame of a live flight, never a mock-up.
// The autopilot in main.js flies the plane toward the next ring.
import { ISLANDS } from './config.js';

export function parseShot() {
  const q = new URLSearchParams(window.location.search);
  return { shot: q.get('shot') || '', seed: q.get('seed') || '20261126' };
}

const BY_ID = Object.fromEntries(ISLANDS.map((i) => [i.id, i]));

// Place the plane mid-flight on a leg that reads well: rings ahead,
// an island and its lighthouse in frame, instruments lit.
export function stageShot(game, shot) {
  const { plane, missionState } = game;
  const put = (x, y, alt, heading, speed, throttle) => {
    plane.x = x; plane.y = y; plane.alt = alt; plane.heading = heading;
    plane.speed = speed; plane.throttle = throttle; plane.bank = -8; plane.landed = false;
  };
  if (shot === 'flight') {
    // Cover: dawn, banking through a ring with Gull Rock and its lighthouse behind.
    put(1380, 2250, 330, -0.9, 210, 72);
    missionState.ringIndex = 0;
    missionState.ringsDone = 0;
  } else if (shot === 'rings') {
    put(2950, 2050, 380, -0.4, 230, 78);
    missionState.ringIndex = 1;
    missionState.ringsLeft[0].done = true; missionState.ringsDone = 1;
    missionState.parcelsLeft[0].taken = true; missionState.parcelsGot = 1;
  } else if (shot === 'night') {
    // Night mail: the lit runway at Widow's Light ahead, last ring behind.
    put(7300, 2150, 260, -0.55, 180, 60);
    missionState.ringIndex = 3;
    missionState.ringsLeft.forEach((r, i) => { if (i < 3) { r.done = true; } });
    missionState.ringsDone = 3;
    plane.bank = 6;
  } else if (shot === 'rescue') {
    // The rescue: low over the water by Seal Tooth, Keeper Odo's island in frame.
    put(5450, 3050, 120, 0.35, 130, 48);
    missionState.ringIndex = 2;
    missionState.ringsLeft.forEach((r, i) => { if (i < 2) { r.done = true; } });
    missionState.ringsDone = 2;
    missionState.rescued = true;
  }
  return shot !== '';
}
