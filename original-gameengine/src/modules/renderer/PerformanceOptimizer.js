/**
 * PerformanceOptimizer - Optimización de rendimiento para canvas grandes
 * @module PerformanceOptimizer
 */

/**
 * Optimizador de rendimiento para canvas de pantalla completa
 */
export class PerformanceOptimizer {
    /**
     * Crea una nueva instancia del PerformanceOptimizer
     * @param {Object} config - Configuración del optimizador
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(config = {}, eventBus = null) {
        this.config = {
            targetFPS: config.targetFPS || 60,
            minFPS: config.minFPS || 30,
            maxFPS: config.maxFPS || 120,
            adaptiveQuality: config.adaptiveQuality !== false,
            memoryThreshold: config.memoryThreshold || 0.8,
            gcThreshold: config.gcThreshold || 0.9,
            monitoringInterval: config.monitoringInterval || 1000,
            optimizationInterval: config.optimizationInterval || 5000,
            enableDynamicQuality: config.enableDynamicQuality !== false,
            enableMemoryManagement: config.enableMemoryManagement !== false,
            enableCulling: config.enableCulling !== false,
            ...config
        };
        
        this.eventBus = eventBus;
        this.isInitialized = false;
        this.isOptimizing = false;
        
        // Métricas de rendimiento
        this.performanceMetrics = {
            fps: 60,
            frameTime: 16.67,
            memoryUsage: 0,
            renderTime: 0,
            updateTime: 0,
            totalObjects: 0,
            visibleObjects: 0,
            culledObjects: 0
        };
        
        // Historial de métricas
        this.metricsHistory = {
            fps: [],
            frameTime: [],
            memoryUsage: [],
            maxHistorySize: 60
        };
        
        // Configuración de calidad dinámica
        this.qualityLevels = {
            ultra: {
                scale: 1.0,
                maxParticles: 200,
                enableShadows: true,
                enableBlur: true,
                enableAntialiasing: true,
                cullingDistance: 2000,
                lodDistance: 1000
            },
            high: {
                scale: 1.0,
                maxParticles: 150,
                enableShadows: true,
                enableBlur: true,
                enableAntialiasing: true,
                cullingDistance: 1500,
                lodDistance: 800
            },
            medium: {
                scale: 0.9,
                maxParticles: 100,
                enableShadows: true,
                enableBlur: false,
                enableAntialiasing: false,
                cullingDistance: 1200,
                lodDistance: 600
            },
            low: {
                scale: 0.8,
                maxParticles: 50,
                enableShadows: false,
                enableBlur: false,
                enableAntialiasing: false,
                cullingDistance: 800,
                lodDistance: 400
            },
            minimal: {
                scale: 0.7,
                maxParticles: 20,
                enableShadows: false,
                enableBlur: false,
                enableAntialiasing: false,
                cullingDistance: 600,
                lodDistance: 300
            }
        };
        
        this.currentQuality = 'high';
        this.targetQuality = 'high';
        
        // Timers
        this.monitoringTimer = null;
        this.optimizationTimer = null;
        
        // Contadores de frames
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.fpsCalculationTime = performance.now();
        
        this.init();
    }

    /**
     * Inicializar el optimizador
     * @private
     */
    init() {
        this.determineInitialQuality();
        this.startMonitoring();
        this.isInitialized = true;
        
        console.log(`[PerformanceOptimizer] Inicializado con calidad: ${this.currentQuality}`);
        
        if (this.eventBus) {
            this.eventBus.emit('performance:initialized', {
                quality: this.currentQuality,
                config: this.getCurrentQualityConfig()
            });
        }
    }

    /**
     * Determinar calidad inicial basada en el dispositivo
     * @private
     */
    determineInitialQuality() {
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1
        };
        
        const totalPixels = viewport.width * viewport.height * viewport.pixelRatio;
        const memoryInfo = this.getMemoryInfo();
        
        // Determinar calidad basada en resolución y memoria
        if (totalPixels > 4000000 || (memoryInfo && memoryInfo.totalJSHeapSize > 100 * 1024 * 1024)) {
            // 4K+ o más de 100MB de memoria usada
            this.currentQuality = 'medium';
        } else if (totalPixels > 2000000) {
            // 1080p+
            this.currentQuality = 'high';
        } else if (totalPixels > 1000000) {
            // 720p+
            this.currentQuality = 'high';
        } else {
            // Resoluciones menores
            this.currentQuality = 'medium';
        }
        
