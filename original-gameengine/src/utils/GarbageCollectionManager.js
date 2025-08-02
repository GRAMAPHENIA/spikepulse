/**
 * GarbageCollectionManager - Sistema avanzado de gestión de recolección de basura para Spikepulse
 * @module GarbageCollectionManager
 */

export class GarbageCollectionManager {
    /**
     * Crea una nueva instancia del gestor de recolección de basura
     * @param {Object} config - Configuración del gestor
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isEnabled = config.performance?.enableGCManagement || true;
        this.isInitialized = false;

        // Configuración de GC
        this.gcConfig = {
            memoryThreshold: config.performance?.memoryThreshold || 0.8,
            forceGCThreshold: config.performance?.gcThreshold || 0.9,
            monitoringInterval: config.performance?.gcMonitoringInterval || 5000,
            aggressiveMode: config.performance?.aggressiveGC || false,
            preventiveGC: config.performance?.preventiveGC || true
        };

        // Métricas de GC
        this.gcMetrics = {
            totalGCEvents: 0,
            forcedGCEvents: 0,
            preventiveGCEvents: 0,
            memoryFreed: 0,
            averageGCTime: 0,
            lastGCTime: 0,
            gcHistory: [],
            maxHistory: 100
        };

        // Estado del sistema
        this.systemState = {
            lastMemoryUsage: 0,
            memoryTrend: 'stable', // 'increasing', 'decreasing', 'stable'
            gcInProgress: false,
            lastGCTimestamp: 0,
            memoryPressure: 0
        };

        // Detectores de patrones
        this.patternDetectors = {
            memoryLeakDetector: new MemoryLeakDetector(),
            rapidAllocationDetector: new RapidAllocationDetector(),
            fragmentationDetector: new FragmentationDetector()
        };

        // Estrategias de GC
        this.gcStrategies = new Map([
            ['preventive', { priority: 1, threshold: 0.7, aggressive: false }],
            ['reactive', { priority: 2, threshold: 0.8, aggressive: false }],
            ['emergency', { priority: 3, threshold: 0.9, aggressive: true }],
            ['critical', { priority: 4, threshold: 0.95, aggressive: true }]
        ]);

        // Intervalos y timers
        this.monitoringInterval = null;
        this.gcScheduler = null;

        this.init();
    }

    /**
     * Inicializar el gestor de GC
     * @private
     */
    init() {
        if (this.isInitialized || !this.isEnabled) return;

        this.setupEventListeners();
        this.startMonitoring();
        this.schedulePreventiveGC();

        this.isInitialized = true;
        console.log('[GarbageCollectionManager] Gestor de GC inicializado');
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        // Eventos de memoria
        this.eventBus.on('memory:usage-update', this.onMemoryUpdate, this);
        this.eventBus.on('memory:pressure-high', this.onHighMemoryPressure, this);
        this.eventBus.on('memory:leak-detected', this.onMemoryLeakDetected, this);

        // Comandos de GC
        this.eventBus.on('memory:force-gc', this.forceGarbageCollection, this);
        this.eventBus.on('gc:schedule', this.scheduleGarbageCollection, this);
        this.eventBus.on('gc:configure', this.configure, this);

        // Eventos del motor
        this.eventBus.on('engine:low-performance', this.onLowPerformance, this);
        this.eventBus.on('engine:memory-warning', this.onMemoryWarning, this);
    }

    /**
     * Iniciar monitoreo de memoria
     * @private
     */
    startMonitoring() {
        this.monitoringInterval = setInterval(() => {
            this.monitorMemoryUsage();
            this.analyzeMemoryPatterns();
            this.evaluateGCNeed();
        }, this.gcConfig.monitoringInterval);

        console.log('[GarbageCollectionManager] Monitoreo de memoria iniciado');
    }

