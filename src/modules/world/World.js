/**
 * Módulo del mundo para Spikepulse
 * @module World
 */

import { ObstacleManager } from './ObstacleManager.js';
import { CollisionDetector } from './CollisionDetector.js';
import { Camera } from './Camera.js';
import { WorldRenderer } from './WorldRenderer.js';

export class World {
    /**
     * Crea una nueva instancia del mundo
     * @param {Object} config - Configuración del juego
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        // Configuración del mundo
        this.worldConfig = config.world || {};
        
        // Límites del mundo
        this.bounds = {
            left: this.worldConfig.bounds?.left || 0,
            right: this.worldConfig.bounds?.right || 5000,
            top: this.worldConfig.bounds?.top || -500,
            bottom: this.worldConfig.bounds?.bottom || 900
        };
        
        // Superficie del mundo
        this.surface = {
            groundY: this.worldConfig.surface?.groundY || 370,
            ceilingY: this.worldConfig.surface?.ceilingY || 30,
            thickness: this.worldConfig.surface?.thickness || 30,
            color: this.worldConfig.surface?.color || '#333333'
        };
        
        // Estado del mundo
        this.state = {
            scrollOffset: 0,
            difficulty: 1.0,
            timeElapsed: 0,
            distanceTraveled: 0,
            isActive: false
        };
        
        // Sistemas del mundo
        this.obstacleManager = null;
        this.collisionDetector = null;
        this.camera = null;
        this.worldRenderer = null;
        
        // Elementos del mundo
        this.obstacles = [];
        this.coins = [];
        this.collectibles = [];
        
        // Configuración de generación
        this.generation = {
            lookAhead: this.worldConfig.generation?.lookAhead || 2000,
            cleanupDistance: this.worldConfig.generation?.cleanupDistance || 500,
            lastGeneratedX: 0,
            seed: Date.now()
        };
        
        // Referencia al jugador
        this.player = null;
        
        console.log('🌍 World creado');
        this.init();
    }
    
    /**
     * Inicializa el mundo
     */
    async init() {
        try {
            console.log('🔧 Inicializando World...');
            
            // Inicializar sistemas
            await this.initializeSystems();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Generar contenido inicial
            this.generateInitialContent();
            
            this.isInitialized = true;
            console.log('✅ World inicializado');
            
            // Emitir evento de inicialización
            this.eventBus.emit('world:initialized', {
                bounds: this.bounds,
                surface: this.surface,
                state: this.state
            });
            
        } catch (error) {
            console.error('❌ Error inicializando World:', error);
            throw error;
        }
    }
    
    /**
     * Inicializa los sistemas del mundo
     */
    async initializeSystems() {
        // Inicializar cámara
        this.camera = new Camera(this.worldConfig.camera || {}, this.eventBus);
        await this.camera.init();
        
        // Inicializar gestor de obstáculos
        this.obstacleManager = new ObstacleManager(
            this.config.obstacles || {}, 
            this.eventBus,
            this.bounds
        );
        await this.obstacleManager.init();
        
        // Inicializar detector de colisiones
        this.collisionDetector = new CollisionDetector(
            this.config.physics || {},
            this.eventBus,
            this.bounds
        );
        await this.collisionDetector.init();
        
        // Inicializar renderizador del mundo
        this.worldRenderer = new WorldRenderer(
            this.config,
            this.eventBus,
            this.surface
        );
        await this.worldRenderer.init();
        
        console.log('🔧 Sistemas del mundo inicializados');
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Escuchar eventos del jugador
        this.eventBus.on('player:initialized', this.handlePlayerInitialized.bind(this));
        this.eventBus.on('player:updated', this.handlePlayerUpdated.bind(this));
        this.eventBus.on('player:died', this.handlePlayerDied.bind(this));
        this.eventBus.on('player:reset', this.handlePlayerReset.bind(this));
        
        // Escuchar eventos de estado del juego
        this.eventBus.on('state:changed', this.handleStateChange.bind(this));
        
        // Escuchar eventos de cámara
        this.eventBus.on('camera:shake', this.handleCameraShake.bind(this));
        
        // Escuchar eventos de colisiones
        this.eventBus.on('collision:detected', this.handleCollisionDetected.bind(this));
        
        console.log('👂 Event listeners del World configurados');
    }
    
