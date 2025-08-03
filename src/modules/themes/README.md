# NoirThemeManager - Sistema de Temas Noir para Spikepulse

## Estado de la Migración ✅

El **NoirThemeManager** ha sido **completamente migrado** desde el GameEngine modular original y adaptado para funcionar con el sistema actual de Spikepulse. La migración incluye:

- ✅ **NoirThemeManager completo** - Gestor principal de temas noir
- ✅ **NoirPalette avanzada** - Paleta cinematográfica con efectos avanzados
- ✅ **Compatibilidad total** - Funciona con las variables CSS existentes
- ✅ **Integración flexible** - Funciona con o sin EventBus
- ✅ **Manejo de errores** - Recuperación automática y fallbacks
- ✅ **Preparación futura** - Sistema listo para transición a colores

## Características Principales

### 🎨 Paleta Noir Cinematográfica

- **Escala de grises avanzada**: 8 tonos base desde negro puro hasta blanco
- **Transparencias dramáticas**: Efectos de sombra, overlay y fog
- **Highlights cinematográficos**: 6 niveles de iluminación dramática
- **Gradientes noir**: 12 gradientes cinematográficos predefinidos
- **Efectos especiales**: Sombras, contraste y efectos de textura

### 🔧 Integración Flexible

- **Sin dependencias**: Funciona independientemente
- **EventBus opcional**: Integración avanzada con sistema de eventos
- **Compatibilidad CSS**: Mantiene variables existentes del sistema actual
- **API simple**: Métodos intuitivos para obtener colores y efectos

### 🚀 Preparación Futura

- **Slots de color**: Sistema preparado para evolución a colores
- **Transición suave**: Cambio futuro sin romper compatibilidad
- **Mapeo inteligente**: Variables preparadas para dorado, rojo y púrpura

## Uso Básico

### Integración Simple

```javascript
import { NoirThemeManager } from './modules/themes/NoirThemeManager.js';

// Crear instancia (aplica tema automáticamente)
const themeManager = new NoirThemeManager();

// Obtener colores
const playerColor = themeManager.getColor('player');        // '#808080'
const backgroundColor = themeManager.getColor('background'); // '#000000'

// Obtener gradientes
const dramatic = themeManager.getGradient('dramaticContrast');

// Obtener efectos
const shadow = themeManager.getEffect('dramaticShadow');
```

### Integración con EventBus

```javascript
import { NoirThemeManager } from './modules/themes/NoirThemeManager.js';

// Con configuración y EventBus
const config = { theme: { enhanceOnGameplay: true } };
const themeManager = new NoirThemeManager(config, eventBus);

// El sistema responderá automáticamente a eventos:
eventBus.emit('state:change', { to: 'playing' });  // Mejora efectos
eventBus.emit('state:change', { to: 'gameOver' }); // Efecto dramático
```

## API Completa

### Métodos Principales

#### `getColor(colorKey: string): string`
Obtiene un color específico de la paleta.

```javascript
// Colores base
themeManager.getColor('black');      // '#000000'
themeManager.getColor('white');      // '#ffffff'
themeManager.getColor('mediumGray'); // '#404040'

// Colores contextuales
themeManager.getColor('player');     // '#808080'
themeManager.getColor('obstacle');   // '#1a1a1a'
themeManager.getColor('uiPrimary');  // '#ffffff'
```

#### `getGradient(gradientKey: string): string`
Obtiene un gradiente CSS específico.

```javascript
themeManager.getGradient('primary');           // Gradiente principal
themeManager.getGradient('dramaticContrast');  // Contraste dramático
themeManager.getGradient('cinematicVignette'); // Viñeta cinematográfica
```

#### `getEffect(effectKey: string): string`
Obtiene un efecto CSS específico.

```javascript
themeManager.getEffect('lightShadow');    // Sombra suave
themeManager.getEffect('dramaticShadow'); // Sombra dramática
themeManager.getEffect('rimLight');       // Luz de contorno
```

#### `getThemeColors(): Object`
Obtiene la paleta completa.

```javascript
const palette = themeManager.getThemeColors();
// Retorna objeto con: base, transparencies, highlights, gradients, effects, etc.
```

#### `getStats(): Object`
Obtiene estadísticas del sistema.

```javascript
const stats = themeManager.getStats();
// Retorna: isInitialized, currentTheme, appliedVariablesCount, etc.
```

### Métodos de Control

#### `applyNoirTheme(): void`
Reaplica el tema noir completo.

#### `destroy(): void`
Limpia recursos y destruye la instancia.

## Estructura de la Paleta

### Colores Base
```javascript
base: {
    black: '#000000',      // Negro puro
    darkGray: '#1a1a1a',   // Gris muy oscuro
    warmGray: '#2a2a2a',   // Gris cálido
    coolGray: '#1e1e2e',   // Gris frío
    mediumGray: '#404040', // Gris medio
    lightGray: '#808080',  // Gris claro
    white: '#ffffff',      // Blanco puro
    charcoal: '#0f0f0f'    // Carbón
}
```

