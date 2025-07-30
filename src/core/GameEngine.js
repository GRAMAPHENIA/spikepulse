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

        this.init();
    }

    /**
     * Inicializar el motor del juego
     * @private
     */
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupStates();
        this.setupPerformanceSystems();
        this.loadModules();
        this.eventBus.setDebugMode(this.config.debug?.eventBus || false);

        console.log('[GameEngine] Motor inicializado');
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
            renderOptimizer: this.renderOptimizer?.getStats() || null
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