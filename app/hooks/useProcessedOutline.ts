// useProcessedOutline.ts
import { useState, useEffect } from 'react';

interface ProcessedFlowerData {
    vertices: [number, number][];
    bounds: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
    spoutPoints: [number, number][];
    originalWidth: number;
    originalHeight: number;
}

const BASE_URL = 'https://flower-filler-bucket.s3.us-west-2.amazonaws.com/flower_dataset';

async function parseS3ListXML(text: string): Promise<string[]> {
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const keys = Array.from(xml.getElementsByTagName('Key'));
    return keys.map(key => key.textContent || '');
}

export function useProcessedOutline() {
    const [outlineData, setOutlineData] = useState<ProcessedFlowerData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadRandomOutline() {
            try {
                setIsLoading(true);
                
                // List all processed outlines
                const listUrl = `${BASE_URL}?list-type=2&prefix=processed_outlines/`;
                const response = await fetch(listUrl);
                if (!response.ok) {
                    throw new Error(`Failed to list objects: ${response.statusText}`);
                }

                const xmlText = await response.text();
                const keys = await parseS3ListXML(xmlText);
                
                // Filter for JSON files
                const jsonFiles = keys.filter(key => key.endsWith('.json'));
                
                if (jsonFiles.length === 0) {
                    throw new Error('No processed outlines found');
                }

                // Pick a random file
                const randomIndex = Math.floor(Math.random() * jsonFiles.length);
                const selectedKey = jsonFiles[randomIndex];
                
                // Fetch the selected outline data
                const outlineUrl = `${BASE_URL}/${selectedKey}`;
                console.log('Fetching outline from:', outlineUrl);
                
                const outlineResponse = await fetch(outlineUrl);
                if (!outlineResponse.ok) {
                    throw new Error(`Failed to fetch outline: ${outlineResponse.statusText}`);
                }

                const data = await outlineResponse.json();
                setOutlineData(data);
                setError(null);
                
            } catch (err) {
                console.error('Error loading outline:', err);
                setError(err instanceof Error ? err.message : 'Failed to load outline');
            } finally {
                setIsLoading(false);
            }
        }

        loadRandomOutline();
    }, []);

    return {
        outlineData,
        isLoading,
        error
    };
}