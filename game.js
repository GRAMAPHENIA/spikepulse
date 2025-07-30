// ===== CONFIGURACIÓN DEL JUEGO =====
const GAME_CONFIG = {
    canvas: {
        width: 800,
        height: 400
    },
    player: {
        width: 30,
        height: 30,
        x: 100,
        groundY: 300,
        jumpForce: -10,
        gravity: 0.5,
        color: '#FFD700',
        maxJumps: 2,
        dashForce: 8,
        dashDuration: 200,
        ceilingGravity: -0.5,
        moveSpeed: 5,
        maxSpeed: 8,
        friction: 0.85
    },
    world: {
        scrollSpeed: 4,
        groundHeight: 100,
        groundColor: '#2D3748',
        skyColor: '#0F0F0F'
    },
    obstacles: {
        width: 30,
        minHeight: 30,
        maxHeight: 80,
        color: '#E53E3E',
        spawnDistance: 300
    }
};

// ===== VARIABLES GLOBALES =====
let canvas, ctx;
let gameState = 'start'; // 'start', 'playing', 'paused', 'gameOver'
let gameObjects = {
    player: null,
    obstacles: [],
    platforms: []
};
let gameStats = {
    distance: 0,
    startTime: 0
};
let keys = {};
let lastObstacleX = 0;

