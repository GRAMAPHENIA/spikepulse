/**
 * Tests unitarios para NoirThemeManager
 * Valida la funcionalidad del sistema de temas noir
 */

import { testFramework, expect, createMock } from './TestFramework.js';
import { DOMSetup } from './DOMSetup.js';
import { NoirThemeManager } from '../src/modules/themes/NoirThemeManager.js';
import { EventBus } from '../src/core/EventBus.js';

// Variables globales para los tests
let themeManager;
let eventBus;
let mockConfig;

// Función de setup para cada test
function setupTest() {
    // Resetear DOM
    DOMSetup.reset();
    
    // Configurar DOM mock
    document.body.innerHTML = `
        <div id="gameCanvas"></div>
        <button class="spikepulse-btn">Test Button</button>
        <div class="spikepulse-screen">Test Screen</div>
    `;
    
    // Configurar mock de documentElement.style
    const originalSetProperty = document.documentElement.style.setProperty;
    const originalRemoveProperty = document.documentElement.style.removeProperty;
    
    document.documentElement.style.setProperty = createMock();
    document.documentElement.style.removeProperty = createMock();
    
    // Crear EventBus
    eventBus = new EventBus();
    
    // Configuración mock
    mockConfig = {
        theme: {
            noir: {
                enabled: true,
                intensity: 1.0
            }
        }
    };
    
    // Crear instancia del theme manager
    themeManager = new NoirThemeManager(mockConfig, eventBus);
    
    return { originalSetProperty, originalRemoveProperty };
}

// Función de cleanup para cada test
function cleanupTest(originalMethods = {}) {
    if (themeManager) {
        themeManager.destroy();
        themeManager = null;
    }
    
    // Limpiar DOM
    DOMSetup.cleanup();
    
    // Restaurar métodos originales si se proporcionan
    if (originalMethods.originalSetProperty) {
        document.documentElement.style.setProperty = originalMethods.originalSetProperty;
    }
    if (originalMethods.originalRemoveProperty) {
        document.documentElement.style.removeProperty = originalMethods.originalRemoveProperty;
    }
}
    
testFramework.describe('NoirThemeManager - Inicialización', () => {
    testFramework.test('debería inicializarse correctamente', () => {
        const originalMethods = setupTest();
        
        try {
            expect(themeManager.isInitialized).toBe(true);
            expect(themeManager.currentTheme).toBe('noir');
            expect(themeManager.noirPalette).toBeDefined();
        } finally {
            cleanupTest(originalMethods);
        }
    });
    
    testFramework.test('debería emitir evento de inicialización', async () => {
        const originalMethods = setupTest();
        
        try {
            // Crear nueva instancia para capturar evento
            const newEventBus = new EventBus();
            let eventReceived = false;
            let eventData = null;
            
            newEventBus.on('theme:noir-initialized', (data) => {
                eventReceived = true;
                eventData = data;
            });
            
            const newThemeManager = new NoirThemeManager(mockConfig, newEventBus);
            
            // Esperar un poco para que se emita el evento
            await new Promise(resolve => setTimeout(resolve, 10));
            
            expect(eventReceived).toBe(true);
            expect(eventData.theme).toBe('noir');
            expect(eventData.palette).toBeDefined();
            
            newThemeManager.destroy();
        } finally {
            cleanupTest(originalMethods);
        }
    });
    
    testFramework.test('debería configurar event listeners', () => {
        const originalMethods = setupTest();
        
        try {
            // Verificar que el eventBus tiene los listeners configurados
            const listeners = eventBus.listeners;
            expect(listeners.has('config:theme-changed')).toBe(true);
            expect(listeners.has('theme:change-requested')).toBe(true);
            expect(listeners.has('state:change')).toBe(true);
        } finally {
            cleanupTest(originalMethods);
        }
    });
});
    
