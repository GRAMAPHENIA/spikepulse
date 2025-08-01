/**
 * StorageManager - Sistema de gestión de almacenamiento local
 * @module StorageManager
 */

export class StorageManager {
    /**
     * Crea una nueva instancia del StorageManager
     * @param {string} gamePrefix - Prefijo para las claves de almacenamiento
     */
    constructor(gamePrefix = 'spikepulse') {
        this.prefix = gamePrefix;
        this.isAvailable = this.checkStorageAvailability();
        
        // Estructura de datos por defecto
        this.defaultData = {
            highScores: [],
            playerStats: {
                totalDistance: 0,
                totalJumps: 0,
                totalDashes: 0,
                totalPlayTime: 0,
                gamesPlayed: 0,
                bestDistance: 0,
                averageDistance: 0
            },
            settings: {
                soundEnabled: true,
                musicEnabled: true,
                vibrationEnabled: true,
                showFPS: false,
                difficulty: 'normal',
                controlScheme: 'default'
            },
            achievements: [],
            lastPlayed: null
        };
        
        this.init();
    }

    /**
     * Inicializar el sistema de almacenamiento
     * @private
     */
    init() {
        if (!this.isAvailable) {
            console.warn('[StorageManager] localStorage no disponible, usando almacenamiento temporal');
            this.tempStorage = {};
            return;
        }

        // Verificar si es la primera vez que se ejecuta el juego
        const isFirstRun = !this.hasKey('initialized');
        if (isFirstRun) {
            this.initializeFirstRun();
        }

        console.log('[StorageManager] Sistema de almacenamiento inicializado');
    }

