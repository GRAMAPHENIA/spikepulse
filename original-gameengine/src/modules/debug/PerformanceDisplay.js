/**
 * PerformanceDisplay - Componente para mostrar métricas de rendimiento en tiempo real
 * @module PerformanceDisplay
 */

import { SpanishFormatter } from '../../utils/SpanishFormatter.js';

export class PerformanceDisplay {
    /**
     * Crea una nueva instancia del display de rendimiento
     * @param {Object} config - Configuración del display
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isVisible = config.debug?.showPerformanceDisplay || false;
        this.isInitialized = false;

        // Elementos del DOM
        this.container = null;
        this.panels = new Map();

        // Configuración del display
        this.displayConfig = {
            position: config.debug?.performanceDisplayPosition || 'top-left',
            updateInterval: config.debug?.performanceDisplayUpdate || 500,
            maxHistoryPoints: 60,
            showGraphs: config.debug?.showPerformanceGraphs || true,
            compactMode: config.debug?.compactPerformanceDisplay || false
        };

        // Datos de rendimiento
        this.performanceData = {
            fps: { current: 0, history: [], target: 60 },
            frameTime: { current: 0, history: [], target: 16.67 },
            memory: { current: 0, history: [], limit: 0 },
            updateTime: { current: 0, history: [] },
            renderTime: { current: 0, history: [] }
        };

        // Intervalos y timers
        this.updateTimer = null;

        this.init();
    }

    /**
     * Inicializar el display de rendimiento
     * @private
     */
    init() {
        if (this.isInitialized) return;

        this.createDisplayElements();
        this.setupEventListeners();
        this.startUpdateLoop();

        this.isInitialized = true;
        console.log('[PerformanceDisplay] Display de rendimiento inicializado');
    }

    /**
     * Crear elementos del DOM para el display
     * @private
     */
    createDisplayElements() {
        // Crear contenedor principal
        this.container = document.createElement('div');
        this.container.id = 'performance-display';
        this.container.className = `performance-display performance-display--${this.displayConfig.position}`;
        
        if (this.displayConfig.compactMode) {
            this.container.classList.add('performance-display--compact');
        }

        // Crear paneles de información
        this.createFPSPanel();
        this.createMemoryPanel();
        this.createTimingPanel();
        this.createSystemPanel();

        // Agregar al DOM
        document.body.appendChild(this.container);

        // Aplicar visibilidad inicial
        this.setVisible(this.isVisible);

        console.log('[PerformanceDisplay] Elementos del DOM creados');
    }

    /**
     * Crear panel de FPS
     * @private
     */
    createFPSPanel() {
        const panel = document.createElement('div');
        panel.className = 'performance-panel performance-panel--fps';
        
        panel.innerHTML = `
            <div class="performance-panel__header">
                <span class="performance-panel__title">FPS</span>
                <span class="performance-panel__status" id="fps-status">●</span>
            </div>
            <div class="performance-panel__content">
                <div class="performance-metric">
                    <span class="performance-metric__label">Actual:</span>
                    <span class="performance-metric__value" id="fps-current">0</span>
                </div>
                <div class="performance-metric">
                    <span class="performance-metric__label">Promedio:</span>
                    <span class="performance-metric__value" id="fps-average">0</span>
                </div>
                <div class="performance-metric">
                    <span class="performance-metric__label">Mínimo:</span>
                    <span class="performance-metric__value" id="fps-min">0</span>
                </div>
                <div class="performance-graph" id="fps-graph"></div>
            </div>
        `;

        this.container.appendChild(panel);
        this.panels.set('fps', panel);
    }

    /**
     * Crear panel de memoria
     * @private
     */
    createMemoryPanel() {
        const panel = document.createElement('div');
        panel.className = 'performance-panel performance-panel--memory';
        
        panel.innerHTML = `
            <div class="performance-panel__header">
                <span class="performance-panel__title">Memoria</span>
                <span class="performance-panel__status" id="memory-status">●</span>
            </div>
            <div class="performance-panel__content">
                <div class="performance-metric">
                    <span class="performance-metric__label">Uso:</span>
                    <span class="performance-metric__value" id="memory-used">0 MB</span>
                </div>
                <div class="performance-metric">
                    <span class="performance-metric__label">Límite:</span>
                    <span class="performance-metric__value" id="memory-limit">0 MB</span>
                </div>
                <div class="performance-metric">
                    <span class="performance-metric__label">GC:</span>
                    <span class="performance-metric__value" id="memory-gc">0</span>
                </div>
                <div class="performance-graph" id="memory-graph"></div>
            </div>
        `;

        this.container.appendChild(panel);
        this.panels.set('memory', panel);
    }

