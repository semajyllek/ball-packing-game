import { Point } from './GeometryUtils';
import { Shape, Rectangle, Circle, Triangle, Star } from './ShapeClasses';
import { mergeShapes } from './ShapeMerger';

// Constants
const MIN_SIZE = 40;   // 10% of game area
const MAX_SIZE = 300;  // 25% of game area
const MIN_SHAPES = 3;  // Minimum shapes to combine
const MAX_SHAPES = 8;  // Maximum shapes to combine

const createRandomShape = (): Shape => {
    const shapeType = Math.floor(Math.random() * 4);
    const x = 0;
    const y = 0;
    
    switch (shapeType) {
        case 0: // Rectangle - increased probability
            if (Math.random() < 0.4) { // 40% chance for rectangle
                const width = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
                const height = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
                return new Rectangle(x, y, width, height);
            }
            // fallthrough to other shapes if rectangle not chosen
        case 1:
            const radius = (MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)) / 2;
            return new Circle(x, y, radius, 16);
        case 2:
            const size = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
            return new Triangle(x, y, size);
        default:
            const starRadius = (MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)) / 2;
            return new Star(x, y, starRadius, 5);
    }
};

const placeFirstShape = (shape: Shape, width: number, height: number): void => {
    const margin = MAX_SIZE;
    const x = margin + Math.random() * (width - 2 * margin);
    // Use upper half of screen instead of just top third
    const y = margin + Math.random() * (height/2);
    shape.translate(x, y);
};

const placeOverlappingShape = (newShape: Shape, existingShape: Shape, width: number, height: number): boolean => {
    const existingBounds = existingShape.getBounds();
    const margin = MAX_SIZE;
    const minOverlap = MIN_SIZE / 3;
    
    for (let attempt = 0; attempt < 50; attempt++) {
        const placementMargin = MAX_SIZE / 2;
        const x = existingBounds.minX - placementMargin + Math.random() * (existingBounds.maxX - existingBounds.minX + 2 * placementMargin);
        const y = Math.min(
            existingBounds.minY - placementMargin + Math.random() * (existingBounds.maxY - existingBounds.minY + 2 * placementMargin),
            height * 0.8 // Allow more vertical space
        );
        
        newShape.translate(x, y);
        const newBounds = newShape.getBounds();
        
        if (newBounds.minX < margin || 
            newBounds.maxX > width - margin || 
            newBounds.minY < margin || 
            newBounds.maxY > height * 0.75) {
            newShape.translate(-x, -y);
            continue;
        }
        
        const overlapX = Math.min(newBounds.maxX, existingBounds.maxX) - 
                        Math.max(newBounds.minX, existingBounds.minX);
        const overlapY = Math.min(newBounds.maxY, existingBounds.maxY) - 
                        Math.max(newBounds.minY, existingBounds.minY);

        if (overlapX > minOverlap && overlapY > minOverlap) {
            return true;
        }
        
        newShape.translate(-x, -y);
    }
    
    return false;
};

export const generateCompoundShape = (width: number, height: number): GeneratedShape => {
    // Always generate at least MIN_SHAPES shapes
    let shapesToGenerate = MIN_SHAPES + Math.floor(Math.random() * (MAX_SHAPES - MIN_SHAPES + 1));
    const shapes: Shape[] = [];
    let attempts = 0;
    const maxAttempts = 100;

    // Create and place first shape
    while (shapes.length === 0 && attempts < maxAttempts) {
        const firstShape = createRandomShape();
        placeFirstShape(firstShape, width, height);
        shapes.push(firstShape);
    }

    // Keep trying to add shapes until we have at least MIN_SHAPES
    while (shapes.length < MIN_SHAPES && attempts < maxAttempts) {
        const newShape = createRandomShape();
        
        // Try to overlap with any existing shape
        let placed = false;
        for (let i = 0; i < shapes.length && !placed; i++) {
            if (placeOverlappingShape(newShape, shapes[i], width, height)) {
                shapes.push(newShape);
                placed = true;
                break;
            }
        }
        attempts++;
    }

    // If we couldn't create minimum shapes, return fallback
    if (shapes.length < MIN_SHAPES) {
        return createFallbackShape(width, height);
    }

    // Try to add more shapes up to the random target amount
    while (shapes.length < shapesToGenerate && attempts < maxAttempts) {
        const newShape = createRandomShape();
        let placed = false;
        for (let i = 0; i < shapes.length && !placed; i++) {
            if (placeOverlappingShape(newShape, shapes[i], width, height)) {
                shapes.push(newShape);
                placed = true;
                break;
            }
        }
        attempts++;
    }

    // Get outline vertices and select spouts
    const outline = mergeShapes(shapes);
    return {
        outline,
        spouts: selectRandomSpouts(outline)
    };
};

const createFallbackShape = (width: number, height: number): GeneratedShape => {
    // Create a more complex fallback shape with at least 3 parts
    const fallbackOutline: Point[] = [
        [width/2, height/4],             // top
        [width*3/4, height*0.35],        // top right
        [width*0.85, height/2],          // right
        [width*3/4, height*0.65],        // bottom right
        [width/2, height*0.75],          // bottom
        [width/4, height*0.65],          // bottom left
        [width*0.15, height/2],          // left
        [width/4, height*0.35]           // top left
    ];
    
    return {
        outline: fallbackOutline,
        spouts: selectRandomSpouts(fallbackOutline)
    };
};

const selectRandomSpouts = (vertices: Point[]): Point[] => {
    const numSpouts = 2 + Math.floor(Math.random() * 2); // 2-3 spouts
    const sortedByHeight = [...vertices].sort((a, b) => a[1] - b[1]);
    const topHalf = sortedByHeight.slice(0, Math.floor(vertices.length / 2));
    
    const spouts: Point[] = [];
    while (spouts.length < numSpouts && topHalf.length > 0) {
        const index = Math.floor(Math.random() * topHalf.length);
        spouts.push(topHalf[index]);
        topHalf.splice(index, 1);
    }
    
    return spouts;
};

export interface GeneratedShape {
    outline: Point[];
    spouts: Point[];
}