testFramework.describe('NoirThemeManager - Aplicación de tema noir', () => {
    testFramework.test('debería aplicar tema noir correctamente', () => {
        const originalMethods = setupTest();
        
        try {
            themeManager.applyNoirTheme();
            
            expect(themeManager.currentTheme).toBe('noir');
            expect(document.body.classList.contains('spikepulse-noir-theme')).toBe(true);
        } finally {
            cleanupTest(originalMethods);
        }
    });
    
    testFramework.test('debería aplicar variables CSS noir', () => {
        const originalMethods = setupTest();
        
        try {
            themeManager.applyNoirTheme();
            
            // Verificar que se llamó setProperty con variables noir
            expect(document.documentElement.style.setProperty.calls.length).toBeGreaterThan(0);
            
            // Verificar que al menos una llamada fue con una variable noir
            const noirVariableCalls = document.documentElement.style.setProperty.calls.filter(call => 
                call[0] && call[0].includes('--sp-noir-')
            );
            expect(noirVariableCalls.length).toBeGreaterThan(0);
        } finally {
            cleanupTest(originalMethods);
        }
    });
    
    testFramework.test('debería aplicar efectos noir al DOM', () => {
        const originalMethods = setupTest();
        
        try {
            themeManager.applyNoirTheme();
            
            const canvas = document.getElementById('gameCanvas');
            const button = document.querySelector('.spikepulse-btn');
            const screen = document.querySelector('.spikepulse-screen');
            
            expect(canvas.classList.contains('spikepulse-noir-canvas')).toBe(true);
            expect(button.classList.contains('spikepulse-noir-button')).toBe(true);
            expect(screen.classList.contains('spikepulse-noir-screen')).toBe(true);
        } finally {
            cleanupTest(originalMethods);
        }
    });
    
    testFramework.test('debería emitir evento de tema aplicado', async () => {
        const originalMethods = setupTest();
        
        try {
            let eventReceived = false;
            let eventData = null;
            
            eventBus.on('theme:noir-applied', (data) => {
                eventReceived = true;
                eventData = data;
            });
            
            themeManager.applyNoirTheme();
            
            // Esperar un poco para que se emita el evento
            await new Promise(resolve => setTimeout(resolve, 10));
            
            expect(eventReceived).toBe(true);
            expect(eventData.theme).toBe('noir');
            expect(eventData.palette).toBeDefined();
        } finally {
            cleanupTest(originalMethods);
        }
    });
});
    
testFramework.describe('NoirThemeManager - Gestión de colores', () => {
    testFramework.test('debería obtener color de la paleta', () => {
        const originalMethods = setupTest();
        
        try {
            const color = themeManager.getColor('black');
            expect(color).toBe('#000000');
        } finally {
            cleanupTest(originalMethods);
        }
    });
    
    testFramework.test('debería obtener paleta completa', () => {
        const originalMethods = setupTest();
        
        try {
            const palette = themeManager.getThemeColors();
            
            expect(palette).toBeDefined();
            expect(palette.base).toBeDefined();
            expect(palette.transparencies).toBeDefined();
            expect(palette.highlights).toBeDefined();
            expect(palette.gradients).toBeDefined();
        } finally {
            cleanupTest(originalMethods);
        }
    });
});

testFramework.describe('NoirThemeManager - Preparación para transición de colores', () => {
    testFramework.test('debería preparar sistema para transición', () => {
        const originalMethods = setupTest();
        
        try {
            themeManager.prepareColorTransition();
            
            // Verificar que se llamaron las variables de futuro
            const futureCalls = document.documentElement.style.setProperty.calls.filter(call => 
                call[0] && call[0].includes('--sp-future-')
            );
            expect(futureCalls.length).toBeGreaterThan(0);
        } finally {
            cleanupTest(originalMethods);
        }
    });
    
    testFramework.test('debería marcar body como preparado para transición', () => {
        const originalMethods = setupTest();
        
        try {
            themeManager.prepareColorTransition();
            
            expect(document.body.getAttribute('data-color-transition-ready')).toBe('true');
        } finally {
            cleanupTest(originalMethods);
        }
    });
});

testFramework.describe('NoirThemeManager - Manejo de eventos', () => {
    testFramework.test('debería manejar cambio de configuración de tema', () => {
        const originalMethods = setupTest();
        
        try {
            // Crear un mock para verificar que se llama applyNoirTheme
            let applyNoirThemeCalled = false;
            const originalApply = themeManager.applyNoirTheme;
            themeManager.applyNoirTheme = () => {
                applyNoirThemeCalled = true;
                originalApply.call(themeManager);
            };
            
            eventBus.emit('config:theme-changed', { theme: 'noir' });
            
            expect(applyNoirThemeCalled).toBe(true);
            
            // Restaurar método original
            themeManager.applyNoirTheme = originalApply;
        } finally {
            cleanupTest(originalMethods);
        }
    });
});

testFramework.describe('NoirThemeManager - Estadísticas y destrucción', () => {
    testFramework.test('debería devolver estadísticas correctas', () => {
        const originalMethods = setupTest();
        
        try {
            const stats = themeManager.getStats();
            
            expect(stats.isInitialized).toBe(true);
            expect(stats.currentTheme).toBe('noir');
            expect(stats.isTransitioning).toBe(false);
            expect(typeof stats.appliedVariablesCount).toBe('number');
            expect(typeof stats.observedElementsCount).toBe('number');
            expect(stats.paletteStats).toBeDefined();
        } finally {
            cleanupTest(originalMethods);
        }
    });
    
    testFramework.test('debería limpiar recursos correctamente', () => {
        const originalMethods = setupTest();
        
        try {
            // Aplicar tema primero para tener variables que limpiar
            themeManager.applyNoirTheme();
            
            themeManager.destroy();
            
            expect(document.documentElement.style.removeProperty.calls.length).toBeGreaterThan(0);
            expect(themeManager.isInitialized).toBe(false);
        } finally {
            cleanupTest(originalMethods);
        }
    });
});