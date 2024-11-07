'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { generateCompoundShape } from './shapes/GenShape';
import { triangulate } from './shapes/PolygonUtils';

// Types
interface Ball {
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

interface BallSize {
  size: number;
  weight: number;
  name: string;
}

interface Point {
  x: number;
  y: number;
}

// Constants
const GAME_WIDTH = 600;
const GAME_HEIGHT = 600;
const VISIBLE_HEIGHT = 400;
const BOUNCE_FACTOR = 0.5;
const DAMPING = 0.99;
const WIN_PERCENTAGE = 90;
const GRAVITY = 0.5;

const BALL_SIZES: BallSize[] = [
  { size: 12, weight: 0.05, name: 'largest' },
  { size: 10, weight: 0.15, name: 'large' },
  { size: 8, weight: 0.35, name: 'medium' },
  { size: 6, weight: 0.20, name: 'medium-small' },
  { size: 4, weight: 0.25, name: 'very-small' }
];

// Utility Functions
const getRandomBallSize = (): BallSize => {
  const random = Math.random();
  let sum = 0;
  for (const ball of BALL_SIZES) {
    sum += ball.weight;
    if (random < sum) {
      return ball;
    }
  }
  return BALL_SIZES[BALL_SIZES.length - 1];
};

const generateRandomColor = (): string => 
  `hsl(${Math.random() * 360}, 70%, 50%)`;

// Component Props Interfaces
interface GameHeaderProps {
  fillPercentage: number;
  onReset: () => void;
}

interface GameShapeProps extends GameShape {
  selectedVertex: number;
  onSpoutClick: (index: number, e: React.MouseEvent) => void;
}

interface GameBallsProps {
  balls: Ball[];
}

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

const GameBalls: React.FC<GameBallsProps> = ({ balls }) => (
  <>
    {balls.map(ball => (
      <circle
        key={ball.id}
        cx={ball.x}
        cy={ball.y}
        r={ball.radius}
        fill={ball.color}
      />
    ))}
  </>
);

const WinOverlay: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className="text-white text-4xl font-bold">You Win!</div>
  </div>
);

// Game Logic Hooks
const useGameShape = () => {
  const [vertices, setVertices] = useState<number[][]>([]);
  const [spouts, setSpouts] = useState<number[][]>([]);
  const [triangles, setTriangles] = useState<number[][][]>([]);

  const generateFallbackShape = () => {
    const fallbackVertices = [
      [GAME_WIDTH/2, VISIBLE_HEIGHT/4],
      [GAME_WIDTH * 0.75, VISIBLE_HEIGHT/2],
      [GAME_WIDTH * 0.75, VISIBLE_HEIGHT * 0.75],
      [GAME_WIDTH/2, VISIBLE_HEIGHT * 0.85],
      [GAME_WIDTH * 0.25, VISIBLE_HEIGHT * 0.75],
      [GAME_WIDTH * 0.25, VISIBLE_HEIGHT/2]
    ];

    const fallbackSpouts = [
      [GAME_WIDTH/2, VISIBLE_HEIGHT/4],
      [GAME_WIDTH * 0.75, VISIBLE_HEIGHT/2]
    ];

    const centerPoint = [GAME_WIDTH/2, VISIBLE_HEIGHT/2];
    const fallbackTriangles = fallbackVertices.map((vertex, i) => {
      const nextVertex = fallbackVertices[(i + 1) % fallbackVertices.length];
      return [centerPoint, vertex, nextVertex];
    });

    return { fallbackVertices, fallbackSpouts, fallbackTriangles };
  };

  const generateShape = useCallback(() => {
    try {
      const shape = generateCompoundShape(GAME_WIDTH, GAME_HEIGHT);
      const scaleY = VISIBLE_HEIGHT / GAME_HEIGHT;
      
      const scaledVertices = shape.outline.map(v => [
        v[0],
        v[1] * scaleY
      ]);
      
      const scaledSpouts = shape.spouts.map(v => [
        v[0],
        v[1] * scaleY
      ]);

      const newTriangles = triangulate(scaledVertices);

      setVertices(scaledVertices);
      setTriangles(newTriangles);
      setSpouts(scaledSpouts);

    } catch (error) {
      console.log('Error generating shape:', error);
      const { fallbackVertices, fallbackSpouts, fallbackTriangles } = generateFallbackShape();
      
      setVertices(fallbackVertices);
      setTriangles(fallbackTriangles);
      setSpouts(fallbackSpouts);
    }
  }, []);

  return {
    vertices,
    spouts,
    triangles,
    generateShape
  };
};

