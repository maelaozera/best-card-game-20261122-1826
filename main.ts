// Ember Duel — entrypoint for make.fun (Node 22, standard library only).
// The game itself is plain static files under game/ (game/index.html plus its
// ES modules, no library, no network request). This program hands the entry
// in: it copies game/ and screenshots/ from beside this file into the output
// directory and writes /output/dossier.json with the vendored make.fun
// library, which is what the judge reads.
//
// Run it locally like this:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

const screenshotsDir = join(outputDir, 'screenshots');
mkdirSync(screenshotsDir, { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), screenshotsDir, { recursive: true });
}

// Caps from the competition's gate: at most 4 screenshots of 256 KiB each,
// game/ at most 993 files and 48 MiB, every game path at most 1000 bytes,
// and the dossier text capped at 160 KiB. An entry over a cap is refused
// before it is ever judged, so the dossier builder enforces them here.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`Ember Duel handed in to ${outputDir} (dossier ${dossier.length} bytes).`);
