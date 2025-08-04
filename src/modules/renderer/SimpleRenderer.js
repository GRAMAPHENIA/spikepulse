/**
 * Renderizador simplificado para Spikepulse
 * @module SimpleRenderer
 */

export class SimpleRenderer {
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        this.canvas = null;
        this.ctx = null;
        
        // Estado del juego para renderizado
        this.gameState = 'menu';
        this.gameData = {
            distance: 0,
            score: 0,
            time: 0
        };
        this.player = {
            position: { x: 150, y: 300 },
            velocity: { x: 0, y: 0 },
            onGround: true,
            gravityInverted: false,
            size: 30
        };
        
        console.log('🎨 SimpleRenderer creado');
    }
    
    async init() {
        console.log('🔧 Inicializando SimpleRenderer...');
        
        // Obtener canvas
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            throw new Error('Canvas no encontrado');
        }
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('No se pudo obtener contexto 2D');
        }
        
        // Configurar event listeners
        this.setupEventListeners();
        
        this.isInitialized = true;
        console.log('✅ SimpleRenderer inicializado');
    }
    
    setupEventListeners() {
        // Escuchar cambios de estado del juego
        this.eventBus.on('game:state-changed', (data) => {
            this.gameState = data.state;
            console.log(`🎨 Renderer: Estado cambiado a ${data.state}`);
        });
        
        // Escuchar actualizaciones de datos del juego
        this.eventBus.on('game:data-updated', (data) => {
            this.gameData = { ...this.gameData, ...data };
        });
        
        // Escuchar actualizaciones del estado del jugador
        this.eventBus.on('player:state-updated', (data) => {
            if (data.player) {
                this.player = { ...this.player, ...data.player };
            }
            if (data.gameData) {
                this.gameData = { ...this.gameData, ...data.gameData };
            }
        });
    }
    
    update(deltaTime) {
        // Renderer es principalmente para renderizado
    }
    
    render(deltaTime) {
        if (!this.ctx) return;
        
        // Limpiar canvas
        this.ctx.fillStyle = this.config.canvas?.backgroundColor || '#0F0F0F';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Renderizar según el estado del juego
        switch (this.gameState) {
            case 'playing':
                this.renderGameplay();
                break;
            case 'paused':
                this.renderGameplay();
                this.renderPauseOverlay();
                break;
            case 'game-over':
                this.renderGameplay();
                this.renderGameOverOverlay();
                break;
            case 'menu':
            default:
                // En el menú, el canvas debe estar vacío para que se vea el menú HTML
                break;
        }
    }
    
    renderGameplay() {
        // Renderizar fondo del juego
        this.renderBackground();
        
        // Renderizar jugador (cubo simple)
        this.renderPlayer();
        
        // Renderizar HUD
        this.renderHUD();
    }
    
    renderBackground() {
        // Fondo con gradiente
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f0f0f');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Líneas de fondo para simular movimiento
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.1)';
        this.ctx.lineWidth = 1;
        
        const offset = (this.gameData.distance * 0.5) % 100;
        for (let i = -offset; i < this.canvas.width + 100; i += 100) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Renderizar suelo
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(0, 450, this.canvas.width, this.canvas.height - 450);
        
        // Borde del suelo
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(0, 450, this.canvas.width, 3);
        
        // Renderizar techo
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(0, 0, this.canvas.width, 150);
        
        // Borde del techo
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(0, 147, this.canvas.width, 3);
        
        // Patrón en el suelo
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        const floorOffset = (this.gameData.distance * 2) % 40;
        for (let i = -floorOffset; i < this.canvas.width + 40; i += 40) {
            this.ctx.fillRect(i, 450, 20, this.canvas.height - 450);
        }
        
        // Patrón en el techo
        for (let i = -floorOffset; i < this.canvas.width + 40; i += 40) {
            this.ctx.fillRect(i, 0, 20, 150);
        }
    }
    
    renderPlayer() {
        // Usar posición real del jugador
        const playerX = this.player.position.x;
        const playerY = this.player.position.y;
        const playerSize = this.player.size;
        
        // Color del cubo según el estado
        let playerColor = '#FFD700'; // Dorado por defecto
        
        if (this.player.gravityInverted) {
            playerColor = '#9F7AEA'; // Púrpura cuando la gravedad está invertida
        }
        
        if (!this.player.dashAvailable) {
            playerColor = '#FF6B6B'; // Rojo cuando el dash no está disponible
        }
        
        // Cubo del jugador
        this.ctx.fillStyle = playerColor;
        this.ctx.fillRect(playerX - playerSize/2, playerY - playerSize/2, playerSize, playerSize);
        
        // Efecto de brillo
        this.ctx.shadowColor = playerColor;
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(playerX - playerSize/2 + 4, playerY - playerSize/2 + 4, playerSize - 8, playerSize - 8);
        this.ctx.shadowBlur = 0;
        
        // Indicador de velocidad (trail)
        if (Math.abs(this.player.velocity.x) > 1 || Math.abs(this.player.velocity.y) > 1) {
            this.ctx.fillStyle = `rgba(255, 215, 0, 0.3)`;
            for (let i = 1; i <= 3; i++) {
                const trailX = playerX - (this.player.velocity.x * i * 2);
                const trailY = playerY - (this.player.velocity.y * i * 2);
                const trailSize = playerSize * (1 - i * 0.2);
                
                this.ctx.fillRect(trailX - trailSize/2, trailY - trailSize/2, trailSize, trailSize);
            }
        }
        
        // Indicador de saltos restantes
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px Rajdhani';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${this.player.jumpsLeft}`, playerX, playerY - playerSize/2 - 10);
    }
    
    renderHUD() {
        // Configurar texto
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px Orbitron';
        this.ctx.textAlign = 'left';
        
        // Distancia
        this.ctx.fillText(`Distancia: ${Math.floor(this.gameData.distance)}m`, 20, 35);
        
        // Puntuación
        this.ctx.fillText(`Puntuación: ${this.gameData.score}`, 20, 65);
        
        // Tiempo
        const timeSeconds = Math.floor(this.gameData.time);
        this.ctx.fillText(`Tiempo: ${timeSeconds}s`, 20, 95);
        
        // Estado del jugador
        this.ctx.font = '16px Rajdhani';
        this.ctx.fillStyle = '#FFD700';
        
        // Saltos restantes
        this.ctx.fillText(`Saltos: ${this.player.jumpsLeft}/${this.player.maxJumps}`, 20, 125);
        
        // Estado del dash
        const dashStatus = this.player.dashAvailable ? 'Disponible' : 'Recargando';
        const dashColor = this.player.dashAvailable ? '#00FF00' : '#FF6B6B';
        this.ctx.fillStyle = dashColor;
        this.ctx.fillText(`Dash: ${dashStatus}`, 20, 145);
        
        // Estado de gravedad
        this.ctx.fillStyle = this.player.gravityInverted ? '#9F7AEA' : '#FFFFFF';
        this.ctx.fillText(`Gravedad: ${this.player.gravityInverted ? 'Invertida' : 'Normal'}`, 20, 165);
        
        // Velocidad (para debugging)
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.font = '12px Rajdhani';
        this.ctx.fillText(`Vel: X:${this.player.velocity.x.toFixed(1)} Y:${this.player.velocity.y.toFixed(1)}`, 20, 185);
        
        // Instrucciones
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.font = '14px Rajdhani';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('ESPACIO: Saltar | SHIFT: Dash | CTRL: Gravedad | ESC: Pausa', this.canvas.width - 20, this.canvas.height - 20);
    }
    
    renderPauseOverlay() {
        // Overlay semi-transparente
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Texto de pausa
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '48px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSADO', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.font = '24px Rajdhani';
        this.ctx.fillText('Presiona ESC para continuar', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
    
    renderGameOverOverlay() {
        // Overlay semi-transparente
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Texto de game over
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.font = '48px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // Estadísticas finales
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '24px Rajdhani';
        this.ctx.fillText(`Distancia Final: ${Math.floor(this.gameData.distance)}m`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.ctx.fillText(`Puntuación Final: ${this.gameData.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
        
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.font = '18px Rajdhani';
        this.ctx.fillText('Presiona R para reiniciar o ESC para volver al menú', this.canvas.width / 2, this.canvas.height / 2 + 100);
    }
    
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            hasCanvas: this.canvas !== null,
            hasContext: this.ctx !== null,
            canvasSize: this.canvas ? {
                width: this.canvas.width,
                height: this.canvas.height
            } : null
        };
    }
    
    reset() {
        console.log('🔄 Reseteando SimpleRenderer...');
    }
    
    destroy() {
        console.log('🧹 Destruyendo SimpleRenderer...');
        
        // Remover event listeners
        this.eventBus.off('game:state-changed', this);
        this.eventBus.off('game:data-updated', this);
        this.eventBus.off('player:state-updated', this);
        
        this.canvas = null;
        this.ctx = null;
        this.isInitialized = false;
    }
}