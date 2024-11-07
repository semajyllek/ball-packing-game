export type Point = [number, number];

// Base shape class
export abstract class Shape {
  x: number;
  y: number;
  vertices: Point[] = [];
  
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  
  abstract calculateVertices(): void;
  
  translate(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
    this.vertices = this.vertices.map(([x, y]) => [x + dx, y + dy]);
  }
  
  getBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    const xs = this.vertices.map(v => v[0]);
    const ys = this.vertices.map(v => v[1]);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  }
}

export class Rectangle extends Shape {
  width: number;
  height: number;
  
  constructor(x: number, y: number, width: number, height: number) {
    super(x, y);
    this.width = width;
    this.height = height;
    this.calculateVertices();
  }
  
  calculateVertices(): void {
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    this.vertices = [
      [this.x - halfW, this.y - halfH],
      [this.x + halfW, this.y - halfH],
      [this.x + halfW, this.y + halfH],
      [this.x - halfW, this.y + halfH]
    ];
  }
}

export class Circle extends Shape {
  radius: number;
  segments: number;
  
  constructor(x: number, y: number, radius: number, segments = 12) {
    super(x, y);
    this.radius = radius;
    this.segments = segments;
    this.calculateVertices();
  }
  
  calculateVertices(): void {
    this.vertices = [];
    for (let i = 0; i < this.segments; i++) {
      const angle = (i / this.segments) * Math.PI * 2;
      this.vertices.push([
        this.x + Math.cos(angle) * this.radius,
        this.y + Math.sin(angle) * this.radius
      ]);
    }
  }
}

export class Triangle extends Shape {
  size: number;
  
  constructor(x: number, y: number, size: number) {
    super(x, y);
    this.size = size;
    this.calculateVertices();
  }
  
  calculateVertices(): void {
    const halfSize = this.size / 2;
    this.vertices = [
      [this.x, this.y - halfSize],
      [this.x + halfSize, this.y + halfSize],
      [this.x - halfSize, this.y + halfSize]
    ];
  }
}

export class Star extends Shape {
  outerRadius: number;
  innerRadius: number;
  points: number;
  
  constructor(x: number, y: number, outerRadius: number, points = 5) {
    super(x, y);
    this.outerRadius = outerRadius;
    this.innerRadius = outerRadius * 0.4;
    this.points = points;
    this.calculateVertices();
  }
  
  calculateVertices(): void {
    this.vertices = [];
    for (let i = 0; i < this.points * 2; i++) {
      const angle = (i * Math.PI) / this.points;
      const radius = i % 2 === 0 ? this.outerRadius : this.innerRadius;
      this.vertices.push([
        this.x + Math.cos(angle) * radius,
        this.y + Math.sin(angle) * radius
      ]);
    }
  }
}