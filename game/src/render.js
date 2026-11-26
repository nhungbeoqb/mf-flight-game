// All drawing: the Sound from above, the Kittiwake seaplane, the HUD
// instruments, and the title / select / end screens. Bright dawn first —
// the night mission darkens the same palette.
import { CONFIG, ISLANDS, DAWN, NIGHT } from './config.js';
import { headingDegrees, compassPoint } from './physics.js';
import { missionObjectiveText } from './missions.js';

export function paletteFor(night) { return night ? NIGHT : DAWN; }

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function drawSea(ctx, cam, W, H, pal, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, pal.sea); g.addColorStop(1, pal.seaDeep);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1.5;
  const spacing = 90;
  const x0 = Math.floor(cam.x / spacing) * spacing, y0 = Math.floor(cam.y / spacing) * spacing;
  ctx.beginPath();
  for (let x = x0; x < cam.x + W + spacing; x += spacing) {
    for (let y = y0; y < cam.y + H + spacing; y += spacing) {
      const wob = Math.sin(t * 0.7 + (x + y) * 0.01) * 8;
      ctx.moveTo(x - cam.x + 14 + wob, y - cam.y);
      ctx.quadraticCurveTo(x - cam.x + 26 + wob, y - cam.y + 6, x - cam.x + 38 + wob, y - cam.y);
    }
  }
  ctx.stroke();
}

