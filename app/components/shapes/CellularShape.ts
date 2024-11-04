type Grid = number[][];

export const generateCAShape = (width: number, height: number): number[][] => {
  // Initialize grid
  const gridSize = 40;
  const grid: Grid = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
  
  // Seed initial state with a simple shape
  const centerX = Math.floor(gridSize / 2);
  const centerY = Math.floor(gridSize / 2);
  const radius = 10;
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const dx = i - centerX;
      const dy = j - centerY;
      if (dx * dx + dy * dy < radius * radius) {
        grid[i][j] = 1;
      }
    }
  }

  // Apply CA rules
  const newGrid = evolveGrid(grid);
  
  // Convert to vertices
  return gridToVertices(newGrid, width, height);
};

const evolveGrid = (grid: Grid): Grid => {
  const gridSize = grid.length;
  const newGrid = grid.map(row => [...row]);
  
  // Apply rules for several generations
  const generations = 3;
  
  for (let gen = 0; gen < generations; gen++) {
    for (let i = 1; i < gridSize - 1; i++) {
      for (let j = 1; j < gridSize - 1; j++) {
        const neighbors = countNeighbors(grid, i, j);
        
        // Custom CA rules for interesting shapes
        if (grid[i][j] === 1) {
          // Survival rules
          newGrid[i][j] = (neighbors >= 2 && neighbors <= 4) ? 1 : 0;
        } else {
          // Birth rules
          newGrid[i][j] = (neighbors === 3) ? 1 : 0;
        }
      }
    }
  }
  
  return newGrid;
};

const countNeighbors = (grid: Grid, x: number, y: number): number => {
  let count = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      count += grid[x + i][y + j] || 0;
    }
  }
  return count;
};

const gridToVertices = (grid: Grid, width: number, height: number): number[][] => {
  const vertices: number[][] = [];
  const gridSize = grid.length;
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;
  
  // March around the perimeter of the shape
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (grid[i][j] === 1 && isEdgeCell(grid, i, j)) {
        vertices.push([
          j * cellWidth + cellWidth/2,
          i * cellHeight + cellHeight/2
        ]);
      }
    }
  }
  
  return simplifyVertices(vertices);
};

const isEdgeCell = (grid: Grid, x: number, y: number): boolean => {
  if (x === 0 || x === grid.length - 1 || y === 0 || y === grid[0].length - 1) return true;
  
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      if (grid[x + i][y + j] === 0) return true;
    }
  }
  return false;
};

const simplifyVertices = (vertices: number[][]): number[][] => {
  // Remove vertices that are too close to each other
  const simplified: number[][] = [];
  const minDistance = 10; // Minimum distance between vertices
  
  for (let i = 0; i < vertices.length; i++) {
    let tooClose = false;
    for (let j = 0; j < simplified.length; j++) {
      const dx = vertices[i][0] - simplified[j][0];
      const dy = vertices[i][1] - simplified[j][1];
      if (dx * dx + dy * dy < minDistance * minDistance) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) {
      simplified.push(vertices[i]);
    }
  }
  
  return simplified;
};