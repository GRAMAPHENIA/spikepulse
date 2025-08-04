# Documento de Diseño - Refactorización Modular Spikepulse

## Visión General

La refactorización transformará el archivo monolítico `index.html` (2500+ líneas) en una aplicación modular moderna usando ES6 modules, manteniendo toda la funcionalidad existente mientras mejora significativamente la mantenibilidad y escalabilidad del código.

## Arquitectura

### Estructura de Directorios Propuesta

```
spikepulse/
├── index.html                 # HTML limpio y semántico
├── src/
│   ├── main.js               # Punto de entrada principal
│   ├── core/                 # Núcleo del motor de juego
│   │   ├── GameEngine.js     # Motor principal del juego
│   │   ├── StateManager.js   # Gestión de estados
│   │   └── EventBus.js       # Sistema de eventos (ya existe)
│   ├── modules/              # Módulos de funcionalidad
│   │   ├── player/           # Lógica del jugador
│   │   │   ├── Player.js     # Clase principal del jugador
│   │   │   ├── PlayerPhysics.js # Física del jugador
│   │   │   └── PlayerRenderer.js # Renderizado del jugador
│   │   ├── world/            # Mundo y obstáculos
│   │   │   ├── World.js      # Gestión del mundo
│   │   │   ├── ObstacleManager.js # Generación de obstáculos
│   │   │   └── CollisionDetector.js # Detección de colisiones
│   │   ├── renderer/         # Sistema de renderizado
│   │   │   ├── CanvasRenderer.js # Renderizado principal
│   │   │   ├── EffectsManager.js # Efectos visuales
│   │   │   └── MinimapRenderer.js # Minimapa
│   │   ├── input/            # Gestión de entrada
│   │   │   ├── InputManager.js # Gestor principal de input
│   │   │   ├── KeyboardHandler.js # Controles de teclado
│   │   │   └── TouchHandler.js # Controles táctiles
│   │   └── ui/               # Interfaz de usuario
│   │       ├── UIManager.js  # Gestor de UI
│   │       ├── HUD.js        # Heads-up display
│   │       └── ScreenManager.js # Gestión de pantallas
│   ├── config/               # Configuraciones
│   │   ├── GameConfig.js     # Configuración principal
│   │   ├── PhysicsConfig.js  # Configuración de física
│   │   └── UIConfig.js       # Configuración de UI
│   ├── utils/                # Utilidades
│   │   ├── MathUtils.js      # Utilidades matemáticas
│   │   ├── ObjectPool.js     # Pool de objetos
│   │   └── DebugUtils.js     # Herramientas de debug
│   └── styles/               # Estilos CSS organizados
│       ├── main.css          # Estilos principales
│       ├── components/       # Estilos por componente
│       └── themes/           # Temas (noir, etc.)
├── tests/                    # Tests unitarios e integración
└── docs/                     # Documentación
```

### Patrón de Arquitectura

La aplicación seguirá un patrón **Event-Driven Architecture** con **Module Pattern**, donde:

1. **GameEngine** actúa como coordinador principal
2. **EventBus** maneja toda la comunicación entre módulos
3. Cada módulo es independiente y se comunica solo a través de eventos
4. **StateManager** centraliza el estado del juego

## Componentes e Interfaces

### 1. GameEngine (Núcleo)

**Responsabilidad:** Coordinar todos los módulos y manejar el game loop principal.

```javascript
// src/core/GameEngine.js
export class GameEngine {
    constructor() {
        this.eventBus = new EventBus();
        this.stateManager = new StateManager(this.eventBus);
        this.modules = new Map();
        this.isRunning = false;
        this.lastFrameTime = 0;
    }

    async init() {
        // Cargar configuración
        this.config = await this.loadConfig();
        
        // Inicializar módulos en orden
        await this.initializeModules();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Iniciar game loop
        this.start();
    }

    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastFrameTime;
        
        if (this.stateManager.currentState === 'playing') {
            this.update(deltaTime);
        }
        
        this.render();
        this.lastFrameTime = currentTime;
        
        if (this.isRunning) {
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
}
```

