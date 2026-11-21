// Guards: patrol waypoints, watch with a vision cone, grow suspicious when
// they glimpse Wren, give chase when sure, and search the last place they
// saw her before giving up and returning to their round.
//
// States: patrol -> suspicious -> chase -> search -> return -> patrol.
// A guard also investigates a noise it hears (walk -> listen -> return).

import { TILE } from './config.js';
import {
  GUARD_PATROL_SPEED,
  GUARD_CHASE_SPEED,
  GUARD_SEARCH_SPEED,
  GUARD_VISION_RANGE,
  GUARD_VISION_HALF_ANGLE,
  GUARD_HEAR_RADIUS,
  DETECTION_FILL_BASE,
  DETECTION_DECAY,
  SUSPICION_AT,
  ALARM_AT,
  SHADOW_FACTOR,
  LAMP_FACTOR,
  SNEAK_FACTOR,
} from './config.js';
import { lineOfSight, isShadowTile, isLampLit, resolveCircleCollision } from './world.js';

export function createGuard(def, index) {
  const waypoints = def.waypoints.map(([col, row]) => ({
    x: col * TILE + TILE / 2,
    y: row * TILE + TILE / 2,
  }));
  const spawn = { x: def.spawn[0] * TILE + TILE / 2, y: def.spawn[1] * TILE + TILE / 2 };
  return {
    id: index,
    x: spawn.x,
    y: spawn.y,
    spawnX: spawn.x,
    spawnY: spawn.y,
    facing: waypoints.length > 0 ? Math.atan2(waypoints[0].y - spawn.y, waypoints[0].x - spawn.x) : 0,
    waypoints,
    waypointIndex: 0,
    pause: def.pause ?? 1.2,
    pauseLeft: 0,
    state: 'patrol',
    stateTime: 0,
    detection: 0, // 0..100, shared meter for this guard's certainty
    range: GUARD_VISION_RANGE,
    halfAngle: GUARD_VISION_HALF_ANGLE,
    lastSeen: null,
    lastSeenTime: -999,
    investigateTarget: null,
    searchSpins: 0,
    stepPhase: 0,
    alarmedBefore: false,
  };
}

function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function turnToward(guard, targetAngle, rate, dt) {
  const diff = angleDifference(targetAngle, guard.facing);
  const step = Math.max(-rate * dt, Math.min(rate * dt, diff));
  guard.facing += step;
}

function moveToward(guard, world, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  const fixed = resolveCircleCollision(world, nx, ny, 14);
  guard.x = fixed.x;
  guard.y = fixed.y;
  guard.facing = Math.atan2(dy, dx);
  guard.stepPhase += step;
  return dist <= speed * dt + 2;
}

// Can this guard see Wren right now? Inside the cone, in range, line clear.
export function guardSeesPlayer(world, guard, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > guard.range) return { seen: false, dist };
  const angleTo = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(angleTo, guard.facing)) > guard.halfAngle) {
    return { seen: false, dist };
  }
  if (!lineOfSight(world, guard.x, guard.y, player.x, player.y)) {
    return { seen: false, dist };
  }
  return { seen: true, dist };
}

// How fast this guard's certainty grows while Wren is in view: closer is
// worse, lamplight is worse, shadow and sneaking buy time.
export function detectionRate(world, guard, player, dist) {
  const closeness = 1 - (dist / guard.range) * 0.7;
  let rate = DETECTION_FILL_BASE * Math.max(0.25, closeness);
  if (isShadowTile(world, player.x, player.y)) rate *= SHADOW_FACTOR;
  if (isLampLit(world, player.x, player.y)) rate *= LAMP_FACTOR;
  if (player.sneaking) rate *= SNEAK_FACTOR;
  return rate;
}

export function hearNoise(guard, x, y) {
  if (guard.state === 'chase') return;
  const dist = Math.hypot(x - guard.x, y - guard.y);
  if (dist > GUARD_HEAR_RADIUS) return;
  guard.state = 'investigate';
  guard.stateTime = 0;
  guard.investigateTarget = { x, y };
}

