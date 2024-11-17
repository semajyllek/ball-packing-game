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

export default function TestPage() {
    const [data, setData] = useState<ProcessedFlowerData | null>(null);

    useEffect(() => {
        fetch('https://flower-filler-bucket.s3.us-west-2.amazonaws.com/flower_dataset/processed_outlines/flower_00000001.json')
            .then(response => response.json())
            .then(json => {
                console.log('Got data:', json);
                setData(json);
            })
            .catch(err => console.error('Fetch error:', err));
    }, []);

    if (!data) return <div>Loading...</div>;

    return (
        <svg width={600} height={400}>
            <path
                d={`M ${data.vertices.map(p => p.join(',')).join(' L ')} Z`}
                fill="none"
                stroke="black"
                strokeWidth="2"
            />
        </svg>
    );
}