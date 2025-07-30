# Spikepulse Implementation Guide

## Implementation Workflow

### Before Starting Any Task

1. Read the relevant requirements from the spec document
2. Review the design document for architectural context
3. Check existing code to understand current patterns
4. Plan the implementation approach before coding

### During Implementation

1. Follow the established module structure
2. Implement one feature at a time
3. Test functionality as you build
4. Document any architectural decisions
5. Ensure code follows project standards

### After Completing a Task

1. Test the implemented functionality thoroughly
2. Update documentation if needed
3. Check for performance implications
4. Verify accessibility requirements are met

## Module Implementation Patterns

### Standard Module Template

```javascript
/**
 * [Module Name] - [Brief description]
 * @module [ModuleName]
 */

export class [ModuleName] {
    /**
     * Creates a new [ModuleName] instance
     * @param {Object} config - Configuration object
     * @param {EventBus} eventBus - Event bus for communication
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        this.init();
    }
    
    /**
     * Initialize the module
     * @private
     */
    init() {
        this.setupEventListeners();
        this.isInitialized = true;
    }
    
    /**
     * Set up event listeners
     * @private
     */
    setupEventListeners() {
        // Event listener setup
    }
    
    /**
     * Update module state
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        if (!this.isInitialized) return;
        // Update logic
    }
    
    /**
     * Render module (if applicable)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        if (!this.isInitialized) return;
        // Render logic
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        this.eventBus.off('*', this);
        this.isInitialized = false;
    }
}
```

### Event Bus Usage Patterns

```javascript
// Emitting events
this.eventBus.emit('player:jump', { position: this.position });
this.eventBus.emit('game:score-changed', { score: newScore });
this.eventBus.emit('ui:show-screen', { screen: 'gameOver' });

// Listening to events
this.eventBus.on('input:jump', this.handleJump.bind(this));
this.eventBus.on('collision:detected', this.handleCollision.bind(this));
this.eventBus.on('game:state-changed', this.handleStateChange.bind(this));
```

### Configuration Access Patterns

```javascript
// Access nested configuration
const playerSpeed = this.config.player.physics.maxSpeed;
const canvasWidth = this.config.canvas.width;
const obstacleColor = this.config.obstacles.color;

// Use configuration with defaults
const jumpForce = this.config.player?.physics?.jumpForce ?? -10;
const dashDuration = this.config.player?.abilities?.dashDuration ?? 200;
```

## CSS Implementation Patterns

### BEM Class Structure

```css
/* Block */
.spikepulse-player {
    /* Base player styles */
}

/* Elements */
.spikepulse-player__sprite {
    /* Player sprite styles */
}

.spikepulse-player__trail {
    /* Dash trail styles */
}

/* Modifiers */
.spikepulse-player--dashing {
    /* Dashing state styles */
}

.spikepulse-player--inverted-gravity {
    /* Inverted gravity styles */
}

/* State combinations */
.spikepulse-player--dashing.spikepulse-player--inverted-gravity {
    /* Combined state styles */
}
```

### CSS Custom Properties Usage

```css
/* Define in root or component */
:root {
    --sp-player-color: #FFD700;
    --sp-player-glow: 0 0 20px var(--sp-player-color);
    --sp-dash-duration: 0.2s;
}

/* Use in components */
.spikepulse-player {
    background-color: var(--sp-player-color);
    box-shadow: var(--sp-player-glow);
    transition: transform var(--sp-dash-duration) ease-out;
}
```

### Animation Implementation

```css
/* Keyframe animations */
@keyframes sp-pulse {
    0%, 100% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.1);
        opacity: 0.8;
    }
}

/* Animation classes */
.sp-pulse-animation {
    animation: sp-pulse var(--sp-pulse-duration) infinite;
}

/* Performance-optimized animations */
.sp-smooth-transform {
    will-change: transform;
    transform: translateZ(0); /* Force hardware acceleration */
}
```

## HTML Implementation Patterns

### Semantic Structure

