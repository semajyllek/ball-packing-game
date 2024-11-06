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

export const generateCompoundShape = (width: number, height: number): number[][] => {
  const scale = Math.min(width, height) * 0.3;
  const center: Point = [width/2, height/2];
  
  // Create 2-3 basic shapes
  const numShapes = 2 + Math.floor(Math.random() * 2);
  let combinedShape: Shape;
  
  // First shape at center
  combinedShape = Math.random() > 0.5 ? 
    createRect(center[0], center[1], scale * 0.5, scale * 0.4) :
    createTriangle(center[0], center[1], scale * 0.5);
  
  // Add additional shapes
  for (let i = 1; i < numShapes; i++) {
    const angle = (Math.PI * 2 * i) / numShapes;
    const offset = scale * 0.4;
    const pos: Point = [
      center[0] + Math.cos(angle) * offset,
      center[1] + Math.sin(angle) * offset
    ];
    
    const newShape = Math.random() > 0.5 ?
      createRect(pos[0], pos[1], scale * 0.3, scale * 0.3) :
      createTriangle(pos[0], pos[1], scale * 0.3);
    
    // Join with existing shape
    combinedShape = joinShapes(combinedShape, newShape);
  }
  
  // If we have too many vertices, simplify by sampling
  if (combinedShape.length > 10) {
    const stride = Math.ceil(combinedShape.length / 10);
    combinedShape = combinedShape.filter((_, i) => i % stride === 0);
  }
  
  return combinedShape;
};