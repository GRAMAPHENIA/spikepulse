/**
 * DebugManager - Sistema de debugging y herramientas de desarrollo para Spikepulse
 * @module DebugManager
 */

import { SPANISH_TEXT } from '../../config/SpanishText.js';
import { HitboxVisualizer } from './HitboxVisualizer.js';

export class DebugManager {
    /**
     * Crea una nueva instancia del DebugManager
     * @param {Object} config - Configuración del debug
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isDebugMode = config.debug?.enabled || false;
        this.debugLevel = config.debug?.level || 'info';
        
        // Estado del debug
        this.debugInfo = {
            showHitboxes: config.debug?.showHitboxes || false,
            showFPS: config.debug?.showFPS || false,
            showStateInfo: config.debug?.showStateInfo || false,
            showModuleInfo: config.debug?.showModuleInfo || false,
            showPhysicsInfo: config.debug?.showPhysicsInfo || false,
            showMemoryInfo: config.debug?.showMemoryInfo || false,
            showEventInfo: config.debug?.showEventInfo || false,
            showGridOverlay: config.debug?.showGridOverlay || false,
            showPerformanceGraph: config.debug?.showPerformanceGraph || false
        };

        // Datos de debug
        this.debugData = {
            fps: 0,
            frameTime: 0,
            updateTime: 0,
            renderTime: 0,
            memoryUsage: 0,
            activeObjects: 0,
            eventCount: 0,
            currentState: 'unknown',
            playerPosition: { x: 0, y: 0 },
            playerVelocity: { x: 0, y: 0 },
            collisionCount: 0,
            moduleStats: {}
        };

        // Elementos de UI de debug
        this.debugPanel = null;
        this.debugOverlay = null;
        this.isInitialized = false;

        // Sistemas de debug
        this.hitboxVisualizer = null;

        // Historial para gráficos
        this.performanceHistory = {
            fps: [],
            frameTime: [],
            memoryUsage: []
        };
        this.maxHistoryLength = 60; // 1 segundo a 60fps

        this.init();
    }

    /**
     * Inicializar el sistema de debug
     * @private
     */
    init() {
        if (!this.isDebugMode) {
            console.log('[DebugManager] Modo debug deshabilitado');
            return;
        }

        this.createDebugUI();
        this.setupDebugSystems();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.isInitialized = true;

        console.log('[DebugManager] Sistema de debug inicializado');
    }

    /**
     * Crear interfaz de usuario de debug
     * @private
     */
    createDebugUI() {
        // Crear panel de debug
        this.debugPanel = document.createElement('div');
        this.debugPanel.id = 'debug-panel';
        this.debugPanel.className = 'debug-panel';
        this.debugPanel.innerHTML = this.getDebugPanelHTML();
        
        // Crear overlay de debug (para hitboxes, grid, etc.)
        this.debugOverlay = document.createElement('canvas');
        this.debugOverlay.id = 'debug-overlay';
        this.debugOverlay.className = 'debug-overlay';
        this.debugOverlay.width = this.config.canvas?.width || 800;
        this.debugOverlay.height = this.config.canvas?.height || 400;

        // Agregar al DOM
        document.body.appendChild(this.debugPanel);
        
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.appendChild(this.debugOverlay);
        } else {
            document.body.appendChild(this.debugOverlay);
        }

        // Configurar estilos
        this.applyDebugStyles();