### 2. StateManager (Gestión de Estado)

**Responsabilidad:** Manejar transiciones de estado del juego de forma centralizada.

```javascript
// src/core/StateManager.js
export class StateManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.currentState = 'menu';
        this.previousState = null;
        this.gameState = this.createInitialGameState();
        
        this.setupEventListeners();
    }

    changeState(newState, data = {}) {
        const validTransitions = this.getValidTransitions();
        
        if (!validTransitions[this.currentState]?.includes(newState)) {
            console.warn(`Invalid state transition: ${this.currentState} -> ${newState}`);
            return false;
        }

        this.previousState = this.currentState;
        this.currentState = newState;
        
        this.eventBus.emit('state:changed', {
            from: this.previousState,
            to: newState,
            data
        });
        
        return true;
    }

    getValidTransitions() {
        return {
            'menu': ['playing', 'settings', 'records'],
            'playing': ['paused', 'gameOver', 'menu'],
            'paused': ['playing', 'menu'],
            'gameOver': ['playing', 'menu'],
            'settings': ['menu'],
            'records': ['menu']
        };
    }
}
```

### 3. Player Module

**Responsabilidad:** Manejar toda la lógica relacionada con el jugador.

```javascript
// src/modules/player/Player.js
export class Player {
    constructor(config, eventBus) {
        this.config = config.player;
        this.eventBus = eventBus;
        
        this.physics = new PlayerPhysics(this.config.physics);
        this.renderer = new PlayerRenderer(this.config.visual);
        
        this.state = {
            position: { x: 100, y: 300 },
            velocity: { x: 0, y: 0 },
            onGround: false,
            jumpsLeft: 2,
            dashAvailable: true,
            gravityInverted: false
        };
        
        this.setupEventListeners();
    }

    update(deltaTime) {
        this.physics.update(this.state, deltaTime);
        this.updateAbilities(deltaTime);
        this.emitStateEvents();
    }

    jump() {
        if (this.state.jumpsLeft > 0) {
            this.physics.applyJumpForce(this.state);
            this.state.jumpsLeft--;
            this.eventBus.emit('player:jumped', { 
                position: this.state.position,
                jumpsLeft: this.state.jumpsLeft 
            });
        }
    }

    dash() {
        if (this.state.dashAvailable) {
            this.physics.applyDashForce(this.state);
            this.state.dashAvailable = false;
            this.eventBus.emit('player:dashed', { 
                position: this.state.position 
            });
        }
    }
}
```

### 4. World Module

**Responsabilidad:** Gestionar el mundo del juego, obstáculos y colisiones.

```javascript
// src/modules/world/World.js
export class World {
    constructor(config, eventBus) {
        this.config = config.world;
        this.eventBus = eventBus;
        
        this.obstacleManager = new ObstacleManager(config.obstacles, eventBus);
        this.collisionDetector = new CollisionDetector(eventBus);
        
        this.state = {
            obstacles: [],
            coins: [],
            camera: { x: 0, y: 0 },
            bounds: this.config.bounds
        };
        
        this.setupEventListeners();
    }

    update(deltaTime, playerState) {
        this.updateCamera(playerState.position);
        this.obstacleManager.update(deltaTime, this.state.camera);
        this.collisionDetector.checkCollisions(playerState, this.state.obstacles);
        this.cleanupOffscreenObjects();
    }

    updateCamera(playerPosition) {
        const targetX = playerPosition.x - this.config.camera.offsetX;
        const targetY = playerPosition.y - this.config.camera.offsetY;
        
        // Smooth camera following
        this.state.camera.x += (targetX - this.state.camera.x) * this.config.camera.smoothing;
        this.state.camera.y += (targetY - this.state.camera.y) * this.config.camera.smoothing;
    }
}
```

