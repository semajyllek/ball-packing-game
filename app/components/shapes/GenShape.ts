import { Shape, Rectangle, Circle, Triangle, Star } from './ShapeClasses';
import { Point } from './GeometryUtils';
import { mergeShapes, isPointInShape } from './ShapeMerger';

// Constants
const MIN_SIZE = 60;
const MAX_SIZE = 400;
const MIN_SHAPES = 6;



const randomInRange = (min: number, max: number): number => {
    return min + Math.random() * (max - min);
};



const createRandomShape = (): Shape => {
    const shapeType = Math.floor(Math.random() * 4);
    const x = 0;
    const y = 0;
    
    switch (shapeType) {
        case 0: // Rectangle
            const width = randomInRange(MIN_SIZE, MAX_SIZE);
            const height = randomInRange(MIN_SIZE, MAX_SIZE);
            return new Rectangle(x, y, width, height);
        case 1:
            const radius = randomInRange(MIN_SIZE/2, MAX_SIZE/2); // Divide by 2 since diameter is the effective size
            return new Circle(x, y, radius, 16);
        case 2:
            const size = randomInRange(MIN_SIZE, MAX_SIZE);
            return new Triangle(x, y, size);
        default:
            const starRadius = randomInRange(MIN_SIZE/2, MAX_SIZE/2);
            const points = 5;
            return new Star(x, y, starRadius, points);
    }
};


interface OverlapResult {
    overlapCount: number;
    outsideCount: number;
}

const checkOverlap = (vertices: number[][], existingShape: Shape): OverlapResult => {
    let overlapCount = 0;
    let outsideCount = 0;
    
    for (const vertex of vertices) {
        const isInside = isPointInShape([vertex[0], vertex[1]], existingShape);
        if (isInside) {
            overlapCount++;
        } else {
            outsideCount++;
        }
    }
    
    return { overlapCount, outsideCount };
};

const isGoodOverlap = (result: OverlapResult): boolean => {
    return result.overlapCount === 1 && result.outsideCount > 0;
};

const tryPosition = (
    newShape: Shape,
    x: number,
    y: number,
    existingShape: Shape
): boolean => {
    newShape.translate(x, y);
    
    const overlap = checkOverlap(newShape.getVertices(), existingShape);
    const success = isGoodOverlap(overlap);
    
    if (!success) {
        newShape.translate(-x, -y);
    }
    
    return success;
};

const tryVertexBasedPlacement = (
    newShape: Shape,
    existingShape: Shape,
    offsets: number[]
): boolean => {
    const existingVertices = existingShape.getVertices();
    
    for (const vertex of existingVertices) {
        for (const offsetX of offsets) {
            for (const offsetY of offsets) {
                const x = vertex[0] + offsetX;
                const y = vertex[1] + offsetY;
                
                if (tryPosition(newShape, x, y, existingShape)) {
                    return true;
                }
            }
        }
    }
    
    return false;
};

const calculateEdgeNormal = (edge: {start: Point, end: Point}): {x: number, y: number} => {
    const edgeLength = Math.sqrt(
        Math.pow(edge.end[0] - edge.start[0], 2) + 
        Math.pow(edge.end[1] - edge.start[1], 2)
    );
    
    return {
        x: -(edge.end[1] - edge.start[1]) / edgeLength,
        y: (edge.end[0] - edge.start[0]) / edgeLength
    };
};

const tryEdgeBasedPlacement = (
    newShape: Shape,
    existingShape: Shape,
    distances: number[]
): boolean => {
    const edges = getShapeEdges(existingShape);
    
    for (const edge of edges) {
        const edgeMidX = (edge.start[0] + edge.end[0]) / 2;
        const edgeMidY = (edge.start[1] + edge.end[1]) / 2;
        
        const normal = calculateEdgeNormal(edge);
        
        for (const distance of distances) {
            const x = edgeMidX + normal.x * distance;
            const y = edgeMidY + normal.y * distance;
            
            if (tryPosition(newShape, x, y, existingShape)) {
                return true;
            }
        }
    }
    
    return false;
};

const findOverlappingPosition = (newShape: Shape, existingShape: Shape): boolean => {
    const offsets = [-MIN_SIZE/4, 0, MIN_SIZE/4];
    const distances = [MIN_SIZE/4, MIN_SIZE/2];
    
    // Try vertex-based placement first
    if (tryVertexBasedPlacement(newShape, existingShape, offsets)) {
        return true;
    }
    
    // Fall back to edge-based placement
    return tryEdgeBasedPlacement(newShape, existingShape, distances);
};

const getShapeEdges = (shape: Shape): Array<{start: Point, end: Point}> => {
    const vertices = shape.getVertices();
    const edges: Array<{start: Point, end: Point}> = [];
    
    for (let i = 0; i < vertices.length; i++) {
        const start = vertices[i];
        const end = vertices[(i + 1) % vertices.length];
        edges.push({
            start: [start[0], start[1]] as Point,
            end: [end[0], end[1]] as Point
        });
    }
    
    return edges;
};


export const generateCompoundShape = (width: number, height: number): GeneratedShape => {
    const shapes: Shape[] = [];
    let attempts = 0;
    const maxAttempts = 100;

    // First shape placed at center
    const firstShape = createRandomShape();
    firstShape.translate(width/2, height/2);
    shapes.push(firstShape);
    
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

    if (shapes.length < MIN_SHAPES) {
        return createFallbackShape(width, height);
    }

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