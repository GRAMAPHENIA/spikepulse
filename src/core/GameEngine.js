/**
 * GameEngine - Motor principal del juego Spikepulse
 * @module GameEngine
 */

import { EventBus } from './EventBus.js';
import { StateManager } from './StateManager.js';
import { PerformanceMonitor } from '../utils/PerformanceMonitor.js';
import { MemoryManager } from '../utils/MemoryManager.js';
import { PerformanceOptimizer } from '../utils/PerformanceOptimizer.js';
import { RenderOptimizer } from '../utils/RenderOptimizer.js';
import { PerformanceDisplay } from '../modules/debug/PerformanceDisplay.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { ErrorLogger } from '../utils/ErrorLogger.js';
import { ErrorRecovery } from '../utils/ErrorRecovery.js';
import { DebugManager } from '../modules/debug/DebugManager.js';
import { DeveloperConsole } from '../modules/debug/DeveloperConsole.js';

export class GameEngine {
    /**
     * Crea una nueva instancia del GameEngine
     * @param {Object} config - Configuración del juego
     */
    constructor(config) {
        this.config = config;
        this.eventBus = new EventBus();
        this.stateManager = new StateManager(this.eventBus);
        this.modules = new Map();
        this.moduleLoadOrder = [];
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.targetFPS = config.performance?.targetFPS || 60;
        this.frameTime = 1000 / this.targetFPS;
        this.frameCount = 0;
        this.fpsHistory = [];
        this.maxFPSHistory = 60;
        this.performanceMetrics = {
            updateTime: 0,
            renderTime: 0,
            totalFrameTime: 0,
            memoryUsage: 0
        };
        this.canvas = null;
        this.context = null;
        this.loadingTransitioned = false;

        // Sistemas de optimización y monitoreo
        this.performanceMonitor = null;
        this.memoryManager = null;
        this.performanceOptimizer = null;
        this.renderOptimizer = null;
        this.performanceDisplay = null;

        // Sistemas de manejo de errores
        this.errorHandler = null;
        this.errorLogger = null;
        this.errorRecovery = null;

        // Sistemas de debugging
        this.debugManager = null;
        this.developerConsole = null;

        this.init();
    }

    /**
     * Inicializar el motor del juego
     * @private
     */
    init() {
        this.setupErrorHandling();
        this.setupDebugging();
        this.setupCanvas();
        this.setupEventListeners();
        this.setupStates();
        this.setupPerformanceSystems();
        this.loadModules();
        this.eventBus.setDebugMode(this.config.debug?.eventBus || false);

        console.log('[GameEngine] Motor inicializado');
    }

    /**
     * Configurar sistema de manejo de errores
     * @private
     */
    setupErrorHandling() {
        try {
            // Inicializar ErrorLogger
            this.errorLogger = new ErrorLogger({
                maxLogSize: this.config.debug?.maxErrorLogs || 500,
                enableConsoleLog: this.config.debug?.enableErrorConsoleLog !== false,
                enableLocalStorage: this.config.debug?.enableErrorStorage !== false,
                logLevel: this.config.debug?.errorLogLevel || 'error'
            });

            // Inicializar ErrorRecovery
            this.errorRecovery = new ErrorRecovery(this.eventBus, {
                maxRetryAttempts: this.config.debug?.maxRecoveryAttempts || 3,
                retryDelay: this.config.debug?.recoveryRetryDelay || 1000,
                enableAutoRecovery: this.config.debug?.enableAutoRecovery !== false,
                recoveryTimeout: this.config.debug?.recoveryTimeout || 10000
            });

            // Inicializar ErrorHandler
            this.errorHandler = new ErrorHandler(this.eventBus, {
                maxErrors: this.config.debug?.maxErrors || 100,
                enableLogging: this.config.debug?.enableErrorLogging !== false,
                enableRecovery: this.config.debug?.enableErrorRecovery !== false,
                logLevel: this.config.debug?.errorLogLevel || 'error',
                retryAttempts: this.config.debug?.maxRecoveryAttempts || 3,
                retryDelay: this.config.debug?.recoveryRetryDelay || 1000
            });

            // Configurar eventos específicos del motor para manejo de errores
            this.setupErrorEvents();

            console.log('[GameEngine] Sistema de manejo de errores configurado');
        } catch (error) {
            console.error('[GameEngine] Error configurando sistema de manejo de errores:', error);
            // Continuar sin sistema de errores si hay problema
            this.errorHandler = null;
            this.errorLogger = null;
            this.errorRecovery = null;
        }
    }

    /**
     * Configurar eventos específicos para el manejo de errores
     * @private
     */
    setupErrorEvents() {
        // Eventos de recuperación de módulos
        this.eventBus.on('engine:reinitialize-module', (data) => {
            this.handleModuleRecovery(data.moduleName);
        });

        this.eventBus.on('engine:reload-module', (data) => {
            this.reloadModule(data.name);
        });

        this.eventBus.on('engine:cleanup-module', (data) => {
            this.cleanupModule(data.name);
        });

        // Eventos de verificación de estado
        this.eventBus.on('engine:check-module-status', (data) => {
            this.checkModuleStatus(data.moduleName);
        });

        // Eventos de recuperación de canvas
        this.eventBus.on('renderer:reinitialize-canvas', () => {
            this.handleCanvasRecovery();
        });

        // Eventos de limpieza de memoria
        this.eventBus.on('memory:cleanup', () => {
            this.performMemoryCleanup();
        });

        // Eventos de error específicos del motor
        this.eventBus.on('engine:critical-error', (data) => {
            this.handleCriticalError(data);
        });
    }

    /**
     * Manejar recuperación de módulo
     * @param {string} moduleName - Nombre del módulo
     * @private
     */
    async handleModuleRecovery(moduleName) {
        try {
            console.log(`[GameEngine] Iniciando recuperación de módulo: ${moduleName}`);
            
            const moduleWrapper = this.modules.get(moduleName);
            if (!moduleWrapper) {
                throw new Error(`Módulo ${moduleName} no encontrado`);
            }

            // Deshabilitar módulo temporalmente
            moduleWrapper.isEnabled = false;

            // Limpiar módulo
            if (typeof moduleWrapper.instance.destroy === 'function') {
                moduleWrapper.instance.destroy();
            }

            // Reinicializar módulo
            moduleWrapper.isInitialized = false;
            this.initializeModule(moduleName, moduleWrapper);

            // Reactivar módulo
            moduleWrapper.isEnabled = true;

            console.log(`[GameEngine] Módulo ${moduleName} recuperado exitosamente`);
            
            this.eventBus.emit('engine:module-recovered', { 
                moduleName, 
                success: true 
            });

        } catch (error) {
            console.error(`[GameEngine] Error recuperando módulo ${moduleName}:`, error);
            
            this.eventBus.emit('engine:module-recovered', { 
                moduleName, 
                success: false, 
                error 
            });
        }
    }