// ===== CLASES DEL JUEGO =====

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = GAME_CONFIG.player.width;
        this.height = GAME_CONFIG.player.height;
        this.velocityY = 0;
        this.velocityX = 0;
        this.isGrounded = false;
        this.isOnCeiling = false;
        this.color = GAME_CONFIG.player.color;
        this.rotation = 0;
        this.jumpsRemaining = GAME_CONFIG.player.maxJumps;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.gravityDirection = 1; // 1 = normal, -1 = invertida
    }

    update() {
        // Actualizar timers
        if (this.dashTimer > 0) {
            this.dashTimer--;
        } else {
            this.isDashing = false;
        }
        
        if (this.dashCooldown > 0) {
            this.dashCooldown--;
        }

        // Manejar movimiento horizontal con teclas
        if (!this.isDashing) {
            if (keys['ArrowLeft'] || keys['KeyA']) {
                this.velocityX -= GAME_CONFIG.player.moveSpeed * 0.1;
            }
            if (keys['ArrowRight'] || keys['KeyD']) {
                this.velocityX += GAME_CONFIG.player.moveSpeed * 0.1;
            }
            
            // Limitar velocidad máxima horizontal
            if (this.velocityX > GAME_CONFIG.player.maxSpeed) {
                this.velocityX = GAME_CONFIG.player.maxSpeed;
            }
            if (this.velocityX < -GAME_CONFIG.player.maxSpeed) {
                this.velocityX = -GAME_CONFIG.player.maxSpeed;
            }
            
            // Aplicar fricción cuando no se presiona ninguna tecla
            if (!keys['ArrowLeft'] && !keys['ArrowRight'] && !keys['KeyA'] && !keys['KeyD']) {
                this.velocityX *= GAME_CONFIG.player.friction;
            }
        }

        // Aplicar gravedad (normal o invertida)
        if (!this.isDashing) {
            this.velocityY += GAME_CONFIG.player.gravity * this.gravityDirection;
        }
        
        // Aplicar velocidades
        this.y += this.velocityY;
        this.x += this.velocityX;
        
        // Reducir velocidad X gradualmente durante el dash
        if (this.isDashing) {
            this.velocityX *= 0.95;
        }

        // Verificar colisión con el suelo
        const groundY = GAME_CONFIG.canvas.height - GAME_CONFIG.world.groundHeight - this.height;
        if (this.y >= groundY && this.gravityDirection === 1) {
            this.y = groundY;
            this.velocityY = 0;
            this.isGrounded = true;
            this.isOnCeiling = false;
            this.jumpsRemaining = GAME_CONFIG.player.maxJumps;
            if (!this.isDashing) this.rotation = 0;
        } else {
            this.isGrounded = false;
        }

        // Verificar colisión con el techo
        if (this.y <= 0 && this.gravityDirection === -1) {
            this.y = 0;
            this.velocityY = 0;
            this.isOnCeiling = true;
            this.isGrounded = false;
            this.jumpsRemaining = GAME_CONFIG.player.maxJumps;
            if (!this.isDashing) this.rotation = Math.PI; // 180 grados
        } else {
            this.isOnCeiling = false;
        }

        // Rotación durante el movimiento
        if (!this.isGrounded && !this.isOnCeiling && !this.isDashing) {
            this.rotation += 0.15 * this.gravityDirection;
        }

        // Limitar posición vertical
        if (this.y < 0) this.y = 0;
        if (this.y > groundY) this.y = groundY;
        
        // Limitar posición horizontal (no salir de la pantalla)
        if (this.x < 0) this.x = 0;
        if (this.x > GAME_CONFIG.canvas.width - this.width) {
            this.x = GAME_CONFIG.canvas.width - this.width;
        }
    }

    jump() {
        if (this.jumpsRemaining > 0) {
            this.velocityY = GAME_CONFIG.player.jumpForce * this.gravityDirection;
            this.jumpsRemaining--;
            
            // Si es el segundo salto, hacer un salto ligeramente más débil
            if (this.jumpsRemaining === 0 && !this.isGrounded && !this.isOnCeiling) {
                this.velocityY = GAME_CONFIG.player.jumpForce * 0.8 * this.gravityDirection;
            }
            
            this.isGrounded = false;
            this.isOnCeiling = false;
            
            // Efecto visual de salto
            document.body.classList.add('bounce-animation');
            setTimeout(() => document.body.classList.remove('bounce-animation'), 300);
        }
    }

    dash() {
        if (this.dashCooldown <= 0 && !this.isDashing) {
            this.isDashing = true;
            this.dashTimer = GAME_CONFIG.player.dashDuration / 16.67; // Convertir ms a frames (60fps)
            this.dashCooldown = 60; // 1 segundo de cooldown
            
            // Determinar dirección del dash
            let dashDirection = 1; // Por defecto hacia la derecha
            
            if (keys['ArrowLeft'] || keys['KeyA']) {
                dashDirection = -1;
            } else if (keys['ArrowRight'] || keys['KeyD']) {
                dashDirection = 1;
            } else if (this.velocityX !== 0) {
                // Si no se presiona ninguna tecla, usar la dirección actual del movimiento
                dashDirection = this.velocityX > 0 ? 1 : -1;
            }
            
            // Aplicar velocidad de dash en la dirección correcta
            this.velocityX = GAME_CONFIG.player.dashForce * dashDirection;
            this.velocityY = 0; // Cancelar gravedad durante el dash
            
            // Efecto visual
            this.color = '#FF6B6B'; // Color rojo durante el dash
            setTimeout(() => {
                this.color = GAME_CONFIG.player.color;
            }, GAME_CONFIG.player.dashDuration);
        }
    }

    toggleGravity() {
        // Cambiar dirección de la gravedad
        this.gravityDirection *= -1;
        this.velocityY = 0; // Resetear velocidad Y para evitar efectos extraños
        
        // Restaurar saltos al cambiar gravedad
        this.jumpsRemaining = GAME_CONFIG.player.maxJumps;
        
        // Efecto visual
        this.color = '#9F7AEA'; // Color púrpura al cambiar gravedad
        setTimeout(() => {
            this.color = GAME_CONFIG.player.color;
        }, 300);
    }

    draw() {
        if (!ctx) return;
        
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);
        
        // Efecto de dash (estela)
        if (this.isDashing) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;
        }
        
        // Dibujar el jugador como un cubo con gradiente
        const gradient = ctx.createLinearGradient(-this.width/2, -this.height/2, this.width/2, this.height/2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, '#FFA500');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Borde negro
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Indicadores visuales
        ctx.fillStyle = '#FFF';
        
        // Indicador de saltos disponibles
        if (this.jumpsRemaining > 0 && !this.isGrounded && !this.isOnCeiling) {
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Indicador de gravedad invertida
        if (this.gravityDirection === -1) {
            ctx.beginPath();
            ctx.moveTo(-5, 5);
            ctx.lineTo(0, -5);
            ctx.lineTo(5, 5);
            ctx.fill();
        }
        
        // Indicador de dash disponible
        if (this.dashCooldown <= 0) {
            ctx.fillStyle = '#FF6B6B';
            ctx.fillRect(-8, -8, 4, 4);
        }
        
        // Indicador de dirección de movimiento
        if (Math.abs(this.velocityX) > 0.5) {
            ctx.fillStyle = '#00FF00';
            if (this.velocityX > 0) {
                // Flecha derecha
                ctx.beginPath();
                ctx.moveTo(5, 0);
                ctx.lineTo(8, -3);
                ctx.lineTo(8, 3);
                ctx.fill();
            } else {
                // Flecha izquierda
                ctx.beginPath();
                ctx.moveTo(-5, 0);
                ctx.lineTo(-8, -3);
                ctx.lineTo(-8, 3);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class Obstacle {
    constructor(x, height) {
        this.x = x;
        this.width = GAME_CONFIG.obstacles.width;
        this.height = height;
        this.y = GAME_CONFIG.canvas.height - GAME_CONFIG.world.groundHeight - height;
        this.color = GAME_CONFIG.obstacles.color;
    }

    update() {
        this.x -= GAME_CONFIG.world.scrollSpeed;
    }

    draw() {
        if (!ctx) return;
        
        // Gradiente para el obstáculo
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, '#C53030');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Borde negro
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }
}

// ===== FUNCIONES DE UTILIDAD =====

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function generateObstacle() {
    const height = Math.random() * (GAME_CONFIG.obstacles.maxHeight - GAME_CONFIG.obstacles.minHeight) + GAME_CONFIG.obstacles.minHeight;
    const x = lastObstacleX + GAME_CONFIG.obstacles.spawnDistance + Math.random() * 200;
    lastObstacleX = x;
    return new Obstacle(x, height);
}

function updateDistance() {
    gameStats.distance = Math.floor((Date.now() - gameStats.startTime) / 100);
    document.getElementById('distanceCounter').textContent = gameStats.distance + 'm';
}

function updateJumpsCounter() {
    if (gameObjects.player) {
        document.getElementById('jumpsCounter').textContent = gameObjects.player.jumpsRemaining;
    }
}

function updateDashStatus() {
    if (gameObjects.player) {
        const dashElement = document.getElementById('dashStatus');
        if (gameObjects.player.dashCooldown > 0) {
            dashElement.textContent = Math.ceil(gameObjects.player.dashCooldown / 60) + 's';
            dashElement.className = 'text-red-400 font-mono';
        } else {
            dashElement.textContent = '✓';
            dashElement.className = 'text-green-400 font-mono';
        }
    }
}

function updateGravityStatus() {
    if (gameObjects.player) {
        const gravityElement = document.getElementById('gravityStatus');
        gravityElement.textContent = gameObjects.player.gravityDirection === 1 ? '↓' : '↑';
        gravityElement.className = gameObjects.player.gravityDirection === 1 ? 'text-white font-mono' : 'text-purple-400 font-mono';
    }
}

function updateVelocityStatus() {
    if (gameObjects.player) {
        const velocityElement = document.getElementById('velocityStatus');
        const speed = Math.abs(gameObjects.player.velocityX).toFixed(1);
        velocityElement.textContent = speed;
        
        // Cambiar color según la velocidad
        if (speed > 5) {
            velocityElement.className = 'text-red-400 font-mono';
        } else if (speed > 2) {
            velocityElement.className = 'text-yellow-400 font-mono';
        } else {
            velocityElement.className = 'text-green-400 font-mono';
        }
    }
}

// ===== FUNCIONES DE RENDERIZADO =====

function drawBackground() {
    // Cielo con gradiente dark atmosférico
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.canvas.height);
    gradient.addColorStop(0, '#1A1A2E');
    gradient.addColorStop(0.3, '#16213E');
    gradient.addColorStop(0.7, '#0F0F0F');
    gradient.addColorStop(1, GAME_CONFIG.world.skyColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height);
    
    // Efectos de bruma en el fondo
    ctx.save();
    const fogGradient = ctx.createRadialGradient(
        GAME_CONFIG.canvas.width * 0.3, GAME_CONFIG.canvas.height * 0.4, 0,
        GAME_CONFIG.canvas.width * 0.3, GAME_CONFIG.canvas.height * 0.4, 200
    );
    fogGradient.addColorStop(0, 'rgba(100, 100, 120, 0.1)');
    fogGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = fogGradient;
    ctx.fillRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height);
    ctx.restore();
    
    // Suelo con gradiente
    const groundY = GAME_CONFIG.canvas.height - GAME_CONFIG.world.groundHeight;
    const groundGradient = ctx.createLinearGradient(0, groundY, 0, GAME_CONFIG.canvas.height);
    groundGradient.addColorStop(0, '#2D3748');
    groundGradient.addColorStop(0.5, '#1A202C');
    groundGradient.addColorStop(1, '#0F0F0F');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, groundY, GAME_CONFIG.canvas.width, GAME_CONFIG.world.groundHeight);
    
    // Línea del suelo con glow
    ctx.strokeStyle = '#4A5568';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#4A5568';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(GAME_CONFIG.canvas.width, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function render() {
    if (!ctx || !canvas) return;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height);
    
    // Dibujar fondo
    drawBackground();
    
    // Dibujar obstáculos
    gameObjects.obstacles.forEach(obstacle => obstacle.draw());
    
    // Dibujar jugador si existe
    if (gameObjects.player) {
        gameObjects.player.draw();
    }
}

