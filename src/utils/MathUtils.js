/**
 * Utilidades matemáticas para Spikepulse
 * @module MathUtils
 */

export class MathUtils {
    /**
     * Interpola linealmente entre dos valores
     * @param {number} a - Valor inicial
     * @param {number} b - Valor final
     * @param {number} t - Factor de interpolación (0-1)
     * @returns {number} Valor interpolado
     */
    static lerp(a, b, t) {
        return a + (b - a) * Math.max(0, Math.min(1, t));
    }
    
    /**
     * Clampea un valor entre un mínimo y máximo
     * @param {number} value - Valor a clampear
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     * @returns {number} Valor clampeado
     */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    /**
     * Calcula la distancia entre dos puntos
     * @param {Object} p1 - Primer punto {x, y}
     * @param {Object} p2 - Segundo punto {x, y}
     * @returns {number} Distancia entre los puntos
     */
    static distance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Normaliza un ángulo a rango 0-2π
     * @param {number} angle - Ángulo en radianes
     * @returns {number} Ángulo normalizado
     */
    static normalizeAngle(angle) {
        while (angle < 0) angle += Math.PI * 2;
        while (angle >= Math.PI * 2) angle -= Math.PI * 2;
        return angle;
    }
    
    /**
     * Convierte grados a radianes
     * @param {number} degrees - Ángulo en grados
     * @returns {number} Ángulo en radianes
     */
    static toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    /**
     * Convierte radianes a grados
     * @param {number} radians - Ángulo en radianes
     * @returns {number} Ángulo en grados
     */
    static toDegrees(radians) {
        return radians * (180 / Math.PI);
    }
    
    /**
     * Genera un número aleatorio entre min y max
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     * @returns {number} Número aleatorio
     */
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    /**
     * Genera un entero aleatorio entre min y max (inclusive)
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     * @returns {number} Entero aleatorio
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}