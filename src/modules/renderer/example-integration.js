/**
 * Ejemplo de integración del FullscreenCanvasManager en el sistema actual
 * Este archivo muestra cómo usar el FullscreenCanvasManager migrado
 */

import { FullscreenCanvasManager } from './FullscreenCanvasManager.js';

/**
 * Ejemplo de integración básica (sin EventBus)
 */
function basicIntegration() {
    console.log('=== Integración Básica del FullscreenCanvasManager ===');
    
    // Obtener canvas existente del sistema actual
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        console.error('No se encontró canvas en el DOM');
        return null;
    }
    
    // Configuración básica
    const config = {
        canvas: {
            minWidth: 320,
            minHeight: 240,
            maxWidth: 1920,
            maxHeight: 1080,
            aspectRatio: 16/9,
            maintainAspectRatio: true,
            scalingMode: 'fit',
            backgroundColor: '#000000'
        }
    };
    
    // Crear instancia sin EventBus
    const canvasManager = new FullscreenCanvasManager(canvas, config);
    
    console.log('Canvas manager inicializado');
    console.log('Dimensiones actuales:', canvasManager.getDimensions());
    console.log('Estado:', canvasManager.getStatus());
    
    // Configurar controles básicos
    setupBasicControls(canvasManager);
    
    return canvasManager;
}

/**
 * Ejemplo de integración avanzada con EventBus simulado
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
            console.log(`[EventBus] Emitiendo evento: ${event}`, data);
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
    
    // Obtener canvas
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        console.error('No se encontró canvas en el DOM');
        return null;
    }
    
    // Configuración avanzada
    const config = {
        canvas: {
            minWidth: 320,
            minHeight: 240,
            maxWidth: 3840,
            maxHeight: 2160,
            aspectRatio: 16/9,
            maintainAspectRatio: true,
            scalingMode: 'fit',
            backgroundColor: '#000000',
            pixelRatio: window.devicePixelRatio || 1
        }
    };
    
    // Crear instancia con EventBus
    const canvasManager = new FullscreenCanvasManager(canvas, config, mockEventBus);
    
    // Configurar listeners de eventos
    setupEventListeners(mockEventBus, canvasManager);
    
    // Configurar controles avanzados
    setupAdvancedControls(canvasManager, mockEventBus);
    
    return { canvasManager, eventBus: mockEventBus };
}

/**
 * Configurar controles básicos
 * @param {FullscreenCanvasManager} canvasManager - Manager del canvas
 */
function setupBasicControls(canvasManager) {
    // Buscar botón de fullscreen existente o crear uno
    let fullscreenBtn = document.querySelector('[data-action="fullscreen"]');
    
    if (!fullscreenBtn) {
        // Crear botón si no existe
        fullscreenBtn = document.createElement('button');
        fullscreenBtn.textContent = '⛶ Pantalla Completa';
        fullscreenBtn.className = 'control-btn';
        fullscreenBtn.style.position = 'fixed';
        fullscreenBtn.style.top = '20px';
        fullscreenBtn.style.right = '20px';
        fullscreenBtn.style.zIndex = '1000';
        document.body.appendChild(fullscreenBtn);
    }
    
    // Configurar evento de fullscreen
    fullscreenBtn.addEventListener('click', async () => {
        const success = await canvasManager.toggleFullscreen();
        if (success) {
            fullscreenBtn.textContent = canvasManager.isFullscreen ? '⛶ Salir' : '⛶ Pantalla Completa';
        }
    });
    
    // Mostrar información de dimensiones
    const showDimensionsInfo = () => {
        const dimensions = canvasManager.getDimensions();
        console.log('Dimensiones actualizadas:', {
            canvas: `${dimensions.width}x${dimensions.height}`,
            scaled: `${dimensions.scaledWidth}x${dimensions.scaledHeight}`,
            scale: dimensions.scale,
            viewport: `${dimensions.viewport.width}x${dimensions.viewport.height}`,
            isFullscreen: dimensions.isFullscreen
        });
    };
    
    // Mostrar info inicial
    showDimensionsInfo();
    
    // Actualizar info cuando cambie el tamaño
    window.addEventListener('resize', () => {
        setTimeout(showDimensionsInfo, 200);
    });
}

/**
 * Configurar listeners de eventos avanzados
 * @param {Object} eventBus - Bus de eventos
 * @param {FullscreenCanvasManager} canvasManager - Manager del canvas
 */
