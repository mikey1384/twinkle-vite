import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require(
  '/Users/mikey/.npm-packages/lib/node_modules/playwright'
);
const repo = fileURLToPath(new URL('..', import.meta.url));

// Exercise the actual board, square, piece and spoiler components. The fixture
// changes the same pending-move props that the modal changes on propose/cancel;
// move validation and network requests are outside this layout regression.
const fixture = `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Chess from './src/containers/Chat/Chess/Game';
import Omok from './src/containers/Chat/Omok/Game';
const noOp = () => {};
const position = Array.from({ length: 64 }, () => ({}));
for (const [index, type, color] of [
  [0, 'rook', 'white'], [2, 'king', 'white'], [3, 'king', 'white'],
  [4, 'queen', 'white'], [5, 'bishop', 'white'], [6, 'knight', 'white'],
  [7, 'rook', 'white'], [17, 'bishop', 'white'], [19, 'pawn', 'white'],
  [20, 'pawn', 'white'], [21, 'pawn', 'white'], [22, 'pawn', 'white'],
  [23, 'pawn', 'white'], [25, 'queen', 'black'], [32, 'pawn', 'white'],
  [44, 'pawn', 'black'], [45, 'pawn', 'black'], [49, 'pawn', 'black'],
  [50, 'knight', 'black'], [56, 'rook', 'black'], [57, 'pawn', 'black'],
  [58, 'bishop', 'black'], [59, 'king', 'black'], [61, 'bishop', 'black'],
  [62, 'knight', 'black'], [63, 'rook', 'black']
]) position[index] = { type, color };
position[3].state = 'blurred';
const stones = Array.from({ length: 19 }, () => Array(19).fill(null));
stones[4][8] = 'white';
stones[9][9] = 'black';
function Fixture() {
  const [pending, setPending] = useState(false);
  const [color, setColor] = useState('black');
  const [size, setSize] = useState('regular');
  window.configureBoard = (color, size) => { setColor(color); setSize(size); };
  const squares = position.map(piece => ({ ...piece }));
  if (pending) { squares[25] = {}; squares[33] = { type: 'queen', color: 'black' }; }
  if (color === 'white') squares.reverse();
  const board = stones.map(row => row.slice());
  if (pending) board[10][10] = 'black';
  const columns = Array.from({ length: 19 }, (_, i) => String.fromCharCode(65 + i));
  const rows = Array.from({ length: 19 }, (_, i) => 19 - i);
  if (color === 'white') { columns.reverse(); rows.reverse(); }
  return <main data-color={color} data-size={size} data-pending={pending}>
    <button id="cancel" onClick={() => setPending(false)}>Cancel move</button>
    <section id="chess"><Chess size={size} loading={false} interactable={!pending}
      myColor={color} squares={squares} spoilerOff onClick={() => setPending(true)}
      onCastling={noOp} onSpoilerClick={noOp} opponentName="Test" /></section>
    <section id="omok"><Omok
      boardSizeStyle={{ '--omok-board-size': '250px', '--omok-axis-size': '16px' }}
      boardVisible colLabels={columns} rowLabels={rows} interactable isMyTurn
      hasPendingMove={pending} loading={false} lastMovePosition={{ row: 9, col: 9 }}
      myAssignedColor={color} onCellClick={() => setPending(true)} onReveal={noOp}
      winningMap={{}} boardToRender={board} /></section>
  </main>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
`;

let bundlePromise;
function compileFixture() {
  const stubs = {
    '~/helpers': 'export const isTablet = () => false;',
    '~/components/Icon': 'export default function Icon() { return null; }',
    '~/components/Loading': 'export default function Loading() { return null; }',
    './CastlingButton': 'export default function Castling() { return null; }',
    '~/constants/defaultValues':
      'export const cloudFrontURL = "https://assets.invalid";',
    '~/constants/css': `
      export const mobileMaxWidth = '767px', tabletMaxWidth = '1024px', borderRadius = '8px';
      export const Color = new Proxy({}, { get: (_, key) => () =>
        key === 'white' ? '#fff' : key === 'black' ? '#000' : '#aa7755' });`
  };
  bundlePromise ||= build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'transform',
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [{
      name: 'chat-board-geometry',
      setup(builder) {
        builder.onResolve({ filter: /.*/ }, (args) => {
          if (Object.hasOwn(stubs, args.path)) {
            return { path: args.path, namespace: 'stub' };
          }
          if (args.path.startsWith('~/')) {
            return builder.resolve(path.join(repo, 'src', args.path.slice(2)), {
              resolveDir: repo, kind: args.kind
            });
          }
        });
        builder.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => ({
          contents: stubs[args.path], loader: 'jsx', resolveDir: repo
        }));
      }
    }]
  });
  return bundlePromise;
}

