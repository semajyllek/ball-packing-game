// app/test/page.tsx
'use client';

import { useState, useEffect } from 'react';

const TEST_URL = 'https://flower-filler-bucket.s3.us-west-2.amazonaws.com/flower_dataset/processed_outlines/flower_00000001.json';

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

export default function TestPage() {
    const [outlineData, setOutlineData] = useState<ProcessedFlowerData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(TEST_URL)
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data);
                setOutlineData(data);
            })
            .catch(err => {
                console.error('Fetch error:', err);
                setError(err.message);
            });
    }, []);

    if (error) return <div>Error: {error}</div>;
    if (!outlineData) return <div>Loading...</div>;

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