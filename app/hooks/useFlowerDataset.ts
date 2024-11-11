import { useState, useEffect } from 'react';

interface FlowerPair {
  outlinePath: string;
  originalPath: string;
  index: number;
}

const S3_REGION = 'us-west-2';
const BUCKET_NAME = 'flower-filler-bucket';
const BASE_URL = `https://s3.${S3_REGION}.amazonaws.com`;

async function parseS3ListXML(text: string): Promise<string[]> {
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'text/xml');
  const keys = Array.from(xml.getElementsByTagName('Key'));
  return keys
    .map(key => key.textContent || '')
    .filter(key => key.endsWith('.png')); // Only get PNG files
}

export function useFlowerDataset() {
  const [flowerPairs, setFlowerPairs] = useState<FlowerPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFlowerDataset() {
      try {
        setIsLoading(true);
        // Use the URL format that worked before
        const listUrl = `${BASE_URL}/${BUCKET_NAME}?list-type=2&prefix=flower_dataset/`;
        console.log('Fetching from:', listUrl);
        
        const response = await fetch(listUrl);
        if (!response.ok) {
          throw new Error(`Failed to list objects: ${response.statusText}`);
        }

        const xmlText = await response.text();
        console.log('XML Response:', xmlText);
        
        const keys = await parseS3ListXML(xmlText);
        console.log('Parsed keys:', keys);

        // Filter files
        const outlineFiles = keys.filter(key => key.includes('/outlines/'));
        const originalFiles = keys.filter(key => key.includes('/originals/'));

        console.log('Found outlines:', outlineFiles);
        console.log('Found originals:', originalFiles);

        const pairs: FlowerPair[] = [];

        // Simplified pairing logic
        outlineFiles.forEach(outlinePath => {
          const match = outlinePath.match(/(\d{8})\.png$/);
          if (match) {
            const index = match[1];
            const originalPath = originalFiles.find(path => path.includes(index));
            
            if (originalPath) {
              pairs.push({
                outlinePath: `${BASE_URL}/${BUCKET_NAME}/${outlinePath}`,
                originalPath: `${BASE_URL}/${BUCKET_NAME}/${originalPath}`,
                index: parseInt(index)
              });
            }
          }
        });

        console.log('Created pairs:', pairs);

        if (pairs.length === 0) {
          throw new Error('No valid file pairs found');
        }

        // Sort by index
        const sortedPairs = pairs.sort((a, b) => a.index - b.index);
        setFlowerPairs(sortedPairs);
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