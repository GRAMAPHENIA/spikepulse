/**
 * ObjectPool - Sistema de pooling de objetos para optimización de memoria
 * @module ObjectPool
 */

export class ObjectPool {
    /**
     * Crea una nueva instancia de ObjectPool
     * @param {Function} createFn - Función para crear nuevos objetos
     * @param {Function} resetFn - Función para resetear objetos antes de reutilizar
     * @param {number} initialSize - Tamaño inicial del pool
     */
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.available = [];
        this.inUse = [];
        this.totalCreated = 0;
        this.totalAcquired = 0;
        this.totalReleased = 0;
        
        // Pre-llenar el pool con objetos iniciales
        for (let i = 0; i < initialSize; i++) {
            const obj = this.createFn();
            this.available.push(obj);
            this.totalCreated++;
        }
        
        console.log(`[ObjectPool] Pool creado con ${initialSize} objetos iniciales`);
    }

    /**
     * Obtener un objeto del pool
     * @returns {Object} Objeto del pool
     */
    acquire() {
        let obj = this.available.pop();
        
        if (!obj) {
            // No hay objetos disponibles, crear uno nuevo
            obj = this.createFn();
            this.totalCreated++;
        }
        
        this.inUse.push(obj);
        this.totalAcquired++;
        
        return obj;
    }

    /**
     * Devolver un objeto al pool
     * @param {Object} obj - Objeto a devolver
     */
    release(obj) {
        const index = this.inUse.indexOf(obj);
        
        if (index === -1) {
            console.warn('[ObjectPool] Intentando liberar un objeto que no está en uso');
            return;
        }
        
        // Remover de la lista de objetos en uso
        this.inUse.splice(index, 1);
        
        // Resetear el objeto antes de devolverlo al pool
        this.resetFn(obj);
        
        // Agregar a la lista de objetos disponibles
        this.available.push(obj);
        this.totalReleased++;
    }

    /**
     * Obtener estadísticas del pool
     * @returns {Object} Estadísticas del pool
     */
    getStats() {
        return {
            available: this.available.length,
            inUse: this.inUse.length,
            totalCreated: this.totalCreated,
            totalAcquired: this.totalAcquired,
            totalReleased: this.totalReleased,
            efficiency: this.totalAcquired > 0 ? (this.totalReleased / this.totalAcquired) : 0
        };
    }

    /**
     * Limpiar el pool liberando todos los objetos
     */
    clear() {
        this.available = [];
        this.inUse = [];
        
        console.log(`[ObjectPool] Pool limpiado. Objetos creados: ${this.totalCreated}`);
    }

    /**
     * Redimensionar el pool
     * @param {number} newSize - Nuevo tamaño del pool
     */
    resize(newSize) {
        const currentSize = this.available.length;
        
        if (newSize > currentSize) {
            // Agregar más objetos al pool
            const objectsToAdd = newSize - currentSize;
            for (let i = 0; i < objectsToAdd; i++) {
                const obj = this.createFn();
                this.available.push(obj);
                this.totalCreated++;
            }
        } else if (newSize < currentSize) {
            // Remover objetos del pool
            const objectsToRemove = currentSize - newSize;
            this.available.splice(0, objectsToRemove);
        }
        
        console.log(`[ObjectPool] Pool redimensionado a ${newSize} objetos`);
    }

    /**
     * Verificar la salud del pool
     * @returns {Object} Información de salud del pool
     */
    getHealthInfo() {
        const stats = this.getStats();
        const totalObjects = stats.available + stats.inUse;
        
        return {
            isHealthy: stats.available > 0 || stats.inUse < this.totalCreated,
            utilizationRate: totalObjects > 0 ? (stats.inUse / totalObjects) : 0,
            memoryEfficiency: stats.efficiency,
            recommendedAction: this.getRecommendedAction(stats)
        };
    }

    /**
     * Obtener acción recomendada basada en las estadísticas
     * @param {Object} stats - Estadísticas del pool
     * @returns {string} Acción recomendada
     * @private
     */
    getRecommendedAction(stats) {
        const utilizationRate = stats.inUse / (stats.available + stats.inUse);
        
        if (utilizationRate > 0.9) {
            return 'expand'; // Pool muy utilizado, considerar expandir
        } else if (utilizationRate < 0.1 && stats.available > 10) {
            return 'shrink'; // Pool poco utilizado, considerar reducir
        } else {
            return 'maintain'; // Pool en buen estado
        }
    }
}