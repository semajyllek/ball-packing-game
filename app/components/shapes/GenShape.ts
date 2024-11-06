// Basic shape definitions and utilities
interface Shape {
	vertices: number[][];
	center: [number, number];
	rotation: number;
  }
  
  interface ShapeParams {
	x: number;
	y: number;
	width: number;
	height: number;
	rotation?: number;
  }
  
  // Generate basic shapes
  const createRect = ({ x, y, width, height, rotation = 0 }: ShapeParams): Shape => {
	const halfW = width / 2;
	const halfH = height / 2;
	const vertices = [
	  [-halfW, -halfH],
	  [halfW, -halfH],
	  [halfW, halfH],
	  [-halfW, halfH]
	].map(([px, py]) => {
	  const rotatedX = px * Math.cos(rotation) - py * Math.sin(rotation);
	  const rotatedY = px * Math.sin(rotation) + py * Math.cos(rotation);
	  return [rotatedX + x, rotatedY + y];
	});
	
	return { vertices, center: [x, y], rotation };
  };
  
  const createTriangle = ({ x, y, width, height, rotation = 0 }: ShapeParams): Shape => {
	const halfW = width / 2;
	const vertices = [
	  [0, -height/2],
	  [halfW, height/2],
	  [-halfW, height/2]
	].map(([px, py]) => {
	  const rotatedX = px * Math.cos(rotation) - py * Math.sin(rotation);
	  const rotatedY = px * Math.sin(rotation) + py * Math.cos(rotation);
	  return [rotatedX + x, rotatedY + y];
	});
	
	return { vertices, center: [x, y], rotation };
  };
  
  const createCircle = ({ x, y, width, height }: ShapeParams): Shape => {
	const radius = Math.min(width, height) / 2;
	const segments = 12;
	const vertices = Array.from({ length: segments }, (_, i) => {
	  const angle = (i / segments) * Math.PI * 2;
	  return [
		x + Math.cos(angle) * radius,
		y + Math.sin(angle) * radius
	  ];
	});
	
	return { vertices, center: [x, y], rotation: 0 };
  };
  
  // Shape combination and manipulation
  const combineShapes = (shapes: Shape[]): number[][] => {
	// Convert shapes to a single vertex array while removing duplicates
	const uniqueVertices = new Map<string, number[]>();
	
	shapes.forEach(shape => {
	  shape.vertices.forEach(vertex => {
		const key = `${vertex[0].toFixed(1)},${vertex[1].toFixed(1)}`;
		uniqueVertices.set(key, vertex);
	  });
	});
	
	return Array.from(uniqueVertices.values());
  };
  
  
export const generateCompoundShape = (width: number, height: number): number[][] => {
	const shapes: Shape[] = [];
	const numShapes = 2 + Math.floor(Math.random() * 18); // 2-20 shapes
	
	// Start with a base shape
	const baseWidth = width * (0.3 + Math.random() * 0.4);
	const baseHeight = height * (0.3 + Math.random() * 0.4);
	const baseX = width / 2;
	const baseY = height / 2;
	
	shapes.push(createRect({
	  x: baseX,
	  y: baseY,
	  width: baseWidth,
	  height: baseHeight
	}));
	
	// Add additional shapes
	for (let i = 1; i < numShapes; i++) {
	  const prevShape = shapes[i - 1];
	  const { center: [prevX, prevY] } = prevShape;
	  
	  // Random position near previous shape
	  const angle = Math.random() * Math.PI * 2;
	  const distance = Math.min(width, height) * (0.1 + Math.random() * 0.2);
	  const x = prevX + Math.cos(angle) * distance;
	  const y = prevY + Math.sin(angle) * distance;
	  
	  // Random shape parameters
	  const shapeWidth = width * (0.1 + Math.random() * 0.3);
	  const shapeHeight = height * (0.1 + Math.random() * 0.3);
	  const rotation = Math.random() * Math.PI * 2;
	  
	  // Choose random shape type
	  const shapeType = Math.floor(Math.random() * 3);
	  let shape: Shape;
	  
	  switch (shapeType) {
		case 0:
		  shape = createRect({ x, y, width: shapeWidth, height: shapeHeight, rotation });
		  break;
		case 1:
		  shape = createTriangle({ x, y, width: shapeWidth, height: shapeHeight, rotation });
		  break;
		case 2:
		  shape = createCircle({ x, y, width: shapeWidth, height: shapeHeight });
		  break;
		default:
		  shape = createRect({ x, y, width: shapeWidth, height: shapeHeight, rotation });
	  }
	  
	  shapes.push(shape);
	}
	
	// Combine all shapes and ensure they're within bounds
	const vertices = combineShapes(shapes);
	
	// Scale and center the final shape
	const bounds = vertices.reduce(
	  (acc, [x, y]) => ({
		minX: Math.min(acc.minX, x),
		maxX: Math.max(acc.maxX, x),
		minY: Math.min(acc.minY, y),
		maxY: Math.max(acc.maxY, y)
	  }),
	  { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
	);
	
	const scaleX = (width * 0.8) / (bounds.maxX - bounds.minX);
	const scaleY = (height * 0.8) / (bounds.maxY - bounds.minY);
	const scale = Math.min(scaleX, scaleY);
	
	const centerX = (bounds.maxX + bounds.minX) / 2;
	const centerY = (bounds.maxY + bounds.minY) / 2;
	
	const finalVertices = vertices.map(([x, y]) => [
	  ((x - centerX) * scale + width / 2),
	  ((y - centerY) * scale + height / 2)
	]);
	
	// Select 2-4 vertices as spouts
	const numSpouts = 2 + Math.floor(Math.random() * 3);
	const spoutIndices = new Set<number>();
	
	while (spoutIndices.size < numSpouts) {
	  const index = Math.floor(Math.random() * finalVertices.length);
	  spoutIndices.add(index);
	}
	
	// Return only the vertices that are spouts or connect shapes
	return finalVertices.filter((_, index) => 
	  spoutIndices.has(index) || 
	  isConnectionPoint(finalVertices, index)
	);
  };
  
  // Helper to determine if a vertex is important for shape structure
  const isConnectionPoint = (vertices: number[][], index: number): boolean => {
	const vertex = vertices[index];
	let connections = 0;
	
	for (let i = 0; i < vertices.length; i++) {
	  if (i !== index) {
		const distance = Math.hypot(
		  vertices[i][0] - vertex[0],
		  vertices[i][1] - vertex[1]
		);
		if (distance < 20) connections++;
	  }
	}
	
	return connections > 1;
  };
  