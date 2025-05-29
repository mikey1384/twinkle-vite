// Chess puzzle validation thresholds

/**
 * Minimum centipawn advantage required to accept alternative moves
 * 150 = 1.5 pawns (accepts some bookish sidelines)
 * 200 = 2.0 pawns (more conservative)
 */
export const WIN_THRESH_CP = 150;

/**
 * Maximum depth for mate detection fallback
 * 0 = only immediate mates
 */
export const WIN_THRESH_MATE = 0;

/**
 * Engine evaluation timeout in milliseconds
 */
export const ENGINE_TIMEOUT_MS = 5000;
