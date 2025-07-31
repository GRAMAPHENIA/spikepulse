/**
 * ErrorRecovery - Sistema de recuperación de errores para Spikepulse
 * @module ErrorRecovery
 */

export class ErrorRecovery {
    /**
     * Crea una nueva instancia del ErrorRecovery
     * @param {EventBus} eventBus - Bus de eventos
     * @param {Object} config - Configuración del sistema de recuperación
     */
    constructor(eventBus, config = {}) {
        this.eventBus = eventBus;
        this.config = {
            maxRetryAttempts: config.maxRetryAttempts || 3,
            retryDelay: config.retryDelay || 1000,
            enableAutoRecovery: config.enableAutoRecovery !== false,
            recoveryTimeout: config.recoveryTimeout || 10000,
            ...config
        };

        this.recoveryStrategies = new Map();
        this.recoveryHistory = [];
        this.activeRecoveries = new Map();
        this.isInitialized = false;

        this.init();
    }

    /**
     * Inicializar el sistema de recuperación
     * @private
     */
    init() {
        this.setupDefaultStrategies();
        this.setupEventListeners();
        this.isInitialized = true;

        console.log('[ErrorRecovery] Sistema de recuperación inicializado');
    }

    /**
     * Configurar estrategias de recuperación por defecto
     * @private
     */
    setupDefaultStrategies() {
        // Estrategia para errores de canvas
        this.addStrategy('CANVAS_ERROR', {
            name: 'Canvas Recovery',
            priority: 1,
            timeout: 5000,
            maxAttempts: 3,
            handler: async (error, context) => {
                console.log('[ErrorRecovery] Iniciando recuperación de canvas...');
                
                try {
                    // Paso 1: Verificar si el canvas existe
                    let canvas = document.getElementById('gameCanvas');
                    if (!canvas) {
                        console.log('[ErrorRecovery] Canvas no encontrado, creando nuevo...');
                        await this.recreateCanvas();
                        canvas = document.getElementById('gameCanvas');
                    }

                    // Paso 2: Verificar contexto 2D
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        throw new Error('No se puede obtener contexto 2D');
                    }

                    // Paso 3: Reinicializar renderer
                    this.eventBus.emit('renderer:reinitialize', { canvas, context: ctx });
                    
                    // Paso 4: Verificar que el renderer funciona
                    await this.delay(500);
                    
                    return {
                        success: true,
                        message: 'Canvas recuperado exitosamente',
                        data: { canvas, context: ctx }
                    };
                } catch (recoveryError) {
                    return {
                        success: false,
                        message: `Error en recuperación de canvas: ${recoveryError.message}`,
                        error: recoveryError
                    };
                }
            }
        });

        // Estrategia para errores de módulos
        this.addStrategy('MODULE_ERROR', {
            name: 'Module Recovery',
            priority: 2,
            timeout: 8000,
            maxAttempts: 2,
            handler: async (error, context) => {
                const moduleName = context.moduleName || 'unknown';
                console.log(`[ErrorRecovery] Iniciando recuperación de módulo: ${moduleName}`);
                
                try {
                    // Paso 1: Desregistrar módulo problemático
                    this.eventBus.emit('engine:unregister-module', { name: moduleName });
                    await this.delay(500);

                    // Paso 2: Limpiar estado del módulo
                    this.eventBus.emit('engine:cleanup-module', { name: moduleName });
                    await this.delay(500);

                    // Paso 3: Recargar y registrar módulo
                    this.eventBus.emit('engine:reload-module', { name: moduleName });
                    await this.delay(1000);

                    // Paso 4: Verificar que el módulo funciona
                    const moduleStatus = await this.checkModuleStatus(moduleName);
                    if (!moduleStatus.isWorking) {
                        throw new Error(`Módulo ${moduleName} no responde después de recuperación`);
                    }

                    return {
                        success: true,
                        message: `Módulo ${moduleName} recuperado exitosamente`,
                        data: { moduleName, status: moduleStatus }
                    };
                } catch (recoveryError) {
                    return {
                        success: false,
                        message: `Error en recuperación de módulo ${moduleName}: ${recoveryError.message}`,
                        error: recoveryError
                    };
                }
            }
        });

