
/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { generateCompoundShape } from './shapes/GenShape';
import { triangulate } from './shapes/PolygonUtils';


interface Ball {
  id: number;  
  x: number;
  y: number;
  radius: number;
  velX: number;
  velY: number;
  color: string;
}


const BallPackingGame = () => {
  const [balls, setBalls] = useState<Ball[]>([]);
  const [fillPercentage, setFillPercentage] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [selectedVertex, setSelectedVertex] = useState(0);
  const [vertices, setVertices] = useState<number[][]>([]);
  const [triangles, setTriangles] = useState<number[][][]>([]);
  const requestRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  const generateShape = () => {
    // Define canvas dimensions
    const width = 400;
    const height = 400;
    
    try {
      // Generate compound shape by merging random geometric shapes
      const shape = generateCompoundShape(width, height);
      const newVertices = shape.outline;
      
      console.log('Generated vertices:', newVertices);
  
      // Validate vertices
      if (!newVertices || newVertices.length < 3) {
        console.log('Not enough vertices, using fallback shape');
        throw new Error('Insufficient vertices');
      }
  
      // Ensure all vertices are valid numbers
      const validVertices = newVertices.filter(v => 
        Array.isArray(v) && 
        v.length === 2 && 
        !isNaN(v[0]) && 
        !isNaN(v[1]) &&
        isFinite(v[0]) && 
        isFinite(v[1])
      );
  
      if (validVertices.length < 3) {
        console.log('Invalid vertices detected, using fallback shape');
        throw new Error('Invalid vertices');
      }
  
      // Create triangles from the vertices
      const newTriangles = triangulate(validVertices);
  
      if (!newTriangles || newTriangles.length === 0) {
        console.log('Triangulation failed, using fallback shape');
        throw new Error('Triangulation failed');
      }
  
      // Update state with new shape
      setVertices(validVertices);
      setTriangles(newTriangles);
      setSelectedVertex(0);
  
    } catch (error) {
      console.log('Error generating shape:', error);
      // Fallback to a simple hexagon
      const fallbackVertices = [
        [200, 100], // top
        [300, 150], // top right
        [300, 250], // bottom right
        [200, 300], // bottom
        [100, 250], // bottom left
        [100, 150], // top left
      ];
  
      const centerPoint = [200, 200];
      const fallbackTriangles = fallbackVertices.map((vertex, i) => {
        const nextVertex = fallbackVertices[(i + 1) % fallbackVertices.length];
        return [centerPoint, vertex, nextVertex];
      });
  
      setVertices(fallbackVertices);
      setTriangles(fallbackTriangles);
      setSelectedVertex(0);
    }
  };


  // Call generateShape on first render and when resetting
  useEffect(() => {
    generateShape();
  }, []);

  const resetGame = () => {
    setBalls([]);
    setGameWon(false);
    setFillPercentage(0);
    generateShape(); // Generate new shape on reset
  };

  // Define ball sizes and their distribution
  const ballSizes = [
    { size: 12, weight: 0.05, name: 'largest' },
    { size: 10, weight: 0.15, name: 'large' },
    { size: 8, weight: 0.35, name: 'medium' },
    { size: 6, weight: 0.20, name: 'medium-small' },
    { size: 4, weight: 0.25, name: 'very-small' }
  ];

  const getRandomBallSize = () => {
    const random = Math.random();
    let sum = 0;
    for (const ball of ballSizes) {
      sum += ball.weight;
      if (random < sum) {
        return ball;
      }
    }
    return ballSizes[ballSizes.length - 1];
  };

  const handleClick = () => {
    if (!gameWon && vertices.length > 0) {
      const ballType = getRandomBallSize();
      const dropPoint = vertices[selectedVertex];  // Use selected vertex directly
      const newBall = {
        id: balls.length,
        x: dropPoint[0],
        y: dropPoint[1],
        velX: 0,
        velY: 0,
        radius: ballType.size,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        type: ballType.name
      };
      setBalls(prev => [...prev, newBall]);
    }
  };

  const handleVertexClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVertex(index);
  };

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

  const bounceFactor = 0.5;

  // Update the fill percentage calculation to account for different ball sizes
  useEffect(() => {
    if (balls.length > 0) {
      const animate = () => {
        setBalls(prevBalls => {
          return prevBalls.map(ball => {
            let newX = ball.x + ball.velX;
            let newY = ball.y + ball.velY;
            let newVelX = ball.velX;
            let newVelY = ball.velY + 0.5;

            const { point, bounced } = findNearestEdgePoint([newX, newY]);
            newX = point[0];
            newY = point[1];

            if (bounced) {
              newVelX *= -bounceFactor;
              newVelY *= -bounceFactor;
            }

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
                  newVelX = otherBall.velX * bounceFactor;
                  newVelY = otherBall.velY * bounceFactor;
                  otherBall.velX = tmpVelX * bounceFactor;
                  otherBall.velY = tmpVelY * bounceFactor;
                }
              }
            });

            newVelX *= 0.99;
            newVelY *= 0.99;

            return {
              ...ball,
              x: newX,
              y: newY,
              velX: newVelX,
              velY: newVelY
            };
          });
        });

        // Calculate fill percentage accounting for different ball sizes
        const totalArea = triangles.reduce((acc, triangle) => {
          const [a, b, c] = triangle;
          const area = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
          return acc + area;
        }, 0);
        
        const ballArea = balls.reduce((acc, ball) => {
          return acc + (Math.PI * ball.radius * ball.radius);
        }, 0);
        
        const percentage = (ballArea / totalArea) * 100;
        setFillPercentage(Math.min(percentage, 100));

        if (percentage >= 90 && !gameWon) {
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
  }, [balls.length, gameWon, findNearestEdgePoint, triangles, balls, bounceFactor]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-slate-100 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-semibold">
            Fill Level: {fillPercentage.toFixed(1)}%
          </div>
          <button
            onClick={resetGame}
            className="p-2 rounded bg-blue-500 text-white"
          >
            <RotateCcw />
          </button>
        </div>
        
        <div
          ref={containerRef}
          onClick={handleClick}
          className="relative bg-white rounded-lg overflow-hidden cursor-pointer"
          style={{ height: '400px' }}
        >
          <svg width="400" height="400">
            {triangles.map((triangle, index) => (
              <path
                key={index}
                d={`M ${triangle[0].join(',')} L ${triangle[1].join(',')} L ${triangle[2].join(',')} Z`}
                fill={`hsl(${index * 360 / triangles.length}, 20%, 95%)`}
                stroke="#666"
                strokeWidth="2"
              />
            ))}
            
            {vertices.map((vertex, index) => (
              <circle
                key={index}
                cx={vertex[0]}
                cy={vertex[1]}
                r="8"
                fill={index === selectedVertex ? "red" : "#666"}
                stroke="white"
                strokeWidth="2"
                onClick={(e) => handleVertexClick(index, e)}
                style={{ cursor: 'pointer' }}
              />
            ))}
            
            {balls.map(ball => (
              <circle
                key={ball.id}
                cx={ball.x}
                cy={ball.y}
                r={ball.radius}
                fill={ball.color}
              />
            ))}
          </svg>
          
          {gameWon && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-white text-4xl font-bold">You Win!</div>
            </div>
          )}
        </div>
      </div>
    </div>
);}

export default BallPackingGame;