        // Ajustar por tipo de dispositivo
        if (this.isMobileDevice()) {
            this.currentQuality = this.lowerQuality(this.currentQuality);
        }
        
        this.targetQuality = this.currentQuality;
    }

    /**
     * Verificar si es dispositivo móvil
     * @returns {boolean} True si es móvil
     * @private
     */
    isMobileDevice() {
        return window.innerWidth <= 768 || 
               /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Iniciar monitoreo de rendimiento
     * @private
     */
    startMonitoring() {
        // Monitoreo de métricas
        this.monitoringTimer = setInterval(() => {
            this.updateMetrics();
            this.analyzePerformance();
        }, this.config.monitoringInterval);
        
        // Optimización periódica
        this.optimizationTimer = setInterval(() => {
            this.optimizePerformance();
        }, this.config.optimizationInterval);
        
        console.log('[PerformanceOptimizer] Monitoreo iniciado');
    }

    /**
     * Actualizar métricas de rendimiento
     * @private
     */
    updateMetrics() {
        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        
        // Calcular FPS
        this.frameCount++;
        if (now - this.fpsCalculationTime >= 1000) {
            this.performanceMetrics.fps = Math.round((this.frameCount * 1000) / (now - this.fpsCalculationTime));
            this.frameCount = 0;
            this.fpsCalculationTime = now;
        }
        
        // Actualizar métricas
        this.performanceMetrics.frameTime = deltaTime;
        this.performanceMetrics.memoryUsage = this.getMemoryUsage();
        
        // Agregar al historial
        this.addToHistory('fps', this.performanceMetrics.fps);
        this.addToHistory('frameTime', this.performanceMetrics.frameTime);
        this.addToHistory('memoryUsage', this.performanceMetrics.memoryUsage);
        
        this.lastFrameTime = now;
        
        // Emitir métricas
        if (this.eventBus) {
            this.eventBus.emit('performance:metrics-updated', {
                metrics: { ...this.performanceMetrics },
                quality: this.currentQuality
            });
        }
    }

    /**
     * Agregar valor al historial de métricas
     * @param {string} metric - Nombre de la métrica
     * @param {number} value - Valor a agregar
     * @private
     */
    addToHistory(metric, value) {
        if (!this.metricsHistory[metric]) {
            this.metricsHistory[metric] = [];
        }
        
        this.metricsHistory[metric].push(value);
        
        // Mantener tamaño máximo del historial
        if (this.metricsHistory[metric].length > this.metricsHistory.maxHistorySize) {
            this.metricsHistory[metric].shift();
        }
    }

    /**
     * Analizar rendimiento y determinar si necesita optimización
     * @private
     */
    analyzePerformance() {
        const metrics = this.performanceMetrics;
        const avgFPS = this.getAverageMetric('fps');
        const avgMemory = this.getAverageMetric('memoryUsage');
        
        let needsOptimization = false;
        let suggestedQuality = this.currentQuality;
        
        // Analizar FPS
        if (avgFPS < this.config.minFPS) {
            needsOptimization = true;
            suggestedQuality = this.lowerQuality(this.currentQuality);
            console.warn(`[PerformanceOptimizer] FPS bajo detectado: ${avgFPS}`);
        } else if (avgFPS > this.config.targetFPS + 10 && this.currentQuality !== 'ultra') {
            // FPS alto, podemos aumentar calidad
            suggestedQuality = this.higherQuality(this.currentQuality);
        }
        
        // Analizar memoria
        if (avgMemory > this.config.memoryThreshold) {
            needsOptimization = true;
            suggestedQuality = this.lowerQuality(suggestedQuality);
            console.warn(`[PerformanceOptimizer] Uso alto de memoria detectado: ${avgMemory}`);
        }
        
        // Actualizar calidad objetivo
        if (suggestedQuality !== this.targetQuality) {
            this.targetQuality = suggestedQuality;
            
            if (this.eventBus) {
                this.eventBus.emit('performance:quality-change-suggested', {
                    currentQuality: this.currentQuality,
                    suggestedQuality: this.targetQuality,
                    reason: needsOptimization ? 'performance_issue' : 'performance_improvement',
                    metrics: { ...metrics }
                });
            }
        }
    }

    /**
     * Optimizar rendimiento
     * @private
     */
    optimizePerformance() {
        if (this.isOptimizing) return;
        
        this.isOptimizing = true;
        
        try {
            // Cambiar calidad si es necesario
            if (this.targetQuality !== this.currentQuality) {
                this.changeQuality(this.targetQuality);
            }
            
            // Gestión de memoria
            if (this.config.enableMemoryManagement) {
                this.optimizeMemory();
            }
            
            // Optimizaciones específicas de canvas
            this.optimizeCanvas();
            
            console.log(`[PerformanceOptimizer] Optimización completada - Calidad: ${this.currentQuality}`);
            
            if (this.eventBus) {
                this.eventBus.emit('performance:optimization-completed', {
                    quality: this.currentQuality,
                    metrics: { ...this.performanceMetrics }
                });
            }
            
        } catch (error) {
            console.error('[PerformanceOptimizer] Error durante optimización:', error);
        } finally {
            this.isOptimizing = false;
        }
    }

    /**
     * Cambiar nivel de calidad
     * @param {string} newQuality - Nuevo nivel de calidad
     * @private
     */
    changeQuality(newQuality) {
        if (!this.qualityLevels[newQuality]) {
            console.warn(`[PerformanceOptimizer] Calidad desconocida: ${newQuality}`);
            return;
        }
        
        const oldQuality = this.currentQuality;
        this.currentQuality = newQuality;
        
        const qualityConfig = this.getCurrentQualityConfig();
        
        console.log(`[PerformanceOptimizer] Calidad cambiada: ${oldQuality} → ${newQuality}`);
        
        if (this.eventBus) {
            this.eventBus.emit('performance:quality-changed', {
                oldQuality,
                newQuality,
                config: qualityConfig
            });
        }
    }

    /**
     * Optimizar memoria
     * @private
     */
    optimizeMemory() {
        const memoryUsage = this.getMemoryUsage();
        
        if (memoryUsage > this.config.gcThreshold) {
            // Forzar garbage collection si está disponible
            if (window.gc) {
                window.gc();
                console.log('[PerformanceOptimizer] Garbage collection forzado');
            }
            
            // Limpiar caches
            if (this.eventBus) {
                this.eventBus.emit('performance:clear-caches');
            }
        }
    }

    /**
     * Optimizar canvas específicamente
     * @private
     */
    optimizeCanvas() {
        const qualityConfig = this.getCurrentQualityConfig();
        
        // Configurar culling
        if (this.config.enableCulling) {
            if (this.eventBus) {
                this.eventBus.emit('performance:update-culling', {
                    distance: qualityConfig.cullingDistance,
                    lodDistance: qualityConfig.lodDistance
                });
            }
        }
        
        // Configurar límites de objetos
        if (this.eventBus) {
            this.eventBus.emit('performance:update-limits', {
                maxParticles: qualityConfig.maxParticles,
                enableShadows: qualityConfig.enableShadows,
                enableBlur: qualityConfig.enableBlur,
                enableAntialiasing: qualityConfig.enableAntialiasing
            });
        }
    }

    /**
     * Obtener uso de memoria
     * @returns {number} Uso de memoria (0-1)
     * @private
     */
    getMemoryUsage() {
        const memoryInfo = this.getMemoryInfo();
        if (!memoryInfo) return 0;
        
        return memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;
    }

    /**
     * Obtener información de memoria
     * @returns {Object|null} Información de memoria
     * @private
     */
    getMemoryInfo() {
        return performance.memory || null;
    }

    /**
     * Obtener promedio de una métrica
     * @param {string} metric - Nombre de la métrica
     * @returns {number} Promedio
     * @private
     */
    getAverageMetric(metric) {
        const history = this.metricsHistory[metric];
        if (!history || history.length === 0) return 0;
        
        const sum = history.reduce((a, b) => a + b, 0);
        return sum / history.length;
    }

    /**
     * Bajar nivel de calidad
     * @param {string} currentQuality - Calidad actual
     * @returns {string} Calidad más baja
     * @private
     */
    lowerQuality(currentQuality) {
        const levels = ['minimal', 'low', 'medium', 'high', 'ultra'];
        const currentIndex = levels.indexOf(currentQuality);
        return currentIndex > 0 ? levels[currentIndex - 1] : currentQuality;
    }

    /**
     * Subir nivel de calidad
     * @param {string} currentQuality - Calidad actual
     * @returns {string} Calidad más alta
     * @private
     */
    higherQuality(currentQuality) {
        const levels = ['minimal', 'low', 'medium', 'high', 'ultra'];
        const currentIndex = levels.indexOf(currentQuality);
        return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : currentQuality;
    }

    /**
     * Obtener configuración de calidad actual
     * @returns {Object} Configuración de calidad
     */
    getCurrentQualityConfig() {
        return { ...this.qualityLevels[this.currentQuality] };
    }

    /**
     * Establecer calidad manualmente
     * @param {string} quality - Nivel de calidad
     */
    setQuality(quality) {
        if (this.qualityLevels[quality]) {
            this.targetQuality = quality;
            this.changeQuality(quality);
        } else {
            console.warn(`[PerformanceOptimizer] Calidad inválida: ${quality}`);
        }
    }

    /**
     * Obtener métricas actuales
     * @returns {Object} Métricas de rendimiento
     */
    getMetrics() {
        return {
            ...this.performanceMetrics,
            quality: this.currentQuality,
            targetQuality: this.targetQuality,
            averages: {
                fps: this.getAverageMetric('fps'),
                frameTime: this.getAverageMetric('frameTime'),
                memoryUsage: this.getAverageMetric('memoryUsage')
            }
        };
    }

    /**
     * Obtener historial de métricas
     * @returns {Object} Historial de métricas
     */
    getMetricsHistory() {
        return { ...this.metricsHistory };
    }

    /**
     * Actualizar métricas de renderizado
     * @param {Object} renderMetrics - Métricas de renderizado
     */
    updateRenderMetrics(renderMetrics) {
        this.performanceMetrics.renderTime = renderMetrics.renderTime || 0;
        this.performanceMetrics.updateTime = renderMetrics.updateTime || 0;
        this.performanceMetrics.totalObjects = renderMetrics.totalObjects || 0;
        this.performanceMetrics.visibleObjects = renderMetrics.visibleObjects || 0;
        this.performanceMetrics.culledObjects = renderMetrics.culledObjects || 0;
    }

    /**
     * Forzar optimización inmediata
     */
    forceOptimization() {
        console.log('[PerformanceOptimizer] Optimización forzada');
        this.optimizePerformance();
    }

    /**
     * Resetear métricas
     */
    resetMetrics() {
        this.performanceMetrics = {
            fps: 60,
            frameTime: 16.67,
            memoryUsage: 0,
            renderTime: 0,
            updateTime: 0,
            totalObjects: 0,
            visibleObjects: 0,
            culledObjects: 0
        };
        
        this.metricsHistory = {
            fps: [],
            frameTime: [],
            memoryUsage: [],
            maxHistorySize: 60
        };
        
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.fpsCalculationTime = performance.now();
        
        console.log('[PerformanceOptimizer] Métricas reseteadas');
    }

    /**
     * Obtener estadísticas del optimizador
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            isInitialized: this.isInitialized,
            isOptimizing: this.isOptimizing,
            currentQuality: this.currentQuality,
            targetQuality: this.targetQuality,
            config: { ...this.config },
            metrics: this.getMetrics(),
            qualityLevels: Object.keys(this.qualityLevels),
            memoryInfo: this.getMemoryInfo()
        };
    }

    /**
     * Destruir el optimizador
     */
    destroy() {
        // Limpiar timers
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
            this.monitoringTimer = null;
        }
        
        if (this.optimizationTimer) {
            clearInterval(this.optimizationTimer);
            this.optimizationTimer = null;
        }
        
        // Resetear estado
        this.isInitialized = false;
        this.isOptimizing = false;
        
        console.log('[PerformanceOptimizer] Destruido correctamente');
    }
}