/**
 * SpanishFormatter - Utilidades de formateo en español para Spikepulse
 * @module SpanishFormatter
 */

export class SpanishFormatter {
    /**
     * Formatear números usando convenciones españolas
     * @param {number} number - Número a formatear
     * @param {number} decimals - Número de decimales
     * @returns {string} Número formateado
     */
    static formatNumber(number, decimals = 0) {
        if (typeof number !== 'number' || isNaN(number)) {
            return '0';
        }

        return number.toLocaleString('es-ES', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    /**
     * Formatear distancia con unidades españolas
     * @param {number} distance - Distancia en metros
     * @returns {string} Distancia formateada
     */
    static formatDistance(distance) {
        if (distance < 1000) {
            return `${this.formatNumber(distance, 1)}m`;
        } else if (distance < 1000000) {
            return `${this.formatNumber(distance / 1000, 2)}km`;
        } else {
            return `${this.formatNumber(distance / 1000000, 2)}Mm`;
        }
    }

    /**
     * Formatear tiempo con unidades españolas
     * @param {number} seconds - Tiempo en segundos
     * @returns {string} Tiempo formateado
     */
    static formatTime(seconds) {
        if (seconds < 60) {
            return `${this.formatNumber(seconds, 1)}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}min ${this.formatNumber(remainingSeconds, 0)}s`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;
            return `${hours}h ${minutes}min ${this.formatNumber(remainingSeconds, 0)}s`;
        }
    }

    /**
     * Formatear bytes en formato legible español
     * @param {number} bytes - Bytes a formatear
     * @returns {string} Bytes formateados
     */
    static formatBytes(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 B';
        
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        const formattedSize = (bytes / Math.pow(1024, i)).toFixed(1);
        
        return `${this.formatNumber(parseFloat(formattedSize), 1)} ${sizes[i]}`;
    }

    /**
     * Formatear porcentaje
     * @param {number} value - Valor decimal (0-1)
     * @param {number} decimals - Número de decimales
     * @returns {string} Porcentaje formateado
     */
    static formatPercentage(value, decimals = 1) {
        return `${this.formatNumber(value * 100, decimals)}%`;
    }

    /**
     * Formatear velocidad
     * @param {number} velocity - Velocidad en unidades por segundo
     * @param {string} unit - Unidad de medida
     * @returns {string} Velocidad formateada
     */
    static formatVelocity(velocity, unit = 'px') {
        return `${this.formatNumber(velocity, 1)} ${unit}/s`;
    }

    /**
     * Formatear FPS
     * @param {number} fps - Frames por segundo
     * @returns {string} FPS formateado
     */
    static formatFPS(fps) {
        return `${this.formatNumber(fps, 0)} FPS`;
    }

    /**
     * Formatear tiempo de frame
     * @param {number} frameTime - Tiempo de frame en milisegundos
     * @returns {string} Tiempo de frame formateado
     */
    static formatFrameTime(frameTime) {
        return `${this.formatNumber(frameTime, 2)}ms`;
    }

    /**
     * Formatear puntuación del juego
     * @param {number} score - Puntuación
     * @returns {string} Puntuación formateada
     */
    static formatScore(score) {
        if (score < 1000) {
            return this.formatNumber(score, 0);
        } else if (score < 1000000) {
            return `${this.formatNumber(score / 1000, 1)}K`;
        } else {
            return `${this.formatNumber(score / 1000000, 1)}M`;
        }
    }

    /**
     * Formatear coordenadas
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @returns {string} Coordenadas formateadas
     */
    static formatCoordinates(x, y) {
        return `(${this.formatNumber(x, 1)}, ${this.formatNumber(y, 1)})`;
    }

    /**
     * Formatear duración de sesión
     * @param {number} milliseconds - Duración en milisegundos
     * @returns {string} Duración formateada
     */
    static formatSessionDuration(milliseconds) {
        const seconds = milliseconds / 1000;
        return this.formatTime(seconds);
    }

    /**
     * Formatear fecha y hora en español
     * @param {Date} date - Fecha a formatear
     * @returns {string} Fecha formateada
     */
    static formatDateTime(date = new Date()) {
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Formatear solo la hora
     * @param {Date} date - Fecha a formatear
     * @returns {string} Hora formateada
     */
    static formatTime24(date = new Date()) {
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Formatear estadísticas de rendimiento
     * @param {Object} stats - Estadísticas de rendimiento
     * @returns {Object} Estadísticas formateadas
     */
    static formatPerformanceStats(stats) {
        return {
            fps: this.formatFPS(stats.fps || 0),
            frameTime: this.formatFrameTime(stats.frameTime || 0),
            memory: stats.memory ? this.formatBytes(stats.memory) : 'No disponible',
            uptime: this.formatSessionDuration(stats.uptime || 0),
            frames: this.formatNumber(stats.frames || 0),
            errors: this.formatNumber(stats.errors || 0)
        };
    }

    /**
     * Formatear estadísticas del juego
     * @param {Object} gameStats - Estadísticas del juego
     * @returns {Object} Estadísticas formateadas
     */
    static formatGameStats(gameStats) {
        return {
            distancia: this.formatDistance(gameStats.distance || 0),
            puntuacion: this.formatScore(gameStats.score || 0),
            saltos: this.formatNumber(gameStats.jumps || 0),
            tiempo: this.formatTime(gameStats.time || 0),
            velocidad: this.formatVelocity(gameStats.velocity || 0),
            posicion: this.formatCoordinates(
                gameStats.position?.x || 0, 
                gameStats.position?.y || 0
            )
        };
    }

    /**
     * Pluralizar palabras en español
     * @param {number} count - Cantidad
     * @param {string} singular - Forma singular
     * @param {string} plural - Forma plural (opcional)
     * @returns {string} Palabra pluralizada
     */
    static pluralize(count, singular, plural = null) {
        if (count === 1) {
            return `1 ${singular}`;
        }
        
        const pluralForm = plural || this.getDefaultPlural(singular);
        return `${this.formatNumber(count)} ${pluralForm}`;
    }

    /**
     * Obtener plural por defecto en español
     * @param {string} singular - Forma singular
     * @returns {string} Forma plural
     * @private
     */
    static getDefaultPlural(singular) {
        // Reglas básicas de pluralización en español
        if (singular.endsWith('z')) {
            return singular.slice(0, -1) + 'ces';
        } else if (singular.endsWith('s') || singular.endsWith('x')) {
            return singular;
        } else if (singular.endsWith('í') || singular.endsWith('ú')) {
            return singular + 'es';
        } else if (singular.match(/[aeiou]$/)) {
            return singular + 's';
        } else {
            return singular + 'es';
        }
    }

    /**
     * Formatear mensaje de estado del juego
     * @param {string} state - Estado del juego
     * @returns {string} Estado formateado
     */
    static formatGameState(state) {
        const states = {
            loading: 'Cargando...',
            menu: 'En Menú',
            playing: 'Jugando',
            paused: 'Pausado',
            gameOver: 'Juego Terminado',
            error: 'Error'
        };
        
        return states[state] || state;
    }

    /**
     * Formatear nivel de dificultad
     * @param {number} difficulty - Nivel de dificultad (1-10)
     * @returns {string} Dificultad formateada
     */
    static formatDifficulty(difficulty) {
        const levels = {
            1: 'Muy Fácil',
            2: 'Fácil',
            3: 'Fácil',
            4: 'Normal',
            5: 'Normal',
            6: 'Difícil',
            7: 'Difícil',
            8: 'Muy Difícil',
            9: 'Extremo',
            10: 'Imposible'
        };
        
        return levels[Math.max(1, Math.min(10, Math.floor(difficulty)))] || 'Normal';
    }

    /**
     * Formatear mensaje de error en español
     * @param {string} errorType - Tipo de error
     * @param {string} context - Contexto del error
     * @returns {string} Mensaje de error formateado
     */
    static formatErrorMessage(errorType, context = '') {
        const errorMessages = {
            'canvas-error': 'Error en el canvas del juego',
            'physics-error': 'Error en la física del juego',
            'input-error': 'Error en los controles',
            'save-error': 'Error al guardar los datos',
            'load-error': 'Error al cargar el juego',
            'network-error': 'Error de conexión',
            'memory-error': 'Error de memoria',
            'render-error': 'Error de renderizado',
            'audio-error': 'Error de audio',
            'unknown-error': 'Error desconocido'
        };
        
        const baseMessage = errorMessages[errorType] || errorMessages['unknown-error'];
        return context ? `${baseMessage}: ${context}` : baseMessage;
    }

    /**
     * Formatear rango de valores
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     * @param {string} unit - Unidad de medida
     * @returns {string} Rango formateado
     */
    static formatRange(min, max, unit = '') {
        const formattedMin = this.formatNumber(min, 1);
        const formattedMax = this.formatNumber(max, 1);
        return `${formattedMin} - ${formattedMax}${unit ? ' ' + unit : ''}`;
    }
}