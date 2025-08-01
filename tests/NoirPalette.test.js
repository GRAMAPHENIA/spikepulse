/**
 * Tests unitarios para NoirPalette
 * Valida la funcionalidad de la paleta de colores noir
 */

import { testFramework, expect } from './TestFramework.js';
import { NoirPalette } from '../src/modules/themes/NoirPalette.js';

// Variables globales para los tests
let palette;

// Función de setup para cada test
function setupTest() {
    palette = new NoirPalette();
}

// Función de cleanup para cada test
function cleanupTest() {
    if (palette) {
        palette.destroy();
        palette = null;
    }
}
    
testFramework.describe('NoirPalette - Inicialización', () => {
    testFramework.test('debería inicializarse correctamente', () => {
        setupTest();
        
        try {
            expect(palette.isInitialized).toBe(true);
            expect(palette.palette).toBeDefined();
            expect(palette.colorCache).toBeDefined();
        } finally {
            cleanupTest();
        }
    });
    
    testFramework.test('debería crear paleta noir completa', () => {
        setupTest();
        
        try {
            const paletteData = palette.getPalette();
            
            expect(paletteData.base).toBeDefined();
            expect(paletteData.transparencies).toBeDefined();
            expect(paletteData.highlights).toBeDefined();
            expect(paletteData.gradients).toBeDefined();
            expect(paletteData.effects).toBeDefined();
            expect(paletteData.colorSlots).toBeDefined();
            expect(paletteData.contextual).toBeDefined();
        } finally {
            cleanupTest();
        }
    });
    
    testFramework.test('debería pre-calcular colores comunes', () => {
        setupTest();
        
        try {
            expect(palette.colorCache.size).toBeGreaterThan(0);
        } finally {
            cleanupTest();
        }
    });
});
    
testFramework.describe('NoirPalette - Colores base', () => {
    testFramework.test('debería tener todos los colores base requeridos', () => {
        setupTest();
        
        try {
            const paletteData = palette.getPalette();
            const baseColors = paletteData.base;
            
            expect(baseColors.black).toBe('#000000');
            expect(baseColors.white).toBe('#ffffff');
            expect(baseColors.darkGray).toBeDefined();
            expect(baseColors.mediumGray).toBeDefined();
            expect(baseColors.lightGray).toBeDefined();
            expect(baseColors.warmGray).toBeDefined();
            expect(baseColors.coolGray).toBeDefined();
        } finally {
            cleanupTest();
        }
    });
    
    testFramework.test('debería validar formato de colores hexadecimales', () => {
        setupTest();
        
        try {
            const paletteData = palette.getPalette();
            const baseColors = paletteData.base;
            
            // Verificar algunos colores clave
            expect(baseColors.black).toContain('#');
            expect(baseColors.white).toContain('#');
            expect(baseColors.black.length).toBe(7); // #RRGGBB
            expect(baseColors.white.length).toBe(7);
        } finally {
            cleanupTest();
        }
    });
});
    
testFramework.describe('NoirPalette - Funcionalidad principal', () => {
    testFramework.test('debería tener transparencias noir definidas', () => {
        setupTest();
        
        try {
            const paletteData = palette.getPalette();
            const transparencies = paletteData.transparencies;
            
            expect(transparencies.shadowLight).toBeDefined();
            expect(transparencies.shadowMedium).toBeDefined();
            expect(transparencies.shadowHeavy).toBeDefined();
            expect(transparencies.overlayLight).toBeDefined();
            expect(transparencies.overlayMedium).toBeDefined();
            expect(transparencies.overlayHeavy).toBeDefined();
        } finally {
            cleanupTest();
        }
    });
    
    testFramework.test('debería tener gradientes noir cinematográficos', () => {
        setupTest();
        
        try {
            const paletteData = palette.getPalette();
            const gradients = paletteData.gradients;
            
            expect(gradients.shadowVertical).toBeDefined();
            expect(gradients.dramaticContrast).toBeDefined();
            expect(gradients.filmNoir).toBeDefined();
            
            // Verificar formato básico de gradientes
            expect(gradients.dramaticContrast).toContain('linear-gradient');
        } finally {
            cleanupTest();
        }
    });
    
    testFramework.test('debería tener slots preparados para colores futuros', () => {
        setupTest();
        
        try {
            const paletteData = palette.getPalette();
            const colorSlots = paletteData.colorSlots;
            
            expect(colorSlots.slot1).toBeDefined();
            expect(colorSlots.slot2).toBeDefined();
            expect(colorSlots.slot3).toBeDefined();
            
            // Verificar que son colores hexadecimales
            expect(colorSlots.slot1).toContain('#');
            expect(colorSlots.slot1.length).toBe(7);
        } finally {
            cleanupTest();
        }
    });
    
    testFramework.test('debería obtener color específico', () => {
        setupTest();
        
        try {
            const color = palette.getColor('black');
            expect(color).toBe('#000000');
        } finally {
            cleanupTest();
        }
    });
    
    testFramework.test('debería obtener gradiente específico', () => {
        setupTest();
        
        try {
            const gradient = palette.getGradient('dramaticContrast');
            expect(gradient).toBeDefined();
            expect(gradient).toContain('linear-gradient');
        } finally {
            cleanupTest();
        }
    });
    
    testFramework.test('debería convertir colores correctamente', () => {
        setupTest();
        
        try {
            const rgb = palette.hexToRgb('#808080');
            expect(rgb.r).toBe(128);
            expect(rgb.g).toBe(128);
            expect(rgb.b).toBe(128);
            
            const hex = palette.rgbToHex(128, 128, 128);
            expect(hex).toBe('#808080');
        } finally {
            cleanupTest();
        }
    });
    
    testFramework.test('debería devolver estadísticas correctas', () => {
        setupTest();
        
        try {
            const stats = palette.getStats();
            
            expect(stats.isInitialized).toBe(true);
            expect(typeof stats.totalColors).toBe('number');
            expect(typeof stats.cacheSize).toBe('number');
            expect(stats.sections).toBeDefined();
        } finally {
            cleanupTest();
        }
    });
    
    testFramework.test('debería limpiar recursos correctamente', () => {
        setupTest();
        
        try {
            palette.destroy();
            
            expect(palette.isInitialized).toBe(false);
            expect(palette.colorCache.size).toBe(0);
        } finally {
            // No llamar cleanupTest aquí porque ya destruimos la paleta
        }
    });
});