async function checkGeometry(page, label) {
  const measurements = await page.evaluate(() => {
    const rect = (element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    return ['chess', 'omok'].map((game) => {
      const cells = [...document.querySelectorAll(`[data-${game}-index]`)];
      return {
        game,
        board: rect(cells[0].parentElement),
        cells: cells.map(rect)
      };
    });
  });
  for (const { game, board, cells } of measurements) {
    const count = game === 'chess' ? 8 : 19;
    assert.equal(cells.length, count * count);
    assert.ok(board.width > 100, `${label}: ${game} has no board width`);
    assert.ok(Math.abs(board.width - board.height) < 0.1,
      `${label}: ${game} board is ${board.width} × ${board.height}`);
    const side = board.width / count;
    cells.forEach((cell, index) => {
      const expectedX = board.x + (index % count) * side;
      const expectedY = board.y + Math.floor(index / count) * side;
      assert.ok(Math.abs(cell.width - side) < 0.1 && Math.abs(cell.height - side) < 0.1,
        `${label}: ${game} cell ${index} is ${cell.width} × ${cell.height}, expected ${side}`);
      assert.ok(Math.abs(cell.x - expectedX) < 0.1 && Math.abs(cell.y - expectedY) < 0.1,
        `${label}: ${game} cell ${index} is out of alignment`);
    });
  }
}

for (const [name, engine] of [['webkit', webkit], ['chromium', chromium]]) {
  test(`${name}: Chess and Omok retain square cells across move cancellation`,
    { timeout: 60_000 }, async () => {
      const bundle = await compileFixture();
      const browser = await engine.launch({ headless: true, timeout: 10_000 });
      try {
        for (const width of [390, 1024]) {
          const page = await browser.newPage({
            viewport: { width, height: 844 },
            isMobile: width === 390,
            hasTouch: width === 390
          });
          page.setDefaultTimeout(5000);
          const errors = [];
          page.on('pageerror', (error) => errors.push(error.message));
          // Deterministic local image responses; no CDN or production access.
          await page.route('**/*', (route) => {
            const piece = path.basename(new URL(route.request().url()).pathname, '.svg');
            const symbols = { WhitePawn: '♙', WhiteBishop: '♗', WhiteKnight: '♘', WhiteRook: '♖', WhiteQueen: '♕', WhiteKing: '♔', BlackPawn: '♟', BlackBishop: '♝', BlackKnight: '♞', BlackRook: '♜', BlackQueen: '♛', BlackKing: '♚' };
            return route.fulfill({ contentType: 'image/svg+xml',
              body: `<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 45 45"><text x="22.5" y="36" text-anchor="middle" font-size="40">${symbols[piece] || ''}</text></svg>` });
          });
          await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div>');
          await page.addStyleTag({ content: readFileSync(path.join(repo, 'src/styles.css'), 'utf8') +
            'section{margin:20px}#chess{font:14px Century Gothic,Futura,sans-serif}.light{background:#fee2e2}.dark{background:#fca5a5}' });
          await page.addScriptTag({ content: bundle.outputFiles[0].text });
          await page.locator('[data-chess-index="63"]').waitFor({ state: 'attached' });
          for (const color of ['black', 'white']) {
            for (const size of ['regular', 'compact', 'inline']) {
              await page.evaluate(({ color, size }) => window.configureBoard(color, size), { color, size });
              await page.locator(`main[data-color="${color}"][data-size="${size}"]`).waitFor();
              const label = `${name} ${width} ${color} ${size}`;
              await checkGeometry(page, `${label} before move`);
              for (const game of ['chess', 'omok']) {
                await page.locator(`[data-${game}-index="0"]`).click();
                await page.locator('main[data-pending="true"]').waitFor();
                await checkGeometry(page, `${label} ${game} preview`);
                await page.locator('#cancel').click();
                await page.locator('main[data-pending="false"]').waitFor();
                await checkGeometry(page, `${label} after ${game} cancellation`);
              }
              if (process.env.CHAT_BOARD_SCREENSHOTS && color === 'black' && size === 'regular') {
                mkdirSync(process.env.CHAT_BOARD_SCREENSHOTS, { recursive: true });
                await page.screenshot({ path: path.join(process.env.CHAT_BOARD_SCREENSHOTS,
                  `${name}-${width}.png`), fullPage: true });
              }
            }
          }
          assert.deepEqual(errors, []);
          await page.close();
        }
      } finally {
        await browser.close();
      }
    });
}
