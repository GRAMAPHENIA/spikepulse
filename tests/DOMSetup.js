/**
 * Setup del DOM para tests de Spikepulse
 * Proporciona un entorno DOM simulado para tests que requieren manipulación del DOM
 * @module DOMSetup
 */

/**
 * Mock simple del DOM para tests
 */
export class DOMSetup {
    static setup() {
        // Mock de document
        global.document = {
            body: {
                innerHTML: '',
                className: '',
                classList: {
                    add: function(...classes) {
                        classes.forEach(cls => {
                            if (!this.contains(cls)) {
                                this.value = (this.value || '').split(' ').filter(c => c).concat(cls).join(' ');
                            }
                        });
                    },
                    remove: function(...classes) {
                        classes.forEach(cls => {
                            this.value = (this.value || '').split(' ').filter(c => c && c !== cls).join(' ');
                        });
                    },
                    contains: function(cls) {
                        return (this.value || '').split(' ').includes(cls);
                    },
                    value: ''
                },
                setAttribute: function(name, value) {
                    this.attributes = this.attributes || {};
                    this.attributes[name] = value;
                },
                getAttribute: function(name) {
                    return this.attributes && this.attributes[name];
                },
                attributes: {}
            },
            
            documentElement: {
                style: {
                    setProperty: function(property, value) {
                        this.properties = this.properties || {};
                        this.properties[property] = value;
                    },
                    removeProperty: function(property) {
                        if (this.properties) {
                            delete this.properties[property];
                        }
                    },
                    properties: {}
                }
            },
            
            getElementById: function(id) {
                return {
                    id: id,
                    classList: {
                        add: function(...classes) {
                            this.value = (this.value || '').split(' ').filter(c => c).concat(classes).join(' ');
                        },
                        remove: function(...classes) {
                            classes.forEach(cls => {
                                this.value = (this.value || '').split(' ').filter(c => c && c !== cls).join(' ');
                            });
                        },
                        contains: function(cls) {
                            return (this.value || '').split(' ').includes(cls);
                        },
                        value: ''
                    }
                };
            },
            
            querySelectorAll: function(selector) {
                // Mock simple que devuelve elementos simulados
                const mockElements = [];
                
                if (selector === '.spikepulse-btn') {
                    mockElements.push({
                        classList: {
                            add: function(...classes) {
                                this.value = (this.value || '').split(' ').filter(c => c).concat(classes).join(' ');
                            },
                            contains: function(cls) {
                                return (this.value || '').split(' ').includes(cls);
                            },
                            value: ''
                        }
                    });
                }
                
                if (selector === '.spikepulse-screen') {
                    mockElements.push({
                        classList: {
                            add: function(...classes) {
                                this.value = (this.value || '').split(' ').filter(c => c).concat(classes).join(' ');
                            },
                            contains: function(cls) {
                                return (this.value || '').split(' ').includes(cls);
                            },
                            value: ''
                        }
                    });
                }
                
                // Agregar método forEach para compatibilidad
                mockElements.forEach = Array.prototype.forEach;
                
                return mockElements;
            },
            
            querySelector: function(selector) {
                const elements = this.querySelectorAll(selector);
                return elements.length > 0 ? elements[0] : null;
            },
            
            createElement: function(tagName) {
                return {
                    tagName: tagName.toUpperCase(),
                    setAttribute: function(name, value) {
                        this.attributes = this.attributes || {};
                        this.attributes[name] = value;
                    },
                    getAttribute: function(name) {
                        return this.attributes && this.attributes[name];
                    },
                    appendChild: function(child) {
                        this.children = this.children || [];
                        this.children.push(child);
                    },
                    textContent: '',
                    className: '',
                    attributes: {},
                    children: []
                };
            },
            
            addEventListener: function(event, handler) {
                this.eventListeners = this.eventListeners || {};
                this.eventListeners[event] = this.eventListeners[event] || [];
                this.eventListeners[event].push(handler);
            },
            
            removeEventListener: function(event, handler) {
                if (this.eventListeners && this.eventListeners[event]) {
                    const index = this.eventListeners[event].indexOf(handler);
                    if (index > -1) {
                        this.eventListeners[event].splice(index, 1);
                    }
                }
            }
        };
        
        // Mock de window
        global.window = {
            addEventListener: function(event, handler) {
                this.eventListeners = this.eventListeners || {};
                this.eventListeners[event] = this.eventListeners[event] || [];
                this.eventListeners[event].push(handler);
            },
            
            removeEventListener: function(event, handler) {
                if (this.eventListeners && this.eventListeners[event]) {
                    const index = this.eventListeners[event].indexOf(handler);
                    if (index > -1) {
                        this.eventListeners[event].splice(index, 1);
                    }
                }
            }
        };
        
        // Mock de console para evitar spam en tests
        const originalConsole = console;
        global.console = {
            ...originalConsole,
            log: function(...args) {
                // Silenciar logs durante tests, excepto errores importantes
                if (args[0] && args[0].includes('[ERROR]')) {
                    originalConsole.log(...args);
                }
            },
            warn: originalConsole.warn,
            error: originalConsole.error
        };
        
        console.log('🔧 DOM Setup completado para tests');
    }
    
    static cleanup() {
        // Limpiar mocks
        if (global.document) {
            global.document.body.innerHTML = '';
            global.document.body.className = '';
            global.document.body.classList.value = '';
            
            if (global.document.documentElement.style.properties) {
                global.document.documentElement.style.properties = {};
            }
        }
        
        console.log('🧹 DOM Cleanup completado');
    }
    
    static reset() {
        this.cleanup();
        this.setup();
    }
}

// Auto-setup cuando se importa el módulo
DOMSetup.setup();