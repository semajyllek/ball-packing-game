import { useState, useEffect } from 'react';

interface FlowerPair {
  outlinePath: string;
  originalPath: string;
  index: number;
}

const listFlowerPairs = async (maxPairs = 1000): Promise<FlowerPair[]> => {
  try {
    const response = await fetch('https://flower-filler-bucket.s3.us-west-2.amazonaws.com/?list-type=2&prefix=flower_dataset/');
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Get all Keys (file paths)
    const keys = Array.from(xmlDoc.getElementsByTagName('Key')).map(node => node.textContent || '');
    
    // Filter and pair the files
    const outlineFiles = keys.filter(key => key.includes('/outlines/'));
    const originalFiles = keys.filter(key => key.includes('/originals/'));
    
    const pairs: FlowerPair[] = [];
    
    outlineFiles.forEach(outlinePath => {
      // Extract index from outline filename (assuming format flower_outline_00000123.png)
      const match = outlinePath.match(/flower_outline_(\d+)\.png$/);
      if (match) {
        const index = parseInt(match[1]);
        const originalFileName = `flower_original_${match[1]}.jpg`;
        const originalPath = originalFiles.find(path => path.endsWith(originalFileName));
        
        if (originalPath) {
          pairs.push({
            outlinePath: `https://flower-filler-bucket.s3.us-west-2.amazonaws.com/${outlinePath}`,
            originalPath: `https://flower-filler-bucket.s3.us-west-2.amazonaws.com/${originalPath}`,
            index
          });
        }
      }
    });
    
    // Sort by index
    return pairs.sort((a, b) => a.index - b.index).slice(0, maxPairs);
    
  } catch (error) {
    console.error('Error loading flower dataset:', error);
    return [];
  }
};

export function useFlowerDataset() {
  const [flowerPairs, setFlowerPairs] = useState<FlowerPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFlowerPairs() {
      try {
        setIsLoading(true);
        const pairs = await listFlowerPairs();
        setFlowerPairs(pairs);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load flower dataset');
      } finally {
        setIsLoading(false);
      }
    }

    loadFlowerPairs();
  }, []);

  return { flowerPairs, isLoading, error };
}