import { Point, LineSegment, findIntersection, isPointInsideShape, 
	getShapeEdges, calculateCentroid } from './GeometryUtils';
import { Shape } from './ShapeClasses';

// Get all edges from all shapes
const getAllShapeEdges = (shapes: Shape[]): LineSegment[] => {
return shapes.flatMap(shape => getShapeEdges(shape.vertices));
};

// Check if an edge belongs to a shape
const isEdgeFromShape = (edge: LineSegment, shape: Shape): boolean => {
return shape.vertices.some(vertex => 
   (vertex[0] === edge.start[0] && vertex[1] === edge.start[1]) ||
   (vertex[0] === edge.end[0] && vertex[1] === edge.end[1])
);
};

// Get the midpoint of an edge
const getEdgeMidpoint = (edge: LineSegment): Point => {
return [
   (edge.start[0] + edge.end[0]) / 2,
   (edge.start[1] + edge.end[1]) / 2
];
};

// Check if an edge is inside any other shape
const isEdgeVisible = (edge: LineSegment, shapes: Shape[]): boolean => {
const midpoint = getEdgeMidpoint(edge);

return !shapes.some(shape => {
   // Skip the shape that owns this edge
   if (isEdgeFromShape(edge, shape)) {
	   return false;
   }
   // Check if midpoint is inside the shape
   return isPointInsideShape(midpoint, shape.vertices);
});
};

// Find all intersection points between edges
const findIntersectionPoints = (edges: LineSegment[]): Point[] => {
const intersections: Point[] = [];

for (let i = 0; i < edges.length; i++) {
   for (let j = i + 1; j < edges.length; j++) {
	   const intersection = findIntersection(
		   edges[i].start, edges[i].end,
		   edges[j].start, edges[j].end
	   );
	   
	   if (intersection) {
		   intersections.push(intersection);
	   }
   }
}

return intersections;
};

// Collect unique points from edges and intersections
const collectUniquePoints = (edges: LineSegment[], intersections: Point[]): Point[] => {
const uniquePoints = new Map<string, Point>();

// Add edge endpoints
edges.forEach(edge => {
   [edge.start, edge.end].forEach(point => {
	   const key = `${point[0].toFixed(1)},${point[1].toFixed(1)}`;
	   uniquePoints.set(key, point);
   });
});

// Add intersections
intersections.forEach(point => {
   const key = `${point[0].toFixed(1)},${point[1].toFixed(1)}`;
   uniquePoints.set(key, point);
});

return Array.from(uniquePoints.values());
};

// Sort points in clockwise order
const sortPointsClockwise = (points: Point[]): Point[] => {
const center = calculateCentroid(points);

return [...points].sort((a, b) => {
   const angleA = Math.atan2(a[1] - center[1], a[0] - center[0]);
   const angleB = Math.atan2(b[1] - center[1], b[0] - center[0]);
   return angleA - angleB;
});
};

// Main merge function that uses all the helper functions
export const mergeShapes = (shapes: Shape[]): Point[] => {
// Handle simple cases
if (shapes.length === 0) return [];
if (shapes.length === 1) return [...shapes[0].vertices];

// Get all edges from all shapes
const allEdges = getAllShapeEdges(shapes);

// Filter out invisible edges
const visibleEdges = allEdges.filter(edge => 
   isEdgeVisible(edge, shapes)
);

// Find intersections between visible edges
const intersections = findIntersectionPoints(visibleEdges);

// Collect all unique points
const uniquePoints = collectUniquePoints(visibleEdges, intersections);

// Sort points to form the outline
return sortPointsClockwise(uniquePoints);
};