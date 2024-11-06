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
  const result = [...shape1];
  const reorderedShape2 = [
    ...shape2.slice(connect2),
    ...shape2.slice(0, connect2)
  ];
  
  // Only add points that maintain shape without creating internal lines
  return [...shape1, ...reorderedShape2.slice(1)];
};

// Select 2-3 vertices as spouts
const selectSpouts = (vertices: Shape): Point[] => {
  const numSpouts = 2 + Math.floor(Math.random() * 2);
  const indices = new Set<number>();
  
  while (indices.size < numSpouts) {
    indices.add(Math.floor(Math.random() * vertices.length));
  }
  
  return Array.from(indices).map(i => vertices[i]);
};

export const generateCompoundShape = (width: number, height: number): number[][] => {
  const scale = Math.min(width, height) * 0.3;
  const center: Point = [width/2, height/2];
  
  // Create 2-3 basic shapes
  const numShapes = 2 + Math.floor(Math.random() * 2);
  let shapes: Shape[] = [];
  
  // First shape at center
  shapes.push(Math.random() > 0.5 ? 
    createRect(center[0], center[1], scale * 0.5, scale * 0.4) :
    createTriangle(center[0], center[1], scale * 0.5)
  );
  
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
    shapes[0] = joinShapes(shapes[0], newShape);
  }
  
  // Select spouts from corners
  const spouts = selectSpouts(shapes[0]);
  
  return shapes[0];
};