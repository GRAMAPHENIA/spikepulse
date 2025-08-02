/**
 * ErrorHandler - Sistema global de manejo de errores para Spikepulse
 * @module ErrorHandler
 */

import { SPANISH_TEXT } from '../config/SpanishText.js';

export class ErrorHandler {
    /**
     * Crea una nueva instancia del ErrorHandler
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     * @param {Object} config - Configuración del sistema de errores
     */
    constructor(eventBus, config = {}) {
        this.eventBus = eventBus;
        this.config = {
            maxErrors: config.maxErrors || 100,
            enableLogging: config.enableLogging !== false,
            enableRecovery: config.enableRecovery !== false,
            logLevel: config.logLevel || 'error',
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 1000,
            ...config
        };

        this.errors = [];
        this.errorCounts = new Map();
        this.recoveryStrategies = new Map();
        this.isInitialized = false;

        this.init();
    }

    /**
     * Inicializar el sistema de manejo de errores
     * @private
     */
    init() {
        this.setupGlobalErrorHandling();
        this.setupRecoveryStrategies();
        this.setupEventListeners();
        this.isInitialized = true;

        console.log('[ErrorHandler] Sistema de manejo de errores inicializado');
    }

    /**
     * Configurar manejo global de errores
     * @private
     */
    setupGlobalErrorHandling() {
        // Manejar errores JavaScript no capturados
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'JAVASCRIPT_ERROR',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                stack: event.error?.stack
            }, 'global');
        });

        // Manejar promesas rechazadas no capturadas
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'UNHANDLED_PROMISE_REJECTION',
                message: event.reason?.message || 'Promesa rechazada no manejada',
                reason: event.reason,
                stack: event.reason?.stack
            }, 'promise');

            // Prevenir que aparezca en la consola del navegador
            event.preventDefault();
        });

        // Manejar errores de recursos (imágenes, scripts, etc.)
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError({
                    type: 'RESOURCE_ERROR',
                    message: `Error cargando recurso: ${event.target.src || event.target.href}`,
                    element: event.target.tagName,
                    source: event.target.src || event.target.href
                }, 'resource');
            }
        }, true);
    }

    /**
     * Configurar estrategias de recuperación
     * @private
     */
    setupRecoveryStrategies() {
        // Estrategia para errores de canvas
        this.addRecoveryStrategy('CANVAS_ERROR', async (error, context) => {
            console.warn('[ErrorHandler] Intentando recuperar canvas...');
            
            try {
                // Reinicializar canvas
                this.eventBus.emit('renderer:reinitialize-canvas');
                await this.delay(500);
                
                // Verificar si el canvas está funcionando
                const canvas = document.getElementById('gameCanvas');
                if (canvas && canvas.getContext('2d')) {
                    console.log('[ErrorHandler] Canvas recuperado exitosamente');
                    return { success: true, message: 'Canvas reinicializado' };
                }
            } catch (recoveryError) {
                console.error('[ErrorHandler] Error en recuperación de canvas:', recoveryError);
            }
            
            return { success: false, message: 'No se pudo recuperar el canvas' };
        });

        // Estrategia para errores de módulos
        this.addRecoveryStrategy('MODULE_ERROR', async (error, context) => {
            console.warn(`[ErrorHandler] Intentando recuperar módulo: ${context.moduleName}`);
            
            try {
                // Reinicializar módulo específico
                this.eventBus.emit('engine:reinitialize-module', { 
                    moduleName: context.moduleName 
                });
                await this.delay(1000);
                
                console.log(`[ErrorHandler] Módulo ${context.moduleName} recuperado`);
                return { success: true, message: `Módulo ${context.moduleName} reinicializado` };
            } catch (recoveryError) {
                console.error('[ErrorHandler] Error en recuperación de módulo:', recoveryError);
                return { success: false, message: `No se pudo recuperar el módulo ${context.moduleName}` };
            }
        });

        // Estrategia para errores de memoria
        this.addRecoveryStrategy('MEMORY_ERROR', async (error, context) => {
            console.warn('[ErrorHandler] Intentando liberar memoria...');
            
            try {
                // Forzar garbage collection si está disponible
                if (window.gc) {
                    window.gc();
                }
                
                // Limpiar caches
                this.eventBus.emit('renderer:clear-cache');
                this.eventBus.emit('memory:cleanup');
                
                await this.delay(500);
                
                console.log('[ErrorHandler] Memoria liberada');
                return { success: true, message: 'Memoria liberada exitosamente' };
            } catch (recoveryError) {
                console.error('[ErrorHandler] Error en recuperación de memoria:', recoveryError);
                return { success: false, message: 'No se pudo liberar memoria' };
            }
        });

        // Estrategia para errores de input
        this.addRecoveryStrategy('INPUT_ERROR', async (error, context) => {
            console.warn('[ErrorHandler] Intentando recuperar sistema de input...');
            
            try {
                // Reinicializar sistema de input
                this.eventBus.emit('input:reinitialize');
                await this.delay(300);
                
                console.log('[ErrorHandler] Sistema de input recuperado');
                return { success: true, message: 'Sistema de input reinicializado' };
            } catch (recoveryError) {
                console.error('[ErrorHandler] Error en recuperación de input:', recoveryError);
                return { success: false, message: 'No se pudo recuperar el sistema de input' };
            }
        });
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        // Escuchar errores de módulos
        this.eventBus.on('engine:module-error', (data) => {
            this.handleError({
                type: 'MODULE_ERROR',
                message: `Error en módulo ${data.name}: ${data.error.message}`,
                moduleName: data.name,
                error: data.error,
                context: data.context
            }, 'module');
        });

        // Escuchar errores del motor
        this.eventBus.on('engine:error', (data) => {
            this.handleError({
                type: 'ENGINE_ERROR',
                message: `Error en motor: ${data.error.message}`,
                error: data.error,
                context: data.context
            }, 'engine');
        });

        // Escuchar errores de renderizado
        this.eventBus.on('renderer:error', (data) => {
            this.handleError({
                type: 'RENDERER_ERROR',
                message: `Error en renderizado: ${data.error.message}`,
                error: data.error,
                context: data.context
            }, 'renderer');
        });

        // Escuchar errores de física
        this.eventBus.on('physics:error', (data) => {
            this.handleError({
                type: 'PHYSICS_ERROR',
                message: `Error en física: ${data.error.message}`,
                error: data.error,
                context: data.context
            }, 'physics');
        });
    }

    /**
     * Manejar un error
     * @param {Object} errorData - Datos del error
     * @param {string} context - Contexto donde ocurrió el error
     */
    async handleError(errorData, context = 'unknown') {
        const errorId = this.generateErrorId();
        const timestamp = new Date().toISOString();
        
        const errorRecord = {
            id: errorId,
            timestamp,
            type: errorData.type || 'UNKNOWN_ERROR',
            message: errorData.message || 'Error desconocido',
            context,
            data: errorData,
            severity: this.determineSeverity(errorData.type),
            handled: false,
            recoveryAttempts: 0
        };

        // Agregar error al registro
        this.addErrorToLog(errorRecord);

        // Log del error
        if (this.config.enableLogging) {
            this.logError(errorRecord);
        }

        // Emitir evento de error
        this.eventBus.emit('error:occurred', errorRecord);

        // Intentar recuperación si está habilitada
        if (this.config.enableRecovery && this.shouldAttemptRecovery(errorRecord)) {
            await this.attemptRecovery(errorRecord);
        }

        // Notificar al usuario si es necesario
        this.notifyUserIfNeeded(errorRecord);

        return errorRecord;
    }

    /**
     * Determinar la severidad del error
     * @param {string} errorType - Tipo de error
     * @returns {string} Nivel de severidad
     * @private
     */
    determineSeverity(errorType) {
        const criticalErrors = [
            'CANVAS_ERROR',
            'ENGINE_ERROR',
            'JAVASCRIPT_ERROR'
        ];

        const warningErrors = [
            'RESOURCE_ERROR',
            'MEMORY_ERROR'
        ];

        if (criticalErrors.includes(errorType)) {
            return 'critical';
        } else if (warningErrors.includes(errorType)) {
            return 'warning';
        } else {
            return 'info';
        }
    }

    /**
     * Agregar error al registro
     * @param {Object} errorRecord - Registro del error
     * @private
     */
    addErrorToLog(errorRecord) {
        this.errors.push(errorRecord);

        // Mantener límite de errores
        if (this.errors.length > this.config.maxErrors) {
            this.errors.shift();
        }

        // Actualizar contador de errores por tipo
        const count = this.errorCounts.get(errorRecord.type) || 0;
        this.errorCounts.set(errorRecord.type, count + 1);
    }

    /**
     * Registrar error en consola
     * @param {Object} errorRecord - Registro del error
     * @private
     */
    logError(errorRecord) {
        const logMessage = `[ErrorHandler] ${errorRecord.severity.toUpperCase()}: ${errorRecord.message}`;
        
        switch (errorRecord.severity) {
            case 'critical':
                console.error(logMessage, errorRecord);
                break;
            case 'warning':
                console.warn(logMessage, errorRecord);
                break;
            default:
                console.log(logMessage, errorRecord);
                break;
        }
    }

    /**
     * Determinar si se debe intentar recuperación
     * @param {Object} errorRecord - Registro del error
     * @returns {boolean} True si se debe intentar recuperación
     * @private
     */
    shouldAttemptRecovery(errorRecord) {
        // No intentar recuperación si ya se intentó muchas veces
        if (errorRecord.recoveryAttempts >= this.config.retryAttempts) {
            return false;
        }

        // No intentar recuperación para errores de baja severidad
        if (errorRecord.severity === 'info') {
            return false;
        }

        // Verificar si hay estrategia de recuperación disponible
        return this.recoveryStrategies.has(errorRecord.type);
    }

    /**
     * Intentar recuperación del error
     * @param {Object} errorRecord - Registro del error
     * @private
     */
    async attemptRecovery(errorRecord) {
        const strategy = this.recoveryStrategies.get(errorRecord.type);
        if (!strategy) {
            return;
        }

        errorRecord.recoveryAttempts++;

        try {
            console.log(`[ErrorHandler] Intentando recuperación para ${errorRecord.type} (intento ${errorRecord.recoveryAttempts})`);
            
            const result = await strategy(errorRecord.data, { 
                errorRecord,
                attempt: errorRecord.recoveryAttempts 
            });

            if (result.success) {
                errorRecord.handled = true;
                console.log(`[ErrorHandler] Recuperación exitosa: ${result.message}`);
                
                this.eventBus.emit('error:recovered', {
                    errorRecord,
                    recoveryResult: result
                });
            } else {
                console.warn(`[ErrorHandler] Recuperación fallida: ${result.message}`);
                
                // Intentar de nuevo después de un delay si quedan intentos
                if (errorRecord.recoveryAttempts < this.config.retryAttempts) {
                    setTimeout(() => {
                        this.attemptRecovery(errorRecord);
                    }, this.config.retryDelay * errorRecord.recoveryAttempts);
                }
            }
        } catch (recoveryError) {
            console.error('[ErrorHandler] Error durante recuperación:', recoveryError);
            
            // Registrar el error de recuperación
            this.handleError({
                type: 'RECOVERY_ERROR',
                message: `Error durante recuperación de ${errorRecord.type}: ${recoveryError.message}`,
                originalError: errorRecord,
                recoveryError
            }, 'recovery');
        }
    }

    /**
     * Notificar al usuario si es necesario
     * @param {Object} errorRecord - Registro del error
     * @private
     */
    notifyUserIfNeeded(errorRecord) {
        // Solo notificar errores críticos al usuario
        if (errorRecord.severity === 'critical' && !errorRecord.handled) {
            const userMessage = this.getUserFriendlyMessage(errorRecord.type);
            
            this.eventBus.emit('ui:show-error-message', {
                message: userMessage,
                type: 'error',
                duration: 5000
            });
        }
    }

    /**
     * Obtener mensaje amigable para el usuario
     * @param {string} errorType - Tipo de error
     * @returns {string} Mensaje para el usuario
     * @private
     */
    getUserFriendlyMessage(errorType) {
        const messages = {
            CANVAS_ERROR: SPANISH_TEXT.ERROR_CANVAS || 'Error en el canvas del juego. Intentando recuperar...',
            MODULE_ERROR: SPANISH_TEXT.ERROR_MODULE || 'Error en un componente del juego. Intentando recuperar...',
            ENGINE_ERROR: SPANISH_TEXT.ERROR_ENGINE || 'Error en el motor del juego. Intentando recuperar...',
            JAVASCRIPT_ERROR: SPANISH_TEXT.ERROR_JAVASCRIPT || 'Error inesperado. El juego intentará continuar...',
            MEMORY_ERROR: SPANISH_TEXT.ERROR_MEMORY || 'Problema de memoria detectado. Liberando recursos...',
            RESOURCE_ERROR: SPANISH_TEXT.ERROR_RESOURCE || 'Error cargando recursos del juego.',
            UNKNOWN_ERROR: SPANISH_TEXT.ERROR_UNKNOWN || 'Error desconocido detectado.'
        };

        return messages[errorType] || messages.UNKNOWN_ERROR;
    }

    /**
     * Agregar estrategia de recuperación
     * @param {string} errorType - Tipo de error
     * @param {Function} strategy - Función de estrategia de recuperación
     */
    addRecoveryStrategy(errorType, strategy) {
        this.recoveryStrategies.set(errorType, strategy);
        console.log(`[ErrorHandler] Estrategia de recuperación agregada para: ${errorType}`);
    }

    /**
     * Remover estrategia de recuperación
     * @param {string} errorType - Tipo de error
     */
    removeRecoveryStrategy(errorType) {
        this.recoveryStrategies.delete(errorType);
        console.log(`[ErrorHandler] Estrategia de recuperación removida para: ${errorType}`);
    }

    /**
     * Generar ID único para error
     * @returns {string} ID del error
     * @private
     */
    generateErrorId() {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Delay helper para recuperación
     * @param {number} ms - Milisegundos a esperar
     * @returns {Promise} Promesa que se resuelve después del delay
     * @private
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Obtener estadísticas de errores
     * @returns {Object} Estadísticas de errores
     */
    getErrorStats() {
        const recentErrors = this.errors.filter(error => {
            const errorTime = new Date(error.timestamp).getTime();
            const now = Date.now();
            return (now - errorTime) < 300000; // Últimos 5 minutos
        });

        const errorsByType = {};
        this.errorCounts.forEach((count, type) => {
            errorsByType[type] = count;
        });

        const errorsBySeverity = {
            critical: this.errors.filter(e => e.severity === 'critical').length,
            warning: this.errors.filter(e => e.severity === 'warning').length,
            info: this.errors.filter(e => e.severity === 'info').length
        };

        return {
            totalErrors: this.errors.length,
            recentErrors: recentErrors.length,
            errorsByType,
            errorsBySeverity,
            handledErrors: this.errors.filter(e => e.handled).length,
            unhandledErrors: this.errors.filter(e => !e.handled).length,
            recoveryStrategies: Array.from(this.recoveryStrategies.keys())
        };
    }

    /**
     * Obtener errores recientes
     * @param {number} limit - Límite de errores a retornar
     * @returns {Array} Lista de errores recientes
     */
    getRecentErrors(limit = 10) {
        return this.errors
            .slice(-limit)
            .reverse();
    }

    /**
     * Limpiar registro de errores
     */
    clearErrorLog() {
        this.errors = [];
        this.errorCounts.clear();
        console.log('[ErrorHandler] Registro de errores limpiado');
    }

    /**
     * Destruir el sistema de manejo de errores
     */
    destroy() {
        // Remover listeners globales
        window.removeEventListener('error', this.handleError);
        window.removeEventListener('unhandledrejection', this.handleError);

        // Limpiar datos
        this.clearErrorLog();
        this.recoveryStrategies.clear();

        this.isInitialized = false;
        console.log('[ErrorHandler] Sistema de manejo de errores destruido');
    }
}