    /**
     * Programar GC preventivo
     * @private
     */
    schedulePreventiveGC() {
        if (!this.gcConfig.preventiveGC) return;

        // GC preventivo cada 2 minutos
        this.gcScheduler = setInterval(() => {
            if (this.shouldPerformPreventiveGC()) {
                this.performPreventiveGC();
            }
        }, 120000);

        console.log('[GarbageCollectionManager] GC preventivo programado');
    }

    /**
     * Monitorear uso de memoria
     * @private
     */
    monitorMemoryUsage() {
        if (!performance.memory) return;

        const memInfo = performance.memory;
        const currentUsage = memInfo.usedJSHeapSize;
        const memoryLimit = memInfo.jsHeapSizeLimit;
        const usageRatio = currentUsage / memoryLimit;

        // Actualizar estado del sistema
        this.updateSystemState(currentUsage, usageRatio);

        // Emitir evento de actualización
        this.eventBus.emit('gc:memory-monitored', {
            used: currentUsage,
            limit: memoryLimit,
            usageRatio,
            trend: this.systemState.memoryTrend,
            pressure: this.systemState.memoryPressure
        });
    }

    /**
     * Actualizar estado del sistema
     * @param {number} currentUsage - Uso actual de memoria
     * @param {number} usageRatio - Ratio de uso de memoria
     * @private
     */
    updateSystemState(currentUsage, usageRatio) {
        // Calcular tendencia de memoria
        if (this.systemState.lastMemoryUsage > 0) {
            const memoryDelta = currentUsage - this.systemState.lastMemoryUsage;
            const deltaRatio = memoryDelta / this.systemState.lastMemoryUsage;

            if (deltaRatio > 0.05) {
                this.systemState.memoryTrend = 'increasing';
            } else if (deltaRatio < -0.05) {
                this.systemState.memoryTrend = 'decreasing';
            } else {
                this.systemState.memoryTrend = 'stable';
            }
        }

        this.systemState.lastMemoryUsage = currentUsage;
        this.systemState.memoryPressure = usageRatio;
    }

    /**
     * Analizar patrones de memoria
     * @private
     */
    analyzeMemoryPatterns() {
        const memoryData = {
            usage: this.systemState.lastMemoryUsage,
            trend: this.systemState.memoryTrend,
            pressure: this.systemState.memoryPressure,
            timestamp: Date.now()
        };

        // Detectar memory leaks
        if (this.patternDetectors.memoryLeakDetector.analyze(memoryData)) {
            this.eventBus.emit('gc:memory-leak-detected', {
                severity: 'high',
                pattern: 'continuous-growth',
                recommendation: 'immediate-gc'
            });
        }

        // Detectar asignaciones rápidas
        if (this.patternDetectors.rapidAllocationDetector.analyze(memoryData)) {
            this.eventBus.emit('gc:rapid-allocation-detected', {
                severity: 'medium',
                pattern: 'burst-allocation',
                recommendation: 'scheduled-gc'
            });
        }

        // Detectar fragmentación
        if (this.patternDetectors.fragmentationDetector.analyze(memoryData)) {
            this.eventBus.emit('gc:fragmentation-detected', {
                severity: 'medium',
                pattern: 'memory-fragmentation',
                recommendation: 'defragmentation-gc'
            });
        }
    }

    /**
     * Evaluar necesidad de GC
     * @private
     */
    evaluateGCNeed() {
        const usageRatio = this.systemState.memoryPressure;
        
        // Determinar estrategia de GC
        let recommendedStrategy = null;
        
        for (const [strategyName, config] of this.gcStrategies.entries()) {
            if (usageRatio >= config.threshold) {
                recommendedStrategy = { name: strategyName, config };
            }
        }

        if (recommendedStrategy) {
            this.executeGCStrategy(recommendedStrategy);
        }
    }

    /**
     * Ejecutar estrategia de GC
     * @param {Object} strategy - Estrategia a ejecutar
     * @private
     */
    executeGCStrategy(strategy) {
        const { name, config } = strategy;
        
        console.log(`[GarbageCollectionManager] Ejecutando estrategia: ${name}`);
        
        switch (name) {
            case 'preventive':
                this.performPreventiveGC();
                break;
            case 'reactive':
                this.performReactiveGC();
                break;
            case 'emergency':
                this.performEmergencyGC();
                break;
            case 'critical':
                this.performCriticalGC();
                break;
        }
    }

