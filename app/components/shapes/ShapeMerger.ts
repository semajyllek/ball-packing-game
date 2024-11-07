import { Shape } from './ShapeClasses';
import { Point, LineSegment } from './GeometryUtils';

const asPoint = (arr: number[]): Point => {
    if (arr.length !== 2) {
        throw new Error('Invalid point coordinates');
    }
    return [arr[0], arr[1]];
};

const getEdgesFromShape = (shape: Shape): LineSegment[] => {
    const vertices = shape.getVertices().map(asPoint);
    const edges: LineSegment[] = [];
    
    for (let i = 0; i < vertices.length; i++) {
        const j = (i + 1) % vertices.length;
        edges.push({
            start: vertices[i],
            end: vertices[j]
        });
    }
    
    return edges;
};

const findIntersectionPoint = (edge1: LineSegment, edge2: LineSegment): Point | null => {
    const x1 = edge1.start[0], y1 = edge1.start[1];
    const x2 = edge1.end[0], y2 = edge1.end[1];
    const x3 = edge2.start[0], y3 = edge2.start[1];
    const x4 = edge2.end[0], y4 = edge2.end[1];
    
    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denominator) < 1e-10) return null;
    
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;
    
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return [
            x1 + t * (x2 - x1),
            y1 + t * (y2 - y1)
        ];
    }
    
    return null;
};

const findIntersections = (shapes: Shape[]): Point[] => {
    const intersections: Point[] = [];
    const allEdges = shapes.flatMap(getEdgesFromShape);
    
    for (let i = 0; i < allEdges.length; i++) {
        for (let j = i + 1; j < allEdges.length; j++) {
            const intersection = findIntersectionPoint(allEdges[i], allEdges[j]);
            if (intersection) {
                intersections.push(intersection);
            }
        }
    }
    
    return intersections;
};

export const isPointInShape = (point: Point, shape: Shape): boolean => {
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

const removeDuplicatePoints = (points: Point[], epsilon: number = 0.01): Point[] => {
    return points.filter((point, index, self) => {
        return self.findIndex((p2) => 
            Math.abs(p2[0] - point[0]) < epsilon && 
            Math.abs(p2[1] - point[1]) < epsilon
        ) === index;
    });
};

const countShapeContainment = (point: Point, shapes: Shape[]): number => {
    return shapes.reduce((count, shape) => 
        isPointInShape(point, shape) ? count + 1 : count, 0);
};

const calculateCentroid = (points: Point[]): { x: number, y: number } => {
    const sum = points.reduce((acc, point) => ({
        x: acc.x + point[0],
        y: acc.y + point[1]
    }), { x: 0, y: 0 });
    
    return {
        x: sum.x / points.length,
        y: sum.y / points.length
    };
};

const findLeftmostPoint = (points: Point[]): Point => {
    return points.reduce((leftmost, point) => 
        point[0] < leftmost[0] ? point : leftmost
    );
};

const calculateAngle = (point: Point, center: { x: number, y: number }): number => {
    return Math.atan2(point[1] - center.y, point[0] - center.x);
};

const findNextPointByAngle = (
    current: Point, 
    remaining: Point[], 
    center: { x: number, y: number }
): Point => {
    const currentAngle = calculateAngle(current, center);
    
    return remaining.reduce((next, vertex) => {
        const angle = calculateAngle(vertex, center);
        let angleDiff = angle - currentAngle;
        if (angleDiff < 0) angleDiff += Math.PI * 2;
        
        const nextAngle = calculateAngle(next, center);
        let nextDiff = nextAngle - currentAngle;
        if (nextDiff < 0) nextDiff += Math.PI * 2;
        
        return angleDiff < nextDiff ? vertex : next;
    });
};

const removePoint = (points: Point[], point: Point, epsilon: number = 0.01): Point[] => {
    const index = points.findIndex(p => 
        Math.abs(p[0] - point[0]) < epsilon && 
        Math.abs(p[1] - point[1]) < epsilon
    );
    
    if (index !== -1) {
        points.splice(index, 1);
    }
    return points;
};

const sortPointsInOrder = (points: Point[]): Point[] => {
    const sortedPoints: Point[] = [];
    const remainingPoints = [...points];
    
    // Start with leftmost point
    let current = findLeftmostPoint(remainingPoints);
    
    while (remainingPoints.length > 0) {
        sortedPoints.push(current);
        removePoint(remainingPoints, current);
        
        if (remainingPoints.length === 0) break;
        
        const center = calculateCentroid(sortedPoints);
        current = findNextPointByAngle(current, remainingPoints, center);
    }
    
    return sortedPoints;
};

const filterBoundaryPoints = (points: Point[], shapes: Shape[]): Point[] => {
    return points.filter(point => {
        const containCount = countShapeContainment(point, shapes);
        return containCount === 1;  // Keep points that are in exactly one shape
    });
};

export const mergeShapes = (shapes: Shape[]): Point[] => {
    // Get all vertices and intersection points
    const allVertices = shapes.flatMap(shape => shape.getVertices().map(asPoint));
    const intersections = findIntersections(shapes);
    const allPoints = [...allVertices, ...intersections];
    
    // Process points
    const uniquePoints = removeDuplicatePoints(allPoints);
    const boundaryPoints = filterBoundaryPoints(uniquePoints, shapes);
    const orderedPoints = sortPointsInOrder(boundaryPoints);
    
    return orderedPoints;
};