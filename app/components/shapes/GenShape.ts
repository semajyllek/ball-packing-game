import { Shape, Rectangle, Circle, Triangle, Star } from './ShapeClasses';
import { Point } from './GeometryUtils';
import { mergeShapes, isPointInShape } from './ShapeMerger';

// Constants
const MIN_SIZE = 60;
const MAX_SIZE = 200;
const MIN_SHAPES = 3;
const MAX_SHAPES = 5;

const createRandomShape = (): Shape => {
    const shapeType = Math.floor(Math.random() * 4);
    const x = 0;
    const y = 0;
    const sizeMultiplier = 0.5 + Math.random() * 1.5;
    
    switch (shapeType) {
        case 0: // Rectangle
            const width = (MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)) * sizeMultiplier;
            const height = (MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)) * sizeMultiplier;
            const rect = new Rectangle(x, y, width, height);
            // Snap rotation to 45-degree increments to preserve right angles
            const rotation = Math.floor(Math.random() * 8) * (Math.PI / 4);
            rect.rotate(rotation);
            return rect;
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

const findOverlappingPosition = (newShape: Shape, existingShape: Shape): boolean => {
    const existingBounds = existingShape.getBounds();
    const centerX = (existingBounds.maxX + existingBounds.minX) / 2;
    const centerY = (existingBounds.maxY + existingBounds.minY) / 2;
    
    for (let attempt = 0; attempt < 50; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = MIN_SIZE / 4 + Math.random() * (MAX_SIZE / 4);
        
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        newShape.translate(x, y);
        
        const newVertices = newShape.getVertices();
        let hasOverlap = false;
        let allInside = true;
        
        for (const vertex of newVertices) {
            if (vertex.length !== 2) continue;
            const isInside = isPointInShape([vertex[0], vertex[1]], existingShape);
            if (isInside) {
                hasOverlap = true;
            } else {
                allInside = false;
            }
        }
        
        if (hasOverlap && !allInside) {
            return true;
        }
        
        newShape.translate(-x, -y);
    }
    
    return false;
};

export const generateCompoundShape = (width: number, height: number): GeneratedShape => {
    const shapes: Shape[] = [];
    let attempts = 0;
    const maxAttempts = 100;
    
    // Determine target number of shapes
    const targetShapes = MIN_SHAPES + Math.floor(Math.random() * (MAX_SHAPES - MIN_SHAPES + 1));

    // Create and place first shape
    const firstShape = createRandomShape();
    firstShape.translate(width/2, height/2);
    shapes.push(firstShape);

    // Add remaining shapes
    while (shapes.length < targetShapes && attempts < maxAttempts) {
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
        ]);
    }
    
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