    /**
     * Verificar disponibilidad de localStorage
     * @returns {boolean} True si localStorage está disponible
     * @private
     */
    checkStorageAvailability() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.warn('[StorageManager] localStorage no disponible:', error.message);
            return false;
        }
    }

    /**
     * Inicializar datos para la primera ejecución
     * @private
     */
    initializeFirstRun() {
        console.log('[StorageManager] Primera ejecución detectada, inicializando datos...');
        
        // Establecer datos por defecto
        Object.keys(this.defaultData).forEach(key => {
            this.set(key, this.defaultData[key]);
        });

        // Marcar como inicializado
        this.set('initialized', true);
        this.set('firstRunDate', new Date().toISOString());
        
        console.log('[StorageManager] Datos iniciales establecidos');
    }

    /**
     * Generar clave completa con prefijo
     * @param {string} key - Clave base
     * @returns {string} Clave con prefijo
     * @private
     */
    getFullKey(key) {
        return `${this.prefix}_${key}`;
    }

    /**
     * Verificar si existe una clave
     * @param {string} key - Clave a verificar
     * @returns {boolean} True si la clave existe
     */
    hasKey(key) {
        if (!this.isAvailable) {
            return this.tempStorage.hasOwnProperty(key);
        }
        
        return localStorage.getItem(this.getFullKey(key)) !== null;
    }

    /**
     * Obtener valor del almacenamiento
     * @param {string} key - Clave del valor
     * @param {*} defaultValue - Valor por defecto si no existe
     * @returns {*} Valor almacenado o valor por defecto
     */
    get(key, defaultValue = null) {
        try {
            let value;
            
            if (!this.isAvailable) {
                value = this.tempStorage[key];
            } else {
                value = localStorage.getItem(this.getFullKey(key));
            }
            
            if (value === null || value === undefined) {
                return defaultValue;
            }
            
            // Intentar parsear como JSON
            try {
                return JSON.parse(value);
            } catch {
                // Si no es JSON válido, devolver como string
                return value;
            }
        } catch (error) {
            console.error(`[StorageManager] Error obteniendo clave "${key}":`, error);
            return defaultValue;
        }
    }

    /**
     * Establecer valor en el almacenamiento
     * @param {string} key - Clave del valor
     * @param {*} value - Valor a almacenar
     * @returns {boolean} True si se guardó correctamente
     */
    set(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            
            if (!this.isAvailable) {
                this.tempStorage[key] = serializedValue;
            } else {
                localStorage.setItem(this.getFullKey(key), serializedValue);
            }
            
            return true;
        } catch (error) {
            console.error(`[StorageManager] Error guardando clave "${key}":`, error);
            return false;
        }
    }

    /**
     * Eliminar valor del almacenamiento
     * @param {string} key - Clave a eliminar
     * @returns {boolean} True si se eliminó correctamente
     */
    remove(key) {
        try {
            if (!this.isAvailable) {
                delete this.tempStorage[key];
            } else {
                localStorage.removeItem(this.getFullKey(key));
            }
            
            return true;
        } catch (error) {
            console.error(`[StorageManager] Error eliminando clave "${key}":`, error);
            return false;
        }
    }

    /**
     * Limpiar todo el almacenamiento del juego
     * @returns {boolean} True si se limpió correctamente
     */
    clear() {
        try {
            if (!this.isAvailable) {
                this.tempStorage = {};
            } else {
                // Eliminar solo las claves del juego
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.prefix + '_')) {
                        keysToRemove.push(key);
                    }
                }
                
                keysToRemove.forEach(key => localStorage.removeItem(key));
            }
            
            console.log('[StorageManager] Almacenamiento limpiado');
            return true;
        } catch (error) {
            console.error('[StorageManager] Error limpiando almacenamiento:', error);
            return false;
        }
    }

    /**
     * Obtener todas las claves del juego
     * @returns {string[]} Array de claves
     */
    getAllKeys() {
        if (!this.isAvailable) {
            return Object.keys(this.tempStorage);
        }
        
        const gameKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix + '_')) {
                gameKeys.push(key.replace(this.prefix + '_', ''));
            }
        }
        
        return gameKeys;
    }

    /**
     * Obtener estadísticas de uso del almacenamiento
     * @returns {Object} Estadísticas de almacenamiento
     */
    getStorageStats() {
        const stats = {
            isAvailable: this.isAvailable,
            totalKeys: 0,
            totalSize: 0,
            keys: []
        };

        if (!this.isAvailable) {
            stats.totalKeys = Object.keys(this.tempStorage).length;
            stats.totalSize = JSON.stringify(this.tempStorage).length;
            stats.keys = Object.keys(this.tempStorage);
        } else {
            let totalSize = 0;
            const gameKeys = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix + '_')) {
                    const value = localStorage.getItem(key);
                    totalSize += key.length + (value ? value.length : 0);
                    gameKeys.push(key.replace(this.prefix + '_', ''));
                }
            }
            
            stats.totalKeys = gameKeys.length;
            stats.totalSize = totalSize;
            stats.keys = gameKeys;
        }

        return stats;
    }

    /**
     * Exportar todos los datos del juego
     * @returns {Object} Datos exportados
     */
    exportData() {
        const exportedData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            data: {}
        };

        const keys = this.getAllKeys();
        keys.forEach(key => {
            exportedData.data[key] = this.get(key);
        });

        return exportedData;
    }

    /**
     * Importar datos del juego
     * @param {Object} importedData - Datos a importar
     * @returns {boolean} True si se importó correctamente
     */
    importData(importedData) {
        try {
            if (!importedData || !importedData.data) {
                throw new Error('Formato de datos inválido');
            }

            // Validar versión si es necesario
            if (importedData.version && importedData.version !== '1.0') {
                console.warn('[StorageManager] Versión de datos diferente, intentando importar...');
            }

            // Importar datos
            Object.keys(importedData.data).forEach(key => {
                this.set(key, importedData.data[key]);
            });

            console.log('[StorageManager] Datos importados correctamente');
            return true;
        } catch (error) {
            console.error('[StorageManager] Error importando datos:', error);
            return false;
        }
    }

    /**
     * Crear backup de los datos
     * @returns {string} Datos en formato JSON
     */
    createBackup() {
        const backupData = this.exportData();
        return JSON.stringify(backupData, null, 2);
    }

    /**
     * Restaurar desde backup
     * @param {string} backupString - Datos de backup en JSON
     * @returns {boolean} True si se restauró correctamente
     */
    restoreFromBackup(backupString) {
        try {
            const backupData = JSON.parse(backupString);
            return this.importData(backupData);
        } catch (error) {
            console.error('[StorageManager] Error restaurando backup:', error);
            return false;
        }
    }

    /**
     * Verificar integridad de los datos
     * @returns {Object} Resultado de la verificación
     */
    verifyDataIntegrity() {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        try {
            // Verificar datos esenciales
            const essentialKeys = ['highScores', 'playerStats', 'settings'];
            essentialKeys.forEach(key => {
                if (!this.hasKey(key)) {
                    result.errors.push(`Clave esencial faltante: ${key}`);
                    result.isValid = false;
                }
            });

            // Verificar estructura de puntuaciones altas
            const highScores = this.get('highScores', []);
            if (!Array.isArray(highScores)) {
                result.errors.push('highScores no es un array');
                result.isValid = false;
            }

            // Verificar estructura de estadísticas
            const playerStats = this.get('playerStats', {});
            if (typeof playerStats !== 'object') {
                result.errors.push('playerStats no es un objeto');
                result.isValid = false;
            }

            // Verificar estructura de configuración
            const settings = this.get('settings', {});
            if (typeof settings !== 'object') {
                result.errors.push('settings no es un objeto');
                result.isValid = false;
            }

        } catch (error) {
            result.errors.push(`Error verificando integridad: ${error.message}`);
            result.isValid = false;
        }

        return result;
    }

    /**
     * Reparar datos corruptos
     * @returns {boolean} True si se reparó correctamente
     */
    repairData() {
        try {
            console.log('[StorageManager] Iniciando reparación de datos...');

            // Restaurar datos por defecto para claves faltantes o corruptas
            Object.keys(this.defaultData).forEach(key => {
                const currentValue = this.get(key);
                if (currentValue === null || currentValue === undefined) {
                    console.log(`[StorageManager] Restaurando clave faltante: ${key}`);
                    this.set(key, this.defaultData[key]);
                }
            });

            // Verificar y reparar tipos de datos
            const highScores = this.get('highScores');
            if (!Array.isArray(highScores)) {
                console.log('[StorageManager] Reparando highScores');
                this.set('highScores', []);
            }

            const playerStats = this.get('playerStats');
            if (typeof playerStats !== 'object' || playerStats === null) {
                console.log('[StorageManager] Reparando playerStats');
                this.set('playerStats', this.defaultData.playerStats);
            }

            const settings = this.get('settings');
            if (typeof settings !== 'object' || settings === null) {
                console.log('[StorageManager] Reparando settings');
                this.set('settings', this.defaultData.settings);
            }

            console.log('[StorageManager] Reparación completada');
            return true;
        } catch (error) {
            console.error('[StorageManager] Error durante la reparación:', error);
            return false;
        }
    }
}