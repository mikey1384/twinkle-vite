import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIST_DIR = new URL('../dist/', import.meta.url);
const DISALLOWED_PATTERNS = ['jsxDEV', 'jsx-dev-runtime'];

const offenders = [];

await scanDirectory(DIST_DIR);

if (offenders.length > 0) {
  console.error(
    'Production build contains React dev JSX runtime markers:\n' +
      offenders.map((file) => `- ${file}`).join('\n')
  );
  process.exit(1);
}

async function scanDirectory(directoryUrl) {
  const entries = await readdir(directoryUrl, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const entryUrl = new URL(
        `${entry.name}${entry.isDirectory() ? '/' : ''}`,
        directoryUrl
      );
      if (entry.isDirectory()) {
        await scanDirectory(entryUrl);
        return;
      }
      if (!entry.name.endsWith('.js')) return;

      const content = await readFile(entryUrl, 'utf8');
      if (DISALLOWED_PATTERNS.some((pattern) => content.includes(pattern))) {
        offenders.push(join(directoryUrl.pathname, entry.name));
      }
    })
  );
}
