# Block Diggers — the Sun's Firework Launcher (the Launch Deck) — Design

**Date:** 2026-09-30
**Status:** chosen by the owner, who said "Yes push love and work on the next one". It's the fifth and last of the bonus mini games at the bottom of the planets:

| Planet | Mini game |
|---|---|
| Earth | Whack-a-Mole |
| Moon | the Skate Park |
| Mars | the Claw Machine |
| Saturn | Ice Hockey |
| Dino Planet | Egg Catch |
| the Sun | the Firework Launcher |

## Where

- **The Launch Deck:** a room right of the Sun's Heart chamber, columns 30–46, with 12 rows of air above a Corona-rock floor.
- **What's cleared out:** chests and decorations in the room are dropped, and creatures never spawn in it.
- **The look:** a starry night-purple sky, a warm glow behind the stage, and a scoreboard with a balloon on it over 20 timer bulbs.

## The game

- **The rules:** `src/game/fireworks.js` has `createShow`, `stepShow`, `launch` and `fireworkReward`.
- **Balloons:** they float up from below the floor at random x, swaying.
  - They come every 1.3 s at first, and every 0.45 s by the end of a 30 s round.
  - They rise faster as the round goes on.
  - 8% of them are golden.
  - Any that reach the top drift away harmlessly.
- **Launching:**
  - there are five launch pads on the floor;
  - jumping (A) while standing on a pad launches a firework rocket straight up from it (the `'jump'` scene event, like the hockey shot);
  - each pad has a 0.6 s cooldown;
  - nobody's controls are taken over.
- **Rockets:**
  - A rocket that meets a balloon (within 10 × 12 px) bursts it. The burst pops every balloon within 30 px, and so on: a chain reaction.
  - A rocket that hits nothing bursts harmlessly under the scoreboard.
- **Scoring:** a balloon is 1 point, a golden one 3.
  - Each pop sends a sunstone (3 novas for a golden one) to whoever launched that pad's last rocket, for up to 20 pops a trip.
  - A chain of 3 or more flashes the screen.
- **Rounds:** a round starts about 1.5 s after someone walks in. At the end, fireworks burst across the sky, a fanfare plays and the score is shown big. The next round comes after a pause; the round stops when everyone leaves.
- **Stickers** (on the "Bonus Games 2" page, now 10 of 12): the deck, a pop, a golden balloon, a chain of 3, and 15 in a round. That makes 251 stickers.
