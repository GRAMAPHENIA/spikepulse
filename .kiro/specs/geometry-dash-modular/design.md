# Design Document - Spikepulse

## Overview

Spikepulse será reestructurado como una aplicación web moderna con arquitectura modular basada en ES6 modules, siguiendo principios SOLID y patrones de diseño establecidos. La aplicación mantendrá toda la funcionalidad existente mientras implementa mejores prácticas de desarrollo web, HTML semántico, CSS organizado con metodología BEM, y JavaScript con separación clara de responsabilidades.

### Core Design Principles

1. **Modularidad**: Cada componente tendrá una responsabilidad específica y bien definida
2. **Escalabilidad**: La arquitectura permitirá agregar nuevas funcionalidades fácilmente
3. **Mantenibilidad**: Código limpio, documentado y testeable
4. **Performance**: Optimización de rendering y gestión eficiente de memoria
5. **Accesibilidad**: Cumplimiento de estándares WCAG 2.1
6. **Responsive Design**: Experiencia óptima en todos los dispositivos

## Architecture

### High-Level Architecture

```
Spikepulse Application
├── Core Engine (Game Loop, State Management)
├── Modules
│   ├── Player (Physics, Controls, Abilities)
│   ├── World (Environment, Obstacles, Generation)
│   ├── Renderer (Canvas, Effects, Animations)
│   ├── Input (Keyboard, Mouse, Touch)
│   ├── UI (HUD, Menus, Screens)
│   ├── Audio (Sound Effects, Music)
│   └── Config (Settings, Constants)
├── Utils (Math, Collision, Events)
└── Assets (Styles, Images, Fonts)
```

### Module Pattern Implementation

Cada módulo seguirá el patrón ES6 Module con la siguiente estructura:

```javascript
// modules/player/Player.js
export class Player {
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.init();
    }
    
    init() {
        // Inicialización del módulo
    }
    
    update(deltaTime) {
        // Lógica de actualización
    }
    
    render(renderer) {
        // Lógica de renderizado
    }
}
```

### Event-Driven Architecture

Se implementará un Event Bus centralizado para comunicación entre módulos:

```javascript
// core/EventBus.js
export class EventBus {
    constructor() {
        this.events = new Map();
    }
    
    on(event, callback) {
        // Suscribir a evento
    }
    
    emit(event, data) {
        // Emitir evento
    }
    
    off(event, callback) {
        // Desuscribir de evento
    }
}
```

## Components and Interfaces

### 1. Core Engine

**Responsabilidad**: Gestión del game loop principal, estados del juego y coordinación entre módulos.

```javascript
// core/GameEngine.js
export class GameEngine {
    constructor() {
        this.state = new StateManager();
        this.eventBus = new EventBus();
        this.modules = new Map();
        this.lastTime = 0;
    }
    
    init() {
        this.loadModules();
        this.setupEventListeners();
        this.start();
    }
    
    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.update(deltaTime);
        this.render();
        this.lastTime = currentTime;
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}
```

### 2. State Management

**Responsabilidad**: Gestión de estados del juego con patrón State Machine.

```javascript
// core/StateManager.js
export class StateManager {
    constructor() {
        this.currentState = null;
        this.states = new Map();
        this.history = [];
    }
    
    addState(name, state) {
        this.states.set(name, state);
    }
    
    changeState(stateName, data = {}) {
        // Validar transición y cambiar estado
    }
}

// states/GameStates.js
export const GAME_STATES = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};
```

### 3. Player Module

**Responsabilidad**: Física del jugador, controles y habilidades especiales.

```javascript
// modules/player/Player.js
export class Player {
    constructor(config, eventBus) {
        this.physics = new PlayerPhysics(config.player);
        this.abilities = new PlayerAbilities(config.player);
        this.renderer = new PlayerRenderer();
        this.eventBus = eventBus;
    }
    
    update(deltaTime) {
        this.physics.update(deltaTime);
        this.abilities.update(deltaTime);
        this.checkCollisions();
    }
}

// modules/player/PlayerPhysics.js
export class PlayerPhysics {
    constructor(config) {
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.config = config;
    }
}
```

### 4. World Module

**Responsabilidad**: Generación procedural de obstáculos y gestión del entorno.

