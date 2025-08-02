/**
 * PerformanceOptimizer - Sistema avanzado de optimización de rendimiento para Spikepulse
 * @module PerformanceOptimizer
 */

import { SpanishFormatter } from './SpanishFormatter.js';
import { GarbageCollectionManager } from './GarbageCollectionManager.js';

export class PerformanceOptimizer {
    /**
     * Crea una nueva instancia del optimizador de rendimiento
     * @param {Object} config - Configuración del optimizador
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isEnabled = config.performance?.enableOptimizations || true;
        this.isInitialized = false;

        // Configuración de optimización
        this.optimizationConfig = {
            targetFPS: config.performance?.targetFPS || 60,
            memoryThreshold: config.performance?.memoryThreshold || 0.8,
            gcThreshold: config.performance?.gcThreshold || 0.9,
            adaptiveQuality: config.performance?.adaptiveQuality || true,
            aggressiveOptimization: config.performance?.aggressiveOptimization || false,
            monitoringInterval: config.performance?.monitoringInterval || 1000,
            optimizationInterval: config.performance?.optimizationInterval || 5000
        };

        // Estado del sistema
        this.systemState = {
            currentFPS: 0,
            averageFPS: 0,
            memoryUsage: 0,
            memoryPressure: 0,
            performanceLevel: 'high', // high, medium, low
            isOptimizing: false,
            lastOptimization: 0,
            optimizationCount: 0
        };

        // Métricas de rendimiento
        this.performanceMetrics = {
            frameDrops: 0,
            stutters: 0,
            gcEvents: 0,
            memoryLeaks: 0,
            optimizationsApplied: 0,
            performanceGains: 0
        };

        // Estrategias de optimización
        this.optimizationStrategies = new Map([
            ['reduce-particles', { priority: 1, impact: 'medium', cost: 'low' }],
            ['lower-quality', { priority: 2, impact: 'high', cost: 'medium' }],
            ['disable-effects', { priority: 3, impact: 'high', cost: 'high' }],
            ['reduce-obstacles', { priority: 4, impact: 'medium', cost: 'medium' }],
            ['simplify-rendering', { priority: 5, impact: 'high', cost: 'low' }],
            ['force-gc', { priority: 6, impact: 'low', cost: 'low' }],
            ['pool-cleanup', { priority: 7, impact: 'medium', cost: 'low' }],
            ['cache-cleanup', { priority: 8, impact: 'low', cost: 'low' }]
        ]);

        // Historial de rendimiento
        this.performanceHistory = {
            fps: [],
            frameTime: [],
            memory: [],
            maxHistory: 300 // 5 minutos a 1 muestra por segundo
        };

        // Detectores de problemas
        this.problemDetectors = {
            frameDropDetector: new FrameDropDetector(this.optimizationConfig.targetFPS),
            memoryLeakDetector: new MemoryLeakDetector(),
            stutterDetector: new StutterDetector(),
            performanceDegradationDetector: new PerformanceDegradationDetector()
        };

        // Gestor de garbage collection
        this.gcManager = new GarbageCollectionManager(config, eventBus);

        // Intervalos de monitoreo
        this.intervals = {
            monitoring: null,
            optimization: null,
            analysis: null
        };

        this.init();
    }

    /**
     * Inicializar el optimizador
     * @private
     */
    init() {
        if (this.isInitialized || !this.isEnabled) return;

        this.setupEventListeners();
        this.startMonitoring();
        this.startOptimizationLoop();

        this.isInitialized = true;
        console.log('[PerformanceOptimizer] Optimizador de rendimiento inicializado');
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        // Eventos de rendimiento
        this.eventBus.on('performance:update', this.onPerformanceUpdate, this);
        this.eventBus.on('performance:alert', this.onPerformanceAlert, this);
        this.eventBus.on('memory:usage-update', this.onMemoryUpdate, this);
        this.eventBus.on('memory:gc-detected', this.onGarbageCollection, this);

        // Eventos del motor
        this.eventBus.on('engine:frame-drop', this.onFrameDrop, this);
        this.eventBus.on('engine:stutter', this.onStutter, this);
        this.eventBus.on('engine:performance-degradation', this.onPerformanceDegradation, this);

        // Comandos de optimización
        this.eventBus.on('optimizer:force-optimization', this.forceOptimization, this);
        this.eventBus.on('optimizer:set-performance-level', this.setPerformanceLevel, this);
        this.eventBus.on('optimizer:toggle-adaptive', this.toggleAdaptiveQuality, this);
    }

