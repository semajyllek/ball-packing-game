import { Point, Shape, Rectangle, Circle, Triangle, Star } from './ShapeClasses';

const MAX_OBJECTS = 10;
const MIN_SIZE = 30;
const MAX_SIZE = 80;

const createRandomShape = (gameWidth: number, gameHeight: number): Shape => {
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
      return new Circle(x, y, radius);
    case 2:
      const size = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
      return new Triangle(x, y, size);
    default:
      const starRadius = (MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)) / 2;
      return new Star(x, y, starRadius);
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
      shape.translate(-shape.x, -shape.y);  // Reset position
      attempts++;
      continue;
    }
    
    if (isFirst) return;  // First shape only needs to be in bounds
    
    // Check for overlap with at least one existing shape
    const hasOverlap = existingShapes.some(existing => {
      const existingBounds = existing.getBounds();
      return !(bounds.maxX < existingBounds.minX || 
               bounds.minX > existingBounds.maxX ||
               bounds.maxY < existingBounds.minY || 
               bounds.minY > existingBounds.maxY);
    });
    
    if (hasOverlap) return;
    
    shape.translate(-shape.x, -shape.y);  // Reset and try again
    attempts++;
  }
  
  // If we couldn't find a valid position, place it near the center
  shape.translate(gameWidth/2, gameHeight/2);
};

const mergeShapes = (shapes: Shape[]): Point[] => {
  const allPoints = new Map<string, Point>();
  
  shapes.forEach(shape => {
    shape.vertices.forEach(vertex => {
      const key = `${vertex[0].toFixed(1)},${vertex[1].toFixed(1)}`;
      allPoints.set(key, vertex);
    });
  });
  
  return Array.from(allPoints.values());
};

export const generateCompoundShape = (width: number, height: number): number[][] => {
  const numShapes = 2 + Math.floor(Math.random() * (MAX_OBJECTS - 1));
  const shapes: Shape[] = [];
  
  // Generate and place shapes
  for (let i = 0; i < numShapes; i++) {
    const shape = createRandomShape(width, height);
    findValidPosition(shape, shapes, width, height, i === 0);
    shapes.push(shape);
  }
  
  // Merge all shapes into single vertex list
  return mergeShapes(shapes);
};