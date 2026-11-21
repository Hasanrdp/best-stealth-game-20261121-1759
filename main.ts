// Night Gallery — the entrypoint (Node 22, standard library only).
//
// The game itself is plain static files under game/ (index.html plus ES
// modules, no library, no network request). This program hands it in: it
// copies game/ and screenshots/ from beside this file into /output and
// writes /output/dossier.json — the summary the judge reads — with the
// vendored make.fun library.
//
// Run it locally with MAKEFUN_OUTPUT_DIR set, e.g.:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps, as the kit's gate states them: the dossier text is
// capped at 160 KiB; screenshots are at most 4 files of 256 KiB each; game/
// holds at most 993 files and directories and 48 MiB in all, with no path
// over 1,000 bytes. The whole of /output shares the platform's own cap of
// 1,000 entries and 64 MiB, so the dossier is written to fit inside it.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
