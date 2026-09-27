// Phone controls: a floating joystick on the left half of the screen, and
// round A (jump) and home (hold) buttons on the right. Produces the same
// DeviceState as a gamepad, with id 'touch'.

export function stickFromDrag(x0, y0, x, y, radius) {
  let dx = (x - x0) / radius;
  let dy = (y - y0) / radius;
  const m = Math.hypot(dx, dy);
  if (m > 1) { dx /= m; dy /= m; }
  return { x: dx, y: dy };
}

const BUTTON_CSS = [
  'position:absolute', 'border-radius:50%', 'display:flex', 'align-items:center', 'justify-content:center',
  'font:bold 28px system-ui,sans-serif', 'color:#fff', 'pointer-events:auto', 'touch-action:none',
  'user-select:none', '-webkit-user-select:none', 'box-shadow:0 3px 0 rgba(0,0,0,.35)',
].join(';');

export function createTouch({ doc, win, radius = 60 }) {
  const root = doc.createElement('div');
  root.id = 'touch-controls';
  root.style.cssText = 'position:fixed;inset:0;z-index:20;pointer-events:none;';

  const zone = doc.createElement('div');
  zone.id = 'touch-stick-zone';
  zone.style.cssText = 'position:absolute;left:0;top:0;bottom:0;width:50%;pointer-events:auto;touch-action:none;';
  const base = doc.createElement('div');
  base.style.cssText = `position:absolute;width:${radius * 2}px;height:${radius * 2}px;border-radius:50%;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.35);display:none;transform:translate(-50%,-50%);`;
  const knob = doc.createElement('div');
  knob.style.cssText = 'position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.55);display:none;transform:translate(-50%,-50%);';
  zone.append(base, knob);

  const a = doc.createElement('div');
  a.id = 'touch-a';
  a.textContent = 'A';
  a.style.cssText = `${BUTTON_CSS};right:24px;bottom:30px;width:96px;height:96px;font-size:34px;background:#4cc24a;`;
  const home = doc.createElement('div');
  home.id = 'touch-home';
  home.textContent = '⌂';
  home.style.cssText = `${BUTTON_CSS};right:132px;bottom:18px;width:70px;height:70px;background:#d0463a;`;
  const pause = doc.createElement('div');
  pause.id = 'touch-pause';
  pause.textContent = 'II';
  pause.style.cssText = `${BUTTON_CSS};left:50%;top:8px;width:40px;height:40px;margin-left:-20px;font-size:16px;background:rgba(0,0,0,.35);`;
  const book = doc.createElement('div');
  book.id = 'touch-book';
  book.textContent = '📖';
  book.style.cssText = `${BUTTON_CSS};left:10px;top:10px;width:44px;height:44px;font-size:22px;background:rgba(0,0,0,.35);`;
  // the book opens straight from here (scenes listen for this event)
  book.addEventListener('pointerdown', (e) => {
    if (e.preventDefault) e.preventDefault();
    win.dispatchEvent(new Event('block-diggers:book'));
  });
  root.append(zone, a, home, pause, book);
  doc.body.appendChild(root);

  let stick = { x: 0, y: 0 };
  let stickId = null;
  let origin = null;
  const held = { a: new Set(), b: new Set(), start: new Set() };
  const tapped = { a: false, b: false, start: false };

  const onZoneDown = (e) => {
    if (stickId !== null) return;
    stickId = e.pointerId;
    origin = { x: e.clientX, y: e.clientY };
    stick = { x: 0, y: 0 };
    base.style.display = knob.style.display = 'block';
    base.style.left = knob.style.left = `${e.clientX}px`;
    base.style.top = knob.style.top = `${e.clientY}px`;
    if (e.preventDefault) e.preventDefault();
  };
  const onZoneMove = (e) => {
    if (e.pointerId !== stickId) return;
    stick = stickFromDrag(origin.x, origin.y, e.clientX, e.clientY, radius);
    knob.style.left = `${origin.x + stick.x * radius}px`;
    knob.style.top = `${origin.y + stick.y * radius}px`;
  };
  const onZoneUp = (e) => {
    if (e.pointerId !== stickId) return;
    stickId = null;
    stick = { x: 0, y: 0 };
    base.style.display = knob.style.display = 'none';
  };
  zone.addEventListener('pointerdown', onZoneDown);
  zone.addEventListener('pointermove', onZoneMove);
  zone.addEventListener('pointerup', onZoneUp);
  zone.addEventListener('pointercancel', onZoneUp);

  const bind = (el, key) => {
    el.addEventListener('pointerdown', (e) => {
      held[key].add(e.pointerId);
      tapped[key] = true;
      el.style.transform = 'scale(.92)';
      if (e.preventDefault) e.preventDefault();
    });
    const up = (e) => {
      held[key].delete(e.pointerId);
      el.style.transform = '';
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
  };
  bind(a, 'a');
  bind(home, 'b');
  bind(pause, 'start');

  return {
    read() {
      const pressed = (k) => held[k].size > 0 || tapped[k];
      const buttons = {
        a: pressed('a'), b: pressed('b'), x: false, y: false, lb: false, rb: false,
        back: false, start: pressed('start'), up: false, down: false, left: false, right: false,
      };
      tapped.a = tapped.b = tapped.start = false;
      return { id: 'touch', kind: 'touch', label: 'Touch', axes: { lx: stick.x, ly: stick.y, rx: 0, ry: 0 }, buttons };
    },
    destroy() {
      root.remove();
    },
  };
}
