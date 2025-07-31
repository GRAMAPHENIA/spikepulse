/**
 * Textos en español para Spikepulse
 * @module SpanishText
 */

export const SPANISH_TEXT = {
    // Título y branding
    GAME_TITLE: 'Spikepulse',
    GAME_SUBTITLE: 'Domina la Gravedad',
    GAME_DESCRIPTION: '¡Domina la gravedad y evita los obstáculos!',
    
    // Botones principales
    START_GAME: 'Comenzar Aventura',
    RESTART_GAME: 'Reintentar Misión',
    PAUSE_GAME: 'Pausa',
    RESUME_GAME: 'Reanudar',
    CONTINUE: 'Continuar',
    BACK: 'Volver',
    
    // Estados del juego
    LOADING: 'Cargando...',
    READY: 'Listo',
    PLAYING: 'Jugando',
    PAUSED: 'Pausado',
    GAME_OVER: '¡Perdiste!',
    
    // Estadísticas del HUD
    DISTANCE: 'Distancia',
    SCORE: 'Puntuación',
    JUMPS: 'Saltos',
    DASH: 'Dash',
    GRAVITY: 'Gravedad',
    VELOCITY: 'Velocidad',
    TIME: 'Tiempo',
    
    // Controles
    JUMP: 'Saltar',
    DASH_ACTION: 'Dash',
    MOVE_LEFT: 'Mover Izquierda',
    MOVE_RIGHT: 'Mover Derecha',
    TOGGLE_GRAVITY: 'Cambiar Gravedad',
    
    // Instrucciones de controles
    JUMP_INSTRUCTION: 'Presiona ESPACIO o toca para saltar',
    DASH_INSTRUCTION: 'Presiona SHIFT para hacer dash',
    GRAVITY_INSTRUCTION: 'Presiona CTRL para cambiar gravedad',
    MOVE_INSTRUCTION: 'Usa las flechas o A/D para moverte',
    MOBILE_TAP_INSTRUCTION: 'Toca la pantalla para saltar',
    
    // Controles detallados
    CONTROLS_TITLE: 'Controles',
    KEYBOARD_CONTROLS: 'Controles de Teclado',
    MOUSE_CONTROLS: 'Controles de Ratón',
    TOUCH_CONTROLS: 'Controles Táctiles',
    
    // Mensajes del juego
    WELCOME_MESSAGE: '¡Domina la gravedad y evita los obstáculos!',
    GAME_OVER_MESSAGE: '¡Inténtalo de nuevo!',
    NEW_RECORD: '¡Nuevo récord!',
    LEVEL_COMPLETE: '¡Nivel completado!',
    MISSION_FAILED: '¡Misión fallida!',
    
    // Estados de habilidades
    DASH_AVAILABLE: '✓',
    DASH_COOLDOWN: 's',
    JUMPS_REMAINING: 'Saltos restantes',
    GRAVITY_NORMAL: '↓',
    GRAVITY_INVERTED: '↑',
    
    // Unidades
    METERS: 'm',
    SECONDS: 's',
    POINTS: 'pts',
    KILOMETERS: 'km',
    
    // Mensajes de estado
    LOADING_GAME: 'Cargando juego...',
    INITIALIZING: 'Inicializando...',
    READY_TO_PLAY: 'Listo para jugar',
    CONNECTING: 'Conectando...',
    
    // Errores
    CANVAS_NOT_SUPPORTED: 'Tu navegador no soporta canvas. Por favor actualiza tu navegador.',
    LOADING_ERROR: 'Error al cargar el juego. Por favor recarga la página.',
    SAVE_ERROR: 'No se pudo guardar el progreso.',
    NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet.',
    UNKNOWN_ERROR: 'Ha ocurrido un error desconocido.',
    
    // Errores específicos del sistema
    ERROR_CANVAS: 'Error en el canvas del juego. Intentando recuperar...',
    ERROR_MODULE: 'Error en un componente del juego. Intentando recuperar...',
    ERROR_ENGINE: 'Error en el motor del juego. Intentando recuperar...',
    ERROR_JAVASCRIPT: 'Error inesperado. El juego intentará continuar...',
    ERROR_MEMORY: 'Problema de memoria detectado. Liberando recursos...',
    ERROR_RESOURCE: 'Error cargando recursos del juego.',
    ERROR_PHYSICS: 'Error en el sistema de física del juego.',
    ERROR_INPUT: 'Error en el sistema de controles.',
    ERROR_RENDERER: 'Error en el sistema de renderizado.',
    ERROR_RECOVERY: 'Error durante la recuperación del sistema.',
    
    // Accesibilidad
    CANVAS_ALT: 'Canvas del juego Spikepulse',
    GAME_AREA_LABEL: 'Área de juego principal',
    STATS_AREA_LABEL: 'Estadísticas del juego',
    CONTROLS_AREA_LABEL: 'Controles del juego',
    MENU_AREA_LABEL: 'Menú principal',
    HUD_AREA_LABEL: 'Información del juego',
    
    // Anuncios para lectores de pantalla
    GAME_STARTED: 'Juego iniciado',
    PLAYER_JUMPED: 'Jugador saltó',
    DASH_USED: 'Dash utilizado',
    GRAVITY_CHANGED: 'Gravedad cambiada',
    OBSTACLE_HIT: 'Obstáculo golpeado',
    GAME_PAUSED: 'Juego pausado',
    GAME_RESUMED: 'Juego reanudado',
    
    // Configuración y opciones
    SETTINGS: 'Configuración',
    AUDIO: 'Audio',
    GRAPHICS: 'Gráficos',
    CONTROLS: 'Controles',
    ACCESSIBILITY: 'Accesibilidad',
    LANGUAGE: 'Idioma',
    
    // Valores de configuración
    ENABLED: 'Activado',
    DISABLED: 'Desactivado',
    HIGH: 'Alto',
    MEDIUM: 'Medio',
    LOW: 'Bajo',
    ON: 'Encendido',
    OFF: 'Apagado',
    
    // Logros y progreso
    ACHIEVEMENTS: 'Logros',
    PROGRESS: 'Progreso',
    STATISTICS: 'Estadísticas',
    BEST_DISTANCE: 'Mejor Distancia',
    TOTAL_JUMPS: 'Saltos Totales',
    TOTAL_DASHES: 'Dashes Totales',
    PLAY_TIME: 'Tiempo de Juego',
    
    // Tutoriales
    TUTORIAL: 'Tutorial',
    SKIP_TUTORIAL: 'Saltar Tutorial',
    NEXT_TIP: 'Siguiente Consejo',
    PREVIOUS_TIP: 'Consejo Anterior',
    GOT_IT: 'Entendido',
    
    // Consejos de juego
    TIP_JUMP: 'Usa el salto doble para alcanzar plataformas altas',
    TIP_DASH: 'El dash te permite atravesar obstáculos rápidamente',
    TIP_GRAVITY: 'Cambia la gravedad para navegar por espacios complejos',
    TIP_TIMING: 'El timing es clave para superar los obstáculos',
    TIP_PRACTICE: 'Practica los controles para mejorar tu técnica',
    
    // Confirmaciones
    CONFIRM: 'Confirmar',
    CANCEL: 'Cancelar',
    YES: 'Sí',
    NO: 'No',
    OK: 'Aceptar',
    
    // Tiempo y fechas
    TODAY: 'Hoy',
    YESTERDAY: 'Ayer',
    THIS_WEEK: 'Esta semana',
    THIS_MONTH: 'Este mes',
    
    // Navegación
    HOME: 'Inicio',
    MENU: 'Menú',
    EXIT: 'Salir',
    CLOSE: 'Cerrar',
    MINIMIZE: 'Minimizar',
    MAXIMIZE: 'Maximizar',
    
    // Información del juego
    VERSION: 'Versión',
    CREDITS: 'Créditos',
    ABOUT: 'Acerca de',
    HELP: 'Ayuda',
    SUPPORT: 'Soporte',
    
    // Mensajes de conexión
    ONLINE: 'En línea',
    OFFLINE: 'Sin conexión',
    RECONNECTING: 'Reconectando...',
    CONNECTION_LOST: 'Conexión perdida',
    CONNECTION_RESTORED: 'Conexión restaurada'
};

