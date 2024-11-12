'use client';

import React, { useState, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { Point } from './shapes/GeometryUtils';

interface ProcessedFlowerData {
    vertices: Point[];
    bounds: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
    spoutPoints: Point[];
    originalWidth: number;
    originalHeight: number;
}

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

interface FlowerFillerProps {
    processedData: ProcessedFlowerData;
}

const GAME_WIDTH = 600;
const VISIBLE_HEIGHT = 400;
const BOUNCE_FACTOR = 0.5;
const DAMPING = 0.99;
const WIN_PERCENTAGE = 90;
const GRAVITY = 0.5;

const GameHeader: React.FC<{ fillPercentage: number; onReset: () => void }> = ({ 
    fillPercentage, 
    onReset 
}) => (
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

const FlowerFiller: React.FC<FlowerFillerProps> = ({ processedData }) => {
    const [droplets, setDroplets] = useState<Droplet[]>([]);
    const [fillPercentage, setFillPercentage] = useState(0);
    const [gameWon, setGameWon] = useState(false);
    const [selectedSpout, setSelectedSpout] = useState(0);

    const { vertices, spoutPoints } = processedData;

    const resetGame = useCallback(() => {
        setDroplets([]);
        setGameWon(false);
        setFillPercentage(0);
    }, []);

    const isPointInShape = useCallback((point: Point): boolean => {
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

    const updateDropletPhysics = useCallback((droplet: Droplet, prevDroplets: Droplet[]): Droplet => {
        let newX = droplet.x + droplet.velX;
        let newY = droplet.y + droplet.velY;
        let newVelX = droplet.velX;
        let newVelY = droplet.velY + GRAVITY;

        // Check if new position would be outside shape
        if (!isPointInShape([newX, newY])) {
            // Find nearest point inside shape (simplified for example)
            const centerX = vertices.reduce((sum, v) => sum + v[0], 0) / vertices.length;
            const centerY = vertices.reduce((sum, v) => sum + v[1], 0) / vertices.length;
            
            const dx = centerX - newX;
            const dy = centerY - newY;
            const len = Math.sqrt(dx * dx + dy * dy);
            
            newVelX *= -BOUNCE_FACTOR;
            newVelY *= -BOUNCE_FACTOR;
            
            // Move slightly towards center
            newX += (dx / len);
            newY += (dy / len);
        }

        // Droplet collision
        prevDroplets.forEach(other => {
            if (droplet.id !== other.id) {
                const dx = newX - other.x;
                const dy = newY - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = droplet.radius + other.radius;
                
                if (distance < minDistance) {
                    const angle = Math.atan2(dy, dx);
                    newX = other.x + Math.cos(angle) * minDistance;
                    newY = other.y + Math.sin(angle) * minDistance;
                    
                    const tmpVelX = newVelX;
                    const tmpVelY = newVelY;
                    newVelX = other.velX * BOUNCE_FACTOR;
                    newVelY = other.velY * BOUNCE_FACTOR;
                }
            }
        });

        return {
            ...droplet,
            x: newX,
            y: newY,
            velX: newVelX * DAMPING,
            velY: newVelY * DAMPING
        };
    }, [vertices, isPointInShape]);

    const calculateFillPercentage = useCallback(() => {
        // Approximate area calculation using droplets
        const totalArea = vertices.reduce((acc, point, i) => {
            const next = vertices[(i + 1) % vertices.length];
            return acc + (point[0] * next[1] - next[0] * point[1]);
        }, 0) / 2;

        const filledArea = droplets.reduce((acc, droplet) => {
            return acc + Math.PI * droplet.radius * droplet.radius;
        }, 0);

        return Math.min((filledArea / Math.abs(totalArea)) * 100, 100);
    }, [vertices, droplets]);

    const addDroplet = useCallback(() => {
        if (gameWon) return;

        const spoutPoint = spoutPoints[selectedSpout];
        const newDroplet: Droplet = {
            id: droplets.length,
            x: spoutPoint[0],
            y: spoutPoint[1],
            radius: 5 + Math.random() * 5,
            velX: 0,
            velY: 0,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`
        };

        setDroplets(prev => [...prev, newDroplet]);
    }, [gameWon, spoutPoints, selectedSpout, droplets.length]);

    // Animation frame update
    React.useEffect(() => {
        if (droplets.length === 0) return;

        const animate = () => {
            setDroplets(prev => prev.map(droplet => updateDropletPhysics(droplet, prev)));
            const percentage = calculateFillPercentage();
            setFillPercentage(percentage);

            if (percentage >= WIN_PERCENTAGE && !gameWon) {
                setGameWon(true);
                return;
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        const requestRef = { current: requestAnimationFrame(animate) };
        return () => cancelAnimationFrame(requestRef.current);
    }, [droplets.length, gameWon, updateDropletPhysics, calculateFillPercentage]);

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <div className="bg-slate-100 rounded-lg p-4">
                <GameHeader fillPercentage={fillPercentage} onReset={resetGame} />
                
                <div
                    onClick={addDroplet}
                    className="relative bg-white rounded-lg overflow-hidden cursor-pointer"
                    style={{ height: `${VISIBLE_HEIGHT}px` }}
                >
                    <svg 
                        width={GAME_WIDTH} 
                        height={VISIBLE_HEIGHT} 
                        viewBox={`0 0 ${GAME_WIDTH} ${VISIBLE_HEIGHT}`}
                    >
                        {/* Shape outline */}
                        <path
                            d={`M ${vertices.map(p => p.join(',')).join(' L ')} Z`}
                            fill="none"
                            stroke="#666"
                            strokeWidth="2"
                        />
                        
                        {/* Spout points */}
                        {spoutPoints.map((point, i) => (
                            <circle
                                key={i}
                                cx={point[0]}
                                cy={point[1]}
                                r="8"
                                fill={i === selectedSpout ? "red" : "#666"}
                                stroke="white"
                                strokeWidth="2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSpout(i);
                                }}
                                style={{ cursor: 'pointer' }}
                            />
                        ))}
                        
                        {/* Droplets */}
                        {droplets.map(droplet => (
                            <circle
                                key={droplet.id}
                                cx={droplet.x}
                                cy={droplet.y}
                                r={droplet.radius}
                                fill={droplet.color}
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
    );
};

export default FlowerFiller;