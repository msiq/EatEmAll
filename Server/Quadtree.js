/**
 * 2D Bounding Box (AABB) for spatial calculations
 */
class Rectangle {
    constructor(x, y, width, height) {
        this.x = x;          // Left-most X position
        this.y = y;          // Top-most Y position
        this.width = width;  // Horizontal span
        this.height = height;// Vertical span
    }

    // Check if a point (x, y) falls inside this rectangle
    contains(point) {
        return (
            point.x >= this.x &&
            point.x <= this.x + this.width &&
            point.y >= this.y &&
            point.y <= this.y + this.height
        );
    }

    // Check if this rectangle overlaps with another rectangle (AABB test)
    intersects(other) {
        return !(
            other.x > this.x + this.width ||
            other.x + other.width < this.x ||
            other.y > this.y + this.height ||
            other.y + other.height < this.y
        );
    }
}

/**
 * Quadtree Node for recursive 2D spatial partitioning
 */
class Quadtree {
    constructor(bounds, capacity = 6) {
        this.bounds = bounds;      // Rectangle representing this quadrant
        this.capacity = capacity;  // Maximum items before subdividing
        this.entities = [];        // Entities stored in this quadrant
        this.divided = false;      // True if this quadrant has 4 children

        // Four child quadrants:
        this.northWest = null;
        this.northEast = null;
        this.southWest = null;
        this.southEast = null;
    }

    // Helper to safely extract (x, y) coordinates from any entity or object
    getPosition(item) {
        if (item.abilities && item.abilities.position && item.abilities.position.pos) {
            return item.abilities.position.pos;
        }
        if (item.pos) return item.pos;
        return item; // assumes item has .x and .y
    }

    // Subdivide this node into four smaller quadrants (NW, NE, SW, SE)
    subdivide() {
        const x = this.bounds.x;
        const y = this.bounds.y;
        const halfW = this.bounds.width / 2;
        const halfH = this.bounds.height / 2;

        this.northWest = new Quadtree(new Rectangle(x, y, halfW, halfH), this.capacity);
        this.northEast = new Quadtree(new Rectangle(x + halfW, y, halfW, halfH), this.capacity);
        this.southWest = new Quadtree(new Rectangle(x, y + halfH, halfW, halfH), this.capacity);
        this.southEast = new Quadtree(new Rectangle(x + halfW, y + halfH, halfW, halfH), this.capacity);

        this.divided = true;

        // Re-distribute existing entities down into the children
        const oldEntities = this.entities;
        this.entities = [];
        for (let i = 0; i < oldEntities.length; i++) {
            this.insertIntoChildren(oldEntities[i]);
        }
    }

    // Helper to route an entity into one of the four child quadrants
    insertIntoChildren(entity) {
        return (
            this.northWest.insert(entity) ||
            this.northEast.insert(entity) ||
            this.southWest.insert(entity) ||
            this.southEast.insert(entity)
        );
    }

    // Insert an entity into this Quadtree
    insert(entity) {
        const pos = this.getPosition(entity);

        // 1. Ignore if point is outside this quadrant
        if (!this.bounds.contains(pos)) {
            return false;
        }

        // 2. If node has capacity and not divided, store here
        if (!this.divided && this.entities.length < this.capacity) {
            this.entities.push(entity);
            return true;
        }

        // 3. If capacity exceeded and not yet split, subdivide
        if (!this.divided) {
            this.subdivide();
        }

        // 4. Delegate insertion to the appropriate child quadrant
        return this.insertIntoChildren(entity);
    }

    // Query for all entities inside a search rectangle (range)
    query(range, found = []) {
        // 1. If search area does not overlap this quadrant, prune immediately
        if (!this.bounds.intersects(range)) {
            return found;
        }

        // 2. Check entities stored in this node
        for (let i = 0; i < this.entities.length; i++) {
            const pos = this.getPosition(this.entities[i]);
            if (range.contains(pos)) {
                found.push(this.entities[i]);
            }
        }

        // 3. If divided, search all 4 child quadrants recursively
        if (this.divided) {
            this.northWest.query(range, found);
            this.northEast.query(range, found);
            this.southWest.query(range, found);
            this.southEast.query(range, found);
        }

        return found;
    }

    // Clear the tree for the next tick
    clear() {
        this.entities = [];
        this.divided = false;
        this.northWest = null;
        this.northEast = null;
        this.southWest = null;
        this.southEast = null;
    }
}

module.exports = { Rectangle, Quadtree };