    /**
     * Iniciar monitoreo continuo
     * @private
     */
    startMonitoring() {
        this.intervals.monitoring = setInterval(() => {
            this.analyzePerformance();
            this.detectProblems();
            this.updateSystemState();
        }, this.optimizationConfig.monitoringInterval);

        console.log('[PerformanceOptimizer] Monitoreo continuo iniciado');
    }

    /**
     * Iniciar bucle de optimización
     * @private
     */
    startOptimizationLoop() {
        this.intervals.optimization = setInterval(() => {
            if (this.shouldOptimize()) {
                this.performOptimization();
            }
        }, this.optimizationConfig.optimizationInterval);

        console.log('[PerformanceOptimizer] Bucle de optimización iniciado');
    }

    /**
     * Manejar actualización de rendimiento
     * @param {Object} data - Datos de rendimiento
     */
    onPerformanceUpdate(data) {
        this.systemState.currentFPS = data.fps?.current || data.fps || 0;
        this.systemState.averageFPS = data.fps?.average || this.systemState.averageFPS;

        // Agregar al historial
        this.addToHistory('fps', this.systemState.currentFPS);
        
        if (data.frameTime) {
            this.addToHistory('frameTime', data.frameTime.current || data.frameTime);
        }

        // Detectar problemas en tiempo real
        this.problemDetectors.frameDropDetector.update(this.systemState.currentFPS);
        this.problemDetectors.stutterDetector.update(data.frameTime?.current || 0);
    }

    /**
     * Manejar actualización de memoria
     * @param {Object} data - Datos de memoria
     */
    onMemoryUpdate(data) {
        this.systemState.memoryUsage = data.used;
        this.systemState.memoryPressure = data.usageRatio || (data.used / data.limit);

        // Agregar al historial
        this.addToHistory('memory', this.systemState.memoryUsage);

        // Detectar problemas de memoria
        this.problemDetectors.memoryLeakDetector.update(this.systemState.memoryUsage);
    }

    /**
     * Agregar datos al historial
     * @param {string} type - Tipo de dato
     * @param {number} value - Valor a agregar
     * @private
     */
    addToHistory(type, value) {
        if (!this.performanceHistory[type]) {
            this.performanceHistory[type] = [];
        }

        this.performanceHistory[type].push({
            value,
            timestamp: performance.now()
        });

        // Mantener historial limitado
        if (this.performanceHistory[type].length > this.performanceHistory.maxHistory) {
            this.performanceHistory[type].shift();
        }
    }

    /**
     * Analizar rendimiento actual
     * @private
     */
    analyzePerformance() {
        const analysis = {
            fpsStability: this.analyzeFPSStability(),
            memoryTrend: this.analyzeMemoryTrend(),
            performanceTrend: this.analyzePerformanceTrend(),
            bottlenecks: this.identifyBottlenecks()
        };

        // Emitir análisis
        this.eventBus.emit('optimizer:analysis', analysis);

        return analysis;
    }

    /**
     * Analizar estabilidad de FPS
     * @returns {Object} Análisis de estabilidad
     * @private
     */
    analyzeFPSStability() {
        const fpsHistory = this.performanceHistory.fps.slice(-60); // Último minuto
        if (fpsHistory.length < 10) return { stability: 'unknown', variance: 0 };

        const values = fpsHistory.map(h => h.value);
        const average = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / values.length;
        const standardDeviation = Math.sqrt(variance);

        let stability = 'stable';
        if (standardDeviation > 10) stability = 'unstable';
        else if (standardDeviation > 5) stability = 'moderate';

        return {
            stability,
            variance: standardDeviation,
            average,
            min: Math.min(...values),
            max: Math.max(...values)
        };
    }

