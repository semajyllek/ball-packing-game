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
      // Use far fewer segments for circle
      return new Circle(x, y, radius, 6);
    case 2:
      const size = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
      return new Triangle(x, y, size);
    default:
      const starRadius = (MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)) / 2;
      // Use fewer points for star
      return new Star(x, y, starRadius, 3);
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

const selectThreeVertices = (points: Point[]): Point[] => {
  // Prefer highest points for better gameplay
  const sortedPoints = [...points].sort((a, b) => a[1] - b[1]);
  const numPoints = Math.min(3, sortedPoints.length);
  
  // Take 2-3 points from the top half
  const topHalf = sortedPoints.slice(0, Math.ceil(sortedPoints.length / 2));
  const selectedPoints: Point[] = [];
  
  while (selectedPoints.length < numPoints && topHalf.length > 0) {
    const randomIndex = Math.floor(Math.random() * topHalf.length);
    selectedPoints.push(topHalf[randomIndex]);
    topHalf.splice(randomIndex, 1);
  }
  
  return selectedPoints;
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
  
  // Collect all unique vertices
  const uniquePoints = new Map<string, Point>();
  shapes.forEach(shape => {
    shape.vertices.forEach(vertex => {
      const key = `${vertex[0].toFixed(1)},${vertex[1].toFixed(1)}`;
      uniquePoints.set(key, vertex);
    });
  });
  
  // Select only three vertices for spouts
  return selectThreeVertices(Array.from(uniquePoints.values()));
};