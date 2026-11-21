// All drawing: the moonlit museum floor, cover, lamps, vision cones, the
// thief and her guards, the HUD, and every screen between levels.
// Canvas is 1280x720; the map (32x16 tiles of 40px) sits under a 64px HUD.

import { TILE, MAP_COLS, MAP_ROWS, HUD_HEIGHT } from './config.js';
import { castVisionCone } from './world.js';
import { guardAlertLevel } from './guards.js';

const FLOOR_A = '#2b3049';
const FLOOR_B = '#262b40';
const SHADOW_FLOOR = '#151a2c';
const GROUT = '#1d2236';

function mapY(row) {
  return HUD_HEIGHT + row * TILE;
}

function drawFloor(ctx, world) {
  for (let row = 0; row < MAP_ROWS; row += 1) {
    for (let col = 0; col < MAP_COLS; col += 1) {
      const ch = world.tiles[row][col];
      const x = col * TILE;
      const y = mapY(row);
      if (ch === '#') {
        ctx.fillStyle = '#3b4160';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#565d80';
        ctx.fillRect(x, y, TILE, 5);
        ctx.fillStyle = '#2c3150';
        ctx.fillRect(x, y + TILE - 4, TILE, 4);
        continue;
      }
      ctx.fillStyle = ch === ',' ? SHADOW_FLOOR : (col + row) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = GROUT;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      if (ch === ',') {
        ctx.fillStyle = 'rgba(90, 120, 220, 0.05)';
        ctx.fillRect(x, y, TILE, TILE);
      }
    }
  }
  // Warm pools of lamplight on the floor.
  for (const lamp of world.lamps) {
    const grad = ctx.createRadialGradient(lamp.x, HUD_HEIGHT + lamp.y, 6, lamp.x, HUD_HEIGHT + lamp.y, 110);
    grad.addColorStop(0, 'rgba(255, 196, 100, 0.20)');
    grad.addColorStop(1, 'rgba(255, 196, 100, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(lamp.x, HUD_HEIGHT + lamp.y, 110, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLamp(ctx, lamp) {
  const x = lamp.x;
  const y = HUD_HEIGHT + lamp.y;
  ctx.fillStyle = '#3a3230';
  ctx.fillRect(x - 2, y - 16, 4, 32);
  ctx.fillStyle = '#ffd98a';
  ctx.beginPath();
  ctx.arc(x, y - 16, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 217, 138, 0.35)';
  ctx.beginPath();
  ctx.arc(x, y - 16, 11, 0, Math.PI * 2);
  ctx.fill();
}

function drawCrate(ctx, x, y) {
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
  ctx.strokeStyle = '#8a6238';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 5, y + 5, TILE - 10, TILE - 10);
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 3);
  ctx.lineTo(x + TILE - 3, y + TILE - 3);
  ctx.moveTo(x + TILE - 3, y + 3);
  ctx.lineTo(x + 3, y + TILE - 3);
  ctx.stroke();
}