/**
 * Obtener texto formateado con parámetros
 * @param {string} key - Clave del texto
 * @param {Object} params - Parámetros para formatear
 * @returns {string} Texto formateado
 */
export function getText(key, params = {}) {
    let text = SPANISH_TEXT[key] || key;
    
    // Reemplazar parámetros en el texto
    Object.keys(params).forEach(param => {
        const placeholder = `{${param}}`;
        text = text.replace(new RegExp(placeholder, 'g'), params[param]);
    });
    
    return text;
}

/**
 * Formatear números según convenciones españolas
 * @param {number} number - Número a formatear
 * @param {number} decimals - Número de decimales
 * @returns {string} Número formateado
 */
export function formatNumber(number, decimals = 0) {
    return number.toLocaleString('es-ES', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Formatear distancia con unidades españolas
 * @param {number} distance - Distancia en metros
 * @returns {string} Distancia formateada
 */
export function formatDistance(distance) {
    if (distance >= 1000) {
        return `${formatNumber(distance / 1000, 1)}${SPANISH_TEXT.KILOMETERS}`;
    }
    return `${formatNumber(distance, 0)}${SPANISH_TEXT.METERS}`;
}

/**
 * Formatear tiempo con unidades españolas
 * @param {number} seconds - Tiempo en segundos
 * @returns {string} Tiempo formateado
 */
export function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
        return `${minutes}min ${formatNumber(remainingSeconds, 0)}${SPANISH_TEXT.SECONDS}`;
    }
    return `${formatNumber(seconds, 1)}${SPANISH_TEXT.SECONDS}`;
}

/**
 * Formatear puntuación
 * @param {number} score - Puntuación
 * @returns {string} Puntuación formateada
 */
export function formatScore(score) {
    return `${formatNumber(score)} ${SPANISH_TEXT.POINTS}`;
}