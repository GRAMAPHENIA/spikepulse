/**
 * Gestor de entrada unificado para Spikepulse
 * @module InputManager
 */

import { KeyboardHandler } from './KeyboardHandler.js';
import { TouchHandler } from './TouchHandler.js';
import { MouseHandler } from './MouseHandler.js';

export class InputManager {
    /**
     * Crea una nueva instancia del gestor de entrada
     * @param {Object} config - Configuración del juego
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        // Configuración de input
        this.inputConfig = config.input || {};
        
        // Handlers de entrada
        this.keyboardHandler = null;
        this.touchHandler = null;
        this.mouseHandler = null;
        
        // Estado actual de inputs
        this.inputState = {
            jump: false,
            dash: false,
            gravityToggle: false,
            moveLeft: false,
            moveRight: false,
            pause: false
        };
        
        // Estado anterior para detectar cambios
        this.previousState = { ...this.inputState };
        
        // Mapeo de acciones a eventos
        this.actionMap = {
            jump: 'input:jump',
            dash: 'input:dash',
            gravityToggle: 'input:gravity-toggle',
            moveLeft: 'input:move-left',
            moveRight: 'input:move-right',
            pause: 'input:pause'
        };
        
        // Configuración de dispositivos
        this.deviceConfig = {
            keyboard: {
                enabled: true,
                preventDefaults: ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
            },
            mouse: {
                enabled: this.inputConfig.mouse?.enabled ?? true,
                preventContextMenu: true
            },
            touch: {
                enabled: this.inputConfig.touch?.enabled ?? true,
                preventDefaults: true
            }
        };
        
        // Estado de dispositivos
        this.deviceState = {
            hasKeyboard: true,
            hasMouse: true,
            hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            activeDevice: 'keyboard'
        };
        
        // Debugging
        this.debugMode = config.debug?.enabled || false;
        
        console.log('🎮 InputManager creado');
        this.init();
    }
    
    /**
     * Inicializa el gestor de entrada
     */
    async init() {
        try {
            console.log('🔧 Inicializando InputManager...');
            
            // Detectar capacidades del dispositivo
            this.detectDeviceCapabilities();
            
            // Inicializar handlers
            await this.initializeHandlers();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Configurar detección de dispositivo activo
            this.setupDeviceDetection();
            
            this.isInitialized = true;
            console.log('✅ InputManager inicializado');
            
            // Emitir evento de inicialización
            this.eventBus.emit('input:initialized', {
                devices: this.deviceState,
                config: this.inputConfig
            });
            
        } catch (error) {
            console.error('❌ Error inicializando InputManager:', error);
            throw error;
        }
    }
    
    /**
     * Detecta las capacidades del dispositivo
     */
    detectDeviceCapabilities() {
        // Detectar touch
        this.deviceState.hasTouch = 'ontouchstart' in window || 
                                   navigator.maxTouchPoints > 0 ||
                                   window.TouchEvent !== undefined;
        
        // Detectar mouse (asumimos que siempre está disponible en desktop)
        this.deviceState.hasMouse = !this.deviceState.hasTouch || window.innerWidth > 768;
        
        // Detectar teclado (asumimos que siempre está disponible)
        this.deviceState.hasKeyboard = true;
        
        // Determinar dispositivo activo inicial
        if (this.deviceState.hasTouch && window.innerWidth <= 768) {
            this.deviceState.activeDevice = 'touch';
        } else if (this.deviceState.hasMouse) {
            this.deviceState.activeDevice = 'mouse';
        } else {
            this.deviceState.activeDevice = 'keyboard';
        }
        
        console.log('📱 Capacidades detectadas:', this.deviceState);
    }
    
    /**
     * Inicializa los handlers de entrada
     */
    async initializeHandlers() {
        // Inicializar keyboard handler
        if (this.deviceState.hasKeyboard && this.deviceConfig.keyboard.enabled) {
            this.keyboardHandler = new KeyboardHandler(
                this.inputConfig.keyboard || {},
                this.eventBus,
                this.deviceConfig.keyboard
            );
            await this.keyboardHandler.init();
        }
        
        // Inicializar mouse handler
        if (this.deviceState.hasMouse && this.deviceConfig.mouse.enabled) {
            this.mouseHandler = new MouseHandler(
                this.inputConfig.mouse || {},
                this.eventBus,
                this.deviceConfig.mouse
            );
            await this.mouseHandler.init();
        }
        
        // Inicializar touch handler
        if (this.deviceState.hasTouch && this.deviceConfig.touch.enabled) {
            this.touchHandler = new TouchHandler(
                this.inputConfig.touch || {},
                this.eventBus,
                this.deviceConfig.touch
            );
            await this.touchHandler.init();
        }
        
        console.log('🎛️ Handlers inicializados');
    }
    
