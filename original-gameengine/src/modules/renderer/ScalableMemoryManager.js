/**
 * ScalableMemoryManager - Gestión de memoria escalable para canvas grandes
 * @module ScalableMemoryManager
 */

/**
 * Gestor de memoria escalable para optimizar el uso de memoria en canvas grandes
 */
export class ScalableMemoryManager {
    /**
     * Crea una nueva instancia del ScalableMemoryManager
     * @param {Object} config - Configuración del gestor de memoria
     * @param {EventBus} eventBus - Bus de eventos para comunicación
     */
    constructor(config = {}, eventBus = null) {
        this.config = {
            maxMemoryUsage: config.maxMemoryUsage || 0.8, // 80% del heap
            gcThreshold: config.gcThreshold || 0.9, // 90% para GC forzado
            cleanupInterval: config.cleanupInterval || 30000, // 30 segundos
            cacheMaxSize: config.cacheMaxSize || 100, // Máximo elementos en cache
            poolInitialSize: config.poolInitialSize || 20,
            poolMaxSize: config.poolMaxSize || 200,
            enableAutoCleanup: config.enableAutoCleanup !== false,
            enableObjectPooling: config.enableObjectPooling !== false,
            enableCacheManagement: config.enableCacheManagement !== false,
            ...config
        };
        
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        // Pools de objetos
        this.objectPools = new Map();
        
        // Caches gestionados
        this.managedCaches = new Map();
        
        // Métricas de memoria
        this.memoryMetrics = {
            heapUsed: 0,
            heapTotal: 0,
            heapLimit: 0,
            poolsSize: 0,
            cachesSize: 0,
            lastGC: 0,
            gcCount: 0
        };
        
        // Referencias débiles para limpieza automática
        this.weakRefs = new Set();
        
        // Timer de limpieza
        this.cleanupTimer = null;
        
        this.init();
    }

    /**
     * Inicializar el gestor de memoria
     * @private
     */
    init() {
        this.setupObjectPools();
        this.setupEventListeners();
        
        if (this.config.enableAutoCleanup) {
            this.startAutoCleanup();
        }
        
        this.isInitialized = true;
        
        console.log('[ScalableMemoryManager] Inicializado correctamente');
        
        if (this.eventBus) {
            this.eventBus.emit('memory:initialized', {
                config: this.config,
                metrics: this.getMemoryMetrics()
            });
        }
    }

    /**
     * Configurar pools de objetos comunes
     * @private
     */
    setupObjectPools() {
        if (!this.config.enableObjectPooling) return;
        
        // Pool para objetos de posición
        this.createObjectPool('position', () => ({ x: 0, y: 0 }), (obj) => {
            obj.x = 0;
            obj.y = 0;
        });
        
        // Pool para objetos de dimensiones
        this.createObjectPool('dimensions', () => ({ width: 0, height: 0 }), (obj) => {
            obj.width = 0;
            obj.height = 0;
        });
        
        // Pool para objetos de color
        this.createObjectPool('color', () => ({ r: 0, g: 0, b: 0, a: 1 }), (obj) => {
            obj.r = 0;
            obj.g = 0;
            obj.b = 0;
            obj.a = 1;
        });
        
        // Pool para arrays temporales
        this.createObjectPool('array', () => [], (arr) => {
            arr.length = 0;
        });
        
        // Pool para objetos de transformación
        this.createObjectPool('transform', () => ({
            x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0
        }), (obj) => {
            obj.x = 0;
            obj.y = 0;
            obj.scaleX = 1;
            obj.scaleY = 1;
            obj.rotation = 0;
        });
        
        console.log('[ScalableMemoryManager] Pools de objetos configurados');
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        if (!this.eventBus) return;
        
        // Escuchar solicitudes de limpieza
        this.eventBus.on('memory:cleanup', this.performCleanup.bind(this));
        this.eventBus.on('memory:force-gc', this.forceGarbageCollection.bind(this));
        this.eventBus.on('memory:clear-caches', this.clearAllCaches.bind(this));
        
        // Escuchar eventos de rendimiento
        this.eventBus.on('performance:clear-caches', this.clearAllCaches.bind(this));
        this.eventBus.on('performance:memory-pressure', this.handleMemoryPressure.bind(this));
        
        console.log('[ScalableMemoryManager] Event listeners configurados');
    }

    /**
     * Iniciar limpieza automática
     * @private
     */
    startAutoCleanup() {
        this.cleanupTimer = setInterval(() => {
            this.performAutoCleanup();
        }, this.config.cleanupInterval);
        
        console.log('[ScalableMemoryManager] Limpieza automática iniciada');
    }

    /**
     * Crear un pool de objetos
     * @param {string} name - Nombre del pool
     * @param {Function} createFn - Función para crear objetos
     * @param {Function} resetFn - Función para resetear objetos
     * @param {number} initialSize - Tamaño inicial del pool
     */
    createObjectPool(name, createFn, resetFn, initialSize = null) {
        if (!this.config.enableObjectPooling) return;
        
        const size = initialSize || this.config.poolInitialSize;
        
        const pool = {
            name,
            createFn,
            resetFn,
            available: [],
            inUse: [],
            totalCreated: 0,
            totalAcquired: 0,
            totalReleased: 0
        };
        
        // Pre-poblar el pool
        for (let i = 0; i < size; i++) {
            const obj = createFn();
            pool.available.push(obj);
            pool.totalCreated++;
        }
        
        this.objectPools.set(name, pool);
        
        console.log(`[ScalableMemoryManager] Pool '${name}' creado con ${size} objetos`);
    }

    /**
     * Obtener objeto del pool
     * @param {string} poolName - Nombre del pool
     * @returns {Object|null} Objeto del pool
     */
    acquireFromPool(poolName) {
        if (!this.config.enableObjectPooling) return null;
        
        const pool = this.objectPools.get(poolName);
        if (!pool) return null;
        
        let obj = pool.available.pop();
        
        if (!obj) {
            // Crear nuevo objeto si el pool está vacío
            if (pool.inUse.length < this.config.poolMaxSize) {
                obj = pool.createFn();
                pool.totalCreated++;
            } else {
                console.warn(`[ScalableMemoryManager] Pool '${poolName}' alcanzó límite máximo`);
                return null;
            }
        }
        
        pool.inUse.push(obj);
        pool.totalAcquired++;
        
        return obj;
    }

    /**
     * Devolver objeto al pool
     * @param {string} poolName - Nombre del pool
     * @param {Object} obj - Objeto a devolver
     */
    releaseToPool(poolName, obj) {
        if (!this.config.enableObjectPooling || !obj) return;
        
        const pool = this.objectPools.get(poolName);
        if (!pool) return;
        
        const index = pool.inUse.indexOf(obj);
        if (index === -1) return;
        
        // Remover de inUse
        pool.inUse.splice(index, 1);
        
        // Resetear objeto
        if (pool.resetFn) {
            pool.resetFn(obj);
        }
        
        // Devolver a available
        pool.available.push(obj);
        pool.totalReleased++;
    }

    /**
     * Crear cache gestionado
     * @param {string} name - Nombre del cache
     * @param {number} maxSize - Tamaño máximo del cache
     * @returns {Object} Cache gestionado
     */
    createManagedCache(name, maxSize = null) {
        if (!this.config.enableCacheManagement) return new Map();
        
        const size = maxSize || this.config.cacheMaxSize;
        
        const cache = {
            name,
            data: new Map(),
            maxSize: size,
            hits: 0,
            misses: 0,
            evictions: 0,
            lastAccess: new Map()
        };
        
        this.managedCaches.set(name, cache);
        
        console.log(`[ScalableMemoryManager] Cache '${name}' creado con tamaño máximo: ${size}`);
        
        return this.createCacheProxy(cache);
    }

    /**
     * Crear proxy para cache con gestión automática
     * @param {Object} cache - Cache a proxificar
     * @returns {Object} Proxy del cache
     * @private
     */
    createCacheProxy(cache) {
        return {
            get: (key) => {
                const value = cache.data.get(key);
                if (value !== undefined) {
                    cache.hits++;
                    cache.lastAccess.set(key, Date.now());
                    return value;
                } else {
                    cache.misses++;
                    return undefined;
                }
            },
            
            set: (key, value) => {
                // Verificar si necesita eviction
                if (cache.data.size >= cache.maxSize && !cache.data.has(key)) {
                    this.evictFromCache(cache);
                }
                
                cache.data.set(key, value);
                cache.lastAccess.set(key, Date.now());
            },
            
            has: (key) => cache.data.has(key),
            
            delete: (key) => {
                const deleted = cache.data.delete(key);
                if (deleted) {
                    cache.lastAccess.delete(key);
                }
                return deleted;
            },
            
            clear: () => {
                cache.data.clear();
                cache.lastAccess.clear();
            },
            
            size: () => cache.data.size,
            
            getStats: () => ({
                name: cache.name,
                size: cache.data.size,
                maxSize: cache.maxSize,
                hits: cache.hits,
                misses: cache.misses,
                evictions: cache.evictions,
                hitRate: cache.hits / (cache.hits + cache.misses) || 0
            })
        };
    }

    /**
     * Realizar eviction en cache (LRU)
     * @param {Object} cache - Cache para hacer eviction
     * @private
     */
    evictFromCache(cache) {
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, time] of cache.lastAccess) {
            if (time < oldestTime) {
                oldestTime = time;
                oldestKey = key;
            }
        }
        
        if (oldestKey !== null) {
            cache.data.delete(oldestKey);
            cache.lastAccess.delete(oldestKey);
            cache.evictions++;
        }
    }

    /**
     * Obtener métricas de memoria
     * @returns {Object} Métricas de memoria
     */
    getMemoryMetrics() {
        const memoryInfo = performance.memory;
        
        if (memoryInfo) {
            this.memoryMetrics.heapUsed = memoryInfo.usedJSHeapSize;
            this.memoryMetrics.heapTotal = memoryInfo.totalJSHeapSize;
            this.memoryMetrics.heapLimit = memoryInfo.jsHeapSizeLimit;
        }
        
        // Calcular tamaño de pools
        this.memoryMetrics.poolsSize = 0;
        for (const pool of this.objectPools.values()) {
            this.memoryMetrics.poolsSize += pool.available.length + pool.inUse.length;
        }
        
        // Calcular tamaño de caches
        this.memoryMetrics.cachesSize = 0;
        for (const cache of this.managedCaches.values()) {
            this.memoryMetrics.cachesSize += cache.data.size;
        }
        
        return { ...this.memoryMetrics };
    }

    /**
     * Realizar limpieza automática
     * @private
     */
    performAutoCleanup() {
        const metrics = this.getMemoryMetrics();
        const memoryUsage = metrics.heapUsed / metrics.heapLimit;
        
        if (memoryUsage > this.config.maxMemoryUsage) {
            console.log(`[ScalableMemoryManager] Limpieza automática - Uso de memoria: ${(memoryUsage * 100).toFixed(1)}%`);
            this.performCleanup();
        }
        
        // Limpiar referencias débiles
        this.cleanupWeakRefs();
    }

    /**
     * Realizar limpieza completa
     */
    performCleanup() {
        console.log('[ScalableMemoryManager] Iniciando limpieza completa...');
        
        // Limpiar pools excesivos
        this.cleanupObjectPools();
        
        // Limpiar caches
        this.cleanupCaches();
        
        // Forzar GC si es necesario
        const metrics = this.getMemoryMetrics();
        const memoryUsage = metrics.heapUsed / metrics.heapLimit;
        
        if (memoryUsage > this.config.gcThreshold) {
            this.forceGarbageCollection();
        }
        
        if (this.eventBus) {
            this.eventBus.emit('memory:cleanup-completed', {
                metrics: this.getMemoryMetrics()
            });
        }
        
        console.log('[ScalableMemoryManager] Limpieza completada');
    }

    /**
     * Limpiar pools de objetos
     * @private
     */
    cleanupObjectPools() {
        for (const pool of this.objectPools.values()) {
            // Reducir pool si tiene demasiados objetos disponibles
            const targetSize = Math.max(this.config.poolInitialSize, pool.inUse.length);
            
            while (pool.available.length > targetSize) {
                pool.available.pop();
            }
        }
    }

    /**
     * Limpiar caches
     * @private
     */
    cleanupCaches() {
        for (const cache of this.managedCaches.values()) {
            // Limpiar entradas antiguas
            const now = Date.now();
            const maxAge = 5 * 60 * 1000; // 5 minutos
            
            for (const [key, time] of cache.lastAccess) {
                if (now - time > maxAge) {
                    cache.data.delete(key);
                    cache.lastAccess.delete(key);
                }
            }
        }
    }

    /**
     * Limpiar referencias débiles
     * @private
     */
    cleanupWeakRefs() {
        const toRemove = [];
        
        for (const weakRef of this.weakRefs) {
            if (weakRef.deref() === undefined) {
                toRemove.push(weakRef);
            }
        }
        
        for (const weakRef of toRemove) {
            this.weakRefs.delete(weakRef);
        }
    }

    /**
     * Forzar garbage collection
     */
    forceGarbageCollection() {
        if (window.gc) {
            window.gc();
            this.memoryMetrics.lastGC = Date.now();
            this.memoryMetrics.gcCount++;
            
            console.log('[ScalableMemoryManager] Garbage collection forzado');
            
            if (this.eventBus) {
                this.eventBus.emit('memory:gc-forced', {
                    timestamp: this.memoryMetrics.lastGC,
                    count: this.memoryMetrics.gcCount
                });
            }
        } else {
            console.warn('[ScalableMemoryManager] Garbage collection no disponible');
        }
    }

    /**
     * Limpiar todos los caches
     */
    clearAllCaches() {
        for (const cache of this.managedCaches.values()) {
            cache.data.clear();
            cache.lastAccess.clear();
        }
        
        console.log('[ScalableMemoryManager] Todos los caches limpiados');
        
        if (this.eventBus) {
            this.eventBus.emit('memory:caches-cleared');
        }
    }

    /**
     * Manejar presión de memoria
     * @param {Object} data - Datos del evento
     */
    handleMemoryPressure(data) {
        console.warn('[ScalableMemoryManager] Presión de memoria detectada');
        
        // Limpieza agresiva
        this.clearAllCaches();
        this.cleanupObjectPools();
        this.forceGarbageCollection();
        
        if (this.eventBus) {
            this.eventBus.emit('memory:pressure-handled', {
                action: 'aggressive_cleanup',
                metrics: this.getMemoryMetrics()
            });
        }
    }

    /**
     * Agregar referencia débil para limpieza automática
     * @param {Object} obj - Objeto a referenciar débilmente
     */
    addWeakRef(obj) {
        if (typeof WeakRef !== 'undefined') {
            this.weakRefs.add(new WeakRef(obj));
        }
    }

    /**
     * Obtener estadísticas de pools
     * @returns {Object} Estadísticas de pools
     */
    getPoolStats() {
        const stats = {};
        
        for (const [name, pool] of this.objectPools) {
            stats[name] = {
                available: pool.available.length,
                inUse: pool.inUse.length,
                totalCreated: pool.totalCreated,
                totalAcquired: pool.totalAcquired,
                totalReleased: pool.totalReleased,
                efficiency: pool.totalReleased / pool.totalAcquired || 0
            };
        }
        
        return stats;
    }

    /**
     * Obtener estadísticas de caches
     * @returns {Object} Estadísticas de caches
     */
    getCacheStats() {
        const stats = {};
        
        for (const [name, cache] of this.managedCaches) {
            stats[name] = {
                size: cache.data.size,
                maxSize: cache.maxSize,
                hits: cache.hits,
                misses: cache.misses,
                evictions: cache.evictions,
                hitRate: cache.hits / (cache.hits + cache.misses) || 0
            };
        }
        
        return stats;
    }

    /**
     * Obtener estadísticas completas
     * @returns {Object} Estadísticas completas
     */
    getStats() {
        return {
            isInitialized: this.isInitialized,
            config: { ...this.config },
            memoryMetrics: this.getMemoryMetrics(),
            poolStats: this.getPoolStats(),
            cacheStats: this.getCacheStats(),
            weakRefsCount: this.weakRefs.size
        };
    }

    /**
     * Destruir el gestor de memoria
     */
    destroy() {
        // Limpiar timer
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        
        // Limpiar pools
        this.objectPools.clear();
        
        // Limpiar caches
        this.managedCaches.clear();
        
        // Limpiar referencias débiles
        this.weakRefs.clear();
        
        this.isInitialized = false;
        
        console.log('[ScalableMemoryManager] Destruido correctamente');
    }
}