    /**
     * Genera contenido inicial del mundo
     */
    generateInitialContent() {
        // Generar obstáculos iniciales
        this.obstacleManager.generateObstacles(0, this.generation.lookAhead);
        
        // Generar monedas iniciales
        this.generateCoins(0, this.generation.lookAhead);
        
        // Actualizar posición de última generación
        this.generation.lastGeneratedX = this.generation.lookAhead;
        
        console.log('🏗️ Contenido inicial del mundo generado');
    }
    
    /**
     * Actualización con timestep fijo
     * @param {number} fixedDelta - Delta time fijo
     */
    fixedUpdate(fixedDelta) {
        if (!this.isInitialized || !this.state.isActive) return;
        
        // Actualizar estado del mundo
        this.updateWorldState(fixedDelta);
        
        // Actualizar sistemas
        this.obstacleManager.fixedUpdate(fixedDelta);
        this.collisionDetector.fixedUpdate(fixedDelta);
        
        // Generar contenido dinámicamente
        this.updateContentGeneration();
        
        // Limpiar contenido lejano
        this.cleanupDistantContent();
        
        // Actualizar dificultad
        this.updateDifficulty();
    }
    
    /**
     * Actualización con timestep variable
     * @param {number} deltaTime - Delta time variable
     * @param {number} interpolation - Factor de interpolación
     */
    update(deltaTime, interpolation) {
        if (!this.isInitialized) return;
        
        // Actualizar cámara
        this.camera.update(deltaTime, interpolation);
        
        // Actualizar sistemas de renderizado
        this.worldRenderer.update(deltaTime, interpolation);
        
        // Actualizar elementos del mundo
        this.updateCoins(deltaTime);
        this.updateCollectibles(deltaTime);
    }
    
    /**
     * Actualiza el estado del mundo
     * @param {number} deltaTime - Delta time
     */
    updateWorldState(deltaTime) {
        this.state.timeElapsed += deltaTime;
        
        // Actualizar distancia basada en la posición del jugador
        if (this.player) {
            this.state.distanceTraveled = Math.max(
                this.state.distanceTraveled,
                this.player.state.position.x * 0.1 // Convertir píxeles a metros
            );
        }
        
        // Actualizar scroll offset
        this.state.scrollOffset = this.camera.getPosition().x;
    }
    
    /**
     * Actualiza la generación de contenido
     */
    updateContentGeneration() {
        if (!this.player) return;
        
        const playerX = this.player.state.position.x;
        const generateUntil = playerX + this.generation.lookAhead;
        
        // Generar más contenido si es necesario
        if (generateUntil > this.generation.lastGeneratedX) {
            const startX = this.generation.lastGeneratedX;
            const endX = generateUntil;
            
            // Generar obstáculos
            this.obstacleManager.generateObstacles(startX, endX);
            
            // Generar monedas
            this.generateCoins(startX, endX);
            
            this.generation.lastGeneratedX = endX;
        }
    }
    
    /**
     * Limpia contenido distante
     */
    cleanupDistantContent() {
        if (!this.player) return;
        
        const playerX = this.player.state.position.x;
        const cleanupThreshold = playerX - this.generation.cleanupDistance;
        
        // Limpiar obstáculos
        this.obstacles = this.obstacles.filter(obstacle => {
            if (obstacle.x < cleanupThreshold) {
                this.obstacleManager.removeObstacle(obstacle);
                return false;
            }
            return true;
        });
        
        // Limpiar monedas
        this.coins = this.coins.filter(coin => coin.x >= cleanupThreshold);
        
        // Limpiar coleccionables
        this.collectibles = this.collectibles.filter(item => item.x >= cleanupThreshold);
    }
    
    /**
     * Actualiza la dificultad del mundo
     */
    updateDifficulty() {
        // Aumentar dificultad basada en distancia
        const baseDifficulty = 1.0;
        const difficultyIncrease = this.config.obstacles?.difficulty?.densityIncrease || 0.05;
        
        this.state.difficulty = baseDifficulty + (this.state.distanceTraveled * difficultyIncrease);
        this.state.difficulty = Math.min(this.state.difficulty, 3.0); // Máximo 3x
        
        // Notificar cambio de dificultad
        this.obstacleManager.setDifficulty(this.state.difficulty);
    }
    