```html
<!-- Game container with proper semantics in Spanish -->
<main class="spikepulse-game" role="main" aria-label="Juego Spikepulse">
    <section class="game-canvas-container" aria-label="Área de Juego">
        <canvas class="game-canvas" 
                width="800" 
                height="400"
                aria-label="Canvas del juego Spikepulse"
                role="img">
            El juego requiere soporte para canvas
        </canvas>
    </section>
    
    <aside class="game-hud" role="complementary" aria-label="Estadísticas del Juego">
        <div class="hud-stats">
            <div class="stat-item">
                <span class="stat-label">Distancia</span>
                <span class="stat-value" id="distance-display" aria-live="polite">0m</span>
            </div>
        </div>
    </aside>
</main>
```

### Accessible Controls

```html
<!-- Button with proper accessibility in Spanish -->
<button class="sp-control-btn sp-control-btn--primary" 
        id="jump-btn"
        aria-label="Saltar (Barra espaciadora o clic)"
        aria-describedby="jump-help">
    <span class="btn-text">Saltar</span>
    <span class="btn-icon" aria-hidden="true">⬆</span>
</button>

<div id="jump-help" class="sr-only">
    Presiona la barra espaciadora, haz clic o toca para hacer saltar al jugador
</div>
```

## Error Handling Patterns

### Module Error Handling

```javascript
class PlayerModule {
    update(deltaTime) {
        try {
            this.updatePhysics(deltaTime);
            this.updateAbilities(deltaTime);
        } catch (error) {
            this.handleError(error, 'update');
        }
    }
    
    handleError(error, context) {
        console.error(`[Player] Error in ${context}:`, error);
        this.eventBus.emit('error:player', { error, context });
        
        // Graceful degradation
        this.resetToSafeState();
    }
    
    resetToSafeState() {
        // Reset to known good state
        this.velocity = { x: 0, y: 0 };
        this.abilities.reset();
    }
}
```

### Global Error Handling

```javascript
// In main application file
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Log to error tracking service
    // Show user-friendly error message
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault(); // Prevent console error
});
```

## Performance Implementation Patterns

### Object Pooling

```javascript
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.available = [];
        this.inUse = [];
        
        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.available.push(this.createFn());
        }
    }
    
    acquire() {
        let obj = this.available.pop();
        if (!obj) {
            obj = this.createFn();
        }
        this.inUse.push(obj);
        return obj;
    }
    
    release(obj) {
        const index = this.inUse.indexOf(obj);
        if (index > -1) {
            this.inUse.splice(index, 1);
            this.resetFn(obj);
            this.available.push(obj);
        }
    }
}
```

### Efficient Rendering

```javascript
class Renderer {
    render(gameObjects) {
        // Clear only dirty regions
        this.clearDirtyRegions();
        
        // Sort objects by render layer
        const sortedObjects = this.sortByLayer(gameObjects);
        
        // Batch similar render operations
        this.batchRender(sortedObjects);
        
        // Update dirty regions
        this.updateDirtyRegions(gameObjects);
    }
    
    batchRender(objects) {
        // Group objects by render type
        const batches = this.groupByRenderType(objects);
        
        // Render each batch
        batches.forEach(batch => {
            this.setupBatchRender(batch.type);
            batch.objects.forEach(obj => obj.render(this.ctx));
        });
    }
}
```

## Testing Implementation Patterns

### Unit Test Structure

```javascript
// tests/modules/Player.test.js
import { Player } from '../../src/modules/Player.js';
import { EventBus } from '../../src/core/EventBus.js';

describe('Player Module', () => {
    let player;
    let eventBus;
    let mockConfig;
    
    beforeEach(() => {
        eventBus = new EventBus();
        mockConfig = {
            player: {
                physics: { jumpForce: -10, gravity: 0.5 },
                abilities: { maxJumps: 2 }
            }
        };
        player = new Player(mockConfig, eventBus);
    });
    
    afterEach(() => {
        player.destroy();
    });
    
    describe('jumping', () => {
        test('should jump when jump method is called', () => {
            const initialY = player.position.y;
            player.jump();
            expect(player.velocity.y).toBeLessThan(0);
        });
        
        test('should not jump when no jumps remaining', () => {
            player.jumpsRemaining = 0;
            const initialVelocity = player.velocity.y;
            player.jump();
            expect(player.velocity.y).toBe(initialVelocity);
        });
    });
});
```

