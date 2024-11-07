import { Shape, Rectangle, Circle, Triangle, Star } from './ShapeClasses';
import { Point } from './GeometryUtils';

// Constants
const MIN_SIZE = 60;
const MAX_SIZE = 200;
const MIN_SHAPES = 3;
const MAX_SHAPES = 5;

// Helper function to validate if a number[] is a valid Point
const asPoint = (arr: number[]): Point => {
    if (arr.length !== 2) {
        throw new Error('Invalid point coordinates');
    }
    return [arr[0], arr[1]];
};

const createRandomShape = (): Shape => {
    const shapeType = Math.floor(Math.random() * 4);
    const x = 0;
    const y = 0;
    const sizeMultiplier = 0.5 + Math.random() * 1.5;
    
    switch (shapeType) {
        case 0:
            const width = (MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)) * sizeMultiplier;
            const height = (MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)) * sizeMultiplier;
            return new Rectangle(x, y, width, height);
        case 1:
            const radius = ((MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)) / 2) * sizeMultiplier;
            return new Circle(x, y, radius, 16);
        case 2:
            const size = (MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)) * sizeMultiplier;
            return new Triangle(x, y, size);
        default:
            const starRadius = ((MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)) / 2) * sizeMultiplier;
            const points = 5 + Math.floor(Math.random() * 4);
            return new Star(x, y, starRadius, points);
    }
};

const isPointInShape = (point: Point, shape: Shape): boolean => {
    const vertices = shape.getVertices().map(asPoint);
    let inside = false;
    
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const xi = vertices[i][0], yi = vertices[i][1];
        const xj = vertices[j][0], yj = vertices[j][1];
        
        const intersect = ((yi > point[1]) !== (yj > point[1])) &&
            (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
    }
    
    return inside;
};

const findOverlappingPosition = (newShape: Shape, existingShape: Shape): boolean => {
    const existingBounds = existingShape.getBounds();
    const centerX = (existingBounds.maxX + existingBounds.minX) / 2;
    const centerY = (existingBounds.maxY + existingBounds.minY) / 2;
    
    for (let attempt = 0; attempt < 50; attempt++) {
        // Generate position near existing shape
        const angle = Math.random() * Math.PI * 2;
        const distance = MIN_SIZE / 4 + Math.random() * (MAX_SIZE / 4);
        
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        newShape.translate(x, y);
        
        // Check if shapes overlap
        const newVertices = newShape.getVertices().map(asPoint);
        let hasOverlap = false;
        let allInside = true;
        
        for (const vertex of newVertices) {
            const isInside = isPointInShape(vertex, existingShape);
            if (isInside) {
                hasOverlap = true;
            } else {
                allInside = false;
            }
        }
        
        // We want some overlap but not complete containment
        if (hasOverlap && !allInside) {
            return true;
        }
        
        // Reset position for next attempt
        newShape.translate(-x, -y);
    }
    
    return false;
};

const mergeShapes = (shapes: Shape[]): Point[] => {
    // Get all vertices from all shapes
    const allVertices = shapes.flatMap(shape => shape.getVertices().map(asPoint));
    
    // Remove vertices that are inside any other shape
    const outerVertices = allVertices.filter(vertex => {
        // Count how many shapes this vertex is inside of
        let insideCount = 0;
        for (const shape of shapes) {
            if (isPointInShape(vertex, shape)) {
                insideCount++;
            }
        }
        // Keep vertex only if it's inside exactly one shape
        return insideCount === 1;
    });
    
    // Sort vertices to form a continuous outline
    const sortedVertices: Point[] = [];
    const remaining = [...outerVertices];
    
    // Start with leftmost point
    let current = remaining.reduce((leftmost, vertex) => 
        vertex[0] < leftmost[0] ? vertex : leftmost
    );
    
    while (remaining.length > 0) {
        const index = remaining.findIndex(v => v[0] === current[0] && v[1] === current[1]);
        if (index === -1) break;
        
        sortedVertices.push(current);
        remaining.splice(index, 1);
        
        if (remaining.length === 0) break;
        
        // Find next vertex by angle
        const center = {
            x: sortedVertices.reduce((sum, v) => sum + v[0], 0) / sortedVertices.length,
            y: sortedVertices.reduce((sum, v) => sum + v[1], 0) / sortedVertices.length
        };
        
        const currentAngle = Math.atan2(current[1] - center.y, current[0] - center.x);
        
        current = remaining.reduce((next, vertex) => {
            const angle = Math.atan2(vertex[1] - center.y, vertex[0] - center.x);
            let angleDiff = angle - currentAngle;
            if (angleDiff < 0) angleDiff += Math.PI * 2;
            
            const nextAngle = Math.atan2(next[1] - center.y, next[0] - center.x);
            let nextDiff = nextAngle - currentAngle;
            if (nextDiff < 0) nextDiff += Math.PI * 2;
            
            return angleDiff < nextDiff ? vertex : next;
        });
    }
    
    return sortedVertices;
};

export const generateCompoundShape = (width: number, height: number): GeneratedShape => {
    const shapes: Shape[] = [];
    let attempts = 0;
    const maxAttempts = 100;

    // Create and place first shape
    const firstShape = createRandomShape();
    firstShape.translate(width/2, height/2);
    shapes.push(firstShape);

    // Add remaining shapes
    while (shapes.length < MIN_SHAPES && attempts < maxAttempts) {
        const newShape = createRandomShape();
        
        // Try to overlap with any existing shape
        let placed = false;
        for (const existingShape of shapes) {
            if (findOverlappingPosition(newShape, existingShape)) {
                shapes.push(newShape);
                placed = true;
                break;
            }
        }
        
        if (!placed) attempts++;
    }

    // Ensure minimum shapes requirement
    if (shapes.length < MIN_SHAPES) {
        return createFallbackShape(width, height);
    }

    // Merge shapes and get outline
    const outline = mergeShapes(shapes);
    
    // Select random vertices as spouts (1-3)
    const numSpouts = 1 + Math.floor(Math.random() * 3);
    const spouts: Point[] = [];
    const availableVertices = [...outline];
    
    for (let i = 0; i < numSpouts && availableVertices.length > 0; i++) {
        const index = Math.floor(Math.random() * availableVertices.length);
        spouts.push(availableVertices[index]);
        availableVertices.splice(index, 1);
    }
    
    return { outline, spouts };
};

const createFallbackShape = (width: number, height: number): GeneratedShape => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    
    const points = 6 + Math.floor(Math.random() * 4);
    const outline: Point[] = [];
    
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = radius * (0.8 + Math.random() * 0.4);
        outline.push([
            centerX + Math.cos(angle) * r,
            centerY + Math.sin(angle) * r
        ] as Point);
    }
    
    // Select 1-3 random vertices as spouts
    const numSpouts = 1 + Math.floor(Math.random() * 3);
    const spouts = outline
        .slice()
        .sort(() => Math.random() - 0.5)
        .slice(0, numSpouts);
    
    return { outline, spouts };
};

export interface GeneratedShape {
    outline: Point[];
    spouts: Point[];
}