    /**
     * Crear panel de tiempos
     * @private
     */
    createTimingPanel() {
        const panel = document.createElement('div');
        panel.className = 'performance-panel performance-panel--timing';
        
        panel.innerHTML = `
            <div class="performance-panel__header">
                <span class="performance-panel__title">Tiempos</span>
                <span class="performance-panel__status" id="timing-status">●</span>
            </div>
            <div class="performance-panel__content">
                <div class="performance-metric">
                    <span class="performance-metric__label">Frame:</span>
                    <span class="performance-metric__value" id="timing-frame">0.0ms</span>
                </div>
                <div class="performance-metric">
                    <span class="performance-metric__label">Update:</span>
                    <span class="performance-metric__value" id="timing-update">0.0ms</span>
                </div>
                <div class="performance-metric">
                    <span class="performance-metric__label">Render:</span>
                    <span class="performance-metric__value" id="timing-render">0.0ms</span>
                </div>
                <div class="performance-graph" id="timing-graph"></div>
            </div>
        `;

        this.container.appendChild(panel);
        this.panels.set('timing', panel);
    }

    /**
     * Crear panel del sistema
     * @private
     */
    createSystemPanel() {
        const panel = document.createElement('div');
        panel.className = 'performance-panel performance-panel--system';
        
        panel.innerHTML = `
            <div class="performance-panel__header">
                <span class="performance-panel__title">Sistema</span>
                <span class="performance-panel__status" id="system-status">●</span>
            </div>
            <div class="performance-panel__content">
                <div class="performance-metric">
                    <span class="performance-metric__label">Nivel:</span>
                    <span class="performance-metric__value" id="system-level">Alto</span>
                </div>
                <div class="performance-metric">
                    <span class="performance-metric__label">Optimizaciones:</span>
                    <span class="performance-metric__value" id="system-optimizations">0</span>
                </div>
                <div class="performance-metric">
                    <span class="performance-metric__label">Alertas:</span>
                    <span class="performance-metric__value" id="system-alerts">0</span>
                </div>
                <div class="performance-controls">
                    <button class="performance-btn" id="force-optimization">Optimizar</button>
                    <button class="performance-btn" id="cleanup-memory">Limpiar</button>
                    <button class="performance-btn" id="toggle-display">Ocultar</button>
                </div>
            </div>
        `;

        this.container.appendChild(panel);
        this.panels.set('system', panel);

        // Configurar botones
        this.setupControlButtons();
    }

