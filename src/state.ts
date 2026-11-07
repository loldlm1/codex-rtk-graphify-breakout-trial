export const WIDTH = 720;
export const HEIGHT = 520;

export interface Rectangle { x: number; y: number; width: number; height: number }
export interface Brick extends Rectangle { alive: boolean; row: number }
export interface Controls { left: boolean; right: boolean; pointerX: number | null }
export interface ControlSource { read(): Controls; clear(): void }
export interface GameState {
  status: 'playing' | 'paused' | 'won' | 'lost';
  score: number;
  lives: number;
  paddle: Rectangle;
  ball: { x: number; y: number; vx: number; vy: number; radius: number };
  bricks: Brick[];
}

export function createGameState(): GameState {
  return {
    status: 'playing', score: 0, lives: 3,
    paddle: { x: 305, y: 476, width: 110, height: 14 },
    ball: { x: 360, y: 440, vx: 150, vy: -270, radius: 7 },
    bricks: Array.from({ length: 40 }, (_, index) => ({
      x: 36 + (index % 8) * 82,
      y: 66 + Math.floor(index / 8) * 30,
      width: 74, height: 20,
      row: Math.floor(index / 8), alive: true,
    })),
  };
}
