/**
 * Sistema de comandos de consola para Spikepulse
 * @module ConsoleCommands
 */

export class ConsoleCommands {
    /**
     * Crea una nueva instancia del sistema de comandos
     * @param {Object} config - Configuración de comandos
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        // Configuración de comandos
        this.commandConfig = {
            enabled: config.enabled !== false,
            prefix: config.prefix || 'sp',
            caseSensitive: config.caseSensitive || false,
            showHelp: config.showHelp !== false,
            logCommands: config.logCommands !== false
        };
        
        // Registro de comandos
        this.commands = new Map();
        this.aliases = new Map();
        this.history = [];
        this.maxHistorySize = config.maxHistorySize || 100;
        
        // Referencias al juego
        this.gameEngine = null;
        this.debugUtils = null;
        
        // Estadísticas
        this.stats = {
            commandsExecuted: 0,
            commandsRegistered: 0,
            errorsCount: 0,
            lastExecuted: null
        };
        
        console.log('💻 ConsoleCommands creado');
    }
    
    /**
     * Inicializa el sistema de comandos
     */
    async init() {
        try {
            console.log('🔧 Inicializando ConsoleCommands...');
            
            // Registrar comandos por defecto
            this.registerDefaultCommands();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Exponer API global si está habilitado
            if (this.commandConfig.enabled) {
                this.exposeGlobalAPI();
            }
            
            this.isInitialized = true;
            console.log('✅ ConsoleCommands inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando ConsoleCommands:', error);
            throw error;
        }
    }
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Eventos de comandos
        this.eventBus.on('console:execute', this.executeCommand.bind(this));
        this.eventBus.on('console:register', this.registerCommand.bind(this));
        this.eventBus.on('console:unregister', this.unregisterCommand.bind(this));
        this.eventBus.on('console:clear-history', this.clearHistory.bind(this));
        