    /**
     * Analizar tendencia de memoria
     * @returns {Object} Análisis de memoria
     * @private
     */
    analyzeMemoryTrend() {
        const memoryHistory = this.performanceHistory.memory.slice(-30); // Últimos 30 segundos
        if (memoryHistory.length < 5) return { trend: 'unknown', growth: 0 };

        const values = memoryHistory.map(h => h.value);
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));

        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const growth = ((secondAvg - firstAvg) / firstAvg) * 100;

        let trend = 'stable';
        if (growth > 5) trend = 'increasing';
        else if (growth < -5) trend = 'decreasing';

        return {
            trend,
            growth,
            current: values[values.length - 1],
            average: secondAvg
        };
    }

    /**
     * Analizar tendencia de rendimiento general
     * @returns {Object} Análisis de tendencia
     * @private
     */
    analyzePerformanceTrend() {
        const fpsAnalysis = this.analyzeFPSStability();
        const memoryAnalysis = this.analyzeMemoryTrend();

        let overallTrend = 'stable';
        let score = 100;

        // Penalizar por FPS inestable
        if (fpsAnalysis.stability === 'unstable') score -= 30;
        else if (fpsAnalysis.stability === 'moderate') score -= 15;

        // Penalizar por FPS bajo
        if (fpsAnalysis.average < this.optimizationConfig.targetFPS * 0.8) score -= 25;
        else if (fpsAnalysis.average < this.optimizationConfig.targetFPS * 0.9) score -= 10;

        // Penalizar por crecimiento de memoria
        if (memoryAnalysis.trend === 'increasing' && memoryAnalysis.growth > 10) score -= 20;

        // Determinar tendencia
        if (score < 60) overallTrend = 'degrading';
        else if (score < 80) overallTrend = 'declining';

        return {
            trend: overallTrend,
            score,
            fpsIssues: fpsAnalysis.stability !== 'stable',
            memoryIssues: memoryAnalysis.trend === 'increasing' && memoryAnalysis.growth > 5
        };
    }

    /**
     * Identificar cuellos de botella
     * @returns {Array} Lista de cuellos de botella detectados
     * @private
     */
    identifyBottlenecks() {
        const bottlenecks = [];

        // Cuello de botella de FPS
        if (this.systemState.currentFPS < this.optimizationConfig.targetFPS * 0.8) {
            bottlenecks.push({
                type: 'fps',
                severity: 'high',
                description: 'FPS por debajo del objetivo',
                impact: 'Experiencia de juego degradada'
            });
        }

        // Cuello de botella de memoria
        if (this.systemState.memoryPressure > this.optimizationConfig.memoryThreshold) {
            bottlenecks.push({
                type: 'memory',
                severity: this.systemState.memoryPressure > 0.9 ? 'critical' : 'high',
                description: 'Uso de memoria elevado',
                impact: 'Posibles pausas por garbage collection'
            });
        }

        // Cuello de botella de renderizado
        const frameTimeHistory = this.performanceHistory.frameTime.slice(-10);
        if (frameTimeHistory.length > 0) {
            const avgFrameTime = frameTimeHistory.reduce((sum, h) => sum + h.value, 0) / frameTimeHistory.length;
            const targetFrameTime = 1000 / this.optimizationConfig.targetFPS;
            
            if (avgFrameTime > targetFrameTime * 1.5) {
                bottlenecks.push({
                    type: 'rendering',
                    severity: 'medium',
                    description: 'Tiempo de renderizado elevado',
                    impact: 'Frames perdidos y stuttering'
                });
            }
        }

        return bottlenecks;
    }

    /**
     * Detectar problemas específicos
     * @private
     */
    detectProblems() {
        // Detectar frame drops
        if (this.problemDetectors.frameDropDetector.hasFrameDrops()) {
            this.onFrameDrop({
                severity: this.problemDetectors.frameDropDetector.getSeverity(),
                count: this.problemDetectors.frameDropDetector.getDropCount()
            });
        }

        // Detectar memory leaks
        if (this.problemDetectors.memoryLeakDetector.hasMemoryLeak()) {
            this.onMemoryLeak({
                severity: this.problemDetectors.memoryLeakDetector.getSeverity(),
                growth: this.problemDetectors.memoryLeakDetector.getGrowthRate()
            });
        }

        // Detectar stuttering
        if (this.problemDetectors.stutterDetector.hasStutter()) {
            this.onStutter({
                severity: this.problemDetectors.stutterDetector.getSeverity(),
                frequency: this.problemDetectors.stutterDetector.getFrequency()
            });
        }
    }

    /**
     * Actualizar estado del sistema
     * @private
     */
    updateSystemState() {
        // Determinar nivel de rendimiento
        const performanceTrend = this.analyzePerformanceTrend();
        
        if (performanceTrend.score >= 80) {
            this.systemState.performanceLevel = 'high';
        } else if (performanceTrend.score >= 60) {
            this.systemState.performanceLevel = 'medium';
        } else {
            this.systemState.performanceLevel = 'low';
        }

        // Emitir actualización de estado
        this.eventBus.emit('optimizer:state-update', {
            ...this.systemState,
            performanceTrend
        });
    }

    /**
     * Determinar si se debe optimizar
     * @returns {boolean} True si se debe optimizar
     * @private
     */
    shouldOptimize() {
        if (this.systemState.isOptimizing) return false;

        const now = performance.now();
        const timeSinceLastOptimization = now - this.systemState.lastOptimization;
        
        // No optimizar muy frecuentemente
        if (timeSinceLastOptimization < this.optimizationConfig.optimizationInterval) {
            return false;
        }

        // Optimizar si el rendimiento es bajo
        if (this.systemState.performanceLevel === 'low') return true;

        // Optimizar si hay alta presión de memoria
        if (this.systemState.memoryPressure > this.optimizationConfig.gcThreshold) return true;

        // Optimizar si hay muchos frame drops
        if (this.performanceMetrics.frameDrops > 10) return true;

        return false;
    }

    /**
     * Realizar optimización
     * @private
     */
    async performOptimization() {
        if (this.systemState.isOptimizing) return;

        this.systemState.isOptimizing = true;
        this.systemState.lastOptimization = performance.now();

        console.log('[PerformanceOptimizer] Iniciando optimización automática');

        try {
            const optimizationsApplied = await this.applyOptimizations();
            
            this.systemState.optimizationCount++;
            this.performanceMetrics.optimizationsApplied += optimizationsApplied.length;

            // Esperar un poco para ver el efecto
            setTimeout(() => {
                this.measureOptimizationImpact(optimizationsApplied);
            }, 2000);

            this.eventBus.emit('optimizer:optimization-completed', {
                optimizations: optimizationsApplied,
                timestamp: this.systemState.lastOptimization
            });

        } catch (error) {
            console.error('[PerformanceOptimizer] Error durante optimización:', error);
            this.eventBus.emit('optimizer:optimization-failed', { error });
        } finally {
            this.systemState.isOptimizing = false;
        }
    }

    /**
     * Aplicar optimizaciones
     * @returns {Array} Lista de optimizaciones aplicadas
     * @private
     */
    async applyOptimizations() {
        const optimizationsApplied = [];
        const bottlenecks = this.identifyBottlenecks();
        
        // Ordenar estrategias por prioridad
        const strategies = Array.from(this.optimizationStrategies.entries())
            .sort((a, b) => a[1].priority - b[1].priority);

        for (const [strategyName, strategyConfig] of strategies) {
            if (await this.shouldApplyStrategy(strategyName, bottlenecks)) {
                const success = await this.applyStrategy(strategyName);
                if (success) {
                    optimizationsApplied.push({
                        strategy: strategyName,
                        impact: strategyConfig.impact,
                        cost: strategyConfig.cost,
                        timestamp: performance.now()
                    });

                    // Si es optimización agresiva, aplicar múltiples estrategias
                    if (!this.optimizationConfig.aggressiveOptimization && strategyConfig.impact === 'high') {
                        break; // Solo aplicar una optimización de alto impacto
                    }
                }
            }
        }

        return optimizationsApplied;
    }

    /**
     * Determinar si aplicar una estrategia específica
     * @param {string} strategyName - Nombre de la estrategia
     * @param {Array} bottlenecks - Cuellos de botella detectados
     * @returns {boolean} True si se debe aplicar
     * @private
     */
    async shouldApplyStrategy(strategyName, bottlenecks) {
        switch (strategyName) {
            case 'reduce-particles':
                return bottlenecks.some(b => b.type === 'rendering' || b.type === 'fps');
            
            case 'lower-quality':
                return this.systemState.performanceLevel === 'low' && 
                       this.optimizationConfig.adaptiveQuality;
            
            case 'disable-effects':
                return bottlenecks.some(b => b.severity === 'critical');
            
            case 'reduce-obstacles':
                return bottlenecks.some(b => b.type === 'fps' && b.severity === 'high');
            
            case 'simplify-rendering':
                return bottlenecks.some(b => b.type === 'rendering');
            
            case 'force-gc':
                return this.systemState.memoryPressure > this.optimizationConfig.gcThreshold;
            
            case 'pool-cleanup':
                return this.systemState.memoryPressure > this.optimizationConfig.memoryThreshold;
            
            case 'cache-cleanup':
                return this.systemState.memoryPressure > this.optimizationConfig.memoryThreshold;
            
            default:
                return false;
        }
    }

    /**
     * Aplicar estrategia específica
     * @param {string} strategyName - Nombre de la estrategia
     * @returns {boolean} True si se aplicó exitosamente
     * @private
     */
    async applyStrategy(strategyName) {
        try {
            switch (strategyName) {
                case 'reduce-particles':
                    this.eventBus.emit('renderer:reduce-particles', { factor: 0.5 });
                    return true;
                
                case 'lower-quality':
                    this.eventBus.emit('renderer:set-quality', { level: 'medium' });
                    return true;
                
                case 'disable-effects':
                    this.eventBus.emit('renderer:disable-effects', { temporary: true });
                    return true;
                
                case 'reduce-obstacles':
                    this.eventBus.emit('world:reduce-obstacles', { factor: 0.8 });
                    return true;
                
                case 'simplify-rendering':
                    this.eventBus.emit('renderer:simplify-rendering', { level: 1 });
                    return true;
                
                case 'force-gc':
                    if (this.gcManager) {
                        this.gcManager.forceGarbageCollection();
                    } else {
                        this.eventBus.emit('memory:force-gc');
                    }
                    return true;
                
                case 'pool-cleanup':
                    this.eventBus.emit('memory:cleanup');
                    return true;
                
                case 'cache-cleanup':
                    this.eventBus.emit('memory:clear-cache', { keepEssential: true });
                    return true;
                
                default:
                    return false;
            }
        } catch (error) {
            console.error(`[PerformanceOptimizer] Error aplicando estrategia ${strategyName}:`, error);
            return false;
        }
    }

    /**
     * Medir impacto de optimizaciones
     * @param {Array} optimizations - Optimizaciones aplicadas
     * @private
     */
    measureOptimizationImpact(optimizations) {
        const beforeFPS = this.systemState.averageFPS;
        const beforeMemory = this.systemState.memoryUsage;

        // Esperar un poco más para obtener métricas estables
        setTimeout(() => {
            const afterFPS = this.systemState.averageFPS;
            const afterMemory = this.systemState.memoryUsage;

            const fpsGain = afterFPS - beforeFPS;
            const memoryReduction = beforeMemory - afterMemory;

            this.performanceMetrics.performanceGains += fpsGain;

            this.eventBus.emit('optimizer:impact-measured', {
                optimizations,
                impact: {
                    fpsGain,
                    memoryReduction,
                    beforeFPS,
                    afterFPS,
                    beforeMemory,
                    afterMemory
                }
            });

            console.log(`[PerformanceOptimizer] Impacto medido: +${fpsGain.toFixed(1)} FPS, -${SpanishFormatter.formatBytes(memoryReduction)} memoria`);
        }, 3000);
    }

    /**
     * Manejar frame drop detectado
     * @param {Object} data - Datos del frame drop
     */
    onFrameDrop(data) {
        this.performanceMetrics.frameDrops++;
        
        this.eventBus.emit('optimizer:problem-detected', {
            type: 'frame-drop',
            severity: data.severity,
            data
        });
    }

    /**
     * Manejar memory leak detectado
     * @param {Object} data - Datos del memory leak
     */
    onMemoryLeak(data) {
        this.performanceMetrics.memoryLeaks++;
        
        this.eventBus.emit('optimizer:problem-detected', {
            type: 'memory-leak',
            severity: data.severity,
            data
        });
    }

    /**
     * Manejar stutter detectado
     * @param {Object} data - Datos del stutter
     */
    onStutter(data) {
        this.performanceMetrics.stutters++;
        
        this.eventBus.emit('optimizer:problem-detected', {
            type: 'stutter',
            severity: data.severity,
            data
        });
    }

    /**
     * Manejar degradación de rendimiento
     * @param {Object} data - Datos de degradación
     */
    onPerformanceDegradation(data) {
        this.eventBus.emit('optimizer:problem-detected', {
            type: 'performance-degradation',
            severity: 'medium',
            data
        });
    }

    /**
     * Manejar alerta de rendimiento
     * @param {Object} data - Datos de la alerta
     */
    onPerformanceAlert(data) {
        // Incrementar contador de problemas según el tipo
        if (data.type === 'low-fps') {
            this.performanceMetrics.frameDrops++;
        } else if (data.type === 'high-memory') {
            this.performanceMetrics.memoryLeaks++;
        }
    }

    /**
     * Manejar detección de garbage collection
     * @param {Object} data - Datos de GC
     */
    onGarbageCollection(data) {
        this.performanceMetrics.gcEvents++;
    }

    /**
     * Forzar optimización manual
     */
    forceOptimization() {
        console.log('[PerformanceOptimizer] Optimización forzada por usuario');
        this.performOptimization();
    }

    /**
     * Establecer nivel de rendimiento
     * @param {Object} data - Datos del nivel
     */
    setPerformanceLevel(data) {
        const { level } = data;
        this.systemState.performanceLevel = level;
        
        // Aplicar configuración según el nivel
        switch (level) {
            case 'high':
                this.eventBus.emit('renderer:set-quality', { level: 'high' });
                this.eventBus.emit('renderer:enable-effects');
                break;
            case 'medium':
                this.eventBus.emit('renderer:set-quality', { level: 'medium' });
                this.eventBus.emit('renderer:reduce-effects', { factor: 0.7 });
                break;
            case 'low':
                this.eventBus.emit('renderer:set-quality', { level: 'low' });
                this.eventBus.emit('renderer:disable-effects', { keepEssential: true });
                break;
        }

        console.log(`[PerformanceOptimizer] Nivel de rendimiento establecido: ${level}`);
    }

    /**
     * Alternar calidad adaptativa
     */
    toggleAdaptiveQuality() {
        this.optimizationConfig.adaptiveQuality = !this.optimizationConfig.adaptiveQuality;
        console.log(`[PerformanceOptimizer] Calidad adaptativa: ${this.optimizationConfig.adaptiveQuality ? 'habilitada' : 'deshabilitada'}`);
    }

    /**
     * Obtener estadísticas del optimizador
     * @returns {Object} Estadísticas completas
     */
    getStats() {
        return {
            isEnabled: this.isEnabled,
            systemState: { ...this.systemState },
            metrics: { ...this.performanceMetrics },
            config: { ...this.optimizationConfig },
            analysis: this.analyzePerformance(),
            bottlenecks: this.identifyBottlenecks()
        };
    }

    /**
     * Obtener estadísticas formateadas
     * @returns {Object} Estadísticas formateadas
     */
    getFormattedStats() {
        const stats = this.getStats();
        
        return {
            nivelRendimiento: stats.systemState.performanceLevel.toUpperCase(),
            fpsActual: SpanishFormatter.formatFPS(stats.systemState.currentFPS),
            fpsPromedio: SpanishFormatter.formatFPS(stats.systemState.averageFPS),
            usoMemoria: SpanishFormatter.formatPercentage(stats.systemState.memoryPressure),
            optimizacionesAplicadas: SpanishFormatter.formatNumber(stats.metrics.optimizationsApplied),
            frameDrops: SpanishFormatter.formatNumber(stats.metrics.frameDrops),
            stutters: SpanishFormatter.formatNumber(stats.metrics.stutters),
            eventosGC: SpanishFormatter.formatNumber(stats.metrics.gcEvents),
            gananciasRendimiento: `+${SpanishFormatter.formatFPS(stats.metrics.performanceGains)}`,
            cuellosBottella: stats.bottlenecks.length
        };
    }

    /**
     * Limpiar recursos
     */
    destroy() {
        // Limpiar intervalos
        Object.values(this.intervals).forEach(interval => {
            if (interval) clearInterval(interval);
        });

        // Limpiar detectores
        Object.values(this.problemDetectors).forEach(detector => {
            if (detector.destroy) detector.destroy();
        });

        // Limpiar gestor de GC
        if (this.gcManager) {
            this.gcManager.destroy();
        }

        // Limpiar event listeners
        this.eventBus.off('performance:update', this.onPerformanceUpdate, this);
        this.eventBus.off('performance:alert', this.onPerformanceAlert, this);
        this.eventBus.off('memory:usage-update', this.onMemoryUpdate, this);
        this.eventBus.off('memory:gc-detected', this.onGarbageCollection, this);
        this.eventBus.off('engine:frame-drop', this.onFrameDrop, this);
        this.eventBus.off('engine:stutter', this.onStutter, this);
        this.eventBus.off('engine:performance-degradation', this.onPerformanceDegradation, this);

        this.isInitialized = false;
        console.log('[PerformanceOptimizer] Optimizador destruido');
    }
}

