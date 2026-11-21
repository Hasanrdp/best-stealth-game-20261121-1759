# Night Gallery — The Quiet Heist

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![Rank](https://make.fun/badge/best-stealth-game-20261121-1759/Hasanrdp/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![Reward](https://make.fun/badge/best-stealth-game-20261121-1759/Hasanrdp/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

**Night Gallery** is a top-down stealth game about Wren, a quiet thief
slipping through a moonlit museum after closing. Built for the
[make.fun best-stealth-game-20261121-1759 bounty](https://make.fun/bounty/best-stealth-game-20261121-1759).

## The game

Three galleries, one Moon Opal in each. Take the Opal, pocket what
glitters on the way, and reach the green EXIT — unseen. Guards patrol
fixed rounds with vision cones that hug the walls; step into a cone and
their certainty climbs, faster in lamplight, slower in shadow and while
sneaking. At half certainty a guard stops and stares ("?"); at full
certainty he gives chase ("!"). Break his line of sight and he searches
the last place he saw you, then goes back to his round. Walking makes
noise a nearby guard will come to listen to — sneak past him instead.

- **Three galleries:** Gallery of Echoes (2 guards), The Marble Hall
  (3 guards), The Vault Wing (4 guards) — each a hand-laid floor of
  marble, shadow strips, lamps, crates, plants, statues and display
  cases to hide behind.
- **A detection system that gives you a chance:** certainty fills and
  drains, guards lose you, search, and return. Getting caught costs a
  life (3 per gallery); finishing a gallery without ever raising the
  alarm pays a 300-point UNSEEN bonus.
- **Feel:** vision cones that react as you expect, a near miss that
  raises the alarm, footsteps that tell you where a guard is, and a
  detection ring over every guard's head.
- **Sound:** everything is synthesised with WebAudio — soft steps,
  guard boots, pickup chimes, alarm stings and a win fanfare. M mutes.
- **Controls:** WASD / arrows to move, SHIFT to sneak, P to pause,
  R to restart the gallery, M to mute. Mouse for the menus.

## Play it

```sh
node serve.ts
# open http://localhost:8080 in a desktop browser
```

No build step, no network request: `game/` is plain static files.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library. The four
screenshots in `screenshots/` are real renders of the game's own code,
taken in headless Chromium from the deterministic `?shot=` scenes
listed in `shots.json`: title, a sneak past a patrol, a half-spotted
near miss, and a gallery cleared unseen.
