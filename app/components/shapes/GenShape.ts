import { Shape, Rectangle, Circle, Triangle, Star } from './ShapeClasses';
import { Point } from './GeometryUtils';
import { mergeShapes } from './ShapeMerger';

// Constants
//const MIN_SIZE = 60;
//const MAX_SIZE = 200;
const MIN_SHAPES = 3;
const MAX_SHAPES = 5;

const createRandomShape = (): Shape => {
    const shapeType = Math.floor(Math.random() * 4);
    const x = 0;
    const y = 0;
    
    switch (shapeType) {
        case 0: // Rectangle
            // Make rectangles more prominent and clearer
            const width = 100 + Math.random() * 100;  // 100-200
            const height = 100 + Math.random() * 100; // 100-200
            const rect = new Rectangle(x, y, width, height);
            
            // Only use 0, 90, 180, or 270 degrees for clearer right angles
            const rotation = Math.floor(Math.random() * 4) * (Math.PI / 2);
            rect.rotate(rotation);
            return rect;
        case 1:
            const radius = 40 + Math.random() * 40;
            return new Circle(x, y, radius, 16);
        case 2:
            const size = 80 + Math.random() * 80;
            return new Triangle(x, y, size);
        default:
            const starRadius = 40 + Math.random() * 40;
            const points = 5;
            return new Star(x, y, starRadius, points);
    }
};

const findOverlappingPosition = (newShape: Shape, existingShape: Shape): boolean => {
    const existingBounds = existingShape.getBounds();
    const centerX = (existingBounds.maxX + existingBounds.minX) / 2;
    const centerY = (existingBounds.maxY + existingBounds.minY) / 2;
    
    // Try positions in a more structured way
    const possibleDistances = [30, 60, 90, 120];
    const possibleAngles = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI];
    
    for (const distance of possibleDistances) {
        for (const angle of possibleAngles) {
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            newShape.translate(x, y);
            
            // Count vertices that overlap
            const newVertices = newShape.getVertices();
            let overlapCount = 0;
            let outsideCount = 0;
            
            for (const vertex of newVertices) {
                const isInside = isPointInShape([vertex[0], vertex[1]], existingShape);
                if (isInside) {
                    overlapCount++;
                } else {
                    outsideCount++;
                }
            }
            
            // We want some vertices inside and some outside for good overlap
            if (overlapCount > 0 && outsideCount > 0) {
                return true;
            }
            
            newShape.translate(-x, -y);
        }
    }
    
    return false;
};

const isPointInShape = (point: Point, shape: Shape): boolean => {
    const vertices = shape.getVertices();
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

export const generateCompoundShape = (width: number, height: number): GeneratedShape => {
    const shapes: Shape[] = [];
    let attempts = 0;
    const maxAttempts = 100;

    // Force first shape to be a rectangle
    const firstShape = new Rectangle(0, 0, 150, 100);
    firstShape.translate(width/2 - 75, height/2 - 50);
    shapes.push(firstShape);

    // Add remaining shapes
    const targetShapes = MIN_SHAPES + Math.floor(Math.random() * (MAX_SHAPES - MIN_SHAPES + 1));
    
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

// ... rest of the code (createFallbackShape and interface) remains the same
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