/**
 * Detector de frame drops
 */
class FrameDropDetector {
    constructor(targetFPS) {
        this.targetFPS = targetFPS;
        this.frameDrops = [];
        this.maxHistory = 60;
        this.threshold = targetFPS * 0.8;
    }

    update(currentFPS) {
        if (currentFPS < this.threshold) {
            this.frameDrops.push({
                fps: currentFPS,
                timestamp: performance.now(),
                severity: currentFPS < this.targetFPS * 0.5 ? 'critical' : 'high'
            });

            if (this.frameDrops.length > this.maxHistory) {
                this.frameDrops.shift();
            }
        }
    }

    hasFrameDrops() {
        const recentDrops = this.frameDrops.filter(
            drop => performance.now() - drop.timestamp < 5000
        );
        return recentDrops.length > 3;
    }

    getSeverity() {
        const recentDrops = this.frameDrops.filter(
            drop => performance.now() - drop.timestamp < 5000
        );
        const criticalDrops = recentDrops.filter(drop => drop.severity === 'critical');
        return criticalDrops.length > 0 ? 'critical' : 'high';
    }

    getDropCount() {
        return this.frameDrops.filter(
            drop => performance.now() - drop.timestamp < 5000
        ).length;
    }
}

/**
 * Detector de memory leaks
 */