    /**
     * Determinar si se debe realizar GC preventivo
     * @returns {boolean} True si se debe realizar
     * @private
     */
    shouldPerformPreventiveGC() {
        const timeSinceLastGC = Date.now() - this.systemState.lastGCTimestamp;
        const memoryPressure = this.systemState.memoryPressure;
        
        // GC preventivo si ha pasado tiempo suficiente y hay presión moderada
        return timeSinceLastGC > 120000 && // 2 minutos
               memoryPressure > 0.6 && 
               this.systemState.memoryTrend === 'increasing';
    }

    /**
     * Realizar GC preventivo
     * @private
     */
    performPreventiveGC() {
        if (this.systemState.gcInProgress) return;

        console.log('[GarbageCollectionManager] Ejecutando GC preventivo');
        this.executeGarbageCollection('preventive', false);
        this.gcMetrics.preventiveGCEvents++;
    }

    /**
     * Realizar GC reactivo
     * @private
     */
    performReactiveGC() {
        if (this.systemState.gcInProgress) return;

        console.log('[GarbageCollectionManager] Ejecutando GC reactivo');
        this.executeGarbageCollection('reactive', false);
    }

    /**
     * Realizar GC de emergencia
     * @private
     */
    performEmergencyGC() {
        console.log('[GarbageCollectionManager] Ejecutando GC de emergencia');
        this.executeGarbageCollection('emergency', true);
    }

    /**
     * Realizar GC crítico
     * @private
     */
    performCriticalGC() {
        console.log('[GarbageCollectionManager] Ejecutando GC crítico');
        this.executeGarbageCollection('critical', true);
    }

    /**
     * Ejecutar recolección de basura
     * @param {string} type - Tipo de GC
     * @param {boolean} aggressive - Modo agresivo
     * @private
     */
    executeGarbageCollection(type, aggressive = false) {
        if (this.systemState.gcInProgress) {
            console.warn('[GarbageCollectionManager] GC ya en progreso');
            return;
        }

        this.systemState.gcInProgress = true;
        const startTime = performance.now();
        const memoryBefore = performance.memory?.usedJSHeapSize || 0;

        try {
            // Estrategia de GC agresiva
            if (aggressive || this.gcConfig.aggressiveMode) {
                this.performAggressiveGC();
            } else {
                this.performStandardGC();
            }

            // Medir resultados
            const endTime = performance.now();
            const memoryAfter = performance.memory?.usedJSHeapSize || 0;
            const gcTime = endTime - startTime;
            const memoryFreed = Math.max(0, memoryBefore - memoryAfter);

            // Actualizar métricas
            this.updateGCMetrics(type, gcTime, memoryFreed);

            // Emitir evento de GC completado
            this.eventBus.emit('gc:completed', {
                type,
                aggressive,
                gcTime,
                memoryFreed,
                memoryBefore,
                memoryAfter,
                timestamp: Date.now()
            });

            console.log(`[GarbageCollectionManager] GC ${type} completado: ${this.formatBytes(memoryFreed)} liberados en ${gcTime.toFixed(2)}ms`);

        } catch (error) {
            console.error('[GarbageCollectionManager] Error durante GC:', error);
            this.eventBus.emit('gc:error', { type, error });
        } finally {
            this.systemState.gcInProgress = false;
            this.systemState.lastGCTimestamp = Date.now();
        }
    }