// ===== LÓGICA PRINCIPAL DEL JUEGO =====

function initGame() {
    console.log('Inicializando juego...');
    
    // Crear jugador
    const playerY = GAME_CONFIG.canvas.height - GAME_CONFIG.world.groundHeight - GAME_CONFIG.player.height;
    gameObjects.player = new Player(GAME_CONFIG.player.x, playerY);
    
    console.log('Jugador creado en posición:', gameObjects.player.x, gameObjects.player.y);
    
    // Limpiar obstáculos
    gameObjects.obstacles = [];
    lastObstacleX = GAME_CONFIG.canvas.width;
    
    // Generar obstáculos iniciales
    for (let i = 0; i < 3; i++) {
        gameObjects.obstacles.push(generateObstacle());
    }
    
    console.log('Obstáculos generados:', gameObjects.obstacles.length);
    
    // Reiniciar estadísticas
    gameStats.distance = 0;
    gameStats.startTime = Date.now();
}

function updateGame() {
    if (gameState !== 'playing') return;
    
    // Actualizar jugador
    gameObjects.player.update();
    
    // Actualizar obstáculos
    gameObjects.obstacles.forEach(obstacle => obstacle.update());
    
    // Remover obstáculos fuera de pantalla y generar nuevos
    gameObjects.obstacles = gameObjects.obstacles.filter(obstacle => !obstacle.isOffScreen());
    
    // Generar nuevos obstáculos
    if (gameObjects.obstacles.length < 5) {
        gameObjects.obstacles.push(generateObstacle());
    }
    
    // Verificar colisiones
    const playerBounds = gameObjects.player.getBounds();
    for (let obstacle of gameObjects.obstacles) {
        if (checkCollision(playerBounds, obstacle.getBounds())) {
            gameOver();
            return;
        }
    }
    
    // Actualizar HUD
    updateDistance();
    updateJumpsCounter();
    updateDashStatus();
    updateGravityStatus();
    updateVelocityStatus();
    
    // Aumentar dificultad gradualmente
    if (gameStats.distance > 0 && gameStats.distance % 500 === 0) {
        GAME_CONFIG.world.scrollSpeed += 0.1;
    }
}

