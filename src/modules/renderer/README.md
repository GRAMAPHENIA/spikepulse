# FullscreenCanvasManager - Sistema Avanzado de Canvas para Spikepulse

## Estado de la Migración ✅

El **FullscreenCanvasManager** ha sido **completamente migrado** desde el GameEngine modular original y adaptado para funcionar con el sistema actual de Spikepulse. La migración incluye:

- ✅ **FullscreenCanvasManager completo** - Gestor avanzado de canvas con fullscreen
- ✅ **ViewportManager integrado** - Cálculos precisos de dimensiones y transformaciones
- ✅ **ResponsiveHandler avanzado** - Detección de dispositivos y adaptación automática
- ✅ **PerformanceOptimizer** - Cache, métricas y optimización de rendimiento
- ✅ **Compatibilidad total** - Funciona con el canvas existente del sistema actual
- ✅ **Integración flexible** - Funciona con o sin EventBus
- ✅ **Manejo de errores robusto** - Recuperación automática y fallbacks

## Características Principales

### 🖥️ Gestión Avanzada de Canvas

- **Fullscreen nativo**: Soporte completo para pantalla completa cross-browser
- **Redimensionamiento inteligente**: Adaptación automática a cambios de viewport
- **Alta densidad de píxeles**: Soporte para pantallas Retina y alta DPI
- **Múltiples modos de escalado**: fit, fill, stretch con aspect ratio configurable
- **Orientación dinámica**: Manejo automático de cambios de orientación

### 📐 ViewportManager Integrado

- **Cálculos precisos**: Dimensiones optimizadas según dispositivo y configuración
- **Conversión de coordenadas**: Transformación pantalla ↔ juego automática
- **Cache inteligente**: Optimización de cálculos repetitivos
- **Detección de dispositivos**: Mobile, tablet, desktop con breakpoints
- **Métricas de rendimiento**: Estadísticas detalladas de uso

### 🚀 Optimización de Rendimiento

- **Debounce de resize**: Evita redimensionamientos excesivos
- **Cache de cálculos**: Reutilización de dimensiones calculadas
- **Métricas en tiempo real**: Monitoreo de rendimiento y uso
- **Lazy loading**: Cálculos solo cuando son necesarios
- **Memory management**: Limpieza automática de recursos

## Uso Básico

### Integración Simple

```javascript
import { FullscreenCanvasManager } from './modules/renderer/FullscreenCanvasManager.js';

// Obtener canvas existente
const canvas = document.querySelector('canvas');

// Configuración básica
const config = {
    canvas: {
        minWidth: 320,
        minHeight: 240,
        aspectRatio: 16/9,
        maintainAspectRatio: true,
        scalingMode: 'fit'
    }
};

// Crear instancia (funciona automáticamente)
const canvasManager = new FullscreenCanvasManager(canvas, config);

// Usar funcionalidades
await canvasManager.toggleFullscreen();
const dimensions = canvasManager.getDimensions();
```

### Integración con EventBus

```javascript
import { FullscreenCanvasManager } from './modules/renderer/FullscreenCanvasManager.js';

// Con EventBus para comunicación avanzada
const canvasManager = new FullscreenCanvasManager(canvas, config, eventBus);

// El sistema responderá automáticamente a eventos:
eventBus.emit('fullscreen:enable');     // Activar fullscreen
eventBus.emit('canvas:resize');         // Forzar redimensionamiento
eventBus.emit('canvas:update-config', { // Actualizar configuración
    canvas: { scalingMode: 'fill' }
});
```

## API Completa

### Métodos Principales

#### `toggleFullscreen(): Promise<boolean>`
Alterna entre modo fullscreen y ventana.

```javascript
const success = await canvasManager.toggleFullscreen();
console.log('Fullscreen:', canvasManager.isFullscreen);
```

#### `getDimensions(): Object`
Obtiene las dimensiones actuales del canvas.

```javascript
const dims = canvasManager.getDimensions();
// Retorna: { width, height, scaledWidth, scaledHeight, scale, viewport, isFullscreen }
```

#### `screenToGame(screenX, screenY): Object`
Convierte coordenadas de pantalla a coordenadas del juego.

```javascript
const gameCoords = canvasManager.screenToGame(mouseX, mouseY);
// Retorna: { x, y, isInBounds }
```

