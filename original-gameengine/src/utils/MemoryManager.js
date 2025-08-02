/**
 * MemoryManager - Sistema de gestión de memoria y optimización para Spikepulse
 * @module MemoryManager
 */

export class MemoryManager {
    /**
     * Crea una nueva instancia del gestor de memoria
     * @param {Object} config - Configuración del gestor
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isEnabled = config.performance?.enableObjectPooling || true;
        this.isInitialized = false;

        // Pools de objetos reutilizables
        this.objectPools = new Map();

        // Cache de recursos
        this.resourceCache = new Map();
        this.maxCacheSize = config.performance?.maxCacheSize || 50;

        // Métricas de memoria
        this.metrics = {
            poolHits: 0,
            poolMisses: 0,
            cacheHits: 0,
            cacheMisses: 0,
            objectsPooled: 0,
            objectsReused: 0,
            memoryFreed: 0,
            gcTriggered: 0
        };

        // Configuración de limpieza automática
        this.cleanup = {
            interval: config.performance?.cleanupInterval || 30000, // 30 segundos
            threshold: config.performance?.memoryThreshold || 0.8, // 80% de memoria
            enabled: true,
            lastCleanup: 0
        };

        // Referencias débiles para objetos temporales
        this.weakRefs = new Set();

        // Observador de memoria
        this.memoryObserver = null;
        this.memoryCheckInterval = null;

        this.init();
    }

    /**
     * Inicializar el gestor de memoria
     * @private
     */
    init() {
        if (this.isInitialized || !this.isEnabled) return;

        this.setupEventListeners();
        this.createDefaultPools();
        this.startMemoryMonitoring();
        this.scheduleCleanup();

        this.isInitialized = true;
        console.log('[MemoryManager] Gestor de memoria inicializado');
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        // Eventos de solicitud de objetos
        this.eventBus.on('memory:request-object', this.requestObject, this);
        this.eventBus.on('memory:return-object', this.returnObject, this);
        
        // Eventos de cache
        this.eventBus.on('memory:cache-resource', this.cacheResource, this);
        this.eventBus.on('memory:get-cached', this.getCachedResource, this);
        
        // Eventos de limpieza
        this.eventBus.on('memory:cleanup', this.performCleanup, this);
        this.eventBus.on('memory:force-gc', this.forceGarbageCollection, this);
        
        // Eventos de configuración
        this.eventBus.on('memory:configure', this.configure, this);
        this.eventBus.on('memory:get-stats', this.getStats, this);
    }

    /**
     * Crear pools por defecto para objetos comunes
     * @private
     */
    createDefaultPools() {
        // Pool para vectores 2D
        this.createPool('Vector2D', 
            () => ({ x: 0, y: 0 }),
            (obj) => { obj.x = 0; obj.y = 0; },
            50
        );

        // Pool para rectángulos de colisión
        this.createPool('Rectangle',
            () => ({ x: 0, y: 0, width: 0, height: 0 }),
            (obj) => { obj.x = 0; obj.y = 0; obj.width = 0; obj.height = 0; },
            30
        );

        // Pool para partículas
        this.createPool('Particle',
            () => ({
                x: 0, y: 0, vx: 0, vy: 0,
                life: 0, maxLife: 0,
                color: '#FFFFFF', size: 1,
                alpha: 1, rotation: 0
            }),
            (obj) => {
                obj.x = 0; obj.y = 0; obj.vx = 0; obj.vy = 0;
                obj.life = 0; obj.maxLife = 0;
                obj.color = '#FFFFFF'; obj.size = 1;
                obj.alpha = 1; obj.rotation = 0;
            },
            100
        );

        // Pool para obstáculos
        this.createPool('Obstacle',
            () => ({
                x: 0, y: 0, width: 0, height: 0,
                type: 'spike', color: '#E53E3E',
                isActive: false, hitbox: null
            }),
            (obj) => {
                obj.x = 0; obj.y = 0; obj.width = 0; obj.height = 0;
                obj.type = 'spike'; obj.color = '#E53E3E';
                obj.isActive = false; obj.hitbox = null;
            },
            20
        );

        // Pool para efectos visuales
        this.createPool('Effect',
            () => ({
                x: 0, y: 0, type: 'glow',
                duration: 0, elapsed: 0,
                properties: {}, isActive: false
            }),
            (obj) => {
                obj.x = 0; obj.y = 0; obj.type = 'glow';
                obj.duration = 0; obj.elapsed = 0;
                obj.properties = {}; obj.isActive = false;
            },
            25
        );

        console.log('[MemoryManager] Pools por defecto creados');
    }

