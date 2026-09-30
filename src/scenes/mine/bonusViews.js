// All the bonus rooms at the bottom of the planets (the Moon's skate park,
// the Mars claw machine), behind one face for MineScene: a player who is
// `busy` with one is moved by it instead of walking.

import { createSkateView } from './skateView.js';
import { createClawView } from './clawView.js';

export function createBonusViews(scene) {
  const views = [createSkateView(scene), createClawView(scene)];
  const using = (a) => views.find((v) => v.busy(a));
  return {
    busy: (a) => !!using(a),
    update: (dt, time) => views.forEach((v) => v.update(dt, time)),
    step(a, intent, dt) { using(a)?.step(a, intent, dt); },
    draw(a, time) { using(a)?.draw(a, time); },
    leave(a) { using(a)?.leave(a); },
    lights: (view, flicker) => views.flatMap((v) => v.lights(view, flicker)),
    framePoints: () => views.flatMap((v) => v.framePoints()),
  };
}
