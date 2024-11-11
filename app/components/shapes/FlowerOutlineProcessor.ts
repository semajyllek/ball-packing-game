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

// Constants for outline processing
const MIN_SEGMENT_LENGTH = 5;  // Minimum length between points
const MAX_SEGMENT_LENGTH = 15; // Maximum length between points
const SMOOTHING_FACTOR = 0.25; // Controls curve smoothness (0-1)
const BORDER_PADDING = 2;      // Pixels to consider as border

export const processImageOutline = (imageData: ImageData): Point[] => {
    const width = imageData.width;
    const height = imageData.height;
    const visited = new Set<string>();
    const outline: Point[] = [];
    
    // Find the first white pixel (starting point)
    let startPoint: Point | null = null;
    for (let y = 0; y < height && !startPoint; y++) {
        for (let x = 0; x < width && !startPoint; x++) {
            const idx = (y * width + x) * 4;
            if (isWhitePixel(imageData.data, idx)) {
                startPoint = [x, y];
            }
        }
    }
    
    if (!startPoint) return [];

    // Trace the outline using Moore neighborhood tracing
    const traceOutline = (start: Point) => {
        let current: Point = [start[0], start[1]];
        let direction = 0; // 0: right, 1: down, 2: left, 3: up
        
        do {
            const key = `${current[0]},${current[1]}`;
            if (!visited.has(key)) {
                outline.push([current[0], current[1]]);
                visited.add(key);
            }
            
            // Check neighbors in clockwise order starting from current direction
            let found = false;
            for (let i = 0; i < 8; i++) {
                const neighbor = getNeighborPoint(current, (direction + i) % 8);
                if (isValidOutlinePoint(neighbor, imageData, width, height)) {
                    current = [neighbor[0], neighbor[1]];
                    direction = (direction + i) % 8;
                    found = true;
                    break;
                }
            }
            
            if (!found) break;
            
        } while (current[0] !== start[0] || current[1] !== start[1]);
    };
    
    traceOutline(startPoint);
    
    // Enhance the outline with additional processing steps
    const enhancedOutline = enhanceOutline(outline, width, height);
    const smoothOutline = smoothPoints(enhancedOutline);
    const finalOutline = resamplePoints(smoothOutline);
    
    return finalOutline;
};

// Helper functions
const isWhitePixel = (data: Uint8ClampedArray, idx: number): boolean => {
    return data[idx] > 200 && data[idx + 1] > 200 && data[idx + 2] > 200;
};

const getNeighborPoint = (point: Point, direction: number): Point => {
    const directions: Point[] = [
        [1, 0], [1, 1], [0, 1], [-1, 1],
        [-1, 0], [-1, -1], [0, -1], [1, -1]
    ];
    return [
        point[0] + directions[direction][0],
        point[1] + directions[direction][1]
    ];
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

const enhanceOutline = (points: Point[], width: number, height: number): Point[] => {
    const enhanced: Point[] = [];
    
    for (let i = 0; i < points.length; i++) {
        const current = points[i];
        const next = points[(i + 1) % points.length];
        
        enhanced.push([current[0], current[1]]);
        
        // Calculate distance to next point
        const dx = next[0] - current[0];
        const dy = next[1] - current[1];
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Add intermediate points if distance is too large
        if (distance > MAX_SEGMENT_LENGTH) {
            const steps = Math.ceil(distance / MIN_SEGMENT_LENGTH);
            for (let j = 1; j < steps; j++) {
                const t = j / steps;
                enhanced.push([
                    current[0] + dx * t,
                    current[1] + dy * t
                ]);
            }
        }
    }
    
    return enhanced;
};

const smoothPoints = (points: Point[]): Point[] => {
    const smoothed: Point[] = [];
    const n = points.length;
    
    for (let i = 0; i < n; i++) {
        const prev = points[(i - 1 + n) % n];
        const curr = points[i];
        const next = points[(i + 1) % n];
        
        // Calculate centroid of three consecutive points
        const centerX = (prev[0] + curr[0] + next[0]) / 3;
        const centerY = (prev[1] + curr[1] + next[1]) / 3;
        
        // Interpolate between original point and centroid
        smoothed.push([
            curr[0] * (1 - SMOOTHING_FACTOR) + centerX * SMOOTHING_FACTOR,
            curr[1] * (1 - SMOOTHING_FACTOR) + centerY * SMOOTHING_FACTOR
        ]);
    }
    
    return smoothed;
};

const resamplePoints = (points: Point[]): Point[] => {
    const resampled: Point[] = [];
    let accumDistance = 0;
    
    for (let i = 0; i < points.length; i++) {
        const current = points[i];
        const next = points[(i + 1) % points.length];
        
        resampled.push([current[0], current[1]]);
        
        const dx = next[0] - current[0];
        const dy = next[1] - current[1];
        const segmentLength = Math.sqrt(dx * dx + dy * dy);
        
        accumDistance += segmentLength;
        
        // Add intermediate points to maintain minimum segment length
        if (segmentLength > MIN_SEGMENT_LENGTH) {
            const steps = Math.floor(segmentLength / MIN_SEGMENT_LENGTH);
            for (let j = 1; j < steps; j++) {
                const t = j / steps;
                resampled.push([
                    current[0] + dx * t,
                    current[1] + dy * t
                ]);
            }
        }
    }
    
    return resampled;
};

export const normalizeOutline = (
    points: Point[],
    targetWidth: number,
    targetHeight: number
): EnhancedOutline => {
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