function setupEventListeners(eventBus, canvasManager) {
    // Listener para inicialización
    eventBus.on('fullscreen:initialized', (data) => {
        console.log('✅ FullscreenCanvasManager inicializado:', data);
    });
    
    // Listener para cambios de fullscreen
    eventBus.on('fullscreen:changed', (data) => {
        console.log(`🖥️ Fullscreen ${data.isFullscreen ? 'activado' : 'desactivado'}:`, data);
        
        // Actualizar UI
        const btn = document.querySelector('[data-action="fullscreen"]');
        if (btn) {
            btn.textContent = data.isFullscreen ? '⛶ Salir' : '⛶ Pantalla Completa';
        }
    });
    
    // Listener para redimensionamiento
    eventBus.on('fullscreen:resized', (data) => {
        console.log('📐 Canvas redimensionado:', {
            dimensions: `${data.dimensions.width}x${data.dimensions.height}`,
            scale: data.dimensions.scale,
            viewport: `${data.viewport.width}x${data.viewport.height}`
        });
    });
    
    // Listener para cambios de orientación
    eventBus.on('fullscreen:orientation-changed', (data) => {
        console.log('🔄 Orientación cambiada:', {
            orientation: data.orientation,
            dimensions: data.dimensions
        });
    });
    
    // Listener para errores
    eventBus.on('fullscreen:error', (data) => {
        console.error('❌ Error en FullscreenCanvasManager:', data);
    });
    
    // Listeners del ViewportManager
    eventBus.on('viewport:initialized', (data) => {
        console.log('✅ ViewportManager inicializado:', data);
    });
    
    eventBus.on('viewport:changed', (data) => {
        console.log('📱 Viewport cambiado:', {
            old: `${data.oldViewport.width}x${data.oldViewport.height}`,
            new: `${data.newViewport.width}x${data.newViewport.height}`,
            orientation: data.newViewport.orientation
        });
    });
    
    eventBus.on('viewport:dimensions-calculated', (data) => {
        console.log('🧮 Dimensiones calculadas:', {
            dimensions: data.dimensions,
            calculationTime: `${data.calculationTime.toFixed(2)}ms`
        });
    });
}

/**
 * Configurar controles avanzados
 * @param {FullscreenCanvasManager} canvasManager - Manager del canvas
 * @param {Object} eventBus - Bus de eventos
 */
function setupAdvancedControls(canvasManager, eventBus) {
    // Crear panel de controles
    const controlPanel = document.createElement('div');
    controlPanel.style.cssText = `
        position: fixed;
        top: 60px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        z-index: 1000;
        min-width: 200px;
    `;
    
    // Botón de fullscreen
    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.textContent = '⛶ Toggle Fullscreen';
    fullscreenBtn.style.cssText = 'width: 100%; margin: 2px 0; padding: 5px;';
    fullscreenBtn.onclick = () => canvasManager.toggleFullscreen();
    
    // Botón de forzar resize
    const resizeBtn = document.createElement('button');
    resizeBtn.textContent = '📐 Force Resize';
    resizeBtn.style.cssText = 'width: 100%; margin: 2px 0; padding: 5px;';
    resizeBtn.onclick = () => eventBus.emit('canvas:resize');
    
    // Selector de modo de escalado
    const scalingSelect = document.createElement('select');
    scalingSelect.style.cssText = 'width: 100%; margin: 2px 0; padding: 5px;';
    ['fit', 'fill', 'stretch'].forEach(mode => {
        const option = document.createElement('option');
        option.value = mode;
        option.textContent = mode.toUpperCase();
        option.selected = canvasManager.canvasConfig.scalingMode === mode;
        scalingSelect.appendChild(option);
    });
    
    scalingSelect.onchange = () => {
        eventBus.emit('canvas:update-config', {
            canvas: { scalingMode: scalingSelect.value }
        });
    };
    
    // Checkbox para mantener aspect ratio
    const aspectRatioCheckbox = document.createElement('input');
    aspectRatioCheckbox.type = 'checkbox';
    aspectRatioCheckbox.checked = canvasManager.canvasConfig.maintainAspectRatio;
    aspectRatioCheckbox.onchange = () => {
        eventBus.emit('canvas:update-config', {
            canvas: { maintainAspectRatio: aspectRatioCheckbox.checked }
        });
    };
    
    const aspectRatioLabel = document.createElement('label');
    aspectRatioLabel.appendChild(aspectRatioCheckbox);
    aspectRatioLabel.appendChild(document.createTextNode(' Mantener Aspect Ratio'));
    aspectRatioLabel.style.cssText = 'display: block; margin: 5px 0;';
    
    // Información en tiempo real
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = 'margin-top: 10px; font-size: 10px; line-height: 1.3;';
    
    const updateInfo = () => {
        const status = canvasManager.getStatus();
        const viewport = status.viewport;
        
        infoDiv.innerHTML = `
            <strong>Canvas:</strong> ${status.dimensions.width}×${status.dimensions.height}<br>
            <strong>Scaled:</strong> ${status.dimensions.scaledWidth}×${status.dimensions.scaledHeight}<br>
            <strong>Scale:</strong> ${status.dimensions.scale.toFixed(3)}<br>
            <strong>Viewport:</strong> ${viewport.viewport.width}×${viewport.viewport.height}<br>
            <strong>Device:</strong> ${viewport.device.breakpoint}<br>
            <strong>PixelRatio:</strong> ${viewport.viewport.pixelRatio}<br>
            <strong>Fullscreen:</strong> ${status.isFullscreen ? 'Sí' : 'No'}<br>
            <strong>Performance:</strong><br>
            &nbsp;&nbsp;Resizes: ${status.performance.resizeCount}<br>
            &nbsp;&nbsp;Avg Time: ${status.performance.averageResizeTime.toFixed(2)}ms<br>
            &nbsp;&nbsp;Cache Hit Rate: ${viewport.performance.cacheHitRate.toFixed(1)}%
        `;
    };
    
    // Actualizar info cada segundo
    updateInfo();
    setInterval(updateInfo, 1000);
    
    // Ensamblar panel
    controlPanel.appendChild(document.createTextNode('Canvas Controls'));
    controlPanel.appendChild(document.createElement('hr'));
    controlPanel.appendChild(fullscreenBtn);
    controlPanel.appendChild(resizeBtn);
    controlPanel.appendChild(document.createTextNode('Scaling Mode:'));
    controlPanel.appendChild(scalingSelect);
    controlPanel.appendChild(aspectRatioLabel);
    controlPanel.appendChild(infoDiv);
    
    document.body.appendChild(controlPanel);
}

