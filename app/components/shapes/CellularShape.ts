type Grid = number[][];

export const generateCAShape = (width: number, height: number): number[][] => {
  const gridSize = 40;
  const grid: Grid = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
  
  // Seed initial state with a more interesting shape
  const centerX = Math.floor(gridSize / 2);
  const centerY = Math.floor(gridSize / 2);
  const radius = Math.floor(gridSize / 4);
  
  // Create initial shape
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const dx = i - centerX;
      const dy = j - centerY;
      // Create an interesting base shape (can be modified for different results)
      const angle = Math.atan2(dy, dx);
      const baseRadius = radius * (1 + Math.sin(angle * 3) * 0.3); // Creates a 3-pointed star shape
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < baseRadius) {
        grid[i][j] = 1;
      }
    }
  }

  // Apply CA rules briefly to add some irregularity
  for (let gen = 0; gen < 2; gen++) {
    const newGrid = grid.map(row => [...row]);
    for (let i = 1; i < gridSize - 1; i++) {
      for (let j = 1; j < gridSize - 1; j++) {
        const neighbors = countNeighbors(grid, i, j);
        if (grid[i][j] === 1 && (neighbors < 3 || neighbors > 5)) {
          newGrid[i][j] = 0;
        } else if (grid[i][j] === 0 && neighbors >= 4) {
          newGrid[i][j] = 1;
        }
      }
    }
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        grid[i][j] = newGrid[i][j];
      }
    }
  }

  // Extract only the boundary vertices
  const boundaryPoints: number[][] = [];
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;
  
  // March around the boundary
  const visited = new Set<string>();
  let current: [number, number] | null = null;

  // Find first boundary point
  outer: for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (grid[i][j] === 1 && isEdgeCell(grid, i, j)) {
        current = [i, j];
        break outer;
      }
    }
  }

  if (!current) {
    // Fallback shape if no boundary found
    return [
      [200, 100],
      [300, 200],
      [200, 300],
      [100, 200]
    ];
  }

  // March around the boundary using Moore neighborhood
  const directions = [
    [-1, 0], [-1, 1], [0, 1], [1, 1],
    [1, 0], [1, -1], [0, -1], [-1, -1]
  ];
  
  const startPoint = `${current[0]},${current[1]}`;
  do {
    const [i, j] = current;
    const key = `${i},${j}`;
    
    if (!visited.has(key) && isEdgeCell(grid, i, j)) {
      visited.add(key);
      boundaryPoints.push([
        j * cellWidth + cellWidth/2,
        i * cellHeight + cellHeight/2
      ]);
    }

    // Find next boundary point
    let found = false;
    for (const [di, dj] of directions) {
      const ni = i + di;
      const nj = j + dj;
      const newKey = `${ni},${nj}`;
      if (ni >= 0 && ni < gridSize && nj >= 0 && nj < gridSize &&
          grid[ni][nj] === 1 && isEdgeCell(grid, ni, nj) &&
          !visited.has(newKey)) {
        current = [ni, nj];
        found = true;
        break;
      }
    }
    
    if (!found) break;
    
  } while (`${current[0]},${current[1]}` !== startPoint && boundaryPoints.length < 100);

  // Simplify the boundary points to reduce vertex count
  return simplifyBoundary(boundaryPoints);
};

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