/**
 * PerformanceMonitor - Sistema de monitoreo de rendimiento para Spikepulse
 * @module PerformanceMonitor
 */

import { SpanishFormatter } from './SpanishFormatter.js';

export class PerformanceMonitor {
    /**
     * Crea una nueva instancia del monitor de rendimiento
     * @param {Object} config - Configuración del monitor
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isEnabled = config.debug?.enabled || false;
        this.isInitialized = false;

        // Métricas de FPS
        this.fps = {
            current: 0,
            average: 0,
            min: Infinity,
            max: 0,
            history: [],
            maxHistory: 120, // 2 segundos a 60fps
            target: config.performance?.targetFPS || 60
        };

        // Métricas de tiempo de frame
        this.frameTime = {
            current: 0,
            average: 0,
            min: Infinity,
            max: 0,
            history: [],
            maxHistory: 60,
            target: 1000 / this.fps.target
        };

        // Métricas de memoria
        this.memory = {
            used: 0,
            total: 0,
            limit: 0,
            history: [],
            maxHistory: 60,
            gcCount: 0,
            lastGC: 0
        };

        // Métricas de módulos
        this.moduleMetrics = new Map();

        // Métricas de renderizado
        this.renderMetrics = {
            drawCalls: 0,
            objectsRendered: 0,
            culledObjects: 0,
            layersRendered: 0,
            effectsRendered: 0
        };

        // Contadores de performance
        this.counters = {
            frameCount: 0,
            updateCalls: 0,
            renderCalls: 0,
            eventsFired: 0,
            errorsCount: 0
        };

        // Timestamps para medición
        this.timestamps = {
            frameStart: 0,
            updateStart: 0,
            renderStart: 0,
            lastUpdate: 0
        };

        // Configuración de alertas
        this.alerts = {
            lowFPS: this.fps.target * 0.7, // 70% del target FPS
            highFrameTime: this.frameTime.target * 1.5, // 150% del target frame time
            highMemory: 100 * 1024 * 1024, // 100MB
            enabled: this.isEnabled
        };

        // Estado del monitor
        this.state = {
            isRecording: false,
            isPaused: false,
            startTime: 0,
            sessionDuration: 0
        };

        this.init();
    }

    /**
     * Inicializar el monitor de rendimiento
     * @private
     */
    init() {
        if (this.isInitialized) return;

        this.setupEventListeners();
        this.startMonitoring();
        this.isInitialized = true;

        console.log('[PerformanceMonitor] Monitor de rendimiento inicializado');
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        // Eventos del motor
        this.eventBus.on('engine:frame-start', this.onFrameStart, this);
        this.eventBus.on('engine:frame-end', this.onFrameEnd, this);
        this.eventBus.on('engine:update-start', this.onUpdateStart, this);
        this.eventBus.on('engine:update-end', this.onUpdateEnd, this);
        this.eventBus.on('engine:render-start', this.onRenderStart, this);
        this.eventBus.on('engine:render-end', this.onRenderEnd, this);

        // Eventos de módulos
        this.eventBus.on('module:performance', this.onModulePerformance, this);
        this.eventBus.on('renderer:stats', this.onRendererStats, this);

        // Eventos de error
        this.eventBus.on('engine:error', this.onError, this);
        this.eventBus.on('module:error', this.onError, this);

        // Comandos de control
        this.eventBus.on('performance:start', this.startRecording, this);
        this.eventBus.on('performance:stop', this.stopRecording, this);
        this.eventBus.on('performance:reset', this.reset, this);
        this.eventBus.on('performance:toggle', this.toggle, this);
    }

    /**
     * Iniciar monitoreo
     */
    startMonitoring() {
        if (this.state.isRecording) return;

        this.state.isRecording = true;
        this.state.startTime = performance.now();
        this.reset();

        // Configurar observer de memoria si está disponible
        this.setupMemoryObserver();

        console.log('[PerformanceMonitor] Monitoreo iniciado');
        this.eventBus.emit('performance:monitoring-started');
    }