    /**
     * Crear un nuevo pool de objetos
     * @param {string} type - Tipo de objeto
     * @param {Function} createFn - Función para crear objetos
     * @param {Function} resetFn - Función para resetear objetos
     * @param {number} initialSize - Tamaño inicial del pool
     */
    createPool(type, createFn, resetFn, initialSize = 10) {
        if (this.objectPools.has(type)) {
            console.warn(`[MemoryManager] Pool ${type} ya existe`);
            return;
        }

        const pool = {
            available: [],
            inUse: new Set(),
            createFn,
            resetFn,
            totalCreated: 0,
            totalReused: 0,
            maxSize: initialSize * 3 // Límite máximo del pool
        };

        // Pre-llenar el pool
        for (let i = 0; i < initialSize; i++) {
            const obj = createFn();
            obj._poolType = type;
            obj._poolId = pool.totalCreated++;
            pool.available.push(obj);
        }

        this.objectPools.set(type, pool);
        this.metrics.objectsPooled += initialSize;

        console.log(`[MemoryManager] Pool creado: ${type} (${initialSize} objetos)`);
    }

    /**
     * Obtener objeto del pool
     * @param {string} type - Tipo de objeto
     * @returns {Object|null} Objeto del pool o null si no existe
     */
    getFromPool(type) {
        const pool = this.objectPools.get(type);
        if (!pool) {
            this.metrics.poolMisses++;
            return null;
        }

        let obj;
        if (pool.available.length > 0) {
            obj = pool.available.pop();
            this.metrics.poolHits++;
            pool.totalReused++;
            this.metrics.objectsReused++;
        } else {
            // Crear nuevo objeto si el pool está vacío
            obj = pool.createFn();
            obj._poolType = type;
            obj._poolId = pool.totalCreated++;
            this.metrics.poolMisses++;
        }

        pool.inUse.add(obj);
        return obj;
    }

    /**
     * Devolver objeto al pool
     * @param {Object} obj - Objeto a devolver
     */
    returnToPool(obj) {
        if (!obj || !obj._poolType) {
            console.warn('[MemoryManager] Objeto no válido para pool');
            return;
        }

        const pool = this.objectPools.get(obj._poolType);
        if (!pool || !pool.inUse.has(obj)) {
            console.warn(`[MemoryManager] Objeto no pertenece al pool ${obj._poolType}`);
            return;
        }

        // Resetear objeto
        pool.resetFn(obj);
        
        // Mover de inUse a available
        pool.inUse.delete(obj);
        
        // Verificar límite del pool
        if (pool.available.length < pool.maxSize) {
            pool.available.push(obj);
        } else {
            // Pool lleno, permitir que el objeto sea recolectado por GC
            this.metrics.memoryFreed++;
        }
    }

    /**
     * Solicitar objeto (evento)
     * @param {Object} data - Datos de la solicitud
     */
    requestObject(data) {
        const { type, callback } = data;
        const obj = this.getFromPool(type);
        
        if (callback && typeof callback === 'function') {
            callback(obj);
        }

        this.eventBus.emit('memory:object-provided', { type, object: obj });
    }

    /**
     * Devolver objeto (evento)
     * @param {Object} data - Datos del objeto
     */
    returnObject(data) {
        const { object } = data;
        this.returnToPool(object);
    }