### Integration Test Patterns

```javascript
// tests/integration/GameFlow.test.js
describe('Game Flow Integration', () => {
    test('should transition from menu to playing state', async () => {
        const game = new GameEngine();
        await game.init();
        
        // Start game
        game.eventBus.emit('ui:start-game');
        
        // Verify state change
        expect(game.state.current).toBe('playing');
        expect(game.modules.get('player').isActive).toBe(true);
    });
});
```

## Common Implementation Gotchas

### Canvas Context Issues

```javascript
// Always check context exists
if (!this.ctx) {
    console.warn('Canvas context not available');
    return;
}

// Save/restore context state
this.ctx.save();
// ... rendering operations
this.ctx.restore();
```

### Event Listener Cleanup

```javascript
class Module {
    constructor() {
        this.boundHandlers = {
            handleResize: this.handleResize.bind(this),
            handleKeyDown: this.handleKeyDown.bind(this)
        };
    }
    
    init() {
        window.addEventListener('resize', this.boundHandlers.handleResize);
        document.addEventListener('keydown', this.boundHandlers.handleKeyDown);
    }
    
    destroy() {
        window.removeEventListener('resize', this.boundHandlers.handleResize);
        document.removeEventListener('keydown', this.boundHandlers.handleKeyDown);
    }
}
```

### Mobile Touch Handling

```javascript
// Prevent default touch behaviors
element.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling, zooming
    this.handleTouch(e);
}, { passive: false });

// Handle multiple touches
handleTouchStart(e) {
    for (let touch of e.changedTouches) {
        this.activeTouches.set(touch.identifier, {
            startX: touch.clientX,
            startY: touch.clientY,
            element: touch.target
        });
    }
}
```

Remember: Always implement features incrementally, test thoroughly, and maintain the established patterns for consistency across the codebase.#

# Spanish Language Implementation Patterns

### UI Text Constants

```javascript
// config/SpanishText.js
export const SPANISH_TEXT = {
    // Main UI
    GAME_TITLE: 'Spikepulse',
    START_GAME: 'Comenzar Aventura',
    PAUSE_GAME: 'Pausa',
    RESUME_GAME: 'Reanudar',
    RESTART_GAME: 'Reiniciar',
    GAME_OVER: '¡Juego Terminado!',
    
    // Game Stats
    DISTANCE: 'Distancia',
    SCORE: 'Puntuación',
    JUMPS: 'Saltos',
    DASH_AVAILABLE: 'Dash Disponible',
    GRAVITY: 'Gravedad',
    VELOCITY: 'Velocidad',
    
    // Controls
    JUMP: 'Saltar',
    DASH: 'Dash',
    MOVE_LEFT: 'Mover Izquierda',
    MOVE_RIGHT: 'Mover Derecha',
    TOGGLE_GRAVITY: 'Cambiar Gravedad',
    
    // Game States
    LOADING: 'Cargando...',
    READY: 'Listo',
    PLAYING: 'Jugando',
    PAUSED: 'Pausado',
    
    // Messages
    WELCOME_MESSAGE: '¡Domina la gravedad y evita los obstáculos!',
    GAME_OVER_MESSAGE: '¡Inténtalo de nuevo!',
    NEW_RECORD: '¡Nuevo récord!',
    
    // Instructions
    JUMP_INSTRUCTION: 'Presiona ESPACIO o toca para saltar',
    DASH_INSTRUCTION: 'Presiona SHIFT para hacer dash',
    GRAVITY_INSTRUCTION: 'Presiona CTRL para cambiar gravedad',
    MOVE_INSTRUCTION: 'Usa las flechas o A/D para moverte',
    
    // Accessibility
    CANVAS_ALT: 'Canvas del juego Spikepulse',
    GAME_AREA_LABEL: 'Área de juego principal',
    STATS_AREA_LABEL: 'Estadísticas del juego',
    CONTROLS_AREA_LABEL: 'Controles del juego',
    
    // Error Messages
    CANVAS_NOT_SUPPORTED: 'Tu navegador no soporta canvas. Por favor actualiza tu navegador.',
    LOADING_ERROR: 'Error al cargar el juego. Por favor recarga la página.',
    SAVE_ERROR: 'No se pudo guardar el progreso.',
    
    // Units
    METERS: 'm',
    SECONDS: 's',
    POINTS: 'pts'
};
```