    /**
     * Detener monitoreo
     */
    stopMonitoring() {
        if (!this.state.isRecording) return;

        this.state.isRecording = false;
        this.state.sessionDuration = performance.now() - this.state.startTime;

        console.log('[PerformanceMonitor] Monitoreo detenido');
        this.eventBus.emit('performance:monitoring-stopped', this.getSessionSummary());
    }

    /**
     * Configurar observer de memoria
     * @private
     */
    setupMemoryObserver() {
        if (!performance.memory) {
            console.warn('[PerformanceMonitor] API de memoria no disponible');
            return;
        }

        // Monitorear memoria cada segundo
        this.memoryInterval = setInterval(() => {
            this.updateMemoryMetrics();
        }, 1000);
    }

    /**
     * Actualizar métricas de memoria
     * @private
     */
    updateMemoryMetrics() {
        if (!performance.memory || !this.state.isRecording) return;

        const memInfo = performance.memory;
        this.memory.used = memInfo.usedJSHeapSize;
        this.memory.total = memInfo.totalJSHeapSize;
        this.memory.limit = memInfo.jsHeapSizeLimit;

        // Detectar garbage collection
        if (this.memory.used < this.memory.history[this.memory.history.length - 1]?.used * 0.9) {
            this.memory.gcCount++;
            this.memory.lastGC = performance.now();
            this.eventBus.emit('performance:gc-detected', {
                gcCount: this.memory.gcCount,
                memoryFreed: this.memory.history[this.memory.history.length - 1]?.used - this.memory.used
            });
        }

        // Agregar al historial
        this.memory.history.push({
            timestamp: performance.now(),
            used: this.memory.used,
            total: this.memory.total,
            limit: this.memory.limit
        });

        // Mantener historial limitado
        if (this.memory.history.length > this.memory.maxHistory) {
            this.memory.history.shift();
        }

        // Verificar alertas de memoria
        this.checkMemoryAlerts();
    }

    /**
     * Verificar alertas de memoria
     * @private
     */
    checkMemoryAlerts() {
        if (!this.alerts.enabled) return;

        const memoryUsagePercent = (this.memory.used / this.memory.limit) * 100;

        if (memoryUsagePercent > 80) {
            this.eventBus.emit('performance:alert', {
                type: 'high-memory',
                severity: 'warning',
                message: `Uso de memoria alto: ${memoryUsagePercent.toFixed(1)}%`,
                data: {
                    used: this.memory.used,
                    limit: this.memory.limit,
                    percentage: memoryUsagePercent
                }
            });
        }

        if (memoryUsagePercent > 90) {
            this.eventBus.emit('performance:alert', {
                type: 'critical-memory',
                severity: 'error',
                message: `Uso de memoria crítico: ${memoryUsagePercent.toFixed(1)}%`,
                data: {
                    used: this.memory.used,
                    limit: this.memory.limit,
                    percentage: memoryUsagePercent
                }
            });
        }
    }

    /**
     * Manejar inicio de frame
     * @param {Object} data - Datos del evento
     */
    onFrameStart(data) {
        if (!this.state.isRecording) return;

        this.timestamps.frameStart = performance.now();
        this.counters.frameCount++;
    }

    /**
     * Manejar fin de frame
     * @param {Object} data - Datos del evento
     */
    onFrameEnd(data) {
        if (!this.state.isRecording) return;

        const frameEndTime = performance.now();
        const frameTime = frameEndTime - this.timestamps.frameStart;
        
        this.updateFrameMetrics(frameTime);
        this.updateFPSMetrics(frameTime);
        
        // Emitir métricas cada 60 frames (1 segundo a 60fps)
        if (this.counters.frameCount % 60 === 0) {
            this.emitPerformanceUpdate();
        }
    }