const usePhysics = (vertices: number[][]) => {
  const isPointInPolygon = useCallback((point: number[]) => {
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

  const findNearestEdgePoint = useCallback((point: number[]) => {
    const nearestPoint = [...point];
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

  const updateBallPhysics = useCallback((ball: Ball, prevBalls: Ball[]): Ball => {
    let newX = ball.x + ball.velX;
    let newY = ball.y + ball.velY;
    let newVelX = ball.velX;
    let newVelY = ball.velY + GRAVITY;

    const { point, bounced } = findNearestEdgePoint([newX, newY]);
    newX = point[0];
    newY = point[1];

    if (bounced) {
      newVelX *= -BOUNCE_FACTOR;
      newVelY *= -BOUNCE_FACTOR;
    }

    // Ball collision
    prevBalls.forEach(otherBall => {
      if (ball.id !== otherBall.id) {
        const dx = newX - otherBall.x;
        const dy = newY - otherBall.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = ball.radius + otherBall.radius;
        
        if (distance < minDistance) {
          const angle = Math.atan2(dy, dx);
          newX = otherBall.x + Math.cos(angle) * minDistance;
          newY = otherBall.y + Math.sin(angle) * minDistance;
          
          const tmpVelX = newVelX;
          const tmpVelY = newVelY;
          newVelX = otherBall.velX * BOUNCE_FACTOR;
          newVelY = otherBall.velY * BOUNCE_FACTOR;
          otherBall.velX = tmpVelX * BOUNCE_FACTOR;
          otherBall.velY = tmpVelY * BOUNCE_FACTOR;
        }
      }
    });

    return {
      ...ball,
      x: newX,
      y: newY,
      velX: newVelX * DAMPING,
      velY: newVelY * DAMPING
    };
  }, [findNearestEdgePoint]);

  return { updateBallPhysics };
};

const useGameState = (triangles: number[][][]) => {
  const [balls, setBalls] = useState<Ball[]>([]);
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
    
    const ballArea = balls.reduce((acc, ball) => {
      return acc + (Math.PI * ball.radius * ball.radius);
    }, 0);
    
    return Math.min((ballArea / totalArea) * 100, 100);
  }, [triangles, balls]);

  return {
    balls,
    setBalls,
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

// Main Component
const BallPackingGame: React.FC = () => {
  const { vertices, spouts, triangles, generateShape } = useGameShape();
  const { updateBallPhysics } = usePhysics(vertices);
  const {
    balls,
    setBalls,
    fillPercentage,
    setFillPercentage,
    gameWon,
    setGameWon,
    selectedVertex,
    setSelectedVertex,
    requestRef,
    calculateFillPercentage
  } = useGameState(triangles);

  const handleClick = useCallback(() => {
    if (!gameWon && spouts.length > 0) {
      const ballType = getRandomBallSize();
      const dropPoint = spouts[selectedVertex];
      const newBall = {
        id: balls.length,
        x: dropPoint[0],
        y: dropPoint[1],
        velX: 0,
        velY: 0,
        radius: ballType.size,
        color: generateRandomColor(),
        type: ballType.name
      };
      setBalls(prev => [...prev, newBall]);
    }
  }, [gameWon, spouts, selectedVertex, balls.length, setBalls]);
  
  const handleVertexClick = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVertex(index);
  }, [setSelectedVertex]);
  
  const resetGame = useCallback(() => {
    setBalls([]);
    setGameWon(false);
    setFillPercentage(0);
    generateShape();
  }, [generateShape, setBalls, setGameWon, setFillPercentage]);
  
  // Fix the animation effect with missing dependencies
  useEffect(() => {
    if (balls.length > 0) {
      const animate = () => {
        setBalls(prevBalls => prevBalls.map(ball => updateBallPhysics(ball, prevBalls)));
        
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
    balls.length, 
    gameWon, 
    updateBallPhysics, 
    calculateFillPercentage, 
    setBalls, 
    setFillPercentage, 
    setGameWon,
    requestRef
  ]);

  // Initial Setup
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
            <GameBalls balls={balls} />
          </svg>
          
          {gameWon && <WinOverlay />}
        </div>
      </div>
    </div>
  );
};

export default BallPackingGame;