### Spanish Number Formatting

```javascript
// utils/SpanishFormatter.js
export class SpanishFormatter {
    /**
     * Format numbers using Spanish conventions
     * @param {number} number - Number to format
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted number
     */
    static formatNumber(number, decimals = 0) {
        return number.toLocaleString('es-ES', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }
    
    /**
     * Format distance with Spanish units
     * @param {number} distance - Distance in meters
     * @returns {string} Formatted distance
     */
    static formatDistance(distance) {
        return `${this.formatNumber(distance, 1)}m`;
    }
    
    /**
     * Format time with Spanish units
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time
     */
    static formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}min ${this.formatNumber(remainingSeconds, 0)}s`;
        }
        return `${this.formatNumber(seconds, 1)}s`;
    }
}
```

### Spanish Error Messages

```javascript
// utils/SpanishErrorHandler.js
export class SpanishErrorHandler {
    static getErrorMessage(errorType, context = '') {
        const messages = {
            CANVAS_ERROR: 'Error en el canvas del juego',
            PHYSICS_ERROR: 'Error en la física del juego',
            INPUT_ERROR: 'Error en los controles',
            SAVE_ERROR: 'Error al guardar los datos',
            LOAD_ERROR: 'Error al cargar el juego',
            NETWORK_ERROR: 'Error de conexión',
            UNKNOWN_ERROR: 'Error desconocido'
        };
        
        const baseMessage = messages[errorType] || messages.UNKNOWN_ERROR;
        return context ? `${baseMessage}: ${context}` : baseMessage;
    }
    
    static logError(error, context) {
        const spanishMessage = this.getErrorMessage(error.type, context);
        console.error(`[Spikepulse] ${spanishMessage}`, error);
    }
}
```

### Spanish Accessibility Announcements

```javascript
// modules/accessibility/SpanishScreenReader.js
export class SpanishScreenReader {
    constructor() {
        this.announcements = [];
    }
    
    announce(messageKey, data = {}, priority = 'polite') {
        const messages = {
            GAME_STARTED: 'Juego iniciado',
            PLAYER_JUMPED: 'Jugador saltó',
            DASH_USED: 'Dash utilizado',
            GRAVITY_CHANGED: 'Gravedad cambiada',
            OBSTACLE_HIT: 'Obstáculo golpeado',
            GAME_OVER: 'Juego terminado',
            SCORE_UPDATE: `Distancia: ${data.distance} metros`,
            PAUSE_TOGGLE: data.paused ? 'Juego pausado' : 'Juego reanudado'
        };
        
        const message = messages[messageKey] || messageKey;
        this.createAnnouncement(message, priority);
    }
    
    createAnnouncement(message, priority) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            if (document.body.contains(announcement)) {
                document.body.removeChild(announcement);
            }
        }, 1000);
    }
}
```

### Spanish HTML Template

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spikepulse - Domina la Gravedad</title>
    <meta name="description" content="Spikepulse: Un emocionante juego de plataformas donde controlas un cubo a través de obstáculos peligrosos usando mecánicas avanzadas como salto doble, dash y gravedad invertida.">
    <meta name="keywords" content="juego, plataformas, español, spikepulse, geometry dash, salto, gravedad">
</head>
<body class="spikepulse-app">
    <header class="app-header" role="banner">
        <h1 class="app-title">Spikepulse</h1>
        <p class="app-subtitle">Domina la Gravedad</p>
    </header>
    
    <main class="app-main" role="main">
        <!-- Game content in Spanish -->
    </main>
    
    <footer class="app-footer" role="contentinfo">
        <p>&copy; 2024 Spikepulse - Todos los derechos reservados</p>
    </footer>
</body>
</html>
```

Remember: Every user-facing element, message, and interaction must be in Spanish to provide a complete Spanish gaming experience. Use proper Spanish grammar, gaming terminology, and cultural conventions throughout the implementation.
