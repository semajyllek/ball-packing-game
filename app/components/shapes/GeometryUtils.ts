export type Point = [number, number];
export type LineSegment = {
    start: Point;
    end: Point;
};

// Constants for numerical stability
const EPSILON = 1e-10;
const INTERSECTION_THRESHOLD = 0.1;

export const findIntersection = (p1: Point, p2: Point, p3: Point, p4: Point): Point | null => {
    const x1 = p1[0], y1 = p1[1];
    const x2 = p2[0], y2 = p2[1];
    const x3 = p3[0], y3 = p3[1];
    const x4 = p4[0], y4 = p4[1];

    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

    if (Math.abs(denominator) < EPSILON) {
        return null;
    }

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return [
            Number((x1 + t * (x2 - x1)).toFixed(3)),
            Number((y1 + t * (y2 - y1)).toFixed(3))
        ];
    }

    return null;
};

export const pointsAreEqual = (p1: Point, p2: Point): boolean => {
    return Math.abs(p1[0] - p2[0]) < INTERSECTION_THRESHOLD &&
           Math.abs(p1[1] - p2[1]) < INTERSECTION_THRESHOLD;
};

export const isPointOnSegment = (point: Point, segStart: Point, segEnd: Point): boolean => {
    const withinBounds = 
        point[0] >= Math.min(segStart[0], segEnd[0]) - EPSILON &&
        point[0] <= Math.max(segStart[0], segEnd[0]) + EPSILON &&
        point[1] >= Math.min(segStart[1], segEnd[1]) - EPSILON &&
        point[1] <= Math.max(segStart[1], segEnd[1]) + EPSILON;

    if (!withinBounds) return false;

    const cross = 
        (point[1] - segStart[1]) * (segEnd[0] - segStart[0]) -
        (point[0] - segStart[0]) * (segEnd[1] - segStart[1]);

    return Math.abs(cross) < EPSILON;
};

export const isPointInsideShape = (point: Point, vertices: Point[]): boolean => {
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

export const getShapeEdges = (vertices: Point[]): LineSegment[] => {
    const edges: LineSegment[] = [];
    
    for (let i = 0; i < vertices.length; i++) {
        edges.push({
            start: vertices[i],
            end: vertices[(i + 1) % vertices.length]
        });
    }
    
    return edges;
};

export const calculateCentroid = (points: Point[]): Point => {
    const x = points.reduce((sum, p) => sum + p[0], 0) / points.length;
    const y = points.reduce((sum, p) => sum + p[1], 0) / points.length;
    return [x, y];
};