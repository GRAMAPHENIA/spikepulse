/**
 * Monitor de rendimiento para Spikepulse
 * @module PerformanceMonitor
 */

export class PerformanceMonitor {
    /**
     * Crea una nueva instancia del monitor de performance
     * @param {Object} config - Configuración del monitor
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        // Configuración del monitor
        this.monitorConfig = {
            enabled: config.enabled !== false,
            updateInterval: config.updateInterval || 1000, // 1 segundo
            maxSamples: config.maxSamples || 60, // 1 minuto de datos
            showOverlay: config.showOverlay || false,
            trackMemory: config.trackMemory !== false,
            trackFPS: config.trackFPS !== false,
            trackFrameTime: config.trackFrameTime !== false,
            trackCustomMetrics: config.trackCustomMetrics !== false,
            alertThresholds: {
                lowFPS: config.alertThresholds?.lowFPS || 30,
                highFrameTime: config.alertThresholds?.highFrameTime || 33.33, // ~30fps
                highMemory: config.alertThresholds?.highMemory || 100 * 1024 * 1024 // 100MB
            }
        };
        
        // Métricas de rendimiento
        this.metrics = {
            fps: {
                current: 60,
                average: 60,
                min: 60,
                max: 60,
                samples: []
            },
            frameTime: {
                current: 16.67,
                average: 16.67,
                min: 16.67,
                max: 16.67,
                samples: []
            },
            memory: {
                used: 0,
                total: 0,
                limit: 0,
                samples: []
            },
            custom: new Map()
        };
        
        // Timers y contadores
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.lastUpdateTime = 0;
        this.updateTimer = null;
        
        // Overlay de performance
        this.overlay = null;
        this.isOverlayVisible = false;
        
        // Alertas
        this.alerts = [];
        this.lastAlertTime = new Map();
        this.alertCooldown = 5000; // 5 segundos
        
        // Estadísticas
        this.stats = {
            samplesCollected: 0,
            alertsTriggered: 0,
            monitoringTime: 0,
            startTime: Date.now()
        };
        
        console.log('📊 PerformanceMonitor creado');
    }
    
    /**
     * Inicializa el monitor de performance
     */
    async init() {
        try {
            console.log('🔧 Inicializando PerformanceMonitor...');
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Crear overlay si está habilitado
            if (this.monitorConfig.showOverlay) {
                this.createOverlay();
            }
            
            // Iniciar monitoreo
            if (this.monitorConfig.enabled) {
                this.startMonitoring();
            }
            
            this.isInitialized = true;
            console.log('✅ PerformanceMonitor inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando PerformanceMonitor:', error);
            throw error;
        }
    }
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Eventos de performance
        this.eventBus.on('performance:toggle', this.toggle.bind(this));
        this.eventBus.on('performance:toggle-overlay', this.toggleOverlay.bind(this));
        this.eventBus.on('performance:reset', this.reset.bind(this));
        this.eventBus.on('performance:add-metric', this.addCustomMetric.bind(this));
        this.eventBus.on('performance:update-metric', this.updateCustomMetric.bind(this));
        
        // Eventos del juego
        this.eventBus.on('game:frame-rendered', this.recordFrame.bind(this));
        this.eventBus.on('game:update-complete', this.recordUpdateTime.bind(this));
        this.eventBus.on('game:render-complete', this.recordRenderTime.bind(this));
        