    /**
     * Cachear recurso
     * @param {string} key - Clave del recurso
     * @param {*} resource - Recurso a cachear
     * @param {number} ttl - Tiempo de vida en ms (opcional)
     */
    cacheResource(key, resource, ttl = null) {
        // Verificar límite de cache
        if (this.resourceCache.size >= this.maxCacheSize) {
            this.evictOldestCacheEntry();
        }

        const cacheEntry = {
            resource,
            timestamp: Date.now(),
            ttl,
            accessCount: 0,
            lastAccess: Date.now()
        };

        this.resourceCache.set(key, cacheEntry);
        console.log(`[MemoryManager] Recurso cacheado: ${key}`);
    }

    /**
     * Obtener recurso del cache
     * @param {string} key - Clave del recurso
     * @returns {*} Recurso cacheado o null
     */
    getCachedResource(key) {
        const entry = this.resourceCache.get(key);
        
        if (!entry) {
            this.metrics.cacheMisses++;
            return null;
        }

        // Verificar TTL
        if (entry.ttl && (Date.now() - entry.timestamp) > entry.ttl) {
            this.resourceCache.delete(key);
            this.metrics.cacheMisses++;
            return null;
        }

        // Actualizar estadísticas de acceso
        entry.accessCount++;
        entry.lastAccess = Date.now();
        this.metrics.cacheHits++;

        return entry.resource;
    }