    /**
     * Genera monedas en un rango
     * @param {number} startX - Posición X inicial
     * @param {number} endX - Posición X final
     */
    generateCoins(startX, endX) {
        const coinSpacing = 200; // Espaciado entre monedas
        const coinHeight = this.surface.groundY - 50; // Altura de las monedas
        
        for (let x = startX; x < endX; x += coinSpacing) {
            // Probabilidad de generar moneda
            if (Math.random() < 0.3) {
                this.coins.push({
                    x: x + Math.random() * 100,
                    y: coinHeight + (Math.random() - 0.5) * 100,
                    collected: false,
                    value: 10,
                    type: 'coin',
                    animation: {
                        rotation: 0,
                        bobOffset: Math.random() * Math.PI * 2,
                        scale: 1
                    }
                });
            }
        }
    }
    
    /**
     * Actualiza las monedas
     * @param {number} deltaTime - Delta time
     */
    updateCoins(deltaTime) {
        for (const coin of this.coins) {
            if (coin.collected) continue;
            
            // Animación de rotación
            coin.animation.rotation += 0.05;
            
            // Animación de flotación
            coin.animation.bobOffset += 0.03;
            coin.y += Math.sin(coin.animation.bobOffset) * 0.5;
            
            // Verificar colisión con jugador
            if (this.player && this.checkCoinCollection(coin)) {
                this.collectCoin(coin);
            }
        }
    }
    
    /**
     * Actualiza los coleccionables
     * @param {number} deltaTime - Delta time
     */
    updateCollectibles(deltaTime) {
        for (const item of this.collectibles) {
            if (item.collected) continue;
            
            // Actualizar animación específica del tipo
            this.updateCollectibleAnimation(item, deltaTime);
            
            // Verificar colisión con jugador
            if (this.player && this.checkCollectibleCollection(item)) {
                this.collectItem(item);
            }
        }
    }
    
    /**
     * Verifica si el jugador puede recoger una moneda
     * @param {Object} coin - Moneda a verificar
     * @returns {boolean} True si puede recogerla
     */
    checkCoinCollection(coin) {
        const playerHitbox = this.player.getHitbox();
        const coinSize = 20;
        
        return this.collisionDetector.checkRectangleCollision(
            playerHitbox,
            {
                x: coin.x - coinSize / 2,
                y: coin.y - coinSize / 2,
                width: coinSize,
                height: coinSize
            }
        );
    }
    
    /**
     * Recoge una moneda
     * @param {Object} coin - Moneda a recoger
     */
    collectCoin(coin) {
        coin.collected = true;
        
        console.log(`💰 Moneda recogida: +${coin.value} puntos`);
        
        // Emitir evento de recolección
        this.eventBus.emit('world:coin-collected', {
            coin,
            position: { x: coin.x, y: coin.y },
            value: coin.value
        });
        
        // Crear efecto visual
        this.createCoinCollectionEffect(coin);
    }
    
    /**
     * Verifica si el jugador puede recoger un coleccionable
     * @param {Object} item - Coleccionable a verificar
     * @returns {boolean} True si puede recogerlo
     */
    checkCollectibleCollection(item) {
        const playerHitbox = this.player.getHitbox();
        
        return this.collisionDetector.checkRectangleCollision(
            playerHitbox,
            {
                x: item.x - item.size / 2,
                y: item.y - item.size / 2,
                width: item.size,
                height: item.size
            }
        );
    }
    
    /**
     * Recoge un coleccionable
     * @param {Object} item - Coleccionable a recoger
     */
    collectItem(item) {
        item.collected = true;
        
        console.log(`✨ Coleccionable recogido: ${item.type}`);
        
        // Emitir evento de recolección
        this.eventBus.emit('world:item-collected', {
            item,
            position: { x: item.x, y: item.y },
            type: item.type
        });
        
        // Aplicar efecto del coleccionable
        this.applyCollectibleEffect(item);
    }
    
