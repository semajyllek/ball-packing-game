export interface Shape {
    translate(x: number, y: number): void;
    scale(factor: number): void;
    rotate(angle: number): void; // Add rotate method to interface
    getBounds(): { minX: number; minY: number; maxX: number; maxY: number };
    getVertices(): number[][];
}

export class Rectangle implements Shape {
    private x: number;
    private y: number;
    private width: number;
    private height: number;
    private angle: number = 0;

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    translate(x: number, y: number): void {
        this.x += x;
        this.y += y;
    }

    scale(factor: number): void {
        this.width *= factor;
        this.height *= factor;
    }

    rotate(angle: number): void {
        this.angle += angle;
    }

    getBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
        const vertices = this.getVertices();
        const xs = vertices.map(v => v[0]);
        const ys = vertices.map(v => v[1]);
        return {
            minX: Math.min(...xs),
            minY: Math.min(...ys),
            maxX: Math.max(...xs),
            maxY: Math.max(...ys)
        };
    }

    getVertices(): number[][] {
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        
        // Define corners relative to center
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        const corners = [
            [-halfWidth, -halfHeight],
            [halfWidth, -halfHeight],
            [halfWidth, halfHeight],
            [-halfWidth, halfHeight]
        ];

        // Rotate and translate corners
        return corners.map(([dx, dy]) => {
            const rotatedX = dx * cos - dy * sin;
            const rotatedY = dx * sin + dy * cos;
            return [
                this.x + rotatedX,
                this.y + rotatedY
            ];
        });
    }
}

export class Circle implements Shape {
    private x: number;
    private y: number;
    private radius: number;
    private segments: number;
    private angle: number = 0;

    constructor(x: number, y: number, radius: number, segments: number) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.segments = segments;
    }

    translate(x: number, y: number): void {
        this.x += x;
        this.y += y;
    }

    scale(factor: number): void {
        this.radius *= factor;
    }

    rotate(angle: number): void {
        this.angle += angle;
    }

    getBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
        return {
            minX: this.x - this.radius,
            minY: this.y - this.radius,
            maxX: this.x + this.radius,
            maxY: this.y + this.radius
        };
    }

    getVertices(): number[][] {
        const vertices: number[][] = [];
        for (let i = 0; i < this.segments; i++) {
            const segmentAngle = (i / this.segments) * Math.PI * 2 + this.angle;
            vertices.push([
                this.x + Math.cos(segmentAngle) * this.radius,
                this.y + Math.sin(segmentAngle) * this.radius
            ]);
        }
        return vertices;
    }
}

export class Triangle implements Shape {
    private x: number;
    private y: number;
    private size: number;
    private angle: number = 0;

    constructor(x: number, y: number, size: number) {
        this.x = x;
        this.y = y;
        this.size = size;
    }

    translate(x: number, y: number): void {
        this.x += x;
        this.y += y;
    }

    scale(factor: number): void {
        this.size *= factor;
    }

    rotate(angle: number): void {
        this.angle += angle;
    }

    getBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
        const vertices = this.getVertices();
        const xs = vertices.map(v => v[0]);
        const ys = vertices.map(v => v[1]);
        return {
            minX: Math.min(...xs),
            minY: Math.min(...ys),
            maxX: Math.max(...xs),
            maxY: Math.max(...ys)
        };
    }

    getVertices(): number[][] {
        const height = this.size * Math.sqrt(3) / 2;
        const basePoints = [
            [0, -height/2],                  // top
            [-this.size/2, height/2],        // bottom left
            [this.size/2, height/2]          // bottom right
        ];

        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);

        return basePoints.map(([dx, dy]) => {
            const rotatedX = dx * cos - dy * sin;
            const rotatedY = dx * sin + dy * cos;
            return [
                this.x + rotatedX,
                this.y + rotatedY
            ];
        });
    }
}

export class Star implements Shape {
    private x: number;
    private y: number;
    private radius: number;
    private points: number;
    private angle: number = 0;

    constructor(x: number, y: number, radius: number, points: number) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.points = points;
    }

    translate(x: number, y: number): void {
        this.x += x;
        this.y += y;
    }

    scale(factor: number): void {
        this.radius *= factor;
    }

    rotate(angle: number): void {
        this.angle += angle;
    }

    getBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
        const vertices = this.getVertices();
        const xs = vertices.map(v => v[0]);
        const ys = vertices.map(v => v[1]);
        return {
            minX: Math.min(...xs),
            minY: Math.min(...ys),
            maxX: Math.max(...xs),
            maxY: Math.max(...ys)
        };
    }

    getVertices(): number[][] {
        const vertices: number[][] = [];
        const innerRadius = this.radius * 0.4; // Inner radius for star points

        for (let i = 0; i < this.points * 2; i++) {
            const currentAngle = (i * Math.PI / this.points) + this.angle;
            const currentRadius = i % 2 === 0 ? this.radius : innerRadius;
            vertices.push([
                this.x + Math.cos(currentAngle) * currentRadius,
                this.y + Math.sin(currentAngle) * currentRadius
            ]);
        }
        return vertices;
    }
}