```javascript
// modules/world/World.js
export class World {
    constructor(config, eventBus) {
        this.obstacleGenerator = new ObstacleGenerator(config.obstacles);
        this.background = new Background(config.world);
        this.obstacles = [];
    }
    
    update(deltaTime) {
        this.updateObstacles(deltaTime);
        this.generateNewObstacles();
        this.cleanupObstacles();
    }
}

// modules/world/ObstacleGenerator.js
export class ObstacleGenerator {
    constructor(config) {
        this.config = config;
        this.patterns = new ObstaclePatterns();
    }
    
    generate(position) {
        // Generar obstáculos basados en patrones
    }
}
```

### 5. Renderer Module

**Responsabilidad**: Renderizado optimizado del canvas y efectos visuales.

```javascript
// modules/renderer/Renderer.js
export class Renderer {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
        this.effects = new EffectsManager();
    }
    
    render(gameObjects) {
        this.clear();
        this.renderBackground();
        this.renderGameObjects(gameObjects);
        this.renderEffects();
    }
}

// modules/renderer/EffectsManager.js
export class EffectsManager {
    constructor() {
        this.particles = [];
        this.animations = [];
    }
    
    addParticleEffect(type, position, config) {
        // Agregar efecto de partículas
    }
}
```

### 6. Input Module

**Responsabilidad**: Gestión unificada de entrada de teclado, mouse y touch.

```javascript
// modules/input/InputManager.js
export class InputManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.keyboard = new KeyboardHandler();
        this.mouse = new MouseHandler();
        this.touch = new TouchHandler();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Configurar listeners para todos los tipos de input
    }
}
```

### 7. UI Module

**Responsabilidad**: Gestión de interfaz de usuario, HUD y menús.

```javascript
// modules/ui/UIManager.js
export class UIManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.screens = new Map();
        this.hud = new HUD();
        this.currentScreen = null;
    }
    
    showScreen(screenName, data = {}) {
        // Mostrar pantalla específica
    }
}

// modules/ui/HUD.js
export class HUD {
    constructor() {
        this.elements = new Map();
        this.stats = {};
    }
    
    update(gameStats) {
        // Actualizar elementos del HUD
    }
}
```

## Data Models

### Configuration Model

```javascript
// config/GameConfig.js
export const GAME_CONFIG = {
    canvas: {
        width: 800,
        height: 400,
        backgroundColor: '#0F0F0F'
    },
    player: {
        size: { width: 30, height: 30 },
        physics: {
            gravity: 0.5,
            jumpForce: -10,
            maxSpeed: 8,
            friction: 0.85
        },
        abilities: {
            maxJumps: 2,
            dashForce: 8,
            dashDuration: 200,
            dashCooldown: 1000
        },
        visual: {
            color: '#FFD700',
            glowColor: '#FFA500'
        }
    },
    world: {
        scrollSpeed: 4,
        groundHeight: 100,
        obstacleSpacing: 300
    },
    ui: {
        theme: 'spikepulse-dark',
        animations: {
            transitionDuration: 300,
            pulseInterval: 2000
        }
    }
};
```

### Game State Model

```javascript
// models/GameState.js
export class GameState {
    constructor() {
        this.player = {
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            abilities: {
                jumpsRemaining: 2,
                dashAvailable: true,
                gravityDirection: 1
            },
            stats: {
                distance: 0,
                jumps: 0,
                dashes: 0
            }
        };
        this.world = {
            obstacles: [],
            scrollOffset: 0,
            difficulty: 1
        };
        this.ui = {
            currentScreen: 'menu',
            hudVisible: false
        };
    }
}
```

## Error Handling

### Error Management Strategy

1. **Graceful Degradation**: El juego debe continuar funcionando aunque algunos módulos fallen
2. **Error Boundaries**: Cada módulo maneja sus propios errores sin afectar otros
3. **Logging System**: Sistema de logging para debugging y monitoreo
4. **Fallback Mechanisms**: Valores por defecto y comportamientos de respaldo

```javascript
// utils/ErrorHandler.js
export class ErrorHandler {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.errors = [];
    }
    
    handleError(error, context) {
        console.error(`[${context}] ${error.message}`, error);
        this.errors.push({ error, context, timestamp: Date.now() });
        this.eventBus.emit('error', { error, context });
    }
    
    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            this.handleError(event.error, 'global');
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, 'promise');
        });
    }
}
```

## Testing Strategy

### Unit Testing