    /**
     * Actualizar métricas de frame
     * @param {number} frameTime - Tiempo del frame en ms
     * @private
     */
    updateFrameMetrics(frameTime) {
        this.frameTime.current = frameTime;
        this.frameTime.min = Math.min(this.frameTime.min, frameTime);
        this.frameTime.max = Math.max(this.frameTime.max, frameTime);

        // Agregar al historial
        this.frameTime.history.push(frameTime);
        if (this.frameTime.history.length > this.frameTime.maxHistory) {
            this.frameTime.history.shift();
        }

        // Calcular promedio
        const sum = this.frameTime.history.reduce((a, b) => a + b, 0);
        this.frameTime.average = sum / this.frameTime.history.length;

        // Verificar alertas
        this.checkFrameTimeAlerts(frameTime);
    }

    /**
     * Actualizar métricas de FPS
     * @param {number} frameTime - Tiempo del frame en ms
     * @private
     */
    updateFPSMetrics(frameTime) {
        const currentFPS = Math.round(1000 / frameTime);
        
        this.fps.current = currentFPS;
        this.fps.min = Math.min(this.fps.min, currentFPS);
        this.fps.max = Math.max(this.fps.max, currentFPS);

        // Agregar al historial
        this.fps.history.push(currentFPS);
        if (this.fps.history.length > this.fps.maxHistory) {
            this.fps.history.shift();
        }

        // Calcular promedio
        const sum = this.fps.history.reduce((a, b) => a + b, 0);
        this.fps.average = Math.round(sum / this.fps.history.length);

        // Verificar alertas
        this.checkFPSAlerts(currentFPS);
    }

    /**
     * Verificar alertas de FPS
     * @param {number} currentFPS - FPS actual
     * @private
     */
    checkFPSAlerts(currentFPS) {
        if (!this.alerts.enabled) return;

        if (currentFPS < this.alerts.lowFPS) {
            this.eventBus.emit('performance:alert', {
                type: 'low-fps',
                severity: 'warning',
                message: `FPS bajo detectado: ${currentFPS} (objetivo: ${this.fps.target})`,
                data: {
                    current: currentFPS,
                    target: this.fps.target,
                    threshold: this.alerts.lowFPS
                }
            });
        }
    }

    /**
     * Verificar alertas de tiempo de frame
     * @param {number} frameTime - Tiempo del frame
     * @private
     */
    checkFrameTimeAlerts(frameTime) {
        if (!this.alerts.enabled) return;

        if (frameTime > this.alerts.highFrameTime) {
            this.eventBus.emit('performance:alert', {
                type: 'high-frame-time',
                severity: 'warning',
                message: `Tiempo de frame alto: ${frameTime.toFixed(2)}ms (objetivo: ${this.frameTime.target.toFixed(2)}ms)`,
                data: {
                    current: frameTime,
                    target: this.frameTime.target,
                    threshold: this.alerts.highFrameTime
                }
            });
        }
    }

    /**
     * Manejar inicio de actualización
     */
    onUpdateStart() {
        if (!this.state.isRecording) return;
        this.timestamps.updateStart = performance.now();
        this.counters.updateCalls++;
    }

    /**
     * Manejar fin de actualización
     */
    onUpdateEnd() {
        if (!this.state.isRecording) return;
        this.timestamps.lastUpdate = performance.now() - this.timestamps.updateStart;
    }

    /**
     * Manejar inicio de renderizado
     */
    onRenderStart() {
        if (!this.state.isRecording) return;
        this.timestamps.renderStart = performance.now();
        this.counters.renderCalls++;
    }

    /**
     * Manejar fin de renderizado
     */
    onRenderEnd() {
        if (!this.state.isRecording) return;
        // El tiempo de render se calcula en onRendererStats
    }