function drawIsland(ctx, cam, isl, pal, night, t) {
  const x = isl.x - cam.x, y = isl.y - cam.y;
  // Sand ring, then green heart.
  ctx.fillStyle = night ? '#8a7d5a' : '#e8d28a';
  ctx.beginPath(); ctx.arc(x, y, isl.r, 0, 6.29); ctx.fill();
  ctx.fillStyle = night ? '#2c4a2e' : '#5da24a';
  ctx.beginPath(); ctx.arc(x, y, isl.r * 0.86, 0, 6.29); ctx.fill();
  ctx.fillStyle = night ? '#24401f' : '#4a8a3c';
  ctx.beginPath(); ctx.arc(x - isl.r * 0.3, y - isl.r * 0.2, isl.r * 0.4, 0, 6.29); ctx.fill();
  ctx.beginPath(); ctx.arc(x + isl.r * 0.35, y + isl.r * 0.25, isl.r * 0.34, 0, 6.29); ctx.fill();
  // Palm dots.
  ctx.fillStyle = night ? '#1d3a1a' : '#2f6b2a';
  for (let i = 0; i < 9; i++) {
    const a = i * 0.7 + isl.x * 0.01, d = isl.r * (0.3 + (i % 3) * 0.18);
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 7, 0, 6.29); ctx.fill();
  }
  // Name label.
  ctx.fillStyle = night ? 'rgba(255,255,255,0.85)' : 'rgba(10,40,60,0.85)';
  ctx.font = 'bold 15px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(isl.name, x, y + isl.r + 20);
  // Dock on the south shore.
  if (isl.dock) {
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(x - 34, y + isl.r * 0.86 - 6, 68, 46);
    ctx.fillStyle = '#5d3d22';
    for (let i = 0; i < 4; i++) ctx.fillRect(x - 34 + i * 18, y + isl.r * 0.86 - 6, 3, 46);
  }
  // Runway strip with edge lights.
  if (isl.runway) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(isl.runway.angle);
    ctx.fillStyle = night ? '#3a3f4a' : '#565b66';
    rr(ctx, -isl.runway.length / 2, -CONFIG.runwayHalfWidth, isl.runway.length, CONFIG.runwayHalfWidth * 2, 10);
    ctx.fill();
    ctx.strokeStyle = '#f5f0dc'; ctx.lineWidth = 3; ctx.setLineDash([22, 18]);
    ctx.beginPath(); ctx.moveTo(-isl.runway.length / 2 + 20, 0); ctx.lineTo(isl.runway.length / 2 - 20, 0); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = night ? '#ffd66e' : '#fff3b0';
    for (let i = -4; i <= 4; i++) {
      const lx = (i / 4) * (isl.runway.length / 2 - 12);
      ctx.beginPath(); ctx.arc(lx, -CONFIG.runwayHalfWidth + 4, 4, 0, 6.29); ctx.fill();
      ctx.beginPath(); ctx.arc(lx, CONFIG.runwayHalfWidth - 4, 4, 0, 6.29); ctx.fill();
    }
    ctx.restore();
  }
  // Lighthouse: striped tower, lamp, and a sweeping beam at night.
  if (isl.lighthouse) {
    const lx = x + isl.r * 0.42, ly = y - isl.r * 0.35;
    if (night) {
      const beamA = t * 0.9;
      const bg = ctx.createLinearGradient(lx, ly, lx + Math.cos(beamA) * 520, ly + Math.sin(beamA) * 520);
      bg.addColorStop(0, 'rgba(255,240,170,0.5)'); bg.addColorStop(1, 'rgba(255,240,170,0)');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.moveTo(lx, ly);
      ctx.arc(lx, ly, 520, beamA - 0.12, beamA + 0.12); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#f2ede0'; ctx.fillRect(lx - 9, ly - 34, 18, 34);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(lx - 9, ly - 24, 18, 9); ctx.fillRect(lx - 9, ly - 8, 18, 9);
    ctx.fillStyle = night ? '#ffe9a0' : '#ffd66e';
    ctx.beginPath(); ctx.arc(lx, ly - 38, 8, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#33414f'; ctx.fillRect(lx - 11, ly - 48, 22, 6);
  }
}

function drawRing(ctx, cam, ring, isNext, night, t) {
  const x = ring.x - cam.x, y = ring.y - cam.y;
  const pulse = 1 + Math.sin(t * 3) * 0.06;
  ctx.save();
  ctx.globalAlpha = ring.done ? 0.25 : 1;
  ctx.strokeStyle = isNext ? '#ffcf3d' : '#37d67a';
  ctx.lineWidth = isNext ? 7 : 5;
  ctx.shadowColor = isNext ? '#ffcf3d' : '#37d67a'; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.arc(x, y, CONFIG.ringRadius * pulse, 0, 6.29); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = isNext ? '#ffcf3d' : '#37d67a';
  ctx.font = 'bold 13px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(ring.alt)} FT`, x, y - CONFIG.ringRadius - 10);
  if (isNext) {
    ctx.fillStyle = 'rgba(255,207,61,0.9)';
    ctx.beginPath(); ctx.moveTo(x, y - CONFIG.ringRadius - 34);
    ctx.lineTo(x - 8, y - CONFIG.ringRadius - 20); ctx.lineTo(x + 8, y - CONFIG.ringRadius - 20);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawParcel(ctx, cam, pc, t) {
  const x = pc.x - cam.x, y = pc.y - cam.y + Math.sin(t * 2 + pc.x) * 4;
  ctx.save();
  ctx.fillStyle = '#b5762e'; ctx.strokeStyle = '#7a4d18'; ctx.lineWidth = 2;
  ctx.translate(x, y); ctx.rotate(0.12);
  ctx.fillRect(-13, -13, 26, 26); ctx.strokeRect(-13, -13, 26, 26);
  ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(13, 0); ctx.moveTo(0, -13); ctx.lineTo(0, 13); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('MAIL', x, y + 26);
}

function drawSeaplane(ctx, sx, sy, plane, night) {
  const scale = 1 + (plane.alt / CONFIG.maxAltitude) * 0.35;
  const shadowOff = 10 + plane.alt * 0.09;
  // Shadow on the water below.
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#06283d';
  ctx.beginPath(); ctx.ellipse(sx + shadowOff, sy + shadowOff, 34 * scale, 12 * scale, plane.heading, 0, 6.29); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(sx, sy); ctx.rotate(plane.heading + Math.PI / 2); ctx.scale(scale, scale);
  // Floats.
  ctx.fillStyle = '#d8cdb4';
  rr(ctx, -26, 8, 10, 34, 5); ctx.fill();
  rr(ctx, 16, 8, 10, 34, 5); ctx.fill();
  // Wings: high wing with struts.
  ctx.fillStyle = '#e8543f';
  rr(ctx, -52, -6, 104, 16, 6); ctx.fill();
  ctx.fillStyle = '#f6f1e3';
  ctx.fillRect(-52, -2, 104, 3);
  ctx.fillStyle = '#c23d2b';
  ctx.fillRect(-52, -6, 10, 16); ctx.fillRect(42, -6, 10, 16);
  // Fuselage: cream with a red stripe, cockpit glass.
  ctx.fillStyle = '#f6ead2';
  rr(ctx, -11, -34, 22, 66, 10); ctx.fill();
  ctx.fillStyle = '#e8543f';
  ctx.fillRect(-11, 6, 22, 7);
  ctx.fillStyle = '#9fd8ef';
  rr(ctx, -8, -26, 16, 16, 7); ctx.fill();
  ctx.fillStyle = '#2b3a4a';
  ctx.beginPath(); ctx.arc(0, -18, 3, 0, 6.29); ctx.fill();
  // Tail.
  ctx.fillStyle = '#e8543f';
  ctx.beginPath(); ctx.moveTo(-16, 28); ctx.lineTo(16, 28); ctx.lineTo(8, 42); ctx.lineTo(-8, 42); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f6ead2';
  ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(7, 42); ctx.lineTo(-7, 42); ctx.closePath(); ctx.fill();
  // Propeller blur at the nose.
  ctx.fillStyle = 'rgba(180,200,215,0.55)';
  ctx.beginPath(); ctx.ellipse(0, -38, 4, 16, 0.5, 0, 6.29); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -38, 4, 16, -0.5, 0, 6.29); ctx.fill();
  ctx.restore();
  // Bank indicator arc above the plane.
  ctx.save();
  ctx.translate(sx, sy - 58 * scale);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, 16, Math.PI, 0); ctx.stroke();
  const bankA = -Math.PI / 2 + (plane.bank * Math.PI) / 180;
  ctx.strokeStyle = Math.abs(plane.bank) > 25 ? '#ff5a4a' : '#ffcf3d'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(bankA) * 16, Math.sin(bankA) * 16); ctx.stroke();
  ctx.restore();
}

