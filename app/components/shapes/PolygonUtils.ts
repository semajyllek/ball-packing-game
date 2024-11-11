import { Point } from './GeometryUtils';

const area = (a: Point, b: Point, c: Point): number => {
    return (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
};

const isPointInTriangle = (point: Point, a: Point, b: Point, c: Point): boolean => {
    const area1 = area(point, a, b);
    const area2 = area(point, b, c);
    const area3 = area(point, c, a);
    
    // Point is inside if all areas have the same sign (ignoring zero)
    return (area1 >= 0 && area2 >= 0 && area3 >= 0) ||
           (area1 <= 0 && area2 <= 0 && area3 <= 0);
};

const isVertexEar = (i: number, vertices: Point[]): boolean => {
    const n = vertices.length;
    if (n < 3) return false;

    const prev = vertices[(i - 1 + n) % n];
    const curr = vertices[i];
    const next = vertices[(i + 1) % n];
    
    // Check if triangle formed by prev, curr, next is counterclockwise
    if (area(prev, curr, next) <= 0) return false;
    
    // Check if any other vertex lies inside this triangle
    for (let j = 0; j < vertices.length; j++) {
        if (j === i || j === ((i - 1 + n) % n) || j === ((i + 1) % n)) continue;
        if (isPointInTriangle(vertices[j], prev, curr, next)) return false;
    }
    
    return true;
};

export const triangulate = (vertices: Point[]): Point[][] => {
    if (vertices.length < 3) return [];
    
    // Make a copy so we can modify the vertices
    const remaining = [...vertices];
    const triangles: Point[][] = [];
    let attempts = 0;
    const maxAttempts = vertices.length * 2; // Prevent infinite loops
    
    while (remaining.length > 3 && attempts < maxAttempts) {
        let earFound = false;
        const n = remaining.length;
        
        for (let i = 0; i < n; i++) {
            if (isVertexEar(i, remaining)) {
                // Found an ear, clip it
                const prev = remaining[(i - 1 + n) % n];
                const curr = remaining[i];
                const next = remaining[(i + 1) % n];
                
                triangles.push([prev, curr, next]);
                remaining.splice(i, 1);
                earFound = true;
                break;
            }
        }
        
        if (!earFound) attempts++;
    }
    
    // Add the final triangle
    if (remaining.length === 3) {
        triangles.push(remaining);
    }
    
    return triangles;
};

// Helper function to verify triangulation covered the entire shape
export const validateTriangulation = (
    originalVertices: Point[], 
    triangles: Point[][]
): boolean => {
    // Check if all original vertices are used
    const allPoints = new Set(triangles.flat().map(p => `${p[0]},${p[1]}`));
    const allOriginal = new Set(originalVertices.map(p => `${p[0]},${p[1]}`));
    
    for (const point of allOriginal) {
        if (!allPoints.has(point)) return false;
    }
    
    // Check for overlapping triangles
    for (let i = 0; i < triangles.length; i++) {
        for (let j = i + 1; j < triangles.length; j++) {
            const tri1Center: Point = [
                (triangles[i][0][0] + triangles[i][1][0] + triangles[i][2][0]) / 3,
                (triangles[i][0][1] + triangles[i][1][1] + triangles[i][2][1]) / 3
            ];
            
            if (isPointInTriangle(
                tri1Center,
                triangles[j][0],
                triangles[j][1],
                triangles[j][2]
            )) {
                return false;
            }
        }
    }
    
    return true;
};