type Grid = number[][];

export const generateCAShape = (width: number, height: number): number[][] => {
  const gridSize = 80; // Increased for more detail
  const grid: Grid = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
  
  // Create interesting initial pattern
  const centerX = gridSize / 2;
  const centerY = gridSize / 2;
  
  // Create a more complex seed pattern
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const dx = (i - centerX) / centerX;
      const dy = (j - centerY) / centerY;
      const dist = Math.sqrt(dx * dx + dy * dy) * 2;
      
      // Combine multiple mathematical functions for interesting shapes
      const spiral = Math.sin(dist * 8 + Math.atan2(dy, dx) * 2);
      const ripple = Math.cos(dist * 3);
      const noise = Math.random() * 0.2;
      
      if (dist < 0.8 && spiral + ripple + noise > 0.3) {
        grid[i][j] = 1;
      }
    }
  }

  // Apply CA rules for several generations
  for (let gen = 0; gen < 5; gen++) {
    const newGrid = grid.map(row => [...row]);
    for (let i = 1; i < gridSize - 1; i++) {
      for (let j = 1; j < gridSize - 1; j++) {
        const neighbors = countNeighbors(grid, i, j);
        // More organic rules
        if (grid[i][j] === 1 && (neighbors < 3 || neighbors > 5)) {
          newGrid[i][j] = 0;
        } else if (grid[i][j] === 0 && neighbors >= 4) {
          newGrid[i][j] = 1;
        }
      }
    }
    grid.forEach((row, i) => row.forEach((_, j) => grid[i][j] = newGrid[i][j]));
  }

  // Extract only the outer boundary using contour tracing
  const points: number[][] = [];
  let start: [number, number] | null = null;

  // Find starting point on the boundary
  for (let i = 0; i < gridSize && !start; i++) {
    for (let j = 0; j < gridSize && !start; j++) {
      if (grid[i][j] === 1) {
        start = [i, j];
      }
    }
  }

  if (!start) return defaultShape();

  // Moore neighborhood for 8-direction boundary tracing
  const directions: [number, number][] = [
    [-1,0], [-1,1], [0,1], [1,1], [1,0], [1,-1], [0,-1], [-1,-1]
  ];
  
  let current: [number, number] = start;
  const visited = new Set<string>();

  do {
    const [i, j] = current;
    const key = `${i},${j}`;

    if (!visited.has(key)) {
      const x = (j * width) / gridSize;
      const y = (i * height) / gridSize;
      points.push([x, y]);
      visited.add(key);
    }

    // Find next boundary point
    let nextFound = false;
    for (const [di, dj] of directions) {
      const ni = i + di;
      const nj = j + dj;
      if (ni >= 0 && ni < gridSize && nj >= 0 && nj < gridSize &&
          grid[ni][nj] === 1 && 
          !visited.has(`${ni},${nj}`) &&
          isEdgeCell(grid, ni, nj)) {
        current = [ni, nj];
        nextFound = true;
        break;
      }
    }

    if (!nextFound) break;
  } while (points.length < 200 && (current[0] !== start[0] || current[1] !== start[1]));

  // Smooth and simplify the boundary
  return smoothPoints(points);
};

const smoothPoints = (points: number[][]): number[][] => {
  if (points.length < 3) return defaultShape();

  // First pass: remove points that are too close
  const simplified: number[][] = [points[0]];
  const minDistance = 10;

  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - simplified[simplified.length - 1][0];
    const dy = points[i][1] - simplified[simplified.length - 1][1];
    if (dx * dx + dy * dy > minDistance * minDistance) {
      simplified.push(points[i]);
    }
  }

  // Second pass: smooth the remaining points
  const smoothed: number[][] = [];
  const windowSize = 3;
  
  for (let i = 0; i < simplified.length; i++) {
    let sumX = 0, sumY = 0, count = 0;
    for (let j = -windowSize; j <= windowSize; j++) {
      const idx = (i + j + simplified.length) % simplified.length;
      sumX += simplified[idx][0];
      sumY += simplified[idx][1];
      count++;
    }
    smoothed.push([sumX / count, sumY / count]);
  }

  return smoothed;
};

const defaultShape = (): number[][] => [
  [200, 100], [300, 200], [200, 300], [100, 200]
];

const simplifyBoundary = (points: number[][]): number[][] => {
  if (points.length <= 8) return points;
  
  const simplified: number[][] = [];
  const threshold = 20; // Minimum distance between points
  
  // Always keep the first point
  simplified.push(points[0]);
  
  for (let i = 1; i < points.length; i++) {
    const lastPoint = simplified[simplified.length - 1];
    const dx = points[i][0] - lastPoint[0];
    const dy = points[i][1] - lastPoint[1];
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > threshold) {
      simplified.push(points[i]);
    }
  }

  // Ensure the shape is closed
  const first = simplified[0];
  const last = simplified[simplified.length - 1];
  const dx = first[0] - last[0];
  const dy = first[1] - last[1];
  if (Math.sqrt(dx * dx + dy * dy) > threshold) {
    simplified.push(simplified[0]);
  }

  return simplified;
};

const countNeighbors = (grid: Grid, x: number, y: number): number => {
  let count = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      if (x + i >= 0 && x + i < grid.length && 
          y + j >= 0 && y + j < grid[0].length) {
        count += grid[x + i][y + j];
      }
    }
  }
  return count;
};

const isEdgeCell = (grid: Grid, x: number, y: number): boolean => {
  if (grid[x][y] === 0) return false;
  
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const ni = x + i;
      const nj = y + j;
      if (ni < 0 || ni >= grid.length || nj < 0 || nj >= grid[0].length ||
          grid[ni][nj] === 0) {
        return true;
      }
    }
  }
  return false;
};