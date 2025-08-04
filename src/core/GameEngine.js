/**
 * Motor principal del juego Spikepulse
 * @module GameEngine
 */

import { EventBus } from './EventBus.js';
import { StateManager } from './StateManager.js';
import { GameState } from './GameState.js';
import { createInputSystem } from '../modules/input/index.js';
import { createRenderingSystem } from '../modules/renderer/index.js';
import { createUISystem } from '../modules/ui/index.js';
import { createDebugSystem } from '../modules/debug/index.js';

export class GameEngine {
    /**
     * Crea una nueva instancia del motor de juego
     * @param {Object} config - Configuración del juego
     */
    constructor(config = {}) {
        this.config = config;
        this.isInitialized = false;
        this.isRunning = false;
        
        // Núcleo del motor
        this.eventBus = new EventBus();
        this.stateManager = new StateManager(config.states || {}, this.eventBus);
        this.gameState = new GameState(this.eventBus, config);
        
        // Sistemas del juego
        this.systems = {
            input: null,
            rendering: null,
            ui: null,
            debug: null
        };
        
        // Game loop
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fps = 60;
        this.frameCount = 0;
        this.animationFrameId = null;
        
        // Datos del juego
        this.gameData = {
            distance: 0,
            score: 0,
            lives: 3,
            coins: 0,
            time: 0,
            level: 1
        };
        
        // Estado del jugador
        this.player = {
            position: { x: 150, y: 300 },
            velocity: { x: 0, y: 0 },
            onGround: true,
            jumpsLeft: 2,
            maxJumps: 2,
            dashAvailable: true,
            dashCooldown: 0,
            gravityInverted: false,
            isAlive: true,
            size: 30
        };
        
        // Configuración de física
        this.physics = {
            gravity: 0.5,
            jumpForce: -12,
            dashForce: 8,
            dashDuration: 200,
            groundY: 450, // Posición del suelo
            ceilingY: 150 // Posición del techo
        };
        
        console.log('🎮 GameEngine creado');
    }
    
    /**
     * Inicializa el motor de juego
     */
    async init() {
        try {
            console.log('🔧 Inicializando GameEngine...');
            
            // Inicializar núcleo
            await this.stateManager.init();
            await this.gameState.init();
            
            // Crear y inicializar sistemas
            await this.initializeSystems();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Configurar UI básica
            this.setupBasicUI();
            
            // Establecer estado inicial (sin iniciar game loop aún)
            this.stateManager.setState('menu');
            
            this.isInitialized = true;
            console.log('✅ GameEngine inicializado');
            
            // Emitir evento de inicialización
            this.eventBus.emit('game:initialized', {
                systems: Object.keys(this.systems),
                config: this.config
            });
            
        } catch (error) {
            console.error('❌ Error inicializando GameEngine:', error);
            throw error;
        }
    }
    
    /**
     * Inicializa todos los sistemas del juego
     */
    async initializeSystems() {
        console.log('🔧 Inicializando sistemas del juego...');
        
        // Sistema de input
        this.systems.input = createInputSystem(this.config, this.eventBus);
        await this.systems.input.init();
        
        // Sistema de renderizado
        this.systems.rendering = createRenderingSystem(this.config, this.eventBus);
        await this.systems.rendering.init();
        
        // Sistema de UI
        this.systems.ui = createUISystem(this.config, this.eventBus);
        await this.systems.ui.init();
        
        // Sistema de debug
        this.systems.debug = createDebugSystem(this.config, this.eventBus);
        await this.systems.debug.init();
        
        // Establecer referencias cruzadas
        this.systems.debug.setGameReferences(
            this,
            this.systems.rendering.canvasRenderer.canvas,
            this.systems.rendering.canvasRenderer.ctx
        );
        
        console.log('✅ Todos los sistemas inicializados');
    }
    
