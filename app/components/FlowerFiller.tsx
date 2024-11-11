'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { Point } from './shapes/GeometryUtils';
import { triangulate } from './shapes/PolygonUtils';
import { 
    processImageOutline, 
    normalizeOutline, 
    selectSpoutPoints,
} from './shapes/FlowerOutlineProcessor';

// Types
interface Droplet {
  id: number;  
  x: number;
  y: number;
  radius: number;
  velX: number;
  velY: number;
  color: string;
  type?: string;
}

interface GameShape {
  triangles: number[][][];
  spouts: number[][];
}

interface DropletSize {
  size: number;
  weight: number;
  name: string;
}

interface GameHeaderProps {
  fillPercentage: number;
  onReset: () => void;
}

interface GameShapeProps extends GameShape {
  selectedVertex: number;
  onSpoutClick: (index: number, e: React.MouseEvent) => void;
}

interface GameDropletsProps {
  Droplets: Droplet[];
}

interface FlowerFillerProps {
  outlineImage: ImageData;
}

// Constants
const GAME_WIDTH = 600;
const VISIBLE_HEIGHT = 400;
const BOUNCE_FACTOR = 0.5;
const DAMPING = 0.99;
const WIN_PERCENTAGE = 90;
const GRAVITY = 0.5;

const Droplet_SIZES: DropletSize[] = [
  { size: 12, weight: 0.05, name: 'largest' },
  { size: 10, weight: 0.15, name: 'large' },
  { size: 8, weight: 0.35, name: 'medium' },
  { size: 6, weight: 0.20, name: 'medium-small' },
  { size: 4, weight: 0.25, name: 'very-small' }
];

// Components
const GameHeader: React.FC<GameHeaderProps> = ({ fillPercentage, onReset }) => (
  <div className="flex justify-between items-center mb-4">
    <div className="text-lg font-semibold">
      Fill Level: {fillPercentage.toFixed(1)}%
    </div>
    <button
      onClick={onReset}
      className="p-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
    >
      <RotateCcw />
    </button>
  </div>
);

const GameShape: React.FC<GameShapeProps> = ({ 
  triangles, 
  spouts, 
  selectedVertex, 
  onSpoutClick 
}) => (
  <>
    {triangles.map((triangle, index) => (
      <path
        key={index}
        d={`M ${triangle[0].join(',')} L ${triangle[1].join(',')} L ${triangle[2].join(',')} Z`}
        fill={`hsl(${index * 360 / triangles.length}, 20%, 95%)`}
        stroke="#666"
        strokeWidth="2"
      />
    ))}
    
    {spouts.map((spout, index) => (
      <circle
        key={index}
        cx={spout[0]}
        cy={spout[1]}
        r="8"
        fill={index === selectedVertex ? "red" : "#666"}
        stroke="white"
        strokeWidth="2"
        onClick={(e) => onSpoutClick(index, e)}
        style={{ cursor: 'pointer' }}
      />
    ))}
  </>
);

const GameDroplets: React.FC<GameDropletsProps> = ({ Droplets }) => (
  <>
    {Droplets.map(Droplet => (
      <circle
        key={Droplet.id}
        cx={Droplet.x}
        cy={Droplet.y}
        r={Droplet.radius}
        fill={Droplet.color}
      />
    ))}
  </>
);

const WinOverlay: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className="text-white text-4xl font-bold">You Win!</div>
  </div>
);

// Hooks
const useFlowerShape = (outlineImage: ImageData) => {
  const [vertices, setVertices] = useState<Point[]>([]);
  const [spouts, setSpouts] = useState<Point[]>([]);
  const [triangles, setTriangles] = useState<number[][][]>([]);

  const generateShape = useCallback(() => {
    try {
      const outlinePoints = processImageOutline(outlineImage);
      const { vertices: normalizedVertices } = normalizeOutline(
        outlinePoints,
        GAME_WIDTH,
        VISIBLE_HEIGHT
      );
      const newSpouts = selectSpoutPoints(normalizedVertices);
      const newTriangles = triangulate(normalizedVertices.map(p => [p[0], p[1]]));
      
      setVertices(normalizedVertices);
      setTriangles(newTriangles);
      setSpouts(newSpouts);
    } catch (error) {
      console.error('Error processing flower outline:', error);
    }
  }, [outlineImage]);

  return {
    vertices,
    spouts,
    triangles,
    generateShape
  };
};

