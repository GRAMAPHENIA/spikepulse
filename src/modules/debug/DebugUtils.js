/**
 * Utilidades de debugging para Spikepulse
 * @module DebugUtils
 */

export class DebugUtils {
    /**
     * Crea una nueva instancia de utilidades de debug
     * @param {Object} config - Configuración de debug
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        // Configuración de debug
        this.debugConfig = {
            enabled: config.enabled || false,
            showHitboxes: config.showHitboxes || false,
            showVelocity: config.showVelocity || false,
            showGrid: config.showGrid || false,
            showFPS: config.showFPS || false,
            showMemory: config.showMemory || false,
            showCollisions: config.showCollisions || false,
            showCameraInfo: config.showCameraInfo || false,
            logLevel: config.logLevel || 'info', // 'debug', 'info', 'warn', 'error'
            maxLogEntries: config.maxLogEntries || 1000
        };
        
        // Referencias al juego
        this.gameEngine = null;
        this.canvas = null;
        this.ctx = null;
        
        // Estado de debug
        this.debugOverlay = null;
        this.debugPanel = null;
        this.isOverlayVisible = false;
        this.isPanelVisible = false;
        
        // Datos de debug
        this.debugData = {
            fps: 60,
            frameTime: 16.67,
            memory: { used: 0, total: 0 },
            objects: { total: 0, visible: 0, culled: 0 },
            collisions: { checks: 0, hits: 0 },
            camera: { x: 0, y: 0, zoom: 1 },
            player: { x: 0, y: 0, vx: 0, vy: 0 },
            performance: { update: 0, render: 0, total: 0 }
        };
        
        // Log de eventos
        this.eventLog = [];
        this.performanceLog = [];
        
        // Colores para debug
        this.debugColors = {
            hitbox: '#FF0000',
            velocity: '#00FF00',
            grid: '#333333',
            collision: '#FFFF00',
            camera: '#00FFFF',
            text: '#FFFFFF',
            background: 'rgba(0, 0, 0, 0.8)'
        };
        
        // Estadísticas
        this.stats = {
            overlaysDrawn: 0,
            logEntriesCreated: 0,
            debugCallsTotal: 0
        };
        
        console.log('🐛 DebugUtils creado');
    }
    
    /**
     * Inicializa las utilidades de debug
     */
    async init() {
        try {
            console.log('🔧 Inicializando DebugUtils...');
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Crear overlay de debug si está habilitado
            if (this.debugConfig.enabled) {
                this.createDebugOverlay();
                this.createDebugPanel();
            }
            
            // Configurar atajos de teclado
            this.setupKeyboardShortcuts();
            
            this.isInitialized = true;
            console.log('✅ DebugUtils inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando DebugUtils:', error);
            throw error;
        }
    }
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Eventos de debug
        this.eventBus.on('debug:toggle', this.toggle.bind(this));
        this.eventBus.on('debug:toggle-overlay', this.toggleOverlay.bind(this));
        this.eventBus.on('debug:toggle-panel', this.togglePanel.bind(this));
        this.eventBus.on('debug:log', this.log.bind(this));
        this.eventBus.on('debug:clear-log', this.clearLog.bind(this));
        this.eventBus.on('debug:update-config', this.updateConfig.bind(this));
        
        // Eventos del juego para recopilar datos
        this.eventBus.on('game:frame-rendered', this.updateFrameData.bind(this));
        this.eventBus.on('player:position-changed', this.updatePlayerData.bind(this));
        this.eventBus.on('camera:position-changed', this.updateCameraData.bind(this));
        this.eventBus.on('collision:detected', this.logCollision.bind(this));
        this.eventBus.on('performance:update', this.updatePerformanceData.bind(this));
        
