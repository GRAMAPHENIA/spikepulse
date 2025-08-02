# 🎮 Spikepulse - Noir Edition

Un juego de plataformas minimalista con estética noir, inspirado en Geometry Dash.

## 🎯 Características

- **Estética Noir Minimalista**: Paleta monocromática con tipografía monoespaciada
- **Controles Intuitivos**: Salto, dash, movimiento y gravedad invertida
- **Física Realista**: Sistema de gravedad, colisiones y salto doble
- **Responsive**: Funciona en desktop y móvil
- **Sin Dependencias**: Juego completo en un solo archivo HTML

## 🎮 Controles

| Acción | Controles |
|--------|-----------|
| **Saltar** | `Espacio` / `Click` |
| **Mover** | `A` `D` / `←` `→` |
| **Dash** | `Shift` |
| **Cambiar Gravedad** | `Ctrl` |
| **Pausa** | `Escape` |
| **Pantalla Completa** | `F11` / Botón `⛶` |

## 🚀 Cómo Jugar

1. **Abre `index.html`** en tu navegador
2. **Presiona "COMENZAR"** para iniciar
3. **Evita los obstáculos** grises
4. **Usa todas las habilidades** para llegar lo más lejos posible

## 🎨 Estética Noir

- **Colores**: Negro, blanco y grises
- **Tipografía**: Courier New (monoespaciada)
- **Elementos**: Grid sutil, formas geométricas simples
- **Efectos**: Transiciones suaves, sin elementos complejos

## 📁 Estructura del Proyecto

```
spike-pulse/
├── index.html              # Juego principal (todo incluido)
├── package.json            # Configuración del proyecto
├── README.md              # Este archivo
└── original-gameengine/   # Código original (respaldo)
    ├── src/               # Módulos del GameEngine original
    └── tests/             # Tests del sistema original
```

## 🔧 Desarrollo

El juego actual está completamente contenido en `index.html` y no requiere dependencias externas.

### **Para Modificar:**
- **Estética**: Edita las variables CSS en `<style>`
- **Mecánicas**: Modifica las funciones JavaScript
- **Niveles**: Ajusta la función `createObstacle()`

### **GameEngine Original:**
El código del GameEngine modular original está en `original-gameengine/` como respaldo.

## 🎯 Características del Juego

- **Jugador**: Cubo blanco controlable
- **Obstáculos**: Rectángulos grises dinámicos
- **Física**: Gravedad, salto doble, dash
- **HUD**: Distancia, saltos restantes, estado de habilidades
- **Persistencia**: Récords guardados en localStorage

## 🌟 Próximas Mejoras

- [ ] Más tipos de obstáculos
- [ ] Efectos de partículas
- [ ] Música y sonidos
- [ ] Niveles prediseñados
- [ ] Multijugador local

---

**¡Disfruta jugando Spikepulse!** 🎮✨