    /**
     * Manejar métricas de módulos
     * @param {Object} data - Datos de rendimiento del módulo
     */
    onModulePerformance(data) {
        if (!this.state.isRecording) return;

        const { moduleName, updateTime, renderTime, memoryUsage } = data;
        
        if (!this.moduleMetrics.has(moduleName)) {
            this.moduleMetrics.set(moduleName, {
                updateTime: { current: 0, average: 0, history: [] },
                renderTime: { current: 0, average: 0, history: [] },
                memoryUsage: { current: 0, average: 0, history: [] },
                callCount: 0
            });
        }

        const metrics = this.moduleMetrics.get(moduleName);
        metrics.callCount++;

        if (updateTime !== undefined) {
            metrics.updateTime.current = updateTime;
            metrics.updateTime.history.push(updateTime);
            if (metrics.updateTime.history.length > 60) {
                metrics.updateTime.history.shift();
            }
            const sum = metrics.updateTime.history.reduce((a, b) => a + b, 0);
            metrics.updateTime.average = sum / metrics.updateTime.history.length;
        }

        if (renderTime !== undefined) {
            metrics.renderTime.current = renderTime;
            metrics.renderTime.history.push(renderTime);
            if (metrics.renderTime.history.length > 60) {
                metrics.renderTime.history.shift();
            }
            const sum = metrics.renderTime.history.reduce((a, b) => a + b, 0);
            metrics.renderTime.average = sum / metrics.renderTime.history.length;
        }

        if (memoryUsage !== undefined) {
            metrics.memoryUsage.current = memoryUsage;
            metrics.memoryUsage.history.push(memoryUsage);
            if (metrics.memoryUsage.history.length > 60) {
                metrics.memoryUsage.history.shift();
            }
            const sum = metrics.memoryUsage.history.reduce((a, b) => a + b, 0);
            metrics.memoryUsage.average = sum / metrics.memoryUsage.history.length;
        }
    }

    /**
     * Manejar estadísticas del renderer
     * @param {Object} data - Estadísticas del renderer
     */
    onRendererStats(data) {
        if (!this.state.isRecording) return;

        this.renderMetrics = {
            ...this.renderMetrics,
            ...data
        };
    }

    /**
     * Manejar errores
     * @param {Object} data - Datos del error
     */
    onError(data) {
        if (!this.state.isRecording) return;
        this.counters.errorsCount++;
    }

    /**
     * Emitir actualización de rendimiento
     * @private
     */
    emitPerformanceUpdate() {
        const metrics = this.getCurrentMetrics();
        this.eventBus.emit('performance:update', metrics);
    }

    /**
     * Obtener métricas actuales
     * @returns {Object} Métricas de rendimiento actuales
     */
    getCurrentMetrics() {
        return {
            timestamp: performance.now(),
            fps: { ...this.fps },
            frameTime: { ...this.frameTime },
            memory: { ...this.memory },
            renderMetrics: { ...this.renderMetrics },
            counters: { ...this.counters },
            moduleMetrics: Object.fromEntries(this.moduleMetrics),
            state: { ...this.state }
        };
    }

    /**
     * Obtener resumen de la sesión
     * @returns {Object} Resumen de la sesión de monitoreo
     */
    getSessionSummary() {
        const duration = this.state.sessionDuration || (performance.now() - this.state.startTime);
        
        return {
            duration: duration,
            durationFormatted: SpanishFormatter.formatTime(duration / 1000),
            totalFrames: this.counters.frameCount,
            averageFPS: this.fps.average,
            minFPS: this.fps.min,
            maxFPS: this.fps.max,
            averageFrameTime: this.frameTime.average,
            minFrameTime: this.frameTime.min,
            maxFrameTime: this.frameTime.max,
            totalErrors: this.counters.errorsCount,
            gcCount: this.memory.gcCount,
            peakMemoryUsage: Math.max(...this.memory.history.map(h => h.used)),
            modulePerformance: Object.fromEntries(
                Array.from(this.moduleMetrics.entries()).map(([name, metrics]) => [
                    name,
                    {
                        averageUpdateTime: metrics.updateTime.average,
                        averageRenderTime: metrics.renderTime.average,
                        callCount: metrics.callCount
                    }
                ])
            )
        };
    }