Cada módulo tendrá tests unitarios usando Jest:

```javascript
// tests/modules/player/Player.test.js
import { Player } from '../../../modules/player/Player.js';
import { EventBus } from '../../../core/EventBus.js';

describe('Player', () => {
    let player;
    let eventBus;
    
    beforeEach(() => {
        eventBus = new EventBus();
        player = new Player(mockConfig, eventBus);
    });
    
    test('should jump when jump method is called', () => {
        player.jump();
        expect(player.physics.velocity.y).toBeLessThan(0);
    });
});
```

### Integration Testing

Tests para verificar la comunicación entre módulos:

```javascript
// tests/integration/GameEngine.test.js
describe('GameEngine Integration', () => {
    test('should coordinate between player and world modules', () => {
        // Test de integración
    });
});
```

### Performance Testing

Monitoreo de performance en tiempo real:

```javascript
// utils/PerformanceMonitor.js
export class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: 0,
            frameTime: 0,
            memoryUsage: 0
        };
    }
    
    startFrame() {
        this.frameStart = performance.now();
    }
    
    endFrame() {
        this.frameTime = performance.now() - this.frameStart;
        this.fps = 1000 / this.frameTime;
    }
}
```

## CSS Architecture

### BEM Methodology

```css
/* styles/components/player.css */
.player {
    /* Bloque base */
}

.player__sprite {
    /* Elemento sprite */
}

.player__sprite--dashing {
    /* Modificador para estado de dash */
}

.player--inverted-gravity {
    /* Modificador para gravedad invertida */
}
```

### CSS Custom Properties

```css
/* styles/tokens/colors.css */
:root {
    /* Spikepulse Brand Colors */
    --sp-primary: #FFD700;
    --sp-secondary: #FF6B6B;
    --sp-accent: #9F7AEA;
    --sp-danger: #E53E3E;
    --sp-success: #38A169;
    
    /* Dark Theme */
    --sp-bg-primary: #0F0F0F;
    --sp-bg-secondary: #1A1A2E;
    --sp-bg-tertiary: #16213E;
    
    /* Typography */
    --sp-font-primary: 'Orbitron', monospace;
    --sp-font-secondary: 'Rajdhani', sans-serif;
    
    /* Spacing */
    --sp-space-xs: 0.25rem;
    --sp-space-sm: 0.5rem;
    --sp-space-md: 1rem;
    --sp-space-lg: 1.5rem;
    --sp-space-xl: 2rem;
    
    /* Animations */
    --sp-transition-fast: 0.15s ease-out;
    --sp-transition-normal: 0.3s ease-out;
    --sp-transition-slow: 0.5s ease-out;
    
    /* Effects */
    --sp-glow-primary: 0 0 20px var(--sp-primary);
    --sp-glow-danger: 0 0 20px var(--sp-danger);
    --sp-pulse-duration: 2s;
}
```

### Component Structure

```css
/* styles/components/game-canvas.css */
.game-canvas {
    display: block;
    margin: 0 auto;
    border: 2px solid var(--sp-accent);
    border-radius: var(--sp-space-sm);
    box-shadow: var(--sp-glow-primary);
    background: var(--sp-bg-primary);
}

.game-canvas--playing {
    animation: pulse-glow var(--sp-pulse-duration) infinite;
}

@keyframes pulse-glow {
    0%, 100% {
        box-shadow: var(--sp-glow-primary);
    }
    50% {
        box-shadow: 0 0 40px var(--sp-primary);
    }
}
```

## HTML Structure

### Semantic HTML

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spikepulse - Domina la Gravedad</title>
    <meta name="description" content="Spikepulse: Un juego de plataformas donde controlas un cubo a través de obstáculos peligrosos usando mecánicas avanzadas.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600&display=swap" rel="stylesheet">
