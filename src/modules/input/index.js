/**
 * Sistema de input simplificado para Spikepulse
 * @module Input
 */

export function createInputSystem(config, eventBus) {
    console.log('🎮 Creando sistema de input simplificado...');
    
    const inputSystem = {
        isInitialized: false,
        
        async init() {
            console.log('🔧 Inicializando sistema de input...');
            
            // Configurar listeners básicos de teclado
            document.addEventListener('keydown', (event) => {
                switch (event.code) {
                    case 'Space':
                    case 'ArrowUp':
                    case 'KeyW':
                        event.preventDefault();
                        eventBus.emit('input:jump', { source: 'keyboard', key: event.code });
                        break;
                    case 'ShiftLeft':
                    case 'ShiftRight':
                    case 'KeyX':
                        event.preventDefault();
                        eventBus.emit('input:dash', { source: 'keyboard', key: event.code });
                        break;
                    case 'ControlLeft':
                    case 'ControlRight':
                    case 'KeyZ':
                        event.preventDefault();
                        eventBus.emit('input:gravity', { source: 'keyboard', key: event.code });
                        break;
                    case 'Escape':
                    case 'KeyP':
                        event.preventDefault();
                        eventBus.emit('input:pause', { source: 'keyboard', key: event.code });
                        break;
                }
            });
            
            this.isInitialized = true;
            console.log('✅ Sistema de input inicializado');
        },
        
        update(deltaTime) {
            // Input system es principalmente event-driven
        },
        
        getDebugInfo() {
            return {
                isInitialized: this.isInitialized,
                type: 'simplified'
            };
        },
        
        reset() {
            console.log('🔄 Reseteando sistema de input...');
        },
        
        destroy() {
            console.log('🧹 Destruyendo sistema de input...');
            this.isInitialized = false;
        }
    };
    
    console.log('✅ Sistema de input creado');
    return inputSystem;
}