class MemoryLeakDetector {
    constructor() {
        this.memoryHistory = [];
        this.maxHistory = 120; // 2 minutos
        this.leakThreshold = 1.5; // 50% de crecimiento
    }

    update(memoryUsage) {
        this.memoryHistory.push({
            usage: memoryUsage,
            timestamp: performance.now()
        });

        if (this.memoryHistory.length > this.maxHistory) {
            this.memoryHistory.shift();
        }
    }

    hasMemoryLeak() {
        if (this.memoryHistory.length < 20) return false;

        const recent = this.memoryHistory.slice(-10);
        const older = this.memoryHistory.slice(-30, -20);

        const recentAvg = recent.reduce((sum, h) => sum + h.usage, 0) / recent.length;
        const olderAvg = older.reduce((sum, h) => sum + h.usage, 0) / older.length;

        return (recentAvg / olderAvg) > this.leakThreshold;
    }

    getSeverity() {
        const growthRate = this.getGrowthRate();
        if (growthRate > 2) return 'critical';
        if (growthRate > 1.5) return 'high';
        return 'medium';
    }

    getGrowthRate() {
        if (this.memoryHistory.length < 20) return 0;

        const recent = this.memoryHistory.slice(-10);
        const older = this.memoryHistory.slice(-30, -20);

        const recentAvg = recent.reduce((sum, h) => sum + h.usage, 0) / recent.length;
        const olderAvg = older.reduce((sum, h) => sum + h.usage, 0) / older.length;

        return recentAvg / olderAvg;
    }
}

