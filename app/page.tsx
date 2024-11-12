// page.tsx
'use client';

import FlowerFiller from './components/FlowerFiller';
import { useProcessedOutline } from './hooks/useProcessedOutline';
import { RotateCw } from 'lucide-react';

export default function Home() {
    const { outlineData, isLoading, error, refreshOutline } = useProcessedOutline();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading flower outline...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <div className="text-lg text-red-500">Error: {error}</div>
                <button 
                    onClick={refreshOutline}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                    <RotateCw className="w-4 h-4" />
                    Try Again
                </button>
            </div>
        );
    }

    if (!outlineData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">No outline data available</div>
            </div>
        );
    }

    return (
        <div>
            <FlowerFiller processedData={outlineData} />
            <div className="flex justify-center mt-4">
                <button 
                    onClick={refreshOutline}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                    <RotateCw className="w-4 h-4" />
                    Try Another Flower
                </button>
            </div>
        </div>
    );
}