const usePhysics = (vertices: Point[]) => {
  const isPointInPolygon = useCallback((point: Point) => {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i][0], yi = vertices[i][1];
      const xj = vertices[j][0], yj = vertices[j][1];
      
      const intersect = ((yi > point[1]) !== (yj > point[1])) &&
        (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }, [vertices]);

  const findNearestEdgePoint = useCallback((point: Point) => {
    const nearestPoint: Point = [...point];
    let moved = false;
    const step = 0.5;
    
    while (!isPointInPolygon(nearestPoint)) {
      const centerX = vertices.reduce((sum, v) => sum + v[0], 0) / vertices.length;
      const centerY = vertices.reduce((sum, v) => sum + v[1], 0) / vertices.length;
      
      const dx = centerX - nearestPoint[0];
      const dy = centerY - nearestPoint[1];
      const len = Math.sqrt(dx * dx + dy * dy);
      
      nearestPoint[0] += (dx / len) * step;
      nearestPoint[1] += (dy / len) * step;
      moved = true;
    }
    
    return { point: nearestPoint, bounced: moved };
  }, [vertices, isPointInPolygon]);

  const updateDropletPhysics = useCallback((Droplet: Droplet, prevDroplets: Droplet[]): Droplet => {
    let newX = Droplet.x + Droplet.velX;
    let newY = Droplet.y + Droplet.velY;
    let newVelX = Droplet.velX;
    let newVelY = Droplet.velY + GRAVITY;

    const { point, bounced } = findNearestEdgePoint([newX, newY]);
    newX = point[0];
    newY = point[1];

    if (bounced) {
      newVelX *= -BOUNCE_FACTOR;
      newVelY *= -BOUNCE_FACTOR;
    }

    // Droplet collision
    prevDroplets.forEach(otherDroplet => {
      if (Droplet.id !== otherDroplet.id) {
        const dx = newX - otherDroplet.x;
        const dy = newY - otherDroplet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = Droplet.radius + otherDroplet.radius;
        
        if (distance < minDistance) {
          const angle = Math.atan2(dy, dx);
          newX = otherDroplet.x + Math.cos(angle) * minDistance;
          newY = otherDroplet.y + Math.sin(angle) * minDistance;
          
          const tmpVelX = newVelX;
          const tmpVelY = newVelY;
          newVelX = otherDroplet.velX * BOUNCE_FACTOR;
          newVelY = otherDroplet.velY * BOUNCE_FACTOR;
          otherDroplet.velX = tmpVelX * BOUNCE_FACTOR;
          otherDroplet.velY = tmpVelY * BOUNCE_FACTOR;
        }
      }
    });

    return {
      ...Droplet,
      x: newX,
      y: newY,
      velX: newVelX * DAMPING,
      velY: newVelY * DAMPING
    };
  }, [findNearestEdgePoint]);

  return { updateDropletPhysics };
};

const useGameState = (triangles: number[][][]) => {
  const [Droplets, setDroplets] = useState<Droplet[]>([]);
  const [fillPercentage, setFillPercentage] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [selectedVertex, setSelectedVertex] = useState(0);
  const requestRef = useRef<number>();

  const calculateFillPercentage = useCallback(() => {
    const totalArea = triangles.reduce((acc, triangle) => {
      const [a, b, c] = triangle;
      const area = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
      return acc + area;
    }, 0);
    
    const DropletArea = Droplets.reduce((acc, Droplet) => {
      return acc + (Math.PI * Droplet.radius * Droplet.radius);
    }, 0);
    
    return Math.min((DropletArea / totalArea) * 100, 100);
  }, [triangles, Droplets]);

  return {
    Droplets,
    setDroplets,
    fillPercentage,
    setFillPercentage,
    gameWon,
    setGameWon,
    selectedVertex,
    setSelectedVertex,
    requestRef,
    calculateFillPercentage
  };
};