    /**
     * Configurar botones de control
     * @private
     */
    setupControlButtons() {
        const forceOptBtn = document.getElementById('force-optimization');
        const cleanupBtn = document.getElementById('cleanup-memory');
        const toggleBtn = document.getElementById('toggle-display');

        if (forceOptBtn) {
            forceOptBtn.addEventListener('click', () => {
                this.eventBus.emit('optimizer:force-optimization');
            });
        }

        if (cleanupBtn) {
            cleanupBtn.addEventListener('click', () => {
                this.eventBus.emit('memory:cleanup');
            });
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggle();
            });
        }
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        // Eventos de rendimiento
        this.eventBus.on('performance:update', this.onPerformanceUpdate, this);
        this.eventBus.on('engine:performance-update', this.onEnginePerformanceUpdate, this);
        
        // Eventos de memoria
        this.eventBus.on('memory:usage-update', this.onMemoryUpdate, this);
        this.eventBus.on('memory:gc-detected', this.onGarbageCollection, this);
        
        // Eventos de optimización
        this.eventBus.on('optimizer:optimization-completed', this.onOptimizationCompleted, this);
        this.eventBus.on('optimizer:state-update', this.onOptimizerStateUpdate, this);
        
        // Eventos de alerta
        this.eventBus.on('performance:alert', this.onPerformanceAlert, this);
        
        // Comandos de control
        this.eventBus.on('debug:toggle-performance-display', this.toggle, this);
        this.eventBus.on('debug:show-performance-display', () => this.setVisible(true), this);
        this.eventBus.on('debug:hide-performance-display', () => this.setVisible(false), this);

        // Eventos de teclado
        document.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    /**
     * Manejar eventos de teclado
     * @param {KeyboardEvent} event - Evento de teclado
     * @private
     */
    onKeyDown(event) {
        // F3 para alternar display de rendimiento
        if (event.key === 'F3') {
            event.preventDefault();
            this.toggle();
        }
        
        // Ctrl+Shift+P para forzar optimización
        if (event.ctrlKey && event.shiftKey && event.key === 'P') {
            event.preventDefault();
            this.eventBus.emit('optimizer:force-optimization');
        }
        
        // Ctrl+Shift+M para limpiar memoria
        if (event.ctrlKey && event.shiftKey && event.key === 'M') {
            event.preventDefault();
            this.eventBus.emit('memory:cleanup');
        }
    }

    /**
     * Iniciar bucle de actualización
     * @private
     */
    startUpdateLoop() {
        this.updateTimer = setInterval(() => {
            if (this.isVisible) {
                this.updateDisplay();
            }
        }, this.displayConfig.updateInterval);
    }

    /**
     * Manejar actualización de rendimiento del PerformanceMonitor
     * @param {Object} data - Datos de rendimiento
     */
    onPerformanceUpdate(data) {
        // Actualizar datos de FPS
        if (data.fps) {
            this.performanceData.fps.current = data.fps.current || data.fps;
            this.addToHistory('fps', this.performanceData.fps.current);
        }

        // Actualizar datos de frame time
        if (data.frameTime) {
            this.performanceData.frameTime.current = data.frameTime.current || data.frameTime;
            this.addToHistory('frameTime', this.performanceData.frameTime.current);
        }

        // Actualizar datos de memoria
        if (data.memory) {
            this.performanceData.memory.current = data.memory.used || data.memory;
            this.performanceData.memory.limit = data.memory.limit || this.performanceData.memory.limit;
            this.addToHistory('memory', this.performanceData.memory.current);
        }
    }

    /**
     * Manejar actualización de rendimiento del GameEngine
     * @param {Object} data - Datos de rendimiento del motor
     */
    onEnginePerformanceUpdate(data) {
        // Actualizar tiempos de update y render
        if (data.updateTime !== undefined) {
            this.performanceData.updateTime.current = data.updateTime;
            this.addToHistory('updateTime', data.updateTime);
        }

        if (data.renderTime !== undefined) {
            this.performanceData.renderTime.current = data.renderTime;
            this.addToHistory('renderTime', data.renderTime);
        }

        // Actualizar FPS si no viene del PerformanceMonitor
        if (data.fps && !this.performanceData.fps.current) {
            this.performanceData.fps.current = data.fps;
            this.addToHistory('fps', data.fps);
        }
    }

    /**
     * Manejar actualización de memoria
     * @param {Object} data - Datos de memoria
     */
    onMemoryUpdate(data) {
        this.performanceData.memory.current = data.used;
        this.performanceData.memory.limit = data.limit;
        this.addToHistory('memory', data.used);
    }

    /**
     * Manejar detección de garbage collection
     * @param {Object} data - Datos de GC
     */
    onGarbageCollection(data) {
        // Mostrar indicador visual de GC
        const memoryStatus = document.getElementById('memory-status');
        if (memoryStatus) {
            memoryStatus.style.color = '#38A169'; // Verde
            setTimeout(() => {
                memoryStatus.style.color = '';
            }, 1000);
        }
    }

    /**
     * Manejar optimización completada
     * @param {Object} data - Datos de optimización
     */
    onOptimizationCompleted(data) {
        // Mostrar indicador visual de optimización
        const systemStatus = document.getElementById('system-status');
        if (systemStatus) {
            systemStatus.style.color = '#9F7AEA'; // Púrpura
            setTimeout(() => {
                systemStatus.style.color = '';
            }, 2000);
        }
    }

    /**
     * Manejar actualización del estado del optimizador
     * @param {Object} data - Estado del optimizador
     */
    onOptimizerStateUpdate(data) {
        // Actualizar nivel de rendimiento
        const levelElement = document.getElementById('system-level');
        if (levelElement && data.performanceLevel) {
            const levelText = {
                'high': 'Alto',
                'medium': 'Medio',
                'low': 'Bajo'
            };
            levelElement.textContent = levelText[data.performanceLevel] || data.performanceLevel;
            
            // Cambiar color según el nivel
            levelElement.className = `performance-metric__value performance-level--${data.performanceLevel}`;
        }
    }

    /**
     * Manejar alerta de rendimiento
     * @param {Object} data - Datos de la alerta
     */
    onPerformanceAlert(data) {
        // Mostrar alerta visual
        const statusElement = document.getElementById(`${this.getAlertPanel(data.type)}-status`);
        if (statusElement) {
            statusElement.style.color = data.severity === 'error' ? '#E53E3E' : '#FF6B6B';
            statusElement.style.animation = 'pulse 1s infinite';
            
            setTimeout(() => {
                statusElement.style.color = '';
                statusElement.style.animation = '';
            }, 3000);
        }
    }

    /**
     * Obtener panel correspondiente a un tipo de alerta
     * @param {string} alertType - Tipo de alerta
     * @returns {string} Nombre del panel
     * @private
     */
    getAlertPanel(alertType) {
        switch (alertType) {
            case 'low-fps':
            case 'high-frame-time':
                return 'fps';
            case 'high-memory':
            case 'critical-memory':
                return 'memory';
            default:
                return 'system';
        }
    }

    /**
     * Agregar valor al historial
     * @param {string} metric - Métrica
     * @param {number} value - Valor
     * @private
     */
    addToHistory(metric, value) {
        if (!this.performanceData[metric]) return;

        this.performanceData[metric].history.push(value);
        
        // Mantener historial limitado
        if (this.performanceData[metric].history.length > this.displayConfig.maxHistoryPoints) {
            this.performanceData[metric].history.shift();
        }
    }

    /**
     * Actualizar display visual
     * @private
     */
    updateDisplay() {
        this.updateFPSPanel();
        this.updateMemoryPanel();
        this.updateTimingPanel();
        this.updateSystemPanel();
        
        if (this.displayConfig.showGraphs) {
            this.updateGraphs();
        }
    }

    /**
     * Actualizar panel de FPS
     * @private
     */
    updateFPSPanel() {
        const currentElement = document.getElementById('fps-current');
        const averageElement = document.getElementById('fps-average');
        const minElement = document.getElementById('fps-min');
        const statusElement = document.getElementById('fps-status');

        if (currentElement) {
            currentElement.textContent = Math.round(this.performanceData.fps.current);
        }

        if (averageElement && this.performanceData.fps.history.length > 0) {
            const avg = this.performanceData.fps.history.reduce((a, b) => a + b, 0) / this.performanceData.fps.history.length;
            averageElement.textContent = Math.round(avg);
        }

        if (minElement && this.performanceData.fps.history.length > 0) {
            const min = Math.min(...this.performanceData.fps.history);
            minElement.textContent = Math.round(min);
        }

        // Actualizar estado visual
        if (statusElement) {
            const fpsRatio = this.performanceData.fps.current / this.performanceData.fps.target;
            if (fpsRatio >= 0.9) {
                statusElement.style.color = '#38A169'; // Verde
            } else if (fpsRatio >= 0.7) {
                statusElement.style.color = '#FFD700'; // Amarillo
            } else {
                statusElement.style.color = '#E53E3E'; // Rojo
            }
        }
    }

    /**
     * Actualizar panel de memoria
     * @private
     */
    updateMemoryPanel() {
        const usedElement = document.getElementById('memory-used');
        const limitElement = document.getElementById('memory-limit');
        const statusElement = document.getElementById('memory-status');

        if (usedElement) {
            usedElement.textContent = this.formatBytes(this.performanceData.memory.current);
        }

        if (limitElement) {
            limitElement.textContent = this.formatBytes(this.performanceData.memory.limit);
        }

        // Actualizar estado visual
        if (statusElement && this.performanceData.memory.limit > 0) {
            const memoryRatio = this.performanceData.memory.current / this.performanceData.memory.limit;
            if (memoryRatio < 0.7) {
                statusElement.style.color = '#38A169'; // Verde
            } else if (memoryRatio < 0.9) {
                statusElement.style.color = '#FFD700'; // Amarillo
            } else {
                statusElement.style.color = '#E53E3E'; // Rojo
            }
        }
    }

    /**
     * Actualizar panel de tiempos
     * @private
     */
    updateTimingPanel() {
        const frameElement = document.getElementById('timing-frame');
        const updateElement = document.getElementById('timing-update');
        const renderElement = document.getElementById('timing-render');
        const statusElement = document.getElementById('timing-status');

        if (frameElement) {
            frameElement.textContent = `${this.performanceData.frameTime.current.toFixed(2)}ms`;
        }

        if (updateElement) {
            updateElement.textContent = `${this.performanceData.updateTime.current.toFixed(2)}ms`;
        }

        if (renderElement) {
            renderElement.textContent = `${this.performanceData.renderTime.current.toFixed(2)}ms`;
        }

        // Actualizar estado visual
        if (statusElement) {
            const frameTimeRatio = this.performanceData.frameTime.current / this.performanceData.frameTime.target;
            if (frameTimeRatio <= 1.0) {
                statusElement.style.color = '#38A169'; // Verde
            } else if (frameTimeRatio <= 1.5) {
                statusElement.style.color = '#FFD700'; // Amarillo
            } else {
                statusElement.style.color = '#E53E3E'; // Rojo
            }
        }
    }

    /**
     * Actualizar panel del sistema
     * @private
     */
    updateSystemPanel() {
        // Los valores se actualizan a través de eventos específicos
        // Este método puede agregar lógica adicional si es necesario
    }

    /**
     * Actualizar gráficos
     * @private
     */
    updateGraphs() {
        this.updateGraph('fps-graph', this.performanceData.fps.history, this.performanceData.fps.target);
        this.updateGraph('memory-graph', this.performanceData.memory.history);
        this.updateGraph('timing-graph', this.performanceData.frameTime.history, this.performanceData.frameTime.target);
    }

    /**
     * Actualizar un gráfico específico
     * @param {string} elementId - ID del elemento del gráfico
     * @param {Array} data - Datos para el gráfico
     * @param {number} target - Valor objetivo (opcional)
     * @private
     */
    updateGraph(elementId, data, target = null) {
        const element = document.getElementById(elementId);
        if (!element || data.length === 0) return;

        const width = element.offsetWidth || 100;
        const height = element.offsetHeight || 30;
        
        // Crear canvas si no existe
        let canvas = element.querySelector('canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            element.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);

        // Calcular escala
        const maxValue = Math.max(...data, target || 0);
        const minValue = Math.min(...data, 0);
        const range = maxValue - minValue || 1;

        // Dibujar línea objetivo si existe
        if (target !== null) {
            const targetY = height - ((target - minValue) / range) * height;
            ctx.strokeStyle = '#9F7AEA';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(0, targetY);
            ctx.lineTo(width, targetY);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Dibujar datos
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((value, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - ((value - minValue) / range) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
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
     * Alternar visibilidad del display
     */
    toggle() {
        this.setVisible(!this.isVisible);
    }

    /**
     * Establecer visibilidad del display
     * @param {boolean} visible - Estado de visibilidad
     */
    setVisible(visible) {
        this.isVisible = visible;
        
        if (this.container) {
            this.container.style.display = visible ? 'block' : 'none';
        }

        // Actualizar texto del botón
        const toggleBtn = document.getElementById('toggle-display');
        if (toggleBtn) {
            toggleBtn.textContent = visible ? 'Ocultar' : 'Mostrar';
        }

        console.log(`[PerformanceDisplay] Display ${visible ? 'mostrado' : 'ocultado'}`);
    }

    /**
     * Limpiar recursos
     */
    destroy() {
        // Limpiar timer
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }

        // Limpiar event listeners
        this.eventBus.off('performance:update', this.onPerformanceUpdate, this);
        this.eventBus.off('engine:performance-update', this.onEnginePerformanceUpdate, this);
        this.eventBus.off('memory:usage-update', this.onMemoryUpdate, this);
        this.eventBus.off('memory:gc-detected', this.onGarbageCollection, this);
        this.eventBus.off('optimizer:optimization-completed', this.onOptimizationCompleted, this);
        this.eventBus.off('optimizer:state-update', this.onOptimizerStateUpdate, this);
        this.eventBus.off('performance:alert', this.onPerformanceAlert, this);

        // Remover elementos del DOM
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        this.panels.clear();
        this.isInitialized = false;

        console.log('[PerformanceDisplay] Display destruido');
    }
}