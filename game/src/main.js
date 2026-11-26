// TIDE POST — bootstrap, game loop and screen flow.
// Title → sortie select → flying → debrief. The loop is fixed-step
// (60 Hz) so the flight model plays the same on any machine.
import { CONFIG, MISSIONS, ISLANDS, PILOT } from './config.js';
import { pickSeed } from './random.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { loadSave, freshSave, storeSave, recordMissionResult } from './save.js';
import { buildWorld, updateWorld } from './world.js';
import { createPlane, updatePlane } from './physics.js';
import { createMissionState, updateMission, say } from './missions.js';
import { drawGame, drawTitle, drawSelect, drawEnd } from './render.js';
import { selectButtons, endButtons, hitButton, hoverButtons } from './ui.js';
import { parseShot, stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const input = new Input(canvas);
const sounds = new SoundBank();
const shot = parseShot();
const seed = pickSeed(shot.seed);

const save = loadSave() || freshSave();

const game = {
  save, world: buildWorld(seed), plane: null, missionState: null,
  screen: 'title', paused: false, shotMode: false, recorded: false,
  selectBtns: [], endBtns: [],
};

function startMission(mission) {
  const homeId = mission.id === 'the-rescue' ? 'gull' : mission.island;
  game.plane = createPlane(islandById(homeId));
  game.plane.fuel = mission.fuelStart;
  game.missionState = createMissionState(mission, game.plane);
  game.screen = 'fly'; game.recorded = false; game.paused = false;
  say(game.missionState, mission.brief, 5);
  sounds.ensure();
  setStatus(`Flying ${mission.name}. ${mission.brief}`);
}

function islandById(id) {
  return ISLANDS_BY_ID[id];
}
const ISLANDS_BY_ID = Object.fromEntries(ISLANDS.map((i) => [i.id, i]));

function setStatus(text) { if (statusEl) statusEl.textContent = text; }

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

// Backdrop for the title screen: mission one, mid-flight at dawn.
function backdropMission() {
  game.plane = createPlane(islandById('gull'));
  game.plane.fuel = 88;
  game.missionState = createMissionState(MISSIONS[0], game.plane);
  game.plane.x = 1500; game.plane.y = 2300; game.plane.alt = 330;
  game.plane.heading = -0.9; game.plane.speed = 210; game.plane.throttle = 72; game.plane.bank = -8;
}
backdropMission();

// Shot mode: skip the menus, stage a live flight, let the autopilot fly it.
// The 'title' shot keeps the title screen (its backdrop is a staged dawn flight).
if (shot.shot && shot.shot !== 'title') {
  const byShot = { flight: 'first-light', rings: 'first-light', night: 'night-mail', rescue: 'the-rescue' };
  const mission = MISSIONS.find((m) => m.id === (byShot[shot.shot] || 'first-light'));
  game.plane = createPlane(islandById(mission.island === 'widow' ? 'widow' : mission.id === 'the-rescue' ? 'seal' : 'gull'));
  game.plane.fuel = mission.fuelStart;
  game.missionState = createMissionState(mission, game.plane);
  stageShot(game, shot.shot);
  game.screen = 'fly';
  game.shotMode = true;
  setStatus(`Screenshot staging: ${shot.shot}`);
}

// Autopilot: only in shot mode. Steers toward the next ring at its altitude.
function autopilotInput() {
  const plane = game.plane;
  const ring = game.missionState.ringsLeft[game.missionState.ringIndex];
  const target = ring || { x: plane.x + Math.cos(plane.heading) * 500, y: plane.y + Math.sin(plane.heading) * 500, alt: 300 };
  const want = Math.atan2(target.y - plane.y, target.x - plane.x);
  let err = want - plane.heading;
  while (err > Math.PI) err -= Math.PI * 2;
  while (err < -Math.PI) err += Math.PI * 2;
  const keys = new Set();
  if (plane.speed < 205) keys.add('w');
  if (plane.alt < target.alt - 25) keys.add('i');
  if (plane.alt > target.alt + 25) keys.add('k');
  if (err > 0.08) keys.add('d');
  if (err < -0.08) keys.add('a');
  return { down: (...names) => names.some((n) => keys.has(n)), hit: () => false };
}

let last = performance.now();
let acc = 0;
const STEP = 1000 / 60;

function frame(now) {
  requestAnimationFrame(frame);
  const W = window.innerWidth, H = window.innerHeight;
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.25) dt = 0.25;
  acc += dt * 1000;
  let steps = 0;
  while (acc >= STEP && steps < 5) {
    step(STEP / 1000, W, H);
    acc -= STEP; steps += 1;
  }
  draw(W, H);
  input.endFrame();
}

