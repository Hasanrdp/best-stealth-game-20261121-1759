// Night Gallery — the game loop and state machine.
// Phases: title -> intro -> playing <-> paused -> caught -> (retry | gameOver)
//      -> levelComplete -> intro (next) -> campaignComplete.
// With ?shot=<name> the game renders one fixed scene instead of looping.

import {
  LEVELS,
  STORY,
  HEARTS_PER_LEVEL,
  LOOT_POINTS,
  LEVEL_CLEAR_POINTS,
  UNSEEN_BONUS,
  TILE,
} from './config.js';
import { createWorld } from './world.js';
import { createGuard, updateGuard, hearNoise, guardAlertLevel } from './guards.js';
import { createPlayer, updatePlayer, decayNoise } from './player.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { drawGame } from './render.js';
import { applyShot } from './shots.js';
import { makeRandom } from './random.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput();
const audio = createAudio();
input.attach(canvas);

function loadBestScore() {
  try {
    return Number(window.localStorage.getItem('night-gallery-best') ?? 0) || 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score) {
  try {
    window.localStorage.setItem('night-gallery-best', String(score));
  } catch {
    // Private mode or no storage: the score just is not kept.
  }
}

const game = {
  phase: 'title',
  levelIndex: 0,
  world: null,
  player: null,
  guards: [],
  score: 0,
  scoreAtLevelStart: 0,
  lootTaken: 0,
  levelBonus: 0,
  hearts: HEARTS_PER_LEVEL,
  time: 0,
  totalTime: 0,
  unseenLevel: true,
  unseenTotal: true,
  maxDetection: 0,
  now: 0,
  bestScore: loadBestScore(),
  muted: false,
  rng: makeRandom(11),
  dust: [],
};

function makeDust(seed) {
  const rng = makeRandom(seed);
  const motes = [];
  for (let i = 0; i < 40; i += 1) {
    motes.push({
      x: rng() * 1280,
      y: 64 + rng() * 640,
      r: 0.8 + rng() * 1.8,
      speed: 4 + rng() * 8,
      phase: rng() * Math.PI * 2,
    });
  }
  return motes;
}

function loadLevel(index) {
  const level = LEVELS[index];
  game.levelIndex = index;
  game.world = createWorld(level);
  game.player = createPlayer(game.world.playerStart);
  game.guards = level.guards.map((def, i) => createGuard(def, i));
  game.lootTaken = 0;
  game.levelBonus = 0;
  game.time = 0;
  game.unseenLevel = true;
  game.hearts = HEARTS_PER_LEVEL;
  game.maxDetection = 0;
  game.rng = makeRandom(level.seed);
  game.dust = makeDust(level.seed);
}
game.loadLevel = loadLevel;

function startLevel() {
  game.scoreAtLevelStart = game.score;
  loadLevel(game.levelIndex);
  game.phase = 'intro';
}

function levelName() {
  return LEVELS[game.levelIndex].name;
}

function objectiveText() {
  if (!game.world) return '';
  return game.world.opal.taken
    ? 'Opal secured — reach the EXIT, unseen'
    : 'Steal the Moon Opal, then reach the EXIT';
}

function alertLabel() {
  if (game.maxDetection >= 100) return 'ALARM!';
  if (game.maxDetection >= 45) return 'SUSPICIOUS';
  if (game.maxDetection > 5) return 'WATCHED';
  return 'UNSEEN';
}

function advanceFromTitle() {
  audio.unlock();
  audio.click();
  audio.startAmbient();
  game.phase = 'intro';
}

function beginPlaying() {
  audio.unlock();
  audio.click();
  game.phase = 'playing';
}

function handleCaught() {
  game.hearts -= 1;
  game.unseenLevel = false;
  game.unseenTotal = false;
  audio.caught();
  audio.stopAmbient();
  if (game.hearts <= 0) {
    game.phase = 'gameOver';
    game.bestScore = Math.max(game.bestScore, game.score);
    saveBestScore(game.bestScore);
  } else {
    game.phase = 'caught';
  }
}

function retryLevel() {
  game.score = game.scoreAtLevelStart;
  loadLevel(game.levelIndex);
  game.phase = 'intro';
}

function completeLevel() {
  const timeBonus = Math.max(0, 400 - Math.floor(Math.max(0, game.time - 60)) * 2);
  game.levelBonus = LEVEL_CLEAR_POINTS + timeBonus + (game.unseenLevel ? UNSEEN_BONUS : 0);
  game.score += game.levelBonus;
  game.totalTime += game.time;
  audio.win();
  audio.stopAmbient();
  if (game.levelIndex + 1 >= LEVELS.length) {
    game.phase = 'campaignComplete';
    game.bestScore = Math.max(game.bestScore, game.score);
    saveBestScore(game.bestScore);
  } else {
    game.phase = 'levelComplete';
  }
}

function renderState() {
  return {
    world: game.world,
    player: game.player,
    guards: game.guards,
    levelIndex: game.levelIndex,
    levelName: levelName(),
    levelSubtitle: LEVELS[game.levelIndex].subtitle,
    objective: objectiveText(),
    lootTaken: game.lootTaken,
    lootTotal: game.world.loot.length,
    hearts: game.hearts,
    time: game.time,
    score: game.score,
    levelBonus: game.levelBonus,
    maxDetection: game.maxDetection,
    alertLabel: alertLabel(),
    muted: game.muted,
    phase: game.phase,
    now: game.now,
    intro: STORY.intro,
    controls: STORY.controls,
    bestScore: game.bestScore,
    unseen: game.unseenLevel,
    unseenTotal: game.unseenTotal,
  };
}

function updatePlaying(dt) {
  const step = updatePlayer(game.world, game.player, input, dt, game.now);
  if (step === 'walk') audio.footstep(false);
  if (step === 'sneak') audio.footstep(true);
  decayNoise(game.player, dt);

  // Footsteps carry: a guard close enough comes to listen.
  if (game.player.noisePulse > 0) {
    for (const guard of game.guards) hearNoise(guard, game.player.x, game.player.y);
  }

  let worst = 0;
  for (const guard of game.guards) {
    const events = updateGuard(game.world, guard, game.player, dt, game.now);
    for (const event of events) {
      if (event.type === 'alarm') audio.alarm();
      if (event.type === 'suspicious') audio.suspicious();
      if (event.type === 'lost') audio.lost();
      if (event.type === 'caught') {
        handleCaught();
        return;
      }
    }
    if (guard.detection > worst) worst = guard.detection;
    if (guard.state === 'chase') game.unseenLevel = false;
    // Audible guard steps when one walks near Wren.
    if (guard.stepPhase > 46 && Math.hypot(guard.x - game.player.x, guard.y - game.player.y) < 380) {
      guard.stepPhase = 0;
      audio.guardStep();
    }
  }
  game.maxDetection = worst;
  game.time += dt;

  // Loot.
  for (const item of game.world.loot) {
    if (item.taken) continue;
    if (Math.hypot(item.x - game.player.x, item.y - game.player.y) < 26) {
      item.taken = true;
      game.lootTaken += 1;
      game.score += LOOT_POINTS;
      audio.pickup();
    }
  }

  // The Opal.
  const opal = game.world.opal;
  if (opal && !opal.taken && Math.hypot(opal.x - game.player.x, opal.y - game.player.y) < 30) {
    opal.taken = true;
    audio.opal();
  }

  // The exit, once the Opal is in hand.
  const exit = game.world.exit;
  if (
    opal &&
    opal.taken &&
    exit &&
    Math.hypot(exit.x - game.player.x, exit.y - game.player.y) < 28
  ) {
    completeLevel();
  }
}

function handleKeys() {
  if (input.wasPressed('KeyM')) {
    game.muted = audio.toggleMute();
    if (!game.muted && game.phase === 'playing') audio.startAmbient();
  }
  if (input.wasPressed('KeyP')) {
    if (game.phase === 'playing') {
      game.phase = 'paused';
      audio.stopAmbient();
    } else if (game.phase === 'paused') {
      game.phase = 'playing';
      audio.startAmbient();
    }
  }
  if (input.wasPressed('KeyR') && (game.phase === 'playing' || game.phase === 'paused')) {
    retryLevel();
    return;
  }
  const confirm = input.wasPressed('Enter') || input.wasPressed('Space') || input.mouse.clicked;
  if (!confirm) return;
  if (game.phase === 'title') advanceFromTitle();
  else if (game.phase === 'intro') beginPlaying();
  else if (game.phase === 'paused') {
    game.phase = 'playing';
    audio.startAmbient();
  } else if (game.phase === 'caught') retryLevel();
  else if (game.phase === 'gameOver') retryLevel();
  else if (game.phase === 'levelComplete') {
    game.levelIndex += 1;
    startLevel();
  } else if (game.phase === 'campaignComplete') {
    game.score = 0;
    game.totalTime = 0;
    game.unseenTotal = true;
    game.levelIndex = 0;
    startLevel();
  }
}

let lastTs = 0;

function loop(ts) {
  const dt = Math.min(0.05, Math.max(0, (ts - lastTs) / 1000 || 0));
  lastTs = ts;
  game.now += dt;
  handleKeys();
  if (game.phase === 'playing') updatePlaying(dt);
  drawGame(ctx, renderState());
  input.endFrame();
  requestAnimationFrame(loop);
}

// Deterministic screenshot mode: one fixed scene, one frame, no loop.
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
if (shotName) {
  loadLevel(shotName === 'play2' ? 1 : 0);
  game.phase = 'title';
  if (applyShot(game, shotName)) {
    drawGame(ctx, renderState());
    document.title = `Night Gallery — shot ${shotName}`;
  } else {
    document.body.textContent = `unknown shot: ${shotName}`;
  }
} else {
  loadLevel(0);
  requestAnimationFrame(loop);
}