### 5. Renderer Module

**Responsabilidad:** Manejar todo el renderizado del canvas de forma optimizada.

```javascript
// src/modules/renderer/CanvasRenderer.js
export class CanvasRenderer {
    constructor(canvas, config, eventBus) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config.renderer;
        this.eventBus = eventBus;
        
        this.effectsManager = new EffectsManager(this.ctx, eventBus);
        this.minimapRenderer = new MinimapRenderer(eventBus);
        
        this.renderLayers = new Map();
        this.setupRenderLayers();
    }

    render(gameState) {
        this.clear();
        
        // Render in layers for proper z-ordering
        this.renderLayer('background', gameState);
        this.renderLayer('world', gameState);
        this.renderLayer('player', gameState);
        this.renderLayer('effects', gameState);
        this.renderLayer('ui', gameState);
        
        this.effectsManager.render();
    }

    clear() {
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setupRenderLayers() {
        this.renderLayers.set('background', this.renderBackground.bind(this));
        this.renderLayers.set('world', this.renderWorld.bind(this));
        this.renderLayers.set('player', this.renderPlayer.bind(this));
        this.renderLayers.set('effects', this.renderEffects.bind(this));
        this.renderLayers.set('ui', this.renderUI.bind(this));
    }
}
```

### 6. Input Module

**Responsabilidad:** Gestionar toda la entrada del usuario de forma unificada.

```javascript
// src/modules/input/InputManager.js
export class InputManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.keyboardHandler = new KeyboardHandler(eventBus);
        this.touchHandler = new TouchHandler(eventBus);
        
        this.inputState = {
            keys: new Set(),
            touches: new Map(),
            mouse: { x: 0, y: 0, pressed: false }
        };
        
        this.setupEventListeners();
    }

    init() {
        this.keyboardHandler.init();
        this.touchHandler.init();
        this.setupMouseListeners();
    }

    setupEventListeners() {
        // Escuchar eventos de input y convertirlos a eventos de juego
        this.eventBus.on('input:key-down', this.handleKeyDown.bind(this));
        this.eventBus.on('input:touch-start', this.handleTouchStart.bind(this));
    }

    handleKeyDown(data) {
        const { key } = data;
        
        switch(key) {
            case 'Space':
                this.eventBus.emit('game:jump-requested');
                break;
            case 'ShiftLeft':
                this.eventBus.emit('game:dash-requested');
                break;
            case 'ControlLeft':
                this.eventBus.emit('game:gravity-toggle-requested');
                break;
        }
    }
}
```

### 7. UI Module

**Responsabilidad:** Gestionar toda la interfaz de usuario y HUD.

```javascript
// src/modules/ui/UIManager.js
export class UIManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.hud = new HUD(eventBus);
        this.screenManager = new ScreenManager(eventBus);
        
        this.setupEventListeners();
    }

    init() {
        this.hud.init();
        this.screenManager.init();
        this.setupDOMEventListeners();
    }

    setupEventListeners() {
        this.eventBus.on('state:changed', this.handleStateChange.bind(this));
        this.eventBus.on('player:stats-updated', this.hud.updateStats.bind(this.hud));
        this.eventBus.on('game:score-changed', this.hud.updateScore.bind(this.hud));
    }

    handleStateChange(data) {
        const { to: newState } = data;
        this.screenManager.showScreen(newState);
        
        if (newState === 'playing') {
            this.hud.show();
        } else {
            this.hud.hide();
        }
    }
}
```

## Modelos de Datos

### Configuración del Juego

