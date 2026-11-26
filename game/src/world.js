// The Gull Sound: islands, lighthouses, buoys, clouds and drifting gulls.
// Terrain is placed from the config plus a seeded scatter, so the same
// seed draws the same world every time.
import { ISLANDS, CONFIG } from './config.js';
import { mulberry32 } from './random.js';

export function buildWorld(seed) {
  const rnd = mulberry32(seed);
  const buoys = [];
  for (let i = 0; i < 26; i++) {
    buoys.push({ x: 200 + rnd() * (CONFIG.worldWidth - 400), y: 200 + rnd() * (CONFIG.worldHeight - 400), phase: rnd() * 6.28 });
  }
  const clouds = [];
  for (let i = 0; i < 34; i++) {
    clouds.push({ x: rnd() * CONFIG.worldWidth, y: rnd() * CONFIG.worldHeight, s: 60 + rnd() * 130, speed: 6 + rnd() * 10, shade: 0.5 + rnd() * 0.5 });
  }
  const gulls = [];
  for (let i = 0; i < 14; i++) {
    gulls.push({ x: rnd() * CONFIG.worldWidth, y: rnd() * CONFIG.worldHeight, a: rnd() * 6.28, sp: 30 + rnd() * 40 });
  }
  const rocks = [];
  for (let i = 0; i < 40; i++) {
    let x = 200 + rnd() * (CONFIG.worldWidth - 400), y = 200 + rnd() * (CONFIG.worldHeight - 400);
    if (ISLANDS.some((isl) => Math.hypot(x - isl.x, y - isl.y) < isl.r + 120)) continue;
    rocks.push({ x, y, r: 8 + rnd() * 22 });
  }
  return { buoys, clouds, gulls, rocks, time: 0 };
}

export function updateWorld(world, dt) {
  world.time += dt;
  for (const c of world.clouds) {
    c.x += c.speed * dt;
    if (c.x > CONFIG.worldWidth + 200) c.x = -200;
  }
  for (const g of world.gulls) {
    g.a += (Math.sin(world.time * 0.3 + g.x * 0.001) * 0.4) * dt;
    g.x += Math.cos(g.a) * g.sp * dt;
    g.y += Math.sin(g.a) * g.sp * dt;
    if (g.x < 0) g.x = CONFIG.worldWidth; if (g.x > CONFIG.worldWidth) g.x = 0;
    if (g.y < 0) g.y = CONFIG.worldHeight; if (g.y > CONFIG.worldHeight) g.y = 0;
  }
}

export function islandAt(world, x, y) {
  return ISLANDS.find((isl) => Math.hypot(x - isl.x, y - isl.y) < isl.r) || null;
}
