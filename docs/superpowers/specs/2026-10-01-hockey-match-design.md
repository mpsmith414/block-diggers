# Block Diggers — Saturn's Ice Hockey: a real match against the penguins — Design

**Date:** 2026-10-01
**Status:** chosen by the owner. The old Ice Hockey (`2026-09-29-saturn-ice-hockey-design.md`) had two problems: the puck was hard to see (a white snowball half-sunk into the ice in front of white boards), and the game felt "meh". This turns it into a real match: you against a team of penguins, first to 3, with real wins and losses.

## Where

- **Same room:** the Ice Rink right of the Saturn Heart chamber (`world.rink`, columns 30–46, 12 rows of air over an ice floor).
- **No changes** to the room's generation, its size, or the Saturn Core around it.

## Teams

- **Your net and theirs:** you defend the **left** net (the side you walk in from) and shoot at the **right** one.
- **The goalies:** one in front of each net, hopping on a timer as they do today.
  - Your goalie is a **friendly penguin with a blue scarf**. The other team's goalie wears a **red scarf**.
  - A puck that reaches a goalie while it's standing is saved and bounces back out. One that arrives while it's up slides in: a goal.
  - This is the same rule as today, applied to both nets.
- **The penguin skaters:** red scarves, a little stick each.
  - **How many:** 1 when one player is on the ice, 2 in co-op. They're counted at each faceoff.
  - **Off duty:** when no match is on, they stand by the right-hand net.

## A match

1. **Starting:** a match starts when a player is on the rink ice. A **3, 2, 1** countdown appears over the middle of the ice with a beep on each number, then the puck drops in the middle.
2. **Winning:** the first team to **3** goals wins.
3. **The scoreboard:** your player's face and your score, then a penguin and their score. Only numbers and pictures, no words.
4. **After each goal:** a short celebration, then the puck goes back to the middle and a new 3-2-1 faceoff starts.
5. **Leaving:** if every player leaves the rink, the match quietly resets to 0–0. The skaters go back to their bench, and the next time someone steps on the ice, a new match starts.
6. **The countdown pauses play:** during it, nobody (player or penguin) can touch the puck.

## Players

- **The controls are unchanged:**
  - skating into the puck knocks it along, faster the faster you skate;
  - jumping (A) right by the puck is a big shot the way you're facing.
- **Stealing:** you take the puck from a penguin by skating into it. The puck has no owner; whoever touches it last pushes it.
- **Nobody is knocked over:** players and penguins pass through each other. Only the puck gets bumped.

## The penguin skaters' brain (pure, in `hockey.js`)

