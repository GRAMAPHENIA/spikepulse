/**
 * Tests de rendimiento para PerformanceOptimizer
 */

import { testFramework, expect, createMock } from './TestFramework.js';
import { PerformanceOptimizer } from '../src/modules/renderer/PerformanceOptimizer.js';
import { EventBus } from '../src/core/EventBus.js';

testFramework.describe('PerformanceOptimizer', () => {
    let optimizer;
    let eventBus;
    let mockConfig;
    let originalWindow;
    let originalPerformance;
    let originalNavigator;

    function beforeEach() {
        // Guardar referencias originales
        originalWindow = global.window;
        originalPerformance = global.performance;
        originalNavigator = global.navigator;
        
        // Mock de window
        global.window = {
            innerWidth: 1920,
            innerHeight: 1080,
            devicePixelRatio: 1,
            gc: createMock()
        };
        
        // Mock de performance
        global.performance = {
            now: createMock(() => Date.now()),
            memory: {
                usedJSHeapSize: 50 * 1024 * 1024, // 50MB
                totalJSHeapSize: 100 * 1024 * 1024, // 100MB
                jsHeapSizeLimit: 2 * 1024 * 1024 * 1024 // 2GB
            }
        };
        
        // Mock de navigator
        global.navigator = {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };
        
        eventBus = new EventBus();
        
        mockConfig = {
            targetFPS: 60,
            minFPS: 30,
            adaptiveQuality: true,
            memoryThreshold: 0.8,
            monitoringInterval: 100, // Más rápido para tests
            optimizationInterval: 200
        };
    }

    function afterEach() {
        if (optimizer) {
            optimizer.destroy();
            optimizer = null;
        }
        
        // Restaurar referencias originales
        global.window = originalWindow;
        global.performance = originalPerformance;
        global.navigator = originalNavigator;
    }

    testFramework.test('debe inicializarse con calidad apropiada para resolución', () => {
        beforeEach();
        
        // Simular resolución 4K
        global.window.innerWidth = 3840;
        global.window.innerHeight = 2160;
        global.window.devicePixelRatio = 2;
        
        optimizer = new PerformanceOptimizer(mockConfig, eventBus);
        
        expect(optimizer.isInitialized).toBe(true);
        expect(optimizer.currentQuality).toBe('medium'); // Debería bajar calidad para 4K
        
        afterEach();
    });

    testFramework.test('debe detectar dispositivo móvil y ajustar calidad', () => {
        beforeEach();
        
        // Simular móvil
        global.window.innerWidth = 375;
        global.window.innerHeight = 667;
        global.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
        
        optimizer = new PerformanceOptimizer(mockConfig, eventBus);
        
        expect(optimizer.currentQuality).toBe('low'); // Calidad baja para móvil
        
        afterEach();
    });

    testFramework.test('debe obtener configuración de calidad correcta', () => {
        beforeEach();
        
        optimizer = new PerformanceOptimizer(mockConfig, eventBus);
        optimizer.setQuality('high');
        
        const config = optimizer.getCurrentQualityConfig();
        
        expect(config).toHaveProperty('scale');
        expect(config).toHaveProperty('maxParticles');
        expect(config).toHaveProperty('enableShadows');
        expect(config.scale).toBe(1.0);
        expect(config.maxParticles).toBe(150);
        
        afterEach();
    });

    testFramework.test('debe cambiar calidad manualmente', () => {
        beforeEach();
        
        optimizer = new PerformanceOptimizer(mockConfig, eventBus);
        
        const initialQuality = optimizer.currentQuality;
        optimizer.setQuality('ultra');
        
        expect(optimizer.currentQuality).toBe('ultra');
        expect(optimizer.currentQuality).not.toBe(initialQuality);
        
        afterEach();
    });

    testFramework.test('debe actualizar métricas de renderizado', () => {
        beforeEach();
        
        optimizer = new PerformanceOptimizer(mockConfig, eventBus);
        
        const renderMetrics = {
            renderTime: 12.5,
            updateTime: 3.2,
            totalObjects: 150,
            visibleObjects: 120,
            culledObjects: 30
        };
        
        optimizer.updateRenderMetrics(renderMetrics);
        
        const metrics = optimizer.getMetrics();
        expect(metrics.renderTime).toBe(12.5);
        expect(metrics.totalObjects).toBe(150);
        expect(metrics.visibleObjects).toBe(120);
        
        afterEach();
    });

    testFramework.test('debe bajar calidad cuando FPS es bajo', (done) => {
        beforeEach();
        
        optimizer = new PerformanceOptimizer(mockConfig, eventBus);
        optimizer.setQuality('high');
        
        // Simular FPS bajo
        optimizer.performanceMetrics.fps = 20; // Menor que minFPS (30)
        optimizer.addToHistory('fps', 20);
        optimizer.addToHistory('fps', 22);
        optimizer.addToHistory('fps', 18);
        
        let qualityChanged = false;
        eventBus.on('performance:quality-change-suggested', (data) => {
            expect(data.suggestedQuality).toBe('medium'); // Debería bajar de high a medium
            qualityChanged = true;
        });
        
        optimizer.analyzePerformance();
        
        setTimeout(() => {
            expect(qualityChanged).toBe(true);
            done();
            afterEach();
        }, 50);
    });

    testFramework.test('debe subir calidad cuando FPS es alto', (done) => {
        beforeEach();
        
        optimizer = new PerformanceOptimizer(mockConfig, eventBus);
        optimizer.setQuality('medium');
        
        // Simular FPS alto
        optimizer.performanceMetrics.fps = 75; // Mayor que targetFPS + 10
        optimizer.addToHistory('fps', 75);
        optimizer.addToHistory('fps', 78);
        optimizer.addToHistory('fps', 72);
        
        let qualityChanged = false;
        eventBus.on('performance:quality-change-suggested', (data) => {
            expect(data.suggestedQuality).toBe('high'); // Debería subir de medium a high
            qualityChanged = true;
        });
        
        optimizer.analyzePerformance();
        
        setTimeout(() => {
            expect(qualityChanged).toBe(true);
            done();
            afterEach();
        }, 50);
    });

    testFramework.test('debe forzar GC cuando memoria es alta', () => {
        beforeEach();
        
        // Simular memoria alta
        global.performance.memory.usedJSHeapSize = 1.8 * 1024 * 1024 * 1024; // 1.8GB
        
        optimizer = new PerformanceOptimizer(mockConfig, eventBus);
        
        // Simular uso alto de memoria
        optimizer.performanceMetrics.memoryUsage = 0.95;
        optimizer.addToHistory('memoryUsage', 0.95);
        
        optimizer.optimizeMemory();
        
        expect(global.window.gc.calls.length).toBe(1);
        
        afterEach();
    });

    testFramework.test('debe emitir eventos de optimización', (done) => {
        beforeEach();
        
        optimizer = new PerformanceOptimizer(mockConfig, eventBus);
        
        let eventsReceived = 0;
        
        eventBus.on('performance:update-culling', () => {
            eventsReceived++;
        });
        
        eventBus.on('performance:update-limits', () => {
            eventsReceived++;
        });
        
        optimizer.optimizeCanvas();
        
        setTimeout(() => {
            expect(eventsReceived).toBe(2);
            done();
            afterEach();
        }, 50);
    });

    testFramework.test('debe calcular promedio de métricas correctamente', () => {
        beforeEach();
        
        optimizer = new PerformanceOptimizer(mockConfig, eventBus);
        
        // Agregar valores al historial
        optimizer.addToHistory('fps', 60);
        optimizer.addToHistory('fps', 55);
        optimizer.addToHistory('fps', 65);
        
        const avgFPS = optimizer.getAverageMetric('fps');
        expect(avgFPS).toBe(60); // (60 + 55 + 65) / 3
        
        afterEach();
    });

    testFramework.test('debe mantener historial con tamaño máximo', () => {
        beforeEach();
        
        optimizer = new PerformanceOptimizer(mockConfig, eventBus);
        
        // Agregar más valores que el máximo
        for (let i = 0; i < 70; i++) {
            optimizer.addToHistory('fps', i);
        }
        
        expect(optimizer.metricsHistory.fps.length).toBe(60); // maxHistorySize
        expect(optimizer.metricsHistory.fps[0]).toBe(10); // Debería haber removido los primeros
        
        afterEach();
    });

    testFramework.test('debe resetear métricas correctamente', () => {
        beforeEach();
        
        optimizer = new PerformanceOptimizer(mockConfig, eventBus);
        
        // Agregar algunas métricas
        optimizer.performanceMetrics.fps = 45;
        optimizer.performanceMetrics.renderTime = 20;
        optimizer.addToHistory('fps', 45);
        
        optimizer.resetMetrics();
        
        expect(optimizer.performanceMetrics.fps).toBe(60); // Valor por defecto
        expect(optimizer.performanceMetrics.renderTime).toBe(0);
        expect(optimizer.metricsHistory.fps.length).toBe(0);
        
        afterEach();
    });

    testFramework.test('debe obtener estadísticas completas', () => {
        beforeEach();
        
        optimizer = new PerformanceOptimizer(mockConfig, eventBus);
        
        const stats = optimizer.getStats();
        
        expect(stats).toHaveProperty('isInitialized');
        expect(stats).toHaveProperty('currentQuality');
        expect(stats).toHaveProperty('targetQuality');
        expect(stats).toHaveProperty('metrics');
        expect(stats).toHaveProperty('qualityLevels');
        expect(stats).toHaveProperty('memoryInfo');
        
        expect(stats.isInitialized).toBe(true);
        expect(stats.qualityLevels).toContain('low');
        expect(stats.qualityLevels).toContain('high');
        
        afterEach();
    });

    testFramework.test('debe manejar calidad inválida graciosamente', () => {
        beforeEach();
        
        optimizer = new PerformanceOptimizer(mockConfig, eventBus);
        
        const initialQuality = optimizer.currentQuality;
        optimizer.setQuality('invalid_quality');
        
        // No debería cambiar la calidad
        expect(optimizer.currentQuality).toBe(initialQuality);
        
        afterEach();
    });

    testFramework.test('debe destruirse correctamente', () => {
        beforeEach();
        
        optimizer = new PerformanceOptimizer(mockConfig, eventBus);
        
        expect(optimizer.isInitialized).toBe(true);
        expect(optimizer.monitoringTimer).not.toBeNull();
        
        optimizer.destroy();
        
        expect(optimizer.isInitialized).toBe(false);
        expect(optimizer.monitoringTimer).toBeNull();
        
        afterEach();
    });

    testFramework.test('debe funcionar sin eventBus', () => {
        beforeEach();
        
        // Crear sin eventBus
        optimizer = new PerformanceOptimizer(mockConfig, null);
        
        expect(optimizer.isInitialized).toBe(true);
        expect(optimizer.eventBus).toBeNull();
        
        // Debería funcionar sin errores
        optimizer.setQuality('low');
        optimizer.forceOptimization();
        
        afterEach();
    });

    testFramework.test('debe ajustar calidad para diferentes resoluciones', () => {
        beforeEach();
        
        // Test para diferentes resoluciones
        const resolutions = [
            { width: 1280, height: 720, expectedQuality: 'high' },
            { width: 1920, height: 1080, expectedQuality: 'high' },
            { width: 2560, height: 1440, expectedQuality: 'high' },
            { width: 3840, height: 2160, expectedQuality: 'medium' } // 4K debería ser medium
        ];
        
        resolutions.forEach(({ width, height, expectedQuality }) => {
            global.window.innerWidth = width;
            global.window.innerHeight = height;
            
            const testOptimizer = new PerformanceOptimizer(mockConfig, eventBus);
            
            // La calidad puede ser la esperada o menor (por ser móvil, etc.)
            const qualityLevels = ['minimal', 'low', 'medium', 'high', 'ultra'];
            const currentIndex = qualityLevels.indexOf(testOptimizer.currentQuality);
            const expectedIndex = qualityLevels.indexOf(expectedQuality);
            
            expect(currentIndex).toBeLessThanOrEqual(expectedIndex);
            
            testOptimizer.destroy();
        });
        
        afterEach();
    });
});