function gameLoop() {
    updateGame();
    render();
    requestAnimationFrame(gameLoop);
}

// ===== FUNCIONES DE ESTADO DEL JUEGO =====

function startGame() {
    gameState = 'playing';
    initGame();
    
    // Mostrar elementos del juego
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameCanvas').classList.remove('hidden');
    document.getElementById('gameHUD').classList.remove('hidden');
    document.getElementById('pauseContainer').classList.remove('hidden');
    document.getElementById('mobileControls').classList.remove('hidden');
    
    // Asegurar que el canvas esté visible y configurado
    canvas.style.display = 'block';
    
    console.log('Juego iniciado - Player:', gameObjects.player);
}

function pauseGame() {
    if (gameState === 'playing') {
        gameState = 'paused';
        document.getElementById('pauseBtn').textContent = 'REANUDAR';
    } else if (gameState === 'paused') {
        gameState = 'playing';
        document.getElementById('pauseBtn').textContent = 'PAUSA';
        gameStats.startTime = Date.now() - gameStats.distance * 100;
    }
}

function gameOver() {
    gameState = 'gameOver';
    
    // Mostrar pantalla de game over
    document.getElementById('finalScore').textContent = `Distancia: ${gameStats.distance}m`;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    
    // Efecto de vibración (si está disponible)
    if (navigator.vibrate) {
        navigator.vibrate(200);
    }
}