    /**
     * Realizar GC estándar
     * @private
     */
    performStandardGC() {
        // Crear presión de memoria temporal para sugerir GC
        const tempObjects = [];
        
        // Crear objetos temporales grandes
        for (let i = 0; i < 10; i++) {
            tempObjects.push({
                largeArray: new Array(1000).fill(Math.random()),
                timestamp: Date.now(),
                id: i
            });
        }

        // Crear referencias circulares temporales
        for (let i = 0; i < tempObjects.length - 1; i++) {
            tempObjects[i].next = tempObjects[i + 1];
            tempObjects[i + 1].prev = tempObjects[i];
        }

        // Limpiar referencias
        tempObjects.forEach(obj => {
            obj.largeArray = null;
            obj.next = null;
            obj.prev = null;
        });
        tempObjects.length = 0;

        // Usar FinalizationRegistry si está disponible
        if (typeof FinalizationRegistry !== 'undefined') {
            const registry = new FinalizationRegistry((heldValue) => {
                console.log(`[GarbageCollectionManager] Objeto finalizado: ${heldValue}`);
            });
            
            const tempObj = { id: 'gc-trigger-' + Date.now() };
            registry.register(tempObj, 'standard-gc');
        }
    }

    /**
     * Realizar GC agresivo
     * @private
     */
    performAggressiveGC() {
        // Estrategia más agresiva
        const tempObjects = [];
        
        // Crear más objetos temporales
        for (let i = 0; i < 50; i++) {
            tempObjects.push({
                largeArray: new Array(5000).fill(Math.random()),
                nestedObject: {
                    data: new Array(1000).fill({ value: Math.random() }),
                    timestamp: Date.now()
                },
                id: i
            });
        }

        // Crear múltiples referencias circulares
        for (let i = 0; i < tempObjects.length; i++) {
            const next = (i + 1) % tempObjects.length;
            const prev = (i - 1 + tempObjects.length) % tempObjects.length;
            
            tempObjects[i].next = tempObjects[next];
            tempObjects[i].prev = tempObjects[prev];
            tempObjects[i].circular = tempObjects[i];
        }

        // Forzar múltiples ciclos de limpieza
        for (let cycle = 0; cycle < 3; cycle++) {
            tempObjects.forEach(obj => {
                if (obj.largeArray) obj.largeArray = null;
                if (obj.nestedObject) obj.nestedObject = null;
                if (obj.next) obj.next = null;
                if (obj.prev) obj.prev = null;
                if (obj.circular) obj.circular = null;
            });
            
            // Crear nuevos objetos temporales para forzar GC
            const cycleObjects = new Array(1000).fill(null).map(() => ({
                data: Math.random(),
                timestamp: Date.now()
            }));
            cycleObjects.length = 0;
        }

        tempObjects.length = 0;
    }

    /**
     * Actualizar métricas de GC
     * @param {string} type - Tipo de GC
     * @param {number} gcTime - Tiempo de GC
     * @param {number} memoryFreed - Memoria liberada
     * @private
     */
    updateGCMetrics(type, gcTime, memoryFreed) {
        this.gcMetrics.totalGCEvents++;
        this.gcMetrics.memoryFreed += memoryFreed;
        this.gcMetrics.lastGCTime = gcTime;

        // Calcular promedio de tiempo de GC
        const totalTime = this.gcMetrics.averageGCTime * (this.gcMetrics.totalGCEvents - 1) + gcTime;
        this.gcMetrics.averageGCTime = totalTime / this.gcMetrics.totalGCEvents;

        // Agregar al historial
        this.gcMetrics.gcHistory.push({
            type,
            gcTime,
            memoryFreed,
            timestamp: Date.now()
        });

        // Mantener historial limitado
        if (this.gcMetrics.gcHistory.length > this.gcMetrics.maxHistory) {
            this.gcMetrics.gcHistory.shift();
        }
    }

    /**
     * Manejar actualización de memoria
     * @param {Object} data - Datos de memoria
     */
    onMemoryUpdate(data) {
        // El monitoreo se maneja en el bucle principal
    }

    /**
     * Manejar alta presión de memoria
     * @param {Object} data - Datos de presión
     */
    onHighMemoryPressure(data) {
        console.warn('[GarbageCollectionManager] Alta presión de memoria detectada');
        this.performEmergencyGC();
    }