### Transparencias
```javascript
transparencies: {
    shadowLight: 'rgba(0, 0, 0, 0.3)',    // Sombra suave
    shadowMedium: 'rgba(0, 0, 0, 0.6)',   // Sombra media
    shadowHeavy: 'rgba(0, 0, 0, 0.9)',    // Sombra intensa
    overlayLight: 'rgba(0, 0, 0, 0.2)',   // Overlay suave
    fogLight: 'rgba(255, 255, 255, 0.05)' // Niebla suave
    // ... más transparencias
}
```

### Highlights Dramáticos
```javascript
highlights: {
    subtle: 'rgba(255, 255, 255, 0.1)',   // Sutil
    moderate: 'rgba(255, 255, 255, 0.2)', // Moderado
    dramatic: 'rgba(255, 255, 255, 0.3)', // Dramático
    intense: 'rgba(255, 255, 255, 0.4)',  // Intenso
    rim: 'rgba(255, 255, 255, 0.6)',      // Luz de contorno
    key: 'rgba(255, 255, 255, 0.8)'       // Luz clave
}
```

## Compatibilidad con Sistema Actual

El NoirThemeManager mantiene **total compatibilidad** con las variables CSS existentes:

```css
/* Variables existentes (mantenidas) */
--noir-white: #FFFFFF
--noir-light: #E0E0E0  
--noir-medium: #808080
--noir-dark: #404040
--noir-black: #000000

/* Nuevas variables avanzadas (añadidas) */
--sp-noir-dramaticShadow: 0 8px 32px rgba(0, 0, 0, 0.8)
--sp-noir-gradient-primary: linear-gradient(45deg, #000000 0%, #404040 50%, #000000 100%)
--sp-noir-effect-rimLight: drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))
```

## Integración en el Juego Actual

### Paso 1: Importar en index.html

```html
<script type="module">
import { NoirThemeManager } from './src/modules/themes/NoirThemeManager.js';

// Crear instancia global
window.themeManager = new NoirThemeManager();

// Usar en el juego
const playerColor = window.themeManager.getColor('player');
</script>
```

### Paso 2: Usar en JavaScript del Juego

```javascript
// En el código del juego
function drawPlayer(ctx, x, y) {
    ctx.fillStyle = window.themeManager.getColor('player');
    ctx.shadowColor = window.themeManager.getColor('shadowMedium');
    ctx.shadowBlur = 10;
    ctx.fillRect(x, y, 20, 20);
}

function drawBackground(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, window.themeManager.getColor('black'));
    gradient.addColorStop(1, window.themeManager.getColor('darkGray'));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
```

### Paso 3: Efectos Dinámicos

```javascript
// Mejorar efectos durante el gameplay
function startGame() {
    if (window.themeManager) {
        // Simular evento de cambio de estado
        window.themeManager.enhanceNoirForGameplay?.();
    }
}

function gameOver() {
    if (window.themeManager) {
        // Aplicar efecto dramático
        window.themeManager.applyDramaticNoirEffect?.();
    }
}
```

## Preparación para Colores Futuros

El sistema está **completamente preparado** para la transición futura a colores:

```javascript
// Slots preparados (actualmente grises)
colorSlots: {
    slot1: '#404040', // → Se convertirá en dorado (#FFD700)
    slot2: '#606060', // → Se convertirá en rojo (#FF6B6B)  
    slot3: '#505050'  // → Se convertirá en púrpura (#9F7AEA)
}

// Variables CSS preparadas
--sp-future-primary: var(--sp-noir-slot1)   // → Dorado futuro
--sp-future-secondary: var(--sp-noir-slot2) // → Rojo futuro
--sp-future-accent: var(--sp-noir-slot3)    // → Púrpura futuro
```

## Manejo de Errores

El sistema incluye **manejo robusto de errores**:

- **Fallbacks automáticos**: Colores por defecto si no se encuentra el solicitado
- **Recuperación básica**: Paleta mínima en caso de error crítico
- **Logging detallado**: Información completa para debugging
- **Validación de paleta**: Verificación de integridad al inicializar

## Rendimiento

- **Cache de colores**: Los colores comunes se pre-calculan
- **Lazy loading**: Solo se calculan los colores cuando se necesitan
- **Optimización CSS**: Variables CSS nativas para máximo rendimiento
- **Memoria eficiente**: Limpieza automática de recursos

## Próximos Pasos

Con el NoirThemeManager completamente migrado, los siguientes pasos son:

1. **Integrar en index.html** - Añadir al juego principal
2. **Migrar FullscreenCanvasManager** - Siguiente componente modular
3. **Implementar efectos avanzados** - Usar gradientes y efectos cinematográficos
4. **Preparar transición a colores** - Cuando llegue el momento

## Ejemplos Completos

Ver `example-integration.js` para ejemplos completos de:
- Integración básica
- Integración con EventBus
- Uso de paleta completa
- Manejo de errores
- Efectos dinámicos

---

**Estado**: ✅ **COMPLETADO** - NoirThemeManager totalmente migrado y listo para usar
**Compatibilidad**: ✅ **100%** - Funciona con el sistema actual sin cambios
**Preparación futura**: ✅ **Lista** - Sistema preparado para evolución a colores