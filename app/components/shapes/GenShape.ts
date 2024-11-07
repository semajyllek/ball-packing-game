import { Point, Shape, Rectangle, Circle, Triangle, Star } from './ShapeClasses';

// ... keep all the previous helper functions the same ...

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