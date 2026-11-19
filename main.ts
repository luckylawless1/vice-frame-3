// VICE FRAME 3 — entry point for the make.fun grader.
// Copies the static app and its screenshots into the output directory,
// then writes dossier.json there with the vendored dossier builder.
// Run with Node 22: `node main.ts` (MAKEFUN_OUTPUT_DIR overrides /output).

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'app'), join(outDir, 'app'), { recursive: true });
cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossierBytes = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossierBytes);

console.log(`VICE FRAME 3: app + screenshots copied, dossier.json written (${dossierBytes.length} bytes)`);
