'use client';

import { useEffect, useState } from 'react';
import FlowerFiller from './components/FlowerFiller';
import { useFlowerDataset } from './hooks/useFlowerDataset';

export default function Home() {
  const { flowerPairs, isLoading: loadingDataset, error: datasetError } = useFlowerDataset();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  // Load current image when index changes
  useEffect(() => {
    if (!flowerPairs.length || currentIndex >= flowerPairs.length) return;

    async function loadCurrentImage() {
      try {
        setIsLoadingImage(true);
        const currentPair = flowerPairs[currentIndex];
        
        const img = new Image();
        
        const loadImage = new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = currentPair.outlinePath;
        });

        await loadImage;

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setImageData(data);
        setError(null);
      } catch (err) {
        console.error('Error loading image:', err);
        setError(err instanceof Error ? err.message : 'Failed to load image');
      } finally {
        setIsLoadingImage(false);
      }
    }

    loadCurrentImage();
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
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Try Again
          </button>
        </div>
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
            disabled={currentIndex === 0 || isLoadingImage}
          >
            Previous Flower
          </button>
          <span className="py-2">
            Flower #{flowerPairs[currentIndex]?.index ?? currentIndex}
          </span>
          <button 
            onClick={() => setCurrentIndex(prev => Math.min(flowerPairs.length - 1, prev + 1))}
            className="px-4 py-2 bg-blue-500 text-white rounded"
            disabled={currentIndex >= flowerPairs.length - 1 || isLoadingImage}
          >
            Next Flower
          </button>
        </div>
        
        {isLoadingImage ? (
          <div className="h-[600px] flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-lg">Loading flower outline...</div>
          </div>
        ) : imageData ? (
          <FlowerFiller outlineImage={imageData} />
        ) : null}
      </div>
    </main>
  );
}