    /**
     * Manejar detección de memory leak
     * @param {Object} data - Datos del leak
     */
    onMemoryLeakDetected(data) {
        console.error('[GarbageCollectionManager] Memory leak detectado');
        this.performCriticalGC();
    }

    /**
     * Manejar bajo rendimiento
     * @param {Object} data - Datos de rendimiento
     */
    onLowPerformance(data) {
        if (this.systemState.memoryPressure > 0.7) {
            console.log('[GarbageCollectionManager] Bajo rendimiento + alta memoria = GC reactivo');
            this.performReactiveGC();
        }
    }

    /**
     * Manejar advertencia de memoria
     * @param {Object} data - Datos de advertencia
     */
    onMemoryWarning(data) {
        console.warn('[GarbageCollectionManager] Advertencia de memoria');
        this.performEmergencyGC();
    }

    /**
     * Forzar recolección de basura (comando)
     */
    forceGarbageCollection() {
        console.log('[GarbageCollectionManager] GC forzado por comando');
        this.executeGarbageCollection('forced', true);
        this.gcMetrics.forcedGCEvents++;
    }

    /**
     * Programar recolección de basura
     * @param {Object} data - Datos de programación
     */
    scheduleGarbageCollection(data) {
        const { delay = 1000, type = 'scheduled', aggressive = false } = data;
        
        setTimeout(() => {
            this.executeGarbageCollection(type, aggressive);
        }, delay);
        
        console.log(`[GarbageCollectionManager] GC programado en ${delay}ms`);
    }

    /**
     * Configurar gestor de GC
     * @param {Object} newConfig - Nueva configuración
     */
    configure(newConfig) {
        this.gcConfig = { ...this.gcConfig, ...newConfig };
        console.log('[GarbageCollectionManager] Configuración actualizada:', this.gcConfig);
    }

    /**
     * Obtener estadísticas de GC
     * @returns {Object} Estadísticas de GC
     */
    getStats() {
        return {
            isEnabled: this.isEnabled,
            config: { ...this.gcConfig },
            metrics: { ...this.gcMetrics },
            systemState: { ...this.systemState },
            memoryInfo: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null
        };
    }

    /**
     * Obtener estadísticas formateadas
     * @returns {Object} Estadísticas formateadas
     */
    getFormattedStats() {
        const stats = this.getStats();
        
        return {
            eventosGCTotal: stats.metrics.totalGCEvents.toLocaleString('es-ES'),
            gcForzados: stats.metrics.forcedGCEvents.toLocaleString('es-ES'),
            gcPreventivos: stats.metrics.preventiveGCEvents.toLocaleString('es-ES'),
            memoriaLiberada: this.formatBytes(stats.metrics.memoryFreed),
            tiempoPromedioGC: `${stats.metrics.averageGCTime.toFixed(2)}ms`,
            ultimoGC: `${stats.metrics.lastGCTime.toFixed(2)}ms`,
            tendenciaMemoria: this.formatTrend(stats.systemState.memoryTrend),
            presionMemoria: `${(stats.systemState.memoryPressure * 100).toFixed(1)}%`,
            usoMemoria: stats.memoryInfo ? 
                `${this.formatBytes(stats.memoryInfo.used)} / ${this.formatBytes(stats.memoryInfo.limit)}` : 
                'No disponible'
        };
    }

    /**
     * Formatear bytes
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
     * Formatear tendencia
     * @param {string} trend - Tendencia
     * @returns {string} Tendencia formateada
     * @private
     */
    formatTrend(trend) {
        const trends = {
            'increasing': 'Creciente ↗',
            'decreasing': 'Decreciente ↘',
            'stable': 'Estable →'
        };
        return trends[trend] || trend;
    }

