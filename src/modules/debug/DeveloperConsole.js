/**
 * DeveloperConsole - Consola de desarrollador avanzada para Spikepulse
 * @module DeveloperConsole
 */

import { SPANISH_TEXT } from '../../config/SpanishText.js';

export class DeveloperConsole {
    /**
     * Crea una nueva instancia de la consola de desarrollador
     * @param {EventBus} eventBus - Bus de eventos
     * @param {Object} config - Configuración de la consola
     */
    constructor(eventBus, config = {}) {
        this.eventBus = eventBus;
        this.config = {
            maxHistory: config.maxHistory || 100,
            maxOutput: config.maxOutput || 500,
            enableAutoComplete: config.enableAutoComplete !== false,
            enableHistory: config.enableHistory !== false,
            theme: config.theme || 'dark',
            ...config
        };

        // Estado de la consola
        this.isVisible = false;
        this.isInitialized = false;
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentInput = '';

        // Elementos del DOM
        this.consoleElement = null;
        this.outputElement = null;
        this.inputElement = null;

        // Comandos disponibles
        this.commands = new Map();
        this.aliases = new Map();

        // Variables de contexto para comandos
        this.context = {
            game: null,
            player: null,
            world: null,
            renderer: null
        };

        this.init();
    }

    /**
     * Inicializar la consola de desarrollador
     * @private
     */
    init() {
        this.createConsoleUI();
        this.setupEventListeners();
        this.registerDefaultCommands();
        this.setupKeyboardShortcuts();
        this.isInitialized = true;

        console.log('[DeveloperConsole] Consola de desarrollador inicializada');
    }

    /**
     * Crear interfaz de usuario de la consola
     * @private
     */
    createConsoleUI() {
        this.consoleElement = document.createElement('div');
        this.consoleElement.id = 'developer-console';
        this.consoleElement.className = 'developer-console hidden';
        
        this.consoleElement.innerHTML = `
            <div class="console-header">
                <div class="console-title">
                    <span class="console-icon">⚡</span>
                    <span>Consola de Desarrollador - Spikepulse</span>
                </div>
                <div class="console-controls">
                    <button class="console-btn" id="console-clear">Limpiar</button>
                    <button class="console-btn" id="console-export">Exportar</button>
                    <button class="console-btn" id="console-close">✕</button>
                </div>
            </div>
            
            <div class="console-body">
                <div class="console-output" id="console-output">
                    <div class="console-welcome">
                        <div class="welcome-line">🎮 Bienvenido a la Consola de Desarrollador de Spikepulse</div>
                        <div class="welcome-line">Escribe 'help' para ver comandos disponibles</div>
                        <div class="welcome-line">Usa ↑↓ para navegar por el historial</div>
                        <div class="welcome-line">---</div>
                    </div>
                </div>
                
                <div class="console-input-container">
                    <span class="console-prompt">spikepulse&gt;</span>
                    <input type="text" class="console-input" id="console-input" 
                           placeholder="Ingresa un comando..." autocomplete="off">
                    <div class="console-autocomplete" id="console-autocomplete"></div>
                </div>
            </div>
            
            <div class="console-status">
                <span class="status-item" id="console-status">Listo</span>
                <span class="status-item" id="console-commands-count">0 comandos</span>
            </div>
        `;

        // Aplicar estilos
        this.applyConsoleStyles();

        // Agregar al DOM
        document.body.appendChild(this.consoleElement);

        // Obtener referencias a elementos
        this.outputElement = document.getElementById('console-output');
        this.inputElement = document.getElementById('console-input');
    }

    /**
     * Aplicar estilos CSS de la consola
     * @private
     */
    applyConsoleStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .developer-console {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80vw;
                height: 70vh;
                max-width: 1000px;
                max-height: 600px;
                background: #1a1a1a;
                border: 2px solid #FFD700;
                border-radius: 8px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
                z-index: 20000;
                display: flex;
                flex-direction: column;
                font-family: 'Courier New', monospace;
                color: #fff;
            }

            .developer-console.hidden {
                display: none;
            }

            .console-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 16px;
                background: linear-gradient(90deg, #FFD700, #FFA500);
                color: #000;
                border-radius: 6px 6px 0 0;
            }

