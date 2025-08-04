/**
 * Motor principal del juego Spikepulse
 * @module GameEngine
 */

import { EventBus } from './EventBus.js';
import { StateManager } from './StateManager.js';

export class GameEngine {
    /**
     * Crea una nueva instancia del motor de juego
     * @param {Object} config - Configuración del juego
     */
    constructor(config) {
        this.config = config;
        this.eventBus = new EventBus();
        this.stateManager = new StateManager(this.eventBus);
        this.modules = new Map();
        
        // Estado del game loop
        this.isRunning = false;
        this.isPaused = false;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.accumulatedTime = 0;
        this.frameCount = 0;
        this.targetFPS = config.canvas?.targetFPS || 60;
        this.frameTime = 1000 / this.targetFPS;
        
        // Canvas y renderizado
        this.canvas = null;
        this.ctx = null;
        this.canvasContainer = null;
        
        // Performance monitoring
        this.performance = {
            fps: 0,
            frameTime: 0,
            updateTime: 0,
            renderTime: 0,
            lastFPSUpdate: 0,
            frameHistory: []
        };
        
        // Sistema de capas de renderizado
        this.renderLayers = new Map();
        this.layerOrder = [];
        
        // Sistema de prioridades de módulos
        this.modulePriorities = new Map();
        this.updateOrder = [];
        
        // Manejo de errores
        this.errorRecovery = {
            maxErrors: 10,
            errorCount: 0,
            lastError: null,
            recoveryAttempts: 0
        };
        
        // Hooks del ciclo de vida
        this.lifecycleHooks = {
            beforeUpdate: [],
            afterUpdate: [],
            beforeRender: [],
            afterRender: [],
            onError: [],
            onStateChange: []
        };
        
        console.log('🎮 GameEngine creado con configuración avanzada');
    }
    
    /**
     * Inicializa el motor de juego
     */
    async init() {
        try {
            console.log('🔧 Inicializando GameEngine...');
            
            // Configurar canvas y renderizado
            await this.setupCanvas();
            await this.setupRenderLayers();
            
            // Inicializar sistemas del núcleo
            await this.initializeCoreModules();
            
            // Inicializar módulos del juego
            await this.initializeGameModules();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Configurar hooks del ciclo de vida
            this.setupLifecycleHooks();
            
            // Configurar sistema de performance
            this.setupPerformanceMonitoring();
            
            // Cambiar al estado inicial
            this.stateManager.changeState('menu');
            
            // Iniciar game loop
            this.start();
            
            console.log('✅ GameEngine inicializado correctamente');
            
            // Emitir evento de inicialización completa
            this.eventBus.emit('engine:initialized', {
                modules: Array.from(this.modules.keys()),
                config: this.config,
                performance: this.performance
            });
            
        } catch (error) {
            console.error('❌ Error al inicializar GameEngine:', error);
            await this.handleInitializationError(error);
            throw error;
        }
    }
    
    /**
     * Configura el canvas del juego
     */
    async setupCanvas() {
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            // Crear canvas si no existe
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'game-canvas';
            this.canvas.className = 'spikepulse-canvas';
            document.body.appendChild(this.canvas);
        }
        
