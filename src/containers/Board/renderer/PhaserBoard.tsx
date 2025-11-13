import React, { useEffect, useMemo, useRef } from 'react';
import Phaser from 'phaser';
import { css } from '@emotion/css';

type Visibility = 'visible' | 'dimmed' | 'hidden';

interface TileData {
  r: number;
  c: number;
  variant: number;
  visibility: Visibility;
}

interface PhaserBoardProps {
  rows?: number;
  cols?: number;
  zoom?: number;
}

interface SceneOptions {
  rows: number;
  cols: number;
  zoom: number;
}

export default function PhaserBoard({
  rows = 17,
  cols = 17,
  zoom = 2.8
}: PhaserBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneOptions = useMemo<SceneOptions>(
    () => ({ rows, cols, zoom }),
    [rows, cols, zoom]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const BoardScene = createBoardScene(sceneOptions);

    const game = new Phaser.Game({
      type: Phaser.WEBGL,
      parent: container,
      backgroundColor: '#020308',
      width: container.clientWidth,
      height: container.clientHeight,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [BoardScene],
      banner: false,
      pixelArt: true,
      roundPixels: true
    });

    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, [sceneOptions]);

  return <div ref={containerRef} className={containerClass} />;
}

function createBoardScene(options: SceneOptions) {
  return class BoardScene extends Phaser.Scene {
    private boardContainer?: Phaser.GameObjects.Container;
    private tiles: TileData[] = [];

    constructor() {
      super('BoardScene');
    }

    init() {
      this.tiles = buildMap(options.rows, options.cols);
    }

    create() {
      this.cameras.main.setBackgroundColor('#020308');
      this.cameras.main.setRoundPixels(true);
      this.drawBoard();
      this.scale.on('resize', this.handleResize, this);
    }

    shutdown() {
      this.scale.off('resize', this.handleResize, this);
    }

    private handleResize() {
      this.drawBoard();
    }

    private drawBoard() {
      const width = this.scale.width;
      const height = this.scale.height;
      if (!width || !height) return;

      const cols = options.cols;
      const rows = options.rows;
      const zoom = Math.max(1, options.zoom);

      const tileSize = Math.max(12, Math.min(width / cols, height / rows));
      const boardWidth = tileSize * cols;
      const boardHeight = tileSize * rows;
      const startX = -boardWidth / 2 + tileSize / 2;
      const startY = -boardHeight / 2 + tileSize / 2;

      if (this.boardContainer) {
        this.boardContainer.destroy(true);
      }
      this.boardContainer = this.add.container(0, 0);

      const cam = this.cameras.main;
      cam.setZoom(zoom);
      cam.centerOn(0, 0);

      const texturesCache = ensureGrassTextures(this);

      for (const tile of this.tiles) {
        const x = startX + tile.c * tileSize;
        const y = startY + tile.r * tileSize;
        const textureKey = texturesCache[tile.variant];
        const tileImage = this.add.image(x, y, textureKey);
        tileImage.setDisplaySize(tileSize, tileSize);
        tileImage.setOrigin(0.5);
        this.boardContainer.add(tileImage);

        const border = this.add.rectangle(x, y, tileSize, tileSize);
        border.setFillStyle(0x000000, 0);
        border.setStrokeStyle(Math.max(1, tileSize * 0.05), 0x0e2612, 0.5);
        this.boardContainer.add(border);

        if (tile.visibility !== 'visible') {
          const fogAlpha = tile.visibility === 'hidden' ? 0.78 : 0.42;
          const fog = this.add.rectangle(
            x,
            y,
            tileSize,
            tileSize,
            0x020308,
            fogAlpha
          );
          fog.setOrigin(0.5);
          this.boardContainer.add(fog);
        }
      }
    }
  };
}

function buildMap(rows: number, cols: number): TileData[] {
  const centerR = (rows - 1) / 2;
  const centerC = (cols - 1) / 2;
  const visibleRadius = Math.max(4, Math.min(rows, cols) * 0.3);
  const dimmedRadius = visibleRadius * 1.6;

  const tiles: TileData[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const distance = Math.hypot(r - centerR, c - centerC);
      const visibility: Visibility =
        distance <= visibleRadius
          ? 'visible'
          : distance <= dimmedRadius
          ? 'dimmed'
          : 'hidden';
      tiles.push({
        r,
        c,
        variant: (r * 31 + c * 17) % grassShades.length,
        visibility
      });
    }
  }
  return tiles;
}

function ensureGrassTextures(scene: Phaser.Scene) {
  const cache: Record<number, string> = {};
  grassShades.forEach((shades, idx) => {
    const key = `grass-${idx}`;
    if (!scene.textures.exists(key)) {
      const size = 64;
      const texture = scene.textures.createCanvas(key, size, size);
      if (!texture) return;
      const ctx = texture.context;
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, shades[0]);
      gradient.addColorStop(0.65, shades[1]);
      gradient.addColorStop(1, shades[2]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      const highlight = ctx.createRadialGradient(
        size * 0.3,
        size * 0.3,
        size * 0.1,
        size * 0.3,
        size * 0.3,
        size
      );
      highlight.addColorStop(0, 'rgba(255,255,255,0.35)');
      highlight.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = highlight;
      ctx.fillRect(0, 0, size, size);
      texture.refresh();
    }
    cache[idx] = key;
  });
  return cache;
}

const grassShades: [string, string, string][] = [
  ['#57b46a', '#3e8d4c', '#2f6a3a'],
  ['#5ec271', '#419353', '#2f6a3a'],
  ['#54b169', '#3c894f', '#2d6638'],
  ['#4fb26b', '#3d8f55', '#2c683d']
];

const containerClass = css`
  width: 100%;
  height: 100%;
  position: relative;
`;
