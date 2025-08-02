/**
 * Tests unitarios para FullscreenCanvasManager
 */

import { testFramework, expect, createMock } from './TestFramework.js';
import { FullscreenCanvasManager } from '../src/modules/renderer/FullscreenCanvasManager.js';
import { EventBus } from '../src/core/EventBus.js';

// Mock del canvas
function createMockCanvas() {
    return {
        width: 800,
        height: 400,
        style: {},
        setAttribute: createMock(),
        parentElement: null,
        getContext: createMock(() => ({
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        })),
        requestFullscreen: createMock(() => Promise.resolve()),
        webkitRequestFullscreen: createMock(() => Promise.resolve()),
        mozRequestFullScreen: createMock(() => Promise.resolve()),
        msRequestFullscreen: createMock(() => Promise.resolve())
    };
}

// Mock de document
const mockDocument = {
    fullscreenElement: null,
    webkitFullscreenElement: null,
    mozFullScreenElement: null,
    msFullscreenElement: null,
    hidden: false,
    addEventListener: createMock(),
    removeEventListener: createMock(),
    exitFullscreen: createMock(() => Promise.resolve()),
    webkitExitFullscreen: createMock(() => Promise.resolve()),
    mozCancelFullScreen: createMock(() => Promise.resolve()),
    msExitFullscreen: createMock(() => Promise.resolve())
};

// Mock de window
const mockWindow = {
    innerWidth: 1920,
    innerHeight: 1080,
    addEventListener: createMock(),
    removeEventListener: createMock()
};

