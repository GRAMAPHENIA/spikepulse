# Sistema de Estado Centralizada - Spikepulse

## Visión General

El sistema de estado centralizada de Spikepulse proporciona una gestión unificada y robusta del estado del juego, incluyendo persistencia automática, validación de datos, y herramientas de debugging avanzadas.

## Características Principales

- **Estado Centralizado**: Toda la información del juego en un solo lugar
- **Persistencia Automática**: Guardado y carga automática en localStorage
- **Validación de Datos**: Validadores personalizables para integridad de datos
- **Event-Driven**: Integración completa con el sistema de eventos
- **Debugging Avanzado**: Herramientas completas para debugging y análisis
- **Migración de Datos**: Sistema de migración para actualizaciones

## Estructura del Estado

```javascript
{
  player: {
    position: { x: 100, y: 300 },
    velocity: { x: 0, y: 0 },
    onGround: false,
    jumpsLeft: 2,
    dashAvailable: true,
    gravityInverted: false,
    isAlive: true
  },
  
  world: {
    camera: { x: 0, y: 0 },
    obstacles: [],
    coins: [],
    scrollOffset: 0,
    worldSpeed: 2
  },
  
  stats: {
    distance: 0,
    score: 0,
    jumps: 0,
    dashes: 0,
    coins: 0,
    bestDistance: 0,
    bestScore: 0,
    totalPlayTime: 0
  },
  
  ui: {
    currentScreen: 'menu',
    hudVisible: false,
    showDebug: false,
    theme: 'noir'
  },
  
  settings: {
    volume: { master: 1.0, sfx: 1.0, music: 0.7 },
    graphics: { quality: 'high', particles: true },
    controls: { keyboard: {...}, touch: {...} }
  },
  
  meta: {
    version: '1.0.0',
    lastSaved: 1234567890,
    sessionId: 'session_123'
  }
}
```

## Uso Básico

### Inicialización

```javascript
import { GameState } from '../core/GameState.js';
import { EventBus } from '../core/EventBus.js';

const eventBus = new EventBus();
const gameState = new GameState(eventBus, config);

await gameState.init();
```

### Obtener Datos

```javascript
// Obtener valor específico
const playerPosition = gameState.get('player.position');
const distance = gameState.get('stats.distance');

// Obtener sección completa
const playerData = gameState.get('player');
const allStats = gameState.get('stats');

// Obtener estado completo
const fullState = gameState.getState();
```

### Actualizar Datos

```javascript
// Actualizar valor específico
gameState.set('player.position.x', 150);
gameState.set('stats.distance', 1500);

// Actualizar objeto completo
gameState.set('player.position', { x: 200, y: 250 });

// Actualización temporal (no se guarda automáticamente)
gameState.set('player.velocity', { x: 5, y: -2 }, { temporary: true });
```

### Eventos Automáticos

El sistema escucha automáticamente eventos del juego:

```javascript
// Estos eventos actualizan el estado automáticamente
eventBus.emit('player:jumped', { position: { x: 100, y: 300 } });
eventBus.emit('game:distance-changed', { distance: 1500 });
eventBus.emit('game:coin-collected', { value: 10 });
eventBus.emit('player:dashed', { position: { x: 120, y: 300 } });
```

## Validación de Datos

### Validadores Predefinidos

El sistema incluye validadores para:
- Posición del jugador (coordenadas válidas)
- Estadísticas (números no negativos)
- Configuración de volumen (0-1)

### Validadores Personalizados

```javascript
// Añadir validador personalizado
gameState.addValidator('player.velocity', (newValue, oldValue) => {
  const maxSpeed = 15;
  const speed = Math.sqrt(newValue.x * newValue.x + newValue.y * newValue.y);
  
  if (speed > maxSpeed) {
    return {
      valid: false,
      error: `Velocidad demasiado alta: ${speed} > ${maxSpeed}`
    };
  }
  
  return { valid: true };
});
```

## Persistencia

### Configuración

```javascript
const config = {
  persistence: {
    enabled: true,
    autoSave: true,
    saveInterval: 5000, // 5 segundos
    maxHistorySize: 100
  }
};
```

### Operaciones Manuales

```javascript
// Guardar estado manualmente
await gameState.saveState();

// Cargar estado manualmente
await gameState.loadState();

// Verificar si hay datos guardados
const hasData = gameState.hasPersistentData();

// Limpiar datos guardados
gameState.clearPersistedData();
```

### Auto-guardado

El sistema guarda automáticamente:
- Cada 5 segundos (configurable)
- Después de cambios importantes
- Al destruir el sistema

## Debugging

### StateDebugger

```javascript
import { StateDebugger } from '../utils/StateDebugger.js';

const debugger = new StateDebugger(gameState, eventBus);
debugger.enable();

// Añadir watcher para cambios específicos
debugger.addWatcher('stats.distance', (newValue, oldValue, path) => {
  console.log(`Distancia cambió: ${oldValue} → ${newValue}`);
});

// Obtener métricas de rendimiento
const metrics = debugger.getMetrics();
const performance = debugger.analyzePerformance();

// Validar integridad del estado
const validation = debugger.validateStateIntegrity();
```

