# Block Diggers — Saturn's Ice Hockey (the Ice Rink) — Design

**Date:** 2026-09-29
**Status:** chosen by the owner, who said "Yes then go ahead and implement ice hockey". It's the third bonus mini game. See the claw machine design for how bonus rooms work.

## Where

- **The Ice Rink:** a room right of the Saturn Heart chamber, columns 30–46, with 12 rows of air above an ice floor (players slide).
- **What's cleared out:** chests and decorations in the room are dropped, and creatures never spawn in it.
- **The look:** an aurora sky with stars, white rink boards (a red line, a blue centre line), a scoreboard with a snowball on it, and a red goal lamp over each net.

## The game

- **The rules:** `src/game/hockey.js` has `createRink`, `stepRink` and `hockeyReward`.
- **The puck:** a giant snowball that slides on the ice with low friction, between two goals at the room's ends.
- **Knocking it along:** a player on the ice who skates into it pushes it along, at at least `nudge` speed and faster the faster they skate.
- **Shooting:** A (the jump) within 24 px of the puck shoots it hard the way the player faces. It's shot from the jump itself, so the feet can already be a little off the ice.
- **The goalies:** each goal has a penguin who hops on his own clock (1.3 s standing, 0.9 s up).
  - Standing, he saves: the puck bounces back out.
  - While he's up, the puck slides under him into the net: GOAL. That gives a horn, the lamp flashing, confetti and a flash, and the penguin flops.
- **After a goal:** the puck drops back in the middle.
- **Nobody is taken over:** players just move and jump normally. The camera frames the whole rink while anyone is in it.
- **Scoring:** any goal counts for everyone (the scoreboard).
- **Treasure:** each goal gives 2 pearls and a comet to whoever last touched the puck, for up to 12 goals a trip.
- **Stickers** (on the Bonus Games page, which is now full at 12): the rink, a goal, a penguin save, and 5 goals in a trip. That makes 241 stickers.
- **The Saturn Core:** the rink takes a bite out of it, so its pearl-count test is relaxed.