```javascript
// src/config/GameConfig.js
export const GAME_CONFIG = {
    canvas: {
        width: 1200,
        height: 600,
        backgroundColor: '#000000'
    },
    
    player: {
        physics: {
            gravity: 0.5,
            jumpForce: -10,
            maxSpeed: 8,
            friction: 0.85,
            dashForce: 8,
            dashDuration: 200
        },
        visual: {
            size: { width: 30, height: 30 },
            color: '#FFFFFF',
            glowColor: '#FFD700'
        },
        abilities: {
            maxJumps: 2,
            dashCooldown: 1000
        }
    },
    
    world: {
        bounds: {
            left: 0,
            right: 5000,
            top: -500,
            bottom: 900
        },
        camera: {
            offsetX: 600,
            offsetY: 300,
            smoothing: 0.15
        },
        surface: {
            groundY: 370,
            ceilingY: 30,
            thickness: 30
        }
    },
    
    obstacles: {
        spacing: { min: 150, max: 300 },
        types: ['spike', 'wall', 'moving'],
        difficulty: {
            baseSpeed: 2,
            speedIncrease: 0.1,
            maxSpeed: 8
        }
    },
    
    renderer: {
        backgroundColor: '#0F0F0F',
        showDebug: false,
        enableEffects: true,
        targetFPS: 60
    },
    
    ui: {
        theme: 'noir',
        language: 'es',
        showFPS: false,
        hudElements: ['distance', 'jumps', 'dash', 'gravity']
    }
};
```

### Estado del Juego

```javascript
// src/core/GameState.js
export class GameState {
    constructor() {
        this.player = {
            position: { x: 100, y: 300 },
            velocity: { x: 0, y: 0 },
            onGround: false,
            jumpsLeft: 2,
            dashAvailable: true,
            gravityInverted: false
        };
        
        this.world = {
            camera: { x: 0, y: 0 },
            obstacles: [],
            coins: [],
            scrollOffset: 0
        };
        
        this.stats = {
            distance: 0,
            jumps: 0,
            dashes: 0,
            coins: 0,
            startTime: 0,
            playTime: 0
        };
        
        this.ui = {
            currentScreen: 'menu',
            hudVisible: false,
            showDebug: false
        };
    }
    
    reset() {
        // Resetear a valores iniciales
        Object.assign(this, new GameState());
    }
}
```

## Manejo de Errores

### Estrategia de Manejo de Errores

1. **Aislamiento de Errores**: Cada módulo maneja sus errores sin afectar otros
2. **Degradación Elegante**: El juego continúa funcionando aunque algunos módulos fallen
3. **Logging Centralizado**: Sistema de logging para debugging
4. **Recovery Mechanisms**: Mecanismos de recuperación automática

```javascript
// src/utils/ErrorHandler.js
export class ErrorHandler {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.errors = [];
        this.setupGlobalErrorHandling();
    }

    handleModuleError(moduleName, error, context) {
        const errorInfo = {
            module: moduleName,
            error: error.message,
            context,
            timestamp: Date.now(),
            stack: error.stack
        };
        
        this.errors.push(errorInfo);
        console.error(`[${moduleName}] Error:`, error);
        
        // Emitir evento para que otros módulos puedan reaccionar
        this.eventBus.emit('error:module', errorInfo);
        
        // Intentar recuperación automática
        this.attemptRecovery(moduleName, errorInfo);
    }

    attemptRecovery(moduleName, errorInfo) {
        const recoveryStrategies = {
            'Player': () => this.eventBus.emit('player:reset'),
            'World': () => this.eventBus.emit('world:regenerate'),
            'Renderer': () => this.eventBus.emit('renderer:reinit')
        };
        
        const strategy = recoveryStrategies[moduleName];
        if (strategy) {
            try {
                strategy();
                console.log(`[${moduleName}] Recovery attempted`);
            } catch (recoveryError) {
                console.error(`[${moduleName}] Recovery failed:`, recoveryError);
            }
        }
    }
}
```

## Estrategia de Testing

### Estructura de Testing

