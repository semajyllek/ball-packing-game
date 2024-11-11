import { Point } from './GeometryUtils';

interface EnhancedOutline {
    vertices: Point[];
    bounds: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
}

export const processImageOutline = (imageData: ImageData): Point[] => {
    console.log('Processing image outline:', imageData.width, 'x', imageData.height);
    const width = imageData.width;
    const height = imageData.height;
    const visited = new Set<string>();
    const outline: Point[] = [];
    
    // Find leftmost white pixel as starting point
    let startPoint: Point | null = null;
    for (let y = 0; y < height && !startPoint; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            if (isWhitePixel(imageData.data, idx)) {
                startPoint = [x, y];
                break;
            }
        }
    }
    
    if (!startPoint) {
        console.log('No start point found');
        return [];
    }

    console.log('Starting trace from:', startPoint);

    // Moore neighborhood tracing algorithm
    const directionOffsets: Point[] = [
        [1, 0],   // right
        [1, 1],   // down-right
        [0, 1],   // down
        [-1, 1],  // down-left
        [-1, 0],  // left
        [-1, -1], // up-left
        [0, -1],  // up
        [1, -1]   // up-right
    ];

    let current = [...startPoint];
    let backtrackDir = 5; // Start looking up-left
    
    do {
        // Add current point if not visited
        const key = `${current[0]},${current[1]}`;
        if (!visited.has(key)) {
            outline.push([current[0], current[1]]);
            visited.add(key);
        }

        // Look for next white pixel, starting from backtrack direction
        let found = false;
        for (let i = 0; i < 8; i++) {
            const checkDir = (backtrackDir + i) % 8;
            const next: Point = [
                current[0] + directionOffsets[checkDir][0],
                current[1] + directionOffsets[checkDir][1]
            ];

            if (isValidOutlinePoint(next, imageData, width, height)) {
                // Update backtrack direction for next iteration
                // This ensures we continue following the boundary
                backtrackDir = (checkDir + 4) % 8;
                current = next;
                found = true;
                break;
            }
        }

        if (!found) {
            console.log('Trace terminated - no valid neighbors found');
            break;
        }

    } while (!(current[0] === startPoint[0] && current[1] === startPoint[1]) && 
             outline.length < width * height);

    console.log('Trace complete, points found:', outline.length);

    // Reduce number of points while maintaining shape
    const simplified = simplifyPoints(outline);
    console.log('Simplified to points:', simplified.length);

    return simplified;
};

const isWhitePixel = (data: Uint8ClampedArray, idx: number): boolean => {
    const threshold = 200;
    return data[idx] > threshold && data[idx + 1] > threshold && data[idx + 2] > threshold;
};

const isValidOutlinePoint = (
    point: Point,
    imageData: ImageData,
    width: number,
    height: number
): boolean => {
    if (point[0] < 0 || point[0] >= width || point[1] < 0 || point[1] >= height) {
        return false;
    }
    
    const idx = (point[1] * width + point[0]) * 4;
    return isWhitePixel(imageData.data, idx);
};

// Simplify points using distance-based reduction
const simplifyPoints = (points: Point[]): Point[] => {
    if (points.length <= 3) return points;
    
    const simplified: Point[] = [points[0]];
    let lastPoint = points[0];
    const minDistance = 5; // Minimum distance between points
    
    for (let i = 1; i < points.length; i++) {
        const dx = points[i][0] - lastPoint[0];
        const dy = points[i][1] - lastPoint[1];
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance >= minDistance) {
            simplified.push(points[i]);
            lastPoint = points[i];
        }
    }
    
    // Ensure we close the loop if needed
    const first = simplified[0];
    const last = simplified[simplified.length - 1];
    const dx = last[0] - first[0];
    const dy = last[1] - first[1];
    if (Math.sqrt(dx * dx + dy * dy) > minDistance) {
        simplified.push(first);
    }
    
    return simplified;
};

export const normalizeOutline = (
    points: Point[],
    targetWidth: number,
    targetHeight: number
): EnhancedOutline => {
    if (points.length === 0) {
        return {
            vertices: [],
            bounds: { minX: 0, minY: 0, maxX: targetWidth, maxY: targetHeight }
        };
    }

    // Find bounds
    const bounds = points.reduce((acc, [x, y]) => ({
        minX: Math.min(acc.minX, x),
        minY: Math.min(acc.minY, y),
        maxX: Math.max(acc.maxX, x),
        maxY: Math.max(acc.maxY, y)
    }), {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity
    });
    
    const scaleX = targetWidth / (bounds.maxX - bounds.minX);
    const scaleY = targetHeight / (bounds.maxY - bounds.minY);
    const scale = Math.min(scaleX, scaleY) * 0.8;
    
    const normalized = points.map(([x, y]): Point => [
        (x - bounds.minX) * scale + (targetWidth - (bounds.maxX - bounds.minX) * scale) / 2,
        (y - bounds.minY) * scale + (targetHeight - (bounds.maxY - bounds.minY) * scale) / 2
    ]);
    
    return {
        vertices: normalized,
        bounds: {
            minX: bounds.minX * scale,
            minY: bounds.minY * scale,
            maxX: bounds.maxX * scale,
            maxY: bounds.maxY * scale
        }
    };
};

export const selectSpoutPoints = (vertices: Point[], numSpouts: number = 3): Point[] => {
    if (vertices.length < numSpouts) return vertices;
    
    const spouts: Point[] = [];
    const step = Math.floor(vertices.length / numSpouts);
    
    for (let i = 0; i < numSpouts; i++) {
        const index = (i * step) % vertices.length;
        spouts.push([vertices[index][0], vertices[index][1]]);
    }
    
    return spouts;
};