import { Point } from './GeometryUtils';
import { Shape, Rectangle, Circle, Triangle, Star } from './ShapeClasses';
import { mergeShapes } from './ShapeMerger';

// Constants
const MIN_SIZE = 60;   // Increased minimum size
const MAX_SIZE = 200;  // Decreased maximum size for better composition
const MIN_SHAPES = 3;
const MAX_SHAPES = 5;  // Reduced max shapes for clearer composition

const createRandomShape = (): Shape => {
    const shapeType = Math.floor(Math.random() * 4);
    const x = 0;
    const y = 0;
    
    // Randomize sizes more dramatically
    const sizeMultiplier = 0.5 + Math.random() * 1.5; // 0.5x to 2x size variation
    
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
            const points = 5 + Math.floor(Math.random() * 4); // 5-8 points
            return new Star(x, y, starRadius, points);
    }
};

const placeFirstShape = (shape: Shape, width: number, height: number): void => {
    const margin = MAX_SIZE / 2; // Reduced margin
    // Place more centrally
    const x = width/2 - MAX_SIZE/2 + Math.random() * MAX_SIZE;
    const y = height/2 - MAX_SIZE/2 + Math.random() * MAX_SIZE;
    shape.translate(x, y);
};

const placeOverlappingShape = (newShape: Shape, existingShape: Shape, width: number, height: number): boolean => {
    const existingBounds = existingShape.getBounds();
    const margin = MAX_SIZE / 2;
    const minOverlap = MIN_SIZE / 2; // Increased minimum overlap
    
    for (let attempt = 0; attempt < 50; attempt++) {
        // Generate position relative to existing shape
        const angle = Math.random() * Math.PI * 2;
        const distance = MIN_SIZE/2 + Math.random() * MAX_SIZE/2;
        
        const x = existingBounds.minX + (existingBounds.maxX - existingBounds.minX)/2 + 
                 Math.cos(angle) * distance;
        const y = existingBounds.minY + (existingBounds.maxY - existingBounds.minY)/2 + 
                 Math.sin(angle) * distance;
        
        newShape.translate(x, y);
        const newBounds = newShape.getBounds();
        
        // Check boundaries
        if (newBounds.minX < margin || 
            newBounds.maxX > width - margin || 
            newBounds.minY < margin || 
            newBounds.maxY > height - margin) {
            newShape.translate(-x, -y);
            continue;
        }
        
        // Check overlap
        const overlapX = Math.min(newBounds.maxX, existingBounds.maxX) - 
                        Math.max(newBounds.minX, existingBounds.minX);
        const overlapY = Math.min(newBounds.maxY, existingBounds.maxY) - 
                        Math.max(newBounds.minY, existingBounds.minY);

        if (overlapX > minOverlap && overlapY > minOverlap) {
            // Add random rotation
            const rotation = (Math.random() - 0.5) * Math.PI / 2; // -45 to 45 degrees
            newShape.rotate(rotation);
            return true;
        }
        
        newShape.translate(-x, -y);
    }
    
    return false;
};

export const generateCompoundShape = (width: number, height: number): GeneratedShape => {
    const numShapes = MIN_SHAPES + Math.floor(Math.random() * (MAX_SHAPES - MIN_SHAPES + 1));
    const shapes: Shape[] = [];
    let attempts = 0;
    const maxAttempts = 100;

    // Create first shape
    const firstShape = createRandomShape();
    placeFirstShape(firstShape, width, height);
    shapes.push(firstShape);

    // Add remaining shapes with more variation
    while (shapes.length < numShapes && attempts < maxAttempts) {
        const newShape = createRandomShape();
        let placed = false;
        
        // Try to overlap with any existing shape
        for (let i = 0; i < shapes.length && !placed; i++) {
            if (placeOverlappingShape(newShape, shapes[i], width, height)) {
                // Add random scaling
                const scale = 0.75 + Math.random() * 0.5; // 0.75x to 1.25x
                newShape.scale(scale);
                shapes.push(newShape);
                placed = true;
            }
        }
        
        attempts++;
    }

    // Ensure minimum shapes requirement
    if (shapes.length < MIN_SHAPES) {
        return createFallbackShape(width, height);
    }

    const outline = mergeShapes(shapes);
    return {
        outline,
        spouts: selectRandomSpouts(outline)
    };
};

const createFallbackShape = (width: number, height: number): GeneratedShape => {
    // Create an asymmetric compound shape
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    
    const points = 6 + Math.floor(Math.random() * 4); // 6-9 points
    const fallbackOutline: Point[] = [];
    
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = radius * (0.8 + Math.random() * 0.4); // Vary radius
        fallbackOutline.push([
            centerX + Math.cos(angle) * r * (1 + Math.random() * 0.3),
            centerY + Math.sin(angle) * r * (1 + Math.random() * 0.3)
        ]);
    }
    
    return {
        outline: fallbackOutline,
        spouts: selectRandomSpouts(fallbackOutline)
    };
};

const selectRandomSpouts = (vertices: Point[]): Point[] => {
    const numSpouts = 2 + Math.floor(Math.random() * 2); // 2-3 spouts
    const sortedByHeight = [...vertices].sort((a, b) => a[1] - b[1]);
    const topHalf = sortedByHeight.slice(0, Math.floor(vertices.length / 2));
    
    // Ensure spouts are spread out
    const spouts: Point[] = [];
    const angleSegments = Math.PI / (numSpouts + 1);
    
    for (let i = 0; i < numSpouts && topHalf.length > 0; i++) {
        const targetAngle = angleSegments * (i + 1);
        const center = [vertices.reduce((sum, v) => sum + v[0], 0) / vertices.length,
                       vertices.reduce((sum, v) => sum + v[1], 0) / vertices.length];
        
        // Find point closest to desired angle
        let bestPoint = topHalf[0];
        let bestAngleDiff = Math.PI * 2;
        
        topHalf.forEach(point => {
            const angle = Math.atan2(point[1] - center[1], point[0] - center[0]);
            const angleDiff = Math.abs(angle - targetAngle);
            if (angleDiff < bestAngleDiff) {
                bestAngleDiff = angleDiff;
                bestPoint = point;
            }
        });
        
        spouts.push(bestPoint);
        const index = topHalf.indexOf(bestPoint);
        topHalf.splice(index, 1);
    }
    
    return spouts;
};

export interface GeneratedShape {
    outline: Point[];
    spouts: Point[];
}