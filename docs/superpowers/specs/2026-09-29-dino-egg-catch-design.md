# Block Diggers — Dino Planet's Egg Catch (the Egg Grove) — Design

**Date:** 2026-09-29
**Status:** chosen by the owner, who said "Push it love and work on the Dino egg catch now". It's the fourth bonus mini game. See the claw machine design for how bonus rooms work.

## Where

- **The Egg Grove:** a room right of the Dino Heart chamber, columns 30–46, with 12 rows of air above a jungle-soil floor.
- **What's cleared out:** chests and decorations in the room are dropped, and creatures never spawn in it.
- **The look:** a pink-to-orange jungle sunset, a far-off volcano, tree ferns, green hills, and a scoreboard with an egg on it, over 20 timer bulbs.

## The game

- **The rules:** `src/game/eggcatch.js` has `createEggGame`, `stepEggGame` and `eggReward`.
- **The pterodactyl:** it flies back and forth near the ceiling. It drops eggs every 1.5 s at first, and every 0.55 s by the end of a 30 s round. The eggs fall faster as the round goes on, too.
- **The eggs:**

  | Egg | Chance | Points | Treasure |
  |---|---|---|---|
  | Speckled | the rest | 1 | 1 jade |
  | Golden | 8% | 3 | 3 obsidian |
  | Rotten | 12% | 0 | a green stink cloud and "pee-yew", nothing else |

  Missed eggs splat on the floor, and the splat fades.
- **Catching:**
  - everyone inside the grove automatically holds a basket over their head;
  - an egg that falls through a basket's rim (within 12 px) is caught;
  - nobody's controls are taken over.
- **Rounds:**
  - a round starts about 1.5 s after someone walks in, and runs for 30 s;
  - at the end, the score is shown big, confetti flies and the pterodactyl does a happy loop;
  - the next round starts after a short pause;
  - the round stops when everyone leaves.
- **Treasure:** up to 20 catches a trip give treasure. The camera frames the grove while anyone is in it.
- **Stickers:** a new "Bonus Games 2" page (the first page was full), with 5 stickers: the grove, a caught egg, the golden egg, a rotten egg, and 15 in a round. That makes 246 stickers on 25 pages; `TROPHY_COUNT` is 25.