/**
 * Detector de stuttering
 */
class StutterDetector {
    constructor() {
        this.frameTimeHistory = [];
        this.maxHistory = 60;
        this.stutterThreshold = 50; // ms
    }

    update(frameTime) {
        this.frameTimeHistory.push({
            time: frameTime,
            timestamp: performance.now()
        });

        if (this.frameTimeHistory.length > this.maxHistory) {
            this.frameTimeHistory.shift();
        }
    }

    hasStutter() {
        const recentFrames = this.frameTimeHistory.filter(
            frame => performance.now() - frame.timestamp < 5000
        );

        const stutters = recentFrames.filter(frame => frame.time > this.stutterThreshold);
        return stutters.length > 2;
    }

    getSeverity() {
        const recentFrames = this.frameTimeHistory.filter(
            frame => performance.now() - frame.timestamp < 5000
        );

        const maxFrameTime = Math.max(...recentFrames.map(f => f.time));
        if (maxFrameTime > 100) return 'critical';
        if (maxFrameTime > 75) return 'high';
        return 'medium';
    }

    getFrequency() {
        const recentFrames = this.frameTimeHistory.filter(
            frame => performance.now() - frame.timestamp < 5000
        );

        const stutters = recentFrames.filter(frame => frame.time > this.stutterThreshold);
        return stutters.length / recentFrames.length;
    }
}

