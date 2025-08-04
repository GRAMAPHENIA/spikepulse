/**
 * Validador de configuraciones para Spikepulse
 * @module ConfigValidator
 */

export class ConfigValidator {
    /**
     * Esquemas de validación para diferentes configuraciones
     */
    static schemas = {
        game: {
            canvas: {
                width: { type: 'number', min: 400, max: 2000, default: 1200 },
                height: { type: 'number', min: 300, max: 1200, default: 600 },
                backgroundColor: { type: 'string', default: '#0F0F0F' },
                targetFPS: { type: 'number', min: 30, max: 120, default: 60 }
            },
            player: {
                physics: {
                    gravity: { type: 'number', min: 0.1, max: 2.0, default: 0.5 },
                    jumpForce: { type: 'number', min: -20, max: -5, default: -10 },
                    maxSpeed: { type: 'number', min: 1, max: 20, default: 8 },
                    friction: { type: 'number', min: 0.1, max: 1.0, default: 0.85 }
                },
                visual: {
                    size: {
                        width: { type: 'number', min: 10, max: 100, default: 30 },
                        height: { type: 'number', min: 10, max: 100, default: 30 }
                    },
                    color: { type: 'string', default: '#FFD700' }
                }
            }
        },
        physics: {
            gravity: {
                normal: { type: 'number', min: 0.1, max: 2.0, default: 0.5 },
                inverted: { type: 'number', min: -2.0, max: -0.1, default: -0.5 }
            },
            jump: {
                force: { type: 'number', min: -20, max: -5, default: -10 },
                doubleJumpForce: { type: 'number', min: -15, max: -3, default: -8 }
            }
        },
        ui: {
            theme: { type: 'string', enum: ['noir', 'classic', 'neon'], default: 'noir' },
            language: { type: 'string', enum: ['es', 'en'], default: 'es' },
            showFPS: { type: 'boolean', default: false }
        }
    };

    /**
     * Valida una configuración completa
     * @param {Object} config - Configuración a validar
     * @param {string} schemaName - Nombre del esquema a usar
     * @returns {Object} Configuración validada con valores por defecto aplicados
     */
    static validate(config, schemaName) {
        const schema = this.schemas[schemaName];
        if (!schema) {
            throw new Error(`Esquema de validación no encontrado: ${schemaName}`);
        }

        const validatedConfig = {};
        const errors = [];

        this._validateObject(config, schema, validatedConfig, errors, schemaName);

        if (errors.length > 0) {
            console.warn(`⚠️ Errores de validación en configuración ${schemaName}:`, errors);
        }

        return validatedConfig;
    }

    /**
     * Valida un objeto recursivamente
     * @private
     */
    static _validateObject(config, schema, result, errors, path) {
        for (const [key, schemaValue] of Object.entries(schema)) {
            const currentPath = `${path}.${key}`;
            const configValue = config?.[key];

            if (this._isValidationRule(schemaValue)) {
                // Es una regla de validación
                const validatedValue = this._validateValue(configValue, schemaValue, currentPath, errors);
                result[key] = validatedValue;
            } else {
                // Es un objeto anidado
                result[key] = {};
                this._validateObject(configValue, schemaValue, result[key], errors, currentPath);
            }
        }
    }

    /**
     * Determina si un valor es una regla de validación
     * @private
     */
    static _isValidationRule(value) {
        return value && typeof value === 'object' && ('type' in value || 'default' in value);
    }

    /**
     * Valida un valor individual
     * @private
     */
    static _validateValue(value, rule, path, errors) {
        // Si el valor no existe, usar el valor por defecto
        if (value === undefined || value === null) {
            if ('default' in rule) {
                return rule.default;
            } else {
                errors.push(`Valor requerido faltante en ${path}`);
                return null;
            }
        }

        // Validar tipo
        if (rule.type && typeof value !== rule.type) {
            errors.push(`Tipo incorrecto en ${path}: esperado ${rule.type}, recibido ${typeof value}`);
            return rule.default || null;
        }

        // Validar rango numérico
        if (rule.type === 'number') {
            if (rule.min !== undefined && value < rule.min) {
                errors.push(`Valor muy pequeño en ${path}: mínimo ${rule.min}, recibido ${value}`);
                return rule.min;
            }
            if (rule.max !== undefined && value > rule.max) {
                errors.push(`Valor muy grande en ${path}: máximo ${rule.max}, recibido ${value}`);
                return rule.max;
            }
        }

        // Validar enumeración
        if (rule.enum && !rule.enum.includes(value)) {
            errors.push(`Valor no válido en ${path}: debe ser uno de [${rule.enum.join(', ')}], recibido ${value}`);
            return rule.default || rule.enum[0];
        }

        return value;
    }

    /**
     * Valida configuraciones específicas del juego
     * @param {Object} gameConfig - Configuración del juego
     * @returns {Object} Configuración validada
     */
    static validateGameConfig(gameConfig) {
        return this.validate(gameConfig, 'game');
    }

    /**
     * Valida configuraciones de física
     * @param {Object} physicsConfig - Configuración de física
     * @returns {Object} Configuración validada
     */
    static validatePhysicsConfig(physicsConfig) {
        return this.validate(physicsConfig, 'physics');
    }

    /**
     * Valida configuraciones de UI
     * @param {Object} uiConfig - Configuración de UI
     * @returns {Object} Configuración validada
     */
    static validateUIConfig(uiConfig) {
        return this.validate(uiConfig, 'ui');
    }

    /**
     * Genera un reporte de validación detallado
     * @param {Object} config - Configuración a validar
     * @param {string} schemaName - Nombre del esquema
     * @returns {Object} Reporte de validación
     */
    static generateValidationReport(config, schemaName) {
        const errors = [];
        const warnings = [];
        const validatedConfig = {};

        try {
            const schema = this.schemas[schemaName];
            this._validateObject(config, schema, validatedConfig, errors, schemaName);

            return {
                isValid: errors.length === 0,
                errors,
                warnings,
                validatedConfig,
                summary: {
                    totalErrors: errors.length,
                    totalWarnings: warnings.length,
                    configurationName: schemaName
                }
            };
        } catch (error) {
            return {
                isValid: false,
                errors: [error.message],
                warnings: [],
                validatedConfig: null,
                summary: {
                    totalErrors: 1,
                    totalWarnings: 0,
                    configurationName: schemaName
                }
            };
        }
    }

    /**
     * Combina múltiples configuraciones con validación
     * @param {Object} configs - Objeto con múltiples configuraciones
     * @returns {Object} Configuraciones combinadas y validadas
     */
    static validateAllConfigs(configs) {
        const result = {
            game: null,
            physics: null,
            ui: null,
            errors: [],
            warnings: []
        };

        // Validar configuración del juego
        if (configs.game) {
            try {
                result.game = this.validateGameConfig(configs.game);
            } catch (error) {
                result.errors.push(`Error validando configuración del juego: ${error.message}`);
            }
        }

        // Validar configuración de física
        if (configs.physics) {
            try {
                result.physics = this.validatePhysicsConfig(configs.physics);
            } catch (error) {
                result.errors.push(`Error validando configuración de física: ${error.message}`);
            }
        }

        // Validar configuración de UI
        if (configs.ui) {
            try {
                result.ui = this.validateUIConfig(configs.ui);
            } catch (error) {
                result.errors.push(`Error validando configuración de UI: ${error.message}`);
            }
        }

        return result;
    }
}