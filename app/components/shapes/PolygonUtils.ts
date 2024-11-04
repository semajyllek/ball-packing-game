export const triangulate = (vertices: number[][]): number[][][] => {
	// Find center point
	const centerX = vertices.reduce((sum, v) => sum + v[0], 0) / vertices.length;
	const centerY = vertices.reduce((sum, v) => sum + v[1], 0) / vertices.length;
	const centerPoint: number[] = [centerX, centerY];
  
	// Sort vertices by angle from center
	const sortedVertices = [...vertices].sort((a, b) => {
	  const angleA = Math.atan2(a[1] - centerY, a[0] - centerX);
	  const angleB = Math.atan2(b[1] - centerY, b[0] - centerX);
	  return angleA - angleB;
	});
  
	// Create triangles
	const triangles: number[][][] = [];
	for (let i = 0; i < sortedVertices.length; i++) {
	  const nextI = (i + 1) % sortedVertices.length;
	  triangles.push([
		centerPoint,
		sortedVertices[i],
		sortedVertices[nextI]
	  ]);
	}
  
	return triangles;
  };