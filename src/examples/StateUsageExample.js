/**
 * Ejemplo de uso del sistema de estado centralizada
 * @module StateUsageExample
 */

import { GameState } from '../core/GameState.js';
import { EventBus } from '../core/EventBus.js';
import { StateDebugger } from '../utils/StateDebugger.js';

/**
 * Ejemplo de cómo usar el sistema de estado centralizada
 */
export class StateUsageExample {
    constructor() {
        this.eventBus = new EventBus();
        this.gameState = new GameState(this.eventBus);
        this.debugger = new StateDebugger(this.gameState, this.eventBus);
        
        console.log('📚 Ejemplo de uso del estado inicializado');
    }
    
    /**
     * Inicializa el ejemplo
     */
    async init() {
        await this.gameState.init();
        this.debugger.enable();
        
        this.setupExamples();
        
        console.log('📚 Ejemplo listo para ejecutar');
    }
    
    /**
     * Configura los ejemplos
     */
    setupExamples() {
        // Ejemplo 1: Actualizar posición del jugador
        this.exampleUpdatePlayerPosition();
        
        // Ejemplo 2: Manejar estadísticas del juego
        this.exampleUpdateGameStats();
        
        // Ejemplo 3: Configurar watchers
        this.exampleSetupWatchers();
        
        // Ejemplo 4: Validación personalizada
        this.exampleCustomValidation();
        
        // Ejemplo 5: Persistencia
        this.examplePersistence();
    }
    
    /**
     * Ejemplo 1: Actualizar posición del jugador
     */
    exampleUpdatePlayerPosition() {
        console.log('\n📍 Ejemplo 1: Actualizar posición del jugador');
        
        // Obtener posición actual
        const currentPosition = this.gameState.get('player.position');
        console.log('Posición actual:', currentPosition);
        
        // Actualizar posición X
        this.gameState.set('player.position.x', 150);
        console.log('Nueva posición X:', this.gameState.get('player.position.x'));
        
        // Actualizar posición completa
        this.gameState.set('player.position', { x: 200, y: 250 });
        console.log('Posición actualizada:', this.gameState.get('player.position'));
        
        // Actualizar velocidad
        this.gameState.set('player.velocity', { x: 5, y: -2 });
        console.log('Velocidad:', this.gameState.get('player.velocity'));
    }
    
    /**
     * Ejemplo 2: Manejar estadísticas del juego
     */
    exampleUpdateGameStats() {
        console.log('\n📊 Ejemplo 2: Manejar estadísticas del juego');
        
        // Simular progreso del juego
        this.gameState.set('stats.distance', 1500);
        this.gameState.set('stats.score', 1500);
        this.gameState.set('stats.jumps', 25);
        this.gameState.set('stats.dashes', 8);
        this.gameState.set('stats.coins', 12);
        
        // Obtener estadísticas
        const stats = this.gameState.get('stats');
        console.log('Estadísticas actuales:', stats);
        
        // Simular nueva mejor puntuación
        if (stats.score > stats.bestScore) {
            this.gameState.set('stats.bestScore', stats.score);
            console.log('¡Nueva mejor puntuación!', stats.score);
        }
    }
    
    /**
     * Ejemplo 3: Configurar watchers
     */
    exampleSetupWatchers() {
        console.log('\n👁️ Ejemplo 3: Configurar watchers');
        
        // Watcher para cambios en la distancia
        this.debugger.addWatcher('stats.distance', (newValue, oldValue, path) => {
            console.log(`🏃 Distancia cambió: ${oldValue} → ${newValue}`);
            
            // Verificar hitos
            const milestones = [500, 1000, 2000, 5000];
            const oldMilestone = milestones.filter(m => oldValue >= m).length;
            const newMilestone = milestones.filter(m => newValue >= m).length;
            
            if (newMilestone > oldMilestone) {
                console.log(`🎉 ¡Hito alcanzado: ${milestones[newMilestone - 1]}m!`);
            }
        });
        
        // Watcher para cambios en la posición del jugador
        this.debugger.addWatcher('player.position', (newValue, oldValue, path) => {
            const distance = Math.sqrt(
                Math.pow(newValue.x - oldValue.x, 2) + 
                Math.pow(newValue.y - oldValue.y, 2)
            );
            
            if (distance > 50) {
                console.log(`🚀 Movimiento grande detectado: ${distance.toFixed(2)} píxeles`);
            }
        });
        
        // Watcher para cambios en configuración
        this.debugger.addWatcher('settings.volume', (newValue, oldValue, path) => {
            console.log(`🔊 Volumen cambió:`, newValue);
        });
    }
    
