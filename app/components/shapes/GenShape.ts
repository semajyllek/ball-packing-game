type Point = [number, number];
interface FlowSegment { start: Point; end: Point; controls: [Point, Point]; }
interface PathSection { upper: Point[]; lower: Point[]; }

// Bezier curve helpers
const cubicBezier = (p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point => {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;
  
  return [
    mt3 * p0[0] + 3 * mt2 * t * p1[0] + 3 * mt * t2 * p2[0] + t3 * p3[0],
    mt3 * p0[1] + 3 * mt2 * t * p1[1] + 3 * mt * t2 * p2[1] + t3 * p3[1]
  ];
};

const generateControlPoints = (start: Point, end: Point, scale: number): [Point, Point] => {
  const [x1, y1] = start;
  const [x2, y2] = end;
  
  return [
    [x1 + (x2 - x1) * 0.33, y1 + (y2 - y1) * 0.33 + (Math.random() - 0.5) * scale * 0.2],
    [x1 + (x2 - x1) * 0.66, y1 + (y2 - y1) * 0.66 + (Math.random() - 0.5) * scale * 0.2]
  ];
};

// Flow path generation
const generateFlowSegments = (width: number, height: number, numSegments: number): FlowSegment[] => {
  const scale = Math.min(width, height) * 0.4;
  const centerY = height / 2;
  let currentX = width / 2 - scale * 0.5;
  let currentY = centerY;
  
  return Array.from({ length: numSegments }, () => {
    const start: Point = [currentX, currentY];
    const nextX = currentX + (scale * (0.3 + Math.random() * 0.4));
    const nextY = centerY + (scale * (Math.random() - 0.5) * 0.6);
    const end: Point = [nextX, nextY];
    
    const controls = generateControlPoints(start, end, scale);
    currentX = nextX;
    currentY = nextY;
    
    return { start, end, controls };
  });
};

const generateFlowPoints = (segments: FlowSegment[]): Point[] => {
  const points: Point[] = [];
  
  segments.forEach(({ start, end, controls }) => {
    for (let t = 0; t <= 1; t += 0.1) {
      points.push(cubicBezier(start, controls[0], controls[1], end, t));
    }
  });
  
  return points;
};

// Path expansion
const calculateNormal = (prev: Point, next: Point): Point => {
  const dx = next[0] - prev[0];
  const dy = next[1] - prev[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  return [-dy / len, dx / len];
};

const expandFlowPath = (flowPoints: Point[], scale: number): PathSection => {
  const upperPath: Point[] = [];
  const lowerPath: Point[] = [];
  let previousNormal: Point = [0, 0];
  
  flowPoints.forEach((point, i) => {
    const next = flowPoints[Math.min(i + 1, flowPoints.length - 1)];
    const prev = flowPoints[Math.max(i - 1, 0)];
    
    let normal = calculateNormal(prev, next);
    if (i > 0) {
      normal = [
        (normal[0] + previousNormal[0]) * 0.5,
        (normal[1] + previousNormal[1]) * 0.5
      ];
    }
    previousNormal = normal;
    
    const thickness = scale * (0.15 + Math.sin(i * 0.5) * 0.05);
    upperPath.push([
      point[0] + normal[0] * thickness,
      point[1] + normal[1] * thickness
    ]);
    lowerPath.unshift([
      point[0] - normal[0] * thickness,
      point[1] - normal[1] * thickness
    ]);
  });
  
  return { upper: upperPath, lower: lowerPath };
};

// Spout selection
const selectSpouts = (paths: PathSection, numSpouts: number): Point[] => {
  const { upper, lower } = paths;
  const candidates = [
    upper[0],
    upper[Math.floor(upper.length * 0.5)],
    upper[upper.length - 1],
    lower[0],
    lower[Math.floor(lower.length * 0.5)],
    lower[lower.length - 1]
  ];
  
  const spouts: Point[] = [];
  while (spouts.length < numSpouts) {
    const candidate = candidates[Math.floor(Math.random() * candidates.length)];
    const key = `${candidate[0]},${candidate[1]}`;
    if (!spouts.some(p => `${p[0]},${p[1]}` === key)) {
      spouts.push(candidate);
    }
  }
  
  return spouts;
};

// Main shape generation function
export const generateCompoundShape = (width: number, height: number): number[][] => {
  const numSegments = 2 + Math.floor(Math.random() * 3);
  const scale = Math.min(width, height) * 0.4;
  
  const flowSegments = generateFlowSegments(width, height, numSegments);
  const flowPoints = generateFlowPoints(flowSegments);
  const paths = expandFlowPath(flowPoints, scale);
  const spouts = selectSpouts(paths, 2 + Math.floor(Math.random() * 2));
  
  return [...paths.upper, ...paths.lower, ...spouts];
};