        this.canvas.width = this.config.canvas.width;
        this.canvas.height = this.config.canvas.height;
        this.canvas.setAttribute('aria-label', 'Canvas del juego Spikepulse');
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('No se pudo obtener el contexto 2D del canvas');
        }
        
        console.log('🖼️ Canvas configurado:', this.canvas.width, 'x', this.canvas.height);
    }
    
    /**
     * Configura las capas de renderizado
     */
    async setupRenderLayers() {
        const layers = this.config.renderer?.layers || {
            background: 0,
            world: 1,
            obstacles: 2,
            player: 3,
            effects: 4,
            ui: 5
        };
        
        // Configurar capas ordenadas por z-index
        this.layerOrder = Object.entries(layers)
            .sort(([,a], [,b]) => a - b)
            .map(([name]) => name);
        
        // Inicializar mapas de capas
        for (const layerName of this.layerOrder) {
            this.renderLayers.set(layerName, []);
        }
        
        console.log('🎨 Capas de renderizado configuradas:', this.layerOrder);
    }
    
    /**
     * Inicializa módulos del núcleo del sistema
     */
    async initializeCoreModules() {
        console.log('🔧 Inicializando módulos del núcleo...');
        
        try {
            // Importar configuraciones
            const { getUIConfig, getPhysicsConfig } = await import('../config/index.js');
            
            // Inicializar UIManager
            const { UIManager } = await import('../modules/ui/UIManager.js');
            const uiConfig = await getUIConfig();
            const uiManager = new UIManager(uiConfig, this.eventBus);
            this.registerModule('ui', uiManager, 100); // Alta prioridad
            
            console.log('✅ Módulos del núcleo inicializados');
        } catch (error) {
            console.warn('⚠️ Error inicializando módulos del núcleo:', error);
            await this.initializeFallbackModules();
        }
    }
    
    /**
     * Inicializa módulos del juego
     */
    async initializeGameModules() {
        console.log('🎮 Inicializando módulos del juego...');
        
        const moduleConfigs = [
            { name: 'input', path: '../modules/input/InputManager.js', priority: 90 },
            { name: 'player', path: '../modules/player/Player.js', priority: 80 },
            { name: 'world', path: '../modules/world/World.js', priority: 70 },
            { name: 'renderer', path: '../modules/renderer/CanvasRenderer.js', priority: 60 }
        ];
        
        for (const moduleConfig of moduleConfigs) {
            try {
                await this.loadModule(moduleConfig);
            } catch (error) {
                console.warn(`⚠️ No se pudo cargar módulo ${moduleConfig.name}:`, error.message);
                // Continuar con otros módulos
            }
        }
        
        // Actualizar orden de actualización basado en prioridades
        this.updateModuleOrder();
        
        console.log('✅ Módulos del juego inicializados');
    }
    
    /**
     * Carga un módulo específico
     */
    async loadModule(moduleConfig) {
        try {
            const moduleClass = await import(moduleConfig.path);
            const ModuleClass = moduleClass.default || moduleClass[Object.keys(moduleClass)[0]];
            
            if (ModuleClass) {
                const moduleInstance = new ModuleClass(this.config, this.eventBus);
                this.registerModule(moduleConfig.name, moduleInstance, moduleConfig.priority);
                console.log(`📦 Módulo ${moduleConfig.name} cargado`);
            }
        } catch (error) {
            // El módulo no existe aún, esto es normal durante el desarrollo
            console.log(`📦 Módulo ${moduleConfig.name} no disponible (será implementado en tareas futuras)`);
        }
    }
    
    /**
     * Inicializa módulos de fallback básicos
     */
    async initializeFallbackModules() {
        try {
            const { UIManager } = await import('../modules/ui/UIManager.js');
            const basicUIConfig = { theme: 'noir', language: 'es' };
            const uiManager = new UIManager(basicUIConfig, this.eventBus);
            this.registerModule('ui', uiManager, 100);
            console.log('✅ UIManager básico inicializado como fallback');
        } catch (fallbackError) {
            console.error('❌ Error inicializando módulos de fallback:', fallbackError);
        }
    }
    
    /**
     * Configura los event listeners principales
     */
    setupEventListeners() {
        // Listener para cambios de estado
        this.eventBus.on('state:changed', this.handleStateChange.bind(this));
        
        // Listener para errores
        this.eventBus.on('error:*', this.handleError.bind(this));
        
        // Listener para redimensionado de ventana
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Listener para visibilidad de página
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        console.log('👂 Event listeners configurados');
    }
    
    /**
     * Inicia el game loop
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.gameLoop(this.lastFrameTime);
        
        console.log('▶️ Game loop iniciado');
    }
    
    /**
     * Detiene el game loop
     */
    stop() {
        this.isRunning = false;
        console.log('⏹️ Game loop detenido');
    }
    
    /**
     * Game loop principal con timing preciso
     * @param {number} currentTime - Tiempo actual
     */
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calcular delta time con límites
        const rawDelta = currentTime - this.lastFrameTime;
        this.deltaTime = Math.min(rawDelta, 1000 / 20); // Cap a 20 FPS mínimo
        this.lastFrameTime = currentTime;
        
        // Acumular tiempo para fixed timestep
        this.accumulatedTime += this.deltaTime;
        
        try {
            // Ejecutar hooks pre-update
            this.executeHooks('beforeUpdate', { deltaTime: this.deltaTime });
            
            // Fixed timestep updates para física consistente
            while (this.accumulatedTime >= this.frameTime) {
                if (!this.isPaused && this.shouldUpdate()) {
                    this.fixedUpdate(this.frameTime);
                }
                this.accumulatedTime -= this.frameTime;
            }
            
            // Variable timestep update para interpolación
            if (!this.isPaused && this.shouldUpdate()) {
                const interpolation = this.accumulatedTime / this.frameTime;
                this.variableUpdate(this.deltaTime, interpolation);
            }
            
            // Ejecutar hooks post-update
            this.executeHooks('afterUpdate', { deltaTime: this.deltaTime });
            
            // Ejecutar hooks pre-render
            this.executeHooks('beforeRender', { deltaTime: this.deltaTime });
            
            // Renderizar siempre (incluso en pausa para UI)
            this.render(this.deltaTime);
            
            // Ejecutar hooks post-render
            this.executeHooks('afterRender', { deltaTime: this.deltaTime });
            
            // Actualizar estadísticas de performance
            this.updatePerformanceStats(currentTime);
            
            // Reset error count en frames exitosos
            this.errorRecovery.errorCount = Math.max(0, this.errorRecovery.errorCount - 0.1);
            
        } catch (error) {
            this.handleGameLoopError(error, currentTime);
        }
        
        // Continuar el loop
        this.frameCount++;
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    /**
     * Determina si el juego debe actualizarse
     */
    shouldUpdate() {
        const activeStates = ['playing', 'paused'];
        return activeStates.includes(this.stateManager.currentState) || 
               this.config.debug?.enabled;
    }
    
    /**
     * Update con timestep fijo para física consistente
     * @param {number} fixedDelta - Delta time fijo
     */
    fixedUpdate(fixedDelta) {
        const updateStart = performance.now();
        
        // Actualizar módulos con timestep fijo
        for (const moduleName of this.updateOrder) {
            const module = this.modules.get(moduleName);
            if (module && module.fixedUpdate && typeof module.fixedUpdate === 'function') {
                try {
                    module.fixedUpdate(fixedDelta);
                } catch (error) {
                    console.error(`❌ Error en fixedUpdate del módulo ${moduleName}:`, error);
                    this.handleModuleError(moduleName, error, 'fixedUpdate');
                }
            }
        }
        
        // Emitir evento de fixed update
        this.eventBus.emit('game:fixed-update', { deltaTime: fixedDelta });
        
        this.performance.updateTime = performance.now() - updateStart;
    }
    
    /**
     * Update con timestep variable para interpolación
     * @param {number} deltaTime - Delta time variable
     * @param {number} interpolation - Factor de interpolación
     */
    variableUpdate(deltaTime, interpolation) {
        // Actualizar módulos con timestep variable
        for (const moduleName of this.updateOrder) {
            const module = this.modules.get(moduleName);
            if (module && module.update && typeof module.update === 'function') {
                try {
                    module.update(deltaTime, interpolation);
                } catch (error) {
                    console.error(`❌ Error actualizando módulo ${moduleName}:`, error);
                    this.handleModuleError(moduleName, error, 'update');
                }
            }
        }
        
        // Emitir evento de actualización
        this.eventBus.emit('game:update', { 
            deltaTime, 
            interpolation,
            frameCount: this.frameCount 
        });
    }
    
    /**
     * Actualiza la lógica del juego
     * @param {number} deltaTime - Tiempo transcurrido desde la última actualización
     */
    update(deltaTime) {
        // Actualizar módulos
        for (const [name, module] of this.modules) {
            if (module.update && typeof module.update === 'function') {
                try {
                    module.update(deltaTime);
                } catch (error) {
                    console.error(`❌ Error actualizando módulo ${name}:`, error);
                }
            }
        }
        
        // Emitir evento de actualización
        this.eventBus.emit('game:update', { deltaTime });
    }
    
    /**
     * Renderiza el juego con sistema de capas
     * @param {number} deltaTime - Delta time para interpolación
     */
    render(deltaTime) {
        if (!this.ctx) return;
        
        const renderStart = performance.now();
        
        // Limpiar canvas
        this.clearCanvas();
        
        // Limpiar capas de renderizado
        this.clearRenderLayers();
        
        // Recopilar objetos de renderizado por capas
        this.collectRenderObjects();
        
        // Renderizar por capas ordenadas
        this.renderLayers();
        
        // Renderizar debug si está habilitado
        if (this.config.debug?.enabled) {
            this.renderDebugInfo();
        }
        
        // Emitir evento de renderizado
        this.eventBus.emit('game:render', { 
            ctx: this.ctx, 
            deltaTime,
            layers: this.renderLayers 
        });
        
        this.performance.renderTime = performance.now() - renderStart;
    }
    
    /**
     * Limpia el canvas
     */
    clearCanvas() {
        this.ctx.fillStyle = this.config.canvas.backgroundColor || '#0F0F0F';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Limpia las capas de renderizado
     */
    clearRenderLayers() {
        for (const layer of this.renderLayers.values()) {
            layer.length = 0;
        }
    }
    
    /**
     * Recopila objetos de renderizado de todos los módulos
     */
    collectRenderObjects() {
        for (const [name, module] of this.modules) {
            if (module.getRenderObjects && typeof module.getRenderObjects === 'function') {
                try {
                    const renderObjects = module.getRenderObjects();
                    this.addRenderObjectsToLayers(renderObjects);
                } catch (error) {
                    console.error(`❌ Error obteniendo objetos de renderizado del módulo ${name}:`, error);
                }
            }
        }
    }
    
    /**
     * Añade objetos de renderizado a las capas apropiadas
     * @param {Array} renderObjects - Objetos de renderizado
     */
    addRenderObjectsToLayers(renderObjects) {
        for (const obj of renderObjects) {
            const layerName = obj.layer || 'world';
            const layer = this.renderLayers.get(layerName);
            if (layer) {
                layer.push(obj);
            }
        }
    }
    
    /**
     * Renderiza todas las capas en orden
     */
    renderLayers() {
        for (const layerName of this.layerOrder) {
            const layer = this.renderLayers.get(layerName);
            if (layer && layer.length > 0) {
                this.renderLayer(layerName, layer);
            }
        }
    }
    
    /**
     * Renderiza una capa específica
     * @param {string} layerName - Nombre de la capa
     * @param {Array} objects - Objetos a renderizar
     */
    renderLayer(layerName, objects) {
        this.ctx.save();
        
        // Ordenar objetos por z-index dentro de la capa
        objects.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        
        // Renderizar cada objeto
        for (const obj of objects) {
            try {
                if (obj.render && typeof obj.render === 'function') {
                    obj.render(this.ctx);
                } else if (obj.draw && typeof obj.draw === 'function') {
                    obj.draw(this.ctx);
                }
            } catch (error) {
                console.error(`❌ Error renderizando objeto en capa ${layerName}:`, error);
            }
        }
        
        this.ctx.restore();
    }
    
    /**
     * Renderiza información de debug
     */
    renderDebugInfo() {
        if (!this.config.debug?.showFPS && !this.config.debug?.showPerformance) return;
        
        this.ctx.save();
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'left';
        
        let y = 20;
        const lineHeight = 16;
        
        if (this.config.debug.showFPS) {
            this.ctx.fillText(`FPS: ${this.performance.fps}`, 10, y);
            y += lineHeight;
        }
        
        if (this.config.debug.showPerformance) {
            this.ctx.fillText(`Update: ${this.performance.updateTime.toFixed(2)}ms`, 10, y);
            y += lineHeight;
            this.ctx.fillText(`Render: ${this.performance.renderTime.toFixed(2)}ms`, 10, y);
            y += lineHeight;
            this.ctx.fillText(`Modules: ${this.modules.size}`, 10, y);
            y += lineHeight;
        }
        
        this.ctx.restore();
    }
    
    /**
     * Maneja cambios de estado del juego
     * @param {Object} data - Datos del cambio de estado
     */
    handleStateChange(data) {
        console.log(`🔄 Estado cambiado: ${data.from} -> ${data.to}`);
        
        // Notificar a módulos sobre el cambio de estado
        for (const [name, module] of this.modules) {
            if (module.onStateChange && typeof module.onStateChange === 'function') {
                try {
                    module.onStateChange(data);
                } catch (error) {
                    console.error(`❌ Error en cambio de estado del módulo ${name}:`, error);
                }
            }
        }
    }
    
    /**
     * Maneja errores del juego
     * @param {Object} errorData - Datos del error
     */
    handleError(errorData) {
        console.error('🚨 Error del juego:', errorData);
        
        // Implementar recuperación de errores en futuras tareas
        // Por ahora solo loggeamos
    }
    
    /**
     * Maneja el redimensionado de ventana
     */
    handleResize() {
        if (!this.canvas) return;
        
        // Mantener proporción del canvas
        const container = this.canvas.parentElement;
        if (container) {
            const containerRect = container.getBoundingClientRect();
            const aspectRatio = this.config.canvas.width / this.config.canvas.height;
            
            let newWidth = containerRect.width;
            let newHeight = newWidth / aspectRatio;
            
            if (newHeight > containerRect.height) {
                newHeight = containerRect.height;
                newWidth = newHeight * aspectRatio;
            }
            
            this.canvas.style.width = newWidth + 'px';
            this.canvas.style.height = newHeight + 'px';
        }
        
        this.eventBus.emit('game:resize', {
            width: this.canvas.width,
            height: this.canvas.height
        });
    }
    
    /**
     * Maneja cambios de visibilidad de la página
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Pausar el juego cuando la página no es visible
            if (this.stateManager.currentState === 'playing') {
                this.stateManager.changeState('paused');
            }
        }
    }
    
    /**
     * Configura hooks del ciclo de vida
     */
    setupLifecycleHooks() {
        // Hook para manejo de errores
        this.addLifecycleHook('onError', (error) => {
            console.error('🚨 Error capturado por hook:', error);
        });
        
        // Hook para cambios de estado
        this.addLifecycleHook('onStateChange', (data) => {
            console.log(`🔄 Hook de cambio de estado: ${data.from} -> ${data.to}`);
        });
        
        console.log('🪝 Hooks del ciclo de vida configurados');
    }
    
    /**
     * Configura monitoreo de performance
     */
    setupPerformanceMonitoring() {
        this.performance.lastFPSUpdate = performance.now();
        console.log('📊 Monitoreo de performance configurado');
    }
    
    /**
     * Actualiza estadísticas de performance
     * @param {number} currentTime - Tiempo actual
     */
    updatePerformanceStats(currentTime) {
        // Actualizar FPS cada segundo
        if (currentTime - this.performance.lastFPSUpdate >= 1000) {
            this.performance.fps = Math.round(this.frameCount * 1000 / (currentTime - this.performance.lastFPSUpdate));
            this.frameCount = 0;
            this.performance.lastFPSUpdate = currentTime;
            
            // Mantener historial de frames
            this.performance.frameHistory.push(this.performance.fps);
            if (this.performance.frameHistory.length > 60) {
                this.performance.frameHistory.shift();
            }
        }
        
        this.performance.frameTime = this.deltaTime;
    }
    
    /**
     * Ejecuta hooks del ciclo de vida
     * @param {string} hookName - Nombre del hook
     * @param {*} data - Datos para el hook
     */
    executeHooks(hookName, data) {
        const hooks = this.lifecycleHooks[hookName];
        if (hooks && hooks.length > 0) {
            for (const hook of hooks) {
                try {
                    hook(data);
                } catch (error) {
                    console.error(`❌ Error ejecutando hook ${hookName}:`, error);
                }
            }
        }
    }
    
    /**
     * Añade un hook del ciclo de vida
     * @param {string} hookName - Nombre del hook
     * @param {Function} callback - Función callback
     */
    addLifecycleHook(hookName, callback) {
        if (!this.lifecycleHooks[hookName]) {
            this.lifecycleHooks[hookName] = [];
        }
        this.lifecycleHooks[hookName].push(callback);
    }
    
    /**
     * Maneja errores del game loop
     * @param {Error} error - Error ocurrido
     * @param {number} currentTime - Tiempo actual
     */
    handleGameLoopError(error, currentTime) {
        this.errorRecovery.errorCount++;
        this.errorRecovery.lastError = error;
        
        console.error('❌ Error en game loop:', error);
        
        // Ejecutar hooks de error
        this.executeHooks('onError', { error, context: 'gameLoop', time: currentTime });
        
        // Si hay demasiados errores, intentar recuperación
        if (this.errorRecovery.errorCount > this.errorRecovery.maxErrors) {
            this.attemptErrorRecovery();
        }
    }
    
    /**
     * Maneja errores de módulos específicos
     * @param {string} moduleName - Nombre del módulo
     * @param {Error} error - Error ocurrido
     * @param {string} context - Contexto del error
     */
    handleModuleError(moduleName, error, context) {
        console.error(`❌ Error en módulo ${moduleName} (${context}):`, error);
        
        // Ejecutar hooks de error
        this.executeHooks('onError', { error, module: moduleName, context });
        
        // Intentar reinicializar el módulo si es crítico
        if (this.isModuleCritical(moduleName)) {
            this.attemptModuleRecovery(moduleName);
        }
    }
    
    /**
     * Maneja errores de inicialización
     * @param {Error} error - Error de inicialización
     */
    async handleInitializationError(error) {
        console.error('❌ Error de inicialización:', error);
        
        // Intentar inicialización con configuración mínima
        try {
            console.log('🔄 Intentando inicialización de emergencia...');
            await this.emergencyInitialization();
        } catch (emergencyError) {
            console.error('❌ Fallo la inicialización de emergencia:', emergencyError);
        }
    }
    
    /**
     * Intenta recuperación de errores
     */
    attemptErrorRecovery() {
        this.errorRecovery.recoveryAttempts++;
        
        console.log(`🔄 Intentando recuperación de errores (intento ${this.errorRecovery.recoveryAttempts})...`);
        
        if (this.errorRecovery.recoveryAttempts > 3) {
            console.error('❌ Demasiados intentos de recuperación, deteniendo el juego');
            this.stop();
            return;
        }
        
        // Reinicializar módulos no críticos
        this.reinitializeNonCriticalModules();
        
        // Reset contador de errores
        this.errorRecovery.errorCount = 0;
    }
    
    /**
     * Determina si un módulo es crítico
     * @param {string} moduleName - Nombre del módulo
     * @returns {boolean} True si es crítico
     */
    isModuleCritical(moduleName) {
        const criticalModules = ['ui', 'state', 'input'];
        return criticalModules.includes(moduleName);
    }
    
    /**
     * Intenta recuperar un módulo específico
     * @param {string} moduleName - Nombre del módulo
     */
    async attemptModuleRecovery(moduleName) {
        console.log(`🔄 Intentando recuperar módulo ${moduleName}...`);
        
        try {
            const module = this.modules.get(moduleName);
            if (module && module.reset && typeof module.reset === 'function') {
                module.reset();
                console.log(`✅ Módulo ${moduleName} recuperado`);
            }
        } catch (error) {
            console.error(`❌ Error recuperando módulo ${moduleName}:`, error);
        }
    }
    
    /**
     * Reinicializa módulos no críticos
     */
    async reinitializeNonCriticalModules() {
        const nonCriticalModules = Array.from(this.modules.keys())
            .filter(name => !this.isModuleCritical(name));
        
        for (const moduleName of nonCriticalModules) {
            try {
                await this.attemptModuleRecovery(moduleName);
            } catch (error) {
                console.warn(`⚠️ No se pudo recuperar módulo ${moduleName}:`, error);
            }
        }
    }
    
    /**
     * Inicialización de emergencia con configuración mínima
     */
    async emergencyInitialization() {
        // Configuración mínima de emergencia
        this.config = {
            canvas: { width: 800, height: 400, backgroundColor: '#000000', targetFPS: 30 },
            debug: { enabled: true, showFPS: true }
        };
        
        // Reintentar inicialización básica
        await this.setupCanvas();
        await this.initializeFallbackModules();
        this.setupEventListeners();
        
        console.log('🚑 Inicialización de emergencia completada');
    }
    
    /**
     * Actualiza el orden de módulos basado en prioridades
     */
    updateModuleOrder() {
        this.updateOrder = Array.from(this.modules.keys())
            .sort((a, b) => {
                const priorityA = this.modulePriorities.get(a) || 50;
                const priorityB = this.modulePriorities.get(b) || 50;
                return priorityB - priorityA; // Mayor prioridad primero
            });
        
        console.log('📋 Orden de actualización de módulos:', this.updateOrder);
    }
    
    /**
     * Registra un módulo en el motor
     * @param {string} name - Nombre del módulo
     * @param {Object} module - Instancia del módulo
     * @param {number} priority - Prioridad de actualización (mayor = primero)
     */
    registerModule(name, module, priority = 50) {
        this.modules.set(name, module);
        this.modulePriorities.set(name, priority);
        this.updateModuleOrder();
        
        console.log(`📦 Módulo registrado: ${name} (prioridad: ${priority})`);
        
        // Emitir evento de registro de módulo
        this.eventBus.emit('engine:module-registered', { name, module, priority });
    }
    
    /**
     * Pausa el game loop
     */
    pause() {
        if (!this.isPaused) {
            this.isPaused = true;
            console.log('⏸️ Game loop pausado');
            this.eventBus.emit('engine:paused');
        }
    }
    
    /**
     * Reanuda el game loop
     */
    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            console.log('▶️ Game loop reanudado');
            this.eventBus.emit('engine:resumed');
        }
    }
    
    /**
     * Alterna entre pausa y reanudación
     */
    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }
    
    /**
     * Obtiene un módulo registrado
     * @param {string} name - Nombre del módulo
     * @returns {Object|null} Instancia del módulo o null
     */
    getModule(name) {
        return this.modules.get(name) || null;
    }
    
    /**
     * Verifica si un módulo está registrado
     * @param {string} name - Nombre del módulo
     * @returns {boolean} True si está registrado
     */
    hasModule(name) {
        return this.modules.has(name);
    }
    
    /**
     * Desregistra un módulo
     * @param {string} name - Nombre del módulo
     * @returns {boolean} True si se desregistró exitosamente
     */
    unregisterModule(name) {
        const module = this.modules.get(name);
        if (module) {
            // Destruir el módulo si tiene método destroy
            if (module.destroy && typeof module.destroy === 'function') {
                try {
                    module.destroy();
                } catch (error) {
                    console.error(`❌ Error destruyendo módulo ${name}:`, error);
                }
            }
            
            this.modules.delete(name);
            this.modulePriorities.delete(name);
            this.updateModuleOrder();
            
            console.log(`📦 Módulo desregistrado: ${name}`);
            this.eventBus.emit('engine:module-unregistered', { name });
            return true;
        }
        return false;
    }
    
    /**
     * Obtiene información del estado del motor
     * @returns {Object} Estado del motor
     */
    getEngineStatus() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            currentState: this.stateManager.currentState,
            frameCount: this.frameCount,
            performance: { ...this.performance },
            modules: Array.from(this.modules.keys()),
            errorRecovery: { ...this.errorRecovery },
            config: this.config
        };
    }
    
    /**
     * Obtiene estadísticas de performance
     * @returns {Object} Estadísticas de performance
     */
    getPerformanceStats() {
        return {
            fps: this.performance.fps,
            frameTime: this.performance.frameTime,
            updateTime: this.performance.updateTime,
            renderTime: this.performance.renderTime,
            frameHistory: [...this.performance.frameHistory],
            averageFPS: this.performance.frameHistory.length > 0 
                ? Math.round(this.performance.frameHistory.reduce((a, b) => a + b, 0) / this.performance.frameHistory.length)
                : 0
        };
    }
    
    /**
     * Establece la configuración del motor
     * @param {Object} newConfig - Nueva configuración
     */
    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Actualizar FPS objetivo si cambió
        if (newConfig.canvas?.targetFPS) {
            this.targetFPS = newConfig.canvas.targetFPS;
            this.frameTime = 1000 / this.targetFPS;
        }
        
        console.log('⚙️ Configuración del motor actualizada');
        this.eventBus.emit('engine:config-updated', { config: this.config });
    }
    
    /**
     * Reinicia el motor completamente
     */
    async restart() {
        console.log('🔄 Reiniciando GameEngine...');
        
        // Detener el motor
        this.stop();
        
        // Limpiar módulos
        for (const [name, module] of this.modules) {
            this.unregisterModule(name);
        }
        
        // Reinicializar
        await this.init();
        
        console.log('✅ GameEngine reiniciado');
    }
    
    /**
     * Obtiene información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            engine: this.getEngineStatus(),
            performance: this.getPerformanceStats(),
            modules: Object.fromEntries(
                Array.from(this.modules.entries()).map(([name, module]) => [
                    name, 
                    {
                        priority: this.modulePriorities.get(name),
                        hasUpdate: typeof module.update === 'function',
                        hasRender: typeof module.render === 'function',
                        hasFixedUpdate: typeof module.fixedUpdate === 'function'
                    }
                ])
            ),
            renderLayers: Object.fromEntries(
                Array.from(this.renderLayers.entries()).map(([name, objects]) => [
                    name,
                    objects.length
                ])
            ),
            eventBus: {
                listenerCount: this.eventBus.getListenerCount ? this.eventBus.getListenerCount() : 'N/A'
            }
        };
    }
    
    /**
     * Limpia recursos y detiene el motor
     */
    destroy() {
        console.log('🧹 Destruyendo GameEngine...');
        
        this.stop();
        
        // Destruir módulos
        for (const [name, module] of this.modules) {
            if (module.destroy && typeof module.destroy === 'function') {
                try {
                    module.destroy();
                } catch (error) {
                    console.error(`❌ Error destruyendo módulo ${name}:`, error);
                }
            }
        }
        
        this.modules.clear();
        
        // Limpiar event listeners
        window.removeEventListener('resize', this.handleResize.bind(this));
        document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        console.log('✅ GameEngine destruido');
    }
}