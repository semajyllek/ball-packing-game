'use client';

const TEST_OUTLINE_URL = 'https://flower-filler-bucket.s3.us-west-2.amazonaws.com/flower_dataset/processed_outlines/flower_00000001.json';

export default function TestPage() {
    return (
        <div>
            <div>Testing URL:</div>
            <a href={TEST_OUTLINE_URL} target="_blank" rel="noopener noreferrer">
                Click to test URL directly
            </a>
        </div>
    );
}