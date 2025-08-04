/**
 * Formateador de números y texto en español para Spikepulse
 * @module SpanishFormatter
 */

export class SpanishFormatter {
    /**
     * Formatea números usando convenciones españolas
     * @param {number} number - Número a formatear
     * @param {number} decimals - Número de decimales
     * @returns {string} Número formateado
     */
    static formatNumber(number, decimals = 0) {
        return number.toLocaleString('es-ES', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }
    
    /**
     * Formatea distancia con unidades españolas
     * @param {number} distance - Distancia en metros
     * @returns {string} Distancia formateada
     */
    static formatDistance(distance) {
        return `${this.formatNumber(distance, 1)}m`;
    }
    
    /**
     * Formatea tiempo con unidades españolas
     * @param {number} seconds - Tiempo en segundos
     * @returns {string} Tiempo formateado
     */
    static formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}min ${this.formatNumber(remainingSeconds, 0)}s`;
        }
        return `${this.formatNumber(seconds, 1)}s`;
    }
    
    /**
     * Formatea puntuación
     * @param {number} score - Puntuación
     * @returns {string} Puntuación formateada
     */
    static formatScore(score) {
        return this.formatNumber(score);
    }
    
    /**
     * Formatea velocidad
     * @param {number} velocity - Velocidad
     * @returns {string} Velocidad formateada
     */
    static formatVelocity(velocity) {
        return `${this.formatNumber(velocity, 1)} m/s`;
    }
}