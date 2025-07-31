/**
 * ErrorLogger - Sistema de logging de errores para Spikepulse
 * @module ErrorLogger
 */

export class ErrorLogger {
    /**
     * Crea una nueva instancia del ErrorLogger
     * @param {Object} config - Configuración del logger
     */
    constructor(config = {}) {
        this.config = {
            maxLogSize: config.maxLogSize || 1000,
            enableConsoleLog: config.enableConsoleLog !== false,
            enableLocalStorage: config.enableLocalStorage !== false,
            logLevel: config.logLevel || 'error',
            storageKey: config.storageKey || 'spikepulse_error_log',
            ...config
        };

        this.logs = [];
        this.logLevels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
            critical: 4
        };

        this.init();
    }

    /**
     * Inicializar el logger
     * @private
     */
    init() {
        this.loadLogsFromStorage();
        console.log('[ErrorLogger] Sistema de logging inicializado');
    }

    /**
     * Cargar logs desde localStorage
     * @private
     */
    loadLogsFromStorage() {
        if (!this.config.enableLocalStorage) {
            return;
        }

        try {
            const storedLogs = localStorage.getItem(this.config.storageKey);
            if (storedLogs) {
                this.logs = JSON.parse(storedLogs);
                console.log(`[ErrorLogger] ${this.logs.length} logs cargados desde localStorage`);
            }
        } catch (error) {
            console.warn('[ErrorLogger] Error cargando logs desde localStorage:', error);
        }
    }

    /**
     * Guardar logs en localStorage
     * @private
     */
    saveLogsToStorage() {
        if (!this.config.enableLocalStorage) {
            return;
        }

        try {
            localStorage.setItem(this.config.storageKey, JSON.stringify(this.logs));
        } catch (error) {
            console.warn('[ErrorLogger] Error guardando logs en localStorage:', error);
        }
    }

    /**
     * Registrar un log
     * @param {string} level - Nivel del log (debug, info, warn, error, critical)
     * @param {string} message - Mensaje del log
     * @param {Object} data - Datos adicionales
     * @param {string} context - Contexto del log
     */
    log(level, message, data = null, context = 'unknown') {
        // Verificar si el nivel es suficiente para registrar
        if (this.logLevels[level] < this.logLevels[this.config.logLevel]) {
            return;
        }

        const logEntry = {
            id: this.generateLogId(),
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            data: this.sanitizeData(data),
            userAgent: navigator.userAgent,
            url: window.location.href,
            sessionId: this.getSessionId()
        };

        // Agregar al array de logs
        this.addLogEntry(logEntry);

        // Log en consola si está habilitado
        if (this.config.enableConsoleLog) {
            this.logToConsole(logEntry);
        }

        // Guardar en localStorage
        this.saveLogsToStorage();

        return logEntry;
    }

    /**
     * Log de debug
     * @param {string} message - Mensaje
     * @param {Object} data - Datos adicionales
     * @param {string} context - Contexto
     */
    debug(message, data = null, context = 'debug') {
        return this.log('debug', message, data, context);
    }

    /**
     * Log de información
     * @param {string} message - Mensaje
     * @param {Object} data - Datos adicionales
     * @param {string} context - Contexto
     */
    info(message, data = null, context = 'info') {
        return this.log('info', message, data, context);
    }

    /**
     * Log de advertencia
     * @param {string} message - Mensaje
     * @param {Object} data - Datos adicionales
     * @param {string} context - Contexto
     */
    warn(message, data = null, context = 'warning') {
        return this.log('warn', message, data, context);
    }

    /**
     * Log de error
     * @param {string} message - Mensaje
     * @param {Object} data - Datos adicionales
     * @param {string} context - Contexto
     */
    error(message, data = null, context = 'error') {
        return this.log('error', message, data, context);
    }

    /**
     * Log crítico
     * @param {string} message - Mensaje
     * @param {Object} data - Datos adicionales
     * @param {string} context - Contexto
     */
    critical(message, data = null, context = 'critical') {
        return this.log('critical', message, data, context);
    }

    /**
     * Agregar entrada de log
     * @param {Object} logEntry - Entrada de log
     * @private
     */
    addLogEntry(logEntry) {
        this.logs.push(logEntry);

        // Mantener límite de logs
        if (this.logs.length > this.config.maxLogSize) {
            this.logs.shift();
        }
    }

    /**
     * Log en consola
     * @param {Object} logEntry - Entrada de log
     * @private
     */
    logToConsole(logEntry) {
        const message = `[${logEntry.timestamp}] [${logEntry.level.toUpperCase()}] [${logEntry.context}] ${logEntry.message}`;

        switch (logEntry.level) {
            case 'debug':
                console.debug(message, logEntry.data);
                break;
            case 'info':
                console.info(message, logEntry.data);
                break;
            case 'warn':
                console.warn(message, logEntry.data);
                break;
            case 'error':
                console.error(message, logEntry.data);
                break;
            case 'critical':
                console.error(`🚨 ${message}`, logEntry.data);
                break;
            default:
                console.log(message, logEntry.data);
        }
    }

    /**
     * Sanitizar datos para logging
     * @param {*} data - Datos a sanitizar
     * @returns {*} Datos sanitizados
     * @private
     */
    sanitizeData(data) {
        if (data === null || data === undefined) {
            return null;
        }

        try {
            // Convertir errores a objetos serializables
            if (data instanceof Error) {
                return {
                    name: data.name,
                    message: data.message,
                    stack: data.stack,
                    type: 'Error'
                };
            }

            // Manejar objetos circulares
            return JSON.parse(JSON.stringify(data, this.getCircularReplacer()));
        } catch (error) {
            return {
                error: 'Error sanitizando datos',
                originalType: typeof data,
                message: error.message
            };
        }
    }

    /**
     * Replacer para manejar referencias circulares
     * @returns {Function} Función replacer
     * @private
     */
    getCircularReplacer() {
        const seen = new WeakSet();
        return (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                    return '[Circular Reference]';
                }
                seen.add(value);
            }
            return value;
        };
    }

    /**
     * Generar ID único para log
     * @returns {string} ID del log
     * @private
     */
    generateLogId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obtener ID de sesión
     * @returns {string} ID de sesión
     * @private
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('spikepulse_session_id');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('spikepulse_session_id', sessionId);
        }
        return sessionId;
    }

    /**
     * Obtener logs filtrados
     * @param {Object} filters - Filtros a aplicar
     * @returns {Array} Logs filtrados
     */
    getLogs(filters = {}) {
        let filteredLogs = [...this.logs];

        // Filtrar por nivel
        if (filters.level) {
            filteredLogs = filteredLogs.filter(log => log.level === filters.level);
        }

        // Filtrar por contexto
        if (filters.context) {
            filteredLogs = filteredLogs.filter(log => log.context === filters.context);
        }

        // Filtrar por rango de tiempo
        if (filters.startTime) {
            const startTime = new Date(filters.startTime).getTime();
            filteredLogs = filteredLogs.filter(log => {
                return new Date(log.timestamp).getTime() >= startTime;
            });
        }

        if (filters.endTime) {
            const endTime = new Date(filters.endTime).getTime();
            filteredLogs = filteredLogs.filter(log => {
                return new Date(log.timestamp).getTime() <= endTime;
            });
        }

        // Filtrar por mensaje
        if (filters.message) {
            const searchTerm = filters.message.toLowerCase();
            filteredLogs = filteredLogs.filter(log => 
                log.message.toLowerCase().includes(searchTerm)
            );
        }

        // Limitar resultados
        if (filters.limit) {
            filteredLogs = filteredLogs.slice(-filters.limit);
        }

        return filteredLogs;
    }

    /**
     * Obtener estadísticas de logs
     * @returns {Object} Estadísticas
     */
    getStats() {
        const stats = {
            totalLogs: this.logs.length,
            byLevel: {},
            byContext: {},
            recentLogs: 0,
            oldestLog: null,
            newestLog: null
        };

        // Contar por nivel
        this.logs.forEach(log => {
            stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
            stats.byContext[log.context] = (stats.byContext[log.context] || 0) + 1;
        });

        // Logs recientes (última hora)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        stats.recentLogs = this.logs.filter(log => {
            return new Date(log.timestamp).getTime() > oneHourAgo;
        }).length;

        // Log más antiguo y más nuevo
        if (this.logs.length > 0) {
            stats.oldestLog = this.logs[0].timestamp;
            stats.newestLog = this.logs[this.logs.length - 1].timestamp;
        }

        return stats;
    }

    /**
     * Exportar logs como JSON
     * @param {Object} filters - Filtros a aplicar
     * @returns {string} JSON de logs
     */
    exportLogs(filters = {}) {
        const logs = this.getLogs(filters);
        return JSON.stringify(logs, null, 2);
    }

    /**
     * Exportar logs como CSV
     * @param {Object} filters - Filtros a aplicar
     * @returns {string} CSV de logs
     */
    exportLogsAsCSV(filters = {}) {
        const logs = this.getLogs(filters);
        
        if (logs.length === 0) {
            return '';
        }

        // Headers
        const headers = ['timestamp', 'level', 'context', 'message', 'sessionId'];
        let csv = headers.join(',') + '\n';

        // Datos
        logs.forEach(log => {
            const row = [
                log.timestamp,
                log.level,
                log.context,
                `"${log.message.replace(/"/g, '""')}"`, // Escapar comillas
                log.sessionId
            ];
            csv += row.join(',') + '\n';
        });

        return csv;
    }

    /**
     * Limpiar logs
     * @param {Object} criteria - Criterios de limpieza
     */
    clearLogs(criteria = {}) {
        if (criteria.all) {
            this.logs = [];
        } else if (criteria.olderThan) {
            const cutoffTime = new Date(criteria.olderThan).getTime();
            this.logs = this.logs.filter(log => {
                return new Date(log.timestamp).getTime() > cutoffTime;
            });
        } else if (criteria.level) {
            this.logs = this.logs.filter(log => log.level !== criteria.level);
        }

        this.saveLogsToStorage();
        console.log('[ErrorLogger] Logs limpiados según criterios:', criteria);
    }

    /**
     * Configurar nivel de logging
     * @param {string} level - Nuevo nivel de logging
     */
    setLogLevel(level) {
        if (this.logLevels.hasOwnProperty(level)) {
            this.config.logLevel = level;
            console.log(`[ErrorLogger] Nivel de logging cambiado a: ${level}`);
        } else {
            console.warn(`[ErrorLogger] Nivel de logging inválido: ${level}`);
        }
    }

    /**
     * Destruir el logger
     */
    destroy() {
        this.saveLogsToStorage();
        this.logs = [];
        console.log('[ErrorLogger] Logger destruido');
    }
}