import { useState, useEffect } from 'react';

interface FlowerPair {
  outlinePath: string;
  originalPath: string;
  index: number;
}

async function parseS3ListXML(text: string): Promise<string[]> {
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'text/xml');
  const keys = Array.from(xml.getElementsByTagName('Key'));
  return keys.map(key => key.textContent || '');
}

const BASE_URL = 'https://flower-filler-bucket.s3.us-west-2.amazonaws.com';

export function useFlowerDataset() {
  const [flowerPairs, setFlowerPairs] = useState<FlowerPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFlowerDataset() {
      try {
        setIsLoading(true);
        const listUrl = `${BASE_URL}?list-type=2&prefix=flower_dataset/`;
        console.log('Fetching from:', listUrl);
        
        const response = await fetch(listUrl);
        if (!response.ok) {
          console.error('List response not OK:', response.status, response.statusText);
          const text = await response.text();
          console.log('Error response:', text);
          throw new Error(`Failed to list objects: ${response.statusText}`);
        }

        const xmlText = await response.text();
        const keys = await parseS3ListXML(xmlText);
        console.log('Parsed keys:', keys);

        // Filter files
        const outlineFiles = keys.filter(key => key.includes('/outlines/'));
        const originalFiles = keys.filter(key => key.includes('/originals/'));

        console.log('Found outlines:', outlineFiles);
        console.log('Found originals:', originalFiles);

        const pairs: FlowerPair[] = [];

        outlineFiles.forEach(outlinePath => {
          const match = outlinePath.match(/flower_outline_(\d+)\.png$/);
          if (match) {
            const index = parseInt(match[1]);
            // Look for the jpg version in originals
            const originalPath = originalFiles.find(path => 
              path.includes(`flower_original_${match[1].padStart(8, '0')}.png`)
            );

            if (originalPath) {
              pairs.push({
                outlinePath: `${BASE_URL}/${outlinePath}`,
                originalPath: `${BASE_URL}/${originalPath}`,
                index
              });
            }
          }
        });

        console.log('Created pairs:', pairs);
        
        if (pairs.length === 0) {
          throw new Error('No valid file pairs found');
        }

        setFlowerPairs(pairs.sort((a, b) => a.index - b.index));
        setError(null);
      } catch (err) {
        console.error('Error loading flower dataset:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dataset');
      } finally {
        setIsLoading(false);
      }
    }

    loadFlowerDataset();
  }, []);

  return {
    flowerPairs,
    isLoading,
    error,
    currentImage: (index: number) => flowerPairs[index] || null,
    totalImages: flowerPairs.length
  };
}