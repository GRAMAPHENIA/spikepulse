/**
 * InputManager - Sistema unificado de manejo de entrada
 * @module InputManager
 */

export class InputManager {
    /**
     * Crea una nueva instancia del InputManager
     * @param {EventBus} eventBus - Instancia del EventBus
     * @param {Object} config - Configuración de controles
     */
    constructor(eventBus, config = {}) {
        this.eventBus = eventBus;
        this.config = config;
        
        // Estados de entrada
        this.keys = new Map();
        this.mouseButtons = new Map();
        this.touches = new Map();
        this.gamepadButtons = new Map();
        
        // Configuración de controles
        this.keyBindings = new Map();
        this.mouseBindings = new Map();
        this.touchBindings = new Map();
        
        // Estado de entrada normalizada
        this.inputState = {
            jump: false,
            moveLeft: false,
            moveRight: false,
            dash: false,
            gravity: false,
            pause: false
        };
        
        // Historial de entrada para buffering
        this.inputBuffer = [];
        this.maxBufferSize = 10;
        this.bufferTimeWindow = 100; // ms
        
        // Configuración de sensibilidad
        this.touchSensitivity = config.touchSensitivity || 1.0;
        this.deadZone = config.deadZone || 0.1;
        
        // Estado del sistema
        this.isEnabled = true;
        this.preventDefaults = true;
        
        this.init();
    }

    /**
     * Inicializar el InputManager
     * @private
     */
    init() {
        this.setupKeyBindings();
        this.setupEventListeners();
        this.setupEventBusListeners();
        
        console.log('[InputManager] Sistema de entrada inicializado');
    }

    /**
     * Configurar bindings de teclas por defecto
     * @private
     */
    setupKeyBindings() {
        // Configuración por defecto desde config
        const keyboardControls = this.config.keyboard || {};
        
        // Salto
        const jumpKeys = keyboardControls.jump || ['Space', 'ArrowUp'];
        jumpKeys.forEach(key => this.keyBindings.set(key, 'jump'));
        
        // Movimiento
        const leftKeys = keyboardControls.moveLeft || ['ArrowLeft', 'KeyA'];
        leftKeys.forEach(key => this.keyBindings.set(key, 'moveLeft'));
        
        const rightKeys = keyboardControls.moveRight || ['ArrowRight', 'KeyD'];
        rightKeys.forEach(key => this.keyBindings.set(key, 'moveRight'));
        
        // Dash
        const dashKeys = keyboardControls.dash || ['ShiftLeft', 'ShiftRight'];
        dashKeys.forEach(key => this.keyBindings.set(key, 'dash'));
        
        // Gravedad
        const gravityKeys = keyboardControls.gravity || ['ControlLeft', 'ControlRight'];
        gravityKeys.forEach(key => this.keyBindings.set(key, 'gravity'));
        
        // Pausa
        const pauseKeys = keyboardControls.pause || ['Escape'];
        pauseKeys.forEach(key => this.keyBindings.set(key, 'pause'));
        
        // Mouse bindings
        const mouseControls = this.config.mouse || {};
        const jumpMouse = mouseControls.jump || ['click'];
        jumpMouse.forEach(button => this.mouseBindings.set(button, 'jump'));
        
        console.log('[InputManager] Key bindings configurados');
    }

    /**
     * Configurar listeners de eventos del DOM
     * @private
     */
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Mouse events
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        // Touch events
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
        