/**
 * Ejemplo de uso de conversión de coordenadas
 */
function coordinateConversionExample() {
    console.log('=== Ejemplo de Conversión de Coordenadas ===');
    
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        console.error('No se encontró canvas');
        return;
    }
    
    const canvasManager = new FullscreenCanvasManager(canvas);
    
    // Ejemplo de conversión de coordenadas
    const testCoordinates = [
        { screen: { x: 100, y: 100 } },
        { screen: { x: 400, y: 200 } },
        { screen: { x: 800, y: 400 } }
    ];
    
    console.log('Conversiones de coordenadas:');
    testCoordinates.forEach((test, index) => {
        const gameCoords = canvasManager.screenToGame(test.screen.x, test.screen.y);
        const backToScreen = canvasManager.gameToScreen(gameCoords.x, gameCoords.y);
        
        console.log(`Test ${index + 1}:`);
        console.log(`  Pantalla: (${test.screen.x}, ${test.screen.y})`);
        console.log(`  Juego: (${gameCoords.x}, ${gameCoords.y}) - En bounds: ${gameCoords.isInBounds}`);
        console.log(`  De vuelta: (${backToScreen.x}, ${backToScreen.y})`);
    });
    
    // Configurar listener de mouse para pruebas en tiempo real
    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        const screenX = event.clientX - rect.left;
        const screenY = event.clientY - rect.top;
        
        const gameCoords = canvasManager.screenToGame(screenX, screenY);
        
        // Mostrar coordenadas en el título del canvas
        canvas.title = `Screen: (${screenX}, ${screenY}) | Game: (${gameCoords.x}, ${gameCoords.y})`;
    });
    
    return canvasManager;
}

/**
 * Función principal para ejecutar todos los ejemplos
 */
function runAllExamples() {
    console.log('🖥️ Iniciando ejemplos de FullscreenCanvasManager...\n');
    
    try {
        // Ejemplo básico
        const basicManager = basicIntegration();
        console.log('\n');
        
        // Ejemplo avanzado
        const { canvasManager: advancedManager } = advancedIntegration();
        console.log('\n');
        
        // Ejemplo de coordenadas
        const coordManager = coordinateConversionExample();
        console.log('\n');
        
        console.log('✅ Todos los ejemplos ejecutados correctamente');
        
        // Limpiar recursos después de 30 segundos
        setTimeout(() => {
            console.log('🧹 Limpiando recursos...');
            if (basicManager) basicManager.destroy();
            if (advancedManager) advancedManager.destroy();
            if (coordManager) coordManager.destroy();
            console.log('✅ Recursos limpiados');
        }, 30000);
        
    } catch (error) {
        console.error('❌ Error ejecutando ejemplos:', error);
    }
}

// Exportar funciones para uso externo
export {
    basicIntegration,
    advancedIntegration,
    coordinateConversionExample,
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