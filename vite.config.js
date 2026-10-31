import { defineConfig } from 'vite';
import { rmSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';

function excludeLocalPreviewArchives() {
  let outputDir;

  return {
    name: 'exclude-local-preview-archives',
    apply: 'build',
    configResolved(config) {
      outputDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      for (const folder of ['dashboard-preview', 'petcare-preview']) {
        const outputPath = resolve(outputDir, folder);
        if (dirname(outputPath) === outputDir && outputPath.startsWith(`${outputDir}${sep}`)) {
          rmSync(outputPath, { recursive: true, force: true });
        }
      }
    },
  };
}

export default defineConfig({
  server: { port: 5173 },
  plugins: [excludeLocalPreviewArchives()],
});