    /**
     * Recargar un módulo específico
     * @param {string} moduleName - Nombre del módulo
     * @private
     */
    async reloadModule(moduleName) {
        try {
            console.log(`[GameEngine] Recargando módulo: ${moduleName}`);
            
            // Desregistrar módulo actual
            this.unregisterModule(moduleName);

            // Recargar módulo dinámicamente
            let ModuleClass;
            switch (moduleName) {
                case 'renderer':
                    ModuleClass = (await import('../modules/renderer/Renderer.js')).Renderer;
                    break;
                case 'player':
                    ModuleClass = (await import('../modules/player/Player.js')).Player;
                    break;
                case 'world':
                    ModuleClass = (await import('../modules/world/World.js')).World;
                    break;
                case 'input':
                    ModuleClass = (await import('../modules/input/InputManager.js')).InputManager;
                    break;
                default:
                    throw new Error(`Módulo desconocido: ${moduleName}`);
            }

            // Crear nueva instancia
            const newInstance = new ModuleClass(this.config, this.eventBus);
            
            // Registrar módulo con prioridad apropiada
            const priorities = {
                renderer: 100,
                world: 80,
                player: 70,
                input: 90
            };

            this.registerModule({
                name: moduleName,
                instance: newInstance,
                priority: priorities[moduleName] || 50
            });

            console.log(`[GameEngine] Módulo ${moduleName} recargado exitosamente`);

        } catch (error) {
            console.error(`[GameEngine] Error recargando módulo ${moduleName}:`, error);
            throw error;
        }
    }

    /**
     * Limpiar un módulo específico
     * @param {string} moduleName - Nombre del módulo
     * @private
     */
    cleanupModule(moduleName) {
        const moduleWrapper = this.modules.get(moduleName);
        if (moduleWrapper) {
            try {
                // Ejecutar limpieza específica del módulo
                if (typeof moduleWrapper.instance.cleanup === 'function') {
                    moduleWrapper.instance.cleanup();
                }

                // Limpiar eventos del módulo
                this.eventBus.offContext(moduleWrapper.instance);

                console.log(`[GameEngine] Módulo ${moduleName} limpiado`);
            } catch (error) {
                console.error(`[GameEngine] Error limpiando módulo ${moduleName}:`, error);
            }
        }
    }

    /**
     * Verificar estado de un módulo
     * @param {string} moduleName - Nombre del módulo
     * @private
     */
    checkModuleStatus(moduleName) {
        const moduleWrapper = this.modules.get(moduleName);
        
        const status = {
            moduleName,
            exists: !!moduleWrapper,
            isInitialized: moduleWrapper?.isInitialized || false,
            isEnabled: moduleWrapper?.isEnabled || false,
            isWorking: false,
            lastUpdateTime: moduleWrapper?.lastUpdateTime || 0,
            lastRenderTime: moduleWrapper?.lastRenderTime || 0
        };

        // Verificar si el módulo está funcionando
        if (moduleWrapper && moduleWrapper.isInitialized && moduleWrapper.isEnabled) {
            try {
                // Verificar si el módulo tiene métodos básicos
                const hasUpdate = typeof moduleWrapper.instance.update === 'function';
                const hasRender = typeof moduleWrapper.instance.render === 'function';
                
                status.isWorking = hasUpdate || hasRender;
                status.hasUpdate = hasUpdate;
                status.hasRender = hasRender;
            } catch (error) {
                status.isWorking = false;
                status.error = error.message;
            }
        }

        this.eventBus.emit('engine:module-status-response', status);
    }

    /**
     * Manejar recuperación de canvas
     * @private
     */
    async handleCanvasRecovery() {
        try {
            console.log('[GameEngine] Iniciando recuperación de canvas...');
            
            // Verificar si el canvas existe
            let canvas = document.getElementById('gameCanvas');
            if (!canvas) {
                // Crear nuevo canvas
                canvas = document.createElement('canvas');
                canvas.id = 'gameCanvas';
                canvas.width = this.config.canvas?.width || 800;
                canvas.height = this.config.canvas?.height || 400;
                canvas.setAttribute('aria-label', 'Canvas del juego Spikepulse');

                // Agregar al DOM
                const gameContainer = document.querySelector('.game-container') || document.body;
                gameContainer.appendChild(canvas);
            }

            // Actualizar referencias
            this.canvas = canvas;
            this.context = canvas.getContext('2d');

            if (!this.context) {
                throw new Error('No se puede obtener contexto 2D');
            }

            // Configurar propiedades del contexto
            this.context.imageSmoothingEnabled = true;
            this.context.imageSmoothingQuality = 'high';

            // Notificar al renderer
            const rendererWrapper = this.modules.get('renderer');
            if (rendererWrapper && rendererWrapper.instance) {
                if (typeof rendererWrapper.instance.updateCanvas === 'function') {
                    rendererWrapper.instance.updateCanvas(canvas, this.context);
                }
            }

            console.log('[GameEngine] Canvas recuperado exitosamente');
            
            this.eventBus.emit('engine:canvas-recovered', { 
                canvas, 
                context: this.context 
            });

        } catch (error) {
            console.error('[GameEngine] Error recuperando canvas:', error);
            throw error;
        }
    }

    /**
     * Realizar limpieza de memoria
     * @private
     */
    performMemoryCleanup() {
        try {
            console.log('[GameEngine] Iniciando limpieza de memoria...');

            // Forzar garbage collection si está disponible
            if (window.gc) {
                window.gc();
            }

            // Limpiar caches de módulos
            this.modules.forEach((moduleWrapper, name) => {
                if (moduleWrapper.instance && typeof moduleWrapper.instance.clearCache === 'function') {
                    moduleWrapper.instance.clearCache();
                }
            });

            // Limpiar historial de FPS
            this.fpsHistory = this.fpsHistory.slice(-30); // Mantener solo los últimos 30

            console.log('[GameEngine] Limpieza de memoria completada');
            
            this.eventBus.emit('engine:memory-cleaned');

        } catch (error) {
            console.error('[GameEngine] Error durante limpieza de memoria:', error);
        }
    }

    /**
     * Manejar error crítico
     * @param {Object} errorData - Datos del error crítico
     * @private
     */
    handleCriticalError(errorData) {
        console.error('[GameEngine] Error crítico detectado:', errorData);

        try {
            // Pausar el juego
            this.pause();

            // Notificar al usuario
            this.eventBus.emit('ui:show-critical-error', {
                message: 'Error crítico detectado. El juego se ha pausado.',
                error: errorData,
                actions: ['restart', 'continue']
            });

            // Intentar recuperación automática si está habilitada
            if (this.errorRecovery && this.config.debug?.enableAutoRecovery) {
                setTimeout(() => {
                    this.errorRecovery.attemptRecovery('ENGINE_ERROR', errorData, {
                        context: 'critical_error'
                    });
                }, 2000);
            }

        } catch (recoveryError) {
            console.error('[GameEngine] Error durante manejo de error crítico:', recoveryError);
        }
    }