        console.log('👂 Event listeners de comandos configurados');
    }
    
    /**
     * Registra comandos por defecto
     */
    registerDefaultCommands() {
        // Comando de ayuda
        this.registerCommand({
            name: 'help',
            aliases: ['h', '?'],
            description: 'Muestra la lista de comandos disponibles',
            usage: 'help [comando]',
            execute: (args) => this.showHelp(args[0])
        });
        
        // Comando de información del juego
        this.registerCommand({
            name: 'info',
            aliases: ['i'],
            description: 'Muestra información del juego',
            usage: 'info [sistema]',
            execute: (args) => this.showGameInfo(args[0])
        });
        
        // Comando de debug
        this.registerCommand({
            name: 'debug',
            aliases: ['d'],
            description: 'Controla el modo debug',
            usage: 'debug [on|off|toggle] [opción]',
            execute: (args) => this.handleDebugCommand(args)
        });
        
        // Comando de teleport del jugador
        this.registerCommand({
            name: 'teleport',
            aliases: ['tp'],
            description: 'Teletransporta al jugador',
            usage: 'teleport <x> <y>',
            execute: (args) => this.teleportPlayer(args)
        });
        
        // Comando de velocidad del jugador
        this.registerCommand({
            name: 'velocity',
            aliases: ['vel', 'v'],
            description: 'Establece la velocidad del jugador',
            usage: 'velocity <vx> <vy>',
            execute: (args) => this.setPlayerVelocity(args)
        });
        
        // Comando de spawn de obstáculos
        this.registerCommand({
            name: 'spawn',
            aliases: ['s'],
            description: 'Genera obstáculos o elementos',
            usage: 'spawn <tipo> [x] [y]',
            execute: (args) => this.spawnObject(args)
        });
        
        // Comando de clear (limpiar)
        this.registerCommand({
            name: 'clear',
            aliases: ['cls', 'c'],
            description: 'Limpia la consola o elementos del juego',
            usage: 'clear [console|obstacles|effects]',
            execute: (args) => this.clearCommand(args)
        });
        
        // Comando de configuración
        this.registerCommand({
            name: 'config',
            aliases: ['cfg'],
            description: 'Gestiona la configuración del juego',
            usage: 'config [get|set] [clave] [valor]',
            execute: (args) => this.configCommand(args)
        });
        
        // Comando de screenshot
        this.registerCommand({
            name: 'screenshot',
            aliases: ['ss'],
            description: 'Toma una captura de pantalla',
            usage: 'screenshot [nombre]',
            execute: (args) => this.takeScreenshot(args[0])
        });
        
        // Comando de performance
        this.registerCommand({
            name: 'perf',
            aliases: ['performance'],
            description: 'Muestra información de rendimiento',
            usage: 'perf [reset]',
            execute: (args) => this.showPerformance(args[0])
        });
        
        // Comando de reset
        this.registerCommand({
            name: 'reset',
            aliases: ['restart'],
            description: 'Reinicia el juego o sistemas',
            usage: 'reset [game|debug|all]',
            execute: (args) => this.resetCommand(args)
        });
        
        // Comando de save/load
        this.registerCommand({
            name: 'save',
            description: 'Guarda el estado del juego',
            usage: 'save [nombre]',
            execute: (args) => this.saveGame(args[0])
        });
        
        this.registerCommand({
            name: 'load',
            description: 'Carga un estado guardado',
            usage: 'load [nombre]',
            execute: (args) => this.loadGame(args[0])
        });
        
        console.log(`📝 ${this.commands.size} comandos por defecto registrados`);
    }
    
    /**
     * Expone la API global para usar desde la consola del navegador
     */
    exposeGlobalAPI() {
        const prefix = this.commandConfig.prefix;
        
        // Función principal para ejecutar comandos
        window[prefix] = (commandString) => {
            return this.executeCommandString(commandString);
        };
        
        // Función de ayuda
        window[`${prefix}_help`] = () => {
            return this.showHelp();
        };
        
        // Función para listar comandos
        window[`${prefix}_commands`] = () => {
            return Array.from(this.commands.keys()).sort();
        };
        
        console.log(`🌐 API global expuesta como '${prefix}()', '${prefix}_help()', '${prefix}_commands()'`);
        console.log(`💡 Ejemplo: ${prefix}('help') o ${prefix}('debug on')`);
    }
    
    /**
     * Establece referencias al juego
     * @param {Object} gameEngine - Motor del juego
     * @param {Object} debugUtils - Utilidades de debug
     */
    setGameReferences(gameEngine, debugUtils) {
        this.gameEngine = gameEngine;
        this.debugUtils = debugUtils;
        
        console.log('🔗 Referencias del juego establecidas en ConsoleCommands');
    }
    
    /**
     * Registra un nuevo comando
     * @param {Object} commandData - Datos del comando
     */
    registerCommand(commandData) {
        const { name, aliases = [], description = '', usage = '', execute } = commandData;
        
        if (!name || typeof execute !== 'function') {
            throw new Error('Command must have a name and execute function');
        }
        
        const command = {
            name: this.commandConfig.caseSensitive ? name : name.toLowerCase(),
            description,
            usage,
            execute,
            aliases: aliases.map(alias => 
                this.commandConfig.caseSensitive ? alias : alias.toLowerCase()
            ),
            registered: Date.now()
        };
        
        // Registrar comando principal
        this.commands.set(command.name, command);
        
        // Registrar aliases
        command.aliases.forEach(alias => {
            this.aliases.set(alias, command.name);
        });
        
        this.stats.commandsRegistered++;
        
        if (this.commandConfig.logCommands) {
            console.log(`📝 Comando registrado: ${name} (aliases: ${aliases.join(', ')})`);
        }
    }
    
    /**
     * Desregistra un comando
     * @param {string} name - Nombre del comando
     */
    unregisterCommand(name) {
        const commandName = this.commandConfig.caseSensitive ? name : name.toLowerCase();
        const command = this.commands.get(commandName);
        
        if (!command) {
            console.warn(`⚠️ Comando no encontrado: ${name}`);
            return false;
        }
        
        // Remover aliases
        command.aliases.forEach(alias => {
            this.aliases.delete(alias);
        });
        
        // Remover comando
        this.commands.delete(commandName);
        
        if (this.commandConfig.logCommands) {
            console.log(`🗑️ Comando desregistrado: ${name}`);
        }
        
        return true;
    }
    
    /**
     * Ejecuta un comando desde string
     * @param {string} commandString - String del comando
     * @returns {*} Resultado del comando
     */
    executeCommandString(commandString) {
        if (!commandString || typeof commandString !== 'string') {
            return this.error('Comando inválido');
        }
        
        // Parsear comando
        const parts = commandString.trim().split(/\s+/);
        const commandName = parts[0];
        const args = parts.slice(1);
        
        return this.executeCommand({ command: commandName, args });
    }
    
    /**
     * Ejecuta un comando
     * @param {Object} data - Datos del comando
     * @returns {*} Resultado del comando
     */
    executeCommand(data) {
        const { command: commandName, args = [] } = data;
        
        if (!this.commandConfig.enabled) {
            return this.error('Sistema de comandos deshabilitado');
        }
        
        const normalizedName = this.commandConfig.caseSensitive ? 
                              commandName : commandName.toLowerCase();
        
        // Buscar comando (incluyendo aliases)
        let command = this.commands.get(normalizedName);
        if (!command) {
            const aliasTarget = this.aliases.get(normalizedName);
            if (aliasTarget) {
                command = this.commands.get(aliasTarget);
            }
        }
        
        if (!command) {
            return this.error(`Comando no encontrado: ${commandName}. Usa 'help' para ver comandos disponibles.`);
        }
        
        try {
            // Añadir al historial
            this.addToHistory(commandName, args);
            
            // Ejecutar comando
            const result = command.execute(args, { eventBus: this.eventBus, gameEngine: this.gameEngine });
            
            this.stats.commandsExecuted++;
            this.stats.lastExecuted = { command: commandName, args, timestamp: Date.now() };
            
            if (this.commandConfig.logCommands) {
                console.log(`✅ Comando ejecutado: ${commandName}`, args);
            }
            
            return result;
            
        } catch (error) {
            this.stats.errorsCount++;
            const errorMsg = `Error ejecutando comando '${commandName}': ${error.message}`;
            console.error(errorMsg, error);
            return this.error(errorMsg);
        }
    }
    
    /**
     * Añade un comando al historial
     * @param {string} command - Nombre del comando
     * @param {Array} args - Argumentos
     */
    addToHistory(command, args) {
        this.history.push({
            command,
            args: [...args],
            timestamp: Date.now()
        });
        
        // Limitar tamaño del historial
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }
    
    /**
     * Limpia el historial de comandos
     */
    clearHistory() {
        this.history.length = 0;
        console.log('🧹 Historial de comandos limpiado');
    }
    
    // ===== IMPLEMENTACIÓN DE COMANDOS =====
    
    /**
     * Muestra ayuda de comandos
     * @param {string} commandName - Comando específico
     * @returns {string} Texto de ayuda
     */
    showHelp(commandName) {
        if (commandName) {
            const command = this.commands.get(commandName) || 
                           this.commands.get(this.aliases.get(commandName));
            
            if (!command) {
                return this.error(`Comando no encontrado: ${commandName}`);
            }
            
            let help = `📖 Ayuda para '${command.name}':\n`;
            help += `   Descripción: ${command.description}\n`;
            help += `   Uso: ${command.usage}\n`;
            if (command.aliases.length > 0) {
                help += `   Aliases: ${command.aliases.join(', ')}\n`;
            }
            
            console.log(help);
            return help;
        }
        
        // Mostrar todos los comandos
        let help = '📖 Comandos disponibles de Spikepulse:\n\n';
        
        const sortedCommands = Array.from(this.commands.values())
            .sort((a, b) => a.name.localeCompare(b.name));
        
        sortedCommands.forEach(command => {
            help += `  ${command.name.padEnd(12)} - ${command.description}\n`;
        });
        
        help += `\n💡 Usa 'help <comando>' para más detalles sobre un comando específico.`;
        help += `\n💡 Usa '${this.commandConfig.prefix}("comando")' desde la consola del navegador.`;
        
        console.log(help);
        return help;
    }
    
    /**
     * Muestra información del juego
     * @param {string} system - Sistema específico
     * @returns {Object} Información del juego
     */
    showGameInfo(system) {
        if (!this.gameEngine) {
            return this.error('Motor del juego no disponible');
        }
        
        let info = {};
        
        if (!system || system === 'general') {
            info.general = {
                estado: this.gameEngine.state?.current || 'unknown',
                fps: this.gameEngine.fps || 0,
                tiempo: this.gameEngine.gameTime || 0,
                version: '1.0.0'
            };
        }
        
        if (!system || system === 'player') {
            const player = this.gameEngine.modules?.get('player');
            if (player) {
                info.player = {
                    posicion: player.getPosition ? player.getPosition() : { x: 0, y: 0 },
                    velocidad: player.velocity || { x: 0, y: 0 },
                    vidas: player.lives || 0,
                    habilidades: player.abilities || {}
                };
            }
        }
        
        if (!system || system === 'world') {
            const world = this.gameEngine.modules?.get('world');
            if (world) {
                info.world = {
                    obstaculos: world.obstacles?.length || 0,
                    coleccionables: world.collectibles?.length || 0,
                    bounds: world.bounds || null
                };
            }
        }
        
        console.table(info);
        return info;
    }
    
    /**
     * Maneja comandos de debug
     * @param {Array} args - Argumentos del comando
     * @returns {string} Resultado
     */
    handleDebugCommand(args) {
        if (!this.debugUtils) {
            return this.error('DebugUtils no disponible');
        }
        
        const action = args[0]?.toLowerCase();
        const option = args[1]?.toLowerCase();
        
        switch (action) {
            case 'on':
            case 'enable':
                this.debugUtils.toggle({ enabled: true });
                return '🐛 Debug mode enabled';
                
            case 'off':
            case 'disable':
                this.debugUtils.toggle({ enabled: false });
                return '🐛 Debug mode disabled';
                
            case 'toggle':
                this.debugUtils.toggle();
                return `🐛 Debug mode ${this.debugUtils.debugConfig.enabled ? 'enabled' : 'disabled'}`;
                
            case 'overlay':
                this.debugUtils.toggleOverlay();
                return '📊 Debug overlay toggled';
                
            case 'panel':
                this.debugUtils.togglePanel();
                return '🎛️ Debug panel toggled';
                
            case 'info':
                const debugInfo = this.debugUtils.getDebugInfo();
                console.log('🐛 Debug Info:', debugInfo);
                return debugInfo;
                
            default:
                return this.error('Uso: debug [on|off|toggle|overlay|panel|info]');
        }
    }
    
    /**
     * Teletransporta al jugador
     * @param {Array} args - Coordenadas [x, y]
     * @returns {string} Resultado
     */
    teleportPlayer(args) {
        if (args.length < 2) {
            return this.error('Uso: teleport <x> <y>');
        }
        
        const x = parseFloat(args[0]);
        const y = parseFloat(args[1]);
        
        if (isNaN(x) || isNaN(y)) {
            return this.error('Coordenadas inválidas');
        }
        
        this.eventBus.emit('player:teleport', { x, y });
        return `🚀 Jugador teletransportado a (${x}, ${y})`;
    }
    
    /**
     * Establece la velocidad del jugador
     * @param {Array} args - Velocidades [vx, vy]
     * @returns {string} Resultado
     */
    setPlayerVelocity(args) {
        if (args.length < 2) {
            return this.error('Uso: velocity <vx> <vy>');
        }
        
        const vx = parseFloat(args[0]);
        const vy = parseFloat(args[1]);
        
        if (isNaN(vx) || isNaN(vy)) {
            return this.error('Velocidades inválidas');
        }
        
        this.eventBus.emit('player:set-velocity', { vx, vy });
        return `⚡ Velocidad del jugador establecida a (${vx}, ${vy})`;
    }
    
    /**
     * Genera objetos en el juego
     * @param {Array} args - Tipo y coordenadas
     * @returns {string} Resultado
     */
    spawnObject(args) {
        if (args.length < 1) {
            return this.error('Uso: spawn <tipo> [x] [y]');
        }
        
        const type = args[0];
        const x = args[1] ? parseFloat(args[1]) : 0;
        const y = args[2] ? parseFloat(args[2]) : 0;
        
        this.eventBus.emit('world:spawn-object', { type, x, y });
        return `✨ Objeto '${type}' generado en (${x}, ${y})`;
    }
    
    /**
     * Comando de limpieza
     * @param {Array} args - Qué limpiar
     * @returns {string} Resultado
     */
    clearCommand(args) {
        const target = args[0]?.toLowerCase() || 'console';
        
        switch (target) {
            case 'console':
                console.clear();
                return '🧹 Consola limpiada';
                
            case 'obstacles':
                this.eventBus.emit('world:clear-obstacles');
                return '🧹 Obstáculos limpiados';
                
            case 'effects':
                this.eventBus.emit('effects:clear-all');
                return '🧹 Efectos limpiados';
                
            case 'log':
                if (this.debugUtils) {
                    this.debugUtils.clearLog();
                }
                return '🧹 Log de debug limpiado';
                
            default:
                return this.error('Uso: clear [console|obstacles|effects|log]');
        }
    }
    
    /**
     * Comando de configuración
     * @param {Array} args - Acción y parámetros
     * @returns {*} Resultado
     */
    configCommand(args) {
        const action = args[0]?.toLowerCase();
        const key = args[1];
        const value = args[2];
        
        switch (action) {
            case 'get':
                if (!key) {
                    // Mostrar toda la configuración
                    const config = this.gameEngine?.config || {};
                    console.log('⚙️ Configuración actual:', config);
                    return config;
                }
                // Obtener valor específico
                const currentValue = this.getConfigValue(key);
                console.log(`⚙️ ${key} = ${currentValue}`);
                return currentValue;
                
            case 'set':
                if (!key || value === undefined) {
                    return this.error('Uso: config set <clave> <valor>');
                }
                this.setConfigValue(key, value);
                return `⚙️ ${key} establecido a ${value}`;
                
            default:
                return this.error('Uso: config [get|set] [clave] [valor]');
        }
    }
    
    /**
     * Toma una captura de pantalla
     * @param {string} filename - Nombre del archivo
     * @returns {string} Resultado
     */
    takeScreenshot(filename) {
        if (!this.debugUtils) {
            return this.error('DebugUtils no disponible');
        }
        
        const dataURL = this.debugUtils.takeScreenshot();
        if (dataURL) {
            // Crear enlace de descarga
            const a = document.createElement('a');
            a.href = dataURL;
            a.download = filename || `spikepulse-screenshot-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            return `📸 Captura guardada como ${a.download}`;
        }
        
        return this.error('No se pudo tomar la captura');
    }
    
    /**
     * Muestra información de rendimiento
     * @param {string} action - Acción (reset)
     * @returns {Object} Información de rendimiento
     */
    showPerformance(action) {
        if (action === 'reset') {
            // Reset performance counters
            this.stats.commandsExecuted = 0;
            this.stats.errorsCount = 0;
            return '🔄 Contadores de rendimiento reseteados';
        }
        
        const perf = {
            comandos: {
                ejecutados: this.stats.commandsExecuted,
                registrados: this.stats.commandsRegistered,
                errores: this.stats.errorsCount,
                ultimo: this.stats.lastExecuted
            },
            memoria: performance.memory ? {
                usada: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
                limite: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
            } : 'No disponible',
            tiempo: {
                navegacion: performance.now(),
                origen: performance.timeOrigin
            }
        };
        
        console.table(perf);
        return perf;
    }
    
    /**
     * Comando de reset
     * @param {Array} args - Qué resetear
     * @returns {string} Resultado
     */
    resetCommand(args) {
        const target = args[0]?.toLowerCase() || 'game';
        
        switch (target) {
            case 'game':
                this.eventBus.emit('game:reset');
                return '🔄 Juego reseteado';
                
            case 'debug':
                if (this.debugUtils) {
                    this.debugUtils.reset();
                }
                return '🔄 Debug reseteado';
                
            case 'all':
                this.eventBus.emit('game:reset');
                if (this.debugUtils) {
                    this.debugUtils.reset();
                }
                this.clearHistory();
                return '🔄 Todo reseteado';
                
            default:
                return this.error('Uso: reset [game|debug|all]');
        }
    }
    
    /**
     * Guarda el estado del juego
     * @param {string} name - Nombre del save
     * @returns {string} Resultado
     */
    saveGame(name) {
        const saveName = name || `save_${Date.now()}`;
        this.eventBus.emit('game:save', { name: saveName });
        return `💾 Juego guardado como '${saveName}'`;
    }
    
    /**
     * Carga un estado guardado
     * @param {string} name - Nombre del save
     * @returns {string} Resultado
     */
    loadGame(name) {
        if (!name) {
            return this.error('Uso: load <nombre>');
        }
        
        this.eventBus.emit('game:load', { name });
        return `📁 Cargando juego '${name}'`;
    }
    
    // ===== MÉTODOS DE UTILIDAD =====
    
    /**
     * Obtiene un valor de configuración
     * @param {string} key - Clave de configuración
     * @returns {*} Valor
     */
    getConfigValue(key) {
        const config = this.gameEngine?.config || {};
        const keys = key.split('.');
        let value = config;
        
        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) break;
        }
        
        return value;
    }
    
    /**
     * Establece un valor de configuración
     * @param {string} key - Clave de configuración
     * @param {*} value - Valor
     */
    setConfigValue(key, value) {
        this.eventBus.emit('config:set', { key, value });
    }
    
    /**
     * Formatea un mensaje de error
     * @param {string} message - Mensaje de error
     * @returns {string} Error formateado
     */
    error(message) {
        const errorMsg = `❌ Error: ${message}`;
        console.error(errorMsg);
        return errorMsg;
    }
    
    /**
     * Obtiene estadísticas del sistema de comandos
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            ...this.stats,
            commandsAvailable: this.commands.size,
            aliasesRegistered: this.aliases.size,
            historySize: this.history.length,
            isEnabled: this.commandConfig.enabled
        };
    }
    
    /**
     * Obtiene información de debug
     * @returns {Object} Información de debug
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            config: { ...this.commandConfig },
            stats: this.getStats(),
            commands: Array.from(this.commands.keys()).sort(),
            aliases: Object.fromEntries(this.aliases),
            recentHistory: this.history.slice(-10),
            hasGameReferences: {
                gameEngine: this.gameEngine !== null,
                debugUtils: this.debugUtils !== null
            }
        };
    }
    
    /**
     * Resetea el sistema de comandos
     */
    reset() {
        console.log('🔄 Reseteando ConsoleCommands...');
        
        // Limpiar historial
        this.clearHistory();
        
        // Resetear estadísticas
        this.stats.commandsExecuted = 0;
        this.stats.errorsCount = 0;
        this.stats.lastExecuted = null;
        
        console.log('✅ ConsoleCommands reseteado');
    }
    
    /**
     * Limpia recursos del sistema de comandos
     */
    destroy() {
        console.log('🧹 Destruyendo ConsoleCommands...');
        
        // Remover event listeners
        this.eventBus.off('*', this);
        
        // Limpiar API global
        const prefix = this.commandConfig.prefix;
        if (window[prefix]) {
            delete window[prefix];
            delete window[`${prefix}_help`];
            delete window[`${prefix}_commands`];
        }
        
        // Limpiar mapas
        this.commands.clear();
        this.aliases.clear();
        this.history.length = 0;
        
        // Limpiar referencias
        this.gameEngine = null;
        this.debugUtils = null;
        
        this.isInitialized = false;
        
        console.log('✅ ConsoleCommands destruido');
    }
}