        console.log('👂 Event listeners de debug configurados');
    }
    
    /**
     * Configura atajos de teclado para debug
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Solo procesar si debug está habilitado
            if (!this.debugConfig.enabled) return;
            
            // F1 - Toggle debug overlay
            if (event.key === 'F1') {
                event.preventDefault();
                this.toggleOverlay();
            }
            
            // F2 - Toggle debug panel
            if (event.key === 'F2') {
                event.preventDefault();
                this.togglePanel();
            }
            
            // F3 - Toggle hitboxes
            if (event.key === 'F3') {
                event.preventDefault();
                this.debugConfig.showHitboxes = !this.debugConfig.showHitboxes;
                this.log('debug', `Hitboxes: ${this.debugConfig.showHitboxes ? 'ON' : 'OFF'}`);
            }
            
            // F4 - Toggle grid
            if (event.key === 'F4') {
                event.preventDefault();
                this.debugConfig.showGrid = !this.debugConfig.showGrid;
                this.log('debug', `Grid: ${this.debugConfig.showGrid ? 'ON' : 'OFF'}`);
            }
            
            // F5 - Clear debug log
            if (event.key === 'F5') {
                event.preventDefault();
                this.clearLog();
            }
            
            // Ctrl + D - Toggle debug mode
            if (event.ctrlKey && event.key === 'd') {
                event.preventDefault();
                this.toggle();
            }
        });
        
        console.log('⌨️ Atajos de teclado de debug configurados');
    }
    
    /**
     * Crea el overlay de debug
     */
    createDebugOverlay() {
        this.debugOverlay = document.createElement('div');
        this.debugOverlay.id = 'debug-overlay';
        this.debugOverlay.className = 'debug-overlay';
        this.debugOverlay.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: ${this.debugColors.background};
            color: ${this.debugColors.text};
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 5px;
            z-index: 10000;
            pointer-events: none;
            display: none;
            max-width: 300px;
            line-height: 1.4;
        `;
        
        document.body.appendChild(this.debugOverlay);
        console.log('📊 Debug overlay creado');
    }
    
    /**
     * Crea el panel de debug
     */
    createDebugPanel() {
        this.debugPanel = document.createElement('div');
        this.debugPanel.id = 'debug-panel';
        this.debugPanel.className = 'debug-panel';
        this.debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 400px;
            max-height: 80vh;
            background: ${this.debugColors.background};
            color: ${this.debugColors.text};
            font-family: monospace;
            font-size: 11px;
            border-radius: 5px;
            z-index: 10001;
            display: none;
            overflow: hidden;
            border: 1px solid #333;
        `;
        
        // Crear contenido del panel
        this.debugPanel.innerHTML = `
            <div class="debug-panel-header" style="
                background: #333;
                padding: 8px 12px;
                border-bottom: 1px solid #555;
                font-weight: bold;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <span>🐛 Debug Panel</span>
                <button id="debug-panel-close" style="
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 16px;
                ">×</button>
            </div>
            <div class="debug-panel-content" style="
                padding: 12px;
                max-height: calc(80vh - 40px);
                overflow-y: auto;
            ">
                <div class="debug-section">
                    <h4 style="margin: 0 0 8px 0; color: #FFD700;">Controles</h4>
                    <div style="font-size: 10px; color: #CCC; margin-bottom: 12px;">
                        F1: Toggle Overlay | F2: Toggle Panel | F3: Hitboxes<br>
                        F4: Grid | F5: Clear Log | Ctrl+D: Toggle Debug
                    </div>
                </div>
                <div class="debug-section">
                    <h4 style="margin: 0 0 8px 0; color: #FFD700;">Configuración</h4>
                    <div id="debug-config-controls"></div>
                </div>
                <div class="debug-section">
                    <h4 style="margin: 0 0 8px 0; color: #FFD700;">Log de Eventos</h4>
                    <div id="debug-event-log" style="
                        max-height: 200px;
                        overflow-y: auto;
                        background: #111;
                        padding: 8px;
                        border-radius: 3px;
                        font-size: 10px;
                    "></div>
                </div>
                <div class="debug-section">
                    <h4 style="margin: 0 0 8px 0; color: #FFD700;">Performance</h4>
                    <div id="debug-performance-log" style="
                        max-height: 150px;
                        overflow-y: auto;
                        background: #111;
                        padding: 8px;
                        border-radius: 3px;
                        font-size: 10px;
                    "></div>
                </div>
            </div>
        `;
        
        // Configurar event listeners del panel
        const closeButton = this.debugPanel.querySelector('#debug-panel-close');
        closeButton.addEventListener('click', () => this.togglePanel());
        
        // Crear controles de configuración
        this.createConfigControls();
        
        document.body.appendChild(this.debugPanel);
        console.log('🎛️ Debug panel creado');
    }
    
    /**
     * Crea controles de configuración
     */
    createConfigControls() {
        const configContainer = this.debugPanel.querySelector('#debug-config-controls');
        
        const controls = [
            { key: 'showHitboxes', label: 'Mostrar Hitboxes' },
            { key: 'showVelocity', label: 'Mostrar Velocidad' },
            { key: 'showGrid', label: 'Mostrar Grid' },
            { key: 'showFPS', label: 'Mostrar FPS' },
            { key: 'showMemory', label: 'Mostrar Memoria' },
            { key: 'showCollisions', label: 'Mostrar Colisiones' },
            { key: 'showCameraInfo', label: 'Info de Cámara' }
        ];
        
        controls.forEach(control => {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'margin-bottom: 6px; display: flex; align-items: center;';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `debug-${control.key}`;
            checkbox.checked = this.debugConfig[control.key];
            checkbox.style.cssText = 'margin-right: 8px;';
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = control.label;
            label.style.cssText = 'font-size: 11px; cursor: pointer;';
            
            checkbox.addEventListener('change', (e) => {
                this.debugConfig[control.key] = e.target.checked;
                this.log('debug', `${control.label}: ${e.target.checked ? 'ON' : 'OFF'}`);
            });
            
            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);
            configContainer.appendChild(wrapper);
        });
    }
    
    /**
     * Establece referencias al juego
     * @param {Object} gameEngine - Motor del juego
     * @param {HTMLCanvasElement} canvas - Canvas del juego
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    setGameReferences(gameEngine, canvas, ctx) {
        this.gameEngine = gameEngine;
        this.canvas = canvas;
        this.ctx = ctx;
        
        console.log('🔗 Referencias del juego establecidas en DebugUtils');
    }
    
    /**
     * Actualiza el overlay de debug
     */
    updateDebugOverlay() {
        if (!this.debugOverlay || !this.isOverlayVisible) return;
        
        const data = this.debugData;
        
        let overlayContent = `
            <div style="color: #FFD700; font-weight: bold; margin-bottom: 8px;">🐛 DEBUG INFO</div>
        `;
        
        if (this.debugConfig.showFPS) {
            overlayContent += `
                <div>FPS: ${data.fps.toFixed(1)} (${data.frameTime.toFixed(2)}ms)</div>
            `;
        }
        
        if (this.debugConfig.showMemory && data.memory.used > 0) {
            overlayContent += `
                <div>Memory: ${(data.memory.used / 1024 / 1024).toFixed(1)}MB</div>
            `;
        }
        
        if (this.debugConfig.showCameraInfo) {
            overlayContent += `
                <div>Camera: (${data.camera.x.toFixed(1)}, ${data.camera.y.toFixed(1)}) Zoom: ${data.camera.zoom.toFixed(2)}</div>
            `;
        }
        
        overlayContent += `
            <div>Player: (${data.player.x.toFixed(1)}, ${data.player.y.toFixed(1)})</div>
            <div>Velocity: (${data.player.vx.toFixed(1)}, ${data.player.vy.toFixed(1)})</div>
            <div>Objects: ${data.objects.total} (${data.objects.visible} visible)</div>
        `;
        
        if (this.debugConfig.showCollisions) {
            overlayContent += `
                <div>Collisions: ${data.collisions.checks} checks, ${data.collisions.hits} hits</div>
            `;
        }
        
        overlayContent += `
            <div style="margin-top: 8px; font-size: 10px; color: #CCC;">
                Performance: U:${data.performance.update.toFixed(1)}ms R:${data.performance.render.toFixed(1)}ms
            </div>
        `;
        
        this.debugOverlay.innerHTML = overlayContent;
        this.stats.overlaysDrawn++;
    }
    
    /**
     * Actualiza el log de eventos en el panel
     */
    updateEventLog() {
        const logContainer = this.debugPanel?.querySelector('#debug-event-log');
        if (!logContainer) return;
        
        const recentEntries = this.eventLog.slice(-50); // Mostrar últimas 50 entradas
        
        logContainer.innerHTML = recentEntries.map(entry => {
            const color = this.getLogColor(entry.level);
            const time = new Date(entry.timestamp).toLocaleTimeString();
            return `<div style="color: ${color}; margin-bottom: 2px;">
                [${time}] ${entry.level.toUpperCase()}: ${entry.message}
            </div>`;
        }).join('');
        
        // Auto-scroll al final
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    /**
     * Actualiza el log de performance
     */
    updatePerformanceLog() {
        const logContainer = this.debugPanel?.querySelector('#debug-performance-log');
        if (!logContainer) return;
        
        const recentEntries = this.performanceLog.slice(-20);
        
        logContainer.innerHTML = recentEntries.map(entry => {
            return `<div style="margin-bottom: 2px;">
                Frame ${entry.frame}: ${entry.total.toFixed(2)}ms 
                (U:${entry.update.toFixed(1)}ms R:${entry.render.toFixed(1)}ms)
            </div>`;
        }).join('');
        
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    /**
     * Obtiene el color para un nivel de log
     * @param {string} level - Nivel del log
     * @returns {string} Color CSS
     */
    getLogColor(level) {
        const colors = {
            debug: '#888',
            info: '#FFF',
            warn: '#FFA500',
            error: '#FF6B6B'
        };
        return colors[level] || colors.info;
    }
    
    /**
     * Renderiza elementos de debug en el canvas
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} gameObjects - Objetos del juego
     */
    renderDebugOverlays(ctx, gameObjects = {}) {
        if (!this.debugConfig.enabled || !ctx) return;
        
        ctx.save();
        
        // Renderizar grid
        if (this.debugConfig.showGrid) {
            this.renderGrid(ctx);
        }
        
        // Renderizar hitboxes
        if (this.debugConfig.showHitboxes && gameObjects.player) {
            this.renderHitboxes(ctx, gameObjects);
        }
        
        // Renderizar vectores de velocidad
        if (this.debugConfig.showVelocity && gameObjects.player) {
            this.renderVelocityVectors(ctx, gameObjects);
        }
        
        ctx.restore();
        
        // Actualizar overlay de información
        this.updateDebugOverlay();
    }
    
    /**
     * Renderiza una grid de debug
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    renderGrid(ctx) {
        const gridSize = 50;
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        ctx.strokeStyle = this.debugColors.grid;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        
        // Líneas verticales
        for (let x = 0; x <= width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Líneas horizontales
        for (let y = 0; y <= height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        ctx.setLineDash([]);
    }
    
    /**
     * Renderiza hitboxes de objetos
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} gameObjects - Objetos del juego
     */
    renderHitboxes(ctx, gameObjects) {
        ctx.strokeStyle = this.debugColors.hitbox;
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        
        // Hitbox del jugador
        if (gameObjects.player && gameObjects.player.bounds) {
            const bounds = gameObjects.player.bounds;
            ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
            
            // Punto central
            ctx.fillStyle = this.debugColors.hitbox;
            ctx.fillRect(bounds.x + bounds.width/2 - 2, bounds.y + bounds.height/2 - 2, 4, 4);
        }
        
        // Hitboxes de obstáculos
        if (gameObjects.obstacles) {
            ctx.strokeStyle = this.debugColors.collision;
            gameObjects.obstacles.forEach(obstacle => {
                if (obstacle.bounds) {
                    ctx.strokeRect(obstacle.bounds.x, obstacle.bounds.y, 
                                 obstacle.bounds.width, obstacle.bounds.height);
                }
            });
        }
    }
    
    /**
     * Renderiza vectores de velocidad
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} gameObjects - Objetos del juego
     */
    renderVelocityVectors(ctx, gameObjects) {
        if (!gameObjects.player || !gameObjects.player.velocity) return;
        
        const player = gameObjects.player;
        const velocity = player.velocity;
        const scale = 5; // Escala para visualizar mejor
        
        const startX = player.x || 0;
        const startY = player.y || 0;
        const endX = startX + velocity.x * scale;
        const endY = startY + velocity.y * scale;
        
        // Vector de velocidad
        ctx.strokeStyle = this.debugColors.velocity;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Punta de flecha
        const angle = Math.atan2(endY - startY, endX - startX);
        const arrowLength = 10;
        
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowLength * Math.cos(angle - Math.PI / 6),
            endY - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowLength * Math.cos(angle + Math.PI / 6),
            endY - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
        
        // Etiqueta de velocidad
        const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
        ctx.fillStyle = this.debugColors.velocity;
        ctx.font = '12px monospace';
        ctx.fillText(`${speed.toFixed(1)} px/s`, endX + 5, endY - 5);
    }    
    
// ===== MANEJO DE EVENTOS =====
    
    /**
     * Actualiza datos de frame
     * @param {Object} data - Datos del frame
     */
    updateFrameData(data) {
        if (data.fps !== undefined) {
            this.debugData.fps = data.fps;
            this.debugData.frameTime = 1000 / data.fps;
        }
        
        if (data.renderTime !== undefined) {
            this.debugData.performance.render = data.renderTime;
        }
        
        if (data.objectsRendered !== undefined) {
            this.debugData.objects.visible = data.objectsRendered;
        }
    }
    
    /**
     * Actualiza datos del jugador
     * @param {Object} data - Datos del jugador
     */
    updatePlayerData(data) {
        if (data.x !== undefined) this.debugData.player.x = data.x;
        if (data.y !== undefined) this.debugData.player.y = data.y;
        if (data.velocity) {
            this.debugData.player.vx = data.velocity.x || 0;
            this.debugData.player.vy = data.velocity.y || 0;
        }
    }
    
    /**
     * Actualiza datos de la cámara
     * @param {Object} data - Datos de la cámara
     */
    updateCameraData(data) {
        if (data.x !== undefined) this.debugData.camera.x = data.x;
        if (data.y !== undefined) this.debugData.camera.y = data.y;
        if (data.zoom !== undefined) this.debugData.camera.zoom = data.zoom;
    }
    
    /**
     * Registra una colisión
     * @param {Object} data - Datos de la colisión
     */
    logCollision(data) {
        this.debugData.collisions.hits++;
        this.log('debug', `Collision: ${data.objectA?.type || 'unknown'} vs ${data.objectB?.type || 'unknown'}`);
    }
    
    /**
     * Actualiza datos de performance
     * @param {Object} data - Datos de performance
     */
    updatePerformanceData(data) {
        if (data.updateTime !== undefined) {
            this.debugData.performance.update = data.updateTime;
        }
        
        if (data.renderTime !== undefined) {
            this.debugData.performance.render = data.renderTime;
        }
        
        this.debugData.performance.total = 
            this.debugData.performance.update + this.debugData.performance.render;
        
        // Añadir al log de performance
        this.performanceLog.push({
            frame: this.debugData.fps * Date.now() / 1000,
            update: this.debugData.performance.update,
            render: this.debugData.performance.render,
            total: this.debugData.performance.total,
            timestamp: Date.now()
        });
        
        // Limitar tamaño del log
        if (this.performanceLog.length > 100) {
            this.performanceLog.shift();
        }
        
        // Actualizar panel si está visible
        if (this.isPanelVisible) {
            this.updatePerformanceLog();
        }
    }
    
    /**
     * Registra un mensaje de debug
     * @param {string} level - Nivel del log
     * @param {string} message - Mensaje
     * @param {Object} data - Datos adicionales
     */
    log(level, message, data = null) {
        // Verificar nivel de log
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(this.debugConfig.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        
        if (messageLevelIndex < currentLevelIndex) {
            return; // No registrar mensajes de nivel inferior
        }
        
        const logEntry = {
            level,
            message,
            data,
            timestamp: Date.now()
        };
        
        this.eventLog.push(logEntry);
        this.stats.logEntriesCreated++;
        
        // Limitar tamaño del log
        if (this.eventLog.length > this.debugConfig.maxLogEntries) {
            this.eventLog.shift();
        }
        
        // Log a consola también
        const consoleMethod = console[level] || console.log;
        consoleMethod(`[DEBUG] ${message}`, data || '');
        
        // Actualizar panel si está visible
        if (this.isPanelVisible) {
            this.updateEventLog();
        }
        
        // Emitir evento
        this.eventBus.emit('debug:log-entry', logEntry);
    }
    
    /**
     * Limpia el log de eventos
     */
    clearLog() {
        this.eventLog.length = 0;
        this.performanceLog.length = 0;
        
        if (this.isPanelVisible) {
            this.updateEventLog();
            this.updatePerformanceLog();
        }
        
        console.log('[DEBUG] Log cleared');
    }
    
    /**
     * Actualiza la configuración de debug
     * @param {Object} data - Nueva configuración
     */
    updateConfig(data) {
        this.debugConfig = { ...this.debugConfig, ...data };
        
        // Actualizar controles del panel si existe
        if (this.debugPanel) {
            Object.keys(data).forEach(key => {
                const checkbox = this.debugPanel.querySelector(`#debug-${key}`);
                if (checkbox && typeof data[key] === 'boolean') {
                    checkbox.checked = data[key];
                }
            });
        }
        
        this.log('info', 'Debug config updated', data);
    }
    
    // ===== MÉTODOS PÚBLICOS =====
    
    /**
     * Alterna el modo debug
     * @param {Object} data - Datos del toggle
     */
    toggle(data) {
        const enabled = data?.enabled !== undefined ? data.enabled : !this.debugConfig.enabled;
        
        this.debugConfig.enabled = enabled;
        
        if (enabled) {
            if (!this.debugOverlay) this.createDebugOverlay();
            if (!this.debugPanel) this.createDebugPanel();
            this.log('info', 'Debug mode enabled');
        } else {
            this.hideOverlay();
            this.hidePanel();
            this.log('info', 'Debug mode disabled');
        }
        
        // Emitir evento
        this.eventBus.emit('debug:toggled', { enabled });
    }
    
    /**
     * Alterna la visibilidad del overlay
     */
    toggleOverlay() {
        if (!this.debugConfig.enabled || !this.debugOverlay) return;
        
        this.isOverlayVisible = !this.isOverlayVisible;
        this.debugOverlay.style.display = this.isOverlayVisible ? 'block' : 'none';
        
        this.log('debug', `Debug overlay ${this.isOverlayVisible ? 'shown' : 'hidden'}`);
    }
    
    /**
     * Alterna la visibilidad del panel
     */
    togglePanel() {
        if (!this.debugConfig.enabled || !this.debugPanel) return;
        
        this.isPanelVisible = !this.isPanelVisible;
        this.debugPanel.style.display = this.isPanelVisible ? 'block' : 'none';
        
        if (this.isPanelVisible) {
            this.updateEventLog();
            this.updatePerformanceLog();
        }
        
        this.log('debug', `Debug panel ${this.isPanelVisible ? 'shown' : 'hidden'}`);
    }
    
    /**
     * Muestra el overlay
     */
    showOverlay() {
        if (!this.debugConfig.enabled || !this.debugOverlay) return;
        
        this.isOverlayVisible = true;
        this.debugOverlay.style.display = 'block';
    }
    
    /**
     * Oculta el overlay
     */
    hideOverlay() {
        if (this.debugOverlay) {
            this.isOverlayVisible = false;
            this.debugOverlay.style.display = 'none';
        }
    }
    
    /**
     * Muestra el panel
     */
    showPanel() {
        if (!this.debugConfig.enabled || !this.debugPanel) return;
        
        this.isPanelVisible = true;
        this.debugPanel.style.display = 'block';
        this.updateEventLog();
        this.updatePerformanceLog();
    }
    
    /**
     * Oculta el panel
     */
    hidePanel() {
        if (this.debugPanel) {
            this.isPanelVisible = false;
            this.debugPanel.style.display = 'none';
        }
    }
    
    /**
     * Actualiza datos de memoria
     */
    updateMemoryInfo() {
        if (performance.memory) {
            this.debugData.memory = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
    }
    
    /**
     * Toma una captura de pantalla del canvas
     * @returns {string|null} Data URL de la imagen
     */
    takeScreenshot() {
        if (!this.canvas) {
            this.log('warn', 'No canvas available for screenshot');
            return null;
        }
        
        try {
            const dataURL = this.canvas.toDataURL('image/png');
            this.log('info', 'Screenshot taken');
            return dataURL;
        } catch (error) {
            this.log('error', 'Failed to take screenshot', error);
            return null;
        }
    }
    
    /**
     * Exporta el log de debug
     * @returns {string} Log en formato JSON
     */
    exportLog() {
        const exportData = {
            timestamp: Date.now(),
            config: this.debugConfig,
            eventLog: this.eventLog,
            performanceLog: this.performanceLog,
            debugData: this.debugData,
            stats: this.stats
        };
        
        const jsonData = JSON.stringify(exportData, null, 2);
        this.log('info', 'Debug log exported');
        
        return jsonData;
    }
    
    /**
     * Descarga el log de debug como archivo
     */
    downloadLog() {
        const logData = this.exportLog();
        const blob = new Blob([logData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `spikepulse-debug-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        this.log('info', 'Debug log downloaded');
    }
    
    /**
     * Mide el tiempo de ejecución de una función
     * @param {string} name - Nombre de la medición
     * @param {Function} fn - Función a medir
     * @returns {*} Resultado de la función
     */
    measure(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        const duration = end - start;
        
        this.log('debug', `${name} took ${duration.toFixed(2)}ms`);
        
        return result;
    }
    
    /**
     * Inicia un timer de performance
     * @param {string} name - Nombre del timer
     */
    startTimer(name) {
        this.timers = this.timers || new Map();
        this.timers.set(name, performance.now());
    }
    
    /**
     * Termina un timer de performance
     * @param {string} name - Nombre del timer
     * @returns {number} Duración en milisegundos
     */
    endTimer(name) {
        this.timers = this.timers || new Map();
        
        if (!this.timers.has(name)) {
            this.log('warn', `Timer '${name}' not found`);
            return 0;
        }
        
        const start = this.timers.get(name);
        const duration = performance.now() - start;
        this.timers.delete(name);
        
        this.log('debug', `Timer '${name}': ${duration.toFixed(2)}ms`);
        return duration;
    }
    
    /**
     * Obtiene información del sistema
     * @returns {Object} Información del sistema
     */
    getSystemInfo() {
        const info = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth
            },
            window: {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio
            },
            canvas: this.canvas ? {
                width: this.canvas.width,
                height: this.canvas.height,
                contextType: this.ctx?.constructor.name
            } : null
        };
        
        if (performance.memory) {
            info.memory = {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        
        return info;
    }
    
    /**
     * Obtiene estadísticas de debug
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            ...this.stats,
            isEnabled: this.debugConfig.enabled,
            isOverlayVisible: this.isOverlayVisible,
            isPanelVisible: this.isPanelVisible,
            eventLogSize: this.eventLog.length,
            performanceLogSize: this.performanceLog.length,
            debugCallsTotal: this.stats.debugCallsTotal
        };
    }
    
    /**
     * Obtiene información de debug completa
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            config: { ...this.debugConfig },
            debugData: { ...this.debugData },
            stats: this.getStats(),
            systemInfo: this.getSystemInfo(),
            hasGameReferences: {
                gameEngine: this.gameEngine !== null,
                canvas: this.canvas !== null,
                ctx: this.ctx !== null
            }
        };
    }
    
    /**
     * Actualiza el debug (llamado en el game loop)
     * @param {number} deltaTime - Delta time
     */
    update(deltaTime) {
        if (!this.isInitialized || !this.debugConfig.enabled) return;
        
        this.stats.debugCallsTotal++;
        
        // Actualizar información de memoria periódicamente
        if (this.stats.debugCallsTotal % 60 === 0) { // Cada ~1 segundo a 60fps
            this.updateMemoryInfo();
        }
        
        // Actualizar overlay si está visible
        if (this.isOverlayVisible) {
            this.updateDebugOverlay();
        }
    }
    
    /**
     * Resetea las utilidades de debug
     */
    reset() {
        console.log('🔄 Reseteando DebugUtils...');
        
        // Limpiar logs
        this.clearLog();
        
        // Resetear datos
        this.debugData = {
            fps: 60,
            frameTime: 16.67,
            memory: { used: 0, total: 0 },
            objects: { total: 0, visible: 0, culled: 0 },
            collisions: { checks: 0, hits: 0 },
            camera: { x: 0, y: 0, zoom: 1 },
            player: { x: 0, y: 0, vx: 0, vy: 0 },
            performance: { update: 0, render: 0, total: 0 }
        };
        
        // Resetear estadísticas
        this.stats.overlaysDrawn = 0;
        this.stats.logEntriesCreated = 0;
        this.stats.debugCallsTotal = 0;
        
        console.log('✅ DebugUtils reseteado');
    }
    
    /**
     * Limpia recursos de debug
     */
    destroy() {
        console.log('🧹 Destruyendo DebugUtils...');
        
        // Remover event listeners
        this.eventBus.off('*', this);
        
        // Limpiar DOM
        if (this.debugOverlay && this.debugOverlay.parentNode) {
            this.debugOverlay.parentNode.removeChild(this.debugOverlay);
        }
        
        if (this.debugPanel && this.debugPanel.parentNode) {
            this.debugPanel.parentNode.removeChild(this.debugPanel);
        }
        
        // Limpiar referencias
        this.debugOverlay = null;
        this.debugPanel = null;
        this.gameEngine = null;
        this.canvas = null;
        this.ctx = null;
        
        // Limpiar arrays
        this.eventLog.length = 0;
        this.performanceLog.length = 0;
        
        this.isInitialized = false;
        
        console.log('✅ DebugUtils destruido');
    }
}