function step(dt, W, H) {
  updateWorld(game.world, dt);
  if (game.screen === 'title') {
    hoverButtons([], 0, 0);
    if (input.hit('enter') || input.mouse.clicked) {
      sounds.ensure();
      game.screen = 'select';
      game.selectBtns = selectButtons(W, H, game.save);
      input.consumeClick();
    }
    return;
  }
  if (game.screen === 'select') {
    hoverButtons(game.selectBtns, input.mouse.x, input.mouse.y);
    const click = input.consumeClick();
    if (click) {
      const b = hitButton(game.selectBtns, click.x, click.y);
      if (b && !b.locked) startMission(b.mission);
    }
    if (input.hit('escape')) game.screen = 'title';
    for (let n = 1; n <= 4; n++) {
      if (input.hit(String(n))) {
        const m = MISSIONS[n - 1];
        if (m && m.num <= game.save.unlocked) startMission(m);
      }
    }
    return;
  }
  if (game.screen === 'fly') {
    if (input.hit('p')) game.paused = !game.paused;
    if (input.hit('m')) sounds.toggleMute();
    if (game.paused) return;
    const effInput = game.shotMode ? autopilotInput() : input;
    updatePlane(game.plane, effInput, dt, game.missionState.mission);
    updateMission(game.missionState, game.plane, game.world, dt, sounds);
    sounds.setEngine(game.plane.throttle, game.plane.speed);
    if (game.missionState.phase !== 'fly' && !game.recorded) {
      game.recorded = true;
      if (game.missionState.phase === 'done') {
        recordMissionResult(game.save, game.missionState.mission.id, game.missionState.stars,
          game.missionState.time, game.plane.fuel, game.missionState.parcelsGot);
        storeSave(game.save);
        sounds.fanfare();
        setStatus(`Mission complete: ${game.missionState.mission.name}, ${game.missionState.stars} stars.`);
      } else {
        setStatus(`Mission failed: ${game.missionState.endReason}`);
      }
      game.screen = 'end';
      game.endBtns = endButtons(W, H);
    }
    return;
  }
  if (game.screen === 'end') {
    hoverButtons(game.endBtns, input.mouse.x, input.mouse.y);
    const click = input.consumeClick();
    if (click) {
      const b = hitButton(game.endBtns, click.x, click.y);
      if (b && b.id === 'again') startMission(game.missionState.mission);
      if (b && b.id === 'select') { game.screen = 'select'; game.selectBtns = selectButtons(W, H, game.save); }
    }
    if (input.hit('enter')) startMission(game.missionState.mission);
    if (input.hit('escape')) { game.screen = 'select'; game.selectBtns = selectButtons(W, H, game.save); }
  }
}

function draw(W, H) {
  ctx.clearRect(0, 0, W, H);
  if (game.screen === 'title') drawTitle(ctx, game, W, H);
  else if (game.screen === 'select') drawSelect(ctx, game, W, H, game.selectBtns);
  else if (game.screen === 'fly') drawGame(ctx, game, W, H);
  else if (game.screen === 'end') drawEnd(ctx, game, W, H, game.endBtns);
  if (game.paused && game.screen === 'fly') {
    ctx.fillStyle = 'rgba(6,32,52,0.6)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 40px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Paused — press P to fly on', W / 2, H / 2);
  }
}

setStatus('TIDE POST — a dawn mail run by seaplane. Click to fly.');
requestAnimationFrame(frame);