    /**
     * Actualiza la animación de un coleccionable
     * @param {Object} item - Coleccionable
     * @param {number} deltaTime - Delta time
     */
    updateCollectibleAnimation(item, deltaTime) {
        switch (item.type) {
            case 'powerup':
                item.animation.pulse += 0.1;
                item.animation.scale = 1 + Math.sin(item.animation.pulse) * 0.2;
                break;
                
            case 'speed_boost':
                item.animation.rotation += 0.08;
                break;
                
            case 'shield':
                item.animation.glow += 0.05;
                break;
        }
    }
    
    /**
     * Aplica el efecto de un coleccionable
     * @param {Object} item - Coleccionable
     */
    applyCollectibleEffect(item) {
        switch (item.type) {
            case 'powerup':
                this.eventBus.emit('player:powerup-collected', { type: 'jump_boost' });
                break;
                
            case 'speed_boost':
                this.eventBus.emit('player:speed-boost', { duration: 5000, multiplier: 1.5 });
                break;
                
            case 'shield':
                this.eventBus.emit('player:shield-activated', { duration: 3000 });
                break;
        }
    }
    
    /**
     * Crea efecto visual de recolección de moneda
     * @param {Object} coin - Moneda recogida
     */
    createCoinCollectionEffect(coin) {
        // Crear partículas doradas
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const speed = 2 + Math.random() * 2;
            
            this.eventBus.emit('effects:create-particle', {
                x: coin.x,
                y: coin.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 500,
                color: '#FFD700',
                size: 3
            });
        }
    }
    
    /**
     * Renderiza el mundo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    render(ctx) {
        if (!this.isInitialized) return;
        
        this.worldRenderer.render(ctx);
    }
    
    /**
     * Obtiene objetos de renderizado para el sistema de capas
     * @returns {Array} Objetos de renderizado
     */
    getRenderObjects() {
        if (!this.isInitialized) return [];
        
        const renderObjects = [];
        
        // Objetos del mundo
        renderObjects.push(...this.worldRenderer.getRenderObjects());
        
        // Obstáculos
        renderObjects.push(...this.obstacleManager.getRenderObjects());
        
        // Monedas
        renderObjects.push(...this.getCoinsRenderObjects());
        
        // Coleccionables
        renderObjects.push(...this.getCollectiblesRenderObjects());
        
        return renderObjects;
    }
    
    /**
     * Obtiene objetos de renderizado de monedas
     * @returns {Array} Objetos de renderizado de monedas
     */
    getCoinsRenderObjects() {
        return this.coins
            .filter(coin => !coin.collected)
            .map(coin => ({
                layer: 'world',
                zIndex: 1,
                render: (ctx) => this.renderCoin(ctx, coin)
            }));
    }
    
    /**
     * Obtiene objetos de renderizado de coleccionables
     * @returns {Array} Objetos de renderizado de coleccionables
     */
    getCollectiblesRenderObjects() {
        return this.collectibles
            .filter(item => !item.collected)
            .map(item => ({
                layer: 'world',
                zIndex: 2,
                render: (ctx) => this.renderCollectible(ctx, item)
            }));
    }
    
    /**
     * Renderiza una moneda
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} coin - Moneda a renderizar
     */
    renderCoin(ctx, coin) {
        ctx.save();
        
        const cameraPos = this.camera.getPosition();
        const screenX = coin.x - cameraPos.x;
        const screenY = coin.y - cameraPos.y;
        
        ctx.translate(screenX, screenY);
        ctx.rotate(coin.animation.rotation);
        ctx.scale(coin.animation.scale, coin.animation.scale);
        
        // Renderizar moneda dorada
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Símbolo de moneda
        ctx.fillStyle = '#FFA500';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);
        
        ctx.restore();
    }
    
    /**
     * Renderiza un coleccionable
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} item - Coleccionable a renderizar
     */
    renderCollectible(ctx, item) {
        ctx.save();
        
        const cameraPos = this.camera.getPosition();
        const screenX = item.x - cameraPos.x;
        const screenY = item.y - cameraPos.y;
        
        ctx.translate(screenX, screenY);
        ctx.rotate(item.animation.rotation || 0);
        ctx.scale(item.animation.scale || 1, item.animation.scale || 1);
        
        // Renderizar según tipo
        switch (item.type) {
            case 'powerup':
                this.renderPowerup(ctx, item);
                break;
            case 'speed_boost':
                this.renderSpeedBoost(ctx, item);
                break;
            case 'shield':
                this.renderShield(ctx, item);
                break;
        }
        
        ctx.restore();
    }
    
    /**
     * Renderiza un powerup
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} item - Powerup
     */
    renderPowerup(ctx, item) {
        ctx.fillStyle = '#9F7AEA';
        ctx.strokeStyle = '#7C3AED';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(0, 0, item.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Símbolo de poder
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', 0, 0);
    }
    
    /**
     * Renderiza un speed boost
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} item - Speed boost
     */
    renderSpeedBoost(ctx, item) {
        ctx.fillStyle = '#10B981';
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(0, 0, item.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Símbolo de velocidad
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('→', 0, 0);
    }
    
    /**
     * Renderiza un escudo
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {Object} item - Escudo
     */
    renderShield(ctx, item) {
        ctx.fillStyle = '#3B82F6';
        ctx.strokeStyle = '#1D4ED8';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(0, 0, item.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Símbolo de escudo
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛡', 0, 0);
    }    

    // ===== MANEJO DE EVENTOS =====
    
    /**
     * Maneja la inicialización del jugador
     * @param {Object} data - Datos del jugador
     */
    handlePlayerInitialized(data) {
        // Obtener referencia al jugador desde el GameEngine
        setTimeout(() => {
            const gameEngine = window.gameEngine;
            if (gameEngine) {
                this.player = gameEngine.getModule('player');
                console.log('👤 Referencia al jugador establecida en World');
            }
        }, 100);
    }
    
    /**
     * Maneja actualizaciones del jugador
     * @param {Object} data - Datos de actualización del jugador
     */
    handlePlayerUpdated(data) {
        if (!this.player) return;
        
        // Actualizar cámara para seguir al jugador
        this.camera.setTarget(data.position);
        
        // Verificar colisiones
        this.checkCollisions();
    }
    
    /**
     * Maneja la muerte del jugador
     * @param {Object} data - Datos de la muerte
     */
    handlePlayerDied(data) {
        this.state.isActive = false;
        console.log('💀 Jugador murió - World pausado');
    }
    
    /**
     * Maneja el reset del jugador
     * @param {Object} data - Datos del reset
     */
    handlePlayerReset(data) {
        this.resetWorld();
        console.log('🔄 World reseteado con el jugador');
    }
    
    /**
     * Maneja cambios de estado del juego
     * @param {Object} data - Datos del cambio de estado
     */
    handleStateChange(data) {
        const { to, from } = data;
        
        switch (to) {
            case 'playing':
                this.state.isActive = true;
                break;
                
            case 'paused':
            case 'menu':
            case 'gameOver':
                this.state.isActive = false;
                break;
        }
    }
    
    /**
     * Maneja eventos de shake de cámara
     * @param {Object} data - Datos del shake
     */
    handleCameraShake(data) {
        this.camera.shake(data.intensity, data.duration);
    }
    
    /**
     * Maneja colisiones detectadas
     * @param {Object} data - Datos de la colisión
     */
    handleCollisionDetected(data) {
        const { type, objectA, objectB, correction } = data;
        
        // Procesar diferentes tipos de colisiones
        switch (type) {
            case 'player-obstacle':
                this.eventBus.emit('collision:player-obstacle', data);
                break;
                
            case 'player-ground':
                this.eventBus.emit('collision:player-ground', data);
                break;
                
            case 'player-ceiling':
                this.eventBus.emit('collision:player-ceiling', data);
                break;
                
            case 'player-wall':
                this.eventBus.emit('collision:player-wall', data);
                break;
        }
    }
    
    // ===== VERIFICACIÓN DE COLISIONES =====
    
    /**
     * Verifica todas las colisiones del mundo
     */
    checkCollisions() {
        if (!this.player || !this.player.state.isAlive) return;
        
        const playerHitbox = this.player.getHitbox();
        
        // Verificar colisiones con obstáculos
        this.checkObstacleCollisions(playerHitbox);
        
        // Verificar colisiones con superficies
        this.checkSurfaceCollisions(playerHitbox);
        
        // Verificar límites del mundo
        this.checkWorldBounds(playerHitbox);
    }
    
    /**
     * Verifica colisiones con obstáculos
     * @param {Object} playerHitbox - Hitbox del jugador
     */
    checkObstacleCollisions(playerHitbox) {
        const obstacles = this.obstacleManager.getObstacles();
        
        for (const obstacle of obstacles) {
            if (this.collisionDetector.checkObstacleCollision(playerHitbox, obstacle)) {
                this.eventBus.emit('collision:detected', {
                    type: 'player-obstacle',
                    objectA: 'player',
                    objectB: obstacle,
                    position: {
                        x: (playerHitbox.x + obstacle.x) / 2,
                        y: (playerHitbox.y + obstacle.y) / 2
                    }
                });
                break; // Solo procesar una colisión por frame
            }
        }
    }
    
    /**
     * Verifica colisiones con superficies
     * @param {Object} playerHitbox - Hitbox del jugador
     */
    checkSurfaceCollisions(playerHitbox) {
        // Verificar colisión con el suelo
        if (this.checkGroundCollision(playerHitbox)) {
            const correction = this.calculateGroundCorrection(playerHitbox);
            this.eventBus.emit('collision:detected', {
                type: 'player-ground',
                objectA: 'player',
                objectB: 'ground',
                correction,
                normal: { x: 0, y: -1 }
            });
        }
        
        // Verificar colisión con el techo
        if (this.checkCeilingCollision(playerHitbox)) {
            const correction = this.calculateCeilingCorrection(playerHitbox);
            this.eventBus.emit('collision:detected', {
                type: 'player-ceiling',
                objectA: 'player',
                objectB: 'ceiling',
                correction,
                normal: { x: 0, y: 1 }
            });
        }
    }
    
    /**
     * Verifica colisión con el suelo
     * @param {Object} hitbox - Hitbox a verificar
     * @returns {boolean} True si hay colisión
     */
    checkGroundCollision(hitbox) {
        return hitbox.y + hitbox.height >= this.surface.groundY;
    }
    
    /**
     * Verifica colisión con el techo
     * @param {Object} hitbox - Hitbox a verificar
     * @returns {boolean} True si hay colisión
     */
    checkCeilingCollision(hitbox) {
        return hitbox.y <= this.surface.ceilingY + this.surface.thickness;
    }
    
    /**
     * Calcula corrección para colisión con el suelo
     * @param {Object} hitbox - Hitbox del jugador
     * @returns {Object} Corrección de posición
     */
    calculateGroundCorrection(hitbox) {
        return {
            x: 0,
            y: this.surface.groundY - (hitbox.y + hitbox.height)
        };
    }
    
    /**
     * Calcula corrección para colisión con el techo
     * @param {Object} hitbox - Hitbox del jugador
     * @returns {Object} Corrección de posición
     */
    calculateCeilingCorrection(hitbox) {
        return {
            x: 0,
            y: (this.surface.ceilingY + this.surface.thickness) - hitbox.y
        };
    }
    
    /**
     * Verifica límites del mundo
     * @param {Object} hitbox - Hitbox del jugador
     */
    checkWorldBounds(hitbox) {
        // Verificar límites horizontales
        if (hitbox.x < this.bounds.left || hitbox.x + hitbox.width > this.bounds.right) {
            this.eventBus.emit('collision:detected', {
                type: 'player-wall',
                objectA: 'player',
                objectB: 'world-boundary',
                normal: { x: hitbox.x < this.bounds.left ? 1 : -1, y: 0 }
            });
        }
        
        // Verificar límites verticales (muerte)
        if (hitbox.y > this.bounds.bottom || hitbox.y + hitbox.height < this.bounds.top) {
            this.eventBus.emit('player:out-of-bounds', {
                position: { x: hitbox.x, y: hitbox.y },
                bounds: this.bounds
            });
        }
    }
    
    // ===== MÉTODOS DE UTILIDAD =====
    
    /**
     * Resetea el mundo al estado inicial
     */
    resetWorld() {
        // Resetear estado
        this.state.scrollOffset = 0;
        this.state.difficulty = 1.0;
        this.state.timeElapsed = 0;
        this.state.distanceTraveled = 0;
        this.state.isActive = true;
        
        // Limpiar elementos
        this.obstacles = [];
        this.coins = [];
        this.collectibles = [];
        
        // Resetear generación
        this.generation.lastGeneratedX = 0;
        
        // Resetear sistemas
        if (this.obstacleManager) this.obstacleManager.reset();
        if (this.camera) this.camera.reset();
        if (this.collisionDetector) this.collisionDetector.reset();
        
        // Generar contenido inicial
        this.generateInitialContent();
        
        console.log('🔄 World reseteado');
        
        // Emitir evento de reset
        this.eventBus.emit('world:reset', {
            bounds: this.bounds,
            surface: this.surface
        });
    }
    
    /**
     * Obtiene la posición de la cámara
     * @returns {Object} Posición de la cámara
     */
    getCameraPosition() {
        return this.camera ? this.camera.getPosition() : { x: 0, y: 0 };
    }
    
    /**
     * Obtiene los límites del mundo
     * @returns {Object} Límites del mundo
     */
    getBounds() {
        return { ...this.bounds };
    }
    
    /**
     * Obtiene la configuración de superficie
     * @returns {Object} Configuración de superficie
     */
    getSurface() {
        return { ...this.surface };
    }
    
    /**
     * Obtiene el estado actual del mundo
     * @returns {Object} Estado del mundo
     */
    getState() {
        return { ...this.state };
    }
    
    /**
     * Obtiene estadísticas del mundo
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            obstacleCount: this.obstacles.length,
            coinCount: this.coins.filter(c => !c.collected).length,
            collectibleCount: this.collectibles.filter(c => !c.collected).length,
            distanceTraveled: this.state.distanceTraveled,
            timeElapsed: this.state.timeElapsed,
            difficulty: this.state.difficulty,
            generatedDistance: this.generation.lastGeneratedX
        };
    }
    
    /**
     * Obtiene información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            state: { ...this.state },
            bounds: { ...this.bounds },
            surface: { ...this.surface },
            generation: { ...this.generation },
            stats: this.getStats(),
            camera: this.camera ? this.camera.getDebugInfo() : null,
            obstacleManager: this.obstacleManager ? this.obstacleManager.getDebugInfo() : null,
            collisionDetector: this.collisionDetector ? this.collisionDetector.getDebugInfo() : null
        };
    }
    
    /**
     * Establece la dificultad manualmente
     * @param {number} difficulty - Nueva dificultad
     */
    setDifficulty(difficulty) {
        this.state.difficulty = Math.max(1.0, Math.min(3.0, difficulty));
        
        if (this.obstacleManager) {
            this.obstacleManager.setDifficulty(this.state.difficulty);
        }
        
        console.log(`⚙️ Dificultad establecida: ${this.state.difficulty}`);
    }
    
    /**
     * Añade un coleccionable al mundo
     * @param {Object} collectible - Coleccionable a añadir
     */
    addCollectible(collectible) {
        this.collectibles.push({
            x: collectible.x,
            y: collectible.y,
            type: collectible.type,
            size: collectible.size || 20,
            collected: false,
            animation: {
                rotation: 0,
                scale: 1,
                pulse: 0,
                glow: 0
            }
        });
    }
    
    /**
     * Limpia recursos del mundo
     */
    destroy() {
        console.log('🧹 Destruyendo World...');
        
        // Limpiar event listeners
        this.eventBus.off('*', this);
        
        // Destruir sistemas
        if (this.obstacleManager) {
            this.obstacleManager.destroy();
            this.obstacleManager = null;
        }
        
        if (this.collisionDetector) {
            this.collisionDetector.destroy();
            this.collisionDetector = null;
        }
        
        if (this.camera) {
            this.camera.destroy();
            this.camera = null;
        }
        
        if (this.worldRenderer) {
            this.worldRenderer.destroy();
            this.worldRenderer = null;
        }
        
        // Limpiar elementos
        this.obstacles = [];
        this.coins = [];
        this.collectibles = [];
        
        // Limpiar referencia al jugador
        this.player = null;
        
        this.isInitialized = false;
        
        console.log('✅ World destruido');
    }
}