// One tick of guard AI. Returns events the game loop turns into sound and HUD.
export function updateGuard(world, guard, player, dt, now) {
  const events = [];
  const sight = guardSeesPlayer(world, guard, player);

  if (sight.seen) {
    guard.detection = Math.min(
      ALARM_AT,
      guard.detection + detectionRate(world, guard, player, sight.dist) * dt,
    );
    guard.lastSeen = { x: player.x, y: player.y };
    guard.lastSeenTime = now;
  } else if (guard.state !== 'chase') {
    guard.detection = Math.max(0, guard.detection - DETECTION_DECAY * dt);
  }

  if (guard.detection >= ALARM_AT && guard.state !== 'chase') {
    guard.state = 'chase';
    guard.stateTime = 0;
    guard.alarmedBefore = true;
    events.push({ type: 'alarm', guard });
  } else if (
    guard.detection >= SUSPICION_AT &&
    (guard.state === 'patrol' || guard.state === 'return')
  ) {
    if (guard.state !== 'suspicious') {
      guard.state = 'suspicious';
      guard.stateTime = 0;
      events.push({ type: 'suspicious', guard });
    }
  }

  switch (guard.state) {
    case 'patrol': {
      if (guard.pauseLeft > 0) {
        guard.pauseLeft -= dt;
        break;
      }
      const target = guard.waypoints[guard.waypointIndex];
      if (!target) break;
      const arrived = moveToward(guard, world, target.x, target.y, GUARD_PATROL_SPEED, dt);
      if (arrived) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
        guard.pauseLeft = guard.pause;
      }
      break;
    }
    case 'suspicious': {
      // Stop, turn toward the glimpse, and stare. Certainty decides the rest.
      guard.stateTime += dt;
      if (guard.lastSeen) {
        turnToward(
          guard,
          Math.atan2(guard.lastSeen.y - guard.y, guard.lastSeen.x - guard.x),
          2.4,
          dt,
        );
      }
      if (guard.detection < SUSPICION_AT - 5 || guard.stateTime > 4) {
        guard.state = 'return';
        guard.stateTime = 0;
      }
      break;
    }
    case 'chase': {
      guard.stateTime += dt;
      const target = sight.seen ? { x: player.x, y: player.y } : guard.lastSeen;
      if (target) moveToward(guard, world, target.x, target.y, GUARD_CHASE_SPEED, dt);
      if (!sight.seen && now - guard.lastSeenTime > 2.5) {
        guard.state = 'search';
        guard.stateTime = 0;
        guard.searchSpins = 0;
        events.push({ type: 'lost', guard });
      }
      if (Math.hypot(player.x - guard.x, player.y - guard.y) < 26) {
        events.push({ type: 'caught', guard });
      }
      break;
    }
    case 'search': {
      guard.stateTime += dt;
      const target = guard.lastSeen ?? { x: guard.spawnX, y: guard.spawnY };
      const arrived = moveToward(guard, world, target.x, target.y, GUARD_SEARCH_SPEED, dt);
      if (arrived) {
        // Sweep the room: turn in place, looking for her.
        guard.facing += dt * 1.6;
        if (guard.stateTime > 3.2) {
          guard.state = 'return';
          guard.stateTime = 0;
          guard.detection = 0;
        }
      }
      break;
    }
    case 'investigate': {
      guard.stateTime += dt;
      const target = guard.investigateTarget ?? { x: guard.spawnX, y: guard.spawnY };
      const arrived = moveToward(guard, world, target.x, target.y, GUARD_SEARCH_SPEED, dt);
      if (arrived) {
        guard.facing += dt * 1.8;
        if (guard.stateTime > 2.4) {
          guard.state = 'return';
          guard.stateTime = 0;
          guard.investigateTarget = null;
        }
      }
      break;
    }
    case 'return': {
      const target = guard.waypoints[guard.waypointIndex] ?? {
        x: guard.spawnX,
        y: guard.spawnY,
      };
      const arrived = moveToward(guard, world, target.x, target.y, GUARD_PATROL_SPEED, dt);
      if (arrived) {
        guard.state = 'patrol';
        guard.stateTime = 0;
      }
      break;
    }
    default:
      break;
  }

  return events;
}

export function guardAlertLevel(guard) {
  if (guard.state === 'chase') return 'alarmed';
  if (guard.state === 'suspicious' || guard.state === 'search' || guard.state === 'investigate') {
    return 'suspicious';
  }
  return 'calm';
}