/**
 * Detector de degradación de rendimiento
 */
class PerformanceDegradationDetector {
    constructor() {
        this.performanceHistory = [];
        this.maxHistory = 300; // 5 minutos
    }

    update(performanceScore) {
        this.performanceHistory.push({
            score: performanceScore,
            timestamp: performance.now()
        });

        if (this.performanceHistory.length > this.maxHistory) {
            this.performanceHistory.shift();
        }
    }

    hasDegradation() {
        if (this.performanceHistory.length < 60) return false;

        const recent = this.performanceHistory.slice(-30);
        const older = this.performanceHistory.slice(-90, -60);

        const recentAvg = recent.reduce((sum, h) => sum + h.score, 0) / recent.length;
        const olderAvg = older.reduce((sum, h) => sum + h.score, 0) / older.length;

        return (olderAvg - recentAvg) > 15; // Degradación de 15 puntos
    }

    getSeverity() {
        const degradation = this.getDegradationAmount();
        if (degradation > 30) return 'critical';
        if (degradation > 20) return 'high';
        return 'medium';
    }

    getDegradationAmount() {
        if (this.performanceHistory.length < 60) return 0;

        const recent = this.performanceHistory.slice(-30);
        const older = this.performanceHistory.slice(-90, -60);

        const recentAvg = recent.reduce((sum, h) => sum + h.score, 0) / recent.length;
        const olderAvg = older.reduce((sum, h) => sum + h.score, 0) / older.length;

        return Math.max(0, olderAvg - recentAvg);
    }
}