    /**
     * Configura event listeners del motor
     */
    setupEventListeners() {
        // Eventos de control del juego
        this.eventBus.on('game:start', this.startGame.bind(this));
        this.eventBus.on('game:pause', this.pauseGame.bind(this));
        this.eventBus.on('game:resume', this.resumeGame.bind(this));
        this.eventBus.on('game:restart', this.restartGame.bind(this));
        this.eventBus.on('game:stop', this.stopGame.bind(this));
        this.eventBus.on('game:reset', this.resetGame.bind(this));
        
        // Eventos de estado
        this.eventBus.on('game:toggle-pause', this.togglePause.bind(this));
        this.eventBus.on('game:game-over', this.handleGameOver.bind(this));
        this.eventBus.on('game:state-changed', this.handleStateChange.bind(this));
        
        // Eventos de GameState
        this.eventBus.on('gamestate:changed', this.handleGameStateChange.bind(this));
        this.eventBus.on('gamestate:save-error', this.handleSaveError.bind(this));
        this.eventBus.on('gamestate:load-error', this.handleLoadError.bind(this));
        
        // Eventos de input del jugador
        this.eventBus.on('input:jump', this.handlePlayerJump.bind(this));
        this.eventBus.on('input:dash', this.handlePlayerDash.bind(this));
        this.eventBus.on('input:gravity', this.handlePlayerGravity.bind(this));
        this.eventBus.on('input:pause', this.handleGamePause.bind(this));
        
        console.log('👂 Event listeners del motor configurados');
    }
    
    /**
     * Configura la UI básica del juego
     */
    setupBasicUI() {
        // Crear el sistema de UI básico directamente en el DOM
        this.createBasicUI();
        
        console.log('🎨 UI básica configurada');
    }
    