</head>
<body class="spikepulse-app">
    <header class="app-header" role="banner">
        <h1 class="app-title">Spikepulse</h1>
    </header>
    
    <main class="app-main" role="main">
        <section class="game-container" aria-label="Área de juego">
            <canvas class="game-canvas" 
                    width="800" 
                    height="400"
                    aria-label="Canvas del juego Spikepulse"
                    role="img">
                Tu navegador no soporta canvas. Por favor actualiza tu navegador.
            </canvas>
        </section>
        
        <aside class="game-hud" role="complementary" aria-label="Información del juego">
            <div class="hud-stats">
                <div class="stat-item">
                    <span class="stat-label">Distancia</span>
                    <span class="stat-value" id="distance-counter">0m</span>
                </div>
                <!-- Más estadísticas -->
            </div>
        </aside>
    </main>
    
    <nav class="game-controls" role="navigation" aria-label="Controles del juego">
        <button class="control-btn control-btn--primary" 
                id="jump-btn"
                aria-label="Saltar">
            Saltar
        </button>
        <!-- Más controles -->
    </nav>
    
    <div class="screen-overlay screen-overlay--menu" id="menu-screen" role="dialog" aria-labelledby="menu-title">
        <div class="screen-content">
            <h2 id="menu-title" class="screen-title">Spikepulse</h2>
            <p class="screen-description">¡Domina la gravedad y evita los obstáculos!</p>
            <button class="btn btn--primary" id="start-btn">Comenzar Aventura</button>
        </div>
    </div>
</body>
</html>
```

## Performance Optimizations

### Canvas Optimization

1. **Object Pooling**: Reutilización de objetos para evitar garbage collection
2. **Dirty Rectangle Rendering**: Solo renderizar áreas que han cambiado
3. **Layer Separation**: Separar elementos estáticos de dinámicos
4. **Efficient Collision Detection**: Spatial partitioning para optimizar detección de colisiones

### Memory Management

```javascript
// utils/ObjectPool.js
export class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];
        
        // Pre-llenar el pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }
    
    get() {
        let obj = this.pool.pop();
        if (!obj) {
            obj = this.createFn();
        }
        this.active.push(obj);
        return obj;
    }
    
    release(obj) {
        const index = this.active.indexOf(obj);
        if (index > -1) {
            this.active.splice(index, 1);
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }
}
```

### Asset Loading

```javascript
// utils/AssetLoader.js
export class AssetLoader {
    constructor() {
        this.assets = new Map();
        this.loadPromises = new Map();
    }
    
    async loadFont(name, url) {
        if (this.assets.has(name)) return this.assets.get(name);
        
        const font = new FontFace(name, `url(${url})`);
        await font.load();
        document.fonts.add(font);
        this.assets.set(name, font);
        return font;
    }
    
    async loadAll(assetManifest) {
        const promises = assetManifest.map(asset => this.loadAsset(asset));
        await Promise.all(promises);
    }
}
```

## Accessibility Features

### Keyboard Navigation

```javascript
// modules/accessibility/KeyboardNavigation.js
export class KeyboardNavigation {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.focusableElements = [];
        this.currentFocusIndex = 0;
    }
    
    init() {
        this.setupKeyboardListeners();
        this.updateFocusableElements();
    }
    
    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.handleTabNavigation(e.shiftKey);
            }
        });
    }
}
```

### Screen Reader Support

```javascript
// modules/accessibility/ScreenReader.js
export class ScreenReader {
    constructor() {
        this.announcements = [];
    }
    
    announce(message, priority = 'polite') {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
}
```

## Mobile Optimization

### Touch Controls

```javascript
// modules/input/TouchHandler.js
export class TouchHandler {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.touches = new Map();
        this.gestures = new GestureRecognizer();
    }
    
    init() {
        this.setupTouchListeners();
    }
    
    setupTouchListeners() {
        document.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        for (let touch of e.changedTouches) {
            this.touches.set(touch.identifier, {
                startX: touch.clientX,
                startY: touch.clientY,
                currentX: touch.clientX,
                currentY: touch.clientY,
                startTime: Date.now()
            });
        }
    }
}
```

### Responsive Design

```css
/* styles/responsive/mobile.css */
@media (max-width: 768px) {
    .game-canvas {
        width: 100vw;
        height: 50vh;
        max-width: none;
    }
    
    .game-controls {
        position: fixed;
        bottom: var(--sp-space-md);
        left: var(--sp-space-md);
        right: var(--sp-space-md);
        display: flex;
        justify-content: space-between;
        gap: var(--sp-space-sm);
    }
    
    .control-btn {
        flex: 1;
        min-height: 60px;
        font-size: 1.2rem;
        touch-action: manipulation;
    }
}
```

Este diseño proporciona una base sólida para la reestructuración de Spikepulse, manteniendo toda la funcionalidad existente mientras implementa una arquitectura moderna, escalable y mantenible.