function restartGame() {
    gameState = 'playing';
    
    // Ocultar pantalla de game over
    document.getElementById('gameOverScreen').classList.add('hidden');
    
    // Reiniciar configuración
    GAME_CONFIG.world.scrollSpeed = 4;
    
    // Reinicializar juego
    initGame();
}

// ===== MANEJO DE EVENTOS =====

function setupEventListeners() {
    // Botones de UI
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);
    
    // Controles móviles
    document.getElementById('jumpBtn').addEventListener('click', () => {
        if (gameState === 'playing' && gameObjects.player) {
            gameObjects.player.jump();
        }
    });
    
    document.getElementById('dashBtn').addEventListener('click', () => {
        if (gameState === 'playing' && gameObjects.player) {
            gameObjects.player.dash();
        }
    });
    
    document.getElementById('gravityBtn').addEventListener('click', () => {
        if (gameState === 'playing' && gameObjects.player) {
            gameObjects.player.toggleGravity();
        }
    });
    
    // Controles de movimiento móvil
    let leftPressed = false;
    let rightPressed = false;
    
    document.getElementById('leftBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        leftPressed = true;
        keys['ArrowLeft'] = true;
    });
    
    document.getElementById('leftBtn').addEventListener('touchend', (e) => {
        e.preventDefault();
        leftPressed = false;
        keys['ArrowLeft'] = false;
    });
    
    document.getElementById('rightBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        rightPressed = true;
        keys['ArrowRight'] = true;
    });
    
    document.getElementById('rightBtn').addEventListener('touchend', (e) => {
        e.preventDefault();
        rightPressed = false;
        keys['ArrowRight'] = false;
    });
    
    // También para mouse (desktop)
    document.getElementById('leftBtn').addEventListener('mousedown', () => {
        keys['ArrowLeft'] = true;
    });
    
    document.getElementById('leftBtn').addEventListener('mouseup', () => {
        keys['ArrowLeft'] = false;
    });
    
    document.getElementById('rightBtn').addEventListener('mousedown', () => {
        keys['ArrowRight'] = true;
    });
    
    document.getElementById('rightBtn').addEventListener('mouseup', () => {
        keys['ArrowRight'] = false;
    });
    
    // Controles del juego (click/touch para saltar)
    canvas.addEventListener('click', () => {
        if (gameState === 'playing') {
            gameObjects.player.jump();
        }
    });
    
    // Soporte para touch (móvil)
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameState === 'playing') {
            gameObjects.player.jump();
        }
    });
    
    // Controles de teclado
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        
        if (gameState === 'playing' && gameObjects.player) {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                gameObjects.player.jump();
            }
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                e.preventDefault();
                gameObjects.player.dash();
            }
            if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
                e.preventDefault();
                gameObjects.player.toggleGravity();
            }
        }
        
        if (e.code === 'Escape') {
            pauseGame();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
    
    // Prevenir scroll en móvil
    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
}

// ===== INICIALIZACIÓN =====

function initCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Configurar el canvas con el tamaño correcto
    canvas.width = GAME_CONFIG.canvas.width;
    canvas.height = GAME_CONFIG.canvas.height;
    
    // Hacer el canvas responsive
    function resizeCanvas() {
        const containerWidth = Math.min(window.innerWidth - 40, 800);
        const containerHeight = Math.min(window.innerHeight - 100, 400);
        
        // Mantener aspect ratio
        const aspectRatio = GAME_CONFIG.canvas.width / GAME_CONFIG.canvas.height;
        let newWidth = containerWidth;
        let newHeight = containerWidth / aspectRatio;
        
        if (newHeight > containerHeight) {
            newHeight = containerHeight;
            newWidth = containerHeight * aspectRatio;
        }
        
        canvas.style.width = newWidth + 'px';
        canvas.style.height = newHeight + 'px';
        canvas.style.display = 'block';
        canvas.style.margin = '0 auto';
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando...');
    initCanvas();
    setupEventListeners();
    
    // Renderizar una vez para mostrar el fondo
    if (ctx) {
        drawBackground();
    }
    
    gameLoop(); // Iniciar el loop principal
});