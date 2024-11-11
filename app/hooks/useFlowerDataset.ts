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

// Using your bucket URL from the Python code
const BUCKET_URL = 'https://flower-filler-bucket.s3.us-west-2.amazonaws.com';

export function useFlowerDataset() {
  const [flowerPairs, setFlowerPairs] = useState<FlowerPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFlowerDataset() {
      try {
        setIsLoading(true);
        console.log('Fetching from:', `${BUCKET_URL}?list-type=2&prefix=flower_dataset/`);
        
        const response = await fetch(
          `${BUCKET_URL}?list-type=2&prefix=flower_dataset/`
        );

        if (!response.ok) {
          throw new Error(`Failed to list objects: ${response.statusText}`);
        }

        const xmlText = await response.text();
        console.log('XML Response:', xmlText);
        
        const keys = await parseS3ListXML(xmlText);
        console.log('Parsed keys:', keys);

        // Filter and pair the files
        const outlineFiles = keys.filter(key => key.includes('/outlines/'));
        const originalFiles = keys.filter(key => key.includes('/originals/'));

        console.log('Found outlines:', outlineFiles);
        console.log('Found originals:', originalFiles);

        const pairs: FlowerPair[] = [];

        outlineFiles.forEach(outlinePath => {
          const match = outlinePath.match(/flower_outline_(\d+)\.png$/);
          if (match) {
            const index = parseInt(match[1]);
            const originalFileName = `flower_original_${match[1]}.jpg`;
            const originalPath = originalFiles.find(path => path.endsWith(originalFileName));

            if (originalPath) {
              pairs.push({
                outlinePath: `${BUCKET_URL}/${outlinePath}`,
                originalPath: `${BUCKET_URL}/${originalPath}`,
                index
              });
            }
          }
        });

        console.log('Created pairs:', pairs);

        // Sort by index
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