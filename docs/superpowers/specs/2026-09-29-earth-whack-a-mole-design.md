# Block Diggers — Earth's Whack-a-Mole (the Mole Fair) — Design

**Date:** 2026-09-29
**Status:** chosen by the owner, who said: "Yes and then implement whack a mole on earth". It's the second bonus mini game, after the Mars claw machine. See `2026-09-29-mars-claw-machine-design.md` for how bonus rooms work.

## Where

- **The Mole Fair:** a lit room right of the Heart of the World's chamber, columns 30–46 with 12 rows of air above a Core floor.
- **How it's carved:** `carveBonusRoom(grid, MINE_H, B.CORE, 12)`, the standalone form of `planetgen.bonusRoom`.
- **What's cleared out:**
  - chests, eggs, the big chest, fossils and decorations inside the room are dropped;
  - boulders whose floor or pit the room cut away turn back into rock;
  - creatures never spawn in the room.
- **The look:** bunting, a scoreboard with a mole's face, and a row of 20 timer bulbs.

## The game

- **The rules:** `src/game/whack.js` has `createWhack`, `stepWhack` and `whack`.
- **Five molehills.** A round lasts 30 s:
  - moles pop up at random, at most 2 at a time;
  - they stay up for less time as the round goes on (1.6 s → 0.75 s);
  - the gaps between them shrink (1.1 s → 0.4 s);
  - 12% of them are golden.
- **Bonking:** hit a mole that's up to bonk it (1 point, or 3 for a golden one). An empty hole is a harmless miss.
- **The end of a round:** the moles all pop up and wave, a fanfare and confetti play, and the score is shown big. The next round starts after a pause while anyone still holds a mallet.
- **Playing:**
  - walk into the mallet stand to take a mallet (there are two, for co-op);
  - left and right hop you from hill to hill, snapping to them;
  - A swings the mallet;
  - down puts the mallet back.
  - When nobody holds a mallet, the moles go home and the board shows the best score.
- **Treasure:** every bonk gives 1 gold (3 diamonds for a golden mole) into the backpack, for the first 20 bonks of a trip.
- **Stickers** (on the Bonus Games page): the Mole Fair, a bonked mole, the golden mole, and scoring 20 in a round. That makes 237 stickers.
