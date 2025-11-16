import React, { useEffect, useMemo, useRef } from 'react';
import Phaser from 'phaser';
import { css } from '@emotion/css';

type Visibility = 'visible' | 'dimmed' | 'hidden';
interface GridPosition {
  row: number;
  col: number;
}

export interface BoardControls {
  moveCamera: (deltaRow: number, deltaCol: number) => void;
}

interface PhaserBoardProps {
  rows?: number;
  cols?: number;
  zoom?: number;
  onReady?: (controls: BoardControls) => void;
}

interface SceneOptions {
  rows: number;
  cols: number;
  zoom: number;
  onReadyRef: React.MutableRefObject<
    ((controls: BoardControls) => void) | undefined
  >;
}

const EXTRA_MARGIN = 2;
const CAMERA_TWEEN_DURATION = 220;
const VISIBLE_MANHATTAN_RADIUS = 2;

export default function PhaserBoard({
  rows = 17,
  cols = 17,
  zoom = 2.8,
  onReady
}: PhaserBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const onReadyRef = useRef<((controls: BoardControls) => void) | undefined>(
    undefined
  );
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  const sceneOptions = useMemo<SceneOptions>(
    () => ({ rows, cols, zoom, onReadyRef }),
    [rows, cols, zoom, onReadyRef]
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
    private cameraCoords = { row: 0, col: 0 };
    private currentTileSize = 0;
    private activeTween?: Phaser.Tweens.Tween;
    private controlsRegistered = false;
    private playerPosition: GridPosition = { row: 0, col: 0 };
    private playerSelected = true;

    constructor() {
      super('BoardScene');
    }

    create() {
      this.cameras.main.setBackgroundColor('#020308');
      this.cameras.main.setRoundPixels(true);
      this.drawBoard();
      this.scale.on('resize', this.handleResize, this);
    }

    shutdown() {
      this.scale.off('resize', this.handleResize, this);
      this.activeTween?.stop();
      this.boardContainer?.destroy(true);
      this.boardContainer = undefined;
      this.activeTween = undefined;
    }

    private handleResize() {
      if (this.activeTween) {
        this.activeTween.stop();
        this.activeTween = undefined;
      }
      this.boardContainer?.setPosition(0, 0);
      this.drawBoard();
    }

    private drawBoard() {
      const width = this.scale.width;
      const height = this.scale.height;
      if (!width || !height) return;

      const visibleCols = options.cols;
      const visibleRows = options.rows;
      const zoom = Math.max(1, options.zoom);
      const tileSize = Math.max(12, Math.min(width / visibleCols, height / visibleRows));
      this.currentTileSize = tileSize;

      if (!this.boardContainer || !this.boardContainer.active) {
        this.boardContainer = this.add.container(0, 0);
      } else {
        this.boardContainer.removeAll(true);
        this.boardContainer.setPosition(0, 0);
      }

      const { start: rowStart, end: rowEnd } = getRange(visibleRows, EXTRA_MARGIN);
      const { start: colStart, end: colEnd } = getRange(visibleCols, EXTRA_MARGIN);

      const cam = this.cameras.main;
      cam.setZoom(zoom);
      cam.centerOn(0, 0);

      const texturesCache = ensureGrassTextures(this);

      for (let r = rowStart; r <= rowEnd; r++) {
        for (let c = colStart; c <= colEnd; c++) {
          const gridRow = this.cameraCoords.row + r;
          const gridCol = this.cameraCoords.col + c;
          const x = c * tileSize;
          const y = r * tileSize;
          const variant = getTileVariant(gridRow, gridCol);
          const tileImage = this.add.image(x, y, texturesCache[variant]);
          tileImage.setDisplaySize(tileSize, tileSize);
          tileImage.setOrigin(0.5);
          this.boardContainer.add(tileImage);

          const border = this.add.rectangle(x, y, tileSize, tileSize);
          border.setFillStyle(0x000000, 0);
          border.setStrokeStyle(Math.max(1, tileSize * 0.03), 0x021403, 0.35);
          this.boardContainer.add(border);

          const visibility = getVisibilityForTile(
            gridRow,
            gridCol,
            this.playerPosition,
            this.playerSelected
          );
          if (visibility !== 'visible') {
            const fogAlpha = visibility === 'hidden' ? 0.78 : 0.42;
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

          const isPlayerTile =
            gridRow === this.playerPosition.row &&
            gridCol === this.playerPosition.col;
          const isMoveOption =
            this.playerSelected &&
            isWithinMoveRange(gridRow, gridCol, this.playerPosition);
          if (isMoveOption) {
            const highlight = this.add.rectangle(
              x,
              y,
              tileSize * 0.9,
              tileSize * 0.9,
              isPlayerTile ? 0xfff1c3 : 0x9fffd0,
              isPlayerTile ? 0.18 : 0.12
            );
            highlight.setOrigin(0.5);
            highlight.setDepth(6);
            highlight.setStrokeStyle(
              Math.max(1, tileSize * 0.05),
              isPlayerTile ? 0xffcc66 : 0x6bfcd5,
              isPlayerTile ? 0.9 : 0.5
            );
            if (!isPlayerTile) {
              highlight.setInteractive({ useHandCursor: true });
              highlight.on('pointerdown', () => {
                this.handleTileSelection(gridRow, gridCol);
              });
            }
            this.boardContainer.add(highlight);
          }
        }
      }

      this.renderPlayer(tileSize);
      this.registerControls();
    }

    private registerControls() {
      if (this.controlsRegistered) return;
      const moveCamera = (deltaRow: number, deltaCol: number) => {
        this.initiateCameraMove(deltaRow, deltaCol);
      };
      options.onReadyRef.current?.({ moveCamera });
      this.controlsRegistered = true;
    }

    private renderPlayer(tileSize: number) {
      if (!this.boardContainer) return;
      const relativeCol = this.playerPosition.col - this.cameraCoords.col;
      const relativeRow = this.playerPosition.row - this.cameraCoords.row;
      const x = relativeCol * tileSize;
      const y = relativeRow * tileSize;

      const shadow = this.add.ellipse(
        x,
        y + tileSize * 0.22,
        tileSize * 0.65,
        tileSize * 0.2,
        0x000000,
        0.28
      );
      shadow.setOrigin(0.5);
      shadow.setDepth(9);
      this.boardContainer.add(shadow);

      const playerMarker = this.add.circle(x, y, tileSize * 0.32, 0xfff4d2, 1);
      playerMarker.setStrokeStyle(
        Math.max(2, tileSize * 0.08),
        this.playerSelected ? 0xffc857 : 0x102030,
        1
      );
      playerMarker.setDepth(10);
      playerMarker.setInteractive({ useHandCursor: true });
      playerMarker.on('pointerdown', () => {
        if (!this.playerSelected) {
          this.playerSelected = true;
          this.drawBoard();
        } else {
          this.tweens.add({
            targets: playerMarker,
            scale: 0.92,
            duration: 90,
            yoyo: true,
            ease: 'Sine.easeInOut'
          });
        }
      });
      this.boardContainer.add(playerMarker);
    }

    private handleTileSelection(targetRow: number, targetCol: number) {
      if (
        !this.playerSelected ||
        this.activeTween ||
        !isWithinMoveRange(targetRow, targetCol, this.playerPosition)
      ) {
        return;
      }
      if (
        targetRow === this.playerPosition.row &&
        targetCol === this.playerPosition.col
      ) {
        return;
      }
      this.playerPosition = { row: targetRow, col: targetCol };
      this.drawBoard();
    }

    private initiateCameraMove(deltaRow: number, deltaCol: number) {
      if (!this.boardContainer || this.activeTween || !this.currentTileSize) return;
      const deltaX = -deltaCol * this.currentTileSize;
      const deltaY = -deltaRow * this.currentTileSize;
      this.activeTween = this.tweens.add({
        targets: this.boardContainer,
        x: deltaX,
        y: deltaY,
        duration: CAMERA_TWEEN_DURATION,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.cameraCoords.row += deltaRow;
          this.cameraCoords.col += deltaCol;
          this.boardContainer?.setPosition(0, 0);
          this.activeTween = undefined;
          this.drawBoard();
        },
        onStop: () => {
          this.activeTween = undefined;
          this.boardContainer?.setPosition(0, 0);
        }
      });
    }
  };
}