testFramework.describe('FullscreenCanvasManager', () => {
    let manager;
    let eventBus;
    let mockCanvas;
    let mockConfig;
    let originalWindow;
    let originalDocument;

    function beforeEach() {
        // Guardar referencias originales
        originalWindow = window;
        originalDocument = document;
        
        // Configurar mocks
        Object.defineProperty(global, 'window', {
            value: { ...originalWindow, ...mockWindow },
            writable: true,
            configurable: true
        });
        
        Object.defineProperty(global, 'document', {
            value: { ...originalDocument, ...mockDocument },
            writable: true,
            configurable: true
        });
        
        // Crear instancias
        eventBus = new EventBus();
        mockCanvas = createMockCanvas();
        
        mockConfig = {
            canvas: {
                minWidth: 320,
                minHeight: 240,
                maxWidth: 3840,
                maxHeight: 2160,
                aspectRatio: 16/9,
                maintainAspectRatio: true,
                backgroundColor: '#000000'
            }
        };
    }

    function afterEach() {
        if (manager) {
            manager.destroy();
            manager = null;
        }
        
        // Restaurar referencias originales
        Object.defineProperty(global, 'window', {
            value: originalWindow,
            writable: true,
            configurable: true
        });
        
        Object.defineProperty(global, 'document', {
            value: originalDocument,
            writable: true,
            configurable: true
        });
    }

    testFramework.test('debe inicializarse correctamente', () => {
        beforeEach();
        
        manager = new FullscreenCanvasManager(mockCanvas, mockConfig, eventBus);
        
        expect(manager.isInitialized).toBe(true);
        expect(manager.canvas).toBe(mockCanvas);
        expect(manager.eventBus).toBe(eventBus);
        expect(manager.ctx).toBeDefined();
        
        afterEach();
    });

    testFramework.test('debe configurar canvas correctamente', () => {
        beforeEach();
        
        manager = new FullscreenCanvasManager(mockCanvas, mockConfig, eventBus);
        
        expect(mockCanvas.setAttribute.calls.length).toBeGreaterThan(0);
        expect(mockCanvas.style.display).toBe('block');
        expect(mockCanvas.style.margin).toBe('0 auto');
        
        afterEach();
    });

    testFramework.test('debe establecer dimensiones iniciales', () => {
        beforeEach();
        
        manager = new FullscreenCanvasManager(mockCanvas, mockConfig, eventBus);
        const dimensions = manager.getDimensions();
        
        expect(dimensions.width).toBe(800);
        expect(dimensions.height).toBe(400);
        expect(dimensions.viewport.width).toBe(1920);
        expect(dimensions.viewport.height).toBe(1080);
        
        afterEach();
    });

    testFramework.test('debe calcular dimensiones óptimas manteniendo aspect ratio', () => {
        beforeEach();
        
        manager = new FullscreenCanvasManager(mockCanvas, mockConfig, eventBus);
        
        // Simular viewport cuadrado
        manager.viewportDimensions = { width: 1000, height: 1000 };
        const dimensions = manager.calculateOptimalDimensions();
        
        // Con aspect ratio 16:9, debe ajustar por altura
        expect(dimensions.height).toBe(1000);
        expect(dimensions.width).toBeGreaterThan(1000);
        
        afterEach();
    });

    testFramework.test('debe respetar límites mínimos y máximos', () => {
        beforeEach();
        
        manager = new FullscreenCanvasManager(mockCanvas, mockConfig, eventBus);
        
        // Simular viewport muy pequeño
        manager.viewportDimensions = { width: 100, height: 100 };
        const dimensions = manager.calculateOptimalDimensions();
        
        expect(dimensions.width).toBeGreaterThanOrEqual(mockConfig.canvas.minWidth);
        expect(dimensions.height).toBeGreaterThanOrEqual(mockConfig.canvas.minHeight);
        
        afterEach();
    });

    testFramework.test('debe detectar soporte de fullscreen', () => {
        beforeEach();
        
        manager = new FullscreenCanvasManager(mockCanvas, mockConfig, eventBus);
        
        expect(manager.supportsFullscreen()).toBe(true);
        
        afterEach();
    });

    testFramework.test('debe habilitar pantalla completa', async () => {
        beforeEach();
        
        manager = new FullscreenCanvasManager(mockCanvas, mockConfig, eventBus);
        
        const result = await manager.enableFullscreen();
        
        expect(result).toBe(true);
        expect(mockCanvas.requestFullscreen.calls.length).toBe(1);
        
        afterEach();
    });

    testFramework.test('debe deshabilitar pantalla completa', async () => {
        beforeEach();
        
        manager = new FullscreenCanvasManager(mockCanvas, mockConfig, eventBus);
        manager.isFullscreen = true;
        
        const result = await manager.disableFullscreen();
        
        expect(result).toBe(true);
        expect(mockDocument.exitFullscreen.calls.length).toBe(1);
        
        afterEach();
    });

    testFramework.test('debe alternar pantalla completa', async () => {
        beforeEach();
        
        manager = new FullscreenCanvasManager(mockCanvas, mockConfig, eventBus);
        
        // Habilitar
        let result = await manager.toggleFullscreen();
        expect(result).toBe(true);
        
        // Simular que está en fullscreen y deshabilitar
        manager.isFullscreen = true;
        result = await manager.toggleFullscreen();
        expect(result).toBe(true);
        
        afterEach();
    });

    testFramework.test('debe retornar dimensiones actuales', () => {
        beforeEach();
        
        manager = new FullscreenCanvasManager(mockCanvas, mockConfig, eventBus);
        const dimensions = manager.getDimensions();
        
        expect(dimensions).toHaveProperty('width');
        expect(dimensions).toHaveProperty('height');
        expect(dimensions).toHaveProperty('scaledWidth');
        expect(dimensions).toHaveProperty('scaledHeight');
        expect(dimensions).toHaveProperty('scale');
        expect(dimensions).toHaveProperty('viewport');
        expect(dimensions).toHaveProperty('isFullscreen');
        
        afterEach();
    });

    testFramework.test('debe retornar estado completo', () => {
        beforeEach();
        
        manager = new FullscreenCanvasManager(mockCanvas, mockConfig, eventBus);
        const status = manager.getStatus();
        
        expect(status).toHaveProperty('isInitialized');
        expect(status).toHaveProperty('isFullscreen');
        expect(status).toHaveProperty('isResizing');
        expect(status).toHaveProperty('supportsFullscreen');
        expect(status).toHaveProperty('dimensions');
        expect(status).toHaveProperty('config');
        
        afterEach();
    });

    testFramework.test('debe limpiar recursos correctamente', () => {
        beforeEach();
        
        manager = new FullscreenCanvasManager(mockCanvas, mockConfig, eventBus);
        manager.destroy();
        
        expect(mockWindow.removeEventListener.calls.length).toBeGreaterThan(0);
        expect(manager.isInitialized).toBe(false);
        
        afterEach();
    });

    testFramework.test('debe manejar canvas sin contexto', () => {
        beforeEach();
        
        const badCanvas = {
            ...mockCanvas,
            getContext: createMock(() => null)
        };
        
        let errorThrown = false;
        try {
            manager = new FullscreenCanvasManager(badCanvas, mockConfig, eventBus);
        } catch (error) {
            errorThrown = true;
            expect(error.message).toContain('No se pudo obtener contexto 2D del canvas');
        }
        
        expect(errorThrown).toBe(true);
        
        afterEach();
    });

    testFramework.test('debe prevenir múltiples redimensionamientos simultáneos', () => {
        beforeEach();
        
        manager = new FullscreenCanvasManager(mockCanvas, mockConfig, eventBus);
        manager.isResizing = true;
        
        const originalWidth = mockCanvas.width;
        manager.resizeCanvas();
        
        // No debe cambiar si ya está redimensionando
        expect(mockCanvas.width).toBe(originalWidth);
        
        afterEach();
    });

    testFramework.test('debe manejar viewport con dimensiones cero', () => {
        beforeEach();
        
        manager = new FullscreenCanvasManager(mockCanvas, mockConfig, eventBus);
        manager.viewportDimensions = { width: 0, height: 0 };
        
        const dimensions = manager.calculateOptimalDimensions();
        
        expect(dimensions.width).toBeGreaterThanOrEqual(mockConfig.canvas.minWidth);
        expect(dimensions.height).toBeGreaterThanOrEqual(mockConfig.canvas.minHeight);
        
        afterEach();
    });
});