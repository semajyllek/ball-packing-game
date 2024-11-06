type Point = [number, number];
type Shape = Point[];

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

const createSemiCircle = (x: number, y: number, radius: number): Shape => {
  const points: Shape = [];
  for (let i = 0; i <= 8; i++) {
    const angle = (Math.PI * i) / 8;
    points.push([
      x + Math.cos(angle) * radius,
      y + Math.sin(angle) * radius
    ]);
  }
  return points;
};

const joinShapes = (shape1: Shape, shape2: Shape): Shape => {
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
  
  const combined = [
    ...shape1.slice(0, connect1),
    ...shape2.slice(connect2),
    ...shape2.slice(0, connect2),
    ...shape1.slice(connect1)
  ];
  
  const simplified: Shape = [];
  const minDistSq = 25;
  
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

const addSpouts = (shape: Shape): Shape => {
  const numSpouts = 2 + Math.floor(Math.random() * 2);
  const spoutIndices = new Set<number>();
  
  const sortedIndices = shape.map((_, i) => i)
    .sort((a, b) => shape[a][1] - shape[b][1])
    .slice(0, Math.ceil(shape.length / 2));
  
  while (spoutIndices.size < numSpouts) {
    const index = sortedIndices[Math.floor(Math.random() * sortedIndices.length)];
    spoutIndices.add(index);
  }
  
  return shape.map((point, i) => 
    spoutIndices.has(i) ? [point[0], point[1] - 2] : point
  );
};

export const generateCompoundShape = (width: number, height: number): number[][] => {
  // Start from left side and work towards right
  let currentX = width * 0.1;
  let currentY = height * 0.3;
  let combinedShape: Shape;
  
  // Create 4-8 shapes spread across the canvas
  const numShapes = 4 + Math.floor(Math.random() * 5);
  const baseSize = Math.min(width, height) * 0.15;
  
  // Start with first shape
  combinedShape = createRect(currentX, currentY, baseSize * 0.8, baseSize * 0.6);
  
  for (let i = 1; i < numShapes; i++) {
    // Move right and vary Y position
    currentX += baseSize * (0.8 + Math.random() * 1.2);
    currentY += (Math.random() - 0.5) * baseSize * 1.5;
    
    // Keep Y within bounds
    currentY = Math.max(height * 0.2, Math.min(height * 0.8, currentY));
    
    // Vary shape type and size
    const shapeSize = baseSize * (0.6 + Math.random() * 0.8);
    let newShape: Shape;
    
    const shapeType = Math.floor(Math.random() * 3);
    switch (shapeType) {
      case 0:
        newShape = createRect(currentX, currentY, shapeSize, shapeSize * 0.8);
        break;
      case 1:
        newShape = createTriangle(currentX, currentY, shapeSize);
        break;
      case 2:
        newShape = createSemiCircle(currentX, currentY, shapeSize/2);
        break;
      default:
        newShape = createRect(currentX, currentY, shapeSize, shapeSize);
    }
    
    combinedShape = joinShapes(combinedShape, newShape);
  }
  
  // If we have too many vertices, simplify by sampling
  if (combinedShape.length > 12) {
    const stride = Math.ceil(combinedShape.length / 12);
    combinedShape = combinedShape.filter((_, i) => i % stride === 0);
  }
  
  return addSpouts(combinedShape);
};