function getRange(size: number, margin: number) {
  const half = Math.floor(size / 2);
  const start = -half - margin;
  const end = start + size + margin * 2 - 1;
  return { start, end };
}

function getTileVariant(row: number, col: number) {
  const hash = row * 31 + col * 17;
  return Math.abs(hash) % grassShades.length;
}

function isWithinMoveRange(
  row: number,
  col: number,
  playerPosition: GridPosition
) {
  const distance =
    Math.abs(row - playerPosition.row) + Math.abs(col - playerPosition.col);
  return distance <= VISIBLE_MANHATTAN_RADIUS;
}

function getVisibilityForTile(
  row: number,
  col: number,
  playerPosition: GridPosition,
  playerSelected: boolean
): Visibility {
  if (row === playerPosition.row && col === playerPosition.col) {
    return 'visible';
  }
  if (!playerSelected) {
    return 'hidden';
  }
  return isWithinMoveRange(row, col, playerPosition) ? 'visible' : 'hidden';
}

function ensureGrassTextures(scene: Phaser.Scene) {
  const cache: Record<number, string> = {};
  grassShades.forEach((shades, idx) => {
    const key = `grass-${idx}`;
    if (!scene.textures.exists(key)) {
      const size = 48;
      const texture = scene.textures.createCanvas(key, size, size);
      if (!texture) return;
      const ctx = texture.context;
      ctx.fillStyle = shades[1];
      ctx.fillRect(0, 0, size, size);

      ctx.fillStyle = shades[0];
      ctx.globalAlpha = 0.25;
      for (let y = 0; y < size; y += 4) {
        const offset = Math.floor(y / 4) % 2 === 0 ? 0 : 2;
        for (let x = offset; x < size; x += 4) {
          ctx.fillRect(x, y, 2, 2);
        }
      }

      ctx.fillStyle = shades[2];
      ctx.globalAlpha = 0.12;
      for (let y = 0; y < size; y += 6) {
        ctx.fillRect(0, y, size, 1);
      }
      for (let x = 0; x < size; x += 6) {
        ctx.fillRect(x, 0, 1, size);
      }
      ctx.globalAlpha = 1;

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