function drawPlant(ctx, x, y) {
  ctx.fillStyle = '#7a4a3a';
  ctx.fillRect(x + 10, y + 24, TILE - 20, 12);
  ctx.fillStyle = '#2f6b3a';
  ctx.beginPath();
  ctx.arc(x + 14, y + 16, 10, 0, Math.PI * 2);
  ctx.arc(x + 26, y + 12, 11, 0, Math.PI * 2);
  ctx.arc(x + 20, y + 22, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3f8b4a';
  ctx.beginPath();
  ctx.arc(x + 26, y + 12, 6, 0, Math.PI * 2);
  ctx.arc(x + 15, y + 17, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawStatue(ctx, x, y) {
  ctx.fillStyle = '#565c6e';
  ctx.fillRect(x + 8, y + 26, TILE - 16, 10);
  ctx.fillStyle = '#9aa0b2';
  ctx.beginPath();
  ctx.arc(x + TILE / 2, y + 14, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + TILE / 2 - 6, y + 16, 12, 12);
  ctx.fillStyle = '#c8ccd8';
  ctx.beginPath();
  ctx.arc(x + TILE / 2, y + 9, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawDisplayCase(ctx, x, y) {
  ctx.fillStyle = '#4a5a7a';
  ctx.fillRect(x + 5, y + 26, TILE - 10, 8);
  ctx.fillStyle = 'rgba(150, 200, 255, 0.16)';
  ctx.fillRect(x + 6, y + 6, TILE - 12, 20);
  ctx.strokeStyle = 'rgba(190, 220, 255, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 6, y + 6, TILE - 12, 20);
  ctx.fillStyle = '#ffd98a';
  ctx.beginPath();
  ctx.arc(x + TILE / 2, y + 16, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawCover(ctx, world) {
  for (let row = 0; row < MAP_ROWS; row += 1) {
    for (let col = 0; col < MAP_COLS; col += 1) {
      const ch = world.tiles[row][col];
      const x = col * TILE;
      const y = mapY(row);
      if (ch === 'C') drawCrate(ctx, x, y);
      if (ch === 'P') drawPlant(ctx, x, y);
      if (ch === 'S') drawStatue(ctx, x, y);
      if (ch === 'T') drawDisplayCase(ctx, x, y);
      if (ch === 'L') drawLamp(ctx, { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 });
    }
  }
}

function drawLoot(ctx, world, now) {
  for (const item of world.loot) {
    if (item.taken) continue;
    const x = item.x;
    const y = HUD_HEIGHT + item.y;
    const bob = Math.sin(now * 2.4 + item.col) * 2;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#ffd24a';
    ctx.fillRect(-6, -6, 12, 12);
    ctx.fillStyle = '#fff0a8';
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();
  }
}

function drawOpal(ctx, world, now) {
  const opal = world.opal;
  if (!opal || opal.taken) return;
  const x = opal.x;
  const y = HUD_HEIGHT + opal.y;
  const pulse = 0.5 + Math.sin(now * 3) * 0.2;
  const grad = ctx.createRadialGradient(x, y, 4, x, y, 46);
  grad.addColorStop(0, `rgba(111, 242, 255, ${0.5 * pulse + 0.2})`);
  grad.addColorStop(1, 'rgba(111, 242, 255, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4a5a7a';
  ctx.fillRect(x - 14, y + 6, 28, 12);
  ctx.fillStyle = '#6ff2ff';
  ctx.beginPath();
  ctx.moveTo(x, y - 16);
  ctx.lineTo(x + 10, y - 2);
  ctx.lineTo(x, y + 6);
  ctx.lineTo(x - 10, y - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 3, y - 8, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawExit(ctx, world) {
  const exit = world.exit;
  if (!exit) return;
  const x = exit.x;
  const y = HUD_HEIGHT + exit.y;
  ctx.fillStyle = '#123524';
  ctx.fillRect(x - 18, y - 18, 36, 36);
  ctx.strokeStyle = '#3ddc84';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 18, y - 18, 36, 36);
  ctx.fillStyle = '#3ddc84';
  ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', x, y);
  ctx.fillStyle = 'rgba(61, 220, 132, 0.25)';
  ctx.beginPath();
  ctx.arc(x, y, 26, 0, Math.PI * 2);
  ctx.fill();
}

function coneColors(level) {
  if (level === 'alarmed') return { fill: 'rgba(255, 64, 64, 0.28)', edge: 'rgba(255, 90, 90, 0.55)' };
  if (level === 'suspicious') return { fill: 'rgba(255, 150, 60, 0.24)', edge: 'rgba(255, 170, 80, 0.5)' };
  return { fill: 'rgba(255, 214, 90, 0.15)', edge: 'rgba(255, 214, 90, 0.35)' };
}

function drawVisionCone(ctx, world, guard) {
  const points = castVisionCone(world, guard);
  const level = guardAlertLevel(guard);
  const colors = coneColors(level);
  ctx.beginPath();
  ctx.moveTo(points[0].x, HUD_HEIGHT + points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, HUD_HEIGHT + points[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = colors.fill;
  ctx.fill();
  ctx.strokeStyle = colors.edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawGuard(ctx, guard, now) {
  const x = guard.x;
  const y = HUD_HEIGHT + guard.y;
  const level = guardAlertLevel(guard);
  // Body: navy uniform, cap, facing wedge.
  ctx.fillStyle = '#2c3a6e';
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c2447';
  ctx.beginPath();
  ctx.arc(x, y, 14, guard.facing - 0.9, guard.facing + 0.9);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath();
  ctx.arc(x + Math.cos(guard.facing) * 4, y + Math.sin(guard.facing) * 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#141a38';
  ctx.beginPath();
  ctx.arc(x, y - 3, 8, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(x - 8, y - 4, 16, 3);
  // Detection ring above the head.
  if (guard.detection > 2) {
    const frac = guard.detection / 100;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = level === 'alarmed' ? '#ff4040' : '#ffb03a';
    ctx.beginPath();
    ctx.arc(x, y, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.stroke();
  }
  // "?" while suspicious, "!" while alarmed or searching.
  const mark = level === 'alarmed' ? '!' : guard.state === 'suspicious' || guard.state === 'search' ? '?' : null;
  if (mark) {
    const bob = Math.sin(now * 5) * 2;
    ctx.fillStyle = mark === '!' ? '#ff4040' : '#ffb03a';
    ctx.font = 'bold 22px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mark, x, y - 30 + bob);
  }
}

function drawPlayer(ctx, player) {
  const x = player.x;
  const y = HUD_HEIGHT + player.y;
  // Noise ripple while walking.
  if (player.noisePulse > 0) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${player.noisePulse * 1.6})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 20 + (0.25 - player.noisePulse) * 120, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Shadow ring: Wren is harder to see in the dark.
  if (player.hidden) {
    ctx.fillStyle = 'rgba(90, 120, 220, 0.18)';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
  }
  // Hooded cloak.
  ctx.fillStyle = '#1a1a26';
  ctx.beginPath();
  ctx.arc(x, y, player.sneaking ? 11 : 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#23232e';
  ctx.beginPath();
  ctx.arc(x + Math.cos(player.facing) * 3, y + Math.sin(player.facing) * 3, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d8b25a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, player.sneaking ? 11 : 13, player.facing - 1.1, player.facing + 1.1);
  ctx.stroke();
  // Eyes in the dark.
  ctx.fillStyle = '#ffe9a8';
  const ex = Math.cos(player.facing);
  const ey = Math.sin(player.facing);
  const px = -ey;
  const py = ex;
  ctx.beginPath();
  ctx.arc(x + ex * 6 + px * 3, y + ey * 6 + py * 3, 1.6, 0, Math.PI * 2);
  ctx.arc(x + ex * 6 - px * 3, y + ey * 6 - py * 3, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function drawHud(ctx, state) {
  ctx.fillStyle = '#0d0f1c';
  ctx.fillRect(0, 0, 1280, HUD_HEIGHT);
  ctx.fillStyle = '#232842';
  ctx.fillRect(0, HUD_HEIGHT - 2, 1280, 2);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8e4d8';
  ctx.font = 'bold 17px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`LEVEL ${state.levelIndex + 1} — ${state.levelName}`, 20, 22);
  ctx.fillStyle = '#9aa0b8';
  ctx.font = '14px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(state.objective, 20, 46);

  // Hearts.
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < state.hearts ? '#ff5a6e' : '#333a55';
    ctx.beginPath();
    ctx.arc(560 + i * 26, 24, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#9aa0b8';
  ctx.font = '13px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LIVES', 599, 46);

  // Detection meter: the worst guard's certainty.
  const frac = state.maxDetection / 100;
  ctx.fillStyle = '#232842';
  ctx.fillRect(660, 14, 190, 16);
  ctx.fillStyle = frac >= 1 ? '#ff4040' : frac >= 0.45 ? '#ffb03a' : '#ffd65a';
  ctx.fillRect(660, 14, 190 * frac, 16);
  ctx.strokeStyle = '#3a4160';
  ctx.lineWidth = 1;
  ctx.strokeRect(660.5, 14.5, 190, 16);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(state.alertLabel, 755, 46);

  // Loot, score, timer.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd24a';
  ctx.font = 'bold 17px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`◆ ${state.lootTaken}/${state.lootTotal}`, 940, 22);
  ctx.fillStyle = '#e8e4d8';
  ctx.fillText(`SCORE ${state.score}`, 940, 46);
  ctx.fillStyle = '#9aa0b8';
  ctx.font = 'bold 17px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(formatTime(state.time), 1250, 22);
  ctx.font = '13px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(state.muted ? 'MUTED (M)' : 'M — mute', 1250, 46);
}

function overlay(ctx, alpha) {
  ctx.fillStyle = `rgba(5, 6, 12, ${alpha})`;
  ctx.fillRect(0, 0, 1280, 720);
}

function centeredText(ctx, text, y, size, color, weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 640, y);
}

function drawTitle(ctx, state) {
  overlay(ctx, 0.82);
  centeredText(ctx, 'NIGHT GALLERY', 180, 64, '#e8e4d8');
  centeredText(ctx, '— The Quiet Heist —', 240, 26, '#d8b25a');
  centeredText(ctx, state.intro, 310, 18, '#b8bdd2', 'normal');
  for (let i = 0; i < state.controls.length; i += 1) {
    centeredText(ctx, state.controls[i], 420 + i * 30, 17, '#8a90a8', 'normal');
  }
  const blink = 0.6 + Math.sin(state.now * 3) * 0.4;
  ctx.fillStyle = `rgba(255, 210, 74, ${blink})`;
  ctx.font = 'bold 22px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Press ENTER or click to begin', 640, 560);
  centeredText(ctx, `Best score: ${state.bestScore}`, 610, 15, '#6a7088', 'normal');
}

function drawIntro(ctx, state) {
  overlay(ctx, 0.78);
  centeredText(ctx, `LEVEL ${state.levelIndex + 1}`, 250, 22, '#d8b25a');
  centeredText(ctx, state.levelName, 300, 44, '#e8e4d8');
  centeredText(ctx, state.levelSubtitle, 350, 18, '#b8bdd2', 'normal');
  centeredText(ctx, 'Press ENTER to slip in', 450, 20, '#ffd24a');
}

function drawPause(ctx) {
  overlay(ctx, 0.7);
  centeredText(ctx, 'PAUSED', 330, 48, '#e8e4d8');
  centeredText(ctx, 'P — resume    R — restart level    M — mute', 400, 18, '#b8bdd2', 'normal');
}

function drawCaught(ctx, state) {
  overlay(ctx, 0.72);
  centeredText(ctx, 'SPOTTED!', 280, 52, '#ff5a6e');
  centeredText(ctx, 'A guard caught Wren in the open.', 340, 19, '#e8e4d8', 'normal');
  if (state.hearts > 0) {
    centeredText(ctx, `${state.hearts} ${state.hearts === 1 ? 'life' : 'lives'} left — press ENTER to try again`, 400, 19, '#ffd24a');
  } else {
    centeredText(ctx, 'No lives left — press ENTER to restart the level', 400, 19, '#ffd24a');
  }
}

function drawLevelComplete(ctx, state) {
  overlay(ctx, 0.78);
  centeredText(ctx, 'GALLERY CLEARED', 210, 46, '#3ddc84');
  centeredText(ctx, state.unseen ? 'UNSEEN — no guard ever raised the alarm' : 'The Opal is yours — but someone saw you', 270, 19, '#e8e4d8', 'normal');
  centeredText(ctx, `Loot ${state.lootTaken}/${state.lootTotal}  •  Time ${formatTime(state.time)}`, 330, 18, '#b8bdd2', 'normal');
  centeredText(ctx, `Level bonus ${state.levelBonus}  •  Total score ${state.score}`, 365, 18, '#ffd24a');
  centeredText(ctx, 'Press ENTER for the next gallery', 450, 20, '#e8e4d8');
}

function drawCampaignComplete(ctx, state) {
  overlay(ctx, 0.82);
  centeredText(ctx, 'THE QUIET HEIST', 200, 52, '#e8e4d8');
  centeredText(ctx, 'Three galleries. One Opal each. No alarm that mattered.', 265, 19, '#b8bdd2', 'normal');
  centeredText(ctx, `Final score ${state.score}`, 330, 26, '#ffd24a');
  centeredText(ctx, state.unseenTotal ? 'A perfect ghost — unseen in every gallery.' : 'A clean getaway, mostly.', 375, 18, '#e8e4d8', 'normal');
  centeredText(ctx, 'Press ENTER to play again', 450, 20, '#ffd24a');
}

function drawGameOver(ctx, state) {
  overlay(ctx, 0.82);
  centeredText(ctx, 'CAUGHT FOR GOOD', 280, 48, '#ff5a6e');
  centeredText(ctx, 'The museum keeps its Opal tonight.', 340, 19, '#e8e4d8', 'normal');
  centeredText(ctx, `Score ${state.score}  •  Best ${state.bestScore}`, 385, 18, '#b8bdd2', 'normal');
  centeredText(ctx, 'Press ENTER to try the gallery again', 450, 20, '#ffd24a');
}

export function drawGame(ctx, state) {
  ctx.clearRect(0, 0, 1280, 720);
  ctx.fillStyle = '#0b0d16';
  ctx.fillRect(0, 0, 1280, 720);

  drawFloor(ctx, state.world);
  drawExit(ctx, state.world);
  drawOpal(ctx, state.world, state.now);
  drawLoot(ctx, state.world, state.now);
  drawCover(ctx, state.world);
  for (const guard of state.guards) drawVisionCone(ctx, state.world, guard);
  for (const guard of state.guards) drawGuard(ctx, guard, state.now);
  if (state.phase !== 'title') drawPlayer(ctx, state.player);
  drawHud(ctx, state);

  if (state.phase === 'title') drawTitle(ctx, state);
  if (state.phase === 'intro') drawIntro(ctx, state);
  if (state.phase === 'paused') drawPause(ctx);
  if (state.phase === 'caught') drawCaught(ctx, state);
  if (state.phase === 'levelComplete') drawLevelComplete(ctx, state);
  if (state.phase === 'campaignComplete') drawCampaignComplete(ctx, state);
  if (state.phase === 'gameOver') drawGameOver(ctx, state);

  // Bottom hint line during play.
  if (state.phase === 'playing') {
    ctx.fillStyle = 'rgba(138, 144, 168, 0.85)';
    ctx.font = '13px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SHIFT — sneak in the dark   •   Lamps light you up   •   Walk softly near guards', 640, 704);
  }
}