### Información de Debug

```javascript
// Obtener información completa de debug
const debugInfo = gameState.getDebugInfo();

// Exportar estado para análisis
const exportedState = debugger.exportState();

// Historial de cambios
const changes = debugger.getChangeHistory(50);
```

## Eventos del Sistema

### Eventos Emitidos

- `gamestate:initialized` - Sistema inicializado
- `gamestate:changed` - Estado cambió
- `gamestate:saved` - Estado guardado
- `gamestate:loaded` - Estado cargado
- `gamestate:reset` - Estado reseteado
- `gamestate:save-error` - Error al guardar
- `gamestate:load-error` - Error al cargar

### Eventos Escuchados

- `gamestate:update` - Actualizar estado
- `gamestate:save` - Guardar estado
- `gamestate:load` - Cargar estado
- `gamestate:reset` - Resetear estado
- `player:*` - Eventos del jugador
- `game:*` - Eventos del juego

## Migración de Datos

### Configuración de Migración

```javascript
const migrationConfig = {
  enabled: true,
  currentVersion: '1.0.0',
  migrations: {
    '0.9.0': (state) => {
      // Migrar de versión anterior
      if (!state.meta) {
        state.meta = {
          version: '1.0.0',
          created: Date.now()
        };
      }
      return state;
    }
  }
};
```

## Mejores Prácticas

### Organización del Estado

1. **Mantén la estructura plana**: Evita anidación excesiva
2. **Usa nombres descriptivos**: `player.position.x` en lugar de `p.pos.x`
3. **Agrupa datos relacionados**: Todas las estadísticas en `stats`
4. **Separa datos temporales**: Usa la opción `temporary` para datos que no deben persistir

### Rendimiento

1. **Evita actualizaciones frecuentes**: Agrupa cambios relacionados
2. **Usa validadores eficientes**: Validación rápida para datos críticos
3. **Limita el historial**: Configura `maxHistorySize` apropiadamente
4. **Deshabilita debugging en producción**: Solo para desarrollo

### Validación

1. **Valida datos críticos**: Posición, estadísticas, configuración
2. **Proporciona mensajes claros**: Errores descriptivos para debugging
3. **Usa validación progresiva**: Validadores más estrictos en desarrollo

### Persistencia

1. **Configura auto-guardado apropiado**: Balance entre rendimiento y seguridad
2. **Maneja errores de persistencia**: Fallbacks para errores de localStorage
3. **Considera el tamaño de datos**: Limita datos persistentes si es necesario

## Ejemplo Completo

```javascript
import { GameState } from '../core/GameState.js';
import { EventBus } from '../core/EventBus.js';
import { StateDebugger } from '../utils/StateDebugger.js';

class GameManager {
  constructor() {
    this.eventBus = new EventBus();
    this.gameState = new GameState(this.eventBus, {
      persistence: {
        enabled: true,
        autoSave: true,
        saveInterval: 5000
      }
    });
    
    this.debugger = new StateDebugger(this.gameState, this.eventBus);
  }
  
  async init() {
    await this.gameState.init();
    
    if (process.env.NODE_ENV === 'development') {
      this.debugger.enable();
    }
    
    this.setupGameLogic();
  }
  
  setupGameLogic() {
    // Actualizar distancia cada frame
    setInterval(() => {
      const currentDistance = this.gameState.get('stats.distance');
      this.gameState.set('stats.distance', currentDistance + 1);
    }, 16);
    
    // Manejar saltos del jugador
    this.eventBus.on('input:jump', () => {
      const jumpsLeft = this.gameState.get('player.jumpsLeft');
      
      if (jumpsLeft > 0) {
        this.gameState.set('player.jumpsLeft', jumpsLeft - 1);
        this.eventBus.emit('player:jumped');
      }
    });
  }
  
  getGameStats() {
    return this.gameState.get('stats');
  }
  
  resetGame() {
    this.gameState.resetState(true); // Mantener configuraciones
  }
  
  destroy() {
    this.debugger.disable();
    this.gameState.destroy();
  }
}
```

## Solución de Problemas

### Problemas Comunes

1. **Estado no se guarda**: Verificar que `persistence.enabled` sea `true`
2. **Validación falla**: Revisar formato de datos y validadores
3. **Rendimiento lento**: Reducir frecuencia de actualizaciones o deshabilitar debugging
4. **Datos corruptos**: Usar `validateStateIntegrity()` para diagnosticar

### Debugging

1. **Habilitar logging verboso**: `debugger.enableVerboseLogging()`
2. **Revisar métricas**: `debugger.getMetrics()`
3. **Analizar rendimiento**: `debugger.analyzePerformance()`
4. **Exportar estado**: `debugger.exportState()` para análisis externo

## API Reference

Ver documentación completa de la API en los archivos de código fuente:
- `src/core/GameState.js` - Clase principal
- `src/utils/StateDebugger.js` - Herramientas de debugging
- `src/config/PersistenceConfig.js` - Configuración de persistencia