        // Estrategia para errores de memoria
        this.addStrategy('MEMORY_ERROR', {
            name: 'Memory Recovery',
            priority: 3,
            timeout: 3000,
            maxAttempts: 2,
            handler: async (error, context) => {
                console.log('[ErrorRecovery] Iniciando recuperación de memoria...');
                
                try {
                    // Paso 1: Forzar garbage collection si está disponible
                    if (window.gc) {
                        console.log('[ErrorRecovery] Ejecutando garbage collection manual...');
                        window.gc();
                    }

                    // Paso 2: Limpiar caches de módulos
                    this.eventBus.emit('renderer:clear-cache', { aggressive: true });
                    this.eventBus.emit('world:clear-cache');
                    this.eventBus.emit('player:clear-cache');
                    await this.delay(500);

                    // Paso 3: Reducir calidad de renderizado temporalmente
                    this.eventBus.emit('renderer:reduce-quality', { 
                        temporary: true,
                        duration: 30000 // 30 segundos
                    });

                    // Paso 4: Verificar uso de memoria
                    const memoryUsage = this.getMemoryUsage();
                    
                    return {
                        success: true,
                        message: 'Memoria liberada exitosamente',
                        data: { memoryUsage }
                    };
                } catch (recoveryError) {
                    return {
                        success: false,
                        message: `Error en recuperación de memoria: ${recoveryError.message}`,
                        error: recoveryError
                    };
                }
            }
        });

        // Estrategia para errores de input
        this.addStrategy('INPUT_ERROR', {
            name: 'Input Recovery',
            priority: 2,
            timeout: 3000,
            maxAttempts: 3,
            handler: async (error, context) => {
                console.log('[ErrorRecovery] Iniciando recuperación de sistema de input...');
                
                try {
                    // Paso 1: Limpiar listeners existentes
                    this.eventBus.emit('input:cleanup-listeners');
                    await this.delay(200);

                    // Paso 2: Reinicializar sistema de input
                    this.eventBus.emit('input:reinitialize');
                    await this.delay(500);

                    // Paso 3: Verificar que los controles funcionan
                    const inputStatus = await this.checkInputStatus();
                    if (!inputStatus.isWorking) {
                        throw new Error('Sistema de input no responde después de recuperación');
                    }

                    return {
                        success: true,
                        message: 'Sistema de input recuperado exitosamente',
                        data: { inputStatus }
                    };
                } catch (recoveryError) {
                    return {
                        success: false,
                        message: `Error en recuperación de input: ${recoveryError.message}`,
                        error: recoveryError
                    };
                }
            }
        });

        // Estrategia para errores de renderizado
        this.addStrategy('RENDERER_ERROR', {
            name: 'Renderer Recovery',
            priority: 1,
            timeout: 6000,
            maxAttempts: 2,
            handler: async (error, context) => {
                console.log('[ErrorRecovery] Iniciando recuperación de renderer...');
                
                try {
                    // Paso 1: Pausar renderizado
                    this.eventBus.emit('renderer:pause');
                    await this.delay(200);

                    // Paso 2: Limpiar estado del renderer
                    this.eventBus.emit('renderer:clear-state');
                    await this.delay(300);

                    // Paso 3: Reinicializar renderer con configuración segura
                    this.eventBus.emit('renderer:reinitialize', { 
                        safeMode: true,
                        reducedEffects: true 
                    });
                    await this.delay(1000);

                    // Paso 4: Reanudar renderizado
                    this.eventBus.emit('renderer:resume');
                    await this.delay(500);

                    // Paso 5: Verificar que el renderizado funciona
                    const renderStatus = await this.checkRenderStatus();
                    if (!renderStatus.isWorking) {
                        throw new Error('Renderer no funciona después de recuperación');
                    }

                    return {
                        success: true,
                        message: 'Renderer recuperado exitosamente',
                        data: { renderStatus }
                    };
                } catch (recoveryError) {
                    return {
                        success: false,
                        message: `Error en recuperación de renderer: ${recoveryError.message}`,
                        error: recoveryError
                    };
                }
            }
        });
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        // Escuchar solicitudes de recuperación
        this.eventBus.on('recovery:attempt', (data) => {
            this.attemptRecovery(data.errorType, data.error, data.context);
        });

        // Escuchar cancelaciones de recuperación
        this.eventBus.on('recovery:cancel', (data) => {
            this.cancelRecovery(data.recoveryId);
        });
    }

    /**
     * Agregar estrategia de recuperación
     * @param {string} errorType - Tipo de error
     * @param {Object} strategy - Estrategia de recuperación
     */
    addStrategy(errorType, strategy) {
        const strategyConfig = {
            name: strategy.name || `Recovery for ${errorType}`,
            priority: strategy.priority || 5,
            timeout: strategy.timeout || this.config.recoveryTimeout,
            maxAttempts: strategy.maxAttempts || this.config.maxRetryAttempts,
            handler: strategy.handler,
            ...strategy
        };

        this.recoveryStrategies.set(errorType, strategyConfig);
        console.log(`[ErrorRecovery] Estrategia agregada para ${errorType}: ${strategyConfig.name}`);
    }

    /**
     * Remover estrategia de recuperación
     * @param {string} errorType - Tipo de error
     */
    removeStrategy(errorType) {
        if (this.recoveryStrategies.has(errorType)) {
            this.recoveryStrategies.delete(errorType);
            console.log(`[ErrorRecovery] Estrategia removida para ${errorType}`);
        }
    }

    /**
     * Intentar recuperación de error
     * @param {string} errorType - Tipo de error
     * @param {Object} error - Datos del error
     * @param {Object} context - Contexto del error
     * @returns {Promise<Object>} Resultado de la recuperación
     */
    async attemptRecovery(errorType, error, context = {}) {
        if (!this.config.enableAutoRecovery) {
            console.log('[ErrorRecovery] Recuperación automática deshabilitada');
            return { success: false, message: 'Recuperación automática deshabilitada' };
        }

        const strategy = this.recoveryStrategies.get(errorType);
        if (!strategy) {
            console.warn(`[ErrorRecovery] No hay estrategia para el tipo de error: ${errorType}`);
            return { success: false, message: `No hay estrategia para ${errorType}` };
        }

        const recoveryId = this.generateRecoveryId();
        const recoveryRecord = {
            id: recoveryId,
            errorType,
            error,
            context,
            strategy: strategy.name,
            startTime: Date.now(),
            attempts: 0,
            maxAttempts: strategy.maxAttempts,
            status: 'in_progress'
        };

        this.activeRecoveries.set(recoveryId, recoveryRecord);
        console.log(`[ErrorRecovery] Iniciando recuperación ${recoveryId} para ${errorType}`);

        try {
            const result = await this.executeRecoveryWithRetry(strategy, error, context, recoveryRecord);
            
            recoveryRecord.status = result.success ? 'completed' : 'failed';
            recoveryRecord.endTime = Date.now();
            recoveryRecord.duration = recoveryRecord.endTime - recoveryRecord.startTime;
            recoveryRecord.result = result;

            this.recoveryHistory.push(recoveryRecord);
            this.activeRecoveries.delete(recoveryId);

            // Emitir evento de resultado
            this.eventBus.emit('recovery:completed', {
                recoveryId,
                success: result.success,
                errorType,
                result
            });

            return result;
        } catch (recoveryError) {
            recoveryRecord.status = 'error';
            recoveryRecord.endTime = Date.now();
            recoveryRecord.duration = recoveryRecord.endTime - recoveryRecord.startTime;
            recoveryRecord.error = recoveryError;

            this.recoveryHistory.push(recoveryRecord);
            this.activeRecoveries.delete(recoveryId);

            console.error(`[ErrorRecovery] Error durante recuperación ${recoveryId}:`, recoveryError);
            
            this.eventBus.emit('recovery:error', {
                recoveryId,
                errorType,
                error: recoveryError
            });

            return {
                success: false,
                message: `Error durante recuperación: ${recoveryError.message}`,
                error: recoveryError
            };
        }
    }

    /**
     * Ejecutar recuperación con reintentos
     * @param {Object} strategy - Estrategia de recuperación
     * @param {Object} error - Error original
     * @param {Object} context - Contexto del error
     * @param {Object} recoveryRecord - Registro de recuperación
     * @returns {Promise<Object>} Resultado de la recuperación
     * @private
     */
    async executeRecoveryWithRetry(strategy, error, context, recoveryRecord) {
        let lastError = null;

        for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
            recoveryRecord.attempts = attempt;
            
            try {
                console.log(`[ErrorRecovery] Intento ${attempt}/${strategy.maxAttempts} para ${recoveryRecord.id}`);
                
                // Ejecutar estrategia con timeout
                const result = await this.executeWithTimeout(
                    strategy.handler(error, context),
                    strategy.timeout
                );

                if (result.success) {
                    console.log(`[ErrorRecovery] Recuperación exitosa en intento ${attempt}`);
                    return result;
                }

                lastError = result.error || new Error(result.message);
                console.warn(`[ErrorRecovery] Intento ${attempt} falló: ${result.message}`);

                // Esperar antes del siguiente intento (excepto en el último)
                if (attempt < strategy.maxAttempts) {
                    const delay = this.config.retryDelay * attempt;
                    console.log(`[ErrorRecovery] Esperando ${delay}ms antes del siguiente intento...`);
                    await this.delay(delay);
                }

            } catch (attemptError) {
                lastError = attemptError;
                console.error(`[ErrorRecovery] Error en intento ${attempt}:`, attemptError);

                if (attempt < strategy.maxAttempts) {
                    const delay = this.config.retryDelay * attempt;
                    await this.delay(delay);
                }
            }
        }

        return {
            success: false,
            message: `Recuperación falló después de ${strategy.maxAttempts} intentos`,
            error: lastError
        };
    }

    /**
     * Ejecutar función con timeout
     * @param {Promise} promise - Promesa a ejecutar
     * @param {number} timeout - Timeout en milisegundos
     * @returns {Promise} Promesa con timeout
     * @private
     */
    executeWithTimeout(promise, timeout) {
        return Promise.race([
            promise,
            new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Timeout de recuperación (${timeout}ms)`));
                }, timeout);
            })
        ]);
    }

    /**
     * Cancelar recuperación activa
     * @param {string} recoveryId - ID de la recuperación
     */
    cancelRecovery(recoveryId) {
        const recovery = this.activeRecoveries.get(recoveryId);
        if (recovery) {
            recovery.status = 'cancelled';
            recovery.endTime = Date.now();
            recovery.duration = recovery.endTime - recovery.startTime;

            this.recoveryHistory.push(recovery);
            this.activeRecoveries.delete(recoveryId);

            console.log(`[ErrorRecovery] Recuperación ${recoveryId} cancelada`);
            
            this.eventBus.emit('recovery:cancelled', { recoveryId });
        }
    }

    /**
     * Recrear canvas del juego
     * @returns {Promise<HTMLCanvasElement>} Canvas recreado
     * @private
     */
    async recreateCanvas() {
        console.log('[ErrorRecovery] Recreando canvas...');
        
        // Remover canvas existente si existe
        const existingCanvas = document.getElementById('gameCanvas');
        if (existingCanvas) {
            existingCanvas.remove();
        }

        // Crear nuevo canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'gameCanvas';
        canvas.width = 800;
        canvas.height = 400;
        canvas.setAttribute('aria-label', 'Canvas del juego Spikepulse');

        // Agregar al DOM
        const gameContainer = document.querySelector('.game-container') || document.body;
        gameContainer.appendChild(canvas);

        return canvas;
    }

    /**
     * Verificar estado de un módulo
     * @param {string} moduleName - Nombre del módulo
     * @returns {Promise<Object>} Estado del módulo
     * @private
     */
    async checkModuleStatus(moduleName) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ isWorking: false, error: 'Timeout verificando módulo' });
            }, 2000);

            // Escuchar respuesta del módulo
            const handleResponse = (data) => {
                if (data.moduleName === moduleName) {
                    clearTimeout(timeout);
                    this.eventBus.off('engine:module-status-response', handleResponse);
                    resolve({ isWorking: data.isWorking, data: data });
                }
            };

            this.eventBus.on('engine:module-status-response', handleResponse);
            this.eventBus.emit('engine:check-module-status', { moduleName });
        });
    }

    /**
     * Verificar estado del sistema de input
     * @returns {Promise<Object>} Estado del input
     * @private
     */
    async checkInputStatus() {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ isWorking: false, error: 'Timeout verificando input' });
            }, 1000);

            const handleResponse = (data) => {
                clearTimeout(timeout);
                this.eventBus.off('input:status-response', handleResponse);
                resolve({ isWorking: data.isWorking, data: data });
            };

            this.eventBus.on('input:status-response', handleResponse);
            this.eventBus.emit('input:check-status');
        });
    }

    /**
     * Verificar estado del renderer
     * @returns {Promise<Object>} Estado del renderer
     * @private
     */
    async checkRenderStatus() {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ isWorking: false, error: 'Timeout verificando renderer' });
            }, 1000);

            const handleResponse = (data) => {
                clearTimeout(timeout);
                this.eventBus.off('renderer:status-response', handleResponse);
                resolve({ isWorking: data.isWorking, data: data });
            };

            this.eventBus.on('renderer:status-response', handleResponse);
            this.eventBus.emit('renderer:check-status');
        });
    }

    /**
     * Obtener uso de memoria actual
     * @returns {Object} Información de memoria
     * @private
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                percentage: Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100)
            };
        }
        return { available: false };
    }

    /**
     * Generar ID único para recuperación
     * @returns {string} ID de recuperación
     * @private
     */
    generateRecoveryId() {
        return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Delay helper
     * @param {number} ms - Milisegundos a esperar
     * @returns {Promise} Promesa que se resuelve después del delay
     * @private
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Obtener estadísticas de recuperación
     * @returns {Object} Estadísticas
     */
    getStats() {
        const stats = {
            totalRecoveries: this.recoveryHistory.length,
            activeRecoveries: this.activeRecoveries.size,
            successfulRecoveries: this.recoveryHistory.filter(r => r.status === 'completed').length,
            failedRecoveries: this.recoveryHistory.filter(r => r.status === 'failed').length,
            cancelledRecoveries: this.recoveryHistory.filter(r => r.status === 'cancelled').length,
            averageRecoveryTime: 0,
            strategiesAvailable: this.recoveryStrategies.size,
            strategies: Array.from(this.recoveryStrategies.keys())
        };

        // Calcular tiempo promedio de recuperación
        const completedRecoveries = this.recoveryHistory.filter(r => r.duration);
        if (completedRecoveries.length > 0) {
            const totalTime = completedRecoveries.reduce((sum, r) => sum + r.duration, 0);
            stats.averageRecoveryTime = Math.round(totalTime / completedRecoveries.length);
        }

        return stats;
    }

    /**
     * Obtener historial de recuperaciones
     * @param {number} limit - Límite de registros
     * @returns {Array} Historial de recuperaciones
     */
    getRecoveryHistory(limit = 50) {
        return this.recoveryHistory
            .slice(-limit)
            .reverse();
    }

    /**
     * Limpiar historial de recuperaciones
     */
    clearHistory() {
        this.recoveryHistory = [];
        console.log('[ErrorRecovery] Historial de recuperaciones limpiado');
    }

    /**
     * Destruir el sistema de recuperación
     */
    destroy() {
        // Cancelar recuperaciones activas
        this.activeRecoveries.forEach((recovery, id) => {
            this.cancelRecovery(id);
        });

        // Limpiar datos
        this.recoveryStrategies.clear();
        this.recoveryHistory = [];
        this.activeRecoveries.clear();

        this.isInitialized = false;
        console.log('[ErrorRecovery] Sistema de recuperación destruido');
    }
}