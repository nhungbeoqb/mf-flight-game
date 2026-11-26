// Menu buttons: where they sit, whether the mouse is over them,
// and which one a click lands on.
import { MISSIONS } from './config.js';

export function selectButtons(W, H, save) {
  const bw = Math.min(760, W - 80), bh = 104, gap = 16;
  const total = MISSIONS.length * bh + (MISSIONS.length - 1) * gap;
  const top = (H - total) / 2 + 20;
  return MISSIONS.map((m, i) => ({
    mission: m, x: (W - bw) / 2, y: top + i * (bh + gap), w: bw, h: bh,
    locked: m.num > save.unlocked, hover: false,
  }));
}

export function endButtons(W, H) {
  const bw = 220, bh = 52, gap = 20;
  const x0 = W / 2 - bw - gap / 2;
  return [
    { id: 'again', label: 'Fly it again', x: x0, y: H * 0.3 + 180, w: bw, h: bh, hover: false },
    { id: 'select', label: 'Choose a sortie', x: x0 + bw + gap, y: H * 0.3 + 180, w: bw, h: bh, hover: false },
  ];
}

export function hitButton(buttons, mx, my) {
  return buttons.find((b) => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) || null;
}

export function hoverButtons(buttons, mx, my) {
  for (const b of buttons) b.hover = mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h;
}
