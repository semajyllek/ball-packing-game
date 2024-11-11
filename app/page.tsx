'use client';

import { useEffect, useState } from 'react';
import FlowerFiller from './components/FlowerFiller';
import { useFlowerDataset } from './hooks/useFlowerDataset';

export default function Home() {
  const { flowerPairs, isLoading: loadingDataset, error: datasetError } = useFlowerDataset();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!flowerPairs.length) return;

    const loadFlowerOutline = async () => {
      try {
        setIsLoading(true);
        
        const img = new Image();
        const currentPair = flowerPairs[currentIndex];
        
        if (!currentPair) {
          setError('Invalid flower index');
          return;
        }

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            setError('Could not get canvas context');
            return;
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          try {
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            setImageData(data);
            setError(null);
          } catch (e) {
            setError('Failed to process image data');
          }
          
          setIsLoading(false);
        };

        img.onerror = () => {
          setError(`Failed to load flower outline #${currentPair.index}`);
          setIsLoading(false);
        };

        img.src = currentPair.outlinePath;
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setIsLoading(false);
      }
    };

    loadFlowerOutline();
  }, [currentIndex, flowerPairs]);

  if (loadingDataset) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-lg">Loading flower dataset...</div>
      </div>
    );
  }

  if (datasetError || error) {
    return (
      <div className="min-h-screen p-4 flex flex-col items-center justify-center">
        <div className="text-red-500 text-center">
          <div className="mb-4">Error: {datasetError || error}</div>
          <button 
            onClick={() => setCurrentIndex(0)}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !imageData) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-lg">Loading flower outline...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between mb-4">
          <button 
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
            disabled={currentIndex === 0}
          >
            Previous Flower
          </button>
          <span className="py-2">
            Flower #{flowerPairs[currentIndex]?.index ?? currentIndex}
          </span>
          <button 
            onClick={() => setCurrentIndex(prev => Math.min(flowerPairs.length - 1, prev + 1))}
            className="px-4 py-2 bg-blue-500 text-white rounded"
            disabled={currentIndex >= flowerPairs.length - 1}
          >
            Next Flower
          </button>
        </div>
        <FlowerFiller outlineImage={imageData} />
      </div>
    </main>
  );
}