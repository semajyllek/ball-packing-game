'use client';

import { useEffect, useState } from 'react';
import FlowerFiller from './components/FlowerFiller';

export default function Home() {
  const [imageData, setImageData] = useState<ImageData | null>(null);

  useEffect(() => {
    // Create a temporary canvas to draw and get image data
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Set canvas size
      canvas.width = 600;
      canvas.height = 600;
      
      // Draw a temporary circle as placeholder
      // (Later you'll replace this with your actual flower outline)
      ctx.strokeStyle = 'white';
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.arc(300, 300, 200, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Get the image data
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setImageData(data);
    }
  }, []);

  if (!imageData) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen p-4">
      <FlowerFiller outlineImage={imageData} />
    </main>
  );
}