import { Point, Shape, Rectangle, Circle, Triangle, Star } from './ShapeClasses';

const MAX_OBJECTS = 10;
const MIN_SIZE = 30;
const MAX_SIZE = 80;

const createRandomShape = (): Shape => {
  const shapeType = Math.floor(Math.random() * 4);
  const x = 0;  // Will be positioned later
  const y = 0;
  
  switch (shapeType) {
    case 0:
      const width = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
      const height = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
      return new Rectangle(x, y, width, height);
    case 1:
      const radius = (MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)) / 2;
      return new Circle(x, y, radius, 16); // More segments for smoother circles
    case 2:
      const size = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
      return new Triangle(x, y, size);
    default:
      const starRadius = (MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)) / 2;
      return new Star(x, y, starRadius, 5);
  }
};

const findValidPosition = (
  shape: Shape, 
  existingShapes: Shape[], 
  gameWidth: number, 
  gameHeight: number,
  isFirst: boolean
): void => {
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const x = Math.random() * gameWidth;
    const y = Math.random() * gameHeight;
    shape.translate(x - shape.x, y - shape.y);
    
    const bounds = shape.getBounds();
    const inBounds = bounds.minX >= 0 && bounds.maxX <= gameWidth && 
                    bounds.minY >= 0 && bounds.maxY <= gameHeight;
    
    if (!inBounds) {
      shape.translate(-shape.x, -shape.y);
      attempts++;
      continue;
    }
    
    if (isFirst) return;
    
    // Check for overlap with at least one existing shape
    const hasOverlap = existingShapes.some(existing => {
      const existingBounds = existing.getBounds();
      return !(bounds.maxX < existingBounds.minX || 
               bounds.minX > existingBounds.maxX ||
               bounds.maxY < existingBounds.minY || 
               bounds.minY > existingBounds.maxY);
    });
    
    if (hasOverlap) return;
    
    shape.translate(-shape.x, -shape.y);
    attempts++;
  }
  
  shape.translate(gameWidth/2, gameHeight/2);
};

const mergeShapes = (shapes: Shape[]): Point[] => {
  // Project all vertices onto a binary grid
  const gridSize = 400;
  const grid = Array(gridSize).fill(0).map(() => Array(gridSize).fill(false));
  
  // Fill grid with shapes
  shapes.forEach(shape => {
    shape.vertices.forEach((vertex, i) => {
      const nextVertex = shape.vertices[(i + 1) % shape.vertices.length];
      
      // Draw line between vertices
      const steps = 20; // Resolution of line drawing
      for (let t = 0; t < 1; t += 1/steps) {
        const x = Math.floor((vertex[0] * (1-t) + nextVertex[0] * t) / 400 * gridSize);
        const y = Math.floor((vertex[1] * (1-t) + nextVertex[1] * t) / 400 * gridSize);
        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
          grid[y][x] = true;
        }
      }
    });
  });
  
  // Extract outline points
  const outlinePoints: Point[] = [];
  const checkNeighbor = (x: number, y: number): boolean => {
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return false;
    return grid[y][x];
  };
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (!grid[y][x]) continue;
      
      // Check if point is on the outline
      const neighbors = [
        checkNeighbor(x-1, y),
        checkNeighbor(x+1, y),
        checkNeighbor(x, y-1),
        checkNeighbor(x, y+1)
      ];
      
      if (neighbors.includes(false)) {
        outlinePoints.push([x * 400 / gridSize, y * 400 / gridSize]);
      }
    }
  }
  
  return outlinePoints;
};

const selectSpouts = (vertices: Point[]): Point[] => {
  const numSpouts = 2 + Math.floor(Math.random() * 2); // 2 or 3 spouts
  const sortedByHeight = [...vertices].sort((a, b) => a[1] - b[1]);
  const topThird = sortedByHeight.slice(0, Math.floor(vertices.length / 3));
  
  // Randomly select points from the top third
  const spouts: Point[] = [];
  while (spouts.length < numSpouts && topThird.length > 0) {
    const index = Math.floor(Math.random() * topThird.length);
    spouts.push(topThird[index]);
    topThird.splice(index, 1);
  }
  
  return spouts;
};

export const generateCompoundShape = (width: number, height: number): number[][] => {
  const numShapes = 2 + Math.floor(Math.random() * (MAX_OBJECTS - 1));
  const shapes: Shape[] = [];
  
  // Generate and place shapes
  for (let i = 0; i < numShapes; i++) {
    const shape = createRandomShape();
    findValidPosition(shape, shapes, width, height, i === 0);
    shapes.push(shape);
  }
  
  // Get outline of combined shapes
  const outline = mergeShapes(shapes);
  
  // Select and return spout vertices
  return selectSpouts(outline);
};