- **Chasing:** each skater skates toward the puck at `skaterSpeed`, which is slower than a player (about 70% of a player's top speed).
- **Pushing:** a skater that touches the puck pushes it toward **your** (left) net, using the same push rule as players.
- **Shooting:** a skater within `skaterReach` of the puck, facing your net and within `shootRange` of it, shoots at `skaterShot` power (a bit weaker than a player's shot). It then waits `shotCooldown` before it can shoot again.
- **Slipping:**
  - each skater has a small chance (`slipChance` per second) of slipping and spinning for `slipTime`, standing still;
  - it is silly, and it gives a young player an opening;
  - slips use the seeded random generator, so the tests are repeatable.
- **Two skaters:** they don't both mob the puck. The one nearer the puck chases it; the other hangs back, halfway between the puck and your net.
- **One place for tuning:** all of these numbers live in `HOCKEY` in `src/tuning.js`, so they can be tuned after a play session.

## When the match ends

- **You win:**
  - the horn sounds, confetti falls and the screen flashes;
  - a big **trophy** pops up over the middle of the ice;
  - your blue-scarf goalie dances, and their goalie flops;
  - then you get the win prize (below).
- **The penguins win:**
  - the penguins do a happy waddle dance, and a **penguin flag** waves over your net;
  - nothing is taken away: the treasure from your goals is already in your backpack.
- **Either way:** after about 3 seconds the scores reset and a new match starts, if someone is still on the ice.

## Treasure

- **Your goals:** each one still gives **2 pearls and a comet** to whoever last touched the puck, up to 12 goals a trip (unchanged).
- **A win:** a prize of **4 pearls and 4 comets**, which flies to every player on the ice, for up to **3 wins a trip**.
- **Penguin goals and losses:** they cost nothing.

## Stickers

These are the same four sticker ids, so the book and old saves don't change.

- `hockey-rink`: step into the rink (unchanged).
- `hockey-goal`: score a goal (unchanged).
- `hockey-save`: a goalie makes a save. Now this counts either goalie.
- `hockey-five`: this now means **win a match against the penguins**. Anyone who earned it the old way (5 goals in a trip) keeps it. The icon stays the same.

## The look

- **The puck:** a real flat hockey puck, about 12×5 pixels.
  - **Colours:** dark navy, with a light-blue rim highlight.
  - **Placement:** it sits **on top of** the ice: its bottom edge is level with the floor, not 1 px below it. It's drawn above the ice and the boards.
  - **Shadow and movement:** a small dark shadow sits under it. When it's going fast it leaves short speed streaks, and each hit or shot gives a small spray of ice.
- **Sticks:** each player holds a small hockey stick while standing on the rink ice. It follows their facing and is hidden off the ice.
- **Penguins:**
  - they use the existing `penguin` sprite with a scarf overlay: blue for your goalie, red for theirs;
  - skaters have a stick too, and they wobble while skating;
  - a slip is a quick spin.
- **The scoreboard:** the existing board, with two numbers: the first player's face icon beside your score, and a penguin icon beside theirs.
- **The countdown:** big 3, 2, 1 numbers over the middle of the ice, each popping in.
- **New art in `src/art/hockey.js`:** the flat puck, the puck's shadow, scarves (blue and red), a stick, a trophy, a penguin flag, and the two-number scoreboard.
- **Sounds:** only existing sounds, wired in `src/audio/wire.js`.
  - Hit, shot and save: as today.
  - Your goal: the horn.
  - A penguin goal: the squeak.
  - The countdown: a beep.
  - A win: the party sound.
  - A loss: the squeak, twice.

## Code

- **`src/game/hockey.js`** holds the pure rules (no Phaser):
  - `createRink(x0, x1)`: as today, plus the match state: `phase` ('idle' | 'countdown' | 'play' | 'scored' | 'over'), `score: { us, them }`, a countdown timer, the winner, and `skaters`;
  - `stepRink(r, bodies, dt, rng)`: steps the match.
    - Players are `bodies` as today. The penguin skaters are added as bodies on the penguins' team, so the push and shot rules are shared.
    - It returns events: `countdown { n }`, `drop`, `hit`, `shot`, `save { side }`, `goal { team }`, `win`, `lose`, `reset`.
  - the skater brain, a helper used by `stepRink`;
  - `hockeyReward()` (unchanged) and `hockeyWinPrize()`.
- **`src/scenes/mine/hockeyView.js`:** draws everything and turns the events into sounds, effects, stickers and treasure. It also works out how many players are on the ice (for 1 or 2 skaters) and when everyone has left (to reset).
- **`src/art/hockey.js`:** the new art. `hockey-ball` stays registered (the `hockey-goal` sticker uses it as its icon); the rink just stops drawing it.
- **`src/tuning.js`:** new `HOCKEY` keys: `target: 3`, `countdown`, `skaterSpeed`, `skaterReach`, `skaterShot`, `shootRange`, `shotCooldown`, `slipChance`, `slipTime`, `winCap: 3`, `overTime`. `trick` is no longer used.

## Testing

**Unit tests (`tests/game/hockey.test.js`):**
- the countdown runs 3, 2, 1 and drops the puck, and nobody can touch the puck during it;
- a penguin skater chases the puck and pushes it toward the left net;
- a skater shoots when it's in range and facing your net, then waits for its cooldown;
- a player skating into the puck takes it away from a skater;
- a goal in the right net counts for `us`, and one in the left net for `them`;
- whichever team reaches 3 first ends the match with `win` or `lose`, and a new match starts after `overTime`;
- the match resets to 0–0 when nobody is on the ice;
- there's 1 skater with one player and 2 with two;
- slips are repeatable with a fixed seed;
- the win prize is limited to 3 a trip.

**In the browser:**
- solo and co-op matches;
- screenshots of the puck on the ice, a faceoff, a goal each way, a win and a loss.

**Shipping:** nothing ships until the owner has seen it and approved.
