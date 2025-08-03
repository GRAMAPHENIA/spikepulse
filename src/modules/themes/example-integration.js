/**
 * Ejemplo de integración del NoirThemeManager en el sistema actual
 * Este archivo muestra cómo usar el NoirThemeManager migrado
 */

import { NoirThemeManager } from './NoirThemeManager.js';

/**
 * Ejemplo de integración básica (sin EventBus)
 */
function basicIntegration() {
    console.log('=== Integración Básica del NoirThemeManager ===');
    
    // Crear instancia sin EventBus (funciona de forma independiente)
    const themeManager = new NoirThemeManager();
    
    // El tema noir se aplica automáticamente al crear la instancia
    console.log('Tema aplicado automáticamente');
    
    // Obtener colores específicos
    const playerColor = themeManager.getColor('player');
    const backgroundColor = themeManager.getColor('background');
    
    console.log('Color del jugador:', playerColor);
    console.log('Color de fondo:', backgroundColor);
    
    // Obtener gradientes
    const dramaticGradient = themeManager.getGradient('dramaticContrast');
    console.log('Gradiente dramático:', dramaticGradient);
    
    // Obtener efectos
    const shadowEffect = themeManager.getEffect('dramaticShadow');
    console.log('Efecto de sombra:', shadowEffect);
    
    // Ver estadísticas
    console.log('Estadísticas:', themeManager.getStats());
    
    return themeManager;
}

/**
 * Ejemplo de integración con EventBus simulado
 */
function advancedIntegration() {
    console.log('=== Integración Avanzada con EventBus ===');
    
    // Simular un EventBus básico
    const mockEventBus = {
        listeners: new Map(),
        
        on(event, callback) {
            if (!this.listeners.has(event)) {
                this.listeners.set(event, []);
            }
            this.listeners.get(event).push(callback);
        },
        
        off(event, callback) {
            if (this.listeners.has(event)) {
                const callbacks = this.listeners.get(event);
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        },
        
        emit(event, data) {
            if (this.listeners.has(event)) {
                this.listeners.get(event).forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error('Error en callback:', error);
                    }
                });
            }
        }
    };
    
    // Crear configuración personalizada
    const config = {
        theme: {
            enhanceOnGameplay: true,
            dramaticEffectsOnGameOver: true
        }
    };
    
    // Crear instancia con EventBus
    const themeManager = new NoirThemeManager(config, mockEventBus);
    
    // Simular cambios de estado del juego
    setTimeout(() => {
        console.log('Simulando inicio de juego...');
        mockEventBus.emit('state:change', { to: 'playing' });
    }, 1000);
    
    setTimeout(() => {
        console.log('Simulando game over...');
        mockEventBus.emit('state:change', { to: 'gameOver' });
    }, 3000);
    
    setTimeout(() => {
        console.log('Simulando vuelta al menú...');
        mockEventBus.emit('state:change', { to: 'menu' });
    }, 6000);
    
    return { themeManager, eventBus: mockEventBus };
}

/**
 * Ejemplo de uso de la paleta completa
 */
function paletteUsageExample() {
    console.log('=== Ejemplo de Uso de Paleta ===');
    
    const themeManager = new NoirThemeManager();
    const palette = themeManager.getThemeColors();
    
    // Mostrar estructura de la paleta
    console.log('Estructura de la paleta:');
    Object.keys(palette).forEach(section => {
        console.log(`- ${section}:`, Object.keys(palette[section]).length, 'elementos');
    });
    
    // Ejemplos de uso en CSS programático
    const canvas = document.querySelector('canvas');
    if (canvas) {
        // Aplicar estilo noir al canvas
        canvas.style.background = themeManager.getGradient('background');
        canvas.style.border = `1px solid ${themeManager.getColor('darkGray')}`;
        canvas.style.boxShadow = themeManager.getEffect('dramaticShadow');
    }
    
    // Aplicar estilos a botones
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.style.borderColor = themeManager.getColor('mediumGray');
        button.style.transition = 'all 0.3s ease';
        
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = themeManager.getColor('white');
            button.style.color = themeManager.getColor('black');
            button.style.boxShadow = themeManager.getEffect('lightShadow');
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'transparent';
            button.style.color = themeManager.getColor('white');
            button.style.boxShadow = 'none';
        });
    });
    
    return palette;
}

/**
 * Ejemplo de manejo de errores y recuperación
 */
function errorHandlingExample() {
    console.log('=== Ejemplo de Manejo de Errores ===');
    
    const themeManager = new NoirThemeManager();
    
    // Simular error intentando obtener color inexistente
    const invalidColor = themeManager.getColor('colorInexistente');
    console.log('Color inexistente (fallback):', invalidColor);
    
    // Simular error con gradiente inexistente
    const invalidGradient = themeManager.getGradient('gradienteInexistente');
    console.log('Gradiente inexistente (fallback):', invalidGradient);
    
    // Mostrar estadísticas después de errores
    console.log('Estadísticas después de errores:', themeManager.getStats());
    
    return themeManager;
}

/**
 * Función principal para ejecutar todos los ejemplos
 */
function runAllExamples() {
    console.log('🎨 Iniciando ejemplos de NoirThemeManager...\n');
    
    try {
        // Ejemplo básico
        const basicManager = basicIntegration();
        console.log('\n');
        
        // Ejemplo avanzado
        const { themeManager: advancedManager } = advancedIntegration();
        console.log('\n');
        
        // Ejemplo de paleta
        const palette = paletteUsageExample();
        console.log('\n');
        
        // Ejemplo de manejo de errores
        const errorManager = errorHandlingExample();
        console.log('\n');
        
        console.log('✅ Todos los ejemplos ejecutados correctamente');
        
        // Limpiar recursos después de 10 segundos
        setTimeout(() => {
            console.log('🧹 Limpiando recursos...');
            basicManager.destroy();
            advancedManager.destroy();
            errorManager.destroy();
            console.log('✅ Recursos limpiados');
        }, 10000);
        
    } catch (error) {
        console.error('❌ Error ejecutando ejemplos:', error);
    }
}

// Exportar funciones para uso externo
export {
    basicIntegration,
    advancedIntegration,
    paletteUsageExample,
    errorHandlingExample,
    runAllExamples
};

// Si se ejecuta directamente, correr todos los ejemplos
if (typeof window !== 'undefined' && window.location) {
    // En el navegador, esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAllExamples);
    } else {
        runAllExamples();
    }
}