        // Configurar controles
        this.setupDebugControls();
    }

    /**
     * Obtener HTML del panel de debug
     * @returns {string} HTML del panel
     * @private
     */
    getDebugPanelHTML() {
        return `
            <div class="debug-header">
                <h3>🔧 Debug Panel - Spikepulse</h3>
                <button class="debug-toggle-btn" id="debug-toggle">Minimizar</button>
            </div>
            
            <div class="debug-content">
                <div class="debug-section">
                    <h4>📊 Rendimiento</h4>
                    <div class="debug-stats">
                        <div class="stat-item">
                            <span class="stat-label">FPS:</span>
                            <span class="stat-value" id="debug-fps">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Frame Time:</span>
                            <span class="stat-value" id="debug-frame-time">0ms</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Update Time:</span>
                            <span class="stat-value" id="debug-update-time">0ms</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Render Time:</span>
                            <span class="stat-value" id="debug-render-time">0ms</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Memoria:</span>
                            <span class="stat-value" id="debug-memory">0MB</span>
                        </div>
                    </div>
                    <canvas class="debug-graph" id="debug-performance-graph" width="200" height="60"></canvas>
                </div>

                <div class="debug-section">
                    <h4>🎮 Estado del Juego</h4>
                    <div class="debug-stats">
                        <div class="stat-item">
                            <span class="stat-label">Estado:</span>
                            <span class="stat-value" id="debug-game-state">unknown</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Objetos Activos:</span>
                            <span class="stat-value" id="debug-active-objects">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Eventos/s:</span>
                            <span class="stat-value" id="debug-event-count">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Colisiones:</span>
                            <span class="stat-value" id="debug-collision-count">0</span>
                        </div>
                    </div>
                </div>

                <div class="debug-section">
                    <h4>👤 Jugador</h4>
                    <div class="debug-stats">
                        <div class="stat-item">
                            <span class="stat-label">Posición:</span>
                            <span class="stat-value" id="debug-player-position">0, 0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Velocidad:</span>
                            <span class="stat-value" id="debug-player-velocity">0, 0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">En Suelo:</span>
                            <span class="stat-value" id="debug-player-grounded">false</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Saltos:</span>
                            <span class="stat-value" id="debug-player-jumps">0/2</span>
                        </div>
                    </div>
                </div>

                <div class="debug-section">
                    <h4>🔧 Módulos</h4>
                    <div class="debug-modules" id="debug-modules-list">
                        <!-- Módulos se llenan dinámicamente -->
                    </div>
                </div>

                <div class="debug-section">
                    <h4>👁️ Visualización</h4>
                    <div class="debug-controls">
                        <label class="debug-checkbox">
                            <input type="checkbox" id="debug-show-hitboxes">
                            <span>Mostrar Hitboxes</span>
                        </label>
                        <label class="debug-checkbox">
                            <input type="checkbox" id="debug-show-grid">
                            <span>Mostrar Grid</span>
                        </label>
                        <label class="debug-checkbox">
                            <input type="checkbox" id="debug-show-fps">
                            <span>Mostrar FPS en Juego</span>
                        </label>
                        <label class="debug-checkbox">
                            <input type="checkbox" id="debug-show-physics">
                            <span>Info de Física</span>
                        </label>
                    </div>
                </div>

                <div class="debug-section">
                    <h4>🎯 Acciones</h4>
                    <div class="debug-actions">
                        <button class="debug-btn" id="debug-clear-logs">Limpiar Logs</button>
                        <button class="debug-btn" id="debug-export-data">Exportar Datos</button>
                        <button class="debug-btn" id="debug-reset-game">Reset Juego</button>
                        <button class="debug-btn" id="debug-toggle-pause">Pausar/Reanudar</button>
                    </div>
                </div>

                <div class="debug-section">
                    <h4>📝 Console</h4>
                    <div class="debug-console" id="debug-console">
                        <div class="console-output" id="debug-console-output"></div>
                        <div class="console-input-container">
                            <input type="text" class="console-input" id="debug-console-input" placeholder="Ingresa comando...">
                            <button class="console-send" id="debug-console-send">Enviar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Aplicar estilos CSS para el debug
     * @private
     */
    applyDebugStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .debug-panel {
                position: fixed;
                top: 10px;
                right: 10px;
                width: 320px;
                max-height: 80vh;
                background: rgba(0, 0, 0, 0.9);
                border: 2px solid #FFD700;
                border-radius: 8px;
                color: #fff;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                z-index: 10000;
                overflow-y: auto;
                box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
            }

            .debug-panel.minimized .debug-content {
                display: none;
            }

            .debug-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: rgba(255, 215, 0, 0.2);
                border-bottom: 1px solid #FFD700;
            }

            .debug-header h3 {
                margin: 0;
                font-size: 14px;
                color: #FFD700;
            }

            .debug-toggle-btn {
                background: #FFD700;
                color: #000;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 10px;
            }

            .debug-content {
                padding: 8px;
            }

            .debug-section {
                margin-bottom: 12px;
                border-bottom: 1px solid #333;
                padding-bottom: 8px;
            }

            .debug-section h4 {
                margin: 0 0 6px 0;
                color: #FFD700;
                font-size: 12px;
            }

            .debug-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 4px;
            }

            .stat-item {
                display: flex;
                justify-content: space-between;
                padding: 2px 0;
            }

            .stat-label {
                color: #ccc;
            }

            .stat-value {
                color: #fff;
                font-weight: bold;
            }

            .debug-graph {
                width: 100%;
                height: 60px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid #333;
                margin-top: 4px;
            }

            .debug-controls {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .debug-checkbox {
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                padding: 2px 0;
            }

            .debug-checkbox input {
                margin: 0;
            }

            .debug-actions {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 4px;
            }

            .debug-btn {
                background: #333;
                color: #fff;
                border: 1px solid #666;
                padding: 6px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 10px;
            }

            .debug-btn:hover {
                background: #555;
            }

            .debug-console {
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid #333;
                border-radius: 4px;
                height: 120px;
                display: flex;
                flex-direction: column;
            }

            .console-output {
                flex: 1;
                padding: 4px;
                overflow-y: auto;
                font-size: 10px;
                line-height: 1.2;
            }

            .console-input-container {
                display: flex;
                border-top: 1px solid #333;
            }

            .console-input {
                flex: 1;
                background: transparent;
                border: none;
                color: #fff;
                padding: 4px;
                font-size: 10px;
                outline: none;
            }

            .console-send {
                background: #FFD700;
                color: #000;
                border: none;
                padding: 4px 8px;
                cursor: pointer;
                font-size: 10px;
            }

            .debug-overlay {
                position: absolute;
                top: 0;
                left: 0;
                pointer-events: none;
                z-index: 1000;
            }

            .debug-modules {
                font-size: 10px;
            }

            .module-item {
                display: flex;
                justify-content: space-between;
                padding: 2px 0;
                border-bottom: 1px solid #222;
            }

            .module-name {
                color: #FFD700;
            }

            .module-status {
                color: #0f0;
            }

            .module-status.error {
                color: #f00;
            }

            .module-status.warning {
                color: #ff0;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Configurar sistemas de debug
     * @private
     */
    setupDebugSystems() {
        // Inicializar HitboxVisualizer
        this.hitboxVisualizer = new HitboxVisualizer(this.eventBus, {
            playerColor: '#00FF00',
            obstacleColor: '#FF0000',
            worldColor: '#0000FF',
            lineWidth: 2,
            fillAlpha: 0.2,
            showLabels: true
        });

        // Sincronizar estado inicial
        this.hitboxVisualizer.isEnabled = this.debugInfo.showHitboxes;
    }

    /**
     * Configurar controles del debug
     * @private
     */
    setupDebugControls() {
        // Toggle panel
        const toggleBtn = document.getElementById('debug-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.debugPanel.classList.toggle('minimized');
                toggleBtn.textContent = this.debugPanel.classList.contains('minimized') ? 'Expandir' : 'Minimizar';
            });
        }

        // Checkboxes de visualización
        const checkboxes = {
            'debug-show-hitboxes': 'showHitboxes',
            'debug-show-grid': 'showGridOverlay',
            'debug-show-fps': 'showFPS',
            'debug-show-physics': 'showPhysicsInfo'
        };

        Object.entries(checkboxes).forEach(([id, property]) => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.checked = this.debugInfo[property];
                checkbox.addEventListener('change', (e) => {
                    this.debugInfo[property] = e.target.checked;
                    
                    // Sincronizar con sistemas específicos
                    if (property === 'showHitboxes' && this.hitboxVisualizer) {
                        this.hitboxVisualizer.isEnabled = e.target.checked;
                    }
                    
                    this.eventBus.emit('debug:setting-changed', {
                        property,
                        value: e.target.checked
                    });
                });
            }
        });

        // Botones de acción
        const actions = {
            'debug-clear-logs': () => this.clearLogs(),
            'debug-export-data': () => this.exportDebugData(),
            'debug-reset-game': () => this.resetGame(),
            'debug-toggle-pause': () => this.togglePause()
        };

        Object.entries(actions).forEach(([id, action]) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', action);
            }
        });

        // Console
        const consoleInput = document.getElementById('debug-console-input');
        const consoleSend = document.getElementById('debug-console-send');
        
        if (consoleInput && consoleSend) {
            const executeCommand = () => {
                const command = consoleInput.value.trim();
                if (command) {
                    this.executeConsoleCommand(command);
                    consoleInput.value = '';
                }
            };

            consoleSend.addEventListener('click', executeCommand);
            consoleInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    executeCommand();
                }
            });
        }
    }

    /**
     * Configurar atajos de teclado
     * @private
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Solo procesar si no estamos en un input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Ctrl + D: Toggle debug panel
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.toggleDebugPanel();
            }

            // Ctrl + H: Toggle hitboxes
            if (e.ctrlKey && e.key === 'h') {
                e.preventDefault();
                this.toggleHitboxes();
            }

            // Ctrl + G: Toggle grid
            if (e.ctrlKey && e.key === 'g') {
                e.preventDefault();
                this.toggleGrid();
            }

            // Ctrl + F: Toggle FPS display
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                this.toggleFPS();
            }

            // F12: Toggle debug mode
            if (e.key === 'F12') {
                e.preventDefault();
                this.toggleDebugMode();
            }
        });
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        // Eventos de rendimiento
        this.eventBus.on('engine:performance-update', (data) => {
            this.updatePerformanceData(data);
        });

        // Eventos de estado del juego
        this.eventBus.on('state:changed', (data) => {
            this.debugData.currentState = data.to;
        });

        // Eventos del jugador
        this.eventBus.on('player:position-updated', (data) => {
            this.debugData.playerPosition = data.position;
            this.debugData.playerVelocity = data.velocity;
        });

        // Eventos de colisiones
        this.eventBus.on('collision:detected', () => {
            this.debugData.collisionCount++;
        });

        // Eventos de módulos
        this.eventBus.on('engine:module-error', (data) => {
            this.logToConsole(`❌ Error en módulo ${data.name}: ${data.error.message}`, 'error');
        });

        this.eventBus.on('engine:module-recovered', (data) => {
            this.logToConsole(`✅ Módulo ${data.moduleName} recuperado`, 'success');
        });
    }

    /**
     * Actualizar datos de rendimiento
     * @param {Object} data - Datos de rendimiento
     * @private
     */
    updatePerformanceData(data) {
        this.debugData.fps = data.fps;
        this.debugData.frameTime = data.totalFrameTime;
        this.debugData.updateTime = data.updateTime;
        this.debugData.renderTime = data.renderTime;
        this.debugData.memoryUsage = data.memoryUsage;

        // Actualizar historial para gráficos
        this.performanceHistory.fps.push(data.fps);
        this.performanceHistory.frameTime.push(data.totalFrameTime);
        this.performanceHistory.memoryUsage.push(data.memoryUsage);

        // Mantener límite de historial
        Object.keys(this.performanceHistory).forEach(key => {
            if (this.performanceHistory[key].length > this.maxHistoryLength) {
                this.performanceHistory[key].shift();
            }
        });
    }

    /**
     * Actualizar interfaz de debug
     * @param {number} deltaTime - Tiempo transcurrido
     */
    update(deltaTime) {
        if (!this.isInitialized || !this.isDebugMode) {
            return;
        }

        this.updateDebugUI();
        this.updatePerformanceGraph();
    }

    /**
     * Actualizar UI de debug
     * @private
     */
    updateDebugUI() {
        // Actualizar estadísticas de rendimiento
        this.updateElement('debug-fps', `${this.debugData.fps} FPS`);
        this.updateElement('debug-frame-time', `${this.debugData.frameTime.toFixed(2)}ms`);
        this.updateElement('debug-update-time', `${this.debugData.updateTime.toFixed(2)}ms`);
        this.updateElement('debug-render-time', `${this.debugData.renderTime.toFixed(2)}ms`);
        this.updateElement('debug-memory', `${(this.debugData.memoryUsage / 1024 / 1024).toFixed(1)}MB`);

        // Actualizar estado del juego
        this.updateElement('debug-game-state', this.debugData.currentState);
        this.updateElement('debug-active-objects', this.debugData.activeObjects);
        this.updateElement('debug-event-count', this.debugData.eventCount);
        this.updateElement('debug-collision-count', this.debugData.collisionCount);

        // Actualizar información del jugador
        this.updateElement('debug-player-position', 
            `${this.debugData.playerPosition.x.toFixed(1)}, ${this.debugData.playerPosition.y.toFixed(1)}`);
        this.updateElement('debug-player-velocity', 
            `${this.debugData.playerVelocity.x.toFixed(1)}, ${this.debugData.playerVelocity.y.toFixed(1)}`);

        // Actualizar módulos
        this.updateModulesList();
    }

    /**
     * Actualizar elemento del DOM
     * @param {string} id - ID del elemento
     * @param {string} value - Valor a mostrar
     * @private
     */
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Actualizar lista de módulos
     * @private
     */
    updateModulesList() {
        const modulesList = document.getElementById('debug-modules-list');
        if (!modulesList) return;

        // Obtener estadísticas de módulos del motor
        this.eventBus.emit('engine:request-module-stats');
    }

    /**
     * Actualizar gráfico de rendimiento
     * @private
     */
    updatePerformanceGraph() {
        const canvas = document.getElementById('debug-performance-graph');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Limpiar canvas
        ctx.clearRect(0, 0, width, height);

        // Dibujar gráfico de FPS
        this.drawPerformanceGraph(ctx, this.performanceHistory.fps, width, height, '#0f0', 60);
    }

    /**
     * Dibujar gráfico de rendimiento
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Array} data - Datos a graficar
     * @param {number} width - Ancho del canvas
     * @param {number} height - Alto del canvas
     * @param {string} color - Color de la línea
     * @param {number} maxValue - Valor máximo esperado
     * @private
     */
    drawPerformanceGraph(ctx, data, width, height, color, maxValue) {
        if (data.length < 2) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();

        const stepX = width / (data.length - 1);
        
        data.forEach((value, index) => {
            const x = index * stepX;
            const y = height - (value / maxValue) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Dibujar línea de referencia (60 FPS)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const referenceY = height - (60 / maxValue) * height;
        ctx.moveTo(0, referenceY);
        ctx.lineTo(width, referenceY);
        ctx.stroke();
    }

    /**
     * Renderizar overlays de debug
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas principal
     */
    render(ctx) {
        if (!this.isInitialized || !this.isDebugMode) {
            return;
        }

        // Renderizar en el overlay de debug
        const overlayCtx = this.debugOverlay.getContext('2d');
        overlayCtx.clearRect(0, 0, this.debugOverlay.width, this.debugOverlay.height);

        if (this.debugInfo.showGridOverlay) {
            this.renderGrid(overlayCtx);
        }

        if (this.debugInfo.showHitboxes && this.hitboxVisualizer) {
            this.hitboxVisualizer.renderAllHitboxes(overlayCtx);
        }

        if (this.debugInfo.showFPS) {
            this.renderFPSOverlay(ctx);
        }
    }

    /**
     * Renderizar grid de debug
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @private
     */
    renderGrid(ctx) {
        const gridSize = 50;
        const width = this.debugOverlay.width;
        const height = this.debugOverlay.height;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;

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

        // Números de grid
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px monospace';
        
        for (let x = gridSize; x < width; x += gridSize) {
            ctx.fillText(x.toString(), x + 2, 12);
        }
        
        for (let y = gridSize; y < height; y += gridSize) {
            ctx.fillText(y.toString(), 2, y - 2);
        }
    }



    /**
     * Renderizar FPS overlay en el juego
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas principal
     * @private
     */
    renderFPSOverlay(ctx) {
        ctx.save();
        
        // Fondo semi-transparente
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 80, 25);
        
        // Texto de FPS
        ctx.fillStyle = this.debugData.fps >= 50 ? '#0f0' : this.debugData.fps >= 30 ? '#ff0' : '#f00';
        ctx.font = '16px monospace';
        ctx.fillText(`${this.debugData.fps} FPS`, 15, 28);
        
        ctx.restore();
    }

    /**
     * Ejecutar comando de consola
     * @param {string} command - Comando a ejecutar
     * @private
     */
    executeConsoleCommand(command) {
        this.logToConsole(`> ${command}`, 'input');

        try {
            const parts = command.split(' ');
            const cmd = parts[0].toLowerCase();
            const args = parts.slice(1);

            switch (cmd) {
                case 'help':
                    this.showConsoleHelp();
                    break;
                
                case 'clear':
                    this.clearConsole();
                    break;
                
                case 'fps':
                    this.logToConsole(`FPS actual: ${this.debugData.fps}`, 'info');
                    break;
                
                case 'memory':
                    this.logToConsole(`Memoria: ${(this.debugData.memoryUsage / 1024 / 1024).toFixed(1)}MB`, 'info');
                    break;
                
                case 'state':
                    this.logToConsole(`Estado actual: ${this.debugData.currentState}`, 'info');
                    break;
                
                case 'player':
                    this.logToConsole(`Jugador - Pos: (${this.debugData.playerPosition.x.toFixed(1)}, ${this.debugData.playerPosition.y.toFixed(1)}), Vel: (${this.debugData.playerVelocity.x.toFixed(1)}, ${this.debugData.playerVelocity.y.toFixed(1)})`, 'info');
                    break;
                
                case 'emit':
                    if (args.length >= 1) {
                        const eventName = args[0];
                        const eventData = args.length > 1 ? JSON.parse(args.slice(1).join(' ')) : {};
                        this.eventBus.emit(eventName, eventData);
                        this.logToConsole(`Evento emitido: ${eventName}`, 'success');
                    } else {
                        this.logToConsole('Uso: emit <evento> [datos]', 'error');
                    }
                    break;
                
                case 'toggle':
                    if (args.length >= 1) {
                        const setting = args[0];
                        if (this.debugInfo.hasOwnProperty(setting)) {
                            this.debugInfo[setting] = !this.debugInfo[setting];
                            this.logToConsole(`${setting}: ${this.debugInfo[setting]}`, 'info');
                        } else {
                            this.logToConsole(`Configuración desconocida: ${setting}`, 'error');
                        }
                    } else {
                        this.logToConsole('Uso: toggle <configuración>', 'error');
                    }
                    break;
                
                default:
                    this.logToConsole(`Comando desconocido: ${cmd}. Escribe 'help' para ver comandos disponibles.`, 'error');
            }
        } catch (error) {
            this.logToConsole(`Error ejecutando comando: ${error.message}`, 'error');
        }
    }

    /**
     * Mostrar ayuda de consola
     * @private
     */
    showConsoleHelp() {
        const commands = [
            'help - Mostrar esta ayuda',
            'clear - Limpiar consola',
            'fps - Mostrar FPS actual',
            'memory - Mostrar uso de memoria',
            'state - Mostrar estado del juego',
            'player - Mostrar info del jugador',
            'emit <evento> [datos] - Emitir evento',
            'toggle <configuración> - Alternar configuración'
        ];

        this.logToConsole('Comandos disponibles:', 'info');
        commands.forEach(cmd => this.logToConsole(`  ${cmd}`, 'info'));
    }

    /**
     * Registrar mensaje en consola de debug
     * @param {string} message - Mensaje a registrar
     * @param {string} type - Tipo de mensaje (info, error, success, input)
     * @private
     */
    logToConsole(message, type = 'info') {
        const consoleOutput = document.getElementById('debug-console-output');
        if (!consoleOutput) return;

        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            info: '#fff',
            error: '#f00',
            success: '#0f0',
            input: '#FFD700',
            warning: '#ff0'
        };

        const logEntry = document.createElement('div');
        logEntry.style.color = colors[type] || colors.info;
        logEntry.style.marginBottom = '2px';
        logEntry.textContent = `[${timestamp}] ${message}`;

        consoleOutput.appendChild(logEntry);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;

        // Mantener límite de mensajes
        while (consoleOutput.children.length > 100) {
            consoleOutput.removeChild(consoleOutput.firstChild);
        }
    }

    /**
     * Limpiar consola
     * @private
     */
    clearConsole() {
        const consoleOutput = document.getElementById('debug-console-output');
        if (consoleOutput) {
            consoleOutput.innerHTML = '';
        }
    }

    /**
     * Limpiar logs
     * @private
     */
    clearLogs() {
        this.eventBus.emit('debug:clear-logs');
        this.logToConsole('Logs limpiados', 'success');
    }

    /**
     * Exportar datos de debug
     * @private
     */
    exportDebugData() {
        const debugData = {
            timestamp: new Date().toISOString(),
            performance: this.debugData,
            history: this.performanceHistory,
            settings: this.debugInfo
        };

        const dataStr = JSON.stringify(debugData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `spikepulse-debug-${Date.now()}.json`;
        link.click();

        URL.revokeObjectURL(url);
        this.logToConsole('Datos de debug exportados', 'success');
    }

    /**
     * Reset del juego
     * @private
     */
    resetGame() {
        this.eventBus.emit('game:reset');
        this.logToConsole('Juego reiniciado', 'success');
    }

    /**
     * Toggle pausa
     * @private
     */
    togglePause() {
        this.eventBus.emit('game:toggle-pause');
        this.logToConsole('Pausa alternada', 'success');
    }

    /**
     * Toggle panel de debug
     */
    toggleDebugPanel() {
        if (this.debugPanel) {
            this.debugPanel.style.display = this.debugPanel.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * Toggle hitboxes
     */
    toggleHitboxes() {
        this.debugInfo.showHitboxes = !this.debugInfo.showHitboxes;
        
        // Sincronizar con HitboxVisualizer
        if (this.hitboxVisualizer) {
            this.hitboxVisualizer.isEnabled = this.debugInfo.showHitboxes;
        }
        
        const checkbox = document.getElementById('debug-show-hitboxes');
        if (checkbox) {
            checkbox.checked = this.debugInfo.showHitboxes;
        }
        this.logToConsole(`Hitboxes: ${this.debugInfo.showHitboxes ? 'ON' : 'OFF'}`, 'info');
    }

    /**
     * Toggle grid
     */
    toggleGrid() {
        this.debugInfo.showGridOverlay = !this.debugInfo.showGridOverlay;
        const checkbox = document.getElementById('debug-show-grid');
        if (checkbox) {
            checkbox.checked = this.debugInfo.showGridOverlay;
        }
        this.logToConsole(`Grid: ${this.debugInfo.showGridOverlay ? 'ON' : 'OFF'}`, 'info');
    }

    /**
     * Toggle FPS display
     */
    toggleFPS() {
        this.debugInfo.showFPS = !this.debugInfo.showFPS;
        const checkbox = document.getElementById('debug-show-fps');
        if (checkbox) {
            checkbox.checked = this.debugInfo.showFPS;
        }
        this.logToConsole(`FPS Display: ${this.debugInfo.showFPS ? 'ON' : 'OFF'}`, 'info');
    }

    /**
     * Toggle modo debug completo
     */
    toggleDebugMode() {
        this.isDebugMode = !this.isDebugMode;
        
        if (this.isDebugMode && !this.isInitialized) {
            this.init();
        }
        
        if (this.debugPanel) {
            this.debugPanel.style.display = this.isDebugMode ? 'block' : 'none';
        }
        
        if (this.debugOverlay) {
            this.debugOverlay.style.display = this.isDebugMode ? 'block' : 'none';
        }

        console.log(`[DebugManager] Modo debug ${this.isDebugMode ? 'activado' : 'desactivado'}`);
    }

    /**
     * Obtener estadísticas de debug
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            isDebugMode: this.isDebugMode,
            isInitialized: this.isInitialized,
            debugInfo: { ...this.debugInfo },
            debugData: { ...this.debugData },
            performanceHistoryLength: this.performanceHistory.fps.length,
            hitboxVisualizer: this.hitboxVisualizer?.getStats() || null
        };
    }

    /**
     * Destruir el sistema de debug
     */
    destroy() {
        // Remover elementos del DOM
        if (this.debugPanel) {
            this.debugPanel.remove();
            this.debugPanel = null;
        }

        if (this.debugOverlay) {
            this.debugOverlay.remove();
            this.debugOverlay = null;
        }

        // Destruir sistemas de debug
        if (this.hitboxVisualizer) {
            this.hitboxVisualizer.destroy();
            this.hitboxVisualizer = null;
        }

        // Limpiar datos
        this.performanceHistory = { fps: [], frameTime: [], memoryUsage: [] };
        this.debugData = {};

        this.isInitialized = false;
        console.log('[DebugManager] Sistema de debug destruido');
    }
}