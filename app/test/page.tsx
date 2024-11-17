// app/test/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface ProcessedFlowerData {
    vertices: [number, number][];
    bounds: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
    spoutPoints: [number, number][];
}

const TEST_OUTLINE_URL = 'https://flower-filler-bucket.s3.us-west-2.amazonaws.com/flower_dataset/processed_outlines/flower_00000001.json';

export default function TestPage() {
    const [outlineData, setOutlineData] = useState<ProcessedFlowerData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadTestFlower() {
            try {
                console.log('Fetching test outline from:', TEST_OUTLINE_URL);
                const response = await fetch(TEST_OUTLINE_URL);
                
                if (!response.ok) {
                    console.error('Response not OK:', response.status, response.statusText);
                    throw new Error(`Failed to fetch outline: ${response.statusText}`);
                }

                const data = await response.json();
                console.log('Outline loaded:', data);
                setOutlineData(data);
                
            } catch (err) {
                console.error('Error:', err);
                setError(err instanceof Error ? err.message : 'Failed to load test flower');
            } finally {
                setIsLoading(false);
            }
        }

        loadTestFlower();
    }, []);

    if (isLoading) return <div>Loading test flower...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!outlineData) return <div>No data loaded</div>;

    return (
        <svg width={600} height={400}>
            <path
                d={`M ${outlineData.vertices.map(p => p.join(',')).join(' L ')} Z`}
                fill="none"
                stroke="black"
                strokeWidth="2"
            />
        </svg>
    );
}