            .console-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: bold;
                font-size: 14px;
            }

            .console-icon {
                font-size: 16px;
            }

            .console-controls {
                display: flex;
                gap: 8px;
            }

            .console-btn {
                background: rgba(0, 0, 0, 0.2);
                color: #000;
                border: 1px solid rgba(0, 0, 0, 0.3);
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.2s;
            }

            .console-btn:hover {
                background: rgba(0, 0, 0, 0.3);
            }

            .console-body {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .console-output {
                flex: 1;
                padding: 12px;
                overflow-y: auto;
                background: #1a1a1a;
                font-size: 13px;
                line-height: 1.4;
            }

            .console-output::-webkit-scrollbar {
                width: 8px;
            }

            .console-output::-webkit-scrollbar-track {
                background: #2a2a2a;
            }

            .console-output::-webkit-scrollbar-thumb {
                background: #FFD700;
                border-radius: 4px;
            }

            .console-welcome {
                color: #FFD700;
                margin-bottom: 12px;
            }

            .welcome-line {
                margin-bottom: 4px;
            }

            .console-line {
                margin-bottom: 4px;
                word-wrap: break-word;
            }

            .console-line.command {
                color: #FFD700;
            }

            .console-line.output {
                color: #fff;
                margin-left: 16px;
            }

            .console-line.error {
                color: #ff6b6b;
                margin-left: 16px;
            }

            .console-line.success {
                color: #51cf66;
                margin-left: 16px;
            }

            .console-line.warning {
                color: #ffd43b;
                margin-left: 16px;
            }

            .console-line.info {
                color: #74c0fc;
                margin-left: 16px;
            }

            .console-input-container {
                position: relative;
                display: flex;
                align-items: center;
                padding: 8px 12px;
                background: #2a2a2a;
                border-top: 1px solid #444;
            }

            .console-prompt {
                color: #FFD700;
                margin-right: 8px;
                font-weight: bold;
            }

            .console-input {
                flex: 1;
                background: transparent;
                border: none;
                color: #fff;
                font-family: inherit;
                font-size: 13px;
                outline: none;
            }

            .console-autocomplete {
                position: absolute;
                bottom: 100%;
                left: 12px;
                right: 12px;
                background: #333;
                border: 1px solid #555;
                border-radius: 4px;
                max-height: 120px;
                overflow-y: auto;
                display: none;
            }

            .autocomplete-item {
                padding: 6px 12px;
                cursor: pointer;
                border-bottom: 1px solid #444;
            }

            .autocomplete-item:hover,
            .autocomplete-item.selected {
                background: #FFD700;
                color: #000;
            }

            .autocomplete-item:last-child {
                border-bottom: none;
            }

            .console-status {
                display: flex;
                justify-content: space-between;
                padding: 4px 12px;
                background: #2a2a2a;
                border-top: 1px solid #444;
                font-size: 11px;
                color: #999;
            }

            .status-item {
                display: flex;
                align-items: center;
            }

            .command-help {
                margin-left: 16px;
                color: #999;
                font-style: italic;
            }

            .command-category {
                color: #FFD700;
                font-weight: bold;
                margin: 8px 0 4px 0;
                border-bottom: 1px solid #444;
                padding-bottom: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Configurar listeners de eventos
     * @private
     */
    setupEventListeners() {
        // Botones de la consola
        document.getElementById('console-clear')?.addEventListener('click', () => {
            this.clearOutput();
        });

        document.getElementById('console-export')?.addEventListener('click', () => {
            this.exportLog();
        });

        document.getElementById('console-close')?.addEventListener('click', () => {
            this.hide();
        });

        // Input de la consola
        if (this.inputElement) {
            this.inputElement.addEventListener('keydown', (e) => {
                this.handleInputKeydown(e);
            });

            this.inputElement.addEventListener('input', (e) => {
                this.handleInputChange(e);
            });
        }

        // Eventos del juego
        this.eventBus.on('game:context-updated', (data) => {
            this.updateContext(data);
        });

        this.eventBus.on('console:log', (data) => {
            this.log(data.message, data.type || 'info');
        });
    }

    /**
     * Configurar atajos de teclado
     * @private
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // F1: Toggle consola
            if (e.key === 'F1') {
                e.preventDefault();
                this.toggle();
            }

            // Ctrl + Shift + C: Toggle consola
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                this.toggle();
            }

            // Escape: Cerrar consola
            if (e.key === 'Escape' && this.isVisible) {
                e.preventDefault();
                this.hide();
            }
        });
    }

    /**
     * Manejar teclas en el input
     * @param {KeyboardEvent} e - Evento de teclado
     * @private
     */
    handleInputKeydown(e) {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                this.executeCommand();
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.navigateHistory(-1);
                break;

            case 'ArrowDown':
                e.preventDefault();
                this.navigateHistory(1);
                break;

            case 'Tab':
                e.preventDefault();
                this.handleAutoComplete();
                break;

            case 'Escape':
                this.hideAutoComplete();
                break;
        }
    }

    /**
     * Manejar cambios en el input
     * @param {Event} e - Evento de input
     * @private
     */
    handleInputChange(e) {
        this.currentInput = e.target.value;
        
        if (this.config.enableAutoComplete && this.currentInput.length > 0) {
            this.showAutoComplete();
        } else {
            this.hideAutoComplete();
        }
    }

    /**
     * Registrar comandos por defecto
     * @private
     */
    registerDefaultCommands() {
        // Comando help
        this.registerCommand('help', {
            description: 'Mostrar ayuda de comandos',
            usage: 'help [comando]',
            category: 'General',
            handler: (args) => {
                if (args.length > 0) {
                    this.showCommandHelp(args[0]);
                } else {
                    this.showAllCommands();
                }
            }
        });

        // Comando clear
        this.registerCommand('clear', {
            description: 'Limpiar la consola',
            usage: 'clear',
            category: 'General',
            handler: () => {
                this.clearOutput();
            }
        });

        // Comando echo
        this.registerCommand('echo', {
            description: 'Mostrar texto',
            usage: 'echo <texto>',
            category: 'General',
            handler: (args) => {
                this.log(args.join(' '), 'output');
            }
        });

        // Comandos de juego
        this.registerCommand('fps', {
            description: 'Mostrar información de FPS',
            usage: 'fps',
            category: 'Juego',
            handler: () => {
                this.eventBus.emit('console:request-fps');
            }
        });

        this.registerCommand('player', {
            description: 'Información del jugador',
            usage: 'player [propiedad] [valor]',
            category: 'Juego',
            handler: (args) => {
                if (args.length === 0) {
                    this.eventBus.emit('console:request-player-info');
                } else if (args.length === 1) {
                    this.eventBus.emit('console:get-player-property', { property: args[0] });
                } else {
                    this.eventBus.emit('console:set-player-property', { 
                        property: args[0], 
                        value: this.parseValue(args[1]) 
                    });
                }
            }
        });

        this.registerCommand('state', {
            description: 'Información del estado del juego',
            usage: 'state [nuevo_estado]',
            category: 'Juego',
            handler: (args) => {
                if (args.length === 0) {
                    this.eventBus.emit('console:request-game-state');
                } else {
                    this.eventBus.emit('state:change', { to: args[0] });
                    this.log(`Cambiando estado a: ${args[0]}`, 'info');
                }
            }
        });

        this.registerCommand('spawn', {
            description: 'Generar obstáculo',
            usage: 'spawn <tipo> [x] [y]',
            category: 'Mundo',
            handler: (args) => {
                if (args.length === 0) {
                    this.log('Uso: spawn <tipo> [x] [y]', 'error');
                    return;
                }

                const type = args[0];
                const x = args.length > 1 ? parseFloat(args[1]) : undefined;
                const y = args.length > 2 ? parseFloat(args[2]) : undefined;

                this.eventBus.emit('world:spawn-obstacle', { type, x, y });
                this.log(`Generando obstáculo: ${type}`, 'success');
            }
        });

        this.registerCommand('teleport', {
            description: 'Teletransportar jugador',
            usage: 'teleport <x> <y>',
            category: 'Jugador',
            handler: (args) => {
                if (args.length < 2) {
                    this.log('Uso: teleport <x> <y>', 'error');
                    return;
                }

                const x = parseFloat(args[0]);
                const y = parseFloat(args[1]);

                if (isNaN(x) || isNaN(y)) {
                    this.log('Coordenadas inválidas', 'error');
                    return;
                }

                this.eventBus.emit('player:teleport', { x, y });
                this.log(`Teletransportando a (${x}, ${y})`, 'success');
            }
        });

        this.registerCommand('god', {
            description: 'Alternar modo invencible',
            usage: 'god [on|off]',
            category: 'Jugador',
            handler: (args) => {
                const enabled = args.length > 0 ? args[0] === 'on' : undefined;
                this.eventBus.emit('player:toggle-god-mode', { enabled });
                this.log(`Modo invencible ${enabled !== undefined ? (enabled ? 'activado' : 'desactivado') : 'alternado'}`, 'info');
            }
        });

        this.registerCommand('speed', {
            description: 'Cambiar velocidad del juego',
            usage: 'speed <multiplicador>',
            category: 'Juego',
            handler: (args) => {
                if (args.length === 0) {
                    this.eventBus.emit('console:request-game-speed');
                    return;
                }

                const speed = parseFloat(args[0]);
                if (isNaN(speed) || speed <= 0) {
                    this.log('Velocidad inválida', 'error');
                    return;
                }

                this.eventBus.emit('game:set-speed', { speed });
                this.log(`Velocidad del juego: ${speed}x`, 'success');
            }
        });

        this.registerCommand('debug', {
            description: 'Alternar modo debug',
            usage: 'debug [on|off]',
            category: 'Debug',
            handler: (args) => {
                const enabled = args.length > 0 ? args[0] === 'on' : undefined;
                this.eventBus.emit('debug:toggle', { enabled });
                this.log(`Modo debug ${enabled !== undefined ? (enabled ? 'activado' : 'desactivado') : 'alternado'}`, 'info');
            }
        });

        this.registerCommand('emit', {
            description: 'Emitir evento personalizado',
            usage: 'emit <evento> [datos_json]',
            category: 'Debug',
            handler: (args) => {
                if (args.length === 0) {
                    this.log('Uso: emit <evento> [datos_json]', 'error');
                    return;
                }

                const eventName = args[0];
                let eventData = {};

                if (args.length > 1) {
                    try {
                        eventData = JSON.parse(args.slice(1).join(' '));
                    } catch (error) {
                        this.log(`Error parseando JSON: ${error.message}`, 'error');
                        return;
                    }
                }

                this.eventBus.emit(eventName, eventData);
                this.log(`Evento emitido: ${eventName}`, 'success');
            }
        });

        this.registerCommand('memory', {
            description: 'Información de memoria',
            usage: 'memory [gc]',
            category: 'Debug',
            handler: (args) => {
                if (args.length > 0 && args[0] === 'gc') {
                    if (window.gc) {
                        window.gc();
                        this.log('Garbage collection ejecutado', 'success');
                    } else {
                        this.log('Garbage collection no disponible', 'warning');
                    }
                } else {
                    this.eventBus.emit('console:request-memory-info');
                }
            }
        });

        // Aliases comunes
        this.registerAlias('h', 'help');
        this.registerAlias('c', 'clear');
        this.registerAlias('p', 'player');
        this.registerAlias('tp', 'teleport');
        this.registerAlias('mem', 'memory');

        this.updateCommandsCount();
    }

    /**
     * Registrar comando
     * @param {string} name - Nombre del comando
     * @param {Object} config - Configuración del comando
     */
    registerCommand(name, config) {
        this.commands.set(name, {
            name,
            description: config.description || 'Sin descripción',
            usage: config.usage || name,
            category: config.category || 'General',
            handler: config.handler || (() => this.log('Comando no implementado', 'error')),
            ...config
        });

        this.updateCommandsCount();
    }

    /**
     * Registrar alias de comando
     * @param {string} alias - Alias
     * @param {string} command - Comando original
     */
    registerAlias(alias, command) {
        this.aliases.set(alias, command);
    }

    /**
     * Ejecutar comando
     * @private
     */
    executeCommand() {
        const input = this.inputElement.value.trim();
        if (!input) return;

        // Agregar al historial
        if (this.config.enableHistory) {
            this.commandHistory.push(input);
            if (this.commandHistory.length > this.config.maxHistory) {
                this.commandHistory.shift();
            }
            this.historyIndex = -1;
        }

        // Mostrar comando en output
        this.log(`spikepulse> ${input}`, 'command');

        // Parsear comando
        const parts = input.split(' ').filter(part => part.length > 0);
        const commandName = parts[0].toLowerCase();
        const args = parts.slice(1);

        // Resolver alias
        const resolvedCommand = this.aliases.get(commandName) || commandName;

        // Ejecutar comando
        const command = this.commands.get(resolvedCommand);
        if (command) {
            try {
                command.handler(args);
            } catch (error) {
                this.log(`Error ejecutando comando: ${error.message}`, 'error');
            }
        } else {
            this.log(`Comando desconocido: ${commandName}. Escribe 'help' para ver comandos disponibles.`, 'error');
        }

        // Limpiar input
        this.inputElement.value = '';
        this.currentInput = '';
        this.hideAutoComplete();
    }

    /**
     * Navegar por el historial
     * @param {number} direction - Dirección (-1 = atrás, 1 = adelante)
     * @private
     */
    navigateHistory(direction) {
        if (!this.config.enableHistory || this.commandHistory.length === 0) {
            return;
        }

        if (direction === -1) {
            // Hacia atrás
            if (this.historyIndex === -1) {
                this.historyIndex = this.commandHistory.length - 1;
            } else if (this.historyIndex > 0) {
                this.historyIndex--;
            }
        } else {
            // Hacia adelante
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.historyIndex++;
            } else {
                this.historyIndex = -1;
                this.inputElement.value = this.currentInput;
                return;
            }
        }

        if (this.historyIndex >= 0) {
            this.inputElement.value = this.commandHistory[this.historyIndex];
        }
    }

    /**
     * Mostrar autocompletado
     * @private
     */
    showAutoComplete() {
        const input = this.currentInput.toLowerCase();
        const matches = [];

        // Buscar comandos que coincidan
        for (const [name, command] of this.commands) {
            if (name.startsWith(input)) {
                matches.push({ name, type: 'command', data: command });
            }
        }

        // Buscar aliases que coincidan
        for (const [alias, command] of this.aliases) {
            if (alias.startsWith(input)) {
                matches.push({ name: alias, type: 'alias', data: { description: `Alias de ${command}` } });
            }
        }

        if (matches.length > 0) {
            this.displayAutoComplete(matches);
        } else {
            this.hideAutoComplete();
        }
    }

    /**
     * Mostrar lista de autocompletado
     * @param {Array} matches - Coincidencias
     * @private
     */
    displayAutoComplete(matches) {
        const autocompleteElement = document.getElementById('console-autocomplete');
        if (!autocompleteElement) return;

        autocompleteElement.innerHTML = '';
        
        matches.slice(0, 8).forEach((match, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            if (index === 0) item.classList.add('selected');
            
            item.innerHTML = `
                <strong>${match.name}</strong>
                <span style="color: #999; margin-left: 8px;">${match.data.description}</span>
            `;
            
            item.addEventListener('click', () => {
                this.inputElement.value = match.name + ' ';
                this.inputElement.focus();
                this.hideAutoComplete();
            });
            
            autocompleteElement.appendChild(item);
        });

        autocompleteElement.style.display = 'block';
    }

    /**
     * Ocultar autocompletado
     * @private
     */
    hideAutoComplete() {
        const autocompleteElement = document.getElementById('console-autocomplete');
        if (autocompleteElement) {
            autocompleteElement.style.display = 'none';
        }
    }

    /**
     * Manejar autocompletado con Tab
     * @private
     */
    handleAutoComplete() {
        const autocompleteElement = document.getElementById('console-autocomplete');
        if (!autocompleteElement || autocompleteElement.style.display === 'none') {
            return;
        }

        const selectedItem = autocompleteElement.querySelector('.autocomplete-item.selected');
        if (selectedItem) {
            const commandName = selectedItem.querySelector('strong').textContent;
            this.inputElement.value = commandName + ' ';
            this.hideAutoComplete();
        }
    }

    /**
     * Mostrar ayuda de todos los comandos
     * @private
     */
    showAllCommands() {
        this.log('Comandos disponibles:', 'info');
        
        const categories = {};
        
        // Agrupar comandos por categoría
        for (const [name, command] of this.commands) {
            if (!categories[command.category]) {
                categories[command.category] = [];
            }
            categories[command.category].push(command);
        }

        // Mostrar comandos por categoría
        for (const [category, commands] of Object.entries(categories)) {
            this.log(`\n${category}:`, 'info');
            commands.forEach(command => {
                this.log(`  ${command.name} - ${command.description}`, 'output');
            });
        }

        this.log('\nEscribe "help <comando>" para más información sobre un comando específico.', 'info');
    }

    /**
     * Mostrar ayuda de un comando específico
     * @param {string} commandName - Nombre del comando
     * @private
     */
    showCommandHelp(commandName) {
        const resolvedCommand = this.aliases.get(commandName) || commandName;
        const command = this.commands.get(resolvedCommand);

        if (command) {
            this.log(`Comando: ${command.name}`, 'info');
            this.log(`Descripción: ${command.description}`, 'output');
            this.log(`Uso: ${command.usage}`, 'output');
            this.log(`Categoría: ${command.category}`, 'output');
        } else {
            this.log(`Comando no encontrado: ${commandName}`, 'error');
        }
    }

    /**
     * Parsear valor de string
     * @param {string} value - Valor como string
     * @returns {*} Valor parseado
     * @private
     */
    parseValue(value) {
        // Intentar parsear como número
        const num = parseFloat(value);
        if (!isNaN(num)) {
            return num;
        }

        // Intentar parsear como boolean
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;

        // Intentar parsear como JSON
        try {
            return JSON.parse(value);
        } catch {
            // Devolver como string
            return value;
        }
    }

    /**
     * Actualizar contador de comandos
     * @private
     */
    updateCommandsCount() {
        const countElement = document.getElementById('console-commands-count');
        if (countElement) {
            countElement.textContent = `${this.commands.size} comandos`;
        }
    }

    /**
     * Actualizar contexto del juego
     * @param {Object} context - Nuevo contexto
     */
    updateContext(context) {
        this.context = { ...this.context, ...context };
    }

    /**
     * Registrar mensaje en la consola
     * @param {string} message - Mensaje
     * @param {string} type - Tipo de mensaje
     */
    log(message, type = 'output') {
        if (!this.outputElement) return;

        const line = document.createElement('div');
        line.className = `console-line ${type}`;
        line.textContent = message;

        this.outputElement.appendChild(line);

        // Mantener límite de líneas
        while (this.outputElement.children.length > this.config.maxOutput) {
            this.outputElement.removeChild(this.outputElement.firstChild);
        }

        // Scroll al final
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }

    /**
     * Limpiar output de la consola
     */
    clearOutput() {
        if (this.outputElement) {
            this.outputElement.innerHTML = '';
        }
    }

    /**
     * Exportar log de la consola
     */
    exportLog() {
        if (!this.outputElement) return;

        const lines = Array.from(this.outputElement.children)
            .map(line => line.textContent)
            .join('\n');

        const blob = new Blob([lines], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `spikepulse-console-${Date.now()}.txt`;
        link.click();

        URL.revokeObjectURL(url);
        this.log('Log exportado', 'success');
    }

    /**
     * Mostrar consola
     */
    show() {
        if (this.consoleElement) {
            this.consoleElement.classList.remove('hidden');
            this.isVisible = true;
            
            // Enfocar input
            setTimeout(() => {
                if (this.inputElement) {
                    this.inputElement.focus();
                }
            }, 100);
        }
    }

    /**
     * Ocultar consola
     */
    hide() {
        if (this.consoleElement) {
            this.consoleElement.classList.add('hidden');
            this.isVisible = false;
            this.hideAutoComplete();
        }
    }

    /**
     * Alternar visibilidad de la consola
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Obtener estadísticas de la consola
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            isVisible: this.isVisible,
            isInitialized: this.isInitialized,
            commandCount: this.commands.size,
            aliasCount: this.aliases.size,
            historyLength: this.commandHistory.length,
            outputLines: this.outputElement?.children.length || 0
        };
    }

    /**
     * Destruir la consola
     */
    destroy() {
        if (this.consoleElement) {
            this.consoleElement.remove();
            this.consoleElement = null;
        }

        this.commands.clear();
        this.aliases.clear();
        this.commandHistory = [];
        
        this.isInitialized = false;
        console.log('[DeveloperConsole] Consola de desarrollador destruida');
    }
}