    /**
     * Ejemplo 4: Validación personalizada
     */
    exampleCustomValidation() {
        console.log('\n✅ Ejemplo 4: Validación personalizada');
        
        // Añadir validador personalizado para velocidad máxima
        this.gameState.addValidator('player.velocity', (newValue, oldValue) => {
            const maxSpeed = 15;
            const speed = Math.sqrt(newValue.x * newValue.x + newValue.y * newValue.y);
            
            if (speed > maxSpeed) {
                return {
                    valid: false,
                    error: `Velocidad demasiado alta: ${speed.toFixed(2)} > ${maxSpeed}`
                };
            }
            
            return { valid: true };
        });
        
        // Probar validación exitosa
        console.log('Probando velocidad válida...');
        const validUpdate = this.gameState.set('player.velocity', { x: 8, y: -6 });
        console.log('Actualización válida:', validUpdate);
        
        // Probar validación fallida
        console.log('Probando velocidad inválida...');
        const invalidUpdate = this.gameState.set('player.velocity', { x: 20, y: -15 });
        console.log('Actualización inválida:', invalidUpdate);
    }
    
    /**
     * Ejemplo 5: Persistencia
     */
    async examplePersistence() {
        console.log('\n💾 Ejemplo 5: Persistencia');
        
        // Configurar algunos datos
        this.gameState.set('stats.bestDistance', 2500);
        this.gameState.set('stats.bestScore', 2500);
        this.gameState.set('stats.totalPlayTime', 300000); // 5 minutos
        this.gameState.set('settings.volume.master', 0.8);
        
        // Guardar estado
        console.log('Guardando estado...');
        const saveResult = await this.gameState.saveState();
        console.log('Guardado exitoso:', saveResult);
        
        // Simular cambio temporal
        this.gameState.set('stats.bestDistance', 0);
        console.log('Distancia temporal:', this.gameState.get('stats.bestDistance'));
        
        // Cargar estado guardado
        console.log('Cargando estado...');
        const loadResult = await this.gameState.loadState();
        console.log('Carga exitosa:', loadResult);
        console.log('Distancia restaurada:', this.gameState.get('stats.bestDistance'));
        
        // Verificar si hay datos persistentes
        console.log('Tiene datos persistentes:', this.gameState.hasPersistentData());
    }
    
    /**
     * Ejecuta todos los ejemplos
     */
    async runAllExamples() {
        console.log('🚀 Ejecutando todos los ejemplos...\n');
        
        await this.init();
        
        // Esperar un poco entre ejemplos para ver los logs
        await this.delay(1000);
        
        // Mostrar análisis de rendimiento
        console.log('\n📈 Análisis de rendimiento:');
        console.log(this.debugger.analyzePerformance());
        
        // Mostrar métricas
        console.log('\n📊 Métricas del debugger:');
        console.log(this.debugger.getMetrics());
        
        // Validar integridad del estado
        console.log('\n🔍 Validación de integridad:');
        console.log(this.debugger.validateStateIntegrity());
        
        console.log('\n✅ Todos los ejemplos completados');
    }
    
    /**
     * Ejecuta ejemplos de eventos del juego
     */
    runGameEventExamples() {
        console.log('\n🎮 Ejemplos de eventos del juego');
        
        // Simular eventos del juego
        this.eventBus.emit('player:jumped', { position: { x: 200, y: 250 } });
        this.eventBus.emit('player:dashed', { position: { x: 220, y: 250 } });
        this.eventBus.emit('game:coin-collected', { value: 10 });
        this.eventBus.emit('game:distance-changed', { distance: 1800 });
        this.eventBus.emit('game:score-changed', { score: 1800 });
        
        // Mostrar estadísticas actualizadas
        console.log('Estadísticas después de eventos:', this.gameState.get('stats'));
    }
    
    /**
     * Demuestra el reseteo del estado
     */
    demonstrateStateReset() {
        console.log('\n🔄 Demostración de reseteo del estado');
        
        // Configurar algunos datos
        this.gameState.set('stats.distance', 3000);
        this.gameState.set('stats.jumps', 50);
        this.gameState.set('settings.volume.master', 0.9);
        
        console.log('Estado antes del reset:');
        console.log('- Distancia:', this.gameState.get('stats.distance'));
        console.log('- Saltos:', this.gameState.get('stats.jumps'));
        console.log('- Volumen:', this.gameState.get('settings.volume.master'));
        
        // Resetear manteniendo configuraciones
        this.gameState.resetState(true);
        
        console.log('Estado después del reset (manteniendo configuraciones):');
        console.log('- Distancia:', this.gameState.get('stats.distance'));
        console.log('- Saltos:', this.gameState.get('stats.jumps'));
        console.log('- Volumen:', this.gameState.get('settings.volume.master'));
    }
    
    /**
     * Utilidad para esperar
     * @param {number} ms - Milisegundos a esperar
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Limpia el ejemplo
     */
    cleanup() {
        this.debugger.disable();
        this.gameState.destroy();
        console.log('🧹 Ejemplo limpiado');
    }
}

// Función para ejecutar el ejemplo si se ejecuta directamente
if (typeof window !== 'undefined' && window.location.search.includes('example=state')) {
    const example = new StateUsageExample();
    
    // Ejecutar ejemplo completo
    example.runAllExamples().then(() => {
        // Ejecutar ejemplos adicionales
        example.runGameEventExamples();
        example.demonstrateStateReset();
        
        // Limpiar después de 10 segundos
        setTimeout(() => {
            example.cleanup();
        }, 10000);
    });
    
    // Hacer disponible globalmente para debugging
    window.stateExample = example;
}