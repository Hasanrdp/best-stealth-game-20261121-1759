// Deterministic screenshot scenes for the entry's screenshots/ folder.
// Each scene sets the game to a fixed, readable state and the main loop
// renders exactly one frame of it, so a headless browser shot is repeatable.
// Query: ?shot=start|play|play2|end&seed=1 (the seed only steadies the dust).

import { TILE } from './config.js';

function placeGuard(guard, col, row, facing, state, detection) {
  guard.x = col * TILE + TILE / 2;
  guard.y = row * TILE + TILE / 2;
  guard.facing = facing;
  guard.state = state;
  guard.stateTime = 0;
  guard.detection = detection;
  guard.pauseLeft = 0;
}

export function applyShot(game, name) {
  if (name === 'start') {
    game.loadLevel(0);
    game.phase = 'title';
    game.now = 12.5;
    placeGuard(game.guards[0], 24, 8, Math.PI * 0.5, 'patrol', 0);
    placeGuard(game.guards[1], 10, 7, 0, 'patrol', 0);
    return true;
  }
  if (name === 'play') {
    game.loadLevel(0);
    game.phase = 'playing';
    game.now = 24.0;
    // Wren sneaks in the shadow strip while a guard's cone sweeps toward her.
    game.player.x = 8 * TILE + TILE / 2;
    game.player.y = 8 * TILE + TILE / 2;
    game.player.sneaking = true;
    game.player.hidden = true;
    game.player.facing = 0;
    placeGuard(game.guards[0], 24, 6, Math.PI, 'patrol', 0);
    placeGuard(game.guards[1], 12, 8, Math.PI, 'patrol', 30);
    game.world.loot[0].taken = true;
    game.lootTaken = 1;
    game.score = 150;
    game.time = 47;
    game.maxDetection = 30;
    return true;
  }
  if (name === 'play2') {
    game.loadLevel(1);
    game.phase = 'playing';
    game.now = 31.0;
    // A guard has half-spotted her: orange cone, "?", certainty climbing.
    game.player.x = 8 * TILE + TILE / 2;
    game.player.y = 9 * TILE + TILE / 2;
    game.player.sneaking = true;
    game.player.hidden = true;
    game.player.facing = 0;
    placeGuard(game.guards[0], 12, 9, Math.PI, 'suspicious', 62);
    placeGuard(game.guards[1], 16, 5, Math.PI * 0.5, 'patrol', 0);
    placeGuard(game.guards[2], 5, 8, 0, 'patrol', 0);
    game.world.loot[0].taken = true;
    game.world.loot[1].taken = true;
    game.lootTaken = 2;
    game.score = 800;
    game.time = 96;
    game.maxDetection = 62;
    return true;
  }
  if (name === 'end') {
    game.loadLevel(0);
    game.phase = 'levelComplete';
    game.now = 40.0;
    game.world.opal.taken = true;
    game.world.loot.forEach((item, i) => {
      if (i < 4) item.taken = true;
    });
    game.lootTaken = 4;
    game.score = 1250;
    game.levelBonus = 950;
    game.unseenLevel = true;
    game.time = 143;
    placeGuard(game.guards[0], 24, 6, Math.PI * 0.5, 'patrol', 0);
    placeGuard(game.guards[1], 10, 7, Math.PI, 'patrol', 0);
    return true;
  }
  return false;
}