function drawClouds(ctx, cam, world, night, t) {
  for (const c of world.clouds) {
    const px = (c.x - cam.x * 0.85) % (CONFIG.worldWidth + 400);
    const x = px < -200 ? px + CONFIG.worldWidth + 400 : px;
    const y = ((c.y - cam.y * 0.85) % (CONFIG.worldHeight + 400) + CONFIG.worldHeight + 400) % (CONFIG.worldHeight + 400) - 200;
    ctx.fillStyle = night ? `rgba(200,210,235,${0.10 * c.shade})` : `rgba(255,255,255,${0.55 * c.shade})`;
    ctx.beginPath();
    ctx.ellipse(x, y, c.s, c.s * 0.36, 0, 0, 6.29);
    ctx.ellipse(x - c.s * 0.5, y + 6, c.s * 0.6, c.s * 0.28, 0, 0, 6.29);
    ctx.ellipse(x + c.s * 0.5, y + 4, c.s * 0.55, c.s * 0.26, 0, 0, 6.29);
    ctx.fill();
  }
}

function drawHud(ctx, game, W, H) {
  const { plane, missionState, save } = game;
  const night = missionState.mission.night;
  // Top bar: mission name, objective, timer, lives.
  ctx.fillStyle = night ? 'rgba(8,16,34,0.78)' : 'rgba(8,42,66,0.78)';
  rr(ctx, 12, 10, W - 24, 46, 10); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText(`TIDE POST · ${missionState.mission.name}`, 26, 31);
  ctx.font = '15px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9a0';
  ctx.fillText(missionObjectiveText(missionState), W / 2, 40);
  ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = 'bold 16px system-ui, sans-serif';
  const tLeft = Math.max(0, Math.ceil(missionState.mission.timeLimit - missionState.time));
  ctx.fillText(`${Math.floor(tLeft / 60)}:${String(tLeft % 60).padStart(2, '0')}`, W - 26, 31);
  // Lives as little planes.
  ctx.textAlign = 'left';
  for (let i = 0; i < missionState.lives; i++) {
    ctx.fillStyle = '#ffcf3d'; ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('✈', W - 120 + i * 22, 31);
  }
  // Left instrument cluster: ALT, SPD, HDG, fuel, damage.
  const ix = 12, iy = 68, iw = 208;
  ctx.fillStyle = night ? 'rgba(8,16,34,0.8)' : 'rgba(8,42,66,0.8)';
  rr(ctx, ix, iy, iw, 208, 12); ctx.fill();
  ctx.textAlign = 'left';
  const hdg = headingDegrees(plane);
  const rows = [
    ['ALT', `${Math.round(plane.alt)} FT`, plane.alt < 60 ? '#ff8a7a' : '#fff'],
    ['SPD', `${Math.round(plane.speed)} KT`, plane.speed < 70 ? '#ff8a7a' : '#fff'],
    ['HDG', `${String(Math.round(hdg)).padStart(3, '0')}° ${compassPoint(hdg)}`, '#fff'],
    ['THR', `${Math.round(plane.throttle)}%`, '#9fd8ef'],
  ];
  rows.forEach(([label, val, col], i) => {
    const y = iy + 30 + i * 32;
    ctx.fillStyle = '#9fb8c8'; ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(label, ix + 14, y);
    ctx.fillStyle = col; ctx.font = 'bold 19px system-ui, sans-serif';
    ctx.fillText(val, ix + 62, y + 1);
  });
  // Fuel bar.
  ctx.fillStyle = '#9fb8c8'; ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('FUEL', ix + 14, iy + 152);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; rr(ctx, ix + 62, iy + 140, 130, 13, 6); ctx.fill();
  ctx.fillStyle = plane.fuel < 25 ? '#ff5a4a' : '#37d67a';
  rr(ctx, ix + 62, iy + 140, Math.max(4, 130 * (plane.fuel / 100)), 13, 6); ctx.fill();
  // Hull bar.
  ctx.fillStyle = '#9fb8c8'; ctx.fillText('HULL', ix + 14, iy + 184);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; rr(ctx, ix + 62, iy + 172, 130, 13, 6); ctx.fill();
  ctx.fillStyle = plane.damage > 60 ? '#ff5a4a' : '#ffcf3d';
  rr(ctx, ix + 62, iy + 172, Math.max(0, 130 * (1 - plane.damage / 100)), 13, 6); ctx.fill();
  // Compass strip along the bottom.
  const cy = H - 26;
  ctx.fillStyle = night ? 'rgba(8,16,34,0.75)' : 'rgba(8,42,66,0.75)';
  ctx.fillRect(0, cy - 14, W, 40);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px system-ui, sans-serif'; ctx.textAlign = 'center';
  for (let d = -180; d <= 180; d += 15) {
    let deg = (Math.round(hdg) + d + 360) % 360;
    const x = W / 2 + d * 3.2;
    if (x < 20 || x > W - 20) continue;
    const major = deg % 90 === 0;
    ctx.fillStyle = major ? '#ffcf3d' : 'rgba(255,255,255,0.75)';
    ctx.fillText(major ? compassPoint(deg) : String(deg), x, cy + 12);
    ctx.fillRect(x - 1, cy - 12, 2, major ? 10 : 5);
  }
  ctx.fillStyle = '#ff5a4a';
  ctx.beginPath(); ctx.moveTo(W / 2, cy - 16); ctx.lineTo(W / 2 - 6, cy - 26); ctx.lineTo(W / 2 + 6, cy - 26); ctx.closePath(); ctx.fill();
  // Rings + parcels tally, bottom right above the compass.
  ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`◉ ${missionState.ringsDone}/${missionState.mission.rings.length} rings   ✉ ${missionState.parcelsGot} parcels`, W - 16, H - 52);
  // Next-ring distance readout.
  const ring = missionState.ringsLeft[missionState.ringIndex];
  if (ring) {
    const d = Math.hypot(plane.x - ring.x, plane.y - ring.y);
    ctx.fillStyle = '#ffe9a0'; ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(`NEXT RING ${Math.round(d / 10) * 10} m · ${Math.round(ring.alt)} FT`, W - 16, H - 76);
  }
  // Toast message.
  if (missionState.message && missionState.time < missionState.messageUntil) {
    ctx.font = 'bold 17px system-ui, sans-serif'; ctx.textAlign = 'center';
    const tw = ctx.measureText(missionState.message).width + 36;
    ctx.fillStyle = night ? 'rgba(8,16,34,0.85)' : 'rgba(8,42,66,0.85)';
    rr(ctx, W / 2 - tw / 2, 66, tw, 38, 10); ctx.fill();
    ctx.fillStyle = '#ffe9a0';
    ctx.fillText(missionState.message, W / 2, 91);
  }
  // Stall / fuel warnings.
  if (plane.speed < CONFIG.stallSpeed && plane.alt > 10 && !plane.landed) {
    ctx.fillStyle = '#ff5a4a'; ctx.font = 'bold 18px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('⚠ STALL — ADD THROTTLE', W / 2, H - 100);
  }
  if (plane.fuel < 25 && plane.fuel > 0) {
    ctx.fillStyle = '#ff5a4a'; ctx.font = 'bold 18px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('⚠ LOW FUEL', W / 2, H - 124);
  }
}