    /**
     * Configura los event listeners principales
     */
    setupEventListeners() {
        // Escuchar eventos de input de los handlers
        this.eventBus.on('input:raw-keyboard', this.handleRawInput.bind(this));
        this.eventBus.on('input:raw-mouse', this.handleRawInput.bind(this));
        this.eventBus.on('input:raw-touch', this.handleRawInput.bind(this));
        
        // Escuchar eventos de estado del juego
        this.eventBus.on('state:changed', this.handleStateChange.bind(this));
        
        // Escuchar eventos de configuración
        this.eventBus.on('input:config-changed', this.handleConfigChange.bind(this));
        
        console.log('👂 Event listeners de InputManager configurados');
    }
    
    /**
     * Configura la detección de dispositivo activo
     */
    setupDeviceDetection() {
        // Detectar uso de teclado
        if (this.keyboardHandler) {
            this.eventBus.on('input:keyboard-used', () => {
                this.setActiveDevice('keyboard');
            });
        }
        
        // Detectar uso de mouse
        if (this.mouseHandler) {
            this.eventBus.on('input:mouse-used', () => {
                this.setActiveDevice('mouse');
            });
        }
        
        // Detectar uso de touch
        if (this.touchHandler) {
            this.eventBus.on('input:touch-used', () => {
                this.setActiveDevice('touch');
            });
        }
        
        // Detectar cambios de orientación en móviles
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.detectDeviceCapabilities();
                this.eventBus.emit('input:device-changed', this.deviceState);
            }, 100);
        });
        
        // Detectar cambios de tamaño de ventana
        window.addEventListener('resize', () => {
            this.detectDeviceCapabilities();
            this.eventBus.emit('input:device-changed', this.deviceState);
        });
    }
    
    /**
     * Actualiza el gestor de entrada
     * @param {number} deltaTime - Delta time
     */
    update(deltaTime) {
        if (!this.isInitialized) return;
        
        // Actualizar handlers
        if (this.keyboardHandler) {
            this.keyboardHandler.update(deltaTime);
        }
        
        if (this.mouseHandler) {
            this.mouseHandler.update(deltaTime);
        }
        
        if (this.touchHandler) {
            this.touchHandler.update(deltaTime);
        }
        
        // Procesar cambios de estado
        this.processStateChanges();
        
        // Actualizar estado anterior
        this.previousState = { ...this.inputState };
    }
    
    /**
     * Maneja input raw de los handlers
     * @param {Object} data - Datos del input
     */
    handleRawInput(data) {
        const { action, pressed, device, key, position } = data;
        
        // Actualizar estado de input
        if (this.inputState.hasOwnProperty(action)) {
            this.inputState[action] = pressed;
        }
        
        // Emitir evento específico de la acción
        if (this.actionMap[action]) {
            this.eventBus.emit(this.actionMap[action], {
                pressed,
                device,
                key,
                position,
                timestamp: Date.now()
            });
        }
        
        // Debug logging
        if (this.debugMode) {
            console.log(`[Input] ${action}: ${pressed} (${device})`);
        }
    }
    
    /**
     * Procesa cambios de estado de input
     */
    processStateChanges() {
        for (const action in this.inputState) {
            const current = this.inputState[action];
            const previous = this.previousState[action];
            
            // Detectar cambios
            if (current !== previous) {
                // Emitir evento de cambio
                this.eventBus.emit('input:state-changed', {
                    action,
                    pressed: current,
                    wasPressed: previous,
                    timestamp: Date.now()
                });
            }
        }
    }
    
    /**
     * Establece el dispositivo activo
     * @param {string} device - Dispositivo activo
     */
    setActiveDevice(device) {
        if (this.deviceState.activeDevice !== device) {
            const previousDevice = this.deviceState.activeDevice;
            this.deviceState.activeDevice = device;
            
            console.log(`🔄 Dispositivo activo cambiado: ${previousDevice} -> ${device}`);
            
            // Emitir evento de cambio de dispositivo
            this.eventBus.emit('input:active-device-changed', {
                previous: previousDevice,
                current: device,
                deviceState: this.deviceState
            });
        }
    }
    
    /**
     * Maneja cambios de estado del juego
     * @param {Object} data - Datos del cambio de estado
     */
    handleStateChange(data) {
        const { to, from } = data;
        
        // Habilitar/deshabilitar input según el estado
        switch (to) {
            case 'playing':
                this.enableInput();
                break;
                
            case 'paused':
                this.disableGameInput();
                break;
                
            case 'menu':
            case 'gameOver':
            case 'settings':
                this.disableGameInput();
                break;
        }
    }
    
    /**
     * Maneja cambios de configuración
     * @param {Object} data - Nueva configuración
     */
    handleConfigChange(data) {
        console.log('⚙️ Configuración de input actualizada');
        
        // Actualizar configuración
        this.inputConfig = { ...this.inputConfig, ...data };
        
        // Reinicializar handlers si es necesario
        this.reinitializeHandlers();
    }
    
    /**
     * Habilita todo el input
     */
    enableInput() {
        if (this.keyboardHandler) this.keyboardHandler.enable();
        if (this.mouseHandler) this.mouseHandler.enable();
        if (this.touchHandler) this.touchHandler.enable();
        
        console.log('✅ Input habilitado');
    }
    
    /**
     * Deshabilita input del juego (mantiene UI)
     */
    disableGameInput() {
        // Los handlers individuales manejan qué inputs deshabilitar
        this.eventBus.emit('input:disable-game-input');
        
        console.log('🚫 Input del juego deshabilitado');
    }
    
    /**
     * Deshabilita todo el input
     */
    disableInput() {
        if (this.keyboardHandler) this.keyboardHandler.disable();
        if (this.mouseHandler) this.mouseHandler.disable();
        if (this.touchHandler) this.touchHandler.disable();
        
        console.log('🚫 Input deshabilitado');
    }
    
    /**
     * Reinicializa los handlers
     */
    async reinitializeHandlers() {
        console.log('🔄 Reinicializando handlers...');
        
        // Destruir handlers existentes
        if (this.keyboardHandler) {
            this.keyboardHandler.destroy();
            this.keyboardHandler = null;
        }
        
        if (this.mouseHandler) {
            this.mouseHandler.destroy();
            this.mouseHandler = null;
        }
        
        if (this.touchHandler) {
            this.touchHandler.destroy();
            this.touchHandler = null;
        }
        
        // Reinicializar
        await this.initializeHandlers();
    }
    
    /**
     * Obtiene el estado actual de input
     * @returns {Object} Estado de input
     */
    getInputState() {
        return { ...this.inputState };
    }
    
    /**
     * Verifica si una acción está presionada
     * @param {string} action - Acción a verificar
     * @returns {boolean} True si está presionada
     */
    isPressed(action) {
        return this.inputState[action] || false;
    }
    
    /**
     * Verifica si una acción fue presionada este frame
     * @param {string} action - Acción a verificar
     * @returns {boolean} True si fue presionada este frame
     */
    wasPressed(action) {
        return this.inputState[action] && !this.previousState[action];
    }
    
    /**
     * Verifica si una acción fue liberada este frame
     * @param {string} action - Acción a verificar
     * @returns {boolean} True si fue liberada este frame
     */
    wasReleased(action) {
        return !this.inputState[action] && this.previousState[action];
    }
    
    /**
     * Obtiene información del dispositivo activo
     * @returns {Object} Información del dispositivo
     */
    getDeviceInfo() {
        return {
            ...this.deviceState,
            handlers: {
                keyboard: !!this.keyboardHandler,
                mouse: !!this.mouseHandler,
                touch: !!this.touchHandler
            }
        };
    }
    
    /**
     * Obtiene información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            inputState: { ...this.inputState },
            previousState: { ...this.previousState },
            deviceState: { ...this.deviceState },
            deviceConfig: { ...this.deviceConfig },
            handlers: {
                keyboard: this.keyboardHandler ? this.keyboardHandler.getDebugInfo() : null,
                mouse: this.mouseHandler ? this.mouseHandler.getDebugInfo() : null,
                touch: this.touchHandler ? this.touchHandler.getDebugInfo() : null
            }
        };
    }
    
    /**
     * Limpia recursos del gestor de entrada
     */
    destroy() {
        console.log('🧹 Destruyendo InputManager...');
        
        // Limpiar event listeners
        this.eventBus.off('*', this);
        
        // Destruir handlers
        if (this.keyboardHandler) {
            this.keyboardHandler.destroy();
            this.keyboardHandler = null;
        }
        
        if (this.mouseHandler) {
            this.mouseHandler.destroy();
            this.mouseHandler = null;
        }
        
        if (this.touchHandler) {
            this.touchHandler.destroy();
            this.touchHandler = null;
        }
        
        // Limpiar event listeners de ventana
        window.removeEventListener('orientationchange', this.handleOrientationChange);
        window.removeEventListener('resize', this.handleResize);
        
        this.isInitialized = false;
        
        console.log('✅ InputManager destruido');
    }
}