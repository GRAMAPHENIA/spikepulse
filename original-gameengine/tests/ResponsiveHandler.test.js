/**
 * Tests unitarios para ResponsiveHandler
 */

import { testFramework, expect, createMock } from './TestFramework.js';
import { ResponsiveHandler } from '../src/modules/renderer/ResponsiveHandler.js';
import { EventBus } from '../src/core/EventBus.js';

testFramework.describe('ResponsiveHandler', () => {
    let handler;
    let eventBus;
    let mockConfig;
    let originalWindow;
    let originalDocument;
    let originalScreen;

    function beforeEach() {
        // Guardar referencias originales
        originalWindow = global.window;
        originalDocument = global.document;
        originalScreen = global.screen;
        
        // Mock de window
        global.window = {
            innerWidth: 1920,
            innerHeight: 1080,
            devicePixelRatio: 1,
            addEventListener: createMock(),
            removeEventListener: createMock()
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
            getElementById: createMock(() => null)
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
            msMaxTouchPoints: 0
        };
        
        eventBus = new EventBus();
        
        mockConfig = {
            breakpoints: {
                mobile: 768,
                tablet: 1024,
                desktop: 1440
            },
            touchOptimization: true,
            adaptiveUI: true,
            orientationHandling: true
        };
    }

    function afterEach() {
        if (handler) {
            handler.destroy();
            handler = null;
        }
        
        // Restaurar referencias originales
        global.window = originalWindow;
        global.document = originalDocument;
        global.screen = originalScreen;
    }

    testFramework.test('debe inicializarse correctamente', () => {
        beforeEach();
        
        handler = new ResponsiveHandler(mockConfig, eventBus);
        
        expect(handler.isInitialized).toBe(true);
        expect(handler.deviceState.type).toBe('desktop');
        expect(handler.deviceState.width).toBe(1920);
        expect(handler.deviceState.height).toBe(1080);
        
        afterEach();
    });

    testFramework.test('debe detectar dispositivo móvil', () => {
        beforeEach();
        
        global.window.innerWidth = 600;
        global.window.innerHeight = 800;
        
        handler = new ResponsiveHandler(mockConfig, eventBus);
        
        expect(handler.deviceState.type).toBe('mobile');
        expect(handler.isMobile()).toBe(true);
        expect(handler.isTablet()).toBe(false);
        expect(handler.isDesktop()).toBe(false);
        
        afterEach();
    });

    testFramework.test('debe detectar tablet', () => {
        beforeEach();
        
        global.window.innerWidth = 900;
        global.window.innerHeight = 600;
        
        handler = new ResponsiveHandler(mockConfig, eventBus);
        
        expect(handler.deviceState.type).toBe('tablet');
        expect(handler.isMobile()).toBe(false);
        expect(handler.isTablet()).toBe(true);
        expect(handler.isDesktop()).toBe(false);
        
        afterEach();
    });

    testFramework.test('debe detectar soporte táctil', () => {
        beforeEach();
        
        // Simular dispositivo con touch
        global.navigator.maxTouchPoints = 5;
        
        handler = new ResponsiveHandler(mockConfig, eventBus);
        
        expect(handler.deviceState.touchSupport).toBe(true);
        expect(handler.isTouchDevice()).toBe(true);
        
        afterEach();
    });

    testFramework.test('debe detectar orientación portrait', () => {
        beforeEach();
        
        global.window.innerWidth = 600;
        global.window.innerHeight = 800;
        global.screen.orientation.type = 'portrait-primary';
        
        handler = new ResponsiveHandler(mockConfig, eventBus);
        
        expect(handler.deviceState.orientation).toBe('portrait');
        expect(handler.isPortrait()).toBe(true);
        expect(handler.isLandscape()).toBe(false);
        
        afterEach();
    });

    testFramework.test('debe detectar orientación landscape', () => {
        beforeEach();
        
        global.window.innerWidth = 800;
        global.window.innerHeight = 600;
        global.screen.orientation.type = 'landscape-primary';
        
        handler = new ResponsiveHandler(mockConfig, eventBus);
        
        expect(handler.deviceState.orientation).toBe('landscape');
        expect(handler.isPortrait()).toBe(false);
        expect(handler.isLandscape()).toBe(true);
        
        afterEach();
    });

    testFramework.test('debe obtener configuración correcta por dispositivo', () => {
        beforeEach();
        
        // Simular móvil
        global.window.innerWidth = 400;
        global.window.innerHeight = 800;
        
        handler = new ResponsiveHandler(mockConfig, eventBus);
        
        const config = handler.getCurrentDeviceConfig();
        
        expect(config.performanceLevel).toBe('low');
        expect(config.touchButtonSize).toBe(60);
        expect(config.maxParticles).toBe(20);
        
        afterEach();
    });

    testFramework.test('debe aplicar optimizaciones de UI', () => {
        beforeEach();
        
        handler = new ResponsiveHandler(mockConfig, eventBus);
        
        const deviceConfig = handler.getCurrentDeviceConfig();
        handler.applyUIOptimizations(deviceConfig);
        
        expect(global.document.documentElement.style.setProperty.calls.length).toBeGreaterThan(0);
        expect(global.document.body.classList.add.calls.length).toBeGreaterThan(0);
        
        afterEach();
    });

    testFramework.test('debe manejar cambio de tamaño con debounce', (done) => {
        beforeEach();
        
        handler = new ResponsiveHandler(mockConfig, eventBus);
        
        let eventCount = 0;
        eventBus.on('responsive:resize', () => {
            eventCount++;
        });
        
        // Simular múltiples eventos de resize
        handler.handleResize();
        handler.handleResize();
        handler.handleResize();
        
        // Verificar que solo se ejecute una vez después del debounce
        setTimeout(() => {
            expect(eventCount).toBe(1);
            done();
            afterEach();
        }, 200);
    });

    testFramework.test('debe actualizar estado del dispositivo', () => {
        beforeEach();
        
        handler = new ResponsiveHandler(mockConfig, eventBus);
        
        const oldType = handler.deviceState.type;
        
        // Cambiar dimensiones para simular cambio a móvil
        global.window.innerWidth = 400;
        global.window.innerHeight = 800;
        
        handler.updateDeviceState();
        
        expect(handler.deviceState.type).toBe('mobile');
        expect(handler.deviceState.type).not.toBe(oldType);
        
        afterEach();
    });

    testFramework.test('debe obtener breakpoint actual', () => {
        beforeEach();
        
        // Simular tablet
        global.window.innerWidth = 900;
        global.window.innerHeight = 600;
        
        handler = new ResponsiveHandler(mockConfig, eventBus);
        
        expect(handler.getCurrentBreakpoint()).toBe('tablet');
        
        afterEach();
    });

    testFramework.test('debe actualizar configuración de dispositivo', () => {
        beforeEach();
        
        handler = new ResponsiveHandler(mockConfig, eventBus);
        
        const newConfig = {
            touchButtonSize: 80,
            performanceLevel: 'ultra'
        };
        
        handler.updateDeviceConfig('mobile', newConfig);
        
        const mobileConfig = handler.deviceConfigs.mobile;
        expect(mobileConfig.touchButtonSize).toBe(80);
        expect(mobileConfig.performanceLevel).toBe('ultra');
        
        afterEach();
    });

    testFramework.test('debe forzar actualización correctamente', () => {
        beforeEach();
        
        handler = new ResponsiveHandler(mockConfig, eventBus);
        
        const originalWidth = handler.deviceState.width;
        
        // Cambiar dimensiones
        global.window.innerWidth = 1200;
        
        handler.forceUpdate();
        
        expect(handler.deviceState.width).toBe(1200);
        expect(handler.deviceState.width).not.toBe(originalWidth);
        
        afterEach();
    });

    testFramework.test('debe retornar estadísticas completas', () => {
        beforeEach();
        
        handler = new ResponsiveHandler(mockConfig, eventBus);
        
        const stats = handler.getStats();
        
        expect(stats).toHaveProperty('isInitialized');
        expect(stats).toHaveProperty('deviceState');
        expect(stats).toHaveProperty('config');
        expect(stats).toHaveProperty('deviceConfigs');
        expect(stats).toHaveProperty('currentDeviceConfig');
        
        afterEach();
    });

    testFramework.test('debe configurar event listeners', () => {
        beforeEach();
        
        handler = new ResponsiveHandler(mockConfig, eventBus);
        
        expect(global.window.addEventListener.calls.length).toBeGreaterThan(0);
        expect(global.document.addEventListener.calls.length).toBeGreaterThan(0);
        
        afterEach();
    });

    testFramework.test('debe destruirse correctamente', () => {
        beforeEach();
        
        handler = new ResponsiveHandler(mockConfig, eventBus);
        
        expect(handler.isInitialized).toBe(true);
        
        handler.destroy();
        
        expect(handler.isInitialized).toBe(false);
        expect(global.window.removeEventListener.calls.length).toBeGreaterThan(0);
        
        afterEach();
    });

    testFramework.test('debe manejar dispositivos sin orientación API', () => {
        beforeEach();
        
        // Simular ausencia de screen.orientation
        global.screen = {};
        
        global.window.innerWidth = 600;
        global.window.innerHeight = 800;
        
        handler = new ResponsiveHandler(mockConfig, eventBus);
        
        // Debe usar fallback basado en dimensiones
        expect(handler.deviceState.orientation).toBe('portrait');
        
        afterEach();
    });

    testFramework.test('debe detectar alta densidad de píxeles', () => {
        beforeEach();
        
        global.window.devicePixelRatio = 3;
        
        handler = new ResponsiveHandler(mockConfig, eventBus);
        
        expect(handler.deviceState.isHighDensity).toBe(true);
        expect(handler.deviceState.pixelRatio).toBe(3);
        
        afterEach();
    });
});