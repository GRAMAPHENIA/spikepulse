# Sistema de Efectos Visuales Spikepulse

## Descripción General

El sistema de efectos visuales de Spikepulse está compuesto por tres módulos principales que trabajan en conjunto para proporcionar efectos visuales optimizados y temáticos:

1. **EffectsManager**: Gestor base de efectos con object pooling y renderizado optimizado
2. **SpikepulseEffects**: Efectos específicos temáticos del juego con presets predefinidos
3. **ParticleSystem**: Sistema de partículas atmosféricas para efectos ambientales

## Arquitectura

```
Renderer
├── EffectsManager (Gestor base)
│   ├── Object Pooling
│   ├── Renderizado optimizado
│   └── Tipos de efectos básicos
├── SpikepulseEffects (Efectos temáticos)
│   ├── Presets específicos del juego
│   ├── Event listeners automáticos
│   └── Efectos personalizados
└── ParticleSystem (Partículas ambientales)
    ├── Emisores atmosféricos
    ├── Tipos de partículas
    └── Efectos de fondo
```

## Uso Básico

### Desde el Renderer

```javascript
// Obtener el gestor de efectos de Spikepulse
const spikepulseEffects = renderer.getSpikepulseEffects();

// Crear efecto específico
renderer.createSpikepulseEffect('playerJump', { x: 100, y: 200 });

// Crear pulso Spikepulse
renderer.createSpikepulsePulse({ x: 400, y: 300 }, '#FFD700', 1.5);

// Crear screen shake
renderer.createScreenShake(0.3, 5);
```

### Mediante Eventos

Los efectos se activan automáticamente mediante eventos del EventBus:

```javascript
// Efectos del jugador
eventBus.emit('player:jump', { position: { x: 100, y: 200 } });
eventBus.emit('player:dash', { position: { x: 100, y: 200 }, direction: { x: 1, y: 0 } });
eventBus.emit('player:gravity-flip', { position: { x: 100, y: 200 } });
eventBus.emit('player:hit-obstacle', { position: { x: 100, y: 200 } });

// Efectos de obstáculos
eventBus.emit('obstacle:spawn', { position: { x: 100, y: 200 }, type: 'spike' });
eventBus.emit('obstacle:destroy', { position: { x: 100, y: 200 } });

// Efectos de UI
eventBus.emit('ui:button-hover', { position: { x: 100, y: 200 } });
eventBus.emit('ui:score-update', { position: { x: 100, y: 200 }, isNewRecord: true });

// Efectos ambientales
eventBus.emit('world:atmospheric-effect', { position: { x: 100, y: 200 } });
eventBus.emit('world:industrial-sparks', { position: { x: 100, y: 200 } });
```

## Presets Disponibles

### Efectos del Jugador

- **playerJump**: Partículas de energía dorada con glow
- **playerDash**: Chispas direccionales con trail y glow intenso
- **gravityFlip**: Partículas de gravedad con flash de pantalla

### Efectos de Obstáculos

- **spikeGlow**: Glow pulsante para spikes
- **spikeHit**: Explosión de escombros con flash rojo

### Efectos Ambientales

- **atmosphericFog**: Partículas de humo industrial
- **industrialSparks**: Chispas eléctricas ambientales

### Efectos de UI

- **menuPulse**: Glow pulsante para elementos de menú
- **buttonHover**: Glow suave para botones
- **scorePopup**: Partículas de celebración

## Configuración

### Configuración del EffectsManager

```javascript
const effectsConfig = {
    maxParticles: 500,
    maxGlowEffects: 50,
    maxTrailSegments: 200,
    enablePooling: true
};
```

### Configuración de SpikepulseEffects

```javascript
const spikepulseConfig = {
    enableAdvancedEffects: true,
    particleQuality: 'high', // 'low', 'medium', 'high'
    customPresets: {
        // Presets personalizados
    }
};
```

## Creación de Efectos Personalizados

### Efecto de Partículas Personalizado

```javascript
spikepulseEffects.createParticleExplosion(
    { x: 100, y: 200 }, // Posición
    {
        count: 20,
        type: 'energy',
        color: '#FF6B6B',
        size: { min: 2, max: 5 },
        velocity: { min: 50, max: 100 },
        life: { min: 0.5, max: 1.0 },
        gravity: 0.3
    }
);
```

### Efecto de Glow Personalizado