        // Gamepad events (si están disponibles)
        if ('getGamepads' in navigator) {
            window.addEventListener('gamepadconnected', this.handleGamepadConnected.bind(this));
            window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected.bind(this));
        }
        
        // Prevenir comportamientos por defecto
        if (this.preventDefaults) {
            document.addEventListener('contextmenu', (e) => e.preventDefault());
            document.addEventListener('selectstart', (e) => e.preventDefault());
        }
        
        console.log('[InputManager] Event listeners configurados');
    }

    /**
     * Configurar listeners del EventBus
     * @private
     */
    setupEventBusListeners() {
        this.eventBus.on('input:enable', () => this.setEnabled(true));
        this.eventBus.on('input:disable', () => this.setEnabled(false));
        this.eventBus.on('input:rebind', this.handleRebind.bind(this));
        this.eventBus.on('input:get-state', this.handleGetState.bind(this));
    }

    // ===== KEYBOARD HANDLING =====

    /**
     * Manejar tecla presionada
     * @param {KeyboardEvent} event - Evento de teclado
     * @private
     */
    handleKeyDown(event) {
        if (!this.isEnabled) return;
        
        const key = event.code;
        const action = this.keyBindings.get(key);
        
        // Prevenir repetición de teclas
        if (this.keys.get(key)) return;
        
        this.keys.set(key, true);
        
        if (action) {
            this.setInputState(action, true);
            this.addToBuffer(action, 'keydown', performance.now());
            
            // Prevenir comportamiento por defecto para teclas del juego
            if (this.preventDefaults) {
                event.preventDefault();
            }
            
            // Emitir evento específico
            this.eventBus.emit(`input:${action}:start`, {
                source: 'keyboard',
                key,
                event
            });
        }
        
        // Emitir evento genérico
        this.eventBus.emit('input:key:down', {
            key,
            action,
            event
        });
    }

    /**
     * Manejar tecla liberada
     * @param {KeyboardEvent} event - Evento de teclado
     * @private
     */
    handleKeyUp(event) {
        if (!this.isEnabled) return;
        
        const key = event.code;
        const action = this.keyBindings.get(key);
        
        this.keys.set(key, false);
        
        if (action) {
            this.setInputState(action, false);
            this.addToBuffer(action, 'keyup', performance.now());
            
            // Emitir evento específico
            this.eventBus.emit(`input:${action}:end`, {
                source: 'keyboard',
                key,
                event
            });
        }
        
        // Emitir evento genérico
        this.eventBus.emit('input:key:up', {
            key,
            action,
            event
        });
    }

    // ===== MOUSE HANDLING =====

    /**
     * Manejar botón del mouse presionado
     * @param {MouseEvent} event - Evento del mouse
     * @private
     */
    handleMouseDown(event) {
        if (!this.isEnabled) return;
        
        const button = this.getMouseButtonName(event.button);
        const action = this.mouseBindings.get(button);
        
        this.mouseButtons.set(button, true);
        
        if (action) {
            this.setInputState(action, true);
            this.addToBuffer(action, 'mousedown', performance.now());
            
            if (this.preventDefaults) {
                event.preventDefault();
            }
            
            // Emitir evento específico
            this.eventBus.emit(`input:${action}:start`, {
                source: 'mouse',
                button,
                x: event.clientX,
                y: event.clientY,
                event
            });
        }
        
        // Emitir evento genérico
        this.eventBus.emit('input:mouse:down', {
            button,
            action,
            x: event.clientX,
            y: event.clientY,
            event
        });
    }

    /**
     * Manejar botón del mouse liberado
     * @param {MouseEvent} event - Evento del mouse
     * @private
     */
    handleMouseUp(event) {
        if (!this.isEnabled) return;
        
        const button = this.getMouseButtonName(event.button);
        const action = this.mouseBindings.get(button);
        
        this.mouseButtons.set(button, false);
        
        if (action) {
            this.setInputState(action, false);
            this.addToBuffer(action, 'mouseup', performance.now());
            
            // Emitir evento específico
            this.eventBus.emit(`input:${action}:end`, {
                source: 'mouse',
                button,
                x: event.clientX,
                y: event.clientY,
                event
            });
        }
        
        // Emitir evento genérico
        this.eventBus.emit('input:mouse:up', {
            button,
            action,
            x: event.clientX,
            y: event.clientY,
            event
        });
    }

    /**
     * Manejar movimiento del mouse
     * @param {MouseEvent} event - Evento del mouse
     * @private
     */
    handleMouseMove(event) {
        if (!this.isEnabled) return;
        
        // Emitir evento de movimiento
        this.eventBus.emit('input:mouse:move', {
            x: event.clientX,
            y: event.clientY,
            deltaX: event.movementX,
            deltaY: event.movementY,
            event
        });
    }

    /**
     * Obtener nombre del botón del mouse
     * @param {number} buttonCode - Código del botón
     * @returns {string} Nombre del botón
     * @private
     */
    getMouseButtonName(buttonCode) {
        switch (buttonCode) {
            case 0: return 'click';
            case 1: return 'middle';
            case 2: return 'right';
            default: return `button${buttonCode}`;
        }
    }

    // ===== TOUCH HANDLING =====

    /**
     * Manejar inicio de toque
     * @param {TouchEvent} event - Evento de toque
     * @private
     */
    handleTouchStart(event) {
        if (!this.isEnabled) return;
        
        if (this.preventDefaults) {
            event.preventDefault();
        }
        
        for (const touch of event.changedTouches) {
            const touchData = {
                id: touch.identifier,
                startX: touch.clientX,
                startY: touch.clientY,
                currentX: touch.clientX,
                currentY: touch.clientY,
                startTime: performance.now()
            };
            
            this.touches.set(touch.identifier, touchData);
            
            // Detectar acción basada en posición
            const action = this.detectTouchAction(touch.clientX, touch.clientY);
            if (action) {
                this.setInputState(action, true);
                this.addToBuffer(action, 'touchstart', performance.now());
                
                // Emitir evento específico
                this.eventBus.emit(`input:${action}:start`, {
                    source: 'touch',
                    touchId: touch.identifier,
                    x: touch.clientX,
                    y: touch.clientY,
                    event
                });
            }
        }
        
        // Emitir evento genérico
        this.eventBus.emit('input:touch:start', {
            touches: Array.from(event.changedTouches),
            event
        });
    }

    /**
     * Manejar fin de toque
     * @param {TouchEvent} event - Evento de toque
     * @private
     */
    handleTouchEnd(event) {
        if (!this.isEnabled) return;
        
        if (this.preventDefaults) {
            event.preventDefault();
        }
        
        for (const touch of event.changedTouches) {
            const touchData = this.touches.get(touch.identifier);
            if (!touchData) continue;
            
            // Detectar gestos
            const gesture = this.detectGesture(touchData, touch);
            if (gesture) {
                this.handleGesture(gesture, touchData, touch);
            }
            
            // Limpiar estado de toque
            this.touches.delete(touch.identifier);
            
            // Si era un toque simple (tap), activar salto
            const touchDuration = performance.now() - touchData.startTime;
            const distance = Math.sqrt(
                Math.pow(touch.clientX - touchData.startX, 2) +
                Math.pow(touch.clientY - touchData.startY, 2)
            );
            
            if (touchDuration < 200 && distance < 30) {
                this.setInputState('jump', false);
                this.addToBuffer('jump', 'tap', performance.now());
                
                this.eventBus.emit('input:jump:start', {
                    source: 'touch',
                    type: 'tap',
                    x: touch.clientX,
                    y: touch.clientY,
                    event
                });
            }
        }
        
        // Emitir evento genérico
        this.eventBus.emit('input:touch:end', {
            touches: Array.from(event.changedTouches),
            event
        });
    }

    /**
     * Manejar movimiento de toque
     * @param {TouchEvent} event - Evento de toque
     * @private
     */
    handleTouchMove(event) {
        if (!this.isEnabled) return;
        
        if (this.preventDefaults) {
            event.preventDefault();
        }
        
        for (const touch of event.changedTouches) {
            const touchData = this.touches.get(touch.identifier);
            if (!touchData) continue;
            
            touchData.currentX = touch.clientX;
            touchData.currentY = touch.clientY;
        }
        
        // Emitir evento genérico
        this.eventBus.emit('input:touch:move', {
            touches: Array.from(event.changedTouches),
            event
        });
    }

    /**
     * Manejar cancelación de toque
     * @param {TouchEvent} event - Evento de toque
     * @private
     */
    handleTouchCancel(event) {
        if (!this.isEnabled) return;
        
        for (const touch of event.changedTouches) {
            this.touches.delete(touch.identifier);
        }
        
        // Limpiar estados de entrada
        Object.keys(this.inputState).forEach(action => {
            this.setInputState(action, false);
        });
        
        this.eventBus.emit('input:touch:cancel', {
            touches: Array.from(event.changedTouches),
            event
        });
    }

    /**
     * Detectar acción basada en posición del toque
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @returns {string|null} Acción detectada
     * @private
     */
    detectTouchAction(x, y) {
        // Por ahora, cualquier toque es salto
        // En el futuro se puede dividir la pantalla en zonas
        return 'jump';
    }

    /**
     * Detectar gesto
     * @param {Object} touchData - Datos del toque
     * @param {Touch} touch - Toque actual
     * @returns {Object|null} Gesto detectado
     * @private
     */
    detectGesture(touchData, touch) {
        const deltaX = touch.clientX - touchData.startX;
        const deltaY = touch.clientY - touchData.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const duration = performance.now() - touchData.startTime;
        
        // Swipe threshold
        const swipeThreshold = this.config.touch?.swipeThreshold || 50;
        
        if (distance > swipeThreshold && duration < 500) {
            const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            
            if (Math.abs(angle) < 45) {
                return { type: 'swipe', direction: 'right', distance, duration };
            } else if (Math.abs(angle) > 135) {
                return { type: 'swipe', direction: 'left', distance, duration };
            } else if (angle > 45 && angle < 135) {
                return { type: 'swipe', direction: 'down', distance, duration };
            } else if (angle < -45 && angle > -135) {
                return { type: 'swipe', direction: 'up', distance, duration };
            }
        }
        
        return null;
    }

    /**
     * Manejar gesto
     * @param {Object} gesture - Gesto detectado
     * @param {Object} touchData - Datos del toque
     * @param {Touch} touch - Toque
     * @private
     */
    handleGesture(gesture, touchData, touch) {
        switch (gesture.type) {
            case 'swipe':
                this.handleSwipe(gesture, touchData, touch);
                break;
        }
    }

    /**
     * Manejar swipe
     * @param {Object} gesture - Gesto de swipe
     * @param {Object} touchData - Datos del toque
     * @param {Touch} touch - Toque
     * @private
     */
    handleSwipe(gesture, touchData, touch) {
        let action = null;
        
        switch (gesture.direction) {
            case 'up':
                action = 'jump';
                break;
            case 'left':
                action = 'moveLeft';
                break;
            case 'right':
                action = 'moveRight';
                break;
            case 'down':
                action = 'dash';
                break;
        }
        
        if (action) {
            this.addToBuffer(action, 'swipe', performance.now());
            
            this.eventBus.emit(`input:${action}:start`, {
                source: 'touch',
                type: 'swipe',
                direction: gesture.direction,
                distance: gesture.distance,
                duration: gesture.duration,
                event: { touch, gesture }
            });
        }
        
        this.eventBus.emit('input:gesture:swipe', {
            direction: gesture.direction,
            distance: gesture.distance,
            duration: gesture.duration,
            action
        });
    }

    // ===== GAMEPAD HANDLING =====

    /**
     * Manejar gamepad conectado
     * @param {GamepadEvent} event - Evento de gamepad
     * @private
     */
    handleGamepadConnected(event) {
        console.log(`[InputManager] Gamepad conectado: ${event.gamepad.id}`);
        this.eventBus.emit('input:gamepad:connected', {
            gamepad: event.gamepad
        });
    }

    /**
     * Manejar gamepad desconectado
     * @param {GamepadEvent} event - Evento de gamepad
     * @private
     */
    handleGamepadDisconnected(event) {
        console.log(`[InputManager] Gamepad desconectado: ${event.gamepad.id}`);
        this.eventBus.emit('input:gamepad:disconnected', {
            gamepad: event.gamepad
        });
    }

    /**
     * Actualizar estado de gamepads
     * @private
     */
    updateGamepads() {
        if (!('getGamepads' in navigator)) return;
        
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (!gamepad) continue;
            
            // Procesar botones
            gamepad.buttons.forEach((button, index) => {
                const wasPressed = this.gamepadButtons.get(`${i}-${index}`);
                const isPressed = button.pressed;
                
                if (isPressed && !wasPressed) {
                    this.handleGamepadButtonDown(i, index, button);
                } else if (!isPressed && wasPressed) {
                    this.handleGamepadButtonUp(i, index, button);
                }
                
                this.gamepadButtons.set(`${i}-${index}`, isPressed);
            });
            
            // Procesar sticks analógicos
            this.handleGamepadAxes(i, gamepad.axes);
        }
    }

    /**
     * Manejar botón de gamepad presionado
     * @param {number} gamepadIndex - Índice del gamepad
     * @param {number} buttonIndex - Índice del botón
     * @param {GamepadButton} button - Botón del gamepad
     * @private
     */
    handleGamepadButtonDown(gamepadIndex, buttonIndex, button) {
        // Mapeo básico de botones
        let action = null;
        switch (buttonIndex) {
            case 0: // A/X
                action = 'jump';
                break;
            case 1: // B/Circle
                action = 'dash';
                break;
            case 9: // Start/Options
                action = 'pause';
                break;
        }
        
        if (action) {
            this.setInputState(action, true);
            this.addToBuffer(action, 'gamepaddown', performance.now());
            
            this.eventBus.emit(`input:${action}:start`, {
                source: 'gamepad',
                gamepadIndex,
                buttonIndex,
                button
            });
        }
    }

    /**
     * Manejar botón de gamepad liberado
     * @param {number} gamepadIndex - Índice del gamepad
     * @param {number} buttonIndex - Índice del botón
     * @param {GamepadButton} button - Botón del gamepad
     * @private
     */
    handleGamepadButtonUp(gamepadIndex, buttonIndex, button) {
        let action = null;
        switch (buttonIndex) {
            case 0: action = 'jump'; break;
            case 1: action = 'dash'; break;
            case 9: action = 'pause'; break;
        }
        
        if (action) {
            this.setInputState(action, false);
            this.addToBuffer(action, 'gamepadup', performance.now());
            
            this.eventBus.emit(`input:${action}:end`, {
                source: 'gamepad',
                gamepadIndex,
                buttonIndex,
                button
            });
        }
    }

    /**
     * Manejar ejes analógicos del gamepad
     * @param {number} gamepadIndex - Índice del gamepad
     * @param {Array} axes - Ejes del gamepad
     * @private
     */
    handleGamepadAxes(gamepadIndex, axes) {
        if (axes.length >= 2) {
            const leftStickX = axes[0];
            const leftStickY = axes[1];
            
            // Aplicar dead zone
            const magnitude = Math.sqrt(leftStickX * leftStickX + leftStickY * leftStickY);
            if (magnitude > this.deadZone) {
                // Movimiento horizontal
                if (Math.abs(leftStickX) > this.deadZone) {
                    if (leftStickX < -this.deadZone) {
                        this.setInputState('moveLeft', true);
                    } else if (leftStickX > this.deadZone) {
                        this.setInputState('moveRight', true);
                    }
                } else {
                    this.setInputState('moveLeft', false);
                    this.setInputState('moveRight', false);
                }
            } else {
                this.setInputState('moveLeft', false);
                this.setInputState('moveRight', false);
            }
        }
    }

    // ===== UTILITY METHODS =====

    /**
     * Establecer estado de entrada
     * @param {string} action - Acción
     * @param {boolean} state - Estado
     * @private
     */
    setInputState(action, state) {
        if (this.inputState[action] !== state) {
            this.inputState[action] = state;
            
            // Emitir evento de cambio de estado
            this.eventBus.emit('input:state-changed', {
                action,
                state,
                inputState: { ...this.inputState }
            });
        }
    }

    /**
     * Agregar entrada al buffer
     * @param {string} action - Acción
     * @param {string} type - Tipo de entrada
     * @param {number} timestamp - Timestamp
     * @private
     */
    addToBuffer(action, type, timestamp) {
        this.inputBuffer.push({
            action,
            type,
            timestamp
        });
        
        // Limpiar buffer viejo
        const cutoff = timestamp - this.bufferTimeWindow;
        this.inputBuffer = this.inputBuffer.filter(entry => entry.timestamp > cutoff);
        
        // Limitar tamaño del buffer
        if (this.inputBuffer.length > this.maxBufferSize) {
            this.inputBuffer.shift();
        }
    }

    /**
     * Actualizar InputManager (llamado desde el game loop)
     * @param {number} deltaTime - Tiempo transcurrido
     */
    update(deltaTime) {
        // Actualizar gamepads
        this.updateGamepads();
        
        // Limpiar buffer viejo
        const now = performance.now();
        const cutoff = now - this.bufferTimeWindow;
        this.inputBuffer = this.inputBuffer.filter(entry => entry.timestamp > cutoff);
    }

    // ===== PUBLIC API =====

    /**
     * Obtener estado de una acción
     * @param {string} action - Acción a consultar
     * @returns {boolean} Estado de la acción
     */
    isActionActive(action) {
        return this.inputState[action] || false;
    }

    /**
     * Obtener estado completo de entrada
     * @returns {Object} Estado de entrada
     */
    getInputState() {
        return { ...this.inputState };
    }

    /**
     * Verificar si una acción fue presionada recientemente
     * @param {string} action - Acción a verificar
     * @param {number} timeWindow - Ventana de tiempo en ms
     * @returns {boolean} True si fue presionada recientemente
     */
    wasActionPressed(action, timeWindow = 100) {
        const now = performance.now();
        return this.inputBuffer.some(entry => 
            entry.action === action && 
            (entry.type === 'keydown' || entry.type === 'mousedown' || entry.type === 'touchstart') &&
            (now - entry.timestamp) <= timeWindow
        );
    }

    /**
     * Habilitar/deshabilitar el InputManager
     * @param {boolean} enabled - Estado habilitado
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        if (!enabled) {
            // Limpiar todos los estados
            Object.keys(this.inputState).forEach(action => {
                this.setInputState(action, false);
            });
            this.keys.clear();
            this.mouseButtons.clear();
            this.touches.clear();
        }
        
        console.log(`[InputManager] ${enabled ? 'Habilitado' : 'Deshabilitado'}`);
        this.eventBus.emit('input:enabled-changed', { enabled });
    }

    /**
     * Rebind una tecla
     * @param {string} oldKey - Tecla anterior
     * @param {string} newKey - Nueva tecla
     * @param {string} action - Acción
     */
    rebindKey(oldKey, newKey, action) {
        this.keyBindings.delete(oldKey);
        this.keyBindings.set(newKey, action);
        
        console.log(`[InputManager] Rebind: ${oldKey} -> ${newKey} para ${action}`);
        this.eventBus.emit('input:key-rebound', { oldKey, newKey, action });
    }

    // ===== EVENT HANDLERS =====

    /**
     * Manejar rebind desde EventBus
     * @param {Object} data - Datos del rebind
     * @private
     */
    handleRebind(data) {
        const { oldKey, newKey, action } = data;
        this.rebindKey(oldKey, newKey, action);
    }

    /**
     * Manejar solicitud de estado
     * @param {Object} data - Datos de la solicitud
     * @private
     */
    handleGetState(data) {
        const { callback } = data;
        const state = this.getInputState();
        
        if (callback && typeof callback === 'function') {
            callback(state);
        }
        
        this.eventBus.emit('input:state-response', { state });
    }

    /**
     * Obtener estadísticas del InputManager
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            isEnabled: this.isEnabled,
            activeKeys: Array.from(this.keys.entries()).filter(([, pressed]) => pressed).length,
            activeTouches: this.touches.size,
            bufferSize: this.inputBuffer.length,
            keyBindings: this.keyBindings.size,
            mouseBindings: this.mouseBindings.size,
            inputState: { ...this.inputState }
        };
    }

    /**
     * Destruir InputManager
     */
    destroy() {
        // Remover event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        document.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchend', this.handleTouchEnd);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchcancel', this.handleTouchCancel);
        
        if ('getGamepads' in navigator) {
            window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
            window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
        }
        
        // Limpiar datos
        this.keys.clear();
        this.mouseButtons.clear();
        this.touches.clear();
        this.gamepadButtons.clear();
        this.keyBindings.clear();
        this.mouseBindings.clear();
        this.inputBuffer = [];
        
        console.log('[InputManager] InputManager destruido');
    }
}