        console.log('👂 Event listeners de performance configurados');
    }
    
    /**
     * Crea el overlay de performance
     */
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'performance-overlay';
        this.overlay.className = 'performance-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.9);
            color: #00FF00;
            font-family: monospace;
            font-size: 12px;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #333;
            z-index: 10000;
            pointer-events: none;
            display: none;
            min-width: 200px;
            line-height: 1.4;
        `;
        
        document.body.appendChild(this.overlay);
        console.log('📊 Performance overlay creado');
    }
    
    /**
     * Inicia el monitoreo de performance
     */
    startMonitoring() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        
        this.updateTimer = setInterval(() => {
            this.updateMetrics();
            this.checkAlerts();
            this.updateOverlay();
        }, this.monitorConfig.updateInterval);
        
        console.log('▶️ Monitoreo de performance iniciado');
    }
    
    /**
     * Detiene el monitoreo de performance
     */
    stopMonitoring() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
        
        console.log('⏹️ Monitoreo de performance detenido');
    }
    
    /**
     * Registra un frame renderizado
     * @param {Object} data - Datos del frame
     */
    recordFrame(data) {
        if (!this.monitorConfig.enabled) return;
        
        const currentTime = performance.now();
        const frameTime = currentTime - this.lastFrameTime;
        
        this.frameCount++;
        this.lastFrameTime = currentTime;
        
        // Calcular FPS
        if (this.monitorConfig.trackFPS) {
            const fps = 1000 / frameTime;
            this.recordMetric('fps', fps);
        }
        
        // Registrar frame time
        if (this.monitorConfig.trackFrameTime) {
            this.recordMetric('frameTime', frameTime);
        }
        
        // Datos adicionales del frame
        if (data) {
            if (data.renderTime !== undefined) {
                this.recordCustomMetric('renderTime', data.renderTime);
            }
            if (data.objectsRendered !== undefined) {
                this.recordCustomMetric('objectsRendered', data.objectsRendered);
            }
        }
    }
    
    /**
     * Registra tiempo de actualización
     * @param {Object} data - Datos de actualización
     */
    recordUpdateTime(data) {
        if (!this.monitorConfig.enabled || !data.updateTime) return;
        
        this.recordCustomMetric('updateTime', data.updateTime);
    }
    
    /**
     * Registra tiempo de renderizado
     * @param {Object} data - Datos de renderizado
     */
    recordRenderTime(data) {
        if (!this.monitorConfig.enabled || !data.renderTime) return;
        
        this.recordCustomMetric('renderTime', data.renderTime);
    }
    
    /**
     * Registra una métrica principal
     * @param {string} metricName - Nombre de la métrica
     * @param {number} value - Valor de la métrica
     */
    recordMetric(metricName, value) {
        const metric = this.metrics[metricName];
        if (!metric) return;
        
        // Actualizar valores actuales
        metric.current = value;
        metric.samples.push(value);
        
        // Limitar número de muestras
        if (metric.samples.length > this.monitorConfig.maxSamples) {
            metric.samples.shift();
        }
        
        // Calcular estadísticas
        this.calculateMetricStats(metric);
        
        this.stats.samplesCollected++;
    }
    
    /**
     * Registra una métrica personalizada
     * @param {string} name - Nombre de la métrica
     * @param {number} value - Valor
     */
    recordCustomMetric(name, value) {
        if (!this.monitorConfig.trackCustomMetrics) return;
        
        if (!this.metrics.custom.has(name)) {
            this.metrics.custom.set(name, {
                current: value,
                average: value,
                min: value,
                max: value,
                samples: []
            });
        }
        
        const metric = this.metrics.custom.get(name);
        metric.current = value;
        metric.samples.push(value);
        
        // Limitar muestras
        if (metric.samples.length > this.monitorConfig.maxSamples) {
            metric.samples.shift();
        }
        
        this.calculateMetricStats(metric);
    }
    
    /**
     * Calcula estadísticas de una métrica
     * @param {Object} metric - Métrica a calcular
     */
    calculateMetricStats(metric) {
        if (metric.samples.length === 0) return;
        
        // Calcular promedio
        metric.average = metric.samples.reduce((sum, val) => sum + val, 0) / metric.samples.length;
        
        // Calcular min y max
        metric.min = Math.min(...metric.samples);
        metric.max = Math.max(...metric.samples);
    }
    
    /**
     * Actualiza todas las métricas
     */
    updateMetrics() {
        // Actualizar memoria si está habilitado
        if (this.monitorConfig.trackMemory && performance.memory) {
            this.metrics.memory.used = performance.memory.usedJSHeapSize;
            this.metrics.memory.total = performance.memory.totalJSHeapSize;
            this.metrics.memory.limit = performance.memory.jsHeapSizeLimit;
            
            this.metrics.memory.samples.push(this.metrics.memory.used);
            if (this.metrics.memory.samples.length > this.monitorConfig.maxSamples) {
                this.metrics.memory.samples.shift();
            }
        }
        
        // Actualizar tiempo de monitoreo
        this.stats.monitoringTime = Date.now() - this.stats.startTime;
    }
    
    /**
     * Verifica alertas de rendimiento
     */
    checkAlerts() {
        const thresholds = this.monitorConfig.alertThresholds;
        const currentTime = Date.now();
        
        // Alerta de FPS bajo
        if (this.metrics.fps.current < thresholds.lowFPS) {
            this.triggerAlert('lowFPS', {
                message: `FPS bajo detectado: ${this.metrics.fps.current.toFixed(1)}`,
                severity: 'warning',
                value: this.metrics.fps.current,
                threshold: thresholds.lowFPS
            });
        }
        
        // Alerta de frame time alto
        if (this.metrics.frameTime.current > thresholds.highFrameTime) {
            this.triggerAlert('highFrameTime', {
                message: `Frame time alto: ${this.metrics.frameTime.current.toFixed(2)}ms`,
                severity: 'warning',
                value: this.metrics.frameTime.current,
                threshold: thresholds.highFrameTime
            });
        }
        
        // Alerta de memoria alta
        if (this.metrics.memory.used > thresholds.highMemory) {
            this.triggerAlert('highMemory', {
                message: `Uso de memoria alto: ${(this.metrics.memory.used / 1024 / 1024).toFixed(1)}MB`,
                severity: 'error',
                value: this.metrics.memory.used,
                threshold: thresholds.highMemory
            });
        }
    }
    
    /**
     * Dispara una alerta
     * @param {string} type - Tipo de alerta
     * @param {Object} alertData - Datos de la alerta
     */
    triggerAlert(type, alertData) {
        const currentTime = Date.now();
        const lastAlert = this.lastAlertTime.get(type) || 0;
        
        // Verificar cooldown
        if (currentTime - lastAlert < this.alertCooldown) {
            return;
        }
        
        const alert = {
            type,
            timestamp: currentTime,
            ...alertData
        };
        
        this.alerts.push(alert);
        this.lastAlertTime.set(type, currentTime);
        this.stats.alertsTriggered++;
        
        // Limitar número de alertas
        if (this.alerts.length > 50) {
            this.alerts.shift();
        }
        
        // Log de la alerta
        const logLevel = alertData.severity === 'error' ? 'error' : 'warn';
        console[logLevel](`🚨 Performance Alert [${type}]: ${alertData.message}`);
        
        // Emitir evento
        this.eventBus.emit('performance:alert', alert);
    }
    
    /**
     * Actualiza el overlay de performance
     */
    updateOverlay() {
        if (!this.overlay || !this.isOverlayVisible) return;
        
        const fps = this.metrics.fps;
        const frameTime = this.metrics.frameTime;
        const memory = this.metrics.memory;
        
        let content = `
            <div style="color: #FFD700; font-weight: bold; margin-bottom: 8px;">📊 PERFORMANCE</div>
        `;
        
        // FPS
        const fpsColor = fps.current < 30 ? '#FF6B6B' : fps.current < 50 ? '#FFA500' : '#00FF00';
        content += `
            <div style="color: ${fpsColor};">
                FPS: ${fps.current.toFixed(1)} (avg: ${fps.average.toFixed(1)})
            </div>
        `;
        
        // Frame Time
        const frameTimeColor = frameTime.current > 33 ? '#FF6B6B' : frameTime.current > 20 ? '#FFA500' : '#00FF00';
        content += `
            <div style="color: ${frameTimeColor};">
                Frame: ${frameTime.current.toFixed(2)}ms (avg: ${frameTime.average.toFixed(2)}ms)
            </div>
        `;
        
        // Memoria
        if (memory.used > 0) {
            const memoryMB = memory.used / 1024 / 1024;
            const memoryColor = memoryMB > 100 ? '#FF6B6B' : memoryMB > 50 ? '#FFA500' : '#00FF00';
            content += `
                <div style="color: ${memoryColor};">
                    Memory: ${memoryMB.toFixed(1)}MB
                </div>
            `;
        }
        
        // Métricas personalizadas
        if (this.metrics.custom.size > 0) {
            content += `<div style="margin-top: 8px; font-size: 10px; color: #CCC;">Custom:</div>`;
            
            for (const [name, metric] of this.metrics.custom.entries()) {
                content += `
                    <div style="font-size: 10px;">
                        ${name}: ${metric.current.toFixed(2)}
                    </div>
                `;
            }
        }
        
        // Alertas recientes
        const recentAlerts = this.alerts.slice(-3);
        if (recentAlerts.length > 0) {
            content += `<div style="margin-top: 8px; font-size: 10px; color: #FF6B6B;">Alerts:</div>`;
            recentAlerts.forEach(alert => {
                const time = new Date(alert.timestamp).toLocaleTimeString();
                content += `
                    <div style="font-size: 9px; color: #FF6B6B;">
                        [${time}] ${alert.type}
                    </div>
                `;
            });
        }
        
        this.overlay.innerHTML = content;
    }
    
    // ===== MANEJO DE EVENTOS =====
    
    /**
     * Alterna el monitoreo de performance
     * @param {Object} data - Datos del toggle
     */
    toggle(data) {
        const enabled = data?.enabled !== undefined ? data.enabled : !this.monitorConfig.enabled;
        
        this.monitorConfig.enabled = enabled;
        
        if (enabled) {
            this.startMonitoring();
            console.log('▶️ Performance monitoring enabled');
        } else {
            this.stopMonitoring();
            console.log('⏹️ Performance monitoring disabled');
        }
        
        // Emitir evento
        this.eventBus.emit('performance:toggled', { enabled });
    }
    
    /**
     * Alterna la visibilidad del overlay
     */
    toggleOverlay() {
        if (!this.overlay) {
            this.createOverlay();
        }
        
        this.isOverlayVisible = !this.isOverlayVisible;
        this.overlay.style.display = this.isOverlayVisible ? 'block' : 'none';
        
        console.log(`📊 Performance overlay ${this.isOverlayVisible ? 'shown' : 'hidden'}`);
    }
    
    /**
     * Añade una métrica personalizada
     * @param {Object} data - Datos de la métrica
     */
    addCustomMetric(data) {
        const { name, value = 0, description = '' } = data;
        
        if (!name) {
            console.warn('⚠️ Custom metric name required');
            return;
        }
        
        this.metrics.custom.set(name, {
            current: value,
            average: value,
            min: value,
            max: value,
            samples: [value],
            description
        });
        
        console.log(`📊 Custom metric added: ${name}`);
    }
    
    /**
     * Actualiza una métrica personalizada
     * @param {Object} data - Datos de la métrica
     */
    updateCustomMetric(data) {
        const { name, value } = data;
        
        if (!name || value === undefined) {
            console.warn('⚠️ Custom metric name and value required');
            return;
        }
        
        this.recordCustomMetric(name, value);
    }
    
    // ===== MÉTODOS PÚBLICOS =====
    
    /**
     * Obtiene métricas actuales
     * @returns {Object} Métricas de performance
     */
    getMetrics() {
        return {
            fps: { ...this.metrics.fps },
            frameTime: { ...this.metrics.frameTime },
            memory: { ...this.metrics.memory },
            custom: Object.fromEntries(
                Array.from(this.metrics.custom.entries()).map(([name, metric]) => [
                    name,
                    { ...metric }
                ])
            )
        };
    }
    
    /**
     * Obtiene alertas recientes
     * @param {number} limit - Límite de alertas
     * @returns {Array} Alertas recientes
     */
    getRecentAlerts(limit = 10) {
        return this.alerts.slice(-limit);
    }
    
    /**
     * Obtiene un resumen de performance
     * @returns {Object} Resumen
     */
    getPerformanceSummary() {
        const fps = this.metrics.fps;
        const frameTime = this.metrics.frameTime;
        const memory = this.metrics.memory;
        
        return {
            fps: {
                current: fps.current,
                average: fps.average,
                status: fps.current >= 50 ? 'good' : fps.current >= 30 ? 'fair' : 'poor'
            },
            frameTime: {
                current: frameTime.current,
                average: frameTime.average,
                status: frameTime.current <= 20 ? 'good' : frameTime.current <= 33 ? 'fair' : 'poor'
            },
            memory: {
                used: memory.used,
                usedMB: memory.used / 1024 / 1024,
                status: memory.used < 50 * 1024 * 1024 ? 'good' : 
                       memory.used < 100 * 1024 * 1024 ? 'fair' : 'poor'
            },
            alerts: {
                total: this.stats.alertsTriggered,
                recent: this.alerts.slice(-5).length
            },
            monitoring: {
                time: this.stats.monitoringTime,
                samples: this.stats.samplesCollected,
                enabled: this.monitorConfig.enabled
            }
        };
    }
    
    /**
     * Exporta datos de performance
     * @returns {Object} Datos exportados
     */
    exportData() {
        return {
            timestamp: Date.now(),
            config: { ...this.monitorConfig },
            metrics: this.getMetrics(),
            alerts: [...this.alerts],
            stats: { ...this.stats },
            summary: this.getPerformanceSummary()
        };
    }
    
    /**
     * Descarga datos de performance como archivo
     */
    downloadData() {
        const data = this.exportData();
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `spikepulse-performance-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        console.log('📊 Performance data downloaded');
    }
    
    /**
     * Obtiene estadísticas del monitor
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            ...this.stats,
            isEnabled: this.monitorConfig.enabled,
            isOverlayVisible: this.isOverlayVisible,
            metricsTracked: Object.keys(this.metrics).length + this.metrics.custom.size,
            alertsActive: this.alerts.length,
            monitoringTimeFormatted: this.formatTime(this.stats.monitoringTime)
        };
    }
    
    /**
     * Obtiene información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            config: { ...this.monitorConfig },
            stats: this.getStats(),
            metrics: this.getMetrics(),
            recentAlerts: this.getRecentAlerts(5),
            summary: this.getPerformanceSummary()
        };
    }
    
    /**
     * Formatea tiempo en milisegundos a string legible
     * @param {number} ms - Milisegundos
     * @returns {string} Tiempo formateado
     */
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
    
    /**
     * Resetea el monitor de performance
     */
    reset() {
        console.log('🔄 Reseteando PerformanceMonitor...');
        
        // Resetear métricas
        Object.values(this.metrics).forEach(metric => {
            if (metric.samples) {
                metric.samples.length = 0;
                metric.current = 0;
                metric.average = 0;
                metric.min = 0;
                metric.max = 0;
            }
        });
        
        // Limpiar métricas personalizadas
        this.metrics.custom.clear();
        
        // Limpiar alertas
        this.alerts.length = 0;
        this.lastAlertTime.clear();
        
        // Resetear estadísticas
        this.stats.samplesCollected = 0;
        this.stats.alertsTriggered = 0;
        this.stats.startTime = Date.now();
        this.stats.monitoringTime = 0;
        
        // Resetear contadores
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        
        console.log('✅ PerformanceMonitor reseteado');
    }
    
    /**
     * Limpia recursos del monitor de performance
     */
    destroy() {
        console.log('🧹 Destruyendo PerformanceMonitor...');
        
        // Detener monitoreo
        this.stopMonitoring();
        
        // Remover event listeners
        this.eventBus.off('*', this);
        
        // Limpiar overlay
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        
        // Limpiar referencias
        this.overlay = null;
        
        // Limpiar arrays
        this.alerts.length = 0;
        this.lastAlertTime.clear();
        this.metrics.custom.clear();
        
        this.isInitialized = false;
        
        console.log('✅ PerformanceMonitor destruido');
    }
}