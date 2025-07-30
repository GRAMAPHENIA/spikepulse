/**
 * CollisionDetection - Utilidades para detección de colisiones
 * @module CollisionDetection
 */

export class CollisionDetection {
    /**
     * Verificar colisión entre dos rectángulos (AABB)
     * @param {Object} rect1 - Primer rectángulo {x, y, width, height}
     * @param {Object} rect2 - Segundo rectángulo {x, y, width, height}
     * @returns {boolean} True si hay colisión
     */
    static checkAABB(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    /**
     * Verificar colisión entre un punto y un rectángulo
     * @param {Object} point - Punto {x, y}
     * @param {Object} rect - Rectángulo {x, y, width, height}
     * @returns {boolean} True si el punto está dentro del rectángulo
     */
    static pointInRect(point, rect) {
        return point.x >= rect.x &&
               point.x <= rect.x + rect.width &&
               point.y >= rect.y &&
               point.y <= rect.y + rect.height;
    }

    /**
     * Verificar colisión entre dos círculos
     * @param {Object} circle1 - Primer círculo {x, y, radius}
     * @param {Object} circle2 - Segundo círculo {x, y, radius}
     * @returns {boolean} True si hay colisión
     */
    static checkCircles(circle1, circle2) {
        const dx = circle1.x - circle2.x;
        const dy = circle1.y - circle2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (circle1.radius + circle2.radius);
    }

    /**
     * Verificar colisión entre un círculo y un rectángulo
     * @param {Object} circle - Círculo {x, y, radius}
     * @param {Object} rect - Rectángulo {x, y, width, height}
     * @returns {boolean} True si hay colisión
     */
    static checkCircleRect(circle, rect) {
        // Encontrar el punto más cercano del rectángulo al centro del círculo
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

        // Calcular distancia entre el centro del círculo y el punto más cercano
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < circle.radius;
    }

    /**
     * Obtener información detallada de colisión AABB
     * @param {Object} rect1 - Primer rectángulo
     * @param {Object} rect2 - Segundo rectángulo
     * @returns {Object|null} Información de colisión o null si no hay colisión
     */
    static getAABBCollisionInfo(rect1, rect2) {
        if (!this.checkAABB(rect1, rect2)) {
            return null;
        }

        // Calcular solapamiento
        const overlapX = Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - 
                        Math.max(rect1.x, rect2.x);
        const overlapY = Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - 
                        Math.max(rect1.y, rect2.y);

        // Determinar dirección de colisión
        let direction = 'none';
        if (overlapX < overlapY) {
            direction = rect1.x < rect2.x ? 'right' : 'left';
        } else {
            direction = rect1.y < rect2.y ? 'bottom' : 'top';
        }

        return {
            overlap: { x: overlapX, y: overlapY },
            direction: direction,
            penetration: Math.min(overlapX, overlapY)
        };
    }

    /**
     * Resolver colisión AABB moviendo el primer rectángulo
     * @param {Object} rect1 - Rectángulo a mover
     * @param {Object} rect2 - Rectángulo estático
     * @returns {Object} Nueva posición para rect1
     */
    static resolveAABBCollision(rect1, rect2) {
        const collisionInfo = this.getAABBCollisionInfo(rect1, rect2);
        if (!collisionInfo) {
            return { x: rect1.x, y: rect1.y };
        }

        const newPos = { x: rect1.x, y: rect1.y };

        switch (collisionInfo.direction) {
            case 'left':
                newPos.x = rect2.x - rect1.width;
                break;
            case 'right':
                newPos.x = rect2.x + rect2.width;
                break;
            case 'top':
                newPos.y = rect2.y - rect1.height;
                break;
            case 'bottom':
                newPos.y = rect2.y + rect2.height;
                break;
        }

        return newPos;
    }

    /**
     * Verificar si un rectángulo está completamente dentro de otro
     * @param {Object} inner - Rectángulo interior
     * @param {Object} outer - Rectángulo exterior
     * @returns {boolean} True si inner está completamente dentro de outer
     */
    static isRectInside(inner, outer) {
        return inner.x >= outer.x &&
               inner.y >= outer.y &&
               inner.x + inner.width <= outer.x + outer.width &&
               inner.y + inner.height <= outer.y + outer.height;
    }

    /**
     * Obtener distancia entre dos puntos
     * @param {Object} point1 - Primer punto {x, y}
     * @param {Object} point2 - Segundo punto {x, y}
     * @returns {number} Distancia entre los puntos
     */
    static getDistance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Verificar colisión con límites del mundo
     * @param {Object} rect - Rectángulo a verificar
     * @param {Object} bounds - Límites del mundo {width, height}
     * @returns {Object} Información de colisión con límites
     */
    static checkWorldBounds(rect, bounds) {
        const collisions = {
            left: rect.x < 0,
            right: rect.x + rect.width > bounds.width,
            top: rect.y < 0,
            bottom: rect.y + rect.height > bounds.height
        };

        return {
            hasCollision: Object.values(collisions).some(collision => collision),
            collisions: collisions
        };
    }

    /**
     * Crear hitbox desde posición y tamaño
     * @param {Object} position - Posición {x, y}
     * @param {Object} size - Tamaño {width, height}
     * @returns {Object} Hitbox {x, y, width, height}
     */
    static createHitbox(position, size) {
        return {
            x: position.x,
            y: position.y,
            width: size.width,
            height: size.height
        };
    }

    /**
     * Crear hitbox reducida (para colisiones más precisas)
     * @param {Object} position - Posición {x, y}
     * @param {Object} size - Tamaño {width, height}
     * @param {number} reduction - Factor de reducción (0-1)
     * @returns {Object} Hitbox reducida
     */
    static createReducedHitbox(position, size, reduction = 0.1) {
        const reduceX = size.width * reduction;
        const reduceY = size.height * reduction;
        
        return {
            x: position.x + reduceX / 2,
            y: position.y + reduceY / 2,
            width: size.width - reduceX,
            height: size.height - reduceY
        };
    }
}