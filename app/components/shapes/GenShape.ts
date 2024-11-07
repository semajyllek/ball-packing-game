import { Point, Shape, Rectangle, Circle, Triangle, Star } from './ShapeClasses';


const MAX_OBJECTS = 10;
const MIN_SIZE = 30;
const MAX_SIZE = 80;

const createRandomShape = (): Shape => {
  const shapeType = Math.floor(Math.random() * 4);
  const x = 0;
  const y = 0;
  
  switch (shapeType) {
    case 0:
      const width = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
      const height = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
      return new Rectangle(x, y, width, height);
    case 1:
      const radius = (MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)) / 2;
      return new Circle(x, y, radius, 16);
    case 2:
      const size = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
      return new Triangle(x, y, size);
    default:
      const starRadius = (MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)) / 2;
      return new Star(x, y, starRadius, 5);
  }
};

const placeFirstShape = (shape: Shape, width: number, height: number): void => {
  const margin = MAX_SIZE;
  const x = margin + Math.random() * (width - 2 * margin);
  const y = margin + Math.random() * (height - 2 * margin);
  shape.translate(x, y);
};

const placeOverlappingShape = (newShape: Shape, existingShape: Shape, width: number, height: number): boolean => {
  const existingBounds = existingShape.getBounds();
  const margin = MAX_SIZE;
  
  for (let attempt = 0; attempt < 50; attempt++) {
    // Pick a random point within the existing shape's bounds
    const x = existingBounds.minX + (existingBounds.maxX - existingBounds.minX) * Math.random();
    const y = existingBounds.minY + (existingBounds.maxY - existingBounds.minY) * Math.random();
    
    newShape.translate(x, y);
    const newBounds = newShape.getBounds();
    
    // Check if the new shape is within game bounds
    if (newBounds.minX < margin || newBounds.maxX > width - margin || 
        newBounds.minY < margin || newBounds.maxY > height - margin) {
      newShape.translate(-x, -y); // Reset position
      continue;
    }
    
    // Check for overlap
    const hasOverlap = !(newBounds.maxX < existingBounds.minX || 
                        newBounds.minX > existingBounds.maxX ||
                        newBounds.maxY < existingBounds.minY || 
                        newBounds.minY > existingBounds.maxY);
                        
    if (hasOverlap) {
      return true;
    }
    
    newShape.translate(-x, -y); // Reset position
  }
  
  return false;
};

const mergeShapes = (shapes: Shape[]): Point[] => {
  const allPoints = new Set<string>();
  const internalPoints = new Set<string>();
  
  shapes.forEach(shape => {
    shape.vertices.forEach(point => {
      const key = `${point[0].toFixed(1)},${point[1].toFixed(1)}`;
      if (allPoints.has(key)) {
        internalPoints.add(key);
      } else {
        allPoints.add(key);
      }
    });
  });
  
  return Array.from(allPoints)
    .filter(key => !internalPoints.has(key))
    .map(key => {
      const [x, y] = key.split(',').map(Number);
      return [x, y];
    });
};

const selectSpouts = (vertices: Point[]): Point[] => {
  const numSpouts = 2 + Math.floor(Math.random() * 2);
  const sortedByHeight = [...vertices].sort((a, b) => a[1] - b[1]);
  const topThird = sortedByHeight.slice(0, Math.floor(vertices.length / 3));
  
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
  
  // Create and place first shape
  const firstShape = createRandomShape();
  placeFirstShape(firstShape, width, height);
  shapes.push(firstShape);
  
  // Add remaining shapes with overlap
  for (let i = 1; i < numShapes; i++) {
    const newShape = createRandomShape();
    const existingShapeIndex = Math.floor(Math.random() * shapes.length);
    
    if (placeOverlappingShape(newShape, shapes[existingShapeIndex], width, height)) {
      shapes.push(newShape);
    }
  }
  
  // Get outline vertices
  const outlineVertices = mergeShapes(shapes);
  const spouts = selectSpouts(outlineVertices);
  
  // Mark spouts by slightly offsetting them up
  return outlineVertices.map(vertex => {
    const isSpout = spouts.some(spout => 
      spout[0] === vertex[0] && spout[1] === vertex[1]
    );
    return isSpout ? [vertex[0], vertex[1] - 2] : vertex;
  });
};