// Wren, the thief: moves with the keys, sneaks on Shift, makes noise when she
// walks, and is hidden only when no guard can draw a line to her.

import { PLAYER_WALK_SPEED, PLAYER_SNEAK_SPEED, PLAYER_RADIUS } from './config.js';
import { resolveCircleCollision, isShadowTile, isLampLit } from './world.js';

export function createPlayer(start) {
  return {
    x: start.x,
    y: start.y,
    radius: PLAYER_RADIUS,
    facing: 0,
    moving: false,
    sneaking: false,
    stepPhase: 0,
    lastStepAt: 0,
    noisePulse: 0, // counts down after each footstep; guards hear the pulse
    hidden: false, // in shadow right now
    lit: false, // standing in lamplight right now
  };
}

// Returns 'walk' | 'sneak' | 'idle' so the loop can play the right footstep.
export function updatePlayer(world, player, input, dt, now) {
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;

  player.sneaking = Boolean(input.sneak);
  player.moving = dx !== 0 || dy !== 0;

  if (!player.moving) return 'idle';

  const len = Math.hypot(dx, dy);
  const speed = player.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
  const nx = player.x + (dx / len) * speed * dt;
  const ny = player.y + (dy / len) * speed * dt;
  const fixed = resolveCircleCollision(world, nx, ny, player.radius);
  player.x = fixed.x;
  player.y = fixed.y;
  player.facing = Math.atan2(dy, dx);
  player.stepPhase += speed * dt;

  player.hidden = isShadowTile(world, player.x, player.y);
  player.lit = isLampLit(world, player.x, player.y);

  // A footstep every ~0.45 s of walking; sneaking is silent.
  if (!player.sneaking && now - player.lastStepAt > 0.45) {
    player.lastStepAt = now;
    player.noisePulse = 0.25;
    return 'walk';
  }
  if (player.sneaking && now - player.lastStepAt > 0.7) {
    player.lastStepAt = now;
    return 'sneak';
  }
  return 'idle';
}

export function decayNoise(player, dt) {
  player.noisePulse = Math.max(0, player.noisePulse - dt);
}