    /**
     * Iniciar grabación de métricas
     */
    startRecording() {
        this.startMonitoring();
    }

    /**
     * Detener grabación de métricas
     */
    stopRecording() {
        this.stopMonitoring();
    }

    /**
     * Alternar monitoreo
     */
    toggle() {
        if (this.state.isRecording) {
            this.stopMonitoring();
        } else {
            this.startMonitoring();
        }
    }

    /**
     * Resetear todas las métricas
     */
    reset() {
        // Resetear FPS
        this.fps.min = Infinity;
        this.fps.max = 0;
        this.fps.history = [];

        // Resetear frame time
        this.frameTime.min = Infinity;
        this.frameTime.max = 0;
        this.frameTime.history = [];

        // Resetear memoria
        this.memory.history = [];
        this.memory.gcCount = 0;

        // Resetear contadores
        this.counters.frameCount = 0;
        this.counters.updateCalls = 0;
        this.counters.renderCalls = 0;
        this.counters.eventsFired = 0;
        this.counters.errorsCount = 0;

        // Resetear métricas de módulos
        this.moduleMetrics.clear();

        console.log('[PerformanceMonitor] Métricas reseteadas');
        this.eventBus.emit('performance:reset');
    }

    /**
     * Habilitar/deshabilitar monitor
     * @param {boolean} enabled - Estado habilitado
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        this.alerts.enabled = enabled;

        if (enabled && !this.state.isRecording) {
            this.startMonitoring();
        } else if (!enabled && this.state.isRecording) {
            this.stopMonitoring();
        }

        console.log(`[PerformanceMonitor] Monitor ${enabled ? 'habilitado' : 'deshabilitado'}`);
    }

    /**
     * Configurar alertas
     * @param {Object} alertConfig - Configuración de alertas
     */
    configureAlerts(alertConfig) {
        this.alerts = {
            ...this.alerts,
            ...alertConfig
        };

        console.log('[PerformanceMonitor] Alertas configuradas:', this.alerts);
    }

    /**
     * Obtener estadísticas formateadas para mostrar
     * @returns {Object} Estadísticas formateadas
     */
    getFormattedStats() {
        const metrics = this.getCurrentMetrics();
        
        return {
            fps: `${metrics.fps.current} FPS (avg: ${metrics.fps.average})`,
            frameTime: `${metrics.frameTime.current.toFixed(2)}ms (avg: ${metrics.frameTime.average.toFixed(2)}ms)`,
            memory: performance.memory ? 
                `${SpanishFormatter.formatBytes(metrics.memory.used)} / ${SpanishFormatter.formatBytes(metrics.memory.limit)}` : 
                'No disponible',
            frames: SpanishFormatter.formatNumber(metrics.counters.frameCount),
            errors: SpanishFormatter.formatNumber(metrics.counters.errorsCount),
            gc: SpanishFormatter.formatNumber(metrics.memory.gcCount)
        };
    }

    /**
     * Limpiar recursos
     */
    destroy() {
        this.stopMonitoring();

        if (this.memoryInterval) {
            clearInterval(this.memoryInterval);
        }

        // Limpiar event listeners
        this.eventBus.off('engine:frame-start', this.onFrameStart, this);
        this.eventBus.off('engine:frame-end', this.onFrameEnd, this);
        this.eventBus.off('engine:update-start', this.onUpdateStart, this);
        this.eventBus.off('engine:update-end', this.onUpdateEnd, this);
        this.eventBus.off('engine:render-start', this.onRenderStart, this);
        this.eventBus.off('engine:render-end', this.onRenderEnd, this);
        this.eventBus.off('module:performance', this.onModulePerformance, this);
        this.eventBus.off('renderer:stats', this.onRendererStats, this);
        this.eventBus.off('engine:error', this.onError, this);
        this.eventBus.off('module:error', this.onError, this);

        this.moduleMetrics.clear();
        this.isInitialized = false;

        console.log('[PerformanceMonitor] Monitor destruido');
    }
}