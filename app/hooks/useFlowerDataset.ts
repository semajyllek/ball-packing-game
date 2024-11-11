import { useState, useEffect } from 'react';

interface FlowerPair {
  outlinePath: string;
  originalPath: string;
  index: number;
}

// useless comment
async function parseS3ListXML(text: string): Promise<string[]> {
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'text/xml');
  const keys = Array.from(xml.getElementsByTagName('Key'));
  return keys.map(key => key.textContent || '');
}

const S3_REGION = 'us-west-2';
const BUCKET_NAME = 'flower-filler-bucket';
const BASE_URL = `https://s3.${S3_REGION}.amazonaws.com`;

export function useFlowerDataset() {
  const [flowerPairs, setFlowerPairs] = useState<FlowerPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFlowerDataset() {
      try {
        setIsLoading(true);
        // Changed URL format to match S3 list objects v2 API
        const listUrl = `${BASE_URL}/${BUCKET_NAME}?list-type=2&prefix=flower_dataset/&delimiter=/`;
        console.log('Fetching from:', listUrl);
        
        const response = await fetch(listUrl);

        if (!response.ok) {
          console.error('List response not OK:', response.status, response.statusText);
          const text = await response.text();
          console.log('Error response:', text);
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
            const originalFileName = `flower_original_${match[1]}.png`;
            const originalPath = originalFiles.find(path => path.endsWith(originalFileName));

            if (originalPath) {
              pairs.push({
                // Changed URL construction to use the proper S3 URL format
                outlinePath: `${BASE_URL}/${BUCKET_NAME}/${outlinePath}`,
                originalPath: `${BASE_URL}/${BUCKET_NAME}/${originalPath}`,
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