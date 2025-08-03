/**
 * NoirPalette - Paleta de colores noir monocromática para Spikepulse
 * Gestiona la escala de grises, transparencias y efectos cinematográficos
 * @module NoirPalette
 */

/**
 * Paleta de colores noir con efectos cinematográficos
 */
export class NoirPalette {
    /**
     * Crea una nueva instancia de NoirPalette
     */
    constructor() {
        this.isInitialized = false;
        
        // Paleta base noir
        this.palette = this.createNoirPalette();
        
        // Cache de colores calculados
        this.colorCache = new Map();
        
        this.init();
    }
    
    /**
     * Inicializar la paleta
     * @private
     */
    init() {
        console.log('[NoirPalette] Inicializando paleta noir...');
        
        // Validar paleta
        this.validatePalette();
        
        // Pre-calcular colores comunes
        this.precalculateColors();
        
        this.isInitialized = true;
        
        console.log('[NoirPalette] Paleta noir inicializada correctamente');
    }
    
    /**
     * Crear la paleta noir completa
     * @returns {Object} Paleta noir
     * @private
     */
    createNoirPalette() {
        return {
            // Escala de grises principal
            base: {
                black: '#000000',
                darkGray: '#1a1a1a',
                warmGray: '#2a2a2a',
                coolGray: '#1e1e2e',
                mediumGray: '#404040',
                lightGray: '#808080',
                white: '#ffffff',
                charcoal: '#0f0f0f'
            },
            
            // Transparencias noir para efectos dramáticos
            transparencies: {
                shadowLight: 'rgba(0, 0, 0, 0.3)',
                shadowMedium: 'rgba(0, 0, 0, 0.6)',
                shadowHeavy: 'rgba(0, 0, 0, 0.9)',
                overlayLight: 'rgba(0, 0, 0, 0.2)',
                overlayMedium: 'rgba(0, 0, 0, 0.5)',
                overlayHeavy: 'rgba(0, 0, 0, 0.8)',
                fogLight: 'rgba(255, 255, 255, 0.05)',
                fogMedium: 'rgba(255, 255, 255, 0.1)',
                fogHeavy: 'rgba(255, 255, 255, 0.15)',
                glassBackground: 'rgba(255, 255, 255, 0.03)',
                glassBorder: 'rgba(255, 255, 255, 0.1)',
                glassHighlight: 'rgba(255, 255, 255, 0.15)',
                hoverOverlay: 'rgba(255, 255, 255, 0.1)',
                activeOverlay: 'rgba(255, 255, 255, 0.2)'
            },
            
            // Highlights dramáticos para efectos cinematográficos
            highlights: {
                subtle: 'rgba(255, 255, 255, 0.1)',
                moderate: 'rgba(255, 255, 255, 0.2)',
                dramatic: 'rgba(255, 255, 255, 0.3)',
                intense: 'rgba(255, 255, 255, 0.4)',
                rim: 'rgba(255, 255, 255, 0.6)',
                key: 'rgba(255, 255, 255, 0.8)'
            },
            
            // Gradientes noir cinematográficos
            gradients: {
                // Gradientes de sombra
                shadowVertical: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)',
                shadowHorizontal: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
                shadowRadial: 'radial-gradient(circle, rgba(0,0,0,0) 30%, rgba(0,0,0,0.8) 100%)',
                
                // Gradientes de luz
                lightVertical: 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
                lightHorizontal: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 100%)',
                lightRadial: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)',
                