export function drawGame(ctx, game, W, H, showHud = true) {
  const { plane, missionState, world } = game;
  const night = missionState.mission.night;
  const pal = paletteFor(night);
  const t = world.time;
  // Sky: dawn gradient with a low sun, or deep night.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, pal.skyTop); sky.addColorStop(0.55, pal.skyMid); sky.addColorStop(1, pal.skyLow);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  const sunX = W * 0.82, sunY = night ? H * 0.16 : H * 0.2;
  ctx.fillStyle = pal.sun;
  ctx.beginPath(); ctx.arc(sunX, sunY, night ? 26 : 44, 0, 6.29); ctx.fill();
  ctx.fillStyle = night ? 'rgba(244,234,210,0.25)' : 'rgba(255,214,110,0.25)';
  ctx.beginPath(); ctx.arc(sunX, sunY, night ? 40 : 66, 0, 6.29); ctx.fill();
  if (night) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 173) % W, sy = (i * 97) % (H * 0.4);
      ctx.fillRect(sx, sy, 2, 2);
    }
  }
  // Camera follows the plane.
  const cam = { x: plane.x - W / 2, y: plane.y - H / 2 };
  drawSea(ctx, cam, W, H, pal, t);
  for (const r of world.rocks) {
    const x = r.x - cam.x, y = r.y - cam.y;
    if (x < -40 || x > W + 40 || y < -40 || y > H + 40) continue;
    ctx.fillStyle = night ? '#3a4148' : '#6b7a82';
    ctx.beginPath(); ctx.arc(x, y, r.r, 0, 6.29); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(x - r.r * 0.3, y - r.r * 0.3, r.r * 0.5, 0, 6.29); ctx.fill();
  }
  for (const b of world.buoys) {
    const x = b.x - cam.x, y = b.y - cam.y + Math.sin(t * 1.4 + b.phase) * 3;
    if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
    ctx.fillStyle = '#e8543f';
    ctx.beginPath(); ctx.arc(x, y, 6, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, y - 12, 2, 8);
  }
  for (const isl of ISLANDS) drawIsland(ctx, cam, isl, pal, night, t);
  for (const pc of missionState.parcelsLeft) if (!pc.taken) drawParcel(ctx, cam, pc, t);
  missionState.ringsLeft.forEach((r, i) => drawRing(ctx, cam, r, i === missionState.ringIndex, night, t));
  // Gulls.
  ctx.strokeStyle = night ? 'rgba(220,225,240,0.7)' : 'rgba(40,60,80,0.7)';
  ctx.lineWidth = 2;
  for (const g of world.gulls) {
    const x = g.x - cam.x, y = g.y - cam.y;
    if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
    const flap = Math.sin(t * 6 + g.x * 0.05) * 4;
    ctx.beginPath();
    ctx.moveTo(x - 8, y); ctx.quadraticCurveTo(x - 3, y - 5 - flap, x, y);
    ctx.quadraticCurveTo(x + 3, y - 5 - flap, x + 8, y);
    ctx.stroke();
  }
  drawSeaplane(ctx, W / 2, H / 2, plane, night);
  drawClouds(ctx, cam, world, night, t);
  // Altitude vignette: higher means a softer, hazier edge.
  if (plane.alt > 500) {
    ctx.fillStyle = `rgba(190,220,240,${Math.min(0.25, (plane.alt - 500) / 1600)})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (showHud) drawHud(ctx, game, W, H);
}

function panel(ctx, W, H) {
  ctx.fillStyle = 'rgba(6,32,52,0.55)';
  ctx.fillRect(0, 0, W, H);
}

export function drawTitle(ctx, game, W, H) {
  drawGame(ctx, game, W, H, false);
  panel(ctx, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcf3d'; ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText('TIDE POST', W / 2, H * 0.22);
  ctx.fillStyle = '#fff'; ctx.font = '28px system-ui, sans-serif';
  ctx.fillText('A dawn mail run by seaplane', W / 2, H * 0.22 + 44);
  ctx.font = '17px system-ui, sans-serif'; ctx.fillStyle = '#d8ecf7';
  ctx.fillText('Pilot Wren Halloway flies the Kittiwake between the lighthouses of the Gull Sound —', W / 2, H * 0.22 + 84);
  ctx.fillText('through storm rings, over the tide, before the mail is late.', W / 2, H * 0.22 + 108);
  ctx.fillStyle = '#ffcf3d'; ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('CLICK TO FLY  ·  or press ENTER', W / 2, H * 0.74);
  ctx.fillStyle = '#fff'; ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('W/S throttle · I/K climb & descend · A/D or ←/→ bank & turn · M mute · P pause', W / 2, H * 0.74 + 34);
  ctx.fillText('Land slow, level and lined up. Bank gently when the cargo is fragile.', W / 2, H * 0.74 + 60);
  ctx.fillStyle = '#9fd8ef'; ctx.font = '15px system-ui, sans-serif';
  ctx.fillText(`${game.save.missionsFlown} sorties flown · ${game.save.parcels} parcels delivered · best: ${bestLine(game.save)}`, W / 2, H * 0.74 + 96);
}

function bestLine(save) {
  const names = { 'first-light': 'First Light', 'fragile-eggs': 'Eggs', 'night-mail': 'Night Mail', 'the-rescue': 'Rescue' };
  return Object.keys(save.stars).map((k) => `${names[k] || k} ${'★'.repeat(save.stars[k])}`).join(' · ') || 'no missions yet';
}

export function drawSelect(ctx, game, W, H, buttons) {
  drawGame(ctx, game, W, H, false);
  panel(ctx, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff'; ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillText('Choose a sortie', W / 2, 92);
  ctx.font = '16px system-ui, sans-serif'; ctx.fillStyle = '#d8ecf7';
  ctx.fillText('Four missions, four kinds of flying. Finish one to unlock the next.', W / 2, 122);
  buttons.forEach((b) => {
    const locked = b.locked;
    ctx.fillStyle = locked ? 'rgba(20,30,44,0.85)' : 'rgba(10,50,74,0.9)';
    rr(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
    ctx.strokeStyle = b.hover ? '#ffcf3d' : 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2;
    rr(ctx, b.x, b.y, b.w, b.h, 12); ctx.stroke();
    ctx.fillStyle = locked ? '#7a8a96' : '#ffcf3d';
    ctx.font = 'bold 20px system-ui, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`${b.mission.num}. ${b.mission.name}`, b.x + 22, b.y + 34);
    ctx.fillStyle = locked ? '#7a8a96' : '#fff'; ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(locked ? 'Finish the previous sortie to unlock this one.' : b.mission.brief, b.x + 22, b.y + 60, b.w - 44);
    ctx.fillStyle = '#ffe9a0'; ctx.font = 'bold 16px system-ui, sans-serif';
    const stars = game.save.stars[b.mission.id] || 0;
    ctx.fillText(locked ? '🔒 LOCKED' : (stars ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : 'Not flown yet'), b.x + 22, b.y + 86);
    ctx.textAlign = 'right'; ctx.fillStyle = '#9fd8ef'; ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(`Par ${b.mission.parTime}s · ${b.mission.rings.length} rings`, b.x + b.w - 22, b.y + 34);
  });
  ctx.fillStyle = '#9fd8ef'; ctx.font = '15px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Click a mission to fly it · ESC back to title', W / 2, H - 30);
}

export function drawEnd(ctx, game, W, H, buttons) {
  drawGame(ctx, game, W, H, false);
  panel(ctx, W, H);
  const ms = game.missionState;
  const won = ms.phase === 'done';
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#37d67a' : '#ff8a7a';
  ctx.font = 'bold 46px system-ui, sans-serif';
  ctx.fillText(won ? 'Mission complete!' : 'Mission failed', W / 2, H * 0.3);
  ctx.fillStyle = '#fff'; ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(ms.endReason || '', W / 2, H * 0.3 + 38);
  if (won) {
    ctx.fillStyle = '#ffcf3d'; ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillText('★'.repeat(ms.stars) + '☆'.repeat(3 - ms.stars), W / 2, H * 0.3 + 96);
  }
  ctx.fillStyle = '#d8ecf7'; ctx.font = '17px system-ui, sans-serif';
  ctx.fillText(`Time ${Math.round(ms.time)}s  ·  Rings ${ms.ringsDone}/${ms.mission.rings.length}  ·  Parcels ${ms.parcelsGot}  ·  Fuel left ${Math.round(game.plane.fuel)}%  ·  Hull ${100 - game.plane.damage}%`, W / 2, H * 0.3 + 140);
  buttons.forEach((b) => {
    ctx.fillStyle = b.hover ? '#ffcf3d' : 'rgba(10,50,74,0.9)';
    rr(ctx, b.x, b.y, b.w, b.h, 10); ctx.fill();
    ctx.fillStyle = b.hover ? '#0a2a42' : '#fff'; ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(b.label, b.x + b.w / 2, b.y + 33);
  });
}