```javascript
effectsManager.createGlowEffect({
    x: 100,
    y: 200,
    radius: 30,
    intensity: 1.5,
    color: '#9F7AEA',
    life: 2.0,
    pulseSpeed: 1.2
});
```

### Efecto de Trail Personalizado

```javascript
const trail = effectsManager.createTrailEffect({
    color: '#FFD700',
    width: 4,
    maxSegments: 15,
    life: 1.0
});
```

## Optimización y Performance

### Object Pooling

El sistema utiliza object pooling automático para:
- Partículas (pool de 500 objetos)
- Efectos de glow (pool de 50 objetos)
- Segmentos de trail (pool de 200 objetos)

### Culling y Optimizaciones

- Culling automático de efectos fuera de pantalla
- Batch rendering para efectos similares
- Dirty rectangle rendering para optimizar limpieza
- Separación de efectos estáticos y dinámicos

### Métricas de Performance

```javascript
const stats = renderer.getVisualEffectsStats();
console.log(stats);
// {
//   renderMetrics: { objectsRendered: 45, renderTime: 2.3 },
//   spikepulseEffects: { activeEffects: 12, presets: 10 },
//   effectsManager: { particlesActive: 25, glowEffectsActive: 5 }
// }
```

## Eventos del Sistema

### Eventos Emitidos

- `effects:screen-shake`: Cuando se activa screen shake
- `renderer:frame-complete`: Al completar renderizado de frame
- `renderer:initialized`: Cuando el renderer se inicializa

### Eventos Escuchados

- `player:*`: Todos los eventos del jugador
- `obstacle:*`: Eventos de obstáculos
- `ui:*`: Eventos de interfaz
- `world:*`: Eventos del mundo/ambiente

## Debugging y Testing

### Modo Debug

```javascript
const renderer = new Renderer({
    debug: {
        showMetrics: true,
        visualizeEffects: true
    }
});
```

### Archivo de Pruebas

Ejecuta `test-visual-effects.html` para probar todos los efectos:

```bash
# Abrir en navegador
open test-visual-effects.html
```

### Logging

```javascript
// Habilitar logging detallado
console.log('[EffectsManager] Efectos activos:', effectsManager.getActiveEffectsCount());
console.log('[SpikepulseEffects] Estadísticas:', spikepulseEffects.getEffectsStats());
```

## Integración con Otros Módulos

### Player Module

```javascript
// En el módulo Player
this.eventBus.emit('player:jump', { 
    position: this.position 
});
```

### World Module

```javascript
// En el módulo World
this.eventBus.emit('obstacle:spawn', { 
    position: obstacle.position, 
    type: obstacle.type 
});
```

### UI Module

```javascript
// En el módulo UI
this.eventBus.emit('ui:button-hover', { 
    position: button.position 
});
```

## Mejores Prácticas

1. **Usar Presets**: Utiliza los presets predefinidos antes de crear efectos personalizados
2. **Eventos sobre Llamadas Directas**: Prefiere emitir eventos en lugar de llamar métodos directamente
3. **Configuración Centralizada**: Mantén la configuración de efectos en archivos de configuración
4. **Monitoreo de Performance**: Revisa regularmente las métricas de efectos
5. **Cleanup Automático**: Los efectos se limpian automáticamente, no es necesario gestión manual

## Troubleshooting

### Efectos No Aparecen

1. Verificar que el Renderer esté inicializado
2. Comprobar que los eventos se emiten correctamente
3. Revisar la configuración de efectos
4. Verificar que el canvas tenga el contexto correcto

### Performance Baja

1. Reducir `maxParticles` en la configuración
2. Habilitar culling: `cullingEnabled: true`
3. Usar `particleQuality: 'low'`
4. Monitorear métricas con `getVisualEffectsStats()`

### Efectos Cortados

1. Verificar dimensiones del canvas
2. Ajustar `cullingMargin` en la configuración
3. Comprobar posiciones de efectos dentro del viewport

## Extensibilidad

Para agregar nuevos tipos de efectos:

1. Extender `EffectsManager` con nuevos tipos base
2. Agregar presets en `SpikepulseEffects`
3. Crear event listeners apropiados
4. Documentar el nuevo efecto
5. Agregar pruebas en el archivo de testing

El sistema está diseñado para ser fácilmente extensible manteniendo la performance y la coherencia visual del juego.