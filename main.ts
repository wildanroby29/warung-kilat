// main.ts — the grader entry point for Warung Kilat.
// Copies the game and its screenshots into the grader's output folder and
// writes the dossier that describes the entry. Pure Node standard library,
// no network, no clock, no randomness: the same input always gives the
// same output, so the grader can run it twice and get identical bytes.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Where the grader wants the entry. The contract passes a writable
// directory; fall back to /output only when the variable is absent.
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// This file lives at the repository root, so the game and the screenshots
// sit right beside it.
const here = dirname(fileURLToPath(import.meta.url));
const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');

mkdirSync(outDir, { recursive: true });

// Copy the playable game and the four screenshots into the output.
cpSync(gameDir, join(outDir, 'game'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

// Build the dossier from the copied files and write it beside them.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
