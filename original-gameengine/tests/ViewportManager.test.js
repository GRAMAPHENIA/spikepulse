/**
 * Tests unitarios para ViewportManager
 */

import { testFramework, expect, createMock } from './TestFramework.js';
import { ViewportManager } from '../src/modules/renderer/ViewportManager.js';
import { EventBus } from '../src/core/EventBus.js';

testFramework.describe('ViewportManager', () => {
    let manager;
    let eventBus;
    let mockConfig;
    let originalWindow;

    function beforeEach() {
        // Guardar window original
        originalWindow = global.window;
        
        // Mock de window
        global.window = {
            innerWidth: 1920,
            innerHeight: 1080,
            devicePixelRatio: 1
        };
        
        eventBus = new EventBus();
        
        mockConfig = {
            minWidth: 320,
            minHeight: 240,
            maxWidth: 3840,
            maxHeight: 2160,
            aspectRatio: 16/9,
            maintainAspectRatio: true,
            scalingMode: 'fit'
        };
    }

    function afterEach() {
        if (manager) {
            manager.destroy();
            manager = null;
        }
        
        // Restaurar window original
        global.window = originalWindow;
    }

    testFramework.test('debe inicializarse correctamente', () => {
        beforeEach();
        
        manager = new ViewportManager(mockConfig, eventBus);
        
        expect(manager.isInitialized).toBe(true);
        expect(manager.config.aspectRatio).toBe(16/9);
        expect(manager.currentViewport.width).toBe(1920);
        expect(manager.currentViewport.height).toBe(1080);
        
        afterEach();
    });

    testFramework.test('debe calcular dimensiones con modo fit', () => {
        beforeEach();
        
        manager = new ViewportManager(mockConfig, eventBus);
        
        // Simular viewport cuadrado
        const dimensions = manager.calculateDimensions({ width: 1000, height: 1000 });
        
        // Con aspect ratio 16:9, debe ajustar por altura
        expect(dimensions.height).toBe(1000);
        expect(dimensions.width).toBeGreaterThan(1000);
        expect(dimensions.scale).toBeCloseTo(1, 1);
        
        afterEach();
    });

    testFramework.test('debe calcular dimensiones con modo fill', () => {
        beforeEach();
        
        mockConfig.scalingMode = 'fill';
        manager = new ViewportManager(mockConfig, eventBus);
        
        const dimensions = manager.calculateDimensions({ width: 1000, height: 1000 });
        
        // Con modo fill, debe llenar completamente
        expect(dimensions.width).toBe(1000);
        expect(dimensions.height).toBeLessThan(1000);
        
        afterEach();
    });

    testFramework.test('debe calcular dimensiones con modo stretch', () => {
        beforeEach();
        
        mockConfig.scalingMode = 'stretch';
        manager = new ViewportManager(mockConfig, eventBus);
        
        const dimensions = manager.calculateDimensions({ width: 800, height: 600 });
        
        expect(dimensions.width).toBe(800);
        expect(dimensions.height).toBe(600);
        expect(dimensions.scale).toBe(1);
        
        afterEach();
    });

    testFramework.test('debe respetar límites mínimos', () => {
        beforeEach();
        
        manager = new ViewportManager(mockConfig, eventBus);
        
        const dimensions = manager.calculateDimensions({ width: 100, height: 100 });
        
        expect(dimensions.width).toBeGreaterThanOrEqual(mockConfig.minWidth);
        expect(dimensions.height).toBeGreaterThanOrEqual(mockConfig.minHeight);
        
        afterEach();
    });

    testFramework.test('debe respetar límites máximos', () => {
        beforeEach();
        
        manager = new ViewportManager(mockConfig, eventBus);
        
        const dimensions = manager.calculateDimensions({ width: 5000, height: 3000 });
        
        expect(dimensions.width).toBeLessThanOrEqual(mockConfig.maxWidth);
        expect(dimensions.height).toBeLessThanOrEqual(mockConfig.maxHeight);
        
        afterEach();
    });

    testFramework.test('debe convertir coordenadas de pantalla a juego', () => {
        beforeEach();
        
        manager = new ViewportManager(mockConfig, eventBus);
        manager.calculatedDimensions = {
            width: 800,
            height: 400,
            scale: 1,
            offsetX: 100,
            offsetY: 50
        };
        
        const gameCoords = manager.screenToGame(200, 100);
        
        expect(gameCoords.x).toBe(100); // (200 - 100) / 1
        expect(gameCoords.y).toBe(50);  // (100 - 50) / 1
        expect(gameCoords.isInBounds).toBe(true);
        
        afterEach();
    });

    testFramework.test('debe convertir coordenadas de juego a pantalla', () => {
        beforeEach();
        
        manager = new ViewportManager(mockConfig, eventBus);
        manager.calculatedDimensions = {
            width: 800,
            height: 400,
            scale: 2,
            offsetX: 100,
            offsetY: 50
        };
        
        const screenCoords = manager.gameToScreen(50, 25);
        
        expect(screenCoords.x).toBe(200); // 50 * 2 + 100
        expect(screenCoords.y).toBe(100); // 25 * 2 + 50
        
        afterEach();
    });

    testFramework.test('debe detectar tipo de dispositivo correctamente', () => {
        beforeEach();
        
        // Simular móvil
        global.window.innerWidth = 600;
        global.window.innerHeight = 800;
        
        manager = new ViewportManager(mockConfig, eventBus);
        
        expect(manager.isMobile()).toBe(true);
        expect(manager.isTablet()).toBe(false);
        expect(manager.isDesktop()).toBe(false);
        expect(manager.getCurrentBreakpoint()).toBe('mobile');
        
        afterEach();
    });

    testFramework.test('debe detectar tablet correctamente', () => {
        beforeEach();
        
        // Simular tablet
        global.window.innerWidth = 900;
        global.window.innerHeight = 600;
        
        manager = new ViewportManager(mockConfig, eventBus);
        
        expect(manager.isMobile()).toBe(false);
        expect(manager.isTablet()).toBe(true);
        expect(manager.isDesktop()).toBe(false);
        expect(manager.getCurrentBreakpoint()).toBe('tablet');
        
        afterEach();
    });

    testFramework.test('debe detectar desktop correctamente', () => {
        beforeEach();
        
        // Simular desktop
        global.window.innerWidth = 1920;
        global.window.innerHeight = 1080;
        
        manager = new ViewportManager(mockConfig, eventBus);
        
        expect(manager.isMobile()).toBe(false);
        expect(manager.isTablet()).toBe(false);
        expect(manager.isDesktop()).toBe(true);
        expect(manager.getCurrentBreakpoint()).toBe('desktop');
        
        afterEach();
    });

    testFramework.test('debe detectar alta densidad de píxeles', () => {
        beforeEach();
        
        global.window.devicePixelRatio = 2.5;
        
        manager = new ViewportManager(mockConfig, eventBus);
        
        expect(manager.isHighDensity()).toBe(true);
        
        afterEach();
    });

    testFramework.test('debe calcular escala recomendada según dispositivo', () => {
        beforeEach();
        
        // Simular móvil con alta densidad
        global.window.innerWidth = 400;
        global.window.innerHeight = 800;
        global.window.devicePixelRatio = 3;
        
        manager = new ViewportManager(mockConfig, eventBus);
        
        const scale = manager.getRecommendedScale();
        expect(scale).toBeGreaterThan(0.8); // Escala base móvil con ajuste por densidad
        
        afterEach();
    });

    testFramework.test('debe actualizar configuración correctamente', () => {
        beforeEach();
        
        manager = new ViewportManager(mockConfig, eventBus);
        
        const newConfig = {
            aspectRatio: 4/3,
            scalingMode: 'fill'
        };
        
        manager.updateConfig(newConfig);
        
        expect(manager.config.aspectRatio).toBe(4/3);
        expect(manager.config.scalingMode).toBe('fill');
        
        afterEach();
    });

    testFramework.test('debe usar cache para cálculos repetidos', () => {
        beforeEach();
        
        manager = new ViewportManager(mockConfig, eventBus);
        
        // Primera llamada
        const dimensions1 = manager.calculateDimensions({ width: 1000, height: 600 });
        const cacheSize1 = manager.calculationCache.size;
        
        // Segunda llamada con mismos parámetros
        const dimensions2 = manager.calculateDimensions({ width: 1000, height: 600 });
        const cacheSize2 = manager.calculationCache.size;
        
        expect(dimensions1).toEqual(dimensions2);
        expect(cacheSize2).toBe(cacheSize1); // No debe aumentar el cache
        
        afterEach();
    });

    testFramework.test('debe limpiar cache correctamente', () => {
        beforeEach();
        
        manager = new ViewportManager(mockConfig, eventBus);
        
        // Generar algunas entradas en cache
        manager.calculateDimensions({ width: 1000, height: 600 });
        manager.calculateDimensions({ width: 800, height: 600 });
        
        expect(manager.calculationCache.size).toBeGreaterThan(0);
        
        manager.clearCache();
        
        expect(manager.calculationCache.size).toBe(0);
        
        afterEach();
    });

    testFramework.test('debe retornar estadísticas completas', () => {
        beforeEach();
        
        manager = new ViewportManager(mockConfig, eventBus);
        
        const stats = manager.getStats();
        
        expect(stats).toHaveProperty('isInitialized');
        expect(stats).toHaveProperty('viewport');
        expect(stats).toHaveProperty('dimensions');
        expect(stats).toHaveProperty('config');
        expect(stats).toHaveProperty('breakpoint');
        expect(stats).toHaveProperty('isMobile');
        expect(stats).toHaveProperty('isTablet');
        expect(stats).toHaveProperty('isDesktop');
        expect(stats).toHaveProperty('recommendedScale');
        
        afterEach();
    });

    testFramework.test('debe destruirse correctamente', () => {
        beforeEach();
        
        manager = new ViewportManager(mockConfig, eventBus);
        
        expect(manager.isInitialized).toBe(true);
        expect(manager.calculationCache.size).toBeGreaterThanOrEqual(0);
        
        manager.destroy();
        
        expect(manager.isInitialized).toBe(false);
        expect(manager.calculationCache.size).toBe(0);
        
        afterEach();
    });
});