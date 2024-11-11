export type Point = [number, number];
export type LineSegment = {
    start: Point;
    end: Point;
};

// Constants for numerical stability
const EPSILON = 1e-10;

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

export const pointsAreEqual = (p1: Point, p2: Point, epsilon: number = EPSILON): boolean => {
    return Math.abs(p1[0] - p2[0]) < epsilon &&
           Math.abs(p1[1] - p2[1]) < epsilon;
};