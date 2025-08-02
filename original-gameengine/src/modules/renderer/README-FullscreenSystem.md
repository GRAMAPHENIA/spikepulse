# Sistema de Canvas Fullscreen

Este sistema proporciona capacidades de pantalla completa optimizadas para el juego Spikepulse, incluyendo gestión responsive, optimización de rendimiento y manejo de memoria escalable.

## Componentes Principales

### FullscreenCanvasManager
Gestor principal para canvas de pantalla completa con redimensionamiento dinámico.

**Características:**
- Redimensionamiento automático del canvas
- Soporte para pantalla completa nativa
- Mantenimiento de aspect ratio
- Detección de cambios de orientación
- Manejo de eventos de viewport

**Uso:**
```javascript
import { FullscreenCanvasManager } from './FullscreenCanvasManager.js';

const manager = new FullscreenCanvasManager(canvas, config, eventBus);

// Habilitar pantalla completa
await manager.enableFullscreen();

// Obtener dimensiones actuales
const dimensions = manager.getDimensions();
```

### ViewportManager
Gestor de viewport para cálculos de dimensiones y transformaciones de coordenadas.

**Características:**
- Cálculo de dimensiones óptimas
- Conversión de coordenadas pantalla ↔ juego
- Soporte para múltiples modos de escalado
- Cache de cálculos para rendimiento
- Detección de tipo de dispositivo

**Uso:**
```javascript
import { ViewportManager } from './ViewportManager.js';

const viewport = new ViewportManager(config, eventBus);

// Convertir coordenadas
const gameCoords = viewport.screenToGame(screenX, screenY);
const screenCoords = viewport.gameToScreen(gameX, gameY);
```

### ResponsiveHandler
Manejador de comportamiento responsive para diferentes dispositivos.

**Características:**
- Detección automática de tipo de dispositivo
- Optimizaciones específicas por dispositivo
- Manejo de orientación y breakpoints
- Configuración adaptativa de UI
- Soporte táctil optimizado

**Uso:**
```javascript
import { ResponsiveHandler } from './ResponsiveHandler.js';

const responsive = new ResponsiveHandler(config, eventBus);

// Verificar tipo de dispositivo
if (responsive.isMobile()) {
    // Configuración específica para móvil
}
```

### PerformanceOptimizer
Optimizador de rendimiento para canvas de pantalla completa.

**Características:**
- Calidad dinámica basada en FPS
- Monitoreo de métricas en tiempo real
- Optimización automática de memoria
- Configuración adaptativa por dispositivo
- Sistema de niveles de calidad

**Uso:**
```javascript
import { PerformanceOptimizer } from './PerformanceOptimizer.js';

const optimizer = new PerformanceOptimizer(config, eventBus);

// Cambiar calidad manualmente
optimizer.setQuality('high');

// Obtener métricas
const metrics = optimizer.getMetrics();
```

### ScalableMemoryManager
Gestor de memoria escalable para optimizar el uso de memoria.

**Características:**
- Object pooling automático
- Gestión de caches con LRU
- Limpieza automática de memoria
- Monitoreo de uso de heap
- Garbage collection forzado

**Uso:**
```javascript
import { ScalableMemoryManager } from './ScalableMemoryManager.js';

const memory = new ScalableMemoryManager(config, eventBus);

// Usar object pool
const obj = memory.acquireFromPool('position');
// ... usar objeto
memory.releaseToPool('position', obj);

// Crear cache gestionado
const cache = memory.createManagedCache('textures', 50);
```

### FullscreenIntegrator
Integrador que conecta todos los componentes con el GameEngine existente.

**Características:**
- Integración transparente con el sistema existente
- Extensión del renderer con capacidades fullscreen
- Sistema de coordenadas adaptativo
- Manejo de eventos unificado
- Configuración automática

**Uso:**
```javascript
import { FullscreenIntegrator } from './FullscreenIntegrator.js';

const integrator = new FullscreenIntegrator(canvas, config, eventBus);

// Alternar pantalla completa
await integrator.toggleFullscreen();

// Obtener estado del sistema
const state = integrator.getSystemState();
```

## Configuración

### Configuración de Canvas
```javascript
const canvasConfig = {
    minWidth: 320,
    minHeight: 240,
    maxWidth: 3840,
    maxHeight: 2160,
    aspectRatio: 16/9,
    maintainAspectRatio: true,
    backgroundColor: '#000000'
};
```

### Configuración Responsive
```javascript
const responsiveConfig = {
    breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1440
    },
    touchOptimization: true,
    adaptiveUI: true,
    orientationHandling: true
};
```