#### `gameToScreen(gameX, gameY): Object`
Convierte coordenadas del juego a coordenadas de pantalla.

```javascript
const screenCoords = canvasManager.gameToScreen(playerX, playerY);
// Retorna: { x, y }
```

#### `updateConfig(newConfig): void`
Actualiza la configuración del canvas.

```javascript
canvasManager.updateConfig({
    canvas: {
        aspectRatio: 4/3,
        scalingMode: 'fill',
        maintainAspectRatio: false
    }
});
```

### Métodos de Control

#### `enableFullscreen(): Promise<boolean>`
Activa el modo pantalla completa.

#### `disableFullscreen(): Promise<boolean>`
Desactiva el modo pantalla completa.

#### `forceResize(data): void`
Fuerza un redimensionamiento del canvas.

#### `getStatus(): Object`
Obtiene el estado completo del manager.

```javascript
const status = canvasManager.getStatus();
// Retorna información completa: dimensiones, viewport, performance, config
```

## Configuración Avanzada

### Opciones de Canvas

```javascript
const config = {
    canvas: {
        // Límites de dimensiones
        minWidth: 320,
        minHeight: 240,
        maxWidth: 3840,
        maxHeight: 2160,
        
        // Aspect ratio
        aspectRatio: 16/9,
        maintainAspectRatio: true,
        
        // Modo de escalado
        scalingMode: 'fit', // 'fit', 'fill', 'stretch'
        
        // Apariencia
        backgroundColor: '#000000',
        
        // Rendimiento
        pixelRatio: window.devicePixelRatio || 1
    }
};
```

### Modos de Escalado

- **`fit`**: Mantiene aspect ratio, ajusta dentro del viewport (default)
- **`fill`**: Mantiene aspect ratio, llena completamente el viewport
- **`stretch`**: Estira para llenar exactamente el viewport

### Detección de Dispositivos

```javascript
const viewport = canvasManager.viewportManager;

// Información del dispositivo
console.log('Es móvil:', viewport.isMobile());
console.log('Es tablet:', viewport.isTablet());
console.log('Es desktop:', viewport.isDesktop());
console.log('Breakpoint:', viewport.getCurrentBreakpoint());
console.log('Alta densidad:', viewport.isHighDensity());
console.log('Escala recomendada:', viewport.getRecommendedScale());
```

## Eventos del Sistema

### Eventos Emitidos

```javascript
// Inicialización
eventBus.on('fullscreen:initialized', (data) => {
    console.log('Canvas manager inicializado:', data);
});

// Cambios de fullscreen
eventBus.on('fullscreen:changed', (data) => {
    console.log('Fullscreen cambiado:', data.isFullscreen);
});

// Redimensionamiento
eventBus.on('fullscreen:resized', (data) => {
    console.log('Canvas redimensionado:', data.dimensions);
});

// Cambios de orientación
eventBus.on('fullscreen:orientation-changed', (data) => {
    console.log('Orientación cambiada:', data.orientation);
});

// Errores
eventBus.on('fullscreen:error', (data) => {
    console.error('Error:', data.error);
});

// Eventos del ViewportManager
eventBus.on('viewport:changed', (data) => {
    console.log('Viewport cambiado:', data);
});

eventBus.on('viewport:dimensions-calculated', (data) => {
    console.log('Dimensiones calculadas:', data);
});
```

### Eventos Escuchados

```javascript
// Control de fullscreen
eventBus.emit('fullscreen:enable');
eventBus.emit('fullscreen:disable');
eventBus.emit('fullscreen:toggle');

// Control de canvas
eventBus.emit('canvas:resize', { dimensions: { width: 1920, height: 1080 } });
eventBus.emit('canvas:update-config', { canvas: { scalingMode: 'fill' } });
```

## Integración en el Juego Actual

### Paso 1: Reemplazar Canvas Básico

```javascript
// En lugar del canvas básico actual
const canvas = document.querySelector('canvas');

// Usar FullscreenCanvasManager
import { FullscreenCanvasManager } from './src/modules/renderer/FullscreenCanvasManager.js';

const canvasManager = new FullscreenCanvasManager(canvas, {
    canvas: {
        aspectRatio: 16/9,
        maintainAspectRatio: true,
        scalingMode: 'fit'
    }
});

// Hacer disponible globalmente
window.canvasManager = canvasManager;
```

