import { Point } from './GeometryUtils';
import { Shape, Rectangle, Circle, Triangle, Star } from './ShapeClasses';
import { mergeShapes } from './ShapeMerger';

// Constants
const MIN_SIZE = 40;   // 10% of game area
const MAX_SIZE = 100;  // 25% of game area
const MIN_SHAPES = 3;
const MAX_SHAPES = 8;

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
    // Use upper portion of screen to ensure room for falling balls
    const x = margin + Math.random() * (width - 2 * margin);
    const y = margin + Math.random() * (height/3); // Only use top third of screen
    shape.translate(x, y);
};

const placeOverlappingShape = (newShape: Shape, existingShape: Shape, width: number, height: number): boolean => {
    const existingBounds = existingShape.getBounds();
    const margin = MAX_SIZE;
    const minOverlap = MIN_SIZE / 3;

    for (let attempt = 0; attempt < 50; attempt++) {
        const placementMargin = MAX_SIZE / 2;
        const x = existingBounds.minX - placementMargin + Math.random() * (existingBounds.maxX - existingBounds.minX + 2 * placementMargin);
        // Keep Y placement higher up
        const y = Math.min(
            existingBounds.minY - placementMargin + Math.random() * (existingBounds.maxY - existingBounds.minY + 2 * placementMargin),
            height * 0.6 // Don't go below 60% of screen height
        );
        
        newShape.translate(x, y);
        const newBounds = newShape.getBounds();
        
        // Stricter bounds checking
        if (newBounds.minX < margin || 
            newBounds.maxX > width - margin || 
            newBounds.minY < margin || 
            newBounds.maxY > height - margin ||
            newBounds.maxY > height * 0.75) { // Additional height restriction
            newShape.translate(-x, -y);
            continue;
        }
        
        // Rest of overlap checking remains the same
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
    const numShapes = MIN_SHAPES + Math.floor(Math.random() * (MAX_SHAPES - MIN_SHAPES + 1));
    const shapes: Shape[] = [];
    let attempts = 0;
    const maxAttempts = 100; // Increased attempts

    // Create and place first shape
    const firstShape = createRandomShape();
    placeFirstShape(firstShape, width, height);
    shapes.push(firstShape);

    // Add remaining shapes with more persistence
    while (shapes.length < numShapes && attempts < maxAttempts) {
        const newShape = createRandomShape();
        // Try to overlap with any existing shape
        let placed = false;
        for (let i = 0; i < shapes.length && !placed; i++) {
            if (placeOverlappingShape(newShape, shapes[i], width, height)) {
                shapes.push(newShape);
                placed = true;
            }
        }
        attempts++;
    }

    // Get outline vertices and select spouts
    const outline = mergeShapes(shapes);

    if (outline.length < 3) {
        return createFallbackShape(width, height);
    }

    return {
        outline,
        spouts: selectRandomSpouts(outline)
    };
};

// Rest of the code remains the same...
const createFallbackShape = (width: number, height: number): GeneratedShape => {
    const fallbackOutline: Point[] = [
        [width/2, height/4],
        [width*3/4, height/2],
        [width*2/3, height*3/4],
        [width/3, height*3/4],
        [width/4, height/2]
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