### Configuración de Rendimiento
```javascript
const performanceConfig = {
    targetFPS: 60,
    minFPS: 30,
    adaptiveQuality: true,
    memoryThreshold: 0.8,
    enableDynamicQuality: true
};
```

## Eventos del Sistema

### Eventos de Fullscreen
- `fullscreen:initialized` - Sistema inicializado
- `fullscreen:changed` - Cambio de estado fullscreen
- `fullscreen:resized` - Canvas redimensionado
- `fullscreen:error` - Error en operación fullscreen

### Eventos Responsive
- `responsive:device-changed` - Cambio de tipo de dispositivo
- `responsive:orientation-changed` - Cambio de orientación
- `responsive:resize` - Redimensionamiento de ventana

### Eventos de Rendimiento
- `performance:quality-changed` - Cambio de calidad
- `performance:metrics-updated` - Actualización de métricas
- `performance:optimization-completed` - Optimización completada

### Eventos de Memoria
- `memory:cleanup-completed` - Limpieza de memoria completada
- `memory:gc-forced` - Garbage collection forzado
- `memory:pressure-handled` - Presión de memoria manejada

## Integración con GameEngine

El sistema se integra automáticamente con el GameEngine existente:

1. **Detección automática**: Busca referencias al GameEngine y Renderer
2. **Extensión del Renderer**: Añade capacidades fullscreen al renderer existente
3. **Sistema de coordenadas**: Proporciona conversión automática de coordenadas
4. **Eventos unificados**: Integra eventos con el sistema existente

### Métodos añadidos al Renderer
```javascript
// Obtener dimensiones del viewport
const dimensions = renderer.getViewportDimensions();

// Convertir coordenadas
const gameCoords = renderer.screenToGame(screenX, screenY);
const screenCoords = renderer.gameToScreen(gameX, gameY);
```

### Sistema de coordenadas global
```javascript
// Disponible en gameEngine.coordinateSystem
const coords = gameEngine.coordinateSystem.toScreen(gameX, gameY);
const scale = gameEngine.coordinateSystem.getScale();
const offset = gameEngine.coordinateSystem.getOffset();
```

## Optimizaciones por Dispositivo

### Móvil
- Calidad reducida automáticamente
- Controles táctiles optimizados
- Menor uso de memoria
- Efectos visuales simplificados

### Tablet
- Calidad media
- Interfaz adaptada para touch
- Rendimiento balanceado

### Desktop
- Calidad alta
- Aprovechamiento completo de resolución
- Efectos visuales completos

## Niveles de Calidad

### Ultra
- Escala: 1.0
- Partículas: 200
- Sombras: ✓
- Blur: ✓
- Antialiasing: ✓

### High
- Escala: 1.0
- Partículas: 150
- Sombras: ✓
- Blur: ✓
- Antialiasing: ✓

### Medium
- Escala: 0.9
- Partículas: 100
- Sombras: ✓
- Blur: ✗
- Antialiasing: ✗

### Low
- Escala: 0.8
- Partículas: 50
- Sombras: ✗
- Blur: ✗
- Antialiasing: ✗

### Minimal
- Escala: 0.7
- Partículas: 20
- Sombras: ✗
- Blur: ✗
- Antialiasing: ✗

## Uso Completo

```javascript
import { createFullscreenSystem, DEFAULT_FULLSCREEN_CONFIG } from './fullscreen/index.js';

// Crear sistema completo
const fullscreenSystem = await createFullscreenSystem(
    canvas, 
    DEFAULT_FULLSCREEN_CONFIG, 
    eventBus
);

// El sistema se integra automáticamente con el GameEngine existente
// y proporciona todas las capacidades fullscreen de forma transparente
```

## Consideraciones de Rendimiento

1. **Object Pooling**: Reutiliza objetos frecuentemente creados
2. **Cache Management**: Gestiona automáticamente caches con LRU
3. **Dynamic Quality**: Ajusta calidad según rendimiento
4. **Memory Monitoring**: Monitorea y optimiza uso de memoria
5. **Viewport Caching**: Cachea cálculos de viewport para mejor rendimiento

## Compatibilidad

- **Navegadores**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Dispositivos**: Desktop, Tablet, Móvil
- **Resoluciones**: 320x240 hasta 3840x2160
- **Orientaciones**: Portrait y Landscape
- **Densidades**: Soporte para pantallas de alta densidad

## Tests

Todos los componentes incluyen tests unitarios completos:

```bash
node tests/runTests.js FullscreenCanvasManager
node tests/runTests.js ViewportManager
node tests/runTests.js ResponsiveHandler
node tests/runTests.js PerformanceOptimizer
node tests/runTests.js ScalableMemoryManager
node tests/runTests.js FullscreenIntegrator
```