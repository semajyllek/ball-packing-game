import { Point } from './GeometryUtils';
import { Shape, Rectangle, Circle, Triangle, Star } from './ShapeClasses';
import { mergeShapes } from './ShapeMerger';

// Constants
const MIN_SIZE = 60;  // Doubled from 30
const MAX_SIZE = 160; // Doubled from 80
const MIN_SHAPES = 2;
const MAX_SHAPES = 5;

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
    const y = margin + Math.random() * (height - 2 * margin);
    shape.translate(x, y);
};

const placeOverlappingShape = (newShape: Shape, existingShape: Shape, width: number, height: number): boolean => {
    const existingBounds = existingShape.getBounds();
    const margin = MAX_SIZE;

    for (let attempt = 0; attempt < 50; attempt++) {
        // Pick a random point within the existing shape's bounds
        const x = existingBounds.minX + (existingBounds.maxX - existingBounds.minX) * Math.random();
        const y = existingBounds.minY + (existingBounds.maxY - existingBounds.minY) * Math.random();
        
        newShape.translate(x, y);
        const newBounds = newShape.getBounds();
        
        // Check if the new shape is within game bounds
        if (newBounds.minX < margin || newBounds.maxX > width - margin || 
            newBounds.minY < margin || newBounds.maxY > height - margin) {
            newShape.translate(-x, -y); // Reset position
            continue;
        }
        
        // Check for overlap
        const hasOverlap = !(newBounds.maxX < existingBounds.minX || 
                            newBounds.minX > existingBounds.maxX ||
                            newBounds.maxY < existingBounds.minY || 
                            newBounds.minY > existingBounds.maxY);
                          
        if (hasOverlap) {
            return true;
        }
        
        newShape.translate(-x, -y); // Reset position
    }
    
    return false;
};

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

export const generateCompoundShape = (width: number, height: number): GeneratedShape => {
    const numShapes = 2 + Math.floor(Math.random() * 3);
    const shapes: Shape[] = [];
    let attempts = 0;
    const maxAttempts = 50;

    // Create and place first shape
    const firstShape = createRandomShape();
    placeFirstShape(firstShape, width, height);
    shapes.push(firstShape);

    // Add remaining shapes
    while (shapes.length < numShapes && attempts < maxAttempts) {
        const newShape = createRandomShape();
        const existingShapeIndex = Math.floor(Math.random() * shapes.length);
        
        if (placeOverlappingShape(newShape, shapes[existingShapeIndex], width, height)) {
            shapes.push(newShape);
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