// Utility Functions
const getRandomDropletSize = (): DropletSize => {
  const random = Math.random();
  let sum = 0;
  for (const Droplet of Droplet_SIZES) {
    sum += Droplet.weight;
    if (random < sum) {
      return Droplet;
    }
  }
  return Droplet_SIZES[Droplet_SIZES.length - 1];
};

const generateRandomColor = (): string => 
  `hsl(${Math.random() * 360}, 70%, 50%)`;

// Main Component
const FlowerFiller: React.FC<FlowerFillerProps> = ({ outlineImage }) => {
  const { vertices, spouts, triangles, generateShape } = useFlowerShape(outlineImage);
  const { updateDropletPhysics } = usePhysics(vertices);
  const {
    Droplets,
    setDroplets,
    fillPercentage,
    setFillPercentage,
    gameWon,
    setGameWon,
    selectedVertex,
    setSelectedVertex,
    requestRef,
    calculateFillPercentage
  } = useGameState(triangles);

  const resetGame = useCallback(() => {
    setDroplets([]);
    setGameWon(false);
    setFillPercentage(0);
    generateShape();
  }, [generateShape, setDroplets, setGameWon, setFillPercentage]);

  const handleClick = useCallback(() => {
    if (!gameWon && spouts.length > 0) {
      const DropletType = getRandomDropletSize();
      const dropPoint = spouts[selectedVertex];
      const newDroplet = {
        id: Droplets.length,
        x: dropPoint[0],
        y: dropPoint[1],
        velX: 0,
        velY: 0,
        radius: DropletType.size,
        color: generateRandomColor(),
        type: DropletType.name
      };
      setDroplets(prev => [...prev, newDroplet]);
    }
  }, [gameWon, spouts, selectedVertex, Droplets.length, setDroplets]);
  
  const handleVertexClick = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVertex(index);
  }, [setSelectedVertex]);

  useEffect(() => {
    if (Droplets.length > 0) {
      const animate = () => {
        setDroplets(prevDroplets => prevDroplets.map(Droplet => updateDropletPhysics(Droplet, prevDroplets)));
        
        const percentage = calculateFillPercentage();
        setFillPercentage(percentage);
  
        if (percentage >= WIN_PERCENTAGE && !gameWon) {
          setGameWon(true);
          return;
        }
  
        requestRef.current = requestAnimationFrame(animate);
      };
  
      requestRef.current = requestAnimationFrame(animate);
      return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
      };
    }
  }, [
    Droplets.length, 
    gameWon, 
    updateDropletPhysics, 
    calculateFillPercentage, 
    setDroplets, 
    setFillPercentage, 
    setGameWon,
    requestRef
  ]);

  useEffect(() => {
    generateShape();
  }, [generateShape]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-slate-100 rounded-lg p-4">
        <GameHeader 
          fillPercentage={fillPercentage} 
          onReset={resetGame}
        />
        
        <div
          onClick={handleClick}
          className="relative bg-white rounded-lg overflow-hidden cursor-pointer"
          style={{ height: `${VISIBLE_HEIGHT}px` }}
        >
          <svg width={GAME_WIDTH} height={VISIBLE_HEIGHT} viewBox={`0 0 ${GAME_WIDTH} ${VISIBLE_HEIGHT}`}>
            <GameShape
              triangles={triangles}
              spouts={spouts}
              selectedVertex={selectedVertex}
              onSpoutClick={handleVertexClick}
            />
            <GameDroplets Droplets={Droplets} />
          </svg>
          
          {gameWon && <WinOverlay />}
        </div>
      </div>
    </div>
  );
};



export const selectSpoutPoints = (vertices: Point[], numSpouts: number = 3): Point[] => {
  const spouts: Point[] = [];
  const step = Math.floor(vertices.length / numSpouts);
  
  // Select evenly spaced points along the outline
  for (let i = 0; i < numSpouts; i++) {
      const index = (i * step) % vertices.length;
      spouts.push([vertices[index][0], vertices[index][1]]);
  }
  
  return spouts;
};

export default FlowerFiller;