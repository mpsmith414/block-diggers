// Pure input mapping: device state in, intent out. No DOM, no Phaser.

export const DEADZONE = 0.25;

export function applyDeadzone(x, y, dz = DEADZONE) {
  const mag = Math.hypot(x, y);
  if (mag < dz) return { x: 0, y: 0 };
  const scaled = Math.min(1, (mag - dz) / (1 - dz));
  return { x: (x / mag) * scaled, y: (y / mag) * scaled };
}

export function toIntent(state) {
  const b = state.buttons;
  const stick = applyDeadzone(state.axes.lx, state.axes.ly);
  let moveX = stick.x;
  let moveY = stick.y;
  if (b.left) moveX = -1;
  else if (b.right) moveX = 1;
  if (b.up) moveY = -1;
  else if (b.down) moveY = 1;
  return {
    moveX: moveX || 0,
    moveY: moveY || 0,
    jump: !!(b.a || b.x),
    bubble: !!b.y,
    home: !!b.b,
    pause: !!(b.start || b.back),
  };
}

export function createHoldTimer(durationMs) {
  let held = 0;
  let fired = false;
  return {
    update(isDown, dtMs) {
      if (!isDown) {
        held = 0;
        fired = false;
        return false;
      }
      held += dtMs;
      if (!fired && held >= durationMs) {
        fired = true;
        return true;
      }
      return false;
    },
    progress() {
      return Math.min(1, held / durationMs);
    },
  };
}

export function createEdge() {
  let was = false;
  return (isDown) => {
    const pressed = isDown && !was;
    was = isDown;
    return pressed;
  };
}
