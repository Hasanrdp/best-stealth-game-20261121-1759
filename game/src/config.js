// Night Gallery — level data and tuning.
//
// Tile legend (each map is 32 columns by 16 rows):
//   #  wall            .  marble floor      ,  shadow floor (dark, safe)
//   C  crate (cover)   P  potted plant      S  statue          T  display case
//   L  lamp (floor + warm light pool)      o  loot (small artifact)
//   O  the Moon Opal (objective)           X  exit door
//   *  Wren's starting tile
// Cover (C, P, S, T) blocks movement and a guard's line of sight.
// Shadow floor slows detection; lamp light speeds it up.
// Guard patrols are straight legs between walkable waypoints — every leg
// was checked against the map, so no patrol ever walks into a wall.

export const TILE = 40;
export const MAP_COLS = 32;
export const MAP_ROWS = 16;
export const HUD_HEIGHT = 64;
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

export const PLAYER_WALK_SPEED = 150;
export const PLAYER_SNEAK_SPEED = 86;
export const PLAYER_RADIUS = 13;

export const GUARD_PATROL_SPEED = 56;
export const GUARD_CHASE_SPEED = 168;
export const GUARD_SEARCH_SPEED = 74;
export const GUARD_VISION_RANGE = 195;
export const GUARD_VISION_HALF_ANGLE = 0.66; // radians, about 38 degrees
export const GUARD_HEAR_RADIUS = 85;

export const DETECTION_FILL_BASE = 58; // per second at point blank, lit, standing
export const DETECTION_DECAY = 30; // per second while unseen
export const SUSPICION_AT = 45; // guard stops and stares
export const ALARM_AT = 100; // guard gives chase
export const SHADOW_FACTOR = 0.35; // detection multiplier in shadow
export const LAMP_FACTOR = 1.6; // detection multiplier in lamplight
export const SNEAK_FACTOR = 0.55; // detection multiplier while sneaking

export const LOOT_POINTS = 150;
export const LEVEL_CLEAR_POINTS = 500;
export const UNSEEN_BONUS = 300;
export const HEARTS_PER_LEVEL = 3;

export const LEVELS = [
  {
    name: 'Gallery of Echoes',
    subtitle: 'Two guards. Learn their patrols, stay in the dark.',
    seed: 11,
    map: [
      '################################',
      '#*.....,,...................o..#',
      '#......,,...........P..........#',
      '#..C...,,..........#####.......#',
      '#......,,.....o....#...#..o....#',
      '#..P...,,..........#...#.......#',
      '#......,,...........O.#........#',
      '#......,,..........#...#.......#',
      '#......,,.....o....#####.......#',
      '#..o...,,......................#',
      '#......,,.....P........C.......#',
      '#......,,...........L..........#',
      '#..C...,,.....o........P.......#',
      '#......,,..................o...#',
      '#......,,.........L........X...#',
      '################################',
    ],
    guards: [
      {
        spawn: [27, 6],
        waypoints: [[27, 6], [27, 11], [18, 11], [18, 6]],
        pause: 1.2,
      },
      {
        spawn: [13, 3],
        waypoints: [[13, 3], [13, 12], [6, 12], [6, 3]],
        pause: 1.6,
      },
    ],
  },
  {
    name: 'The Marble Hall',
    subtitle: 'Three guards, bright lamps, long sightlines.',
    seed: 23,
    map: [
      '################################',
      '#*.....,,...........S......o...#',
      '#......,,...........C......L...#',
      '#..C...,,....o........#####....#',
      '#......,,...........#.....#....#',
      '#..P...,,....S......#.O...#..o.#',
      '#......,,...........#.....#....#',
      '#......,,....o......#####......#',
      '#..o...,,......................#',
      '#......,,....P......C......o...#',
      '#......,,...........L..........#',
      '#..C...,,....o..............P..#',
      '#......,,...........S..........#',
      '#......,,...........C......o...#',
      '#..P...,...L...............X...#',
      '################################',
    ],
    guards: [
      {
        spawn: [28, 7],
        waypoints: [[28, 7], [28, 12], [22, 12], [22, 8]],
        pause: 1.0,
      },
      {
        spawn: [10, 4],
        waypoints: [[10, 4], [16, 4], [16, 10], [10, 10]],
        pause: 1.4,
      },
      {
        spawn: [5, 13],
        waypoints: [[5, 13], [5, 3], [14, 3], [14, 13]],
        pause: 0.8,
      },
    ],
  },
  {
    name: 'The Vault Wing',
    subtitle: 'Four guards. The Opal is close — and so are they.',
    seed: 37,
    map: [
      '################################',
      '#*....,,,,..........C......o...#',
      '#.....,,,,..........P......L...#',
      '#..C..,,,,..........o#######...#',
      '#.....,,,,..........#.......#..#',
      '#..P...,,,,....C......O...#....#',
      '#.....,,,,..........#.......#..#',
      '#.....,,,,....o.....######.#...#',
      '#..o..,,,,..................P..#',
      '#.....,,,,..........S.......C..#',
      '#.....,,,,....o............L...#',
      '#..C...,,,,..........T......o..#',
      '#.....,,,,.....................#',
      '#..P..,,,,....o.....C.......X..#',
      '#.....,,,.........L............#',
      '################################',
    ],
    guards: [
      {
        spawn: [27, 5],
        waypoints: [[27, 5], [27, 10], [22, 10], [22, 8]],
        pause: 0.9,
      },
      {
        spawn: [8, 11],
        waypoints: [[8, 11], [8, 4], [15, 4], [15, 11]],
        pause: 1.1,
      },
      {
        spawn: [18, 12],
        waypoints: [[18, 12], [18, 8], [25, 8], [25, 12]],
        pause: 1.3,
      },
      {
        spawn: [13, 2],
        waypoints: [[13, 2], [13, 7], [6, 7], [6, 2]],
        pause: 1.5,
      },
    ],
  },
];

export const STORY = {
  title: 'NIGHT GALLERY',
  tagline: 'The Quiet Heist',
  intro:
    'Wren slips through the museum after closing. Take the Moon Opal, ' +
    'pocket what glitters, and reach the exit — unseen.',
  controls: [
    'WASD / Arrows — move',
    'SHIFT — sneak (slow, silent, harder to spot)',
    'M — mute    P — pause    R — restart level',
  ],
};
