// All the bonus rooms at the bottom of the planets (Earth's Whack-a-Mole, the
// Moon's skate park, the Mars claw machine, Saturn's ice hockey, Dino
// Planet's egg catch, the Sun's firework launcher), behind one face for MineScene: a player who is
// `busy` with one is moved by it instead of walking.

import { createSkateView } from './skateView.js';
import { createClawView } from './clawView.js';
import { createWhackView } from './whackView.js';
import { createHockeyView } from './hockeyView.js';
import { createEggView } from './eggView.js';
import { createFireworksView } from './fireworksView.js';

export function createBonusViews(scene) {
  const views = [createWhackView(scene), createSkateView(scene), createClawView(scene), createHockeyView(scene), createEggView(scene),
    createFireworksView(scene)];
  const using = (a) => views.find((v) => v.busy(a));
  return {
    views, // (for the dev harness)
    busy: (a) => !!using(a),
    update: (dt, time) => views.forEach((v) => v.update(dt, time)),
    step(a, intent, dt) { using(a)?.step(a, intent, dt); },
    draw(a, time) { using(a)?.draw(a, time); },
    leave(a) { using(a)?.leave(a); },
    lights: (view, flicker) => views.flatMap((v) => v.lights(view, flicker)),
    framePoints: () => views.flatMap((v) => v.framePoints()),
    occupied: () => views.some((v) => v.occupied()),
  };
}
