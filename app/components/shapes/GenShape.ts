type Point = [number, number];
type Shape = Point[];

// Basic shape generators
const createRect = (x: number, y: number, width: number, height: number): Shape => {
  return [
    [x - width/2, y - height/2],
    [x + width/2, y - height/2],
    [x + width/2, y + height/2],
    [x - width/2, y + height/2]
  ];
};

const createTriangle = (x: number, y: number, size: number): Shape => {
  return [
    [x, y - size/2],
    [x + size/2, y + size/2],
    [x - size/2, y + size/2]
  ];
};

// Join two shapes by finding closest vertices
const joinShapes = (shape1: Shape, shape2: Shape): Shape => {
  // Find closest vertices between shapes
  let minDist = Infinity;
  let connect1 = 0, connect2 = 0;
  
  shape1.forEach((p1, i) => {
    shape2.forEach((p2, j) => {
      const dist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      if (dist < minDist) {
        minDist = dist;
        connect1 = i;
        connect2 = j;
      }
    });
  });
  
  // Merge shapes by connecting at these points
  const combined = [
    ...shape1.slice(0, connect1),
    ...shape2.slice(connect2),
    ...shape2.slice(0, connect2),
    ...shape1.slice(connect1)
  ];
  
  // Remove any points that are too close together
  const simplified: Shape = [];
  const minDistSq = 25; // 5 pixels squared
  
  for (let i = 0; i < combined.length; i++) {
    const p1 = combined[i];
    const p2 = combined[(i + 1) % combined.length];
    const distSq = Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2);
    if (distSq > minDistSq) {
      simplified.push(p1);
    }
  }
  
  return simplified;
};

// Pick spout locations and add them to vertices
const addSpouts = (shape: Shape): Shape => {
  const numSpouts = 2 + Math.floor(Math.random() * 2); // 2-3 spouts
  const spoutIndices = new Set<number>();
  
  // Prefer vertices that are higher up (better for gameplay)
  const sortedIndices = shape.map((_, i) => i)
    .sort((a, b) => shape[a][1] - shape[b][1])
    .slice(0, Math.ceil(shape.length / 2)); // Only consider top half
  
  // Select random indices from the top half
  while (spoutIndices.size < numSpouts) {
    const index = sortedIndices[Math.floor(Math.random() * sortedIndices.length)];
    spoutIndices.add(index);
  }
  
  // Mark spout vertices by slightly offsetting them
  return shape.map((point, i) => {
    if (spoutIndices.has(i)) {
      // Offset spout slightly upward to mark it
      return [point[0], point[1] - 2];
    }
    return point;
  });
};

export const generateCompoundShape = (width: number, height: number): number[][] => {
  const scale = Math.min(width, height) * 0.3;
  const center: Point = [width/2, height/2];
  
  // Create 2-10 basic shapes
  const numShapes = 2 + Math.floor(Math.random() * 9);
  let combinedShape: Shape;
  
  // First shape at center
  combinedShape = Math.random() > 0.5 ? 
    createRect(center[0], center[1], scale * 0.5, scale * 0.4) :
    createTriangle(center[0], center[1], scale * 0.5);
  
  // Add additional shapes
  for (let i = 1; i < numShapes; i++) {
    const angle = (Math.PI * 2 * i) / numShapes;
    const offset = scale * (0.3 + Math.random() * 0.2); // Vary the offset
    const pos: Point = [
      center[0] + Math.cos(angle) * offset,
      center[1] + Math.sin(angle) * offset
    ];
    
    // Vary the shape size
    const shapeScale = scale * (0.2 + Math.random() * 0.2);
    
    const newShape = Math.random() > 0.5 ?
      createRect(pos[0], pos[1], shapeScale, shapeScale * 0.8) :
      createTriangle(pos[0], pos[1], shapeScale);
    
    // Join with existing shape
    combinedShape = joinShapes(combinedShape, newShape);
  }
  
  // If we have too many vertices, simplify by sampling
  if (combinedShape.length > 10) {
    const stride = Math.ceil(combinedShape.length / 10);
    combinedShape = combinedShape.filter((_, i) => i % stride === 0);
  }
  
  // Add spouts and return final shape
  return addSpouts(combinedShape);
};