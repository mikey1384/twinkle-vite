import { createServer } from 'node:http';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createTradePreviewPage } from '../test/fixtures/tradePreview.js';
const html = await createTradePreviewPage();
const folder = fileURLToPath(
  new URL('../../work/trade-interface/', import.meta.url)
);
mkdirSync(folder, { recursive: true });
writeFileSync(`${folder}preview.html`, html);
const port = Number(process.argv[2] || 3000);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error('Invalid preview port');
const server = createServer((_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(readFileSync(`${folder}preview.html`));
});
server.listen(port, '127.0.0.1', () =>
  console.log(
    `Trade preview ready at http://localhost:${port} (PID ${process.pid})`
  )
);
function stop() {
  server.close(() => process.exit(0));
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