    /**
     * Eliminar entrada más antigua del cache
     * @private
     */
    evictOldestCacheEntry() {
        let oldestKey = null;
        let oldestTime = Date.now();

        for (const [key, entry] of this.resourceCache.entries()) {
            if (entry.lastAccess < oldestTime) {
                oldestTime = entry.lastAccess;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.resourceCache.delete(oldestKey);
            console.log(`[MemoryManager] Entrada de cache eliminada: ${oldestKey}`);
        }
    }

    /**
     * Iniciar monitoreo de memoria
     * @private
     */
    startMemoryMonitoring() {
        if (!performance.memory) {
            console.warn('[MemoryManager] API de memoria no disponible');
            return;
        }

        this.memoryCheckInterval = setInterval(() => {
            this.checkMemoryUsage();
        }, 5000); // Verificar cada 5 segundos

        console.log('[MemoryManager] Monitoreo de memoria iniciado');
    }

    /**
     * Verificar uso de memoria
     * @private
     */
    checkMemoryUsage() {
        if (!performance.memory) return;

        const memInfo = performance.memory;
        const usageRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;

        if (usageRatio > this.cleanup.threshold) {
            console.warn(`[MemoryManager] Uso de memoria alto: ${(usageRatio * 100).toFixed(1)}%`);
            this.performCleanup();
        }

        // Emitir estadísticas de memoria
        this.eventBus.emit('memory:usage-update', {
            used: memInfo.usedJSHeapSize,
            total: memInfo.totalJSHeapSize,
            limit: memInfo.jsHeapSizeLimit,
            usageRatio: usageRatio
        });
    }

    /**
     * Programar limpieza automática
     * @private
     */
    scheduleCleanup() {
        if (!this.cleanup.enabled) return;

        setInterval(() => {
            this.performCleanup();
        }, this.cleanup.interval);

        console.log(`[MemoryManager] Limpieza automática programada cada ${this.cleanup.interval}ms`);
    }

    /**
     * Realizar limpieza de memoria
     */
    performCleanup() {
        const startTime = performance.now();
        let itemsCleaned = 0;

        // Limpiar cache expirado
        itemsCleaned += this.cleanExpiredCache();

        // Limpiar pools excesivos
        itemsCleaned += this.cleanExcessivePools();

        // Limpiar referencias débiles
        itemsCleaned += this.cleanWeakReferences();

        // Limpiar recursos no utilizados
        itemsCleaned += this.cleanUnusedResources();

        const cleanupTime = performance.now() - startTime;
        this.cleanup.lastCleanup = Date.now();

        console.log(`[MemoryManager] Limpieza completada: ${itemsCleaned} elementos en ${cleanupTime.toFixed(2)}ms`);
        
        this.eventBus.emit('memory:cleanup-completed', {
            itemsCleaned,
            cleanupTime,
            timestamp: this.cleanup.lastCleanup
        });

        // Sugerir garbage collection si es necesario
        if (itemsCleaned > 50) {
            this.suggestGarbageCollection();
        }
    }

    /**
     * Limpiar cache expirado
     * @returns {number} Número de elementos limpiados
     * @private
     */
    cleanExpiredCache() {
        let cleaned = 0;
        const now = Date.now();

        for (const [key, entry] of this.resourceCache.entries()) {
            if (entry.ttl && (now - entry.timestamp) > entry.ttl) {
                this.resourceCache.delete(key);
                cleaned++;
            }
        }

        return cleaned;
    }

    /**
     * Limpiar pools excesivos
     * @returns {number} Número de elementos limpiados
     * @private
     */
    cleanExcessivePools() {
        let cleaned = 0;

        for (const [type, pool] of this.objectPools.entries()) {
            // Reducir pools que tienen demasiados objetos disponibles
            const targetSize = Math.floor(pool.maxSize * 0.7);
            
            while (pool.available.length > targetSize) {
                pool.available.pop();
                cleaned++;
            }
        }

        return cleaned;
    }

    /**
     * Limpiar referencias débiles
     * @returns {number} Número de elementos limpiados
     * @private
     */
    cleanWeakReferences() {
        let cleaned = 0;
        const validRefs = new Set();

        for (const ref of this.weakRefs) {
            if (ref.deref()) {
                validRefs.add(ref);
            } else {
                cleaned++;
            }
        }

        this.weakRefs = validRefs;
        return cleaned;
    }

    /**
     * Limpiar recursos no utilizados
     * @returns {number} Número de elementos limpiados
     * @private
     */
    cleanUnusedResources() {
        let cleaned = 0;
        const now = Date.now();
        const unusedThreshold = 300000; // 5 minutos

        for (const [key, entry] of this.resourceCache.entries()) {
            if ((now - entry.lastAccess) > unusedThreshold && entry.accessCount < 2) {
                this.resourceCache.delete(key);
                cleaned++;
            }
        }

        return cleaned;
    }

    /**
     * Sugerir recolección de basura
     * @private
     */
    suggestGarbageCollection() {
        // Estrategia más agresiva para sugerir GC
        const tempObjects = [];
        
        // Crear objetos temporales grandes
        for (let i = 0; i < 20; i++) {
            tempObjects.push({
                largeArray: new Array(5000).fill(Math.random()),
                nestedObject: {
                    data: new Array(1000).fill({ value: Math.random() }),
                    timestamp: Date.now()
                }
            });
        }

        // Forzar referencias circulares temporales
        for (let i = 0; i < tempObjects.length - 1; i++) {
            tempObjects[i].next = tempObjects[i + 1];
            tempObjects[i + 1].prev = tempObjects[i];
        }

        // Limpiar referencias
        tempObjects.forEach(obj => {
            obj.largeArray = null;
            obj.nestedObject = null;
            obj.next = null;
            obj.prev = null;
        });
        tempObjects.length = 0;

        // Intentar usar FinalizationRegistry si está disponible
        if (typeof FinalizationRegistry !== 'undefined') {
            const registry = new FinalizationRegistry((heldValue) => {
                console.log('[MemoryManager] Objeto finalizado:', heldValue);
            });
            
            const tempObj = { id: 'gc-trigger-' + Date.now() };
            registry.register(tempObj, 'gc-trigger');
        }

        this.metrics.gcTriggered++;
        console.log('[MemoryManager] Recolección de basura sugerida (estrategia agresiva)');
        
        // Emitir evento de GC sugerido
        this.eventBus.emit('memory:gc-suggested', {
            timestamp: Date.now(),
            memoryBefore: performance.memory?.usedJSHeapSize || 0,
            strategy: 'aggressive'
        });
    }

    /**
     * Forzar recolección de basura (evento)
     */
    forceGarbageCollection() {
        this.suggestGarbageCollection();
        this.eventBus.emit('memory:gc-forced');
    }

    /**
     * Agregar referencia débil
     * @param {Object} obj - Objeto para referencia débil
     */
    addWeakReference(obj) {
        if (typeof WeakRef !== 'undefined') {
            this.weakRefs.add(new WeakRef(obj));
        }
    }

    /**
     * Configurar gestor de memoria
     * @param {Object} newConfig - Nueva configuración
     */
    configure(newConfig) {
        this.cleanup = { ...this.cleanup, ...newConfig.cleanup };
        this.maxCacheSize = newConfig.maxCacheSize || this.maxCacheSize;
        
        console.log('[MemoryManager] Configuración actualizada:', newConfig);
    }

    /**
     * Obtener estadísticas del gestor
     * @returns {Object} Estadísticas de memoria
     */
    getStats() {
        const poolStats = {};
        for (const [type, pool] of this.objectPools.entries()) {
            poolStats[type] = {
                available: pool.available.length,
                inUse: pool.inUse.size,
                totalCreated: pool.totalCreated,
                totalReused: pool.totalReused,
                maxSize: pool.maxSize
            };
        }

        const memoryInfo = performance.memory ? {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit,
            usagePercent: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
        } : null;

        return {
            isEnabled: this.isEnabled,
            metrics: { ...this.metrics },
            pools: poolStats,
            cache: {
                size: this.resourceCache.size,
                maxSize: this.maxCacheSize,
                hitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0
            },
            memory: memoryInfo,
            cleanup: {
                lastCleanup: this.cleanup.lastCleanup,
                interval: this.cleanup.interval,
                threshold: this.cleanup.threshold
            },
            weakReferences: this.weakRefs.size
        };
    }

    /**
     * Obtener estadísticas formateadas
     * @returns {Object} Estadísticas formateadas para mostrar
     */
    getFormattedStats() {
        const stats = this.getStats();
        
        return {
            poolEfficiency: `${((stats.metrics.poolHits / (stats.metrics.poolHits + stats.metrics.poolMisses)) * 100 || 0).toFixed(1)}%`,
            cacheEfficiency: `${(stats.cache.hitRate * 100).toFixed(1)}%`,
            objectsReused: stats.metrics.objectsReused.toLocaleString('es-ES'),
            memoryUsage: stats.memory ? 
                `${(stats.memory.usagePercent).toFixed(1)}% (${this.formatBytes(stats.memory.used)})` : 
                'No disponible',
            cacheSize: `${stats.cache.size}/${stats.cache.maxSize}`,
            gcTriggered: stats.metrics.gcTriggered.toLocaleString('es-ES')
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
     * Limpiar recursos del gestor
     */
    destroy() {
        // Detener intervalos
        if (this.memoryCheckInterval) {
            clearInterval(this.memoryCheckInterval);
        }

        // Limpiar pools
        for (const [type, pool] of this.objectPools.entries()) {
            pool.available.length = 0;
            pool.inUse.clear();
        }
        this.objectPools.clear();

        // Limpiar cache
        this.resourceCache.clear();

        // Limpiar referencias débiles
        this.weakRefs.clear();

        // Limpiar event listeners
        this.eventBus.off('memory:request-object', this.requestObject, this);
        this.eventBus.off('memory:return-object', this.returnObject, this);
        this.eventBus.off('memory:cache-resource', this.cacheResource, this);
        this.eventBus.off('memory:get-cached', this.getCachedResource, this);
        this.eventBus.off('memory:cleanup', this.performCleanup, this);
        this.eventBus.off('memory:force-gc', this.forceGarbageCollection, this);
        this.eventBus.off('memory:configure', this.configure, this);
        this.eventBus.off('memory:get-stats', this.getStats, this);

        this.isInitialized = false;
        console.log('[MemoryManager] Gestor de memoria destruido');
    }
}