    /**
     * Configurar sistemas de debugging
     * @private
     */
    setupDebugging() {
        try {
            // Inicializar DeveloperConsole
            this.developerConsole = new DeveloperConsole(this.eventBus, {
                maxHistory: this.config.debug?.maxConsoleHistory || 100,
                maxOutput: this.config.debug?.maxConsoleOutput || 500,
                enableAutoComplete: this.config.debug?.enableConsoleAutoComplete !== false,
                enableHistory: this.config.debug?.enableConsoleHistory !== false
            });

            // Inicializar DebugManager
            this.debugManager = new DebugManager(this.config, this.eventBus);

            // Configurar eventos específicos del motor para debugging
            this.setupDebugEvents();

            console.log('[GameEngine] Sistemas de debugging configurados');
        } catch (error) {
            console.error('[GameEngine] Error configurando sistemas de debugging:', error);
            // Continuar sin sistemas de debug si hay problema
            this.debugManager = null;
            this.developerConsole = null;
        }
    }

    /**
     * Configurar eventos específicos para debugging
     * @private
     */
    setupDebugEvents() {
        // Eventos de solicitud de información para la consola
        this.eventBus.on('console:request-fps', () => {
            const fps = Math.round(1000 / this.deltaTime);
            const avgFPS = this.getAverageFPS();
            this.developerConsole?.log(`FPS: ${fps} (Promedio: ${avgFPS})`, 'info');
        });

        this.eventBus.on('console:request-game-state', () => {
            const currentState = this.stateManager.getCurrentState();
            this.developerConsole?.log(`Estado actual: ${currentState}`, 'info');
        });

        this.eventBus.on('console:request-memory-info', () => {
            if (performance.memory) {
                const used = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
                const total = (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(1);
                const limit = (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1);
                this.developerConsole?.log(`Memoria: ${used}MB / ${total}MB (Límite: ${limit}MB)`, 'info');
            } else {
                this.developerConsole?.log('Información de memoria no disponible', 'warning');
            }
        });

        this.eventBus.on('console:request-player-info', () => {
            const playerModule = this.modules.get('player');
            if (playerModule && playerModule.instance) {
                const playerInfo = playerModule.instance.getDebugInfo?.() || 'Info no disponible';
                this.developerConsole?.log(`Jugador: ${JSON.stringify(playerInfo, null, 2)}`, 'info');
            } else {
                this.developerConsole?.log('Módulo de jugador no disponible', 'error');
            }
        });

        this.eventBus.on('console:request-game-speed', () => {
            // Asumir velocidad normal por defecto
            this.developerConsole?.log('Velocidad del juego: 1.0x', 'info');
        });

        // Eventos de modificación de propiedades del jugador
        this.eventBus.on('console:get-player-property', (data) => {
            const playerModule = this.modules.get('player');
            if (playerModule && playerModule.instance) {
                const value = playerModule.instance.getProperty?.(data.property);
                if (value !== undefined) {
                    this.developerConsole?.log(`${data.property}: ${value}`, 'info');
                } else {
                    this.developerConsole?.log(`Propiedad no encontrada: ${data.property}`, 'error');
                }
            } else {
                this.developerConsole?.log('Módulo de jugador no disponible', 'error');
            }
        });

        this.eventBus.on('console:set-player-property', (data) => {
            const playerModule = this.modules.get('player');
            if (playerModule && playerModule.instance) {
                const success = playerModule.instance.setProperty?.(data.property, data.value);
                if (success) {
                    this.developerConsole?.log(`${data.property} = ${data.value}`, 'success');
                } else {
                    this.developerConsole?.log(`No se pudo establecer ${data.property}`, 'error');
                }
            } else {
                this.developerConsole?.log('Módulo de jugador no disponible', 'error');
            }
        });

        // Eventos de control del juego
        this.eventBus.on('game:set-speed', (data) => {
            // Implementar cambio de velocidad del juego
            this.gameSpeed = data.speed;
            this.developerConsole?.log(`Velocidad del juego establecida a ${data.speed}x`, 'success');
        });

        this.eventBus.on('game:toggle-pause', () => {
            if (this.isRunning) {
                this.pause();
                this.developerConsole?.log('Juego pausado', 'info');
            } else {
                this.resume();
                this.developerConsole?.log('Juego reanudado', 'info');
            }
        });

        this.eventBus.on('game:reset', () => {
            this.resetGame();
            this.developerConsole?.log('Juego reiniciado', 'success');
        });

        // Eventos de debug
        this.eventBus.on('debug:toggle', (data) => {
            if (this.debugManager) {
                if (data.enabled !== undefined) {
                    if (data.enabled) {
                        this.debugManager.isDebugMode = true;
                        if (!this.debugManager.isInitialized) {
                            this.debugManager.init();
                        }
                    } else {
                        this.debugManager.isDebugMode = false;
                    }
                } else {
                    this.debugManager.toggleDebugMode();
                }
            }
        });

        this.eventBus.on('debug:clear-logs', () => {
            if (this.errorLogger) {
                this.errorLogger.clearLogs({ all: true });
            }
            this.developerConsole?.log('Logs de error limpiados', 'success');
        });

        // Eventos de solicitud de hitboxes para debug
        this.eventBus.on('debug:request-hitboxes', (data) => {
            // Solicitar hitboxes a todos los módulos
            this.modules.forEach((moduleWrapper, name) => {
                if (moduleWrapper.instance && typeof moduleWrapper.instance.renderDebugHitboxes === 'function') {
                    moduleWrapper.instance.renderDebugHitboxes(data.context);
                }
            });
        });

        // Eventos de estadísticas de módulos
        this.eventBus.on('engine:request-module-stats', () => {
            const moduleStats = {};
            this.modules.forEach((moduleWrapper, name) => {
                moduleStats[name] = {
                    isInitialized: moduleWrapper.isInitialized,
                    isEnabled: moduleWrapper.isEnabled,
                    priority: moduleWrapper.priority,
                    lastUpdateTime: moduleWrapper.lastUpdateTime,
                    lastRenderTime: moduleWrapper.lastRenderTime
                };
            });

            this.eventBus.emit('engine:module-stats-response', moduleStats);
        });

        // Actualizar contexto de la consola con referencias del juego
        this.eventBus.emit('game:context-updated', {
            game: this,
            modules: this.modules
        });
    }

    /**
     * Reiniciar el juego
     * @private
     */
    resetGame() {
        try {
            // Pausar el juego
            const wasRunning = this.isRunning;
            this.pause();

            // Reinicializar módulos
            this.modules.forEach((moduleWrapper, name) => {
                if (moduleWrapper.instance && typeof moduleWrapper.instance.reset === 'function') {
                    moduleWrapper.instance.reset();
                }
            });

            // Cambiar al estado inicial
            this.stateManager.changeState('menu');

            // Reanudar si estaba corriendo
            if (wasRunning) {
                this.resume();
            }

            console.log('[GameEngine] Juego reiniciado');
            this.eventBus.emit('game:reset-completed');

        } catch (error) {
            console.error('[GameEngine] Error reiniciando juego:', error);
            this.eventBus.emit('engine:error', { error, context: 'resetGame' });
        }
    }

    /**
     * Configurar el canvas del juego
     * @private
     */
    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            throw new Error('Canvas del juego no encontrado');
        }