    /**
     * Limpiar recursos
     */
    destroy() {
        // Limpiar intervalos
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        if (this.gcScheduler) {
            clearInterval(this.gcScheduler);
        }

        // Limpiar detectores
        Object.values(this.patternDetectors).forEach(detector => {
            if (detector.destroy) detector.destroy();
        });

        // Limpiar event listeners
        this.eventBus.off('memory:usage-update', this.onMemoryUpdate, this);
        this.eventBus.off('memory:pressure-high', this.onHighMemoryPressure, this);
        this.eventBus.off('memory:leak-detected', this.onMemoryLeakDetected, this);
        this.eventBus.off('memory:force-gc', this.forceGarbageCollection, this);
        this.eventBus.off('gc:schedule', this.scheduleGarbageCollection, this);
        this.eventBus.off('gc:configure', this.configure, this);
        this.eventBus.off('engine:low-performance', this.onLowPerformance, this);
        this.eventBus.off('engine:memory-warning', this.onMemoryWarning, this);

        this.isInitialized = false;
        console.log('[GarbageCollectionManager] Gestor destruido');
    }
}

/**
 * Detector de memory leaks
 */
class MemoryLeakDetector {
    constructor() {
        this.memoryHistory = [];
        this.maxHistory = 20;
        this.leakThreshold = 0.1; // 10% de crecimiento sostenido
    }

    analyze(memoryData) {
        this.memoryHistory.push(memoryData);
        
        if (this.memoryHistory.length > this.maxHistory) {
            this.memoryHistory.shift();
        }

        if (this.memoryHistory.length < 10) return false;

        // Detectar crecimiento sostenido
        const recent = this.memoryHistory.slice(-10);
        const growthRate = (recent[recent.length - 1].usage - recent[0].usage) / recent[0].usage;
        
        return growthRate > this.leakThreshold;
    }

    destroy() {
        this.memoryHistory = [];
    }
}

/**
 * Detector de asignaciones rápidas
 */
class RapidAllocationDetector {
    constructor() {
        this.allocationHistory = [];
        this.maxHistory = 10;
        this.rapidThreshold = 0.2; // 20% de crecimiento en poco tiempo
    }

    analyze(memoryData) {
        this.allocationHistory.push(memoryData);
        
        if (this.allocationHistory.length > this.maxHistory) {
            this.allocationHistory.shift();
        }

        if (this.allocationHistory.length < 3) return false;

        // Detectar crecimiento rápido en los últimos 3 puntos
        const recent = this.allocationHistory.slice(-3);
        const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp;
        const growthRate = (recent[recent.length - 1].usage - recent[0].usage) / recent[0].usage;
        
        // Crecimiento rápido en menos de 15 segundos
        return timeSpan < 15000 && growthRate > this.rapidThreshold;
    }

    destroy() {
        this.allocationHistory = [];
    }
}

/**
 * Detector de fragmentación
 */
class FragmentationDetector {
    constructor() {
        this.fragmentationHistory = [];
        this.maxHistory = 15;
    }

    analyze(memoryData) {
        // Simular detección de fragmentación basada en patrones de uso
        const fragmentationScore = this.calculateFragmentationScore(memoryData);
        
        this.fragmentationHistory.push({
            score: fragmentationScore,
            timestamp: memoryData.timestamp
        });
        
        if (this.fragmentationHistory.length > this.maxHistory) {
            this.fragmentationHistory.shift();
        }

        // Detectar fragmentación alta sostenida
        if (this.fragmentationHistory.length < 5) return false;
        
        const averageScore = this.fragmentationHistory.reduce((sum, item) => sum + item.score, 0) / this.fragmentationHistory.length;
        return averageScore > 0.7;
    }

    calculateFragmentationScore(memoryData) {
        // Heurística simple para calcular fragmentación
        // En un entorno real, esto sería más complejo
        const usageVariation = Math.abs(memoryData.pressure - 0.5) * 2;
        const trendPenalty = memoryData.trend === 'increasing' ? 0.2 : 0;
        
        return Math.min(1, usageVariation + trendPenalty);
    }

    destroy() {
        this.fragmentationHistory = [];
    }
}