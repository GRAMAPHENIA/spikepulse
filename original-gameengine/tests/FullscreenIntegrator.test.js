/**
 * Tests para FullscreenIntegrator
 */

import { testFramework, expect, createMock } from './TestFramework.js';
import { FullscreenIntegrator } from '../src/modules/renderer/FullscreenIntegrator.js';
import { EventBus } from '../src/core/EventBus.js';

testFramework.describe('FullscreenIntegrator', () => {
    let integrator;
    let eventBus;
    let mockCanvas;
    let mockConfig;
    let originalWindow;

    function beforeEach() {
        // Guardar window original
        originalWindow = global.window;
        
        // Mock de canvas
        mockCanvas = {
            width: 800,
            height: 400,
            style: {},
            getContext: createMock(() => ({
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high',
                save: createMock(),
                restore: createMock(),
                translate: createMock(),
                scale: createMock()
            })),
            setAttribute: createMock(),
            parentElement: null
        };
        
        // Mock de window
        global.window = {
            innerWidth: 1920,
            innerHeight: 1080,
            devicePixelRatio: 1,
            addEventListener: createMock(),
            removeEventListener: createMock(),
            spikepulseApp: {
                gameEngine: {
                    modules: new Map([
                        ['renderer', {
                            instance: {
                                render: createMock(),
                                handleResize: createMock(),
                                setQuality: createMock(),
                                setCullingDistance: createMock(),
                                setRenderLimits: createMock()
                            }
                        }]
                    ])
                }
            }
        };
        
        // Mock de document
        global.document = {
            body: {
                classList: {
                    add: createMock(),
                    remove: createMock()
                }
            },
            documentElement: {
                style: {
                    setProperty: createMock()
                }
            },
            hidden: false,
            addEventListener: createMock(),
            removeEventListener: createMock(),
            querySelector: createMock(() => null),
            getElementById: createMock(() => null),
            fullscreenElement: null,
            exitFullscreen: createMock(() => Promise.resolve())
        };
        
        // Mock de screen
        global.screen = {
            orientation: {
                type: 'landscape-primary'
            }
        };
        
        // Mock de navigator
        global.navigator = {
            maxTouchPoints: 0,
            msMaxTouchPoints: 0,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };
        
        // Mock de performance
        global.performance = {
            now: createMock(() => Date.now()),
            memory: {
                usedJSHeapSize: 50 * 1024 * 1024,
                totalJSHeapSize: 100 * 1024 * 1024,
                jsHeapSizeLimit: 1024 * 1024 * 1024
            }
        };
        
        eventBus = new EventBus();
        
        mockConfig = {
            canvas: {
                minWidth: 320,
                minHeight: 240,
                maxWidth: 3840,
                maxHeight: 2160,
                aspectRatio: 16/9,
                maintainAspectRatio: true
            },
            responsive: {
                breakpoints: {
                    mobile: 768,
                    tablet: 1024,
                    desktop: 1440
                },
                touchOptimization: true,
                adaptiveUI: true
            },
            performance: {
                targetFPS: 60,
                minFPS: 30,
                adaptiveQuality: true,
                memoryThreshold: 0.8
            }
        };
    }

    function afterEach() {
        if (integrator) {
            integrator.destroy();
            integrator = null;
        }
        
        // Restaurar window original
        global.window = originalWindow;
    }

    testFramework.test('debe inicializarse correctamente', () => {
        beforeEach();
        
        integrator = new FullscreenIntegrator(mockCanvas, mockConfig, eventBus);
        
        expect(integrator.isInitialized).toBe(true);
        expect(integrator.fullscreenManager).toBeDefined();
        expect(integrator.viewportManager).toBeDefined();
        expect(integrator.responsiveHandler).toBeDefined();
        expect(integrator.performanceOptimizer).toBeDefined();
        expect(integrator.memoryManager).toBeDefined();
        
        afterEach();
    });

    testFramework.test('debe encontrar referencias del sistema existente', () => {
        beforeEach();
        
        integrator = new FullscreenIntegrator(mockCanvas, mockConfig, eventBus);
        
        expect(integrator.gameEngine).toBeDefined();
        expect(integrator.renderer).toBeDefined();
        
        afterEach();
    });

    testFramework.test('debe extender renderer con capacidades fullscreen', () => {
        beforeEach();
        
        integrator = new FullscreenIntegrator(mockCanvas, mockConfig, eventBus);
        
        expect(integrator.renderer.getViewportDimensions).toBeDefined();
        expect(integrator.renderer.screenToGame).toBeDefined();
        expect(integrator.renderer.gameToScreen).toBeDefined();
        expect(typeof integrator.renderer.getViewportDimensions).toBe('function');
        
        afterEach();
    });

    testFramework.test('debe crear sistema de coordenadas adaptativo', () => {
        beforeEach();
        
        integrator = new FullscreenIntegrator(mockCanvas, mockConfig, eventBus);
        
        expect(integrator.coordinateSystem).toBeDefined();
        expect(integrator.coordinateSystem.toScreen).toBeDefined();
        expect(integrator.coordinateSystem.toGame).toBeDefined();
        expect(integrator.coordinateSystem.getScale).toBeDefined();
        expect(integrator.coordinateSystem.getOffset).toBeDefined();
        
        afterEach();
    });

    testFramework.test('debe manejar cambio de fullscreen', (done) => {
        beforeEach();
        
        integrator = new FullscreenIntegrator(mockCanvas, mockConfig, eventBus);
        
        let eventReceived = false;
        eventBus.on('engine:fullscreen-changed', (data) => {
            expect(data.isFullscreen).toBe(true);
            eventReceived = true;
        });
        
        integrator.handleFullscreenChange({
            isFullscreen: true,
            dimensions: { width: 1920, height: 1080 }
        });
        
        setTimeout(() => {
            expect(integrator.integrationState.fullscreenEnabled).toBe(true);
            expect(eventReceived).toBe(true);
            done();
            afterEach();
        }, 50);
    });

    testFramework.test('debe manejar redimensionamiento de canvas', (done) => {
        beforeEach();
        
        integrator = new FullscreenIntegrator(mockCanvas, mockConfig, eventBus);
        
        let eventReceived = false;
        eventBus.on('engine:canvas-resized', (data) => {
            expect(data.dimensions).toBeDefined();
            eventReceived = true;
        });
        
        integrator.handleCanvasResize({
            dimensions: { width: 1600, height: 900 },
            viewport: { width: 1600, height: 900 }
        });
        
        setTimeout(() => {
            expect(integrator.renderer.handleResize.calls.length).toBe(1);
            expect(eventReceived).toBe(true);
            done();
            afterEach();
        }, 50);
    });

    testFramework.test('debe manejar cambio de dispositivo', (done) => {
        beforeEach();
        
        integrator = new FullscreenIntegrator(mockCanvas, mockConfig, eventBus);
        
        let eventReceived = false;
        eventBus.on('engine:device-changed', (data) => {
            expect(data.newType).toBe('mobile');
            eventReceived = true;
        });
        
        integrator.handleDeviceChange({
            oldState: { type: 'desktop' },
            newState: { type: 'mobile' }
        });
        
        setTimeout(() => {
            expect(integrator.integrationState.deviceType).toBe('mobile');
            expect(eventReceived).toBe(true);
            done();
            afterEach();
        }, 50);
    });

    testFramework.test('debe manejar cambio de calidad', (done) => {
        beforeEach();
        
        integrator = new FullscreenIntegrator(mockCanvas, mockConfig, eventBus);
        
        let eventReceived = false;
        eventBus.on('engine:quality-changed', (data) => {
            expect(data.newQuality).toBe('low');
            eventReceived = true;
        });
        
        integrator.handleQualityChange({
            oldQuality: 'high',
            newQuality: 'low',
            config: { scale: 0.8 }
        });
        
        setTimeout(() => {
            expect(integrator.integrationState.currentQuality).toBe('low');
            expect(integrator.renderer.setQuality.calls.length).toBe(1);
            expect(eventReceived).toBe(true);
            done();
            afterEach();
        }, 50);
    });

    testFramework.test('debe habilitar/deshabilitar fullscreen', async () => {
        beforeEach();
        
        // Mock del método enableFullscreen
        mockCanvas.requestFullscreen = createMock(() => Promise.resolve());
        
        integrator = new FullscreenIntegrator(mockCanvas, mockConfig, eventBus);
        
        const result = await integrator.setFullscreen(true);
        expect(result).toBe(true);
        
        afterEach();
    });

    testFramework.test('debe alternar fullscreen', async () => {
        beforeEach();
        
        // Mock de métodos fullscreen
        mockCanvas.requestFullscreen = createMock(() => Promise.resolve());
        global.document.exitFullscreen = createMock(() => Promise.resolve());
        
        integrator = new FullscreenIntegrator(mockCanvas, mockConfig, eventBus);
        
        const result = await integrator.toggleFullscreen();
        expect(result).toBe(true);
        
        afterEach();
    });

    testFramework.test('debe obtener estado del sistema', () => {
        beforeEach();
        
        integrator = new FullscreenIntegrator(mockCanvas, mockConfig, eventBus);
        
        const state = integrator.getSystemState();
        
        expect(state).toHaveProperty('fullscreenEnabled');
        expect(state).toHaveProperty('currentQuality');
        expect(state).toHaveProperty('deviceType');
        expect(state).toHaveProperty('orientation');
        expect(state).toHaveProperty('components');
        expect(state).toHaveProperty('viewport');
        expect(state).toHaveProperty('performance');
        expect(state).toHaveProperty('memory');
        
        afterEach();
    });

    testFramework.test('debe obtener estado de componentes', () => {
        beforeEach();
        
        integrator = new FullscreenIntegrator(mockCanvas, mockConfig, eventBus);
        
        const componentStatus = integrator.getComponentStatus();
        
        expect(componentStatus).toHaveProperty('fullscreenManager');
        expect(componentStatus).toHaveProperty('viewportManager');
        expect(componentStatus).toHaveProperty('responsiveHandler');
        expect(componentStatus).toHaveProperty('performanceOptimizer');
        expect(componentStatus).toHaveProperty('memoryManager');
        
        expect(componentStatus.fullscreenManager).toBe(true);
        expect(componentStatus.viewportManager).toBe(true);
        expect(componentStatus.responsiveHandler).toBe(true);
        expect(componentStatus.performanceOptimizer).toBe(true);
        expect(componentStatus.memoryManager).toBe(true);
        
        afterEach();
    });

    testFramework.test('debe forzar optimización del sistema', () => {
        beforeEach();
        
        integrator = new FullscreenIntegrator(mockCanvas, mockConfig, eventBus);
        
        // Mock de métodos de optimización
        integrator.performanceOptimizer.forceOptimization = createMock();
        integrator.memoryManager.performCleanup = createMock();
        
        integrator.forceOptimization();
        
        expect(integrator.performanceOptimizer.forceOptimization.calls.length).toBe(1);
        expect(integrator.memoryManager.performCleanup.calls.length).toBe(1);
        
        afterEach();
    });

    testFramework.test('debe aplicar transformaciones de viewport', () => {
        beforeEach();
        
        integrator = new FullscreenIntegrator(mockCanvas, mockConfig, eventBus);
        
        const ctx = mockCanvas.getContext('2d');
        integrator.applyViewportTransforms();
        
        expect(ctx.save.calls.length).toBe(1);
        expect(ctx.translate.calls.length).toBe(1);
        expect(ctx.scale.calls.length).toBe(1);
        
        afterEach();
    });

    testFramework.test('debe manejar ausencia de GameEngine', () => {
        beforeEach();
        
        // Simular ausencia de GameEngine
        global.window.spikepulseApp = null;
        
        integrator = new FullscreenIntegrator(mockCanvas, mockConfig, eventBus);
        
        expect(integrator.gameEngine).toBeNull();
        expect(integrator.renderer).toBeNull();
        expect(integrator.isInitialized).toBe(true); // Debería inicializarse de todos modos
        
        afterEach();
    });

    testFramework.test('debe manejar ausencia de renderer', () => {
        beforeEach();
        
        // Simular GameEngine sin renderer
        global.window.spikepulseApp.gameEngine.modules = new Map();
        
        integrator = new FullscreenIntegrator(mockCanvas, mockConfig, eventBus);
        
        expect(integrator.renderer).toBeNull();
        expect(integrator.isInitialized).toBe(true);
        
        afterEach();
    });

    testFramework.test('debe destruirse correctamente', () => {
        beforeEach();
        
        integrator = new FullscreenIntegrator(mockCanvas, mockConfig, eventBus);
        
        expect(integrator.isInitialized).toBe(true);
        expect(integrator.fullscreenManager).toBeDefined();
        
        integrator.destroy();
        
        expect(integrator.isInitialized).toBe(false);
        expect(integrator.fullscreenManager).toBeNull();
        expect(integrator.viewportManager).toBeNull();
        expect(integrator.responsiveHandler).toBeNull();
        expect(integrator.performanceOptimizer).toBeNull();
        expect(integrator.memoryManager).toBeNull();
        
        afterEach();
    });

    testFramework.test('debe configurar canvas inicial correctamente', () => {
        beforeEach();
        
        integrator = new FullscreenIntegrator(mockCanvas, mockConfig, eventBus);
        
        // El canvas debería haberse configurado con las dimensiones del viewport
        expect(mockCanvas.width).toBeGreaterThan(0);
        expect(mockCanvas.height).toBeGreaterThan(0);
        
        afterEach();
    });

    testFramework.test('debe manejar eventos de módulos cargados', () => {
        beforeEach();
        
        integrator = new FullscreenIntegrator(mockCanvas, mockConfig, eventBus);
        
        // Simular carga de renderer
        const mockRenderer = {
            render: createMock(),
            handleResize: createMock()
        };
        
        integrator.handleModuleLoaded({
            name: 'renderer',
            instance: mockRenderer
        });
        
        expect(integrator.renderer).toBe(mockRenderer);
        
        afterEach();
    });
});