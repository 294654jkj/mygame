import { describe, it, expect } from 'vitest';
import {
    rectCollide,
    clampEntity,
    randomRange,
    generateGems,
    stepEnemy,
    computePlayerMove,
    WIDTH,
    HEIGHT,
    PLAYER_SIZE,
    ENEMY_SIZE,
    GEM_SIZE,
    PLAYER_SPEED,
    ENEMY_SPEED,
} from './game-logic.js';

// --------------- rectCollide ---------------
describe('rectCollide', () => {
    it('returns true for overlapping rectangles', () => {
        const a = { x: 0, y: 0, w: 10, h: 10 };
        const b = { x: 5, y: 5, w: 10, h: 10 };
        expect(rectCollide(a, b)).toBe(true);
    });

    it('returns false for non-overlapping rectangles (right gap)', () => {
        const a = { x: 0, y: 0, w: 10, h: 10 };
        const b = { x: 20, y: 0, w: 10, h: 10 };
        expect(rectCollide(a, b)).toBe(false);
    });

    it('returns false for non-overlapping rectangles (below gap)', () => {
        const a = { x: 0, y: 0, w: 10, h: 10 };
        const b = { x: 0, y: 20, w: 10, h: 10 };
        expect(rectCollide(a, b)).toBe(false);
    });

    it('returns true when rectangles share an edge (touching)', () => {
        const a = { x: 0, y: 0, w: 10, h: 10 };
        const b = { x: 10, y: 0, w: 10, h: 10 };
        // x: a.x+a.w = 10, b.x = 10 → r2.x > r1.x+r1.w is false, r2.x+r2.w < r1.x is false
        // So they're considered colliding at the edge
        expect(rectCollide(a, b)).toBe(true);
    });

    it('returns true when one rectangle contains the other', () => {
        const a = { x: 0, y: 0, w: 100, h: 100 };
        const b = { x: 10, y: 10, w: 5, h: 5 };
        expect(rectCollide(a, b)).toBe(true);
    });

    it('returns true for identical rectangles', () => {
        const a = { x: 50, y: 50, w: 20, h: 20 };
        expect(rectCollide(a, { ...a })).toBe(true);
    });
});

// --------------- clampEntity ---------------
describe('clampEntity', () => {
    it('does nothing when entity is fully inside bounds', () => {
        const e = { x: 10, y: 10, w: 20, h: 20 };
        clampEntity(e, 100, 100);
        expect(e.x).toBe(10);
        expect(e.y).toBe(10);
    });

    it('clamps negative x to 0', () => {
        const e = { x: -5, y: 10, w: 20, h: 20 };
        clampEntity(e, 100, 100);
        expect(e.x).toBe(0);
    });

    it('clamps negative y to 0', () => {
        const e = { x: 10, y: -3, w: 20, h: 20 };
        clampEntity(e, 100, 100);
        expect(e.y).toBe(0);
    });

    it('clamps x when entity extends past right edge', () => {
        const e = { x: 90, y: 10, w: 20, h: 20 };
        clampEntity(e, 100, 100);
        expect(e.x).toBe(80); // 100 - 20
    });

    it('clamps y when entity extends past bottom edge', () => {
        const e = { x: 10, y: 95, w: 20, h: 20 };
        clampEntity(e, 100, 100);
        expect(e.y).toBe(80);
    });

    it('clamps both axes simultaneously', () => {
        const e = { x: -10, y: 200, w: 30, h: 30 };
        clampEntity(e, 100, 100);
        expect(e.x).toBe(0);
        expect(e.y).toBe(70);
    });
});

// --------------- randomRange ---------------
describe('randomRange', () => {
    it('returns values within [min, max]', () => {
        for (let i = 0; i < 200; i++) {
            const val = randomRange(5, 15);
            expect(val).toBeGreaterThanOrEqual(5);
            expect(val).toBeLessThanOrEqual(15);
        }
    });

    it('returns an integer', () => {
        const val = randomRange(0, 100);
        expect(Number.isInteger(val)).toBe(true);
    });

    it('handles min === max', () => {
        expect(randomRange(7, 7)).toBe(7);
    });
});

// --------------- generateGems ---------------
describe('generateGems', () => {
    const player = { x: WIDTH / 2, y: HEIGHT / 2, w: PLAYER_SIZE, h: PLAYER_SIZE };
    const enemies = [
        { x: 120, y: 480, w: ENEMY_SIZE, h: ENEMY_SIZE },
        { x: 620, y: 80, w: ENEMY_SIZE, h: ENEMY_SIZE },
    ];

    it('generates the requested number of gems', () => {
        const gems = generateGems(8, player, enemies);
        expect(gems.length).toBe(8);
    });

    it('all gems have correct size', () => {
        const gems = generateGems(5, player, enemies);
        for (const g of gems) {
            expect(g.w).toBe(GEM_SIZE);
            expect(g.h).toBe(GEM_SIZE);
        }
    });

    it('gems do not overlap with each other', () => {
        const gems = generateGems(8, player, enemies);
        for (let i = 0; i < gems.length; i++) {
            for (let j = i + 1; j < gems.length; j++) {
                expect(rectCollide(gems[i], gems[j])).toBe(false);
            }
        }
    });

    it('gems do not overlap with the player', () => {
        const gems = generateGems(8, player, enemies);
        const pRect = { x: player.x, y: player.y, w: PLAYER_SIZE, h: PLAYER_SIZE };
        for (const g of gems) {
            expect(rectCollide(g, pRect)).toBe(false);
        }
    });

    it('gems do not overlap with enemies', () => {
        const gems = generateGems(8, player, enemies);
        for (const g of gems) {
            for (const e of enemies) {
                const eRect = { x: e.x, y: e.y, w: ENEMY_SIZE, h: ENEMY_SIZE };
                expect(rectCollide(g, eRect)).toBe(false);
            }
        }
    });
});

// --------------- stepEnemy ---------------
describe('stepEnemy', () => {
    it('moves the enemy closer to the player', () => {
        const enemy = { x: 0, y: 0, w: ENEMY_SIZE, h: ENEMY_SIZE };
        const player = { x: 100, y: 100, w: PLAYER_SIZE, h: PLAYER_SIZE };
        const oldDist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        stepEnemy(enemy, player);
        const newDist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        expect(newDist).toBeLessThan(oldDist);
    });

    it('clamps enemy within canvas bounds', () => {
        const enemy = { x: WIDTH - 1, y: HEIGHT - 1, w: ENEMY_SIZE, h: ENEMY_SIZE };
        const player = { x: WIDTH + 100, y: HEIGHT + 100, w: PLAYER_SIZE, h: PLAYER_SIZE };
        stepEnemy(enemy, player);
        expect(enemy.x + enemy.w).toBeLessThanOrEqual(WIDTH);
        expect(enemy.y + enemy.h).toBeLessThanOrEqual(HEIGHT);
    });

    it('does not move if enemy is on top of player', () => {
        const enemy = { x: 50, y: 50, w: ENEMY_SIZE, h: ENEMY_SIZE };
        const player = { x: 50, y: 50, w: PLAYER_SIZE, h: PLAYER_SIZE };
        stepEnemy(enemy, player);
        // Should barely move (centers are close, not identical since sizes differ)
        expect(enemy.x).toBeCloseTo(50, 0);
        expect(enemy.y).toBeCloseTo(50, 0);
    });
});

// --------------- computePlayerMove ---------------
describe('computePlayerMove', () => {
    const basePlayer = { x: 100, y: 100, w: PLAYER_SIZE, h: PLAYER_SIZE };
    const noKeys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, s: false, a: false, d: false };

    it('does not move when no keys pressed', () => {
        const pos = computePlayerMove(basePlayer, noKeys);
        expect(pos.x).toBe(100);
        expect(pos.y).toBe(100);
    });

    it('moves up when ArrowUp is pressed', () => {
        const pos = computePlayerMove(basePlayer, { ...noKeys, ArrowUp: true });
        expect(pos.y).toBeLessThan(100);
        expect(pos.x).toBe(100);
    });

    it('moves down when s is pressed', () => {
        const pos = computePlayerMove(basePlayer, { ...noKeys, s: true });
        expect(pos.y).toBeGreaterThan(100);
    });

    it('moves left when a is pressed', () => {
        const pos = computePlayerMove(basePlayer, { ...noKeys, a: true });
        expect(pos.x).toBeLessThan(100);
    });

    it('moves right when ArrowRight is pressed', () => {
        const pos = computePlayerMove(basePlayer, { ...noKeys, ArrowRight: true });
        expect(pos.x).toBeGreaterThan(100);
    });

    it('normalizes diagonal movement', () => {
        const pos = computePlayerMove(basePlayer, { ...noKeys, ArrowUp: true, ArrowRight: true });
        const dx = pos.x - 100;
        const dy = pos.y - 100;
        const dist = Math.hypot(dx, dy);
        expect(dist).toBeCloseTo(PLAYER_SPEED, 5);
    });

    it('single-axis movement equals PLAYER_SPEED', () => {
        const pos = computePlayerMove(basePlayer, { ...noKeys, d: true });
        expect(pos.x - 100).toBeCloseTo(PLAYER_SPEED, 5);
    });
});
