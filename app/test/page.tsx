// app/test/page.tsx
'use client';

export default function TestPage() {
    return (
        <div>
            <div>Testing direct fetch:</div>
            <button 
                onClick={async () => {
                    const response = await fetch('https://flower-filler-bucket.s3.us-west-2.amazonaws.com/flower_dataset/processed_outlines/flower_00000001.json');
                    const data = await response.json();
                    console.log('Data:', data);
                }}
            >
                Fetch Data
            </button>
        </div>
    );
}