    /**
     * Crea la UI básica del juego
     */
    createBasicUI() {
        // Crear contenedor de UI si no existe
        let uiContainer = document.getElementById('spikepulse-ui');
        if (!uiContainer) {
            uiContainer = document.createElement('div');
            uiContainer.id = 'spikepulse-ui';
            uiContainer.className = 'spikepulse-ui';
            document.body.appendChild(uiContainer);
        }
        
        // Crear pantalla de menú
        const menuScreen = document.createElement('div');
        menuScreen.id = 'menu-screen';
        menuScreen.className = 'screen screen-menu';
        menuScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: 'Orbitron', sans-serif;
            color: white;
        `;
        
        // Título del juego
        const title = document.createElement('h1');
        title.textContent = 'Spikepulse';
        title.style.cssText = `
            font-size: 4rem;
            color: #FFD700;
            text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            margin-bottom: 2rem;
            animation: pulse 2s infinite;
        `;
        
        // Subtítulo
        const subtitle = document.createElement('p');
        subtitle.textContent = '¡Domina la gravedad y evita los obstáculos!';
        subtitle.style.cssText = `
            font-size: 1.5rem;
            color: #CCCCCC;
            margin-bottom: 3rem;
            text-align: center;
        `;
        
        // Botón de inicio
        const startButton = document.createElement('button');
        startButton.textContent = 'Comenzar Aventura';
        startButton.style.cssText = `
            padding: 1rem 2rem;
            font-size: 1.5rem;
            font-family: 'Orbitron', sans-serif;
            font-weight: bold;
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #000;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
        `;
        
        // Efectos hover del botón
        startButton.addEventListener('mouseenter', () => {
            startButton.style.transform = 'translateY(-2px)';
            startButton.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.5)';
        });
        
        startButton.addEventListener('mouseleave', () => {
            startButton.style.transform = 'translateY(0)';
            startButton.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)';
        });
        
        // Event listener del botón
        startButton.addEventListener('click', () => {
            console.log('🚀 Botón "Comenzar Aventura" presionado desde GameEngine');
            this.startGame();
        });
        
        // Ensamblar menú
        menuScreen.appendChild(title);
        menuScreen.appendChild(subtitle);
        menuScreen.appendChild(startButton);
        uiContainer.appendChild(menuScreen);
        
        // Guardar referencia
        this.menuScreen = menuScreen;
        
        // Mostrar menú inicialmente
        this.showMenu();
        
        console.log('🎮 Menú principal creado y mostrado');
    }
    
    /**
     * Inicia el juego
     */
    startGame() {
        console.log('🚀 Iniciando juego...');
        
        // Ocultar menú del HTML primero
        const htmlMenu = document.getElementById('main-menu');
        if (htmlMenu) {
            htmlMenu.style.display = 'none';
            console.log('📋 Menú HTML ocultado');
        }
        
        // Cambiar estado a jugando
        this.stateManager.setState('playing');
        
        // Resetear datos del juego
        this.resetGameData();
        
        // Iniciar game loop si no está corriendo
        if (!this.isRunning) {
            this.startGameLoop();
        }
        
        // Emitir evento
        this.eventBus.emit('game:started', {
            timestamp: Date.now()
        });
        
        console.log('✅ Juego iniciado');
        
        // Ocultar menú del GameEngine también
        this.hideMenu();
    }
    
    /**
     * Muestra el menú principal
     */
    showMenu() {
        if (this.menuScreen) {
            this.menuScreen.style.display = 'flex';
            this.menuScreen.style.visibility = 'visible';
            this.menuScreen.style.opacity = '1';
            console.log('📋 Menú principal mostrado');
        } else {
            console.warn('⚠️ menuScreen no existe');
        }
    }
    
    /**
     * Oculta el menú principal
     */
    hideMenu() {
        if (this.menuScreen) {
            this.menuScreen.style.display = 'none';
            console.log('📋 Menú principal ocultado');
        }
    }
    
    /**
     * Pausa el juego
     */
    pauseGame() {
        if (this.stateManager.getState() !== 'playing') return;
        
        console.log('⏸️ Pausando juego...');
        
        this.stateManager.setState('paused');
        
        // Emitir evento
        this.eventBus.emit('game:paused', {
            timestamp: Date.now()
        });
    }
    
    /**
     * Reanuda el juego
     */
    resumeGame() {
        if (this.stateManager.getState() !== 'paused') return;
        
        console.log('▶️ Reanudando juego...');
        
        this.stateManager.setState('playing');
        
        // Emitir evento
        this.eventBus.emit('game:resumed', {
            timestamp: Date.now()
        });
    }
    
    /**
     * Reinicia el juego
     */
    restartGame() {
        console.log('🔄 Reiniciando juego...');
        
        // Resetear datos
        this.resetGameData();
        
        // Resetear sistemas
        this.resetSystems();
        
        // Iniciar de nuevo
        this.startGame();
        
        // Emitir evento
        this.eventBus.emit('game:restarted', {
            timestamp: Date.now()
        });
    }
    
    /**
     * Detiene el juego
     */
    stopGame() {
        console.log('⏹️ Deteniendo juego...');
        
        this.stateManager.setState('menu');
        
        // Mostrar menú del HTML
        const htmlMenu = document.getElementById('main-menu');
        if (htmlMenu) {
            htmlMenu.style.display = 'flex';
            console.log('📋 Menú HTML mostrado');
        }
        
        // Mostrar menú del GameEngine también
        this.showMenu();
        
        // Emitir evento
        this.eventBus.emit('game:stopped', {
            timestamp: Date.now()
        });
    }
    
    /**
     * Resetea el juego completamente
     */
    resetGame() {
        console.log('🔄 Reseteando juego completamente...');
        
        // Detener game loop
        this.stopGameLoop();
        
        // Resetear datos
        this.resetGameData();
        
        // Resetear sistemas
        this.resetSystems();
        
        // Volver al menú
        this.stateManager.setState('menu');
        
        // Mostrar menú
        this.showMenu();
        
        // Emitir evento
        this.eventBus.emit('game:reset', {
            timestamp: Date.now()
        });
    }
    
    /**
     * Alterna pausa/resume
     */
    togglePause() {
        const currentState = this.stateManager.getState();
        
        if (currentState === 'playing') {
            this.pauseGame();
        } else if (currentState === 'paused') {
            this.resumeGame();
        }
    }
    
    /**
     * Maneja game over
     * @param {Object} data - Datos del game over
     */
    handleGameOver(data) {
        console.log('💀 Game Over');
        
        this.stateManager.setState('game-over');
        
        // Actualizar datos finales
        if (data) {
            this.gameData = { ...this.gameData, ...data };
        }
        
        // Emitir evento
        this.eventBus.emit('game:over', {
            ...this.gameData,
            timestamp: Date.now()
        });
    }
    
    /**
     * Maneja cambios de estado del juego
     * @param {Object} data - Datos del cambio de estado
     */
    handleStateChange(data) {
        console.log(`🎯 Estado cambiado a: ${data.state}`);
        
        switch (data.state) {
            case 'menu':
                this.showMenu();
                break;
            case 'playing':
                this.hideMenu();
                break;
            case 'paused':
                // El menú permanece oculto durante la pausa
                break;
            case 'game-over':
                // Podrías mostrar una pantalla de game over aquí
                break;
        }
    }
    
    /**
     * Resetea los datos del juego
     */
    resetGameData() {
        // Resetear estado centralizado
        this.gameState.resetState(true); // Mantener configuraciones
        
        // Resetear gameData legacy para compatibilidad
        this.gameData = {
            distance: 0,
            score: 0,
            lives: 3,
            coins: 0,
            time: 0,
            level: 1
        };
        
        // Resetear jugador
        this.player = {
            position: { x: 150, y: 300 },
            velocity: { x: 0, y: 0 },
            onGround: true,
            jumpsLeft: 2,
            maxJumps: 2,
            dashAvailable: true,
            dashCooldown: 0,
            gravityInverted: false,
            isAlive: true,
            size: 30
        };
        
        console.log('🔄 Jugador reseteado');
        
        // Actualizar UI
        this.eventBus.emit('game:data-updated', this.gameData);
    }
    
    /**
     * Maneja cambios en el estado del juego
     * @param {Object} data - Datos del cambio
     */
    handleGameStateChange(data) {
        const { path, newValue, oldValue } = data;
        
        // Log para debugging
        console.log(`🔄 Estado cambiado: ${path} = ${JSON.stringify(newValue)}`);
        
        // Manejar cambios específicos
        switch (path) {
            case 'stats.distance':
                // Actualizar gameData legacy
                this.gameData.distance = newValue;
                break;
                
            case 'stats.score':
                this.gameData.score = newValue;
                break;
                
            case 'stats.coins':
                this.gameData.coins = newValue;
                break;
                
            case 'player.isAlive':
                if (!newValue && oldValue) {
                    // El jugador murió
                    this.handleGameOver({ reason: 'death' });
                }
                break;
        }
    }
    
    /**
     * Maneja errores de guardado
     * @param {Object} data - Datos del error
     */
    handleSaveError(data) {
        console.error('💾❌ Error guardando estado:', data.error);
        
        // Mostrar notificación al usuario (si hay sistema de UI)
        this.eventBus.emit('ui:show-notification', {
            type: 'error',
            message: 'Error al guardar el progreso',
            duration: 3000
        });
    }
    
    /**
     * Maneja errores de carga
     * @param {Object} data - Datos del error
     */
    handleLoadError(data) {
        console.error('📂❌ Error cargando estado:', data.error);
        
        // Mostrar notificación al usuario
        this.eventBus.emit('ui:show-notification', {
            type: 'warning',
            message: 'No se pudo cargar el progreso anterior',
            duration: 3000
        });
    }
    
    /**
     * Maneja el salto del jugador
     * @param {Object} data - Datos del input
     */
    handlePlayerJump(data) {
        if (this.stateManager.getState() !== 'playing') return;
        
        console.log('🦘 Jugador intenta saltar');
        
        if (this.player.jumpsLeft > 0) {
            this.player.velocity.y = this.physics.jumpForce * (this.player.gravityInverted ? -1 : 1);
            this.player.jumpsLeft--;
            this.player.onGround = false;
            
            console.log(`🦘 Salto ejecutado, saltos restantes: ${this.player.jumpsLeft}`);
            
            // Actualizar estadísticas
            this.gameState.set('stats.jumps', this.gameState.get('stats.jumps') + 1);
            
            // Emitir evento
            this.eventBus.emit('player:jumped', {
                position: { ...this.player.position },
                jumpsLeft: this.player.jumpsLeft
            });
        } else {
            console.log('🚫 No hay saltos disponibles');
        }
    }
    
    /**
     * Maneja el dash del jugador
     * @param {Object} data - Datos del input
     */
    handlePlayerDash(data) {
        if (this.stateManager.getState() !== 'playing') return;
        
        console.log('⚡ Jugador intenta dash');
        
        if (this.player.dashAvailable) {
            this.player.velocity.x = this.physics.dashForce;
            this.player.dashAvailable = false;
            this.player.dashCooldown = this.physics.dashDuration;
            
            console.log('⚡ Dash ejecutado');
            
            // Actualizar estadísticas
            this.gameState.set('stats.dashes', this.gameState.get('stats.dashes') + 1);
            
            // Emitir evento
            this.eventBus.emit('player:dashed', {
                position: { ...this.player.position }
            });
        } else {
            console.log('🚫 Dash no disponible');
        }
    }
    
    /**
     * Maneja el cambio de gravedad
     * @param {Object} data - Datos del input
     */
    handlePlayerGravity(data) {
        if (this.stateManager.getState() !== 'playing') return;
        
        console.log('🔄 Jugador cambia gravedad');
        
        this.player.gravityInverted = !this.player.gravityInverted;
        
        console.log(`🔄 Gravedad ${this.player.gravityInverted ? 'invertida' : 'normal'}`);
        
        // Emitir evento
        this.eventBus.emit('player:gravity-changed', {
            inverted: this.player.gravityInverted
        });
    }
    
    /**
     * Maneja la pausa del juego
     * @param {Object} data - Datos del input
     */
    handleGamePause(data) {
        console.log('⏸️ Jugador presiona pausa');
        this.togglePause();
    }
    
    /**
     * Resetea todos los sistemas
     */
    resetSystems() {
        Object.values(this.systems).forEach(system => {
            if (system && system.reset) {
                system.reset();
            }
        });
    }
    
    /**
     * Inicia el game loop
     */
    startGameLoop() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        
        const gameLoop = (currentTime) => {
            if (!this.isRunning) return;
            
            // Calcular delta time
            this.deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            
            // Limitar delta time para evitar saltos grandes
            this.deltaTime = Math.min(this.deltaTime, 1/30); // Max 30fps
            
            // Actualizar FPS
            this.frameCount++;
            if (this.frameCount % 60 === 0) {
                this.fps = 1 / this.deltaTime;
            }
            
            // Actualizar juego
            this.update(this.deltaTime);
            
            // Renderizar juego
            this.render(this.deltaTime);
            
            // Continuar loop
            this.animationFrameId = requestAnimationFrame(gameLoop);
        };
        
        this.animationFrameId = requestAnimationFrame(gameLoop);
        console.log('▶️ Game loop iniciado');
    }
    
    /**
     * Detiene el game loop
     */
    stopGameLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        this.isRunning = false;
        console.log('⏹️ Game loop detenido');
    }
    
    /**
     * Actualiza el juego
     * @param {number} deltaTime - Delta time
     */
    update(deltaTime) {
        const currentState = this.stateManager.getState();
        
        // Solo actualizar si está jugando
        if (currentState !== 'playing') return;
        
        // Actualizar tiempo de juego
        this.gameData.time += deltaTime;
        
        // Actualizar sistemas
        if (this.systems.input) {
            this.systems.input.update(deltaTime);
        }
        
        if (this.systems.rendering) {
            this.systems.rendering.update(deltaTime);
        }
        
        if (this.systems.ui) {
            this.systems.ui.update(deltaTime);
        }
        
        if (this.systems.debug) {
            this.systems.debug.update(deltaTime);
        }
        
        // Actualizar datos del juego (simulado por ahora)
        this.updateGameLogic(deltaTime);
        
        // Emitir evento de actualización
        this.eventBus.emit('game:update-complete', {
            deltaTime,
            gameData: this.gameData
        });
    }
    
    /**
     * Actualiza la lógica del juego
     * @param {number} deltaTime - Delta time
     */
    updateGameLogic(deltaTime) {
        // Actualizar física del jugador
        this.updatePlayerPhysics(deltaTime);
        
        // Obtener estado actual del juego
        const currentStats = this.gameState.get('stats');
        
        // Actualizar distancia y puntuación
        const newDistance = currentStats.distance + (100 * deltaTime); // 100 unidades por segundo
        const newScore = Math.floor(newDistance);
        
        // Actualizar estado centralizado
        this.gameState.set('stats.distance', newDistance);
        this.gameState.set('stats.score', newScore);
        
        // Mantener compatibilidad con gameData legacy
        this.gameData.distance = newDistance;
        this.gameData.score = newScore;
        this.gameData.time += deltaTime;
        
        // Emitir eventos específicos
        this.eventBus.emit('game:distance-changed', { distance: newDistance });
        this.eventBus.emit('game:score-changed', { score: newScore });
        
        // Actualizar UI con nuevos datos
        this.eventBus.emit('game:data-updated', this.gameData);
        
        // Emitir estado del jugador para el renderizado
        this.eventBus.emit('player:state-updated', {
            player: { ...this.player },
            gameData: { ...this.gameData }
        });
    }
    
    /**
     * Actualiza la física del jugador
     * @param {number} deltaTime - Delta time
     */
    updatePlayerPhysics(deltaTime) {
        // Aplicar gravedad
        const gravityDirection = this.player.gravityInverted ? -1 : 1;
        this.player.velocity.y += this.physics.gravity * gravityDirection * deltaTime * 60; // 60fps base
        
        // Aplicar velocidad a la posición
        this.player.position.x += this.player.velocity.x * deltaTime * 60;
        this.player.position.y += this.player.velocity.y * deltaTime * 60;
        
        // Fricción en X
        this.player.velocity.x *= 0.95;
        
        // Verificar colisiones con el suelo y techo
        this.checkGroundCollision();
        
        // Actualizar cooldowns
        this.updatePlayerCooldowns(deltaTime);
        
        // Mantener al jugador en pantalla (X)
        if (this.player.position.x < this.player.size / 2) {
            this.player.position.x = this.player.size / 2;
            this.player.velocity.x = 0;
        }
        
        if (this.player.position.x > 1200 - this.player.size / 2) {
            this.player.position.x = 1200 - this.player.size / 2;
            this.player.velocity.x = 0;
        }
    }
    
    /**
     * Verifica colisiones con el suelo y techo
     */
    checkGroundCollision() {
        const halfSize = this.player.size / 2;
        
        if (!this.player.gravityInverted) {
            // Gravedad normal - verificar suelo
            if (this.player.position.y + halfSize >= this.physics.groundY) {
                this.player.position.y = this.physics.groundY - halfSize;
                this.player.velocity.y = 0;
                this.player.onGround = true;
                this.player.jumpsLeft = this.player.maxJumps; // Resetear saltos
                this.player.dashAvailable = true; // Resetear dash
            } else {
                this.player.onGround = false;
            }
        } else {
            // Gravedad invertida - verificar techo
            if (this.player.position.y - halfSize <= this.physics.ceilingY) {
                this.player.position.y = this.physics.ceilingY + halfSize;
                this.player.velocity.y = 0;
                this.player.onGround = true;
                this.player.jumpsLeft = this.player.maxJumps; // Resetear saltos
                this.player.dashAvailable = true; // Resetear dash
            } else {
                this.player.onGround = false;
            }
        }
    }
    
    /**
     * Actualiza los cooldowns del jugador
     * @param {number} deltaTime - Delta time
     */
    updatePlayerCooldowns(deltaTime) {
        // Cooldown del dash
        if (this.player.dashCooldown > 0) {
            this.player.dashCooldown -= deltaTime * 1000; // Convertir a ms
            
            if (this.player.dashCooldown <= 0) {
                this.player.dashCooldown = 0;
                if (this.player.onGround) {
                    this.player.dashAvailable = true;
                }
            }
        }
    }
    
    /**
     * Renderiza el juego
     * @param {number} deltaTime - Delta time
     */
    render(deltaTime) {
        // Renderizar sistemas
        if (this.systems.rendering) {
            this.systems.rendering.render(deltaTime);
        }
        
        // Renderizar debug overlays
        if (this.systems.debug && this.systems.rendering) {
            this.systems.debug.renderDebugOverlays(
                this.systems.rendering.canvasRenderer.ctx,
                {} // Por ahora objetos vacíos
            );
        }
        
        // Registrar frame para debug
        if (this.systems.debug) {
            this.systems.debug.recordFrame({
                fps: this.fps,
                deltaTime: deltaTime * 1000,
                timestamp: Date.now()
            });
        }
        
        // Emitir evento de renderizado
        this.eventBus.emit('game:render-complete', {
            deltaTime,
            fps: this.fps
        });
    }
    
    /**
     * Obtiene el estado actual del juego
     * @returns {string} Estado actual
     */
    getState() {
        return this.stateManager.getState();
    }
    
    /**
     * Obtiene los datos actuales del juego
     * @returns {Object} Datos del juego
     */
    getGameData() {
        return { ...this.gameData };
    }
    
    /**
     * Obtiene estadísticas del motor
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            isInitialized: this.isInitialized,
            isRunning: this.isRunning,
            currentState: this.stateManager.getState(),
            fps: this.fps,
            frameCount: this.frameCount,
            deltaTime: this.deltaTime,
            gameData: this.gameData,
            systems: Object.keys(this.systems).reduce((acc, key) => {
                acc[key] = this.systems[key] !== null;
                return acc;
            }, {})
        };
    }
    
    /**
     * Obtiene información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            engine: this.getStats(),
            systems: Object.keys(this.systems).reduce((acc, key) => {
                if (this.systems[key] && this.systems[key].getDebugInfo) {
                    acc[key] = this.systems[key].getDebugInfo();
                }
                return acc;
            }, {}),
            stateManager: this.stateManager.getDebugInfo(),
            gameState: this.gameState.getDebugInfo()
        };
    }
    
    /**
     * Destruye el motor de juego
     */
    destroy() {
        console.log('🧹 Destruyendo GameEngine...');
        
        // Detener game loop
        this.stopGameLoop();
        
        // Destruir sistemas
        Object.values(this.systems).forEach(system => {
            if (system && system.destroy) {
                system.destroy();
            }
        });
        
        // Destruir núcleo
        if (this.stateManager) {
            this.stateManager.destroy();
        }
        
        if (this.gameState) {
            this.gameState.destroy();
        }
        
        // Limpiar referencias
        this.systems = {};
        this.eventBus = null;
        this.stateManager = null;
        
        this.isInitialized = false;
        
        console.log('✅ GameEngine destruido');
    }
}