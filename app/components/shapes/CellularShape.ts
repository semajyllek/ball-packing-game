type Grid = number[][];

export const generateCAShape = (width: number, height: number): number[][] => {
  const gridSize = 80;
  const grid: Grid = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
  
  // Randomly choose a shape generation algorithm
  const shapeType = Math.floor(Math.random() * 5);
  
  const centerX = gridSize / 2;
  const centerY = gridSize / 2;
  
  switch(shapeType) {
    case 0: // Spiral-based shape
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const dx = (i - centerX) / centerX;
          const dy = (j - centerY) / centerY;
          const angle = Math.atan2(dy, dx);
          const dist = Math.sqrt(dx * dx + dy * dy) * 2;
          const spiral = Math.sin(dist * 8 + angle * 3);
          if (dist < 0.8 && spiral > 0) {
            grid[i][j] = 1;
          }
        }
      }
      break;

    case 1: // Organic blob
      const numBlobs = 3 + Math.floor(Math.random() * 3);
      const blobCenters = Array(numBlobs).fill(0).map(() => ({
        x: centerX + (Math.random() - 0.5) * gridSize * 0.5,
        y: centerY + (Math.random() - 0.5) * gridSize * 0.5,
        r: gridSize * (0.1 + Math.random() * 0.1)
      }));
      
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const influence = blobCenters.reduce((sum, blob) => {
            const dx = i - blob.x;
            const dy = j - blob.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return sum + Math.max(0, blob.r - dist);
          }, 0);
          grid[i][j] = influence > gridSize * 0.1 ? 1 : 0;
        }
      }
      break;

    case 2: // Star with random points
      const points = 5 + Math.floor(Math.random() * 4);
      const innerRadius = gridSize * 0.2;
      const outerRadius = gridSize * 0.4;
      
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const dx = i - centerX;
          const dy = j - centerY;
          const angle = Math.atan2(dy, dx);
          const targetRadius = innerRadius + 
            (outerRadius - innerRadius) * 
            Math.abs(Math.cos(angle * points + Math.random() * 0.2));
          const dist = Math.sqrt(dx * dx + dy * dy);
          grid[i][j] = dist < targetRadius ? 1 : 0;
        }
      }
      break;

    case 3: // Perlin noise-like shape
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const dx = (i - centerX) / centerX;
          const dy = (j - centerY) / centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const noise = Math.sin(i * 0.1) * Math.cos(j * 0.1) +
                       Math.sin(i * 0.05 + j * 0.05) * Math.cos(j * 0.05 - i * 0.05);
          grid[i][j] = dist < 0.8 && noise > 0 ? 1 : 0;
        }
      }
      break;

    case 4: // Fractal-inspired
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const dx = (i - centerX) / centerX;
          const dy = (j - centerY) / centerY;
          const dist = Math.sqrt(dx * dx + dy * dy) * 2;
          const fractal = Math.sin(dist * 10) * Math.cos(dx * 10) + 
                         Math.sin(dy * 10) * Math.cos(dist * 10);
          grid[i][j] = dist < 0.8 && fractal > 0 ? 1 : 0;
        }
      }
      break;
  }

  // Apply CA rules to make it more organic
  const generations = 3;
  for (let gen = 0; gen < generations; gen++) {
    const newGrid = grid.map(row => [...row]);
    for (let i = 1; i < gridSize - 1; i++) {
      for (let j = 1; j < gridSize - 1; j++) {
        const neighbors = countNeighbors(grid, i, j);
        if (grid[i][j] === 1 && (neighbors < 2 || neighbors > 5)) {
          newGrid[i][j] = 0;
        } else if (grid[i][j] === 0 && neighbors >= 4) {
          newGrid[i][j] = 1;
        }
      }
    }
    grid.forEach((row, i) => row.forEach((_, j) => grid[i][j] = newGrid[i][j]));
  }

  // Extract boundary points
  const points: number[][] = [];
  const visited = new Set<string>();
  let start: [number, number] | null = null;

  // Find start point
  for (let i = 0; i < gridSize && !start; i++) {
    for (let j = 0; j < gridSize && !start; j++) {
      if (grid[i][j] === 1 && isEdgeCell(grid, i, j)) {
        start = [i, j];
      }
    }
  }

  if (!start) return defaultShape();

  // Trace boundary
  const current: [number, number] = start;
  const directions: [number, number][] = [
    [-1,0], [-1,1], [0,1], [1,1], [1,0], [1,-1], [0,-1], [-1,-1]
  ];

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
        current[0] = ni;
        current[1] = nj;
        nextFound = true;
        break;
      }
    }

    if (!nextFound) break;
  } while (points.length < 200);

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