        this.context = this.canvas.getContext('2d');
        if (!this.context) {
            throw new Error('Contexto 2D no disponible');
        }

        // Configurar propiedades del contexto
        this.context.imageSmoothingEnabled = true;
        this.context.imageSmoothingQuality = 'high';

        console.log('[GameEngine] Canvas configurado');
    }

    /**
     * Configurar estados del juego
     * @private
     */
    setupStates() {
        // Registrar estados básicos del juego
        this.stateManager.registerState('loading', {
            onEnter: () => console.log('[GameEngine] Entrando en estado loading'),
            onExit: () => console.log('[GameEngine] Saliendo de estado loading'),
            onUpdate: (deltaTime) => this.updateLoadingState(deltaTime),
            allowedTransitions: ['menu', 'error']
        });

        this.stateManager.registerState('menu', {
            onEnter: () => this.enterMenuState(),
            onExit: () => this.exitMenuState(),
            onUpdate: (deltaTime) => this.updateMenuState(deltaTime),
            allowedTransitions: ['playing', 'settings']
        });

        this.stateManager.registerState('playing', {
            onEnter: () => this.enterPlayingState(),
            onExit: () => this.exitPlayingState(),
            onUpdate: (deltaTime) => this.updatePlayingState(deltaTime),
            allowedTransitions: ['paused', 'gameOver', 'menu']
        });

        this.stateManager.registerState('paused', {
            onEnter: () => this.enterPausedState(),
            onExit: () => this.exitPausedState(),
            onUpdate: (deltaTime) => this.updatePausedState(deltaTime),
            allowedTransitions: ['playing', 'menu']
        });

        this.stateManager.registerState('gameOver', {
            onEnter: () => this.enterGameOverState(),
            onExit: () => this.exitGameOverState(),
            onUpdate: (deltaTime) => this.updateGameOverState(deltaTime),
            allowedTransitions: ['menu', 'playing']
        });

        // Establecer estado inicial
        // this.stateManager.changeState('loading');
        console.log('[GameEngine] Estados configurados, listo para usar');
    }

    /**
     * Configurar sistemas de rendimiento y optimización
     * @private
     */
    setupPerformanceSystems() {
        try {
            // Inicializar PerformanceMonitor
            this.performanceMonitor = new PerformanceMonitor(this.config, this.eventBus);
            console.log('[GameEngine] PerformanceMonitor inicializado');

            // Inicializar MemoryManager
            this.memoryManager = new MemoryManager(this.config, this.eventBus);
            console.log('[GameEngine] MemoryManager inicializado');

            // Inicializar PerformanceOptimizer
            this.performanceOptimizer = new PerformanceOptimizer(this.config, this.eventBus);
            console.log('[GameEngine] PerformanceOptimizer inicializado');

            // Inicializar RenderOptimizer
            this.renderOptimizer = new RenderOptimizer(this.config, this.eventBus);
            console.log('[GameEngine] RenderOptimizer inicializado');

            // Inicializar PerformanceDisplay si está habilitado en debug
            if (this.config.debug?.showPerformanceDisplay) {
                this.performanceDisplay = new PerformanceDisplay(this.config, this.eventBus);
                console.log('[GameEngine] PerformanceDisplay inicializado');
            }

            // Configurar eventos específicos del motor para el monitoreo
            this.setupPerformanceEvents();

            console.log('[GameEngine] Sistemas de rendimiento configurados');
        } catch (error) {
            console.error('[GameEngine] Error configurando sistemas de rendimiento:', error);
            // Continuar sin sistemas de rendimiento si hay error
            this.performanceMonitor = null;
            this.memoryManager = null;
            this.performanceOptimizer = null;
            this.renderOptimizer = null;
        }
    }

    /**
     * Configurar eventos específicos para el monitoreo de rendimiento
     * @private
     */
    setupPerformanceEvents() {
        // Eventos del motor para el PerformanceMonitor
        this.eventBus.on('engine:performance-update', (data) => {
            if (this.performanceMonitor) {
                this.eventBus.emit('performance:update', data);
            }
        });

        // Eventos de alerta de rendimiento
        this.eventBus.on('performance:alert', (data) => {
            console.warn(`[GameEngine] Alerta de rendimiento: ${data.message}`);
            
            // Tomar acciones automáticas según el tipo de alerta
            switch (data.type) {
                case 'low-fps':
                    this.handleLowFPSAlert(data);
                    break;
                case 'high-memory':
                    this.handleHighMemoryAlert(data);
                    break;
                case 'high-frame-time':
                    this.handleHighFrameTimeAlert(data);
                    break;
            }
        });

        // Eventos de optimización
        this.eventBus.on('optimizer:optimization-completed', (data) => {
            console.log(`[GameEngine] Optimización completada: ${data.optimizations.length} estrategias aplicadas`);
        });

        // Eventos de memoria
        this.eventBus.on('memory:gc-detected', (data) => {
            console.log(`[GameEngine] Garbage Collection detectado: ${data.memoryFreed} bytes liberados`);
        });
    }

    /**
     * Manejar alerta de FPS bajo
     * @param {Object} data - Datos de la alerta
     * @private
     */
    handleLowFPSAlert(data) {
        // Reducir calidad de renderizado automáticamente
        this.eventBus.emit('renderer:reduce-quality', { 
            reason: 'low-fps',
            targetFPS: data.data.target 
        });

        // Notificar a módulos sobre rendimiento bajo
        this.modules.forEach((moduleWrapper, name) => {
            if (typeof moduleWrapper.instance.onPerformanceAlert === 'function') {
                moduleWrapper.instance.onPerformanceAlert('low-fps', data);
            }
        });
    }

    /**
     * Manejar alerta de memoria alta
     * @param {Object} data - Datos de la alerta
     * @private
     */
    handleHighMemoryAlert(data) {
        // Forzar limpieza de memoria
        if (this.memoryManager) {
            this.memoryManager.performCleanup();
        }

        // Reducir cache de recursos
        this.eventBus.emit('renderer:clear-cache', { keepEssential: true });
        
        // Notificar a módulos
        this.modules.forEach((moduleWrapper, name) => {
            if (typeof moduleWrapper.instance.onPerformanceAlert === 'function') {
                moduleWrapper.instance.onPerformanceAlert('high-memory', data);
            }
        });
    }

    /**
     * Manejar alerta de tiempo de frame alto
     * @param {Object} data - Datos de la alerta
     * @private
     */
    handleHighFrameTimeAlert(data) {
        // Simplificar renderizado
        this.eventBus.emit('renderer:simplify-rendering', { 
            level: 1,
            reason: 'high-frame-time' 
        });

        // Reducir efectos visuales
        this.eventBus.emit('renderer:reduce-effects', { factor: 0.7 });
    }

    /**
     * Cargar todos los módulos del juego
     * @private
     */
    async loadModules() {
        console.log('[GameEngine] Cargando módulos del juego...');
        
        try {
            // Importar módulos dinámicamente
            const [
                { Renderer },
                { Player },
                { World },
                { InputManager }
            ] = await Promise.all([
                import('../modules/renderer/Renderer.js'),
                import('../modules/player/Player.js'),
                import('../modules/world/World.js'),
                import('../modules/input/InputManager.js')
            ]);

            // Crear instancias de los módulos con configuración
            const renderer = new Renderer(this.config, this.eventBus);
            const player = new Player(this.config, this.eventBus);
            const world = new World(this.config, this.eventBus);
            const inputManager = new InputManager(this.config, this.eventBus);

            // Registrar módulos en orden de prioridad
            this.registerModule({ name: 'renderer', instance: renderer, priority: 100 });
            this.registerModule({ name: 'world', instance: world, priority: 80 });
            this.registerModule({ name: 'player', instance: player, priority: 70 });
            this.registerModule({ name: 'input', instance: inputManager, priority: 90 });

            console.log('[GameEngine] Módulos cargados exitosamente');
            this.eventBus.emit('engine:modules-loaded');

        } catch (error) {
            console.error('[GameEngine] Error cargando módulos:', error);
            this.eventBus.emit('engine:error', { error, context: 'loadModules' });
            throw error;
        }
    }

    /**
     * Configurar listeners de eventos del sistema
     * @private
     */
    setupEventListeners() {
        // Eventos del sistema
        this.eventBus.on('engine:start', this.start, this);
        this.eventBus.on('engine:stop', this.stop, this);
        this.eventBus.on('engine:pause', this.pause, this);
        this.eventBus.on('engine:resume', this.resume, this);

        // Eventos de módulos
        this.eventBus.on('module:register', this.registerModule, this);
        this.eventBus.on('module:unregister', this.unregisterModule, this);

        // Eventos de estado
        this.eventBus.on('state:change', this.handleStateChange, this);
    }

    /**
     * Registrar un módulo en el motor
     * @param {Object} moduleData - Datos del módulo {name, instance, priority}
     */
    registerModule(moduleData) {
        const { name, instance, priority = 0 } = moduleData;

        if (this.modules.has(name)) {
            console.warn(`[GameEngine] Módulo ${name} ya está registrado`);
            return;
        }

        // Validar que el módulo tenga la interfaz correcta
        if (!this.validateModuleInterface(instance)) {
            console.error(`[GameEngine] Módulo ${name} no tiene la interfaz correcta`);
            return;
        }

        const moduleWrapper = {
            instance,
            priority,
            isInitialized: false,
            isEnabled: true,
            lastUpdateTime: 0,
            lastRenderTime: 0
        };

        this.modules.set(name, moduleWrapper);

        // Mantener orden de carga por prioridad
        this.moduleLoadOrder = Array.from(this.modules.entries())
            .sort(([, a], [, b]) => b.priority - a.priority)
            .map(([name]) => name);

        // Inicializar el módulo si el motor está corriendo
        if (this.isRunning && typeof instance.init === 'function') {
            this.initializeModule(name, moduleWrapper);
        }

        console.log(`[GameEngine] Módulo registrado: ${name} (prioridad: ${priority})`);
        this.eventBus.emit('engine:module-registered', { name, instance, priority });
    }

    /**
     * Validar interfaz del módulo
     * @param {Object} instance - Instancia del módulo
     * @returns {boolean} True si la interfaz es válida
     * @private
     */
    validateModuleInterface(instance) {
        // Verificar que tenga al menos uno de los métodos requeridos
        const requiredMethods = ['init', 'update', 'render', 'destroy'];
        return requiredMethods.some(method => typeof instance[method] === 'function');
    }

    /**
     * Inicializar un módulo específico
     * @param {string} name - Nombre del módulo
     * @param {Object} moduleWrapper - Wrapper del módulo
     * @private
     */
    initializeModule(name, moduleWrapper) {
        if (moduleWrapper.isInitialized) {
            console.warn(`[GameEngine] Módulo ${name} ya está inicializado`);
            return;
        }

        try {
            console.log(`[GameEngine] Inicializando módulo: ${name}`);
            
            if (typeof moduleWrapper.instance.init === 'function') {
                // Pasar canvas y contexto al renderer específicamente
                if (name === 'renderer') {
                    moduleWrapper.instance.init(this.canvas, this.eventBus, this.config);
                } else {
                    moduleWrapper.instance.init(this.eventBus, this.config);
                }
            }
            
            moduleWrapper.isInitialized = true;
            console.log(`[GameEngine] Módulo ${name} inicializado correctamente`);
            
            this.eventBus.emit('engine:module-initialized', { name, instance: moduleWrapper.instance });
            
        } catch (error) {
            console.error(`[GameEngine] Error inicializando módulo ${name}:`, error);
            this.eventBus.emit('engine:module-error', {
                name,
                error,
                context: 'initialization'
            });
        }
    }
     * @private
     */
    initializeModule(name, moduleWrapper) {
        try {
            if (typeof moduleWrapper.instance.init === 'function') {
                moduleWrapper.instance.init(this.context, this.eventBus, this.config);
                moduleWrapper.isInitialized = true;
                console.log(`[GameEngine] Módulo ${name} inicializado`);
            }
        } catch (error) {
            console.error(`[GameEngine] Error inicializando módulo ${name}:`, error);
            moduleWrapper.isEnabled = false;
        }
    }

    /**
     * Desregistrar un módulo del motor
     * @param {string} name - Nombre del módulo
     */
    unregisterModule(name) {
        if (!this.modules.has(name)) {
            console.warn(`[GameEngine] Módulo ${name} no está registrado`);
            return;
        }

        const instance = this.modules.get(name);

        // Limpiar el módulo si tiene método destroy
        if (typeof instance.destroy === 'function') {
            instance.destroy();
        }

        this.modules.delete(name);
        console.log(`[GameEngine] Módulo desregistrado: ${name}`);
        this.eventBus.emit('engine:module-unregistered', { name });
    }

    /**
     * Obtener un módulo registrado
     * @param {string} name - Nombre del módulo
     * @returns {Object|null} Instancia del módulo o null
     */
    getModule(name) {
        return this.modules.get(name) || null;
    }

    /**
     * Iniciar el motor del juego
     */
    start() {
        if (this.isRunning) {
            console.warn('[GameEngine] El motor ya está corriendo');
            return;
        }

        this.isRunning = true;
        this.lastTime = performance.now();

        // Inicializar todos los módulos en orden de prioridad
        for (const moduleName of this.moduleLoadOrder) {
            const moduleWrapper = this.modules.get(moduleName);
            if (moduleWrapper && !moduleWrapper.isInitialized) {
                this.initializeModule(moduleName, moduleWrapper);
            }
        }

        // Iniciar el loop principal
        this.gameLoop();

        console.log('[GameEngine] Motor iniciado');
        this.eventBus.emit('engine:started');
    }

    /**
     * Detener el motor del juego
     */
    stop() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;

        // Limpiar todos los módulos en orden inverso
        for (let i = this.moduleLoadOrder.length - 1; i >= 0; i--) {
            const moduleName = this.moduleLoadOrder[i];
            const moduleWrapper = this.modules.get(moduleName);
            
            if (moduleWrapper && moduleWrapper.isInitialized) {
                try {
                    if (typeof moduleWrapper.instance.destroy === 'function') {
                        moduleWrapper.instance.destroy();
                    }
                    moduleWrapper.isInitialized = false;
                    console.log(`[GameEngine] Módulo ${moduleName} limpiado`);
                } catch (error) {
                    console.error(`[GameEngine] Error limpiando módulo ${moduleName}:`, error);
                }
            }
        }

        // Limpiar sistemas de manejo de errores
        if (this.errorHandler) {
            this.errorHandler.destroy();
            this.errorHandler = null;
        }

        if (this.errorLogger) {
            this.errorLogger.destroy();
            this.errorLogger = null;
        }

        if (this.errorRecovery) {
            this.errorRecovery.destroy();
            this.errorRecovery = null;
        }

        // Limpiar sistemas de debugging
        if (this.debugManager) {
            this.debugManager.destroy();
            this.debugManager = null;
        }

        if (this.developerConsole) {
            this.developerConsole.destroy();
            this.developerConsole = null;
        }

        console.log('[GameEngine] Motor detenido');
        this.eventBus.emit('engine:stopped');
    }

    /**
     * Pausar el motor del juego
     */
    pause() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        console.log('[GameEngine] Motor pausado');
        this.eventBus.emit('engine:paused');
    }

    /**
     * Reanudar el motor del juego
     */
    resume() {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();

        console.log('[GameEngine] Motor reanudado');
        this.eventBus.emit('engine:resumed');
    }

    /**
     * Loop principal del juego
     * @private
     */
    gameLoop() {
        if (!this.isRunning) {
            return;
        }

        const frameStartTime = performance.now();
        this.deltaTime = frameStartTime - this.lastTime;

        // Emitir evento de inicio de frame para el PerformanceMonitor
        this.eventBus.emit('engine:frame-start', { timestamp: frameStartTime });

        // Limitar deltaTime para evitar saltos grandes
        const maxDeltaTime = this.config.performance?.maxDeltaTime || 50;
        if (this.deltaTime > maxDeltaTime) {
            this.deltaTime = maxDeltaTime;
        }

        try {
            // Emitir evento de inicio de actualización
            this.eventBus.emit('engine:update-start', { timestamp: performance.now() });
            
            // Medir tiempo de actualización
            const updateStartTime = performance.now();
            this.update(this.deltaTime);
            this.performanceMetrics.updateTime = performance.now() - updateStartTime;
            
            // Emitir evento de fin de actualización
            this.eventBus.emit('engine:update-end', { 
                timestamp: performance.now(),
                updateTime: this.performanceMetrics.updateTime 
            });

            // Emitir evento de inicio de renderizado
            this.eventBus.emit('engine:render-start', { timestamp: performance.now() });
            
            // Medir tiempo de renderizado
            const renderStartTime = performance.now();
            this.render();
            this.performanceMetrics.renderTime = performance.now() - renderStartTime;
            
            // Emitir evento de fin de renderizado
            this.eventBus.emit('engine:render-end', { 
                timestamp: performance.now(),
                renderTime: this.performanceMetrics.renderTime 
            });

            // Calcular métricas de frame
            this.performanceMetrics.totalFrameTime = performance.now() - frameStartTime;
            this.updatePerformanceMetrics();

        } catch (error) {
            console.error('[GameEngine] Error en el game loop:', error);
            this.eventBus.emit('engine:error', { error, context: 'gameLoop' });
        }

        // Emitir evento de fin de frame
        this.eventBus.emit('engine:frame-end', { 
            timestamp: performance.now(),
            frameTime: this.performanceMetrics.totalFrameTime,
            deltaTime: this.deltaTime
        });

        this.lastTime = frameStartTime;
        this.frameCount++;

        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Actualizar métricas de performance
     * @private
     */
    updatePerformanceMetrics() {
        // Calcular FPS
        const currentFPS = Math.round(1000 / this.deltaTime);
        this.fpsHistory.push(currentFPS);

        // Mantener historial limitado
        if (this.fpsHistory.length > this.maxFPSHistory) {
            this.fpsHistory.shift();
        }

        // Obtener uso de memoria si está disponible
        if (performance.memory) {
            this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize;
        }

        // Emitir métricas cada segundo
        if (this.frameCount % this.targetFPS === 0) {
            this.eventBus.emit('engine:performance-update', {
                fps: currentFPS,
                avgFPS: this.getAverageFPS(),
                updateTime: this.performanceMetrics.updateTime,
                renderTime: this.performanceMetrics.renderTime,
                totalFrameTime: this.performanceMetrics.totalFrameTime,
                memoryUsage: this.performanceMetrics.memoryUsage,
                frameCount: this.frameCount
            });
        }
    }

    /**
     * Obtener FPS promedio
     * @returns {number} FPS promedio
     */
    getAverageFPS() {
        if (this.fpsHistory.length === 0) return 0;
        const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.fpsHistory.length);
    }

    /**
     * Actualizar todos los módulos
     * @param {number} deltaTime - Tiempo transcurrido desde la última actualización
     * @private
     */
    update(deltaTime) {
        // Actualizar el gestor de estados
        this.stateManager.update(deltaTime);

        // Actualizar módulos en orden de prioridad
        for (const moduleName of this.moduleLoadOrder) {
            const moduleWrapper = this.modules.get(moduleName);

            if (!moduleWrapper || !moduleWrapper.isEnabled || !moduleWrapper.isInitialized) {
                continue;
            }

            if (typeof moduleWrapper.instance.update === 'function') {
                try {
                    const moduleUpdateStart = performance.now();
                    moduleWrapper.instance.update(deltaTime, this.context);
                    moduleWrapper.lastUpdateTime = performance.now() - moduleUpdateStart;
                } catch (error) {
                    console.error(`[GameEngine] Error actualizando módulo ${moduleName}:`, error);
                    this.eventBus.emit('engine:module-error', {
                        name: moduleName,
                        error,
                        context: 'update'
                    });

                    // Deshabilitar módulo problemático
                    moduleWrapper.isEnabled = false;
                }
            }
        }

        // Actualizar sistemas de debugging
        if (this.debugManager) {
            this.debugManager.update(deltaTime);
        }

        // Emitir evento de actualización
        this.eventBus.emit('engine:update', { deltaTime });
    }

    /**
     * Renderizar todos los módulos
     * @private
     */
    render() {
        // Limpiar canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Renderizar módulos en orden de prioridad
        for (const moduleName of this.moduleLoadOrder) {
            const moduleWrapper = this.modules.get(moduleName);

            if (!moduleWrapper || !moduleWrapper.isEnabled || !moduleWrapper.isInitialized) {
                continue;
            }

            if (typeof moduleWrapper.instance.render === 'function') {
                try {
                    const moduleRenderStart = performance.now();
                    this.context.save();
                    moduleWrapper.instance.render(this.context);
                    this.context.restore();
                    moduleWrapper.lastRenderTime = performance.now() - moduleRenderStart;
                } catch (error) {
                    console.error(`[GameEngine] Error renderizando módulo ${moduleName}:`, error);
                    this.eventBus.emit('engine:module-error', {
                        name: moduleName,
                        error,
                        context: 'render'
                    });

                    // Deshabilitar módulo problemático
                    moduleWrapper.isEnabled = false;
                }
            }
        }

        // Renderizar sistemas de debugging
        if (this.debugManager) {
            this.debugManager.render(this.context);
        }

        // Emitir evento de renderizado
        this.eventBus.emit('engine:render');
    }

    /**
     * Manejar cambios de estado
     * @param {Object} stateData - Datos del cambio de estado
     * @private
     */
    handleStateChange(stateData) {
        const { from, to, data } = stateData;

        console.log(`[GameEngine] Cambio de estado: ${from} -> ${to}`);

        // Notificar a los módulos sobre el cambio de estado
        this.modules.forEach((instance, name) => {
            if (typeof instance.onStateChange === 'function') {
                try {
                    instance.onStateChange(from, to, data);
                } catch (error) {
                    console.error(`[GameEngine] Error en cambio de estado para módulo ${name}:`, error);
                }
            }
        });
    }

    /**
     * Obtener estadísticas del motor
     * @returns {Object} Estadísticas del motor
     */
    getStats() {
        const moduleStats = {};
        this.modules.forEach((wrapper, name) => {
            moduleStats[name] = {
                isInitialized: wrapper.isInitialized,
                isEnabled: wrapper.isEnabled,
                priority: wrapper.priority,
                lastUpdateTime: wrapper.lastUpdateTime,
                lastRenderTime: wrapper.lastRenderTime
            };
        });

        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            deltaTime: this.deltaTime,
            fps: Math.round(1000 / this.deltaTime),
            avgFPS: this.getAverageFPS(),
            frameCount: this.frameCount,
            targetFPS: this.targetFPS,
            modules: Array.from(this.modules.keys()),
            moduleCount: this.modules.size,
            moduleStats,
            currentState: this.stateManager.getCurrentState(),
            performanceMetrics: { ...this.performanceMetrics },
            eventBusStats: this.eventBus.getStats(),
            canvas: {
                width: this.canvas?.width || 0,
                height: this.canvas?.height || 0
            },
            // Estadísticas de sistemas de rendimiento
            performanceMonitor: this.performanceMonitor?.getCurrentMetrics() || null,
            memoryManager: this.memoryManager?.getStats() || null,
            performanceOptimizer: this.performanceOptimizer?.getStats() || null,
            renderOptimizer: this.renderOptimizer?.getStats() || null,
            
            // Estadísticas de sistemas de manejo de errores
            errorHandler: this.errorHandler?.getErrorStats() || null,
            errorLogger: this.errorLogger?.getStats() || null,
            errorRecovery: this.errorRecovery?.getStats() || null,
            
            // Estadísticas de sistemas de debugging
            debugManager: this.debugManager?.getStats() || null,
            developerConsole: this.developerConsole?.getStats() || null
        };
    }

    /**
     * Obtener estadísticas de rendimiento formateadas
     * @returns {Object} Estadísticas formateadas para mostrar
     */
    getPerformanceStats() {
        const stats = {
            motor: {
                fps: `${Math.round(1000 / this.deltaTime)} FPS`,
                fpsPromedio: `${this.getAverageFPS()} FPS`,
                tiempoFrame: `${this.performanceMetrics.totalFrameTime.toFixed(2)}ms`,
                tiempoUpdate: `${this.performanceMetrics.updateTime.toFixed(2)}ms`,
                tiempoRender: `${this.performanceMetrics.renderTime.toFixed(2)}ms`,
                frames: this.frameCount.toLocaleString('es-ES'),
                estado: this.stateManager.getCurrentState()
            }
        };

        // Agregar estadísticas de sistemas de rendimiento si están disponibles
        if (this.performanceMonitor) {
            stats.monitor = this.performanceMonitor.getFormattedStats();
        }

        if (this.memoryManager) {
            stats.memoria = this.memoryManager.getFormattedStats();
        }

        if (this.performanceOptimizer) {
            stats.optimizador = this.performanceOptimizer.getFormattedStats();
        }

        if (this.renderOptimizer) {
            stats.renderizador = this.renderOptimizer.getFormattedStats();
        }

        return stats;
    }

    /**
     * Obtener resumen de rendimiento
     * @returns {Object} Resumen de rendimiento
     */
    getPerformanceSummary() {
        const currentFPS = Math.round(1000 / this.deltaTime);
        const avgFPS = this.getAverageFPS();
        const fpsEfficiency = (avgFPS / this.targetFPS) * 100;

        let performanceLevel = 'excelente';
        if (fpsEfficiency < 60) performanceLevel = 'crítico';
        else if (fpsEfficiency < 80) performanceLevel = 'bajo';
        else if (fpsEfficiency < 95) performanceLevel = 'bueno';

        return {
            nivelRendimiento: performanceLevel,
            fpsActual: currentFPS,
            fpsPromedio: avgFPS,
            fpsObjetivo: this.targetFPS,
            eficienciaFPS: `${fpsEfficiency.toFixed(1)}%`,
            tiempoFramePromedio: `${this.performanceMetrics.totalFrameTime.toFixed(2)}ms`,
            usoMemoria: this.performanceMonitor?.getCurrentMetrics()?.memory?.used ? 
                this.formatBytes(this.performanceMonitor.getCurrentMetrics().memory.used) : 'No disponible',
            optimizacionesActivas: this.performanceOptimizer?.getStats()?.metrics?.optimizationsApplied || 0,
            alertasRendimiento: this.performanceMonitor?.getCurrentMetrics()?.counters?.errorsCount || 0
        };
    }

    /**
     * Formatear bytes en formato legible
     * @param {number} bytes - Bytes a formatear
     * @returns {string} Bytes formateados
     * @private
     */
    formatBytes(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    }

    /**
     * Forzar optimización de rendimiento
     */
    forceOptimization() {
        if (this.performanceOptimizer) {
            this.performanceOptimizer.forceOptimization();
        }
    }

    /**
     * Configurar nivel de rendimiento
     * @param {string} level - Nivel de rendimiento (high, medium, low)
     */
    setPerformanceLevel(level) {
        if (this.performanceOptimizer) {
            this.performanceOptimizer.setPerformanceLevel({ level });
        }
        
        // Notificar a módulos sobre el cambio de nivel
        this.modules.forEach((moduleWrapper, name) => {
            if (typeof moduleWrapper.instance.onPerformanceLevelChanged === 'function') {
                moduleWrapper.instance.onPerformanceLevelChanged(level);
            }
        });

        console.log(`[GameEngine] Nivel de rendimiento establecido: ${level}`);
    }

    /**
     * Habilitar/deshabilitar monitoreo de rendimiento
     * @param {boolean} enabled - Estado del monitoreo
     */
    setPerformanceMonitoring(enabled) {
        if (this.performanceMonitor) {
            this.performanceMonitor.setEnabled(enabled);
        }
        
        console.log(`[GameEngine] Monitoreo de rendimiento ${enabled ? 'habilitado' : 'deshabilitado'}`);
    }

    /**
     * Limpiar memoria manualmente
     */
    cleanupMemory() {
        if (this.memoryManager) {
            this.memoryManager.performCleanup();
        }
        
        // Sugerir garbage collection
        this.eventBus.emit('memory:force-gc');
        
        console.log('[GameEngine] Limpieza de memoria ejecutada');
    }

    /**
     * Alternar display de rendimiento
     */
    togglePerformanceDisplay() {
        if (this.performanceDisplay) {
            this.performanceDisplay.toggle();
        } else if (this.config.debug?.enabled) {
            // Crear display si no existe pero debug está habilitado
            this.performanceDisplay = new PerformanceDisplay(this.config, this.eventBus);
            this.performanceDisplay.setVisible(true);
        }
    }

    /**
     * Mostrar/ocultar display de rendimiento
     * @param {boolean} visible - Estado de visibilidad
     */
    setPerformanceDisplayVisible(visible) {
        if (this.performanceDisplay) {
            this.performanceDisplay.setVisible(visible);
        } else if (visible && this.config.debug?.enabled) {
            this.performanceDisplay = new PerformanceDisplay(this.config, this.eventBus);
            this.performanceDisplay.setVisible(true);
        }
    }

    // ===== MÉTODOS DE ESTADO =====

    /**
     * Actualizar estado de loading
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateLoadingState(deltaTime) {
        // Lógica de carga aquí
        // Por ahora, transición automática al menú después de un frame
        if (!this.loadingTransitioned) {
            this.loadingTransitioned = true;
            setTimeout(() => {
                this.stateManager.changeState('menu');
            }, 100);
        }
    }

    /**
     * Entrar al estado de menú
     * @private
     */
    enterMenuState() {
        this.eventBus.emit('ui:show-menu');
        console.log('[GameEngine] Estado: Menú');
    }

    /**
     * Salir del estado de menú
     * @private
     */
    exitMenuState() {
        this.eventBus.emit('ui:hide-menu');
    }

    /**
     * Actualizar estado de menú
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateMenuState(deltaTime) {
        // Lógica del menú
    }

    /**
     * Entrar al estado de juego
     * @private
     */
    enterPlayingState() {
        console.log('[GameEngine] Entrando al estado de juego');
        this.eventBus.emit('ui:show-game');
        this.eventBus.emit('game:start');
        console.log('[GameEngine] Estado: Jugando');
    }

    /**
     * Salir del estado de juego
     * @private
     */
    exitPlayingState() {
        this.eventBus.emit('game:stop');
    }

    /**
     * Actualizar estado de juego
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updatePlayingState(deltaTime) {
        // La lógica principal del juego se maneja en los módulos
    }

    /**
     * Entrar al estado de pausa
     * @private
     */
    enterPausedState() {
        this.isPaused = true;
        this.eventBus.emit('ui:show-pause');
        console.log('[GameEngine] Estado: Pausado');
    }

    /**
     * Salir del estado de pausa
     * @private
     */
    exitPausedState() {
        this.isPaused = false;
        this.eventBus.emit('ui:hide-pause');
    }

    /**
     * Actualizar estado de pausa
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updatePausedState(deltaTime) {
        // En pausa, no actualizar lógica del juego
    }

    /**
     * Entrar al estado de game over
     * @private
     */
    enterGameOverState() {
        this.eventBus.emit('ui:show-game-over');
        this.eventBus.emit('game:game-over');
        console.log('[GameEngine] Estado: Game Over');
    }

    /**
     * Salir del estado de game over
     * @private
     */
    exitGameOverState() {
        this.eventBus.emit('ui:hide-game-over');
    }

    /**
     * Actualizar estado de game over
     * @param {number} deltaTime - Tiempo transcurrido
     * @private
     */
    updateGameOverState(deltaTime) {
        // Lógica de game over
    }

    // ===== MÉTODOS PÚBLICOS ADICIONALES =====

    /**
     * Cambiar estado del juego
     * @param {string} newState - Nuevo estado
     * @param {Object} data - Datos adicionales
     */
    changeState(newState, data = {}) {
        this.stateManager.changeState(newState, data);
    }

    /**
     * Obtener estado actual
     * @returns {string} Estado actual
     */
    getCurrentState() {
        return this.stateManager.getCurrentState();
    }

    /**
     * Habilitar/deshabilitar módulo
     * @param {string} name - Nombre del módulo
     * @param {boolean} enabled - Estado habilitado
     */
    setModuleEnabled(name, enabled) {
        const moduleWrapper = this.modules.get(name);
        if (moduleWrapper) {
            moduleWrapper.isEnabled = enabled;
            console.log(`[GameEngine] Módulo ${name} ${enabled ? 'habilitado' : 'deshabilitado'}`);
        }
    }

    /**
     * Obtener información de módulo
     * @param {string} name - Nombre del módulo
     * @returns {Object|null} Información del módulo
     */
    getModuleInfo(name) {
        const moduleWrapper = this.modules.get(name);
        if (!moduleWrapper) return null;

        return {
            name,
            isInitialized: moduleWrapper.isInitialized,
            isEnabled: moduleWrapper.isEnabled,
            priority: moduleWrapper.priority,
            lastUpdateTime: moduleWrapper.lastUpdateTime,
            lastRenderTime: moduleWrapper.lastRenderTime
        };
    }

    /**
     * Limpiar recursos del motor
     */
    destroy() {
        this.stop();

        // Limpiar sistemas de rendimiento
        if (this.performanceMonitor) {
            this.performanceMonitor.destroy();
            this.performanceMonitor = null;
        }

        if (this.memoryManager) {
            this.memoryManager.destroy();
            this.memoryManager = null;
        }

        if (this.performanceOptimizer) {
            this.performanceOptimizer.destroy();
            this.performanceOptimizer = null;
        }

        if (this.renderOptimizer) {
            this.renderOptimizer.destroy();
            this.renderOptimizer = null;
        }

        if (this.performanceDisplay) {
            this.performanceDisplay.destroy();
            this.performanceDisplay = null;
        }

        // Limpiar módulos en orden inverso
        for (const moduleName of this.moduleLoadOrder.reverse()) {
            const moduleWrapper = this.modules.get(moduleName);
            if (moduleWrapper && typeof moduleWrapper.instance.destroy === 'function') {
                try {
                    moduleWrapper.instance.destroy();
                } catch (error) {
                    console.error(`[GameEngine] Error destruyendo módulo ${moduleName}:`, error);
                }
            }
        }

        this.eventBus.clear();
        this.modules.clear();
        this.moduleLoadOrder = [];
        this.fpsHistory = [];

        console.log('[GameEngine] Motor destruido');
    }
}