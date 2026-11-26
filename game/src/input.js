// Keyboard and mouse input. Keys are read as a live set each frame;
// the menus also take clicks, so the game is playable with mouse alone
// for starting, and keyboard for flying.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };
    this.anyKey = false;
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (!e.repeat) { this.pressed.add(e.key.toLowerCase()); this.anyKey = true; }
      this.keys.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top;
    });
    canvas.addEventListener('mousedown', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.clickX = e.clientX - r.left; this.mouse.clickY = e.clientY - r.top;
      this.mouse.clicked = true;
    });
    window.addEventListener('blur', () => this.keys.clear());
  }

  down(...names) { return names.some((n) => this.keys.has(n)); }
  hit(...names) { return names.some((n) => this.pressed.has(n)); }
  consumeClick() {
    const c = this.mouse.clicked;
    this.mouse.clicked = false;
    return c ? { x: this.mouse.clickX, y: this.mouse.clickY } : null;
  }
  endFrame() { this.pressed.clear(); }
}
