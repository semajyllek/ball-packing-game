// page.tsx
'use client';

import FlowerFiller from './components/FlowerFiller';
import { useProcessedOutline } from './hooks/useProcessedOutline';

export default function Home() {
    const { outlineData, isLoading, error } = useProcessedOutline();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading flower outline...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg text-red-500">Error: {error}</div>
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

    return <FlowerFiller processedData={outlineData} />;
}