import { Point, LineSegment, findIntersection, isPointInsideShape, 
    getShapeEdges, calculateCentroid } from './GeometryUtils';
import { Shape } from './ShapeClasses';

const getAllShapeEdges = (shapes: Shape[]): LineSegment[] => {
    return shapes.flatMap(shape => getShapeEdges(shape.vertices));
};

const isEdgeFromShape = (edge: LineSegment, shape: Shape): boolean => {
    return shape.vertices.some(vertex => 
        (vertex[0] === edge.start[0] && vertex[1] === edge.start[1]) ||
        (vertex[0] === edge.end[0] && vertex[1] === edge.end[1])
    );
};

const getEdgeMidpoint = (edge: LineSegment): Point => {
    return [
        (edge.start[0] + edge.end[0]) / 2,
        (edge.start[1] + edge.end[1]) / 2
    ];
};

const isEdgeVisible = (edge: LineSegment, shapes: Shape[]): boolean => {
    const midpoint = getEdgeMidpoint(edge);
    let containmentCount = 0;
    
    for (const shape of shapes) {
        // Only count containment if it's not from the shape that owns the edge
        if (!isEdgeFromShape(edge, shape) && isPointInsideShape(midpoint, shape.vertices)) {
            containmentCount++;
        }
    }

    // Edge is visible if it's not contained within other shapes
    return containmentCount === 0;
};

const findIntersectionPoints = (edges: LineSegment[]): Point[] => {
    const intersections: Point[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < edges.length; i++) {
        for (let j = i + 1; j < edges.length; j++) {
            const intersection = findIntersection(
                edges[i].start, edges[i].end,
                edges[j].start, edges[j].end
            );
            
            if (intersection) {
                const key = `${intersection[0].toFixed(1)},${intersection[1].toFixed(1)}`;
                if (!seen.has(key)) {
                    intersections.push(intersection);
                    seen.add(key);
                }
            }
        }
    }

    return intersections;
};

const collectUniquePoints = (edges: LineSegment[], intersections: Point[]): Point[] => {
    const uniquePoints = new Map<string, Point>();

    const addPoint = (point: Point) => {
        const key = `${point[0].toFixed(1)},${point[1].toFixed(1)}`;
        uniquePoints.set(key, point);
    };

    edges.forEach(edge => {
        addPoint(edge.start);
        addPoint(edge.end);
    });

    intersections.forEach(addPoint);

    return Array.from(uniquePoints.values());
};

const sortPointsClockwise = (points: Point[]): Point[] => {
    const center = calculateCentroid(points);
    
    return [...points].sort((a, b) => {
        const angleA = Math.atan2(a[1] - center[1], a[0] - center[0]);
        const angleB = Math.atan2(b[1] - center[1], b[0] - center[0]);
        
        if (Math.abs(angleA - angleB) < 0.0001) {
            // If angles are very close, sort by distance from center
            const distA = Math.hypot(a[0] - center[0], a[1] - center[1]);
            const distB = Math.hypot(b[0] - center[0], b[1] - center[1]);
            return distA - distB;
        }
        
        return angleA - angleB;
    });
};

export const mergeShapes = (shapes: Shape[]): Point[] => {
    if (shapes.length === 0) return [];
    if (shapes.length === 1) return [...shapes[0].vertices];

    const allEdges = getAllShapeEdges(shapes);
    const visibleEdges = allEdges.filter(edge => isEdgeVisible(edge, shapes));
    const intersections = findIntersectionPoints(visibleEdges);
    const uniquePoints = collectUniquePoints(visibleEdges, intersections);
    
    return sortPointsClockwise(uniquePoints);
};