                // Gradientes dramáticos
                primary: 'linear-gradient(45deg, #000000 0%, #404040 50%, #000000 100%)',
                secondary: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
                accent: 'linear-gradient(90deg, #404040 0%, #808080 50%, #404040 100%)',
                dark: 'linear-gradient(180deg, #000000 0%, #1a1a1a 100%)',
                background: 'linear-gradient(135deg, #000000 0%, #0f0f0f 50%, #000000 100%)',
                dramaticContrast: 'linear-gradient(45deg, #000000 0%, #404040 50%, #000000 100%)',
                cinematicVignette: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.8) 100%)',
                filmNoir: 'linear-gradient(135deg, #1a1a1a 0%, #000000 30%, #2a2a2a 70%, #000000 100%)'
            },
            
            // Efectos especiales noir
            effects: {
                // Sombras cinematográficas
                lightShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                mediumShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
                dramaticShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
                
                // Efectos de contraste
                highContrast: 'contrast(150%) brightness(90%)',
                dramaticContrast: 'contrast(200%) brightness(80%)',
                
                // Efectos de iluminación
                rimLight: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))',
                keyLight: 'drop-shadow(2px 2px 8px rgba(255, 255, 255, 0.2))',
                
                // Efectos de textura
                filmGrain: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'1\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.05\'/%3E%3C/svg%3E")'
            },
            
            // Slots de color preparados para evolución futura
            colorSlots: {
                slot1: '#404040', // Se convertirá en dorado (#FFD700)
                slot2: '#606060', // Se convertirá en rojo (#FF6B6B)
                slot3: '#505050', // Se convertirá en púrpura (#9F7AEA)
                slot4: '#454545', // Reservado para futuro uso
                slot5: '#555555'  // Reservado para futuro uso
            },
            
            // Matices especiales para diferentes contextos
            contextual: {
                // Colores para elementos de juego
                player: '#808080',      // Gris medio para el jugador
                obstacle: '#1a1a1a',    // Gris muy oscuro para obstáculos
                ground: '#2a2a2a',      // Gris cálido para el suelo
                background: '#000000',   // Negro puro para el fondo
                
                // Colores para UI
                uiPrimary: '#ffffff',    // Blanco para elementos principales
                uiSecondary: '#808080',  // Gris medio para elementos secundarios
                uiTertiary: '#404040',   // Gris oscuro para elementos terciarios
                uiMuted: '#2a2a2a',      // Gris muy oscuro para elementos apagados
                
                // Colores para estados
                success: '#808080',      // Gris medio para éxito
                warning: '#606060',      // Gris medio-oscuro para advertencia
                error: '#404040',        // Gris oscuro para error
                info: '#505050'          // Gris medio-oscuro para información
            }
        };
    }
    
    /**
     * Validar la paleta noir
     * @private
     */
    validatePalette() {
        const requiredSections = ['base', 'transparencies', 'highlights', 'gradients', 'effects', 'colorSlots', 'contextual'];
        
        for (const section of requiredSections) {
            if (!this.palette[section]) {
                throw new Error(`[NoirPalette] Sección requerida faltante: ${section}`);
            }
        }
        
        // Validar que los colores base sean válidos
        const baseColors = this.palette.base;
        for (const [key, color] of Object.entries(baseColors)) {
            if (!this.isValidColor(color)) {
                throw new Error(`[NoirPalette] Color base inválido: ${key} = ${color}`);
            }
        }
        
        console.log('[NoirPalette] Paleta validada correctamente');
    }
    
    /**
     * Validar si un color es válido
     * @param {string} color - Color a validar
     * @returns {boolean} True si es válido
     * @private
     */
    isValidColor(color) {
        // Validar formato hexadecimal
        if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
            return true;
        }
        
        // Validar formato rgba
        if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(color)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Pre-calcular colores comunes para optimización
     * @private
     */
    precalculateColors() {
        const commonColors = [
            'black', 'white', 'darkGray', 'mediumGray', 'lightGray',
            'shadowLight', 'shadowMedium', 'shadowHeavy',
            'subtle', 'dramatic', 'intense'
        ];
        
        commonColors.forEach(colorKey => {
            const color = this.getColorFromPalette(colorKey);
            if (color) {
                this.colorCache.set(colorKey, color);
            }
        });
        
        console.log(`[NoirPalette] ${this.colorCache.size} colores pre-calculados`);
    }
    
    /**
     * Obtener color de la paleta
     * @param {string} colorKey - Clave del color
     * @returns {string|null} Color o null si no existe
     * @private
     */
    getColorFromPalette(colorKey) {
        // Buscar en cache primero
        if (this.colorCache.has(colorKey)) {
            return this.colorCache.get(colorKey);
        }
        
        // Buscar en diferentes secciones de la paleta
        const sections = ['base', 'transparencies', 'highlights', 'colorSlots', 'contextual'];
        
        for (const section of sections) {
            if (this.palette[section] && this.palette[section][colorKey]) {
                const color = this.palette[section][colorKey];
                this.colorCache.set(colorKey, color);
                return color;
            }
        }
        
        return null;
    }
    
    /**
     * Obtener la paleta completa
     * @returns {Object} Paleta noir completa
     * @public
     */
    getPalette() {
        return { ...this.palette };
    }
    
    /**
     * Obtener color específico
     * @param {string} colorKey - Clave del color
     * @returns {string} Color o fallback
     * @public
     */
    getColor(colorKey) {
        const color = this.getColorFromPalette(colorKey);
        
        if (!color) {
            console.warn(`[NoirPalette] Color no encontrado: ${colorKey}, usando fallback`);
            return this.palette.base.mediumGray;
        }
        
        return color;
    }
    
    /**
     * Obtener gradiente específico
     * @param {string} gradientKey - Clave del gradiente
     * @returns {string} Gradiente o fallback
     * @public
     */
    getGradient(gradientKey) {
        if (this.palette.gradients[gradientKey]) {
            return this.palette.gradients[gradientKey];
        }
        
        console.warn(`[NoirPalette] Gradiente no encontrado: ${gradientKey}, usando fallback`);
        return this.palette.gradients.dramaticContrast;
    }
    
    /**
     * Obtener efecto específico
     * @param {string} effectKey - Clave del efecto
     * @returns {string} Efecto o fallback
     * @public
     */
    getEffect(effectKey) {
        if (this.palette.effects[effectKey]) {
            return this.palette.effects[effectKey];
        }
        
        console.warn(`[NoirPalette] Efecto no encontrado: ${effectKey}, usando fallback`);
        return this.palette.effects.mediumShadow;
    }
    
    /**
     * Generar variación de color noir
     * @param {string} baseColor - Color base
     * @param {number} variation - Variación (-100 a 100)
     * @returns {string} Color variado
     * @public
     */
    generateColorVariation(baseColor, variation = 0) {
        // Convertir hex a RGB
        const rgb = this.hexToRgb(baseColor);
        if (!rgb) {
            return baseColor;
        }
        
        // Aplicar variación manteniendo escala de grises
        const factor = 1 + (variation / 100);
        const newR = Math.max(0, Math.min(255, Math.round(rgb.r * factor)));
        const newG = Math.max(0, Math.min(255, Math.round(rgb.g * factor)));
        const newB = Math.max(0, Math.min(255, Math.round(rgb.b * factor)));
        
        // Convertir de vuelta a hex
        return this.rgbToHex(newR, newG, newB);
    }
    
    /**
     * Convertir hex a RGB
     * @param {string} hex - Color hexadecimal
     * @returns {Object|null} Objeto RGB o null
     * @private
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    /**
     * Convertir RGB a hex
     * @param {number} r - Rojo
     * @param {number} g - Verde
     * @param {number} b - Azul
     * @returns {string} Color hexadecimal
     * @private
     */
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    /**
     * Crear paleta de contraste alto para accesibilidad
     * @returns {Object} Paleta de alto contraste
     * @public
     */
    getHighContrastPalette() {
        return {
            ...this.palette,
            base: {
                black: '#000000',
                darkGray: '#000000',
                warmGray: '#000000',
                coolGray: '#000000',
                mediumGray: '#808080',
                lightGray: '#ffffff',
                white: '#ffffff'
            },
            contextual: {
                ...this.palette.contextual,
                player: '#ffffff',
                obstacle: '#000000',
                uiPrimary: '#ffffff',
                uiSecondary: '#ffffff'
            }
        };
    }
    
    /**
     * Obtener estadísticas de la paleta
     * @returns {Object} Estadísticas
     * @public
     */
    getStats() {
        const stats = {
            isInitialized: this.isInitialized,
            totalColors: 0,
            cacheSize: this.colorCache.size,
            sections: {}
        };
        
        // Contar colores por sección
        Object.entries(this.palette).forEach(([section, colors]) => {
            const colorCount = Object.keys(colors).length;
            stats.sections[section] = colorCount;
            stats.totalColors += colorCount;
        });
        
        return stats;
    }
    
    /**
     * Limpiar recursos
     * @public
     */
    destroy() {
        console.log('[NoirPalette] Destruyendo paleta...');
        
        // Limpiar cache
        this.colorCache.clear();
        
        this.isInitialized = false;
        
        console.log('[NoirPalette] Paleta destruida');
    }
}