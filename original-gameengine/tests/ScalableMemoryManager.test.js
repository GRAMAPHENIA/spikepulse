/**
 * Tests para ScalableMemoryManager
 */

import { testFramework, expect, createMock } from './TestFramework.js';
import { ScalableMemoryManager } from '../src/modules/renderer/ScalableMemoryManager.js';
import { EventBus } from '../src/core/EventBus.js';

testFramework.describe('ScalableMemoryManager', () => {
    let manager;
    let eventBus;
    let mockConfig;
    let originalPerformance;
    let originalWindow;

    function beforeEach() {
        // Guardar referencias originales
        originalPerformance = global.performance;
        originalWindow = global.window;
        
        // Mock de performance
        global.performance = {
            memory: {
                usedJSHeapSize: 50 * 1024 * 1024, // 50MB
                totalJSHeapSize: 100 * 1024 * 1024, // 100MB
                jsHeapSizeLimit: 1024 * 1024 * 1024 // 1GB
            }
        };
        
        // Mock de window
        global.window = {
            gc: createMock()
        };
        
        eventBus = new EventBus();
        
        mockConfig = {
            maxMemoryUsage: 0.8,
            gcThreshold: 0.9,
            cleanupInterval: 100, // Más rápido para tests
            cacheMaxSize: 10,
            poolInitialSize: 5,
            poolMaxSize: 20,
            enableAutoCleanup: false, // Deshabilitado para tests
            enableObjectPooling: true,
            enableCacheManagement: true
        };
    }

    function afterEach() {
        if (manager) {
            manager.destroy();
            manager = null;
        }
        
        // Restaurar referencias originales
        global.performance = originalPerformance;
        global.window = originalWindow;
    }

    testFramework.test('debe inicializarse correctamente', () => {
        beforeEach();
        
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        expect(manager.isInitialized).toBe(true);
        expect(manager.objectPools.size).toBeGreaterThan(0);
        
        afterEach();
    });

    testFramework.test('debe crear pools de objetos básicos', () => {
        beforeEach();
        
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        expect(manager.objectPools.has('position')).toBe(true);
        expect(manager.objectPools.has('dimensions')).toBe(true);
        expect(manager.objectPools.has('color')).toBe(true);
        expect(manager.objectPools.has('array')).toBe(true);
        expect(manager.objectPools.has('transform')).toBe(true);
        
        afterEach();
    });

    testFramework.test('debe adquirir y liberar objetos del pool', () => {
        beforeEach();
        
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        // Adquirir objeto
        const pos1 = manager.acquireFromPool('position');
        expect(pos1).toBeDefined();
        expect(pos1).toHaveProperty('x');
        expect(pos1).toHaveProperty('y');
        
        const pool = manager.objectPools.get('position');
        expect(pool.inUse.length).toBe(1);
        expect(pool.available.length).toBe(4); // 5 inicial - 1 en uso
        
        // Liberar objeto
        manager.releaseToPool('position', pos1);
        expect(pool.inUse.length).toBe(0);
        expect(pool.available.length).toBe(5);
        
        afterEach();
    });

    testFramework.test('debe crear nuevos objetos cuando pool está vacío', () => {
        beforeEach();
        
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        const pool = manager.objectPools.get('position');
        const initialCreated = pool.totalCreated;
        
        // Adquirir todos los objetos disponibles
        const objects = [];
        for (let i = 0; i < 5; i++) {
            objects.push(manager.acquireFromPool('position'));
        }
        
        // Adquirir uno más (debería crear nuevo)
        const extraObj = manager.acquireFromPool('position');
        expect(extraObj).toBeDefined();
        expect(pool.totalCreated).toBe(initialCreated + 1);
        
        afterEach();
    });

    testFramework.test('debe respetar límite máximo del pool', () => {
        beforeEach();
        
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        // Adquirir hasta el límite máximo
        const objects = [];
        for (let i = 0; i < 20; i++) { // poolMaxSize = 20
            const obj = manager.acquireFromPool('position');
            if (obj) objects.push(obj);
        }
        
        // Intentar adquirir uno más
        const extraObj = manager.acquireFromPool('position');
        expect(extraObj).toBeNull(); // Debería fallar
        
        afterEach();
    });

    testFramework.test('debe crear cache gestionado', () => {
        beforeEach();
        
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        const cache = manager.createManagedCache('testCache', 5);
        
        expect(cache).toBeDefined();
        expect(typeof cache.get).toBe('function');
        expect(typeof cache.set).toBe('function');
        expect(manager.managedCaches.has('testCache')).toBe(true);
        
        afterEach();
    });

    testFramework.test('debe funcionar cache con hits y misses', () => {
        beforeEach();
        
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        const cache = manager.createManagedCache('testCache', 5);
        
        // Miss
        const value1 = cache.get('key1');
        expect(value1).toBeUndefined();
        
        // Set y hit
        cache.set('key1', 'value1');
        const value2 = cache.get('key1');
        expect(value2).toBe('value1');
        
        const stats = cache.getStats();
        expect(stats.hits).toBe(1);
        expect(stats.misses).toBe(1);
        expect(stats.hitRate).toBe(0.5);
        
        afterEach();
    });

    testFramework.test('debe hacer eviction LRU en cache', () => {
        beforeEach();
        
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        const cache = manager.createManagedCache('testCache', 3);
        
        // Llenar cache
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');
        cache.set('key3', 'value3');
        
        // Acceder a key1 para hacerla más reciente
        cache.get('key1');
        
        // Agregar nueva entrada (debería evict key2)
        cache.set('key4', 'value4');
        
        expect(cache.has('key1')).toBe(true); // Más reciente
        expect(cache.has('key2')).toBe(false); // Evicted
        expect(cache.has('key3')).toBe(true);
        expect(cache.has('key4')).toBe(true);
        
        afterEach();
    });

    testFramework.test('debe obtener métricas de memoria', () => {
        beforeEach();
        
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        const metrics = manager.getMemoryMetrics();
        
        expect(metrics).toHaveProperty('heapUsed');
        expect(metrics).toHaveProperty('heapTotal');
        expect(metrics).toHaveProperty('heapLimit');
        expect(metrics).toHaveProperty('poolsSize');
        expect(metrics).toHaveProperty('cachesSize');
        
        expect(metrics.heapUsed).toBe(50 * 1024 * 1024);
        expect(metrics.poolsSize).toBeGreaterThan(0);
        
        afterEach();
    });

    testFramework.test('debe realizar limpieza de pools', () => {
        beforeEach();
        
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        const pool = manager.objectPools.get('position');
        
        // Simular pool con muchos objetos disponibles
        for (let i = 0; i < 10; i++) {
            pool.available.push({ x: 0, y: 0 });
        }
        
        const initialAvailable = pool.available.length;
        manager.cleanupObjectPools();
        
        // Debería reducir a tamaño objetivo
        expect(pool.available.length).toBeLessThan(initialAvailable);
        expect(pool.available.length).toBeGreaterThanOrEqual(mockConfig.poolInitialSize);
        
        afterEach();
    });

    testFramework.test('debe forzar garbage collection', () => {
        beforeEach();
        
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        manager.forceGarbageCollection();
        
        expect(global.window.gc.calls.length).toBe(1);
        expect(manager.memoryMetrics.gcCount).toBe(1);
        
        afterEach();
    });

    testFramework.test('debe limpiar todos los caches', () => {
        beforeEach();
        
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        const cache1 = manager.createManagedCache('cache1');
        const cache2 = manager.createManagedCache('cache2');
        
        cache1.set('key1', 'value1');
        cache2.set('key2', 'value2');
        
        expect(cache1.size()).toBe(1);
        expect(cache2.size()).toBe(1);
        
        manager.clearAllCaches();
        
        expect(cache1.size()).toBe(0);
        expect(cache2.size()).toBe(0);
        
        afterEach();
    });

    testFramework.test('debe manejar presión de memoria', () => {
        beforeEach();
        
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        const cache = manager.createManagedCache('testCache');
        cache.set('key1', 'value1');
        
        expect(cache.size()).toBe(1);
        
        manager.handleMemoryPressure({});
        
        expect(cache.size()).toBe(0); // Debería limpiar cache
        expect(global.window.gc.calls.length).toBe(1); // Debería forzar GC
        
        afterEach();
    });

    testFramework.test('debe obtener estadísticas de pools', () => {
        beforeEach();
        
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        // Usar algunos objetos
        const obj1 = manager.acquireFromPool('position');
        const obj2 = manager.acquireFromPool('position');
        manager.releaseToPool('position', obj1);
        
        const stats = manager.getPoolStats();
        
        expect(stats).toHaveProperty('position');
        expect(stats.position.available).toBe(4); // 5 inicial - 1 en uso + 1 liberado
        expect(stats.position.inUse).toBe(1);
        expect(stats.position.totalAcquired).toBe(2);
        expect(stats.position.totalReleased).toBe(1);
        
        afterEach();
    });

    testFramework.test('debe obtener estadísticas de caches', () => {
        beforeEach();
        
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        const cache = manager.createManagedCache('testCache', 5);
        cache.set('key1', 'value1');
        cache.get('key1'); // hit
        cache.get('key2'); // miss
        
        const stats = manager.getCacheStats();
        
        expect(stats).toHaveProperty('testCache');
        expect(stats.testCache.size).toBe(1);
        expect(stats.testCache.maxSize).toBe(5);
        expect(stats.testCache.hits).toBe(1);
        expect(stats.testCache.misses).toBe(1);
        expect(stats.testCache.hitRate).toBe(0.5);
        
        afterEach();
    });

    testFramework.test('debe funcionar sin object pooling', () => {
        beforeEach();
        
        mockConfig.enableObjectPooling = false;
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        expect(manager.objectPools.size).toBe(0);
        
        const obj = manager.acquireFromPool('position');
        expect(obj).toBeNull();
        
        afterEach();
    });

    testFramework.test('debe funcionar sin cache management', () => {
        beforeEach();
        
        mockConfig.enableCacheManagement = false;
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        const cache = manager.createManagedCache('testCache');
        
        // Debería retornar Map normal, no cache gestionado
        expect(cache instanceof Map).toBe(true);
        
        afterEach();
    });

    testFramework.test('debe obtener estadísticas completas', () => {
        beforeEach();
        
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        const stats = manager.getStats();
        
        expect(stats).toHaveProperty('isInitialized');
        expect(stats).toHaveProperty('config');
        expect(stats).toHaveProperty('memoryMetrics');
        expect(stats).toHaveProperty('poolStats');
        expect(stats).toHaveProperty('cacheStats');
        expect(stats).toHaveProperty('weakRefsCount');
        
        expect(stats.isInitialized).toBe(true);
        
        afterEach();
    });

    testFramework.test('debe destruirse correctamente', () => {
        beforeEach();
        
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        expect(manager.isInitialized).toBe(true);
        expect(manager.objectPools.size).toBeGreaterThan(0);
        
        manager.destroy();
        
        expect(manager.isInitialized).toBe(false);
        expect(manager.objectPools.size).toBe(0);
        expect(manager.managedCaches.size).toBe(0);
        
        afterEach();
    });

    testFramework.test('debe manejar ausencia de performance.memory', () => {
        beforeEach();
        
        // Simular ausencia de performance.memory
        global.performance = {};
        
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        const metrics = manager.getMemoryMetrics();
        
        expect(metrics.heapUsed).toBe(0);
        expect(metrics.heapTotal).toBe(0);
        expect(metrics.heapLimit).toBe(0);
        
        afterEach();
    });

    testFramework.test('debe manejar ausencia de window.gc', () => {
        beforeEach();
        
        // Simular ausencia de window.gc
        global.window = {};
        
        manager = new ScalableMemoryManager(mockConfig, eventBus);
        
        // No debería lanzar error
        manager.forceGarbageCollection();
        
        afterEach();
    });
});