// Progress saved in localStorage, with an in-memory fallback when the
// browser refuses storage (private mode, hosted sandbox, file:// quirks).
const KEY = 'tide-post-save-v1';
const memory = {};

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through to memory */ }
  return memory.data || null;
}

export function storeSave(save) {
  memory.data = save;
  try { window.localStorage.setItem(KEY, JSON.stringify(save)); } catch { /* memory only */ }
}

export function freshSave() {
  return { unlocked: 1, stars: {}, best: {}, parcels: 0, missionsFlown: 0 };
}

export function recordMissionResult(save, missionId, stars, timeSec, fuelLeft, parcelsGot) {
  const prev = save.stars[missionId] || 0;
  save.stars[missionId] = Math.max(prev, stars);
  const best = save.best[missionId];
  if (!best || timeSec < best.time) save.best[missionId] = { time: timeSec, fuel: fuelLeft };
  save.parcels += parcelsGot;
  save.missionsFlown += 1;
  const idx = MISSION_ORDER.indexOf(missionId);
  if (idx >= 0 && idx + 1 < MISSION_ORDER.length) save.unlocked = Math.max(save.unlocked, idx + 2);
  return save;
}

export const MISSION_ORDER = ['first-light', 'fragile-eggs', 'night-mail', 'the-rescue'];