```javascript
// tests/modules/Player.test.js
import { Player } from '../../src/modules/player/Player.js';
import { EventBus } from '../../src/core/EventBus.js';
import { GAME_CONFIG } from '../../src/config/GameConfig.js';

describe('Player Module', () => {
    let player;
    let eventBus;
    
    beforeEach(() => {
        eventBus = new EventBus();
        player = new Player(GAME_CONFIG, eventBus);
    });
    
    afterEach(() => {
        player.destroy();
    });
    
    describe('Movement', () => {
        test('should jump when jumps are available', () => {
            const initialY = player.state.position.y;
            player.jump();
            expect(player.state.velocity.y).toBeLessThan(0);
            expect(player.state.jumpsLeft).toBe(1);
        });
        
        test('should not jump when no jumps remaining', () => {
            player.state.jumpsLeft = 0;
            const initialVelocity = player.state.velocity.y;
            player.jump();
            expect(player.state.velocity.y).toBe(initialVelocity);
        });
    });
    
    describe('Dash Ability', () => {
        test('should dash when available', () => {
            player.dash();
            expect(player.state.dashAvailable).toBe(false);
        });
    });
});
```

### Testing de Integración

```javascript
// tests/integration/GameFlow.test.js
describe('Game Flow Integration', () => {
    let gameEngine;
    
    beforeEach(async () => {
        gameEngine = new GameEngine();
        await gameEngine.init();
    });
    
    test('should transition from menu to playing state', () => {
        gameEngine.stateManager.changeState('playing');
        expect(gameEngine.stateManager.currentState).toBe('playing');
    });
    
    test('should handle player input correctly', () => {
        gameEngine.stateManager.changeState('playing');
        
        // Simular input de salto
        gameEngine.eventBus.emit('game:jump-requested');
        
        // Verificar que el jugador saltó
        const playerModule = gameEngine.modules.get('player');
        expect(playerModule.state.velocity.y).toBeLessThan(0);
    });
});
```

## Optimizaciones de Rendimiento

### Object Pooling

```javascript
// src/utils/ObjectPool.js
export class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.available = [];
        this.inUse = [];
        
        // Pre-poblar el pool
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

### Renderizado Optimizado

```javascript
// src/modules/renderer/OptimizedRenderer.js
export class OptimizedRenderer extends CanvasRenderer {
    constructor(canvas, config, eventBus) {
        super(canvas, config, eventBus);
        this.dirtyRegions = [];
        this.lastRenderState = null;
    }
    
    render(gameState) {
        // Solo renderizar si hay cambios
        if (this.hasStateChanged(gameState)) {
            this.calculateDirtyRegions(gameState);
            this.renderDirtyRegions(gameState);
            this.lastRenderState = this.cloneState(gameState);
        }
    }
    
    hasStateChanged(gameState) {
        if (!this.lastRenderState) return true;
        
        // Comparación rápida de propiedades críticas
        return (
            gameState.player.position.x !== this.lastRenderState.player.position.x ||
            gameState.player.position.y !== this.lastRenderState.player.position.y ||
            gameState.world.obstacles.length !== this.lastRenderState.world.obstacles.length
        );
    }
}
```

## Plan de Migración

### Fase 1: Preparación

1. Crear estructura de directorios
2. Extraer configuraciones a archivos separados
3. Implementar EventBus y StateManager

### Fase 2: Módulos Core

1. Crear GameEngine básico
2. Migrar lógica del Player
3. Implementar InputManager básico

### Fase 3: Renderizado

1. Extraer lógica de renderizado a CanvasRenderer
2. Implementar EffectsManager
3. Migrar minimapa

### Fase 4: World y UI

1. Crear World module con obstáculos
2. Implementar UIManager y HUD
3. Migrar sistema de pantallas

### Fase 5: Optimización y Testing

1. Implementar optimizaciones de rendimiento
2. Agregar herramientas de debugging
3. Crear tests unitarios básicos

### Fase 6: Limpieza

1. Limpiar HTML de JavaScript inline
2. Organizar CSS en archivos separados
3. Documentar API de módulos

Este diseño proporciona una base sólida para la refactorización, manteniendo toda la funcionalidad existente mientras mejora significativamente la arquitectura del código.
