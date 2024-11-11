import { Point } from './GeometryUtils';

// Assuming outline data comes as array of [x,y] coordinates
export interface FlowerOutline {
    vertices: Point[];
    bounds: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
}

export const processImageOutline = (imageData: ImageData): Point[] => {
    const points: Point[] = [];
    const width = imageData.width;
    const height = imageData.height;
    
    // Scan the image data for white pixels (outline)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            // Check if pixel is white (255,255,255)
            if (imageData.data[idx] === 255 && 
                imageData.data[idx + 1] === 255 && 
                imageData.data[idx + 2] === 255) {
                points.push([x, y]);
            }
        }
    }
    
    // Simplify the outline by removing redundant points
    return simplifyOutline(points);
};

// Simplify outline using Ramer-Douglas-Peucker algorithm
const simplifyOutline = (points: Point[], epsilon: number = 2): Point[] => {
    if (points.length <= 2) return points;
    
    let maxDistance = 0;
    let maxIndex = 0;
    
    // Find point with maximum distance
    for (let i = 1; i < points.length - 1; i++) {
        const distance = perpendicularDistance(
            points[i], 
            points[0], 
            points[points.length - 1]
        );
        
        if (distance > maxDistance) {
            maxDistance = distance;
            maxIndex = i;
        }
    }
    
    // If max distance is greater than epsilon, recursively simplify
    if (maxDistance > epsilon) {
        const firstHalf = simplifyOutline(points.slice(0, maxIndex + 1), epsilon);
        const secondHalf = simplifyOutline(points.slice(maxIndex), epsilon);
        return [...firstHalf.slice(0, -1), ...secondHalf];
    }
    
    return [points[0], points[points.length - 1]];
};

const perpendicularDistance = (point: Point, start: Point, end: Point): number => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const mag = Math.sqrt(dx * dx + dy * dy);
    
    return Math.abs(
        ((end[0] - start[0]) * (start[1] - point[1])) -
        ((start[0] - point[0]) * (end[1] - start[1]))
    ) / mag;
};

export const normalizeOutline = (
    points: Point[], 
    targetWidth: number, 
    targetHeight: number
): FlowerOutline => {
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
    
    // Calculate scale factors
    const scaleX = targetWidth / (bounds.maxX - bounds.minX);
    const scaleY = targetHeight / (bounds.maxY - bounds.minY);
    const scale = Math.min(scaleX, scaleY) * 0.8; // 80% of available space
    
    // Normalize and center points
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
    const spouts: Point[] = [];
    const step = Math.floor(vertices.length / numSpouts);
    
    // Select evenly spaced points along the outline
    for (let i = 0; i < numSpouts; i++) {
        const index = (i * step) % vertices.length;
        spouts.push(vertices[index]);
    }
    
    return spouts;
};