// Core game logic — extracted for testability.

/**
 * AABB collision between two rectangles {x, y, w, h}.
 */
export function rectCollide(r1, r2) {
    return !(r2.x > r1.x + r1.w ||
        r2.x + r2.w < r1.x ||
        r2.y > r1.y + r1.h ||
        r2.y + r2.h < r1.y);
}

/**
 * Clamp entity position inside [0, width) × [0, height).
 * Mutates the entity in place.
 */
export function clampEntity(entity, width, height) {
    if (entity.x < 0) entity.x = 0;
    if (entity.y < 0) entity.y = 0;
    if (entity.x + entity.w > width) entity.x = width - entity.w;
    if (entity.y + entity.h > height) entity.y = height - entity.h;
}

/**
 * Random integer in [min, max].
 */
export function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// ---------- Constants ----------
export const WIDTH = 800;
export const HEIGHT = 600;
export const PLAYER_SIZE = 26;
export const ENEMY_SIZE = 26;
export const GEM_SIZE = 16;
export const PLAYER_SPEED = 4.6;
export const ENEMY_SPEED = 2.8;

/**
 * Generate `count` non-overlapping gems that don't collide with the player or enemies.
 * @param {number} count
 * @param {{x:number,y:number,w:number,h:number}} player
 * @param {{x:number,y:number,w:number,h:number}[]} enemies
 * @returns {{x:number,y:number,w:number,h:number}[]}
 */
export function generateGems(count, player, enemies) {
    const newGems = [];
    const maxAttempts = 4000;
    let attempts = 0;
    while (newGems.length < count && attempts < maxAttempts) {
        const gemX = randomRange(10, WIDTH - GEM_SIZE - 10);
        const gemY = randomRange(10, HEIGHT - GEM_SIZE - 10);
        const candidateGem = { x: gemX, y: gemY, w: GEM_SIZE, h: GEM_SIZE };
        let collide = false;
        if (rectCollide(candidateGem, { x: player.x, y: player.y, w: PLAYER_SIZE, h: PLAYER_SIZE })) collide = true;
        for (let e of enemies) {
            if (rectCollide(candidateGem, { x: e.x, y: e.y, w: ENEMY_SIZE, h: ENEMY_SIZE })) {
                collide = true;
                break;
            }
        }
        for (let g of newGems) {
            if (rectCollide(candidateGem, g)) {
                collide = true;
                break;
            }
        }
        if (!collide) {
            newGems.push(candidateGem);
        }
        attempts++;
    }
    // Fallback placement
    if (newGems.length < count) {
        for (let i = newGems.length; i < count; i++) {
            let placed = false;
            for (let tryY = 60; tryY < HEIGHT - 60 && !placed; tryY += 35) {
                for (let tryX = 60; tryX < WIDTH - 60 && !placed; tryX += 35) {
                    const fallbackGem = { x: tryX, y: tryY, w: GEM_SIZE, h: GEM_SIZE };
                    let coll = false;
                    if (rectCollide(fallbackGem, { x: player.x, y: player.y, w: PLAYER_SIZE, h: PLAYER_SIZE })) coll = true;
                    for (let e of enemies) if (rectCollide(fallbackGem, { x: e.x, y: e.y, w: ENEMY_SIZE, h: ENEMY_SIZE })) coll = true;
                    for (let g of newGems) if (rectCollide(fallbackGem, g)) coll = true;
                    if (!coll) {
                        newGems.push(fallbackGem);
                        placed = true;
                        break;
                    }
                }
            }
            if (!placed) newGems.push({ x: 100 + i * 40, y: 100, w: GEM_SIZE, h: GEM_SIZE });
        }
    }
    return newGems;
}

/**
 * Move an enemy one step towards the player center.
 * Mutates `enemy` in place.
 */
export function stepEnemy(enemy, player, speed = ENEMY_SPEED) {
    const playerCenterX = player.x + player.w / 2;
    const playerCenterY = player.y + player.h / 2;
    const enemyCenterX = enemy.x + enemy.w / 2;
    const enemyCenterY = enemy.y + enemy.h / 2;

    let dx = playerCenterX - enemyCenterX;
    let dy = playerCenterY - enemyCenterY;
    const length = Math.hypot(dx, dy);
    if (length > 0.01) {
        dx /= length;
        dy /= length;
    }
    enemy.x += dx * speed;
    enemy.y += dy * speed;
    clampEntity(enemy, WIDTH, HEIGHT);
}

/**
 * Compute the player's next position from pressed keys.
 * Returns a new {x, y} without mutating the original.
 */
export function computePlayerMove(player, keys, speed = PLAYER_SPEED) {
    let moveX = 0, moveY = 0;
    if (keys.ArrowUp || keys.w) moveY -= 1;
    if (keys.ArrowDown || keys.s) moveY += 1;
    if (keys.ArrowLeft || keys.a) moveX -= 1;
    if (keys.ArrowRight || keys.d) moveX += 1;

    if (moveX !== 0 || moveY !== 0) {
        const len = Math.hypot(moveX, moveY);
        moveX = moveX / len;
        moveY = moveY / len;
        return {
            x: player.x + moveX * speed,
            y: player.y + moveY * speed,
        };
    }
    return { x: player.x, y: player.y };
}