### Paso 2: Usar en el Código del Juego

```javascript
// Obtener dimensiones actuales
function getGameDimensions() {
    const dims = window.canvasManager.getDimensions();
    return { width: dims.width, height: dims.height };
}

// Manejar input con conversión de coordenadas
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    
    const gameCoords = window.canvasManager.screenToGame(screenX, screenY);
    
    if (gameCoords.isInBounds) {
        handleGameClick(gameCoords.x, gameCoords.y);
    }
});

// Redimensionar automáticamente
function handleResize() {
    const dims = window.canvasManager.getDimensions();
    // Actualizar lógica del juego con nuevas dimensiones
    updateGameLogic(dims);
}
```

### Paso 3: Integrar Fullscreen

```javascript
// Mejorar botón de fullscreen existente
const fullscreenBtn = document.querySelector('[data-action="fullscreen"]');
if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', async () => {
        const success = await window.canvasManager.toggleFullscreen();
        if (success) {
            fullscreenBtn.textContent = window.canvasManager.isFullscreen 
                ? '⛶ Salir' 
                : '⛶ Pantalla Completa';
        }
    });
}
```

## Métricas de Rendimiento

### Obtener Estadísticas

```javascript
const stats = canvasManager.getStatus();

console.log('Performance:', {
    resizeCount: stats.performance.resizeCount,
    averageResizeTime: stats.performance.averageResizeTime,
    cacheHitRate: stats.viewport.performance.cacheHitRate,
    cacheSize: stats.viewport.performance.cacheSize
});
```

### Monitoreo en Tiempo Real

```javascript
// Mostrar métricas cada segundo
setInterval(() => {
    const metrics = canvasManager.getPerformanceMetrics();
    console.log('Métricas:', {
        resizes: metrics.resizeCount,
        avgTime: `${metrics.averageResizeTime.toFixed(2)}ms`,
        cacheHits: `${metrics.viewport.performance.cacheHitRate.toFixed(1)}%`
    });
}, 1000);
```

## Manejo de Errores

El sistema incluye **manejo robusto de errores**:

- **Fallbacks automáticos**: Dimensiones por defecto si fallan los cálculos
- **Recuperación básica**: Restauración de configuración mínima en errores críticos
- **Logging detallado**: Información completa para debugging
- **Validación de entrada**: Verificación de parámetros y configuración

### Ejemplo de Manejo de Errores

```javascript
// Los errores se manejan automáticamente, pero puedes escucharlos
eventBus.on('fullscreen:error', (data) => {
    console.error('Error en fullscreen:', data.error);
    
    // Manejar error específico
    switch (data.context) {
        case 'enableFullscreen':
            showMessage('No se pudo activar pantalla completa');
            break;
        case 'resizeCanvas':
            showMessage('Error redimensionando canvas');
            break;
    }
});
```

## Compatibilidad

- **Navegadores**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Dispositivos**: Desktop, tablet, móvil con soporte táctil
- **Resoluciones**: Desde 320×240 hasta 4K (3840×2160)
- **Densidad de píxeles**: Soporte completo para pantallas Retina/HiDPI

## Próximos Pasos

Con el FullscreenCanvasManager completamente migrado, los siguientes pasos son:

1. **Integrar en index.html** - Reemplazar canvas básico con sistema avanzado
2. **Migrar UpperObstacleGenerator** - Siguiente componente modular
3. **Implementar efectos visuales avanzados** - Usar capacidades de fullscreen
4. **Optimizar rendimiento** - Aprovechar métricas y cache del sistema

## Ejemplos Completos

Ver `example-integration.js` para ejemplos completos de:
- Integración básica sin EventBus
- Integración avanzada con EventBus
- Conversión de coordenadas en tiempo real
- Panel de controles avanzado
- Monitoreo de métricas de rendimiento

---

**Estado**: ✅ **COMPLETADO** - FullscreenCanvasManager totalmente migrado y listo para usar
**Compatibilidad**: ✅ **100%** - Funciona con el canvas existente sin cambios
**Rendimiento**: ✅ **Optimizado** - Cache, métricas y optimizaciones avanzadas