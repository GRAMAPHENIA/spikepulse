/**
 * Logger - Sistema de logging para Spikepulse
 * @module Logger
 */

export class Logger {
    constructor(context = 'Spikepulse', level = 'info') {
        this.context = context;
        this.level = level;
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
    }

    /**
     * Verificar si el nivel de log está habilitado
     * @param {string} level - Nivel a verificar
     * @returns {boolean} True si está habilitado
     * @private
     */
    shouldLog(level) {
        return this.levels[level] >= this.levels[this.level];
    }

    /**
     * Formatear mensaje de log
     * @param {string} level - Nivel del log
     * @param {string} message - Mensaje
     * @param {*} data - Datos adicionales
     * @returns {Array} Argumentos formateados para console
     * @private
     */
    formatMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${this.context}] [${level.toUpperCase()}]`;
        
        if (data !== undefined) {
            return [prefix, message, data];
        }
        return [prefix, message];
    }

    /**
     * Log de debug
     * @param {string} message - Mensaje
     * @param {*} data - Datos adicionales
     */
    debug(message, data) {
        if (this.shouldLog('debug')) {
            console.debug(...this.formatMessage('debug', message, data));
        }
    }

    /**
     * Log de información
     * @param {string} message - Mensaje
     * @param {*} data - Datos adicionales
     */
    info(message, data) {
        if (this.shouldLog('info')) {
            console.info(...this.formatMessage('info', message, data));
        }
    }

    /**
     * Log de advertencia
     * @param {string} message - Mensaje
     * @param {*} data - Datos adicionales
     */
    warn(message, data) {
        if (this.shouldLog('warn')) {
            console.warn(...this.formatMessage('warn', message, data));
        }
    }

    /**
     * Log de error
     * @param {string} message - Mensaje
     * @param {*} data - Datos adicionales
     */
    error(message, data) {
        if (this.shouldLog('error')) {
            console.error(...this.formatMessage('error', message, data));
        }
    }

    /**
     * Cambiar el nivel de logging
     * @param {string} level - Nuevo nivel
     */
    setLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.level = level;
        }
    }

    /**
     * Cambiar el contexto
     * @param {string} context - Nuevo contexto
     */
    setContext(context) {